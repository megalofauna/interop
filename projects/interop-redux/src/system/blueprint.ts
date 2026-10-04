/**
 * The `Blueprint` type and its validator.
 *
 * A blueprint declares which levers a component has. Values live in the config.
 */

import {
	AXES,
	CATEGORIES,
	PROPERTIES,
	STATE_NAMES,
	isCategory,
	isPropertyKey,
	isStateName,
	type Category,
	type PropertyKey,
	type StateName,
} from './vocabulary.ts';

/** Which levers a scope offers, filed under the category each belongs to. */
export type PropertyMap = Partial<Record<Exclude<Category, 'cursor'>, readonly PropertyKey[]>>;

/** A sub-element of the component, styled from the component's token namespace. */
export interface ElementSpec {
	/** Appended to the component selector, so `' > svg'` becomes `:where(button) > svg`. */
	readonly selector: string;
	readonly properties: PropertyMap;
}

export interface Blueprint {
	/** Kebab-case. Becomes the component segment of every token name. */
	readonly name: string;
	/** The base selector. `:where()` by convention, for zero specificity. */
	readonly selector: string;
	/** False: structure file only, no base file. `properties` must be empty. */
	readonly themeable: boolean;
	/** Declarations this component needs that config cannot reach. They lead the base rule. */
	readonly prerequisites?: readonly string[];
	/**
	 * The values of the size axis, `base` among them. Absent: the component is not sizable.
	 * `base` takes the base values.
	 */
	readonly sizes?: readonly string[];
	/** States this component responds to. */
	readonly states?: readonly StateName[];
	/** The `cursor` category. Read on the component, under its states. Requires `states`. */
	readonly cursor?: readonly PropertyKey[];
	readonly properties: PropertyMap;
	readonly elements?: Readonly<Record<string, ElementSpec>>;
}

export const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export interface ValidationResult {
	readonly ok: boolean;
	readonly errors: readonly string[];
}

const SIZE = AXES.find((axis) => axis.name === 'size')!;

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
	checkProperties(blueprint.properties, 'properties', at, seen);
	if (blueprint.cursor) checkProperties({ cursor: blueprint.cursor }, '', at, seen, true);

	for (const [elementName, element] of Object.entries(blueprint.elements ?? {})) {
		if (!KEBAB.test(elementName)) at(`elements.${elementName}`, 'element name must be kebab-case');
		if (!element.selector?.trim()) at(`elements.${elementName}.selector`, 'must be a non-empty selector');
		// An element has its own token namespace, so it gets its own duplicate check.
		checkProperties(element.properties, `elements.${elementName}.properties`, at, new Map());
	}

	if (!blueprint.themeable) {
		const elementLevers = Object.values(blueprint.elements ?? {}).some((e) => countLevers(e.properties) > 0);
		if (countLevers(blueprint.properties) > 0 || (blueprint.cursor?.length ?? 0) > 0 || elementLevers) {
			at('themeable', 'is false but levers are declared — an unthemeable component has none');
		}
		if (blueprint.sizes) {
			at('sizes', 'declared, but an unthemeable component has no tokens for a size to redeclare');
		}
	}

	if (blueprint.sizes) {
		const sizes = new Set<string>();
		for (const size of blueprint.sizes) {
			if (!KEBAB.test(size)) at('sizes', `${JSON.stringify(size)} must be kebab-case`);
			if (sizes.has(size)) at('sizes', `${JSON.stringify(size)} is listed twice`);
			sizes.add(size);
		}
		if (blueprint.sizes.length > 0 && !sizes.has(SIZE.default)) {
			at('sizes', `must include "${SIZE.default}", the size that takes the base values`);
		}
	}

	for (const state of blueprint.states ?? []) {
		if (!isStateName(state)) {
			at('states', `unknown state ${JSON.stringify(state)}; known: ${STATE_NAMES.join(', ')}`);
		}
	}
	const stateless = (blueprint.states?.length ?? 0) === 0;
	if (!stateless && !hasStatefulLever(blueprint)) {
		at('states', 'declared, but no stateful lever exists for them to vary');
	}
	// A cursor tells the user the component responds. A component with no states does not.
	if (blueprint.cursor && stateless) {
		at('cursor', 'declared on a component with no states');
	}

	return { ok: errors.length === 0, errors };
}

export function assertValid(blueprint: Blueprint): Blueprint {
	const { ok, errors } = validate(blueprint);
	if (!ok) throw new Error(`Invalid blueprint:\n  ${errors.join('\n  ')}`);
	return blueprint;
}

type Reporter = (path: string, message: string) => void;

function checkProperties(
	properties: Partial<Record<Category, readonly PropertyKey[]>>,
	path: string,
	at: Reporter,
	seen: Map<PropertyKey, string>,
	allowCursor = false,
): void {
	const prefix = path ? `${path}.` : '';
	for (const [category, keys] of Object.entries(properties)) {
		if (!isCategory(category)) {
			at(path, `unknown category ${JSON.stringify(category)}; known: ${CATEGORIES.join(', ')}`);
			continue;
		}
		if (category === 'cursor' && !allowCursor) {
			at(`${prefix}cursor`, 'belongs in the top-level `cursor` field');
			continue;
		}
		for (const key of keys ?? []) {
			if (!isPropertyKey(key)) {
				at(`${prefix}${category}`, `unknown lever ${JSON.stringify(key)}`);
				continue;
			}
			// A miscategorized lever lands in the wrong docs table and picks up the wrong states.
			const declared = PROPERTIES[key].category;
			if (declared !== category) {
				at(`${prefix}${category}`, `lever "${key}" belongs to category "${declared}"`);
			}
			const previous = seen.get(key);
			if (previous) at(`${prefix}${category}`, `lever "${key}" already declared in ${previous}`);
			else seen.set(key, `${prefix}${category}`);
		}
	}
}

function countLevers(properties: PropertyMap): number {
	return Object.values(properties).reduce((n, keys) => n + (keys?.length ?? 0), 0);
}

function hasStatefulLever(blueprint: Blueprint): boolean {
	const lists = [
		...Object.values(blueprint.properties),
		blueprint.cursor,
		...Object.values(blueprint.elements ?? {}).flatMap((e) => Object.values(e.properties)),
	];
	return lists.some((keys) => (keys ?? []).some((key) => isPropertyKey(key) && PROPERTIES[key].stateful));
}
