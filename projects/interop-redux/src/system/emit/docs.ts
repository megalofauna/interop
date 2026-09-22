/** docs.md — the lever tables, grouped by category. */

import { CATEGORIES, describe } from '../vocabulary.ts';
import type { Blueprint } from '../blueprint.ts';
import type { ResolvedComponent } from '../resolve.ts';

export function emitDocs(blueprint: Blueprint, component: ResolvedComponent): string {
	const lines: string[] = [`# ${component.name}`, ''];

	lines.push(
		`Selector \`${component.selector}\`. ${component.themeable ? 'Themeable.' : 'Not themeable — structure only, no theme file.'}`,
		'',
	);

	const axes = [
		blueprint.variants ? (['variant', blueprint.variants] as const) : null,
		blueprint.sizes ? (['size', blueprint.sizes] as const) : null,
	].filter((a) => a !== null);

	if (axes.length > 0) {
		lines.push('## Axes', '', '| Axis | Attribute | Values | Base |', '| --- | --- | --- | --- |');
		for (const [name, axis] of axes) {
			lines.push(
				`| ${name} | \`${axis.attribute}\` | ${axis.values.map((v) => `\`${v}\``).join(', ')} | \`${axis.base}\` |`,
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
			const hasParts = rows.some((t) => t.part);
			lines.push(
				`### ${category}`,
				'',
				`| Token |${hasParts ? ' Part |' : ''} Type | Value | States | Description |`,
				`| --- |${hasParts ? ' --- |' : ''} --- | --- | --- | --- |`,
			);
			for (const token of rows) {
				const type = token.enumValues ? token.enumValues.map((v) => `\`${v}\``).join(' \\| ') : token.type;
				lines.push(
					`| \`${token.name}\` |${hasParts ? ` ${token.part ?? '—'} |` : ''} ${type} | \`${token.value ?? '—'}\` | ${stateful.has(token.name) ? 'yes' : '—'} | ${describe(token.property)} |`,
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
