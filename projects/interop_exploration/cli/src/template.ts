/**
 * The template starter: the markup a component's CSS needs to match, and nothing else.
 *
 * Components are CSS-only, so a template is markup the consumer writes. Its contract is the
 * host, its identity attribute, the elements under it, and the attributes that select axes and
 * modifiers. Angular and plain HTML get the same markup.
 */

import type { ManifestComponent } from './manifest.ts';

/** Elements with no content, written without children. */
const VOID = new Set(['area', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

export function renderTemplate(name: string, component: ManifestComponent): string {
	const { host } = component;
	const notes = [`${name} template starter. Written by \`interop template ${name}\`. This file is yours.`];

	if (host.kind === 'custom-element') notes.push(`${host.attribute} also works as an attribute on any element.`);
	if (host.kind === 'any-element') notes.push(`${host.attribute} goes on the element it decorates. The div stands in for it.`);

	const options = [
		...Object.entries(component.axes).map(([axis, { attribute, values }]) => `${axis}: ${attribute}="${values.join(' | ')}"`),
		...Object.entries(component.modifiers).map(
			([modifier, { selector }]) => `${modifier}: ${asMarkup(selector.slice(component.selector.length))}`,
		),
	];
	if (options.length > 0) notes.push('', 'Options on the host:', ...options.map((o) => `  ${o}`));

	const tag = host.element ?? 'div';
	// A custom element is its own identity; the attribute form is for other elements.
	const open = host.kind === 'custom-element' ? `<${tag}>` : `<${tag} ${host.attribute}>`;

	const children = Object.values(component.elements).map((element) => {
		const markup = VOID.has(element.tag)
			? `<${element.tag} ${element.attribute}>`
			: `<${element.tag} ${element.attribute}></${element.tag}>`;
		return `\t${element.optional ? `<!-- ${markup} -->` : markup}`;
	});

	const body = VOID.has(tag) ? [open] : children.length === 0 ? [`${open}</${tag}>`] : [open, ...children, `</${tag}>`];
	const comment = ['<!--', ...notes.map((line) => (line === '' ? '' : `\t${line}`)), '-->'];

	return `${[...comment, ...body].join('\n')}\n`;
}

/** `[a="v"]` as `a="v"`, `[a]` as `a`. Anything else stays a selector. */
function asMarkup(suffix: string): string {
	const match = /^\[([a-z][a-z0-9-]*)(?:="([^"]*)")?\]$/.exec(suffix);
	if (!match) return suffix;
	return match[2] === undefined ? match[1]! : `${match[1]}="${match[2]}"`;
}
