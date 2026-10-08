/**
 * Import lines in the project's styles entry. Lines are only ever inserted; a line already
 * there is never changed or moved.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';

export function importLine(specifier: string): string {
	return `@import '${specifier}';`;
}

export function imports(text: string, specifier: string): boolean {
	const escaped = specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`@import\\s+(?:url\\(\\s*)?['"]${escaped}['"]`).test(text);
}

export interface Insertion {
	readonly text: string;
	/** The specifiers inserted, in order. Those already imported are left out. */
	readonly added: readonly string[];
}

/**
 * Inserts the missing imports after the last `@import` at the top of the file. CSS requires
 * imports ahead of every rule, so with none there yet they go after the leading comments,
 * `@charset`, and `@layer` statements.
 */
export function insertImports(text: string, specifiers: readonly string[]): Insertion {
	const added = specifiers.filter((s, i) => !imports(text, s) && specifiers.indexOf(s) === i);
	if (added.length === 0) return { text, added };

	const lines = text === '' ? [] : text.replace(/\n$/, '').split('\n');
	const { lastImport, lastPrelude } = prelude(lines);
	const at = lastImport >= 0 ? lastImport + 1 : lastPrelude + 1;

	const block = added.map(importLine);
	const before = lines.slice(0, at);
	const after = lines.slice(at);
	// Keep a blank line between the imports and whatever was next to them that is not an import.
	if (lastImport < 0 && before.length > 0 && before.at(-1)!.trim() !== '') block.unshift('');
	if (after.length > 0 && after[0]!.trim() !== '' && !/^\s*@import\b/.test(after[0]!)) block.push('');

	return { text: `${[...before, ...block, ...after].join('\n')}\n`, added };
}

/**
 * Indices of the last `@import`, and of the last line of the leading prelude, or -1. A comment
 * with no blank line between it and the first rule describes that rule, so it is not prelude.
 */
function prelude(lines: readonly string[]): { lastImport: number; lastPrelude: number } {
	let lastImport = -1;
	let lastPrelude = -1;
	let inComment = false;

	const detached = (end: number) => end + 1 < lines.length && lines[end + 1]!.trim() === '';

	for (const [i, raw] of lines.entries()) {
		const line = raw.trim();
		if (inComment) {
			if (line.includes('*/')) {
				inComment = false;
				if (detached(i)) lastPrelude = i;
			}
			continue;
		}
		if (line === '') continue;
		if (line.startsWith('/*')) {
			if (line.includes('*/')) {
				if (detached(i)) lastPrelude = i;
			} else {
				inComment = true;
			}
			continue;
		}
		if (line.startsWith('//')) {
			if (detached(i)) lastPrelude = i;
			continue;
		}
		if (/^@import\b/.test(line)) {
			lastImport = lastPrelude = i;
			continue;
		}
		if (/^@(charset|use|forward)\b/.test(line) || /^@layer\b[^{]*;$/.test(line)) {
			lastPrelude = i;
			continue;
		}
		break;
	}
	return { lastImport, lastPrelude };
}

export async function readEntry(root: string, entry: string): Promise<string | null> {
	return readFile(join(root, entry), 'utf8').catch(() => null);
}

export async function writeEntry(root: string, entry: string, text: string): Promise<void> {
	await mkdir(dirname(join(root, entry)), { recursive: true });
	await writeFile(join(root, entry), text, 'utf8');
}

/** The specifier the entry uses for a file in the project: relative, with `./`. */
export function relativeSpecifier(entry: string, file: string): string {
	const path = relative(dirname(entry), file).split(sep).join('/');
	return path.startsWith('.') ? path : `./${path}`;
}
