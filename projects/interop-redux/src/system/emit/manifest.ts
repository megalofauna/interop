/**
 * manifest.json — every token with its category, type, enum members, description and value.
 *
 * Enough to build a configuration UI without reading a blueprint.
 */

import { describe } from '../vocabulary.ts';
import type { Blueprint } from '../blueprint.ts';
import type { ResolvedComponent } from '../resolve.ts';

export interface ManifestToken {
	readonly name: string;
	readonly category: string;
	readonly type: string;
	readonly syntax: string;
	readonly description: string;
	readonly element?: string;
	readonly state?: string;
	readonly enumValues?: readonly string[];
	readonly value?: string;
}

export function emitManifest(
	entries: readonly { blueprint: Blueprint; component: ResolvedComponent }[],
): string {
	const components: Record<string, unknown> = {};

	for (const { blueprint, component } of entries) {
		components[component.name] = {
			selector: component.selector,
			themeable: component.themeable,
			states: blueprint.states ?? [],
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
					...(t.state ? { state: t.state } : {}),
					...(t.enumValues ? { enumValues: t.enumValues } : {}),
					...(t.value === undefined ? {} : { value: t.value }),
				}),
			),
		};
	}

	// No timestamp or tool version: two runs must produce byte-identical output.
	return `${JSON.stringify({ schema: 1, components }, null, '\t')}\n`;
}
