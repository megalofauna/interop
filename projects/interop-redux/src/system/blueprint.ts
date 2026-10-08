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

/**
 * Where a component goes in markup. The host selector is built from this.
 *
 * - `{ element: 'button' }` — an HTML element serves: `:where(button[interop-button])`.
 * - `'custom-element'` — no HTML element is obvious, or any block element would do:
 *   `:where(interop-toolbar-section, [interop-toolbar-section])`. The attribute form goes on
 *   whatever element the consumer picks.
 * - `'any-element'` — the attribute decorates an element that may already belong to another
 *   component, so there is no custom element form: `:where([interop-badge])`.
 */
export type HostSpec = { readonly element: string } | 'custom-element' | 'any-element';

/** A sub-element of the component, styled from the component's token namespace. */
export interface ElementSpec {
	/** The attribute that marks the element, such as `interop-icon`. */
	readonly attribute: string;
	/** Where the element sits under the host. Default `child`. */
	readonly relation?: 'child' | 'descendant';
	/** The tag the template starter writes. Not part of the selector. Default `span`. */
	readonly tag?: string;
	/** The component works without it. The template starter writes it commented out. */
	readonly optional?: boolean;
	/** Declarations the element needs that config cannot reach. They lead its base rule. */
	readonly prerequisites?: readonly string[];
	readonly properties: PropertyMap;
}

/**
 * A variation one component offers, selected by an attribute on the component.
 *
 * It can carry fixed declarations, emitted into structure.css, and token values, which the
 * config gives under `modifiers.<name>`. Either may be absent.
 */
export interface ModifierSpec {
	/** Appended to the component selector, so `'[interop-badge=""]'` matches an empty value. */
	readonly selector: string;
	/** Fixed declarations on the component while the modifier applies. */
	readonly prerequisites?: readonly string[];
	/** Fixed declarations on an element while the modifier applies, by element name. */
	readonly elements?: Readonly<Record<string, readonly string[]>>;
}

export interface Blueprint {
	/** Kebab-case. Becomes the component segment of every token name. */
	readonly name: string;
	readonly host: HostSpec;
	/** The identity attribute. Default `interop-<name>`. */
	readonly attribute?: string;
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
	readonly modifiers?: Readonly<Record<string, ModifierSpec>>;
}

export const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** The custom element for a `custom-element` host. */
export function customElementName(blueprint: Blueprint): string {
	return `interop-${blueprint.name}`;
}

export function identityAttribute(blueprint: Blueprint): string {
	return blueprint.attribute ?? `interop-${blueprint.name}`;
}

/** Zero specificity, so a consumer's single class overrides it. */
export function hostSelector(blueprint: Blueprint): string {
	const attribute = identityAttribute(blueprint);
	if (blueprint.host === 'custom-element') return `:where(${customElementName(blueprint)}, [${attribute}])`;
	if (blueprint.host === 'any-element') return `:where([${attribute}])`;
	return `:where(${blueprint.host.element}[${attribute}])`;
}

/** Appended to the host selector. */
export function elementSelector(element: ElementSpec): string {
	return `${element.relation === 'descendant' ? ' ' : ' > '}:where([${element.attribute}])`;
}

/** Identity is `interop-`; `itx-` is configuration, and the utilities that read as it. */
const ATTRIBUTE = /^(interop|itx)-[a-z0-9]+(-[a-z0-9]+)*$/;
const TAG = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

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
	checkHost(blueprint, at);

	const seen = new Map<PropertyKey, string>();
	checkProperties(blueprint.properties, 'properties', at, seen);
	if (blueprint.cursor) checkProperties({ cursor: blueprint.cursor }, '', at, seen, true);

	for (const [elementName, element] of Object.entries(blueprint.elements ?? {})) {
		if (!KEBAB.test(elementName)) at(`elements.${elementName}`, 'element name must be kebab-case');
		if (!ATTRIBUTE.test(element.attribute ?? '')) {
			at(`elements.${elementName}.attribute`, `must start interop- or itx-, got ${JSON.stringify(element.attribute)}`);
		}
		if (element.tag !== undefined && !TAG.test(element.tag)) {
			at(`elements.${elementName}.tag`, `${JSON.stringify(element.tag)} is not an element name`);
		}
		// An element has its own token namespace, so it gets its own duplicate check.
		checkProperties(element.properties, `elements.${elementName}.properties`, at, new Map());
	}

	for (const [modifierName, modifier] of Object.entries(blueprint.modifiers ?? {})) {
		const path = `modifiers.${modifierName}`;
		if (!KEBAB.test(modifierName)) at(path, 'modifier name must be kebab-case');
		if (!modifier.selector?.trim()) at(`${path}.selector`, 'must be a non-empty selector');
		for (const elementName of Object.keys(modifier.elements ?? {})) {
			if (!blueprint.elements?.[elementName]) {
				at(`${path}.elements.${elementName}`, 'names no element of this component');
			}
		}
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

function checkHost(blueprint: Blueprint, at: Reporter): void {
	const { host } = blueprint;
	const kinds = host === 'custom-element' || host === 'any-element';
	if (!kinds && !(typeof host === 'object' && host !== null && TAG.test(host.element ?? ''))) {
		at('host', `must be { element: '<tag>' }, 'custom-element' or 'any-element', got ${JSON.stringify(host)}`);
	}
	if (blueprint.attribute !== undefined && !ATTRIBUTE.test(blueprint.attribute)) {
		at('attribute', `must start interop- or itx-, got ${JSON.stringify(blueprint.attribute)}`);
	}
	if (host === 'custom-element' && blueprint.attribute !== undefined && blueprint.attribute !== customElementName(blueprint)) {
		at('attribute', `a custom-element host uses ${customElementName(blueprint)} for both forms`);
	}
	// A custom element is inline until something says otherwise.
	if (host === 'custom-element') {
		const display =
			(blueprint.properties.layout ?? []).includes('display') ||
			(blueprint.prerequisites ?? []).some((d) => /^\s*display\s*:/.test(d));
		if (!display) at('host', 'a custom-element host needs a display lever or a display prerequisite');
	}
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
