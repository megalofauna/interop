/*
 * Slim, fine-grained shiki highlighter for the Protocol docs.
 *
 * interop's ShikiHighlighter wraps shiki's full `createHighlighter` — it can
 * lazy-load any language on demand, which is great for a general library but
 * pulls the oniguruma wasm engine and the whole bundled-language registry
 * (~1.39 MB + 334 grammar chunks here).
 *
 * Docs need a known, small language set, so we trade generality for size:
 *   - `shiki/core` + the JavaScript regex engine (no wasm).
 *   - Only the grammars below are imported, so only they are bundled.
 *   - One theme.
 *
 * This is the interop `Highlighter` contract doing exactly what it was designed
 * for — swap the adapter, keep the component. Unknown languages fall back to
 * plain text rather than throwing.
 */
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { fromShikiTokens, type Highlighter, type HighlightedCode } from "interop";

import githubDark from "shiki/themes/github-dark.mjs";
import bash from "shiki/langs/bash.mjs";
import css from "shiki/langs/css.mjs";
import html from "shiki/langs/html.mjs";
import javascript from "shiki/langs/javascript.mjs";
import json from "shiki/langs/json.mjs";
import markdown from "shiki/langs/markdown.mjs";
import scss from "shiki/langs/scss.mjs";
import typescript from "shiki/langs/typescript.mjs";

const THEME = "github-dark";
const LANGS = [bash, css, html, javascript, json, markdown, scss, typescript];

export class ProtocolHighlighter implements Highlighter {
	private core: HighlighterCore | null = null;
	private corePromise: Promise<HighlighterCore> | null = null;
	private readonly cache = new Map<string, HighlightedCode>();

	highlight(
		code: string,
		language: string,
	): HighlightedCode | Promise<HighlightedCode> {
		const key = `${language}\n${code}`;
		const cached = this.cache.get(key);
		if (cached) return cached;

		if (this.core) return this.tokenize(this.core, code, language, key);
		return this.ensureCore().then((core) =>
			this.tokenize(core, code, language, key),
		);
	}

	private ensureCore(): Promise<HighlighterCore> {
		this.corePromise ??= createHighlighterCore({
			themes: [githubDark],
			langs: LANGS,
			engine: createJavaScriptRegexEngine(),
		}).then((core) => (this.core = core));
		return this.corePromise;
	}

	private tokenize(
		core: HighlighterCore,
		code: string,
		language: string,
		key: string,
	): HighlightedCode {
		const lang = core.getLoadedLanguages().includes(language)
			? language
			: "text";
		const { tokens } = core.codeToTokens(code, { lang, theme: THEME });
		const result = fromShikiTokens(tokens);
		this.cache.set(key, result);
		return result;
	}
}
