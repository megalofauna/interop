/**
 * manifest.json — every token with its category, type, enum members, description and value,
 * and every scope with the tokens it declares.
 *
 * Enough to build a configuration UI without reading a blueprint.
 */

import { CATEGORIES, describe, layerName, tokenName } from '../vocabulary.ts';
import { customElementName, identityAttribute, type Blueprint } from '../blueprint.ts';
import type { ResolvedComponent } from '../resolve.ts';

export interface ManifestToken {
	readonly name: string;
	readonly category: string;
	readonly type: string;
	readonly syntax: string;
	readonly description: string;
	readonly element?: string;
	readonly state?: string;
	/** The base token a state token falls back to. Present on state tokens only. */
	readonly base?: string;
	readonly enumValues?: readonly string[];
	readonly value?: string;
}

/** Where the component goes in markup. `element` is absent for an `any-element` host. */
export interface ManifestHost {
	readonly kind: 'element' | 'custom-element' | 'any-element';
	readonly element?: string;
	readonly attribute: string;
}

export interface ManifestElement {
	readonly attribute: string;
	readonly relation: 'child' | 'descendant';
	readonly tag: string;
	readonly optional: boolean;
}

function host(blueprint: Blueprint): ManifestHost {
	const attribute = identityAttribute(blueprint);
	if (blueprint.host === 'any-element') return { kind: 'any-element', attribute };
	if (blueprint.host === 'custom-element') {
		return { kind: 'custom-element', element: customElementName(blueprint), attribute };
	}
	return { kind: 'element', element: blueprint.host.element, attribute };
}

/** A declaration site in base.css, and the layer a consumer's theme repeats it in. */
export interface ManifestScope {
	readonly scope: string;
	readonly name?: string;
	readonly selector: string;
	readonly themeLayer: string;
	readonly declarations: readonly { readonly token: string; readonly value: string }[];
}

export interface ManifestEntry {
	readonly blueprint: Blueprint;
	readonly component: ResolvedComponent;
	/** The files the build wrote for the component, in import order. */
	readonly stylesheets: readonly string[];
}

export function emitManifest(entries: readonly ManifestEntry[]): string {
	const components: Record<string, unknown> = {};

	for (const { blueprint, component, stylesheets } of entries) {
		components[component.name] = {
			selector: component.selector,
			themeable: component.themeable,
			stylesheets,
			host: host(blueprint),
			elements: Object.fromEntries(
				Object.entries(blueprint.elements ?? {}).map(([name, e]): [string, ManifestElement] => [
					name,
					{ attribute: e.attribute, relation: e.relation ?? 'child', tag: e.tag ?? 'span', optional: e.optional ?? false },
				]),
			),
			states: blueprint.states ?? [],
			modifiers: Object.fromEntries(component.modifiers.map((m) => [m.name, { selector: m.selector }])),
			axes: Object.fromEntries(
				component.axes.map((axis) => [
					axis.name,
					{
						attribute: axis.attribute,
						values: axis.values,
						...(axis.default ? { default: axis.default } : {}),
					},
				]),
			),
			tokens: component.tokens.map(
				(t): ManifestToken => ({
					name: t.name,
					category: t.category,
					type: t.type,
					syntax: t.syntax,
					description: describe(t.property),
					...(t.element ? { element: t.element } : {}),
					...(t.state
						? {
								state: t.state,
								base: tokenName({ component: t.component, element: t.element, property: t.property }),
							}
						: {}),
					...(t.enumValues ? { enumValues: t.enumValues } : {}),
					...(t.value === undefined ? {} : { value: t.value }),
				}),
			),
			scopes: component.scopes.map(
				(s): ManifestScope => ({
					scope: s.scope,
					...(s.name ? { name: s.name } : {}),
					selector: s.selector,
					themeLayer: layerName(s.scope, 'theme'),
					declarations: s.declarations,
				}),
			),
		};
	}

	// No timestamp or tool version: two runs must produce byte-identical output.
	return `${JSON.stringify({ schema: 1, categories: CATEGORIES, components }, null, '\t')}\n`;
}
