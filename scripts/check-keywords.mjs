#!/usr/bin/env node
/*
 * CSS-wide keyword guard.
 *
 * A CSS-wide keyword as a custom-property VALUE never does what it looks like:
 *
 *   --itx-kbd-perspective: unset;      /* NOT "no perspective" *​/
 *   --itx-button-corner-shape: unset;  /* NOT "no corner shape" *​/
 *   --itx-button-background-hover: inherit;
 *
 * `unset` / `inherit` / `initial` / `revert` / `revert-layer` apply to the
 * CUSTOM PROPERTY, not to the property that later reads it. `unset` on an
 * inherited custom property means *inherit*; with nothing up the tree declaring
 * it, that resolves to guaranteed-invalid and the reading declaration dies with
 * it. Where an ancestor DOES declare it, the value is inherited from there —
 * which is worse, because it silently resolves to the very thing the author was
 * trying to cancel.
 *
 * Proven in Chrome, not inferred:
 *
 *   --p: unset  -> transform: perspective(var(--p)) rotateX(20deg)  ->  none
 *   --p: 12rem  -> same declaration                                 ->  matrix3d(…)
 *   --bg: inherit -> background-color: var(--bg)  ->  rgba(0,0,0,0), not the parent's
 *
 * This class produced three shipped bugs before anyone noticed, and every one
 * of them looked deliberate in review:
 *
 *   - the kbd keycap's 3D tilt never rendered (ITX-46)
 *   - the button's "squircle" corner-shape never rendered, and a whole override
 *     block existed to undo a state that did not exist
 *   - a toolbar's six declarations neutralising button hover/active resolved to
 *     [interop-root]'s values — the exact fill they were suppressing
 *
 * ─── What to write instead ──────────────────────────────────────────────────
 *
 * Name a real value: `transparent`, `0`, a token, a length.
 *
 * If you genuinely want the keyword, put it in the var() FALLBACK slot, where
 * it IS valid — the fallback is substituted as raw tokens into the property:
 *
 *   font-family: var(--itx-cb-tab-font-family, inherit);   /* fine *​/
 *
 * And if a component wants "no opinion", declare nothing at all. Absence is how
 * the theme says that, and the structural fallback handles it.
 *
 * Usage: node scripts/check-keywords.mjs [root]
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] ?? "projects/interop/src";

/** Generated files, and specs that exercise the failure mode on purpose. */
const SKIP = /interop\.(globals|tokens)\.css$|ladder\.css$|\.spec\.ts$/;

const KEYWORDS = "unset|initial|inherit|revert|revert-layer";

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

for (const file of walk(ROOT)) {
	const src = readFileSync(file, "utf8");
	// Blank comments rather than dropping them, so line numbers stay truthful.
	const clean = src.replace(/\/\*[\s\S]*?\*\//g, (m) =>
		m.replace(/[^\n]/g, " "),
	);

	for (const m of clean.matchAll(
		new RegExp(`(--[\\w-]+)\\s*:\\s*(${KEYWORDS})\\s*(?=;|\\})`, "g"),
	)) {
		findings.push({
			file,
			line: clean.slice(0, m.index).split("\n").length,
			what: `${m[1]}: ${m[2]}`,
			why: `a CSS-wide keyword as a custom-property value applies to the PROPERTY, not to whatever reads it — this resolves to guaranteed-invalid or inherits the ancestor's value. Name a real value, or move the keyword into the var() fallback slot.`,
		});
	}
}

if (!findings.length) {
	console.log("✓ no CSS-wide keyword used as a custom-property value");
	process.exit(0);
}

console.error(
	`✗ ${findings.length} CSS-wide keyword violation${findings.length === 1 ? "" : "s"}:\n`,
);
for (const f of findings) {
	console.error(`  ${f.file}:${f.line}`);
	console.error(`    ${f.what}`);
	console.error(`    ${f.why}\n`);
}
process.exit(1);
