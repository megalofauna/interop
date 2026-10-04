/** blueprint + config -> the model every emitter reads. */

import {
	AXES,
	PROPERTIES,
	isUniversal,
	selectorForState,
	syntaxFor,
	tokenName,
	type Axis,
	type AxisName,
	type Category,
	type ScopeName,
	type PropertyKey,
	type StateName,
	type ValueType,
} from './vocabulary.ts';
import { KEBAB, assertValid, type Blueprint } from './blueprint.ts';

/**
 * The consumer-facing config. Plain data only: a CLI has to read a value, change it, and
 * write it back.
 */
export interface ComponentConfig {
	/** Categories to drop. Their tokens are not emitted. */
	readonly disabledCategories?: readonly Category[];
	/** Token name -> value, for the base scope. */
	readonly values?: Readonly<Record<string, string>>;
	/**
	 * Variant -> the tokens it redeclares. Every variant named here is an exception; the
	 * unattributed element takes the base values.
	 */
	readonly variants?: AxisValues;
	/**
	 * Size -> the tokens it redeclares. Every size the blueprint lists needs an entry except
	 * `base`, which takes the base values.
	 */
	readonly sizes?: AxisValues;
}

export type AxisValues = Readonly<Record<string, Readonly<Record<string, string>>>>;

export interface Config {
	readonly components: Readonly<Record<string, ComponentConfig>>;
}

export interface ResolvedToken {
	readonly name: string;
	readonly component: string;
	readonly element?: string;
	readonly property: PropertyKey;
	readonly category: Category;
	readonly state?: StateName;
	readonly type: ValueType;
	readonly syntax: string;
	readonly enumValues?: readonly string[];
	/** Absent for state tokens, which are optional. */
	readonly value?: string;
}

/** A declaration site in base.css. */
export interface ResolvedScope {
	/** The outer cascade layer the scope declares into. */
	readonly scope: ScopeName;
	readonly label: string;
	readonly selector: string;
	readonly declarations: readonly { readonly token: string; readonly value: string }[];
}

/** An axis the component varies along, with its values. */
export interface ResolvedAxis {
	readonly name: AxisName;
	readonly attribute: string;
	readonly values: readonly string[];
	/** The value that takes the base values. Absent: the unattributed element is the only default. */
	readonly default?: string;
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
	readonly axes: readonly ResolvedAxis[];
	readonly scopes: readonly ResolvedScope[];
	readonly rules: readonly ResolvedRule[];
	/** Base tokens, and blueprint sizes, the config gave no value. Fatal. */
	readonly missing: readonly string[];
}

interface Scope {
	readonly element?: string;
	readonly selector: string;
	readonly properties: Partial<Record<Category, readonly PropertyKey[]>>;
}

