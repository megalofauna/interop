import { InjectionToken, type Provider, type Type } from "@angular/core";
import type { HighlightedCode } from "../components/interop-code-renderer/interop-code-renderer";

/**
 * Highlighter — pluggable syntax-highlighting contract.
 *
 * Implementations may be synchronous (cached / pre-warmed) or asynchronous
 * (cold-start grammar loading). Components consuming this token must handle
 * both shapes — return value is `HighlightedCode | Promise<HighlightedCode>`.
 *
 * The contract is provider-agnostic: ship a Shiki adapter, a Prism adapter, a
 * fixture-based adapter for tests, or a no-op adapter for SSR. The `interop`
 * library itself imports no highlighter implementation — consumers opt in via
 * `provideHighlighter()` at app bootstrap.
 */
export interface Highlighter {
	highlight(
		code: string,
		language: string,
	): HighlightedCode | Promise<HighlightedCode>;
}

/**
 * DI token for the active highlighter implementation. Components inject this
 * with `{ optional: true }`. When absent, components render their plain-text
 * fallback (projected content or null tokens).
 */
export const INTEROP_HIGHLIGHTER = new InjectionToken<Highlighter>(
	"INTEROP_HIGHLIGHTER",
);

/**
 * Register a highlighter implementation at app bootstrap.
 *
 * @example Class
 * ```ts
 * import { provideHighlighter } from 'interop';
 * import { ShikiHighlighter } from 'interop/highlighters/shiki';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [provideHighlighter(ShikiHighlighter)],
 * });
 * ```
 *
 * @example Instance
 * ```ts
 * provideHighlighter(new ShikiHighlighter({ theme: 'github-dark' }));
 * ```
 */
export function provideHighlighter(
	impl: Highlighter | Type<Highlighter>,
): Provider {
	return typeof impl === "function"
		? { provide: INTEROP_HIGHLIGHTER, useClass: impl as Type<Highlighter> }
		: { provide: INTEROP_HIGHLIGHTER, useValue: impl };
}
