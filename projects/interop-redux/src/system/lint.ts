/**
 * Checks run against the emitted CSS text, not the model that produced it:
 *
 * - every token theme.css declares is read by structure.css
 * - every base token structure.css reads is declared by theme.css
 * - no declared value is a CSS-wide keyword
 */

// Anchored on a block or statement boundary rather than a line start, so the checks do not
// quietly depend on how the emitter happens to wrap its output.
const DECLARED = /(?:^|[{;])\s*(--itx-[a-z0-9-]+)\s*:/g;
const CONSUMED = /var\(\s*(--itx-[a-z0-9-]+)/g;
const DECLARATION = /(?:^|[{;])\s*(--itx-[a-z0-9-]+)\s*:\s*([^;]+);/g;

// On a custom property these apply to the token, not to the property it drives. `initial`
// is absent: it is the way to say "no value, take the fallback".
const TRAP_KEYWORDS = new Set(['inherit', 'unset', 'revert', 'revert-layer']);

export interface LintIssue {
	readonly kind: 'orphan-declaration' | 'undeclared-base-token' | 'css-wide-keyword';
	readonly token: string;
	readonly detail: string;
}

export function lintRoundTrip(
	component: string,
	structureCss: string,
	themeCss: string | null,
	stateTokens: ReadonlySet<string>,
): LintIssue[] {
	const declared = new Set(matches(themeCss ?? '', DECLARED));
	const consumed = new Set(matches(structureCss, CONSUMED));
	const issues: LintIssue[] = [];

	for (const token of declared) {
		if (!consumed.has(token)) {
			issues.push({
				kind: 'orphan-declaration',
				token,
				detail: `${component}: theme.css declares ${token}, but structure.css never reads it`,
			});
		}
	}

	for (const token of consumed) {
		// Upstream aliases appear inside theme.css values; this component does not declare them.
		if (!token.startsWith(`--itx-${component}-`)) continue;
		// An undeclared state token falls through to the base.
		if (stateTokens.has(token)) continue;
		if (!declared.has(token)) {
			issues.push({
				kind: 'undeclared-base-token',
				token,
				detail: `${component}: structure.css reads ${token}, but nothing declares it`,
			});
		}
	}

	for (const [, token, raw] of (themeCss ?? '').matchAll(DECLARATION)) {
		const value = raw!.trim();
		if (!TRAP_KEYWORDS.has(value)) continue;
		issues.push({
			kind: 'css-wide-keyword',
			token: token!,
			detail:
				`${component}: ${token} is set to "${value}", which on a custom property applies to ` +
				`the token rather than to the property it drives. Give it a real value, or "initial" ` +
				`to mean no value.`,
		});
	}

	return issues;
}

function matches(source: string, pattern: RegExp): string[] {
	return [...source.matchAll(new RegExp(pattern.source, pattern.flags))].map((m) => m[1]!);
}
