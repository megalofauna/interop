/*
 * Shared CSS reading helpers for the generators.
 *
 * Extracted so generate-starter.mjs and generate-token-reference.mjs cannot
 * disagree about what a file says. Both of them read the SAME source the
 * library ships, which is the only reason either output can claim not to drift.
 */

/** Blank comments out rather than deleting them, so offsets stay truthful. */
export const decomment = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));

/**
 * Remove conditional at-rule blocks — @media, @supports, @container.
 *
 * Without this a reader picks up overrides as if they were defaults, and the
 * failure is silent and severe: motion.css declares --itx-duration-base as
 * 200ms at the root and 0ms inside @media (prefers-reduced-motion: reduce), so
 * the first version of the starter generator emitted a file that switched
 * motion off for everyone who copied it.
 */
export function stripAtRules(src) {
	let out = "";
	let i = 0;
	while (i < src.length) {
		const at = src.indexOf("@", i);
		if (at === -1) return out + src.slice(i);
		if (!/^@(media|supports|container)\b/.test(src.slice(at))) {
			out += src.slice(i, at + 1);
			i = at + 1;
			continue;
		}
		out += src.slice(i, at);
		const open = src.indexOf("{", at);
		if (open === -1) return out;
		let depth = 1;
		let j = open + 1;
		while (j < src.length && depth > 0) {
			if (src[j] === "{") depth++;
			else if (src[j] === "}") depth--;
			j++;
		}
		i = j;
	}
	return out;
}

const esc = (token) => token.replace(/-/g, "\\-");
const tidy = (v) => v.trim().replace(/\s+/g, " ");

/**
 * The BASE declaration of `token` in `src`, or null.
 *
 * First, not last. Per the file skeleton in .agent/css-strategy.md a theme
 * declares base values first and host-state / variant blocks last, so the first
 * occurrence is the one a plain instance gets. Reading the last one instead
 * reports the most specialised value as if it were the default — the first
 * version of the token reference claimed a button was 4rem tall (the xl size)
 * with a transparent background (a variant).
 *
 * A token that only ever appears in a variant block still returns that value,
 * which is correct: there is no base for it.
 */
export function readDeclaration(src, token) {
	const m = new RegExp(`${esc(token)}\\s*:\\s*([^;]+);`).exec(stripAtRules(src));
	return m === null ? null : tidy(m[1]);
}

/**
 * The fallback in the first `var(token, …)` read, or null.
 *
 * Read from the RAW source, not the at-rule-stripped one: a token whose only
 * default is a structural fallback may well have that fallback inside an
 * at-rule, as the coarse-pointer touch target does.
 */
export function readFallback(src, token) {
	const open = new RegExp(`var\\(\\s*${esc(token)}\\s*,`).exec(src);
	if (!open) return null;

	// Balanced scan, so a nested chain like
	//   var(--itx-button-focus-color, var(--itx-focus-color))
	// is returned whole. A naive [^()]+ misses these entirely and reports the
	// token as having no default, when in fact it falls through to the system —
	// which is the single most useful thing to say about it.
	let i = open.index + open[0].length;
	let depth = 1;
	let start = i;
	while (i < src.length && depth > 0) {
		if (src[i] === "(") depth++;
		else if (src[i] === ")") {
			depth--;
			if (depth === 0) break;
		}
		i++;
	}
	return depth === 0 ? tidy(src.slice(start, i)) : null;
}

/**
 * Every at-rule block in `src` that re-declares `token`, as {prelude, value}.
 *
 * A consumer's copy of a generated file is UNLAYERED, so it outranks every
 * layered library rule regardless of specificity or media query. Any knob with
 * a preference override therefore has to carry that override with it, or
 * copying the file silently switches the behaviour off.
 */
export function readOverrides(src, token) {
	const found = [];
	for (const m of src.matchAll(/@(?:media|supports|container)[^{]*/g)) {
		const open = src.indexOf("{", m.index);
		if (open === -1) continue;
		let depth = 1;
		let j = open + 1;
		while (j < src.length && depth > 0) {
			if (src[j] === "{") depth++;
			else if (src[j] === "}") depth--;
			j++;
		}
		const decl = new RegExp(`${esc(token)}\\s*:\\s*([^;]+);`).exec(src.slice(open + 1, j - 1));
		if (decl) found.push({ prelude: tidy(m[0]), value: tidy(decl[1]) });
	}
	return found;
}

/**
 * Tokens that belong to the SYSTEM rather than to any one component.
 *
 * A component reads plenty of these — --itx-surface, --itx-contrast-4,
 * --itx-radius — but they are not that component's levers. They are set once,
 * globally, which is what interop.starter.css is for.
 */
export const SYSTEM_TOKEN =
	/^--itx-(surface|contrast|radius|border-width|duration|easing|focus|spacing|sz|font|line-height|measure|rhythm|colorway|danger|info|success|warning|tint|ramp|layer|shadow|decoration|context-radius|outer-radius|inner-radius)\b/;
