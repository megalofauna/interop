/** Text shaping shared by the emitters. */

export const BANNER = (source: string): string =>
	['/*', ' * Generated file. Do not edit by hand.', ` * Source: ${source}`, ' */'].join('\n');

export function rule(selector: string, declarations: readonly string[], indent = ''): string {
	const body = declarations.map((d) => `${indent}\t${d};`).join('\n');
	return `${indent}${selector} {\n${body}\n${indent}}`;
}

export function layer(name: string, blocks: readonly string[]): string {
	const body = blocks.join('\n\n');
	return `@layer ${name} {\n${body}\n}`;
}

export function comment(text: string, indent = ''): string {
	return `${indent}/* ${text} */`;
}

/** Sections joined by a blank line, with one trailing newline. */
export function file(...sections: readonly string[]): string {
	return `${sections.filter(Boolean).join('\n\n')}\n`;
}
