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
	for (const m of clean.matchAll(
		/var\(\s*(--itx-[a-z0-9-]*(?:duration|easing|timing|transition)(?!-?propert)[a-z0-9-]*)\s*,\s*([^()]+)\)/g,
	)) {
		findings.push({
			file,
			line: lineOf(m.index),
			what: `var(${m[1]}, ${m[2].trim()})`.slice(0, 70),
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
