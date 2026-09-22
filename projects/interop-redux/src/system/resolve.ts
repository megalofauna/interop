/** blueprint + config -> the model every emitter reads. */

import {
	PROPERTIES,
	STATEFUL_CATEGORIES,
	isUniversal,
	selectorForState,
	syntaxFor,
	tokenName,
	type Category,
	type PropertyKey,
	type StateName,
	type ValueType,
} from './vocabulary.ts';
import { assertValid, type AxisSpec, type Blueprint, type LeverMap } from './blueprint.ts';

/**
 * The consumer-facing config. Plain data only: a CLI has to read a value, change it, and
 * write it back.
 */
export interface ComponentConfig {
	/** Categories to drop. Their tokens are not emitted. */
	readonly disabledCategories?: readonly Category[];
	/** Token name -> value, for the base scope. */
	readonly values?: Readonly<Record<string, string>>;
	/** Axis value -> the tokens it redeclares. */
	readonly variants?: Readonly<Record<string, Readonly<Record<string, string>>>>;
	readonly sizes?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

export interface Config {
	readonly components: Readonly<Record<string, ComponentConfig>>;
}

export interface ResolvedToken {
	readonly name: string;
	readonly component: string;
	readonly part?: string;
	readonly property: PropertyKey;
	readonly category: Category;
	readonly state?: StateName;
	readonly type: ValueType;
	readonly syntax: string;
	readonly enumValues?: readonly string[];
	/** Absent for state tokens, which are optional. */
	readonly value?: string;
}

/** A declaration site in theme.css. */
export interface ResolvedScope {
	readonly label: string;
	readonly selector: string;
	readonly declarations: readonly { readonly token: string; readonly value: string }[];
}

/** A consumption site in structure.css. */
export interface ResolvedRule {
	readonly label: string;
	readonly selector: string;
	readonly declarations: readonly string[];
}

export interface ResolvedComponent {
	readonly name: string;
	readonly selector: string;
	readonly themeable: boolean;
	readonly tokens: readonly ResolvedToken[];
	readonly scopes: readonly ResolvedScope[];
	readonly rules: readonly ResolvedRule[];
	/** Base tokens the config gave no value. Fatal. */
	readonly missing: readonly string[];
}

interface Scope {
	readonly part?: string;
	readonly selector: string;
	readonly levers: LeverMap;
}

export function resolve(blueprint: Blueprint, config: ComponentConfig = {}): ResolvedComponent {
	assertValid(blueprint);

	const disabled = new Set<Category>(config.disabledCategories ?? []);
	const values = config.values ?? {};

	const scopes: Scope[] = [
		{ selector: blueprint.selector, levers: blueprint.levers },
		...Object.entries(blueprint.parts ?? {}).map(([part, spec]) => ({
			part,
			selector: `${blueprint.selector}${spec.selector}`,
			levers: spec.levers,
		})),
	];

	const tokens: ResolvedToken[] = [];
	const rules: ResolvedRule[] = [];
	const missing: string[] = [];
	const states = blueprint.states ?? [];

	for (const scope of scopes) {
		const active = activeLevers(scope.levers, disabled);
		if (active.length === 0 && !(scope.part === undefined && blueprint.mechanics?.length)) continue;

		const baseDeclarations: string[] = [];

		for (const property of active) {
			const def = PROPERTIES[property];
			const name = tokenName({ component: blueprint.name, part: scope.part, property });
			const value = values[name];

			// An undeclared base token emits `var(--x)` with nothing behind it: transparent for
			// background-color, inherited for color. The same omission fails differently per
			// property, so it is caught here.
			if (value === undefined) missing.push(name);

			tokens.push({
				name,
				component: blueprint.name,
				...(scope.part ? { part: scope.part } : {}),
				property,
				category: def.category,
				type: def.type,
				syntax: syntaxFor(def),
				...(def.values ? { enumValues: def.values } : {}),
				...(value === undefined ? {} : { value }),
			});

			baseDeclarations.push(...def.apply(`var(${name})`));
		}

		if (scope.part === undefined && blueprint.mechanics?.length) {
			baseDeclarations.push(...blueprint.mechanics);
		}

		if (baseDeclarations.length > 0) {
			rules.push({
				label: scope.part ? `part: ${scope.part}` : 'base',
				selector: scope.selector,
				declarations: baseDeclarations,
			});
		}

		for (const state of states) {
			const stateful = active.filter((p) => STATEFUL_CATEGORIES.includes(PROPERTIES[p].category));
			if (stateful.length === 0) continue;

			const declarations: string[] = [];
			for (const property of stateful) {
				const def = PROPERTIES[property];
				const base = tokenName({ component: blueprint.name, part: scope.part, property });
				const name = tokenName({ component: blueprint.name, part: scope.part, property, state });

				tokens.push({
					name,
					component: blueprint.name,
					...(scope.part ? { part: scope.part } : {}),
					property,
					category: def.category,
					state,
					type: def.type,
					syntax: syntaxFor(def),
					...(def.values ? { enumValues: def.values } : {}),
					...(values[name] === undefined ? {} : { value: values[name] }),
				});

				// An unset state token falls through to the base value.
				declarations.push(...def.apply(`var(${name}, var(${base}))`));
			}

			// The state selector goes on the component: the part repaints when the component
			// is hovered.
			const partSuffix = scope.part ? scope.selector.slice(blueprint.selector.length) : '';
			rules.push({
				label: scope.part ? `part: ${scope.part} — ${state}` : state,
				selector: `${blueprint.selector}${selectorForState(state)}${partSuffix}`,
				declarations,
			});
		}
	}

	const declared = new Set(tokens.map((t) => t.name));
	const themeScopes: ResolvedScope[] = [];

	const baseDeclarations = Object.entries(values)
		.filter(([token]) => declared.has(token))
		.map(([token, value]) => ({ token, value }));
	if (baseDeclarations.length > 0) {
		themeScopes.push({ label: 'base', selector: blueprint.selector, declarations: baseDeclarations });
	}

	themeScopes.push(...axisScopes(blueprint, blueprint.variants, config.variants, declared, 'variant'));
	themeScopes.push(...axisScopes(blueprint, blueprint.sizes, config.sizes, declared, 'size'));

	return {
		name: blueprint.name,
		selector: blueprint.selector,
		themeable: blueprint.themeable,
		tokens,
		scopes: themeScopes,
		rules,
		missing,
	};
}

function activeLevers(levers: LeverMap, disabled: ReadonlySet<Category>): PropertyKey[] {
	return Object.entries(levers)
		.filter(([category]) => !disabled.has(category as Category))
		.flatMap(([, keys]) => [...(keys ?? [])]);
}

function axisScopes(
	blueprint: Blueprint,
	axis: AxisSpec | undefined,
	configured: Readonly<Record<string, Readonly<Record<string, string>>>> | undefined,
	declared: ReadonlySet<string>,
	kind: string,
): ResolvedScope[] {
	if (!axis) return [];

	return axis.values
		// The base value is already the unattributed scope.
		.filter((value) => value !== axis.base)
		.map((value) => {
			const declarations = Object.entries(configured?.[value] ?? {})
				.filter(([token]) => declared.has(token))
				.map(([token, v]) => ({ token, value: v }));
			return {
				label: `${kind}: ${value}`,
				// Appended rather than woven in, so no selector parsing is needed. The extra
				// specificity puts the axis scope above the base.
				selector: `${blueprint.selector}[${axis.attribute}="${value}"]`,
				declarations,
			};
		})
		.filter((scope) => scope.declarations.length > 0);
}

export { isUniversal };