export function resolve(blueprint: Blueprint, config: ComponentConfig = {}): ResolvedComponent {
	assertValid(blueprint);
	assertConfigValid(blueprint, config);

	const disabled = new Set<Category>(config.disabledCategories ?? []);
	const values = config.values ?? {};
	const prerequisites = blueprint.prerequisites ?? [];

	const scopes: Scope[] = [
		{
			selector: blueprint.selector,
			properties: { ...blueprint.properties, ...(blueprint.cursor ? { cursor: blueprint.cursor } : {}) },
		},
		...Object.entries(blueprint.elements ?? {}).map(([element, spec]) => ({
			element,
			selector: `${blueprint.selector}${spec.selector}`,
			properties: spec.properties,
		})),
	];

	const tokens: ResolvedToken[] = [];
	const rules: ResolvedRule[] = [];
	const missing: string[] = [];
	const states = blueprint.states ?? [];

	for (const scope of scopes) {
		const active = activeLevers(scope.properties, disabled);
		const scopePrerequisites = scope.element === undefined ? prerequisites : [];
		if (active.length === 0 && scopePrerequisites.length === 0) continue;

		// One copy of each, after the prerequisites and ahead of the declarations that need it.
		// A required declaration whose property an active lever sets is left to the lever.
		const set = new Set(active.flatMap((property) => PROPERTIES[property].apply('').map(propertyOf)));
		const required = new Set(
			active
				.flatMap((property) => PROPERTIES[property].requires ?? [])
				.filter((declaration) => !set.has(propertyOf(declaration))),
		);
		const baseDeclarations: string[] = [...scopePrerequisites, ...required];

		for (const property of active) {
			const def = PROPERTIES[property];
			const name = tokenName({ component: blueprint.name, element: scope.element, property });
			const value = values[name];

			// An undeclared base token emits `var(--x)` with nothing behind it: transparent for
			// background-color, inherited for color. The same omission fails differently per
			// property, so it is caught here.
			if (value === undefined) missing.push(name);

			tokens.push({
				name,
				component: blueprint.name,
				...(scope.element ? { element: scope.element } : {}),
				property,
				category: def.category,
				type: def.type,
				syntax: syntaxFor(def),
				...(def.values ? { enumValues: def.values } : {}),
				...(value === undefined ? {} : { value }),
			});

			baseDeclarations.push(...def.apply(`var(${name})`));
		}

		rules.push({
			label: scope.element ? `element: ${scope.element}` : 'base',
			selector: scope.selector,
			declarations: baseDeclarations,
		});

		for (const state of states) {
			const stateful = active.filter((p) => PROPERTIES[p].stateful);
			if (stateful.length === 0) continue;

			const declarations: string[] = [];
			for (const property of stateful) {
				const def = PROPERTIES[property];
				const base = tokenName({ component: blueprint.name, element: scope.element, property });
				const name = tokenName({ component: blueprint.name, element: scope.element, property, state });

				tokens.push({
					name,
					component: blueprint.name,
					...(scope.element ? { element: scope.element } : {}),
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

			// The state selector goes on the component: the element repaints when the component
			// is hovered.
			const elementSuffix = scope.element ? scope.selector.slice(blueprint.selector.length) : '';
			rules.push({
				label: scope.element ? `element: ${scope.element} — ${state}` : state,
				selector: `${blueprint.selector}${selectorForState(state)}${elementSuffix}`,
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
		themeScopes.push({
			scope: 'default',
			label: 'base',
			selector: blueprint.selector,
			declarations: baseDeclarations,
		});
	}

	const axes: ResolvedAxis[] = [];
	for (const axis of AXES) {
		const configured = config[axis.configKey];
		const scoped = axisScopes(blueprint, axis, configured, declared);
		themeScopes.push(...scoped.map((s) => s.scope));

		if (axis.source === 'config') {
			if (scoped.length === 0) continue;
			axes.push({ name: axis.name, attribute: axis.attribute, values: scoped.map((s) => s.value) });
			continue;
		}

		const listed = blueprint[axis.configKey] ?? [];
		if (listed.length === 0) continue;
		// Without an entry, the attribute matches no scope and the element silently takes the
		// base values.
		for (const value of listed) {
			if (value !== axis.default && configured?.[value] === undefined) {
				missing.push(`${axis.configKey}.${value}`);
			}
		}
		axes.push({ name: axis.name, attribute: axis.attribute, values: listed, default: axis.default });
	}

	return {
		name: blueprint.name,
		selector: blueprint.selector,
		themeable: blueprint.themeable,
		tokens,
		axes,
		scopes: themeScopes,
		rules,
		missing,
	};
}

/**
 * Checks the config's axis values against the blueprint. A value that redeclares no token
 * this component has is dropped by `axisScopes`. The config may name it for a category this
 * component disabled.
 */
function assertConfigValid(blueprint: Blueprint, config: ComponentConfig): void {
	const errors: string[] = [];

	for (const axis of AXES) {
		const configured = config[axis.configKey];
		if (!configured) continue;
		if (!blueprint.themeable) {
			errors.push(
				`${axis.configKey}: the component is not themeable, so it has no tokens to redeclare`,
			);
			continue;
		}
		for (const value of Object.keys(configured)) {
			if (!KEBAB.test(value)) {
				errors.push(`${axis.configKey}: value ${JSON.stringify(value)} must be kebab-case`);
			}
		}
		if (axis.source !== 'blueprint') continue;

		const listed = blueprint[axis.configKey];
		if (!listed?.length) {
			errors.push(`${axis.configKey}: the blueprint lists none, so the component has no ${axis.name} axis`);
			continue;
		}
		for (const value of Object.keys(configured)) {
			if (value === axis.default) {
				errors.push(
					`${axis.configKey}.${value}: "${value}" takes the base values; set them under \`values\``,
				);
			} else if (!listed.includes(value)) {
				errors.push(
					`${axis.configKey}.${value}: not a ${axis.name} the blueprint lists (${listed.join(', ')})`,
				);
			}
		}
	}

	if (errors.length > 0) {
		throw new Error(`Invalid config for ${blueprint.name}:\n  ${errors.join('\n  ')}`);
	}
}

function activeLevers(
	properties: Partial<Record<Category, readonly PropertyKey[]>>,
	disabled: ReadonlySet<Category>,
): PropertyKey[] {
	return Object.entries(properties)
		.filter(([category]) => !disabled.has(category as Category))
		.flatMap(([, keys]) => [...(keys ?? [])]);
}

/** `border-style: solid` -> `border-style`. */
function propertyOf(declaration: string): string {
	return declaration.slice(0, declaration.indexOf(':')).trim();
}

function axisScopes(
	blueprint: Blueprint,
	axis: Axis,
	configured: AxisValues | undefined,
	declared: ReadonlySet<string>,
): { readonly value: string; readonly scope: ResolvedScope }[] {
	return Object.entries(configured ?? {})
		.map(([value, tokens]) => ({
			value,
			scope: {
				scope: axis.name,
				label: `${axis.name}: ${value}`,
				// Appended rather than woven in, so no selector parsing is needed. The extra
				// specificity puts the axis scope above the base.
				selector: `${blueprint.selector}[${axis.attribute}="${value}"]`,
				declarations: Object.entries(tokens)
					.filter(([token]) => declared.has(token))
					.map(([token, v]) => ({ token, value: v })),
			},
		}))
		.filter(({ scope }) => scope.declarations.length > 0);
}

export { isUniversal };
