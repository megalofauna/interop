/**
 * base.css — the token declarations. Reads none.
 *
 * Emitted only for a themeable component. Variants and sizes appear as extra declaration
 * scopes on the same token names.
 */

import { BANNER, comment, file, layer, rule } from './format.ts';
import type { ResolvedComponent } from '../resolve.ts';

export function emitBase(component: ResolvedComponent, source: string): string | null {
	if (!component.themeable || component.scopes.length === 0) return null;

	const blocks = component.scopes.map((scope) =>
		[
			comment(scope.label, '\t'),
			rule(
				scope.selector,
				scope.declarations.map((d) => `${d.token}: ${d.value}`),
				'\t',
			),
		].join('\n'),
	);

	return file(BANNER(source), layer('interop.theme', blocks));
}
