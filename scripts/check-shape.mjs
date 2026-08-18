#!/usr/bin/env node
/*
 * Shape & baking guard.
 *
 * Two rules, both learned the hard way on ITX-42/43.
 *
 * ─── Rule 1: no literal radius ──────────────────────────────────────────────
 *
 * A hardcoded `6px` opts a component out of --itx-radius, so the global knob
 * reaches everything except the one component someone typed a number into.
 * Read var(--itx-COMP-radius, var(--itx-radius)) instead.
 *
 * `0` is allowed — that is absence, not a weight, and routing it through a
 * token buys nothing. Percentages are allowed: `50%` on a circular indicator is
 * geometry, not styling, and does not scale with a radius knob.
 *
 * ─── Rule 2: no baked alias ─────────────────────────────────────────────────
 *
 * THE rule this codebase keeps rediscovering. A custom property is substituted
 * where it is DECLARED, using that element's computed values. So:
 *
 *   :where([interop-root]) { --itx-chip-transition-duration: var(--itx-duration-fast); }
 *
 * freezes at the root. What makes it so durable a bug is that it half-works: a
 * media override (reduced motion, high contrast) also targets the root, lands
 * on the SAME element, and therefore still applies. Only a consumer's subtree
 * override silently fails — the case nobody tests by hand.
 *
 * The fix is always the same shape: put the whole chain in the component's
 * STRUCTURAL rule, where nothing resolves until the element.
 *
 *   border-radius: var(--itx-field-border-radius, var(--itx-radius));
 *
 * This has now been fixed four times — focus colours (ITX-42), then radius,
 * then 46 motion and border-width aliases I introduced myself while fixing the
 * first two. Hence a guard rather than a convention.
 *
 * tokens/baking.spec.ts holds the executable version of both halves.
 *
 * Usage: node scripts/check-shape.mjs [root]
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] ?? "projects/interop/src";

/**
 * The token files ARE the system; they legitimately define it at the root.
 *
 * interop.starter.css is skipped for the opposite reason: it is consumer-facing
 * config, not library rules. Stating a literal value is exactly what it is for,
 * and it is generated, so it cannot drift into the patterns this guard exists
 * to catch.
 */
const SKIP = /\/tokens\/|\.spec\.ts$|interop\.starter\.css$/;

/** A reference to a system token, anywhere in a value. */
const SYSTEM =
	/--itx-(?:radius|radius-attr|focus-(?:color|width|style|offset)|duration-[a-z]+|easing-[a-z]+|border-width-[a-z]+|contrast-[0-9]+|surface(?:-[a-z0-9-]+)?)/;

/**
 * A system token's own NAME, anchored — including ramp steps and semantic
 * names (--itx-radius-md, --itx-border-width-hairline). One system token
 * defining another IS the ramp, not a baked alias.
 */
const SYSTEM_NAME =
	/^--itx-(?:radius|border-width|duration|easing|focus|contrast|surface|on-surface)(?:-[a-z0-9_]+)*$/;

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (p.includes("node_modules") || p.includes("/dist/")) continue;
		if (entry.isDirectory()) walk(p, out);
		else if (/\.(css|scss)$/.test(entry.name) && !SKIP.test(p)) out.push(p);
	}
	return out;
}

/** The selector of the rule containing `idx`, comments stripped. */
function selectorAt(src, idx) {
	let depth = 0;
	let i = idx;
	while (i > 0) {
		i--;
		if (src[i] === "}") depth++;
		else if (src[i] === "{") {
			if (depth === 0) break;
			depth--;
		}
	}
	const head = src.slice(0, i).replace(/\/\*[\s\S]*?\*\//g, "");
	return (head.match(/([^{};]*)$/)?.[1] ?? "").trim().replace(/\s+/g, " ");
}

const findings = [];
/** A length with a unit — not `0`, not a percentage, not part of an identifier. */
const LITERAL_LEN = /(?<![\w.-])\d*\.?\d+(?:px|rem|em|ch|ex|vh|vw|pt)(?![\w-])/;

for (const file of walk(ROOT)) {
	const src = readFileSync(file, "utf8");
	const clean = src.replace(/\/\*[\s\S]*?\*\//g, (m) =>
		m.replace(/[^\n]/g, " "),
	);
	const lineOf = (i) => clean.slice(0, i).split("\n").length;

	// Rule 1 — a literal length in a radius declaration.
	for (const m of clean.matchAll(
		/(?:border-[a-z-]*radius|--itx-[a-z0-9-]*radius[a-z0-9-]*)\s*:\s*([^;{}]+);/g,
	)) {
		// A literal inside a var() fallback is still a literal here: it is the
		// value that actually applies whenever the token is unset.
		if (!LITERAL_LEN.test(m[1])) continue;
		findings.push({
			file,
			line: lineOf(m.index),
			what: m[0].trim().replace(/\s+/g, " ").slice(0, 70),
			why: "literal radius — this component ignores --itx-radius. Read var(--itx-COMP-radius, var(--itx-radius)).",
		});
	}

	// Rule 2 — a component alias to a system token, declared on the root.
	for (const m of clean.matchAll(/(--itx-[a-z0-9-]+)\s*:\s*([^;{}]*);/g)) {
		const [, name, value] = m;
		if (!SYSTEM.test(value)) continue;
		// A system token defining another is fine — that IS the ramp.
		if (SYSTEM_NAME.test(name)) continue;
		const sel = selectorAt(clean, m.index);
		if (!/^:where\(\[interop-root\]\)$|^\[interop-root\]$/.test(sel)) continue;
		// The remedy differs by axis, so name the right one rather than the
		// generic advice — a colour rank cannot be fixed the way a radius is.
		const isColor = /--itx-(?:contrast-[0-9]|surface)/.test(value);
		findings.push({
			file,
			line: lineOf(m.index),
			what: `${name}: ${value.trim()}`.replace(/\s+/g, " ").slice(0, 70),
			why: isColor
				? "baked alias — a contrast rank / surface is re-declared at every elevation boundary, so aliasing one at the root freezes layer 0's value for the whole tree. Co-declare the block on :where([interop-root], [itx-layer], [itx-sink])."
				: "baked alias — substitutes at the root and freezes. Move the chain into the component's structural rule.",
		});
	}
}

if (!findings.length) {
	console.log(
		"✓ shape clean — no literal radius, no system token baked at the root",
	);
	process.exit(0);
}

console.error(
	`✗ ${findings.length} shape violation${findings.length === 1 ? "" : "s"}:\n`,
);
for (const f of findings) {
	console.error(`  ${f.file}:${f.line}`);
	console.error(`    ${f.what}`);
	console.error(`    ${f.why}\n`);
}
process.exit(1);
