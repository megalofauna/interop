/**
 * base.css — the token declarations. Reads none.
 *
 * Emitted only for a themeable component. Variants and sizes appear as extra declaration
 * scopes on the same token names, each in its scope's layer.
 */

import { layerName } from '../vocabulary.ts';
import { BANNER, comment, file, layer, rule } from './format.ts';
import type { ResolvedComponent, ResolvedScope } from '../resolve.ts';

export function emitBase(component: ResolvedComponent, source: string): string | null {
	if (!component.themeable || component.scopes.length === 0) return null;

	const byLayer = new Map<string, string[]>();
	for (const scope of component.scopes) {
		const name = layerName(scope.scope, 'base');
		byLayer.set(name, [...(byLayer.get(name) ?? []), block(scope)]);
	}
	const layers = [...byLayer].map(([name, blocks]) => layer(name, blocks));

	return file(BANNER(source), layers.join('\n\n'));
}

function block(scope: ResolvedScope): string {
	return [
		comment(scope.label, '\t'),
		rule(
			scope.selector,
			scope.declarations.map((d) => `${d.token}: ${d.value}`),
			'\t',
		),
	].join('\n');
}
