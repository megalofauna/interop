/**
 * `@property` registrations.
 *
 * Excluded: state tokens, universal (`*`) tokens.
 */

import * as vocabulary from '../vocabulary.ts';
import { BANNER, file } from './format.ts';
import type { ResolvedComponent } from '../resolve.ts';

export function emitProperties(component: ResolvedComponent, source: string): string | null {
	// A registered token always has a valid value, so `var(--x-hover, var(--x))` would never
	// reach its fallback. Universal tokens gain nothing from registration.
	const registrable = component.tokens.filter(
		(t) => t.state === undefined && !vocabulary.isUniversal(vocabulary.PROPERTIES[t.property]),
	);
	if (registrable.length === 0) return null;

	const blocks = registrable.map((token) => {
		const initial = vocabulary.initialValueFor(vocabulary.PROPERTIES[token.property]);
		// inherits: true — part tokens are declared on the component and read on the part.
		const lines = [`@property ${token.name} {`, `\tsyntax: "${token.syntax}";`, '\tinherits: true;'];
		if (initial !== undefined) lines.push(`\tinitial-value: ${initial};`);
		lines.push('}');
		return lines.join('\n');
	});

	return file(BANNER(source), blocks.join('\n\n'));
}
