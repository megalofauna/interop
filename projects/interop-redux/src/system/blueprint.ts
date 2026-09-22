/**
 * The `Blueprint` type and its validator.
 *
 * A blueprint declares which levers a component has. Values live in the config.
 */

import {
	CATEGORIES,
	PROPERTIES,
	STATE_NAMES,
	STATEFUL_CATEGORIES,
	isCategory,
	isPropertyKey,
	isStateName,
	type Category,
	type PropertyKey,
	type StateName,
} from './vocabulary.ts';

/** Which levers a scope offers, filed under the category each belongs to. */
export type LeverMap = Partial<Record<Category, readonly PropertyKey[]>>;

/** A sub-element of the component, styled from the component's token namespace. */
export interface PartSpec {
	/** Appended to the component selector, so `' > svg'` becomes `:where(button) > svg`. */
	readonly selector: string;
	readonly levers: LeverMap;
}

/**
 * An axis the component varies along: appearance, size, density.
 *
 * Each value becomes a declaration scope. Axis values do not appear in token names.
 */
export interface AxisSpec {
	/** The attribute that selects a value, e.g. `itx-variant`. */
	readonly attribute: string;
	readonly values: readonly string[];
	/** The value that the unattributed base scope already represents. */
	readonly base: string;
}

export interface Blueprint {
	/** Kebab-case. Becomes the component segment of every token name. */
	readonly name: string;
	/** The base selector. `:where()` by convention, for zero specificity. */
	readonly selector: string;
	/** False: structure file only, no theme file. `levers` must be empty. */
	readonly themeable: boolean;
	readonly levers: LeverMap;
	/** States this component responds to. */
	readonly states?: readonly StateName[];
	readonly parts?: Readonly<Record<string, PartSpec>>;
	readonly variants?: AxisSpec;
	readonly sizes?: AxisSpec;
	/** Declarations config cannot reach, such as the `border-style` `border-width` needs. */
	readonly mechanics?: readonly string[];
}

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export interface ValidationResult {
	readonly ok: boolean;
	readonly errors: readonly string[];
}

export function validate(blueprint: Blueprint): ValidationResult {
	const errors: string[] = [];
	const at = (path: string, message: string) => errors.push(`${blueprint.name ?? '<unnamed>'}.${path}: ${message}`);

	if (!blueprint.name || !KEBAB.test(blueprint.name)) {
		at('name', `must be kebab-case, got ${JSON.stringify(blueprint.name)}`);
	}
	if (!blueprint.selector?.trim()) {
		at('selector', 'must be a non-empty selector');
	}

	const seen = new Map<PropertyKey, string>();
	checkLevers(blueprint.levers, 'levers', at, seen);

	for (const [partName, part] of Object.entries(blueprint.parts ?? {})) {
		if (!KEBAB.test(partName)) at(`parts.${partName}`, 'part name must be kebab-case');
		if (!part.selector?.trim()) at(`parts.${partName}.selector`, 'must be a non-empty selector');
		// A part has its own token namespace, so it gets its own duplicate check.
		checkLevers(part.levers, `parts.${partName}.levers`, at, new Map());
	}

	if (!blueprint.themeable) {
		const partLevers = Object.values(blueprint.parts ?? {}).some((p) => countLevers(p.levers) > 0);
		if (countLevers(blueprint.levers) > 0 || partLevers) {
			at('themeable', 'is false but levers are declared — an unthemeable component has none');
		}
		if (blueprint.variants || blueprint.sizes) {
			at('themeable', 'is false but an axis is declared — axes exist only to redeclare tokens');
		}
	}

	for (const state of blueprint.states ?? []) {
		if (!isStateName(state)) {
			at('states', `unknown state ${JSON.stringify(state)}; known: ${STATE_NAMES.join(', ')}`);
		}
	}
	if ((blueprint.states?.length ?? 0) > 0 && !hasStatefulLever(blueprint)) {
		at('states', 'declared, but no paint or effect lever exists for them to vary');
	}

	checkAxis(blueprint.variants, 'variants', at);
	checkAxis(blueprint.sizes, 'sizes', at);

	return { ok: errors.length === 0, errors };
}

export function assertValid(blueprint: Blueprint): Blueprint {
	const { ok, errors } = validate(blueprint);
	if (!ok) throw new Error(`Invalid blueprint:\n  ${errors.join('\n  ')}`);
	return blueprint;
}

type Reporter = (path: string, message: string) => void;

function checkLevers(levers: LeverMap, path: string, at: Reporter, seen: Map<PropertyKey, string>): void {
	for (const [category, keys] of Object.entries(levers)) {
		if (!isCategory(category)) {
			at(path, `unknown category ${JSON.stringify(category)}; known: ${CATEGORIES.join(', ')}`);
			continue;
		}
		for (const key of keys ?? []) {
			if (!isPropertyKey(key)) {
				at(`${path}.${category}`, `unknown lever ${JSON.stringify(key)}`);
				continue;
			}
			// A miscategorized lever lands in the wrong docs table and picks up the wrong states.
			const declared = PROPERTIES[key].category;
			if (declared !== category) {
				at(`${path}.${category}`, `lever "${key}" belongs to category "${declared}"`);
			}
			const previous = seen.get(key);
			if (previous) at(`${path}.${category}`, `lever "${key}" already declared in ${previous}`);
			else seen.set(key, `${path}.${category}`);
		}
	}
}

function checkAxis(axis: AxisSpec | undefined, path: string, at: Reporter): void {
	if (!axis) return;
	if (!axis.attribute?.startsWith('itx-')) {
		at(`${path}.attribute`, `must be namespaced "itx-", got ${JSON.stringify(axis.attribute)}`);
	}
	if (!axis.values?.length) {
		at(`${path}.values`, 'must list at least one value');
		return;
	}
	for (const value of axis.values) {
		if (!KEBAB.test(value)) at(`${path}.values`, `value ${JSON.stringify(value)} must be kebab-case`);
	}
	if (!axis.values.includes(axis.base)) {
		at(`${path}.base`, `${JSON.stringify(axis.base)} is not one of: ${axis.values.join(', ')}`);
	}
	if (new Set(axis.values).size !== axis.values.length) {
		at(`${path}.values`, 'contains duplicates');
	}
}

function countLevers(levers: LeverMap): number {
	return Object.values(levers).reduce((n, keys) => n + (keys?.length ?? 0), 0);
}

function hasStatefulLever(blueprint: Blueprint): boolean {
	const maps = [blueprint.levers, ...Object.values(blueprint.parts ?? {}).map((p) => p.levers)];
	return maps.some((map) =>
		STATEFUL_CATEGORIES.some((category) => (map[category]?.length ?? 0) > 0),
	);
}
