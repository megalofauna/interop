import { Injectable } from "@angular/core";
import { codeToTokens } from "shiki";
import { fromShikiTokens, type HighlightedCode } from 'interop';

/**
 * Thin wrapper around Shiki + the InteropCodeBlock adapter.
 *
 * Calls Shiki's `codeToTokens()` and maps the result into the
 * `HighlightedCode` shape that `InteropCodeBlock`'s `[tokens]` input expects.
 */
@Injectable({ providedIn: "root" })
export class HighlightService {
	async highlight(code: string, lang: string): Promise<HighlightedCode> {
		const { tokens } = await codeToTokens(code, {
			lang: lang as any,
			theme: "github-dark",
		});
		return fromShikiTokens(tokens);
	}
}
