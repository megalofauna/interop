/** docs.md — the lever tables, grouped by category. */

import { CATEGORIES, describe } from '../vocabulary.ts';
import type { ResolvedComponent } from '../resolve.ts';

export function emitDocs(component: ResolvedComponent): string {
	const lines: string[] = [`# ${component.name}`, ''];

	lines.push(
		`Selector \`${component.selector}\`. ${component.themeable ? 'Themeable.' : 'Not themeable — structure only, no theme file.'}`,
		'',
	);

	if (component.axes.length > 0) {
		lines.push(
			'## Axes',
			'',
			'An element carrying none of these attributes takes the base values. So does one carrying a value marked default. Every other value is an exception.',
			'',
			'| Axis | Attribute | Values |',
			'| --- | --- | --- |',
		);
		for (const axis of component.axes) {
			lines.push(
				`| ${axis.name} | \`${axis.attribute}\` | ${axis.values.map((v) => (v === axis.default ? `\`${v}\` (default)` : `\`${v}\``)).join(', ')} |`,
			);
		}
		lines.push('');
	}

	const stateful = new Set(component.tokens.filter((t) => t.state).map((t) => t.name.replace(/-(?:hover|focus-visible|active|disabled)$/, '')));
	const base = component.tokens.filter((t) => t.state === undefined);

	if (base.length > 0) {
		lines.push('## Levers', '');
		for (const category of CATEGORIES) {
			const rows = base.filter((t) => t.category === category);
			if (rows.length === 0) continue;
			// The column separates `--itx-button-text-color` from `--itx-button-icon-text-color`.
			const hasElements = rows.some((t) => t.element);
			lines.push(
				`### ${category}`,
				'',
				`| Token |${hasElements ? ' Element |' : ''} Type | Value | States | Description |`,
				`| --- |${hasElements ? ' --- |' : ''} --- | --- | --- | --- |`,
			);
			for (const token of rows) {
				const type = token.enumValues ? token.enumValues.map((v) => `\`${v}\``).join(' \\| ') : token.type;
				lines.push(
					`| \`${token.name}\` |${hasElements ? ` ${token.element ?? '—'} |` : ''} ${type} | \`${token.value ?? '—'}\` | ${stateful.has(token.name) ? 'yes' : '—'} | ${describe(token.property)} |`,
				);
			}
			lines.push('');
		}
	}

	if (component.tokens.some((t) => t.state)) {
		lines.push(
			'## States',
			'',
			`Stateful levers take a suffixed token — \`${component.tokens.find((t) => t.state)!.name}\`, and so on. Leave one unset and the state falls through to the base value; there is nothing to restate.`,
			'',
		);
	}

	return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}
