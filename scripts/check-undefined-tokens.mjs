#!/usr/bin/env node
/*
 * Undefined-token guard.
 *
 * `var(--itx-does-not-exist)` with no fallback is silently fatal. The reference
 * is guaranteed-invalid, so the whole declaration reading it is invalid at
 * computed-value time and the property falls back to its inherited or initial
 * value. Nothing warns. The build passes, stylelint passes, the page renders —
 * just not the way anyone wrote it.
 *
 * This is not hypothetical. `tokens/shape.css` briefly carried
 *
 *   --itx-radius: var(--itx-radius-small);   /* the rung is --itx-radius-sm *​/
 *
 * which is the house radius knob every component falls back to. The intent was
 * "small corners everywhere"; the effect was SQUARE corners everywhere, because
 * --itx-radius resolved to nothing and every border-radius chain fell through to
 * 0. Caught by eye, one character from shipping, with eight other guards green.
 *
 * ─── What counts as "declared" ──────────────────────────────────────────────
 *
 * Three ways, all real:
 *
 *   CSS         --itx-foo: <value>;
 *   Angular     host: { "[style.--itx-foo]": "expr" }
 *   Imperative  el.style.setProperty("--itx-foo", …)
 *
 * The last two matter: several component tokens are per-instance values a
 * stylesheet cannot know (a progress bar's percentage, a slider's fill). They
 * are declared in TypeScript and read in CSS, and that is correct.
 *
 * ─── What this does NOT flag ────────────────────────────────────────────────
 *
 * A reference WITH a fallback — `var(--itx-foo, 4px)` — is fine by construction.
 * That is the entire point of the fallback slot, and it is how a component
 * offers a lever it has no default for. Only the bare, no-fallback form is a
 * bug, because it is the only form with nowhere to land.
 *
 * Usage: node scripts/check-undefined-tokens.mjs [root]
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] ?? "projects/interop/src";

/** Generated files and specs that exercise the failure mode deliberately. */
const SKIP = /interop\.(starter|tokens)\.css$|\.spec\.ts$/;

/**
 * Tokens with no declaration anywhere, on purpose: the consumer supplies one or
 * nothing happens. Each needs a reason, because "nothing sets it" is also what a
 * typo looks like.
 */
const CONSUMER_SUPPLIED = new Map([
	[
		"--itx-decoration-image",
		"the [itx-decoration] opt-in pattern — the pseudo-element ships with no " +
			"paint, and a consumer naming an image is what turns it on",
	],
	[
		"--itx-pn-link-background-image-current",
		"page-nav's super-theming lever for the current link; the library has no " +
			"opinion, matching the background-image lever button deliberately dropped",
	],
]);

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (p.includes("node_modules") || p.includes("/dist/")) continue;
		if (entry.isDirectory()) walk(p, out);
		else if (/\.(css|scss|ts|html)$/.test(entry.name) && !SKIP.test(p))
			out.push(p);
	}
	return out;
}

const files = walk(ROOT);
const declared = new Set(CONSUMER_SUPPLIED.keys());
const references = [];

for (const file of files) {
	const src = readFileSync(file, "utf8");
	// Blank comments rather than dropping them, so line numbers stay truthful.
	const clean = src.replace(/\/\*[\s\S]*?\*\//g, (m) =>
		m.replace(/[^\n]/g, " "),
	);

	// Declared in CSS.
	for (const m of clean.matchAll(/(--itx-[\w-]+)\s*:/g)) declared.add(m[1]);
	// Declared by an Angular host style binding.
	for (const m of clean.matchAll(/\[style\.(--itx-[\w-]+)\]/g))
		declared.add(m[1]);
	// Declared imperatively.
	for (const m of clean.matchAll(/setProperty\(\s*["'`](--itx-[\w-]+)/g))
		declared.add(m[1]);

	if (!/\.(css|scss)$/.test(file)) continue;

	// A reference with NO fallback: var(--x) that closes immediately.
	for (const m of clean.matchAll(/var\(\s*(--itx-[\w-]+)\s*\)/g)) {
		references.push({
			file,
			name: m[1],
			line: clean.slice(0, m.index).split("\n").length,
		});
	}
}

const findings = references.filter((r) => !declared.has(r.name));

if (!findings.length) {
	console.log(
		`✓ no undefined token references — ${references.length} bare var() reads, all declared`,
	);
	process.exit(0);
}

console.error(
	`✗ ${findings.length} undefined token reference${findings.length === 1 ? "" : "s"}:\n`,
);
for (const f of findings) {
	console.error(`  ${f.file}:${f.line}`);
	console.error(`    var(${f.name}) — nothing declares ${f.name}`);
	console.error(
		`    A bare var() on an undefined token is guaranteed-invalid: the whole\n` +
			`    declaration dies and the property falls back to its inherited or\n` +
			`    initial value. Check the spelling against the ramp, or give it a\n` +
			`    fallback if it is a lever the consumer supplies.\n`,
	);
}
process.exit(1);
