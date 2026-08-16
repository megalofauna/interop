#!/usr/bin/env node
/*
 * Focus ring guard.
 *
 * Focus used to be defined in 36 rules across ~20 files, backed by 54 theme
 * declarations. Width had drifted three ways, offset five, and the colour came
 * from four different sources — two of them a hardcoded hex that no colourway
 * change could reach. `styles/tokens/focus.css` is the system definition now;
 * this keeps components reading it.
 *
 * Three rules:
 *
 * 1. A focus ring must read the system chain. `var(--itx-COMP-focus-x,
 *    var(--itx-focus-x))` — never a literal colour, width or offset. That chain
 *    is what makes an override work at ANY level: both tokens stay unresolved
 *    until the element, so setting --itx-focus-color on any ancestor reaches
 *    it. A theme alias like `--itx-button-focus-color: var(--itx-focus-color)`
 *    declared on [interop-root] substitutes THERE and silently bakes, which is
 *    the bug this system replaced.
 *
 * 2. No hardcoded colour in a focus declaration.
 *
 * 3. A VISIBLE ring on bare `:focus` fails. It fires on mouse click, not just
 *    keyboard, which is the noise that gets focus styles deleted wholesale.
 *    `outline: none` on `:focus` is the correct reset and is allowed — the
 *    pairing is `:focus { outline: none }` plus a `:focus-visible` rule.
 *
 * Deliberately NOT flagged: rings inside @media (prefers-contrast) or
 * (forced-colors). Those use `currentColor` on purpose — the whole point of
 * high-contrast mode is to follow the user's colours, not the brand's.
 *
 * Usage: node scripts/check-focus.mjs [root]
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] ?? "projects/interop/src";

/** The system definition itself, and specs that exercise both directions. */
const SKIP = /tokens\/focus\.css$|\.spec\.ts$/;

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (p.includes("node_modules") || p.includes("/dist/")) continue;
		if (entry.isDirectory()) walk(p, out);
		else if (/\.(css|scss)$/.test(entry.name) && !SKIP.test(p)) out.push(p);
	}
	return out;
}

/** Character ranges covered by a high-contrast media block. */
function highContrastSpans(s) {
	const spans = [];
	for (const m of s.matchAll(/@media[^{]*(?:prefers-contrast|forced-colors)[^{]*\{/g)) {
		let i = m.index + m[0].length;
		let depth = 1;
		while (i < s.length && depth > 0) {
			if (s[i] === "{") depth++;
			else if (s[i] === "}") depth--;
			i++;
		}
		spans.push([m.index, i]);
	}
	return spans;
}

const findings = [];
const HEX = /#[0-9a-fA-F]{3,8}\b/;

for (const file of walk(ROOT)) {
	const src = readFileSync(file, "utf8");
	const spans = highContrastSpans(src);
	const inHighContrast = (i) => spans.some(([a, b]) => i >= a && i < b);

	// Every outline/box-shadow declaration, with its position, comments stripped.
	const clean = src.replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length));

	for (const m of clean.matchAll(/(outline|box-shadow)\s*:\s*([^;]+);/g)) {
		const value = m[2].trim();
		if (inHighContrast(m.index)) continue;
		if (/^none\b/.test(value)) continue;

		// Which rule is this in? Walk back to the nearest selector.
		const before = clean.slice(0, m.index);
		const open = before.lastIndexOf("{");
		const selStart = Math.max(before.lastIndexOf("}", open), before.lastIndexOf(";", open)) + 1;
		const selector = before.slice(selStart, open).trim().replace(/\s+/g, " ");
		const line = before.split("\n").length;

		const focusRule = /:focus|\.focused/.test(selector);
		if (!focusRule) continue;

		if (HEX.test(value)) {
			findings.push({ file, line, selector, why: "hardcoded colour in a focus ring" });
		} else if (!value.includes("--itx-focus-")) {
			findings.push({
				file,
				line,
				selector,
				why: "focus ring does not read the system chain — use var(--itx-COMP-focus-x, var(--itx-focus-x))",
			});
		}

		// Rule 3: a VISIBLE ring on bare :focus.
		if (/:focus(?![-a-z(])/.test(selector) && !/:focus-visible|:focus-within/.test(selector)) {
			findings.push({
				file,
				line,
				selector,
				why: "visible ring on bare :focus — fires on mouse click. Use :focus-visible; `outline: none` on :focus is the correct reset",
			});
		}
	}
}

if (!findings.length) {
	console.log("✓ focus rings clean — every ring reads the system chain, none on bare :focus");
	process.exit(0);
}

console.error(`✗ ${findings.length} focus violation${findings.length === 1 ? "" : "s"}:\n`);
for (const f of findings) {
	console.error(`  ${f.file}:${f.line}`);
	console.error(`    ${f.selector.slice(0, 90)}`);
	console.error(`    ${f.why}\n`);
}
process.exit(1);
