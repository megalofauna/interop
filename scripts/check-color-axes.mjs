#!/usr/bin/env node
/*
 * Colour axis guard.
 *
 * The colour system has exactly one relative axis left, and one absolute one:
 *
 *   ELEVATION  --itx-surface-0 … -3, and the pointers into them —
 *              --itx-surface and --itx-surface-above
 *              The neutral SUBSTRATE a component stands on. Backgrounds only.
 *              The number IS the depth, and the pointers MOVE: every layer
 *              boundary redeclares them.
 *
 *   THE ROLES  --itx-role-*
 *              Everything drawn ON TOP, named by the job it does. Absolute:
 *              a role is one colour at every depth, which is what makes it
 *              safe to name and reuse.
 *
 * Conflating them is the failure the rewrite exists to fix. An elevation token
 * on a mark property is the error this catches: a border or a glyph is not a
 * substrate, so painting one with a surface means it silently stops holding
 * its contrast the moment the layer moves underneath it.
 *
 * Convention did not hold this. --itx-border said one thing while four
 * separate files independently re-derived --itx-neutral-7 as "the house
 * hairline", and grep — the only detector — missed three global-token stomps.
 * So it is a build error.
 *
 * Two sibling rules were RETIRED here, deliberately and with their reasons
 * kept, when the contrast ranks were deleted:
 *
 *   - "wash-level rank as a label" (ranks 1–2 as text)
 *   - "text-level rank as a fill" (ranks 4–6 as a background)
 *
 * Both keyed on --itx-contrast-N. Those tokens no longer exist, so both rules
 * had stopped matching anything and were passing vacuously — a false green,
 * which is worse than no rule. They do not have a palette equivalent: a step
 * carries no reserved job, so --itx-danger-3 as a fill is correct and
 * --itx-danger-11 as text is correct, and neither is inferable from the number.
 * What replaces them is measurement — scripts/check-contrast-css.mjs resolves
 * every role pairing through the real cascade at every depth.
 *
 * The second rule is vocabulary. A raw palette step read where a role exists
 * is an error, because that is how the drift got in the first time: component
 * themes read hand-picked steps 185 times against 64 named roles, and the same
 * job landed on a different number in each file. One text ramp was discovered
 * six times under nine names. A separator had three answers. Nothing detected
 * any of it, because every one of those reads is valid CSS that renders.
 *
 * This is NOT a restriction on overriding. Consumers may set anything, anywhere;
 * it only governs the CSS this library ships.
 *
 * Usage: node scripts/check-color-axes.mjs [root]
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] ?? "projects";

/** The files that DEFINE the axes, so they are allowed to write both. */
const GENERATED =
	/tokens\/elevation\.css$|protocol\/ladder\.css$|ladder\.css-source\.ts$/;
/** Specs deliberately exercise both axes, including the negative cases. */
const SPECS = /\.spec\.ts$/;

const ELEVATION = /--itx-surface(-above|-[0-3])?(?![-a-z0-9])/;

/**
 * A raw palette step. The ladder declares these; nothing the library ships
 * should read one, because every job they used to fill now has a name.
 */
const RAW_STEP =
	/var\(\s*--itx-(neutral|colorway|danger|info|success|warning)-\d{1,2}\s*[,)]/;

/**
 * Properties that paint a MARK. An elevation token here is the error: a border
 * or a glyph is not a substrate, and reading one means it will not hold its
 * contrast when the layer moves.
 */
const MARK_PROPERTY =
	/^(color|border(-(top|right|bottom|left|inline|block)(-(start|end))?)?-color|border-color|outline-color|fill|stroke|text-decoration-color|caret-color|column-rule-color)$/;

/** Properties that paint a SUBSTRATE. A contrast token here is the error. */
const SUBSTRATE_PROPERTY = /^(background|background-color)$/;

/**
 * Custom-property names carry the same intent as the real property they will
 * eventually feed, so they are checked the same way.
 *
 * Substrate is tested FIRST and wins: `--x-background-color` ends in `-color`
 * but is obviously a fill, and a component reading the current surface for its
 * own background is correct, not a violation.
 *
 * A bare `-color` suffix is deliberately NOT treated as a mark. It is genuinely
 * ambiguous — `--x-fade-color` fades to the substrate — and a guard that cries
 * wolf gets switched off, which costs more than the coverage is worth.
 */
