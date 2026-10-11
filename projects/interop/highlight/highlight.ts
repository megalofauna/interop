import type { HighlighterCore, LanguageRegistration } from 'shiki/core';

export interface LanguageDefinition {
	/** The name shown and read for the language, e.g. `TypeScript`. */
	readonly label: string;
	/** Loads the grammar, e.g. `() => import('shiki/langs/typescript.mjs')`. */
	readonly load: () => Promise<{ default: LanguageRegistration[] }>;
}

const languages = new Map<string, LanguageDefinition>();
const warned = new Set<string>();
let highlighter: Promise<HighlighterCore> | undefined;
/** Registered key → the name Shiki knows the loaded grammar by. */
const loaded = new Map<string, Promise<string>>();

/**
 * Makes languages available to `highlightCode()`. A key is the name in `class="language-…"`; two
 * keys with the same definition are aliases. A later definition with the same key replaces the
 * earlier one. Each grammar loads the first time code uses it.
 */
export function registerLanguages(definitions: Record<string, LanguageDefinition>): void {
	for (const [name, definition] of Object.entries(definitions)) {
		languages.set(name, definition);
		loaded.delete(name);
	}
}

export function getLanguage(name: string): LanguageDefinition | undefined {
	return languages.get(name);
}

declare const ngDevMode: unknown;

/**
 * Colors the text of a `<code class="language-…">` element with the CSS Custom Highlight API,
 * as `::highlight(itx-code-<role>)`. The text and its nodes stay as they are. Returns a function
 * that removes the colors.
 */
export async function highlightCode(code: Element): Promise<() => void> {
	const name = Array.from(code.classList)
		.find((value) => value.startsWith('language-'))
		?.slice('language-'.length);
	if (!name || typeof CSS === 'undefined' || !CSS.highlights) return () => {};

	const language = languages.get(name);
	if (!language) {
		if (typeof ngDevMode !== 'undefined' && ngDevMode && !warned.has(name)) {
			warned.add(name);
			console.warn(
				`Interop · code-language\nNo language is registered as "${name}".\nThe code shows without colors.\n` +
					`Register it: registerLanguages({ ${name}: { label: '…', load: () => import('shiki/langs/….mjs') } }).`,
				code,
			);
		}
		return () => {};
	}

	const nodes: [Text, number][] = [];
	let length = 0;
	const walker = code.ownerDocument.createTreeWalker(code, NodeFilter.SHOW_TEXT);
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		nodes.push([node as Text, length]);
		length += (node as Text).data.length;
	}
	const source = nodes.map(([node]) => node.data).join('');

	let tokens;
	try {
		const shiki = await (highlighter ??= createHighlighter());
		const lang = await (loaded.get(name) ?? loaded.set(name, load(shiki, language)).get(name)!);
		tokens = shiki.codeToTokens(source, { lang, theme: 'itx' }).tokens.flat();
	} catch (error) {
		loaded.delete(name);
		(globalThis.reportError ?? console.error)(error);
		return () => {};
	}

	// The code changed while the grammar loaded, so these tokens describe text that is gone.
	if (nodes.some(([node]) => !code.contains(node)) || code.textContent !== source) return () => {};

	const added: [Highlight, Range][] = [];
	let index = 0;
	for (const token of tokens) {
		const role = /^var\(--itx-code-token-(.+)\)$/.exec(token.color ?? '')?.[1];
		if (!role) continue;
		// Tokens arrive in order and never cross a line, so the node only moves forward.
		while (index < nodes.length - 1 && nodes[index + 1][1] <= token.offset) index++;
		const [node, start] = nodes[index];
		const range = new Range();
		range.setStart(node, token.offset - start);
		range.setEnd(node, token.offset - start + token.content.length);
		const highlightName = `itx-code-${role}`;
		const highlight = CSS.highlights.get(highlightName) ?? new Highlight();
		CSS.highlights.set(highlightName, highlight);
		highlight.add(range);
		added.push([highlight, range]);
	}
	return () => added.forEach(([highlight, range]) => highlight.delete(range));
}

/** Loads a grammar and its embedded grammars. The last one is the language itself. */
async function load(shiki: HighlighterCore, language: LanguageDefinition): Promise<string> {
	const grammar = (await language.load()).default;
	await shiki.loadLanguage(...grammar);
	return grammar[grammar.length - 1].name;
}

async function createHighlighter(): Promise<HighlighterCore> {
	const [{ createHighlighterCore, createCssVariablesTheme }, { createJavaScriptRegexEngine }] = await Promise.all([
		import('shiki/core'),
		import('shiki/engine/javascript'),
	]);
	return createHighlighterCore({
		themes: [createCssVariablesTheme({ name: 'itx', variablePrefix: '--itx-code-' })],
		langs: [],
		engine: createJavaScriptRegexEngine(),
	});
}
