import type { HighlightedCode, HighlightToken } from "../interop-code-renderer";

export interface ShikiThemedToken {
	content: string;
	color?: string;
	fontStyle?: number;
}

/**
 * Converts Shiki's `codeToTokens()` output into the `HighlightedCode` shape
 * expected by `InteropCodeRenderer`'s `[tokens]` input.
 *
 * @example
 * ```ts
 * import { codeToTokens } from 'shiki';
 * import { fromShikiTokens } from 'interop';
 *
 * const { tokens } = await codeToTokens(source, { lang: 'ts', theme: 'github-dark' });
 * const highlighted = fromShikiTokens(tokens);
 * ```
 */
export function fromShikiTokens(
	shikiLines: readonly (readonly ShikiThemedToken[])[],
): HighlightedCode {
	return shikiLines.map((line) => ({
		tokens: line.map((token): HighlightToken => {
			const t: HighlightToken = { text: token.content };
			if (token.color) t.color = token.color;
			if (token.fontStyle != null && token.fontStyle > 0) {
				const mapped = (token.fontStyle & 0b011) as 0 | 1 | 2 | 3;
				if (mapped > 0) t.fontStyle = mapped;
			}
			return t;
		}),
	}));
}