/*
 * Token names carry an optional trailing STATE (`-hover`, `-expanded`,
 * `-current`, …) per the naming pattern in .agent/css-strategy.md, so the
 * suffix has to be stripped before classifying. Without that,
 * `--x-divider-color-expanded` reads as neither, and a real violation walks
 * straight through — which is exactly what happened once.
 */
const STATE_SUFFIX =
	/-(hover|active|focus|focus-visible|disabled|selected|checked|current|expanded|collapsed|pressed|open|closed|stuck|invalid|readonly|visited|completed|dragging)$/;

const SUBSTRATE_TOKEN =
	/-(background|background-color|bg|surface|fill|fade-color|track|backdrop)$/;
const MARK_TOKEN =
	/-(border-color|divider-color|rule-color|outline-color|foreground|ink|icon-color|text-color|stroke)$/;

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (p.includes("node_modules") || p.includes("/dist/")) continue;
		if (entry.isDirectory()) walk(p, out);
		else if (
			/\.(css|scss)$/.test(entry.name) &&
			!GENERATED.test(p) &&
			!SPECS.test(p)
		)
			out.push(p);
	}
	return out;
}

const findings = [];

for (const file of walk(ROOT)) {
	// Block comments span many lines here — whole variant blocks sit commented
	// out awaiting a re-derive — so tracking the state matters. Without it the
	// guard reports on code nobody ships.
	let inComment = false;

	readFileSync(file, "utf8")
		.split("\n")
		.forEach((line, i) => {
			let code = line.replace(/\/\*.*?\*\//g, "");

			if (inComment) {
				const end = code.indexOf("*/");
				if (end === -1) return;
				code = code.slice(end + 2);
				inComment = false;
			}
			const open = code.lastIndexOf("/*");
			if (open !== -1) {
				inComment = true;
				code = code.slice(0, open);
			}
			const decl = code.match(/^\s*(--[a-z0-9-]+|[a-z-]+)\s*:\s*(.+)$/i);
			if (!decl) return;

			const [, name, value] = decl;
			const isCustom = name.startsWith("--");

			/*
			 * `--x: var(--x)` is a cycle: guaranteed-invalid, and it INHERITS, so it
			 * takes the subtree with it. This codebase has now produced one three
			 * times — twice by hand and once from a codemod that mapped both sides
			 * of a rename — and the last one shipped, surviving only because a later
			 * import happened to re-declare the token. Cheap to detect, so detect it.
			 */
			if (isCustom && new RegExp(`var\\(\\s*${name}\\s*[,)]`).test(value)) {
				findings.push({
					file,
					line: i + 1,
					text: line.trim(),
					why: `${name} references itself — a cycle, which computes to guaranteed-invalid and inherits`,
				});
			}
			const base = isCustom ? name.replace(STATE_SUFFIX, "") : name;
			/* Substrate-ish names are simply not marks; that is all this decides now. */
			const wantsSubstrate = isCustom
				? SUBSTRATE_TOKEN.test(base)
				: SUBSTRATE_PROPERTY.test(base);
			const wantsMark =
				!wantsSubstrate &&
				(isCustom ? MARK_TOKEN.test(base) : MARK_PROPERTY.test(base));

			const step = value.match(RAW_STEP);
			if (step) {
				findings.push({
					file,
					line: i + 1,
					text: line.trim(),
					why: `raw palette step (${step[0].replace(/var\(\s*|\s*[,)]$/g, "")}) — read the role for the job instead. Text is --itx-role-text / -quiet / -quieter / -disabled, a fill is -background-control or -background-interactive, an edge is --itx-role-edge or --itx-role-divider.`,
				});
			}

			if (wantsMark && ELEVATION.test(value)) {
				findings.push({
					file,
					line: i + 1,
					text: line.trim(),
					why: `elevation token on a mark (${name}) — a border or glyph is not a substrate, and this will not hold its contrast when the layer moves. Use a role like --itx-role-edge.`,
				});
			}
		});
}

if (!findings.length) {
	console.log(
		"✓ colour axes clean — no elevation token on a mark, no raw step, no token cycles",
	);
	process.exit(0);
}

console.error(
	`✗ ${findings.length} axis violation${findings.length === 1 ? "" : "s"}:\n`,
);
for (const f of findings) {
	console.error(`  ${f.file}:${f.line}`);
	console.error(`    ${f.text.slice(0, 100)}`);
	console.error(`    ${f.why}\n`);
}
process.exit(1);
