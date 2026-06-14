/*
 * Slim, dual-theme shiki highlighter for the Protocol docs.
 *
 * interop's ShikiHighlighter wraps shiki's full `createHighlighter` — it can
 * lazy-load any language on demand, which is great for a general library but
 * pulls the oniguruma wasm engine and the whole bundled-language registry
 * (~1.39 MB + 334 grammar chunks). Docs need a known, small language set, so we
 * trade generality for size: `shiki/core` + the JS regex engine (no wasm) +
 * only the grammars below + two themes.
 *
 * ── Dual theme without JS ────────────────────────────────────────────────────
 * We render through interop's token model (HighlightedCode), not shiki's HTML,
 * so shiki's CSS-variable dual-theme output doesn't apply. Instead each token's
 * color becomes a CSS `light-dark(lightHex, darkHex)` value. The renderer binds
 * it straight to an inline style, so it resolves against the page's
 * `color-scheme` — the same mechanism the protocol theme already uses. No theme
 * class to toggle, no JS on scheme change.
 *
 * Tokenization is theme-independent (grammar-driven), so tokenizing the same
 * source under both themes yields two token streams that align 1:1 — we zip
 * them per token. Unknown languages fall back to plain text rather than throwing.
 */
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import {
	fromShikiTokens,
	type Highlighter,
	type HighlightedCode,
	type HighlightToken,
} from "interop";

import githubDark from "shiki/themes/github-dark.mjs";
import githubLight from "shiki/themes/github-light.mjs";
import bash from "shiki/langs/bash.mjs";
import css from "shiki/langs/css.mjs";
import html from "shiki/langs/html.mjs";
import javascript from "shiki/langs/javascript.mjs";
import json from "shiki/langs/json.mjs";
import markdown from "shiki/langs/markdown.mjs";
import scss from "shiki/langs/scss.mjs";
import typescript from "shiki/langs/typescript.mjs";

const LIGHT = "github-light";
const DARK = "github-dark";
const LANGS = [bash, css, html, javascript, json, markdown, scss, typescript];

/** Pair two per-theme colors into one scheme-aware value. */
function pairColor(light?: string, dark?: string): string | undefined {
	if (light && dark) {
		return light === dark ? light : `light-dark(${light}, ${dark})`;
	}
	return light ?? dark;
}

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
			themes: [githubLight, githubDark],
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
		const light = fromShikiTokens(core.codeToTokens(code, { lang, theme: LIGHT }).tokens);
		const dark = fromShikiTokens(core.codeToTokens(code, { lang, theme: DARK }).tokens);

		const merged: HighlightedCode = light.map((line, i) => ({
			tokens: line.tokens.map((token, j): HighlightToken => {
				const out: HighlightToken = { text: token.text };
				const color = pairColor(token.color, dark[i]?.tokens[j]?.color);
				if (color) out.color = color;
				if (token.fontStyle) out.fontStyle = token.fontStyle;
				return out;
			}),
		}));

		this.cache.set(key, merged);
		return merged;
	}
}
