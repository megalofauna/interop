/**
 * structure.css — the rules that read tokens. Declares none.
 *
 * Every component gets one, themeable or not.
 */

import { BANNER, comment, file, layer, rule } from './format.ts';
import type { ResolvedComponent } from '../resolve.ts';

export function emitStructure(component: ResolvedComponent, source: string): string {
	const blocks = component.rules.map((r) =>
		[comment(r.label, '\t'), rule(r.selector, r.declarations, '\t')].join('\n'),
	);

	return file(BANNER(source), layer('interop.structure', blocks));
}
