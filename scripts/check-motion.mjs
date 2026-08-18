#!/usr/bin/env node
/*
 * Motion guard.
 *
 * Reduced motion is honoured by ONE declaration — `--itx-duration-base: 0ms`
 * under `@media (prefers-reduced-motion: reduce)` in styles/tokens/motion.css.
 * Every other duration derives from it, so zeroing the base zeroes the system.
 *
 * That only works while transitions actually READ the tokens. A hardcoded
 * `150ms` opts that component out of the user's preference silently — the CSS
 * looks fine, the build passes, and the component just keeps moving. This
 * replaced 28 hand-written @media blocks; without a guard it would grow back
 * one literal at a time.
 *
 * Two rules:
 *
 * 1. No literal time in a `transition` / `transition-duration` — read
 *    var(--itx-COMP-duration) or var(--itx-duration-*).
 *
 * 2. No literal fallback on a motion token: `var(--itx-x-duration, 150ms)`.
 *    A fallback is a second source of truth, and the one that wins when the
 *    theme is absent is the one nobody tuned. It also survives the reduce
 *    override, since the fallback only applies if the token is missing —
 *    which is exactly when the 0ms is missing too.
 *
 * Animations are NOT covered: they carry their own durations and each one
 * (progress's sweep, the pop/spin presets, the terminal caret) stops itself
 * explicitly. Those blocks are legitimate and must stay.
 *
 * Usage: node scripts/check-motion.mjs [root]
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] ?? "projects/interop/src";

/** The system definition itself is the one place a literal duration belongs. */
const SKIP = /tokens\/motion\.css$|\.spec\.ts$/;

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (p.includes("node_modules") || p.includes("/dist/")) continue;
		if (entry.isDirectory()) walk(p, out);
		else if (/\.(css|scss)$/.test(entry.name) && !SKIP.test(p)) out.push(p);
	}
	return out;
}

const findings = [];
/** A bare time value, not one that is part of an identifier or a var() name. */
const TIME = /(?<![\w-])\d*\.?\d+m?s(?![\w-])/;

/** An easing written as a function — the only way to write one literally. */
const EASING_FN = /\b(?:cubic-bezier|steps|linear)\(/;

/** True when `s` is a single balanced parenthesised group and nothing after it. */
function balanced(s) {
	const trimmed = s.trim();
	let depth = 0;
	for (let i = 0; i < trimmed.length; i++) {
		if (trimmed[i] === "(") depth++;
		else if (trimmed[i] === ")") {
			depth--;
			if (depth === 0) return i === trimmed.length - 1;
		}
	}
	return false;
}

/**
 * Split a transition shorthand on its top-level commas only. Splitting naively
 * tears `var(--x, 90ms)` in half, which is how a fallback ends up reported as
 * a bare literal.
 */
function topLevelParts(value) {
	const parts = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < value.length; i++) {
		if (value[i] === "(") depth++;
		else if (value[i] === ")") depth--;
		else if (value[i] === "," && depth === 0) {
			parts.push(value.slice(start, i));
			start = i + 1;
		}
	}
	parts.push(value.slice(start));
	return parts;
}

/**
 * Every `var(--itx-*-duration|easing|…, <fallback>)` in `src`, with the fallback
 * read by scanning to the matching close paren rather than by regex.
 *
 * A regex cannot do this. The obvious capture — `([^()]+)` — stops at the first
 * parenthesis, so it matches `var(--x, 110ms)` but is blind to exactly the two
 * fallbacks that matter most:
 *
 *   var(--itx-a-easing, cubic-bezier(0.2, 0, 0.38, 0.9))   an easing literal
 *   var(--itx-a-duration, var(--itx-duration-fast, 90ms))  a nested chain
 *
 * That blind spot shipped. interop-slider carried Carbon's 110ms and
 * cubic-bezier(0.2, 0, 0.38, 0.9) in fallback slots for months; this guard ran
 * green over them the whole time, and they were found by hand during the
 * styleUrl migration. An easing literal is the worse miss of the two, since a
 * parenthesised value is the ONLY way to write one.
 */
function motionVarsWithFallback(src) {
	const out = [];
	const OPEN =
		/var\(\s*(--itx-[a-z0-9-]*(?:duration|easing|timing|transition)(?!-?propert)[a-z0-9-]*)\s*,/g;

	let m;
	while ((m = OPEN.exec(src)) !== null) {
		// Scan from just past the comma to the paren that closes this var().
		let depth = 1;
		let i = m.index + m[0].length;
		for (; i < src.length && depth > 0; i++) {
			if (src[i] === "(") depth++;
			else if (src[i] === ")") depth--;
		}
		if (depth !== 0) continue; // unbalanced source; leave it to stylelint

		const fallback = src.slice(m.index + m[0].length, i - 1);

		// A fallback that is ITSELF just a var() chain is not a literal. The
		// inner var() is matched by this same loop and reported on its own, so
		// reporting the outer one too would name the same defect twice and
		// point at the wrong token.
		if (/^\s*var\(/.test(fallback) && balanced(fallback)) continue;

		if (!TIME.test(fallback) && !EASING_FN.test(fallback)) continue;

		out.push({ token: m[1], fallback, index: m.index });
	}

	return out;
}

for (const file of walk(ROOT)) {
	const src = readFileSync(file, "utf8");
	// Blank comments out rather than dropping them, so offsets stay truthful.
	const clean = src.replace(/\/\*[\s\S]*?\*\//g, (m) =>
		m.replace(/[^\n]/g, " "),
	);
	const lineOf = (i) => clean.slice(0, i).split("\n").length;

	// Rule 1 — a literal time in a transition. Matches across newlines, which
	// is how `translate 150ms ease` hid inside a multi-line shorthand.
	for (const m of clean.matchAll(
		/transition(?:-duration)?\s*:\s*([^;{}]+);/g,
	)) {
		for (const part of topLevelParts(m[1])) {
			// A literal INSIDE a var() is a fallback; rule 2 reports those, with a
			// better message. Only a bare time outside any var() lands here.
			if (!TIME.test(part.replace(/var\(.*\)/gs, ""))) continue;
			findings.push({
				file,
				line: lineOf(m.index),
				what: part.trim().replace(/\s+/g, " ").slice(0, 70),
				why: "literal duration — this component ignores prefers-reduced-motion. Read var(--itx-COMP-duration).",
			});
		}
	}

	// Rule 2 — a literal fallback on a motion token.
	for (const { token, fallback, index } of motionVarsWithFallback(clean)) {
		findings.push({
			file,
			line: lineOf(index),
			what: `var(${token}, ${fallback.trim()})`.slice(0, 70),
			why: "literal fallback on a motion token — the theme is the single source. Drop the fallback.",
		});
	}
}

if (!findings.length) {
	console.log(
		"✓ motion clean — every transition reads a token, so reduced motion reaches all of them",
	);
	process.exit(0);
}

console.error(
	`✗ ${findings.length} motion violation${findings.length === 1 ? "" : "s"}:\n`,
);
for (const f of findings) {
	console.error(`  ${f.file}:${f.line}`);
	console.error(`    ${f.what}`);
	console.error(`    ${f.why}\n`);
}
process.exit(1);
