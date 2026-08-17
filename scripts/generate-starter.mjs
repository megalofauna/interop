#!/usr/bin/env node
/*
 * Global starter generator.
 *
 * Emits `styles/interop.starter.css` — the one file a consumer copies to set
 * Interop's global levers.
 *
 * ── Why this is generated ─────────────────────────────────────────────────
 *
 * Three things make a hand-written starter go wrong, and all three are things a
 * script can get right for free:
 *
 * 1. DRIFT. Every default in the emitted file is READ from the library source,
 *    not retyped here. `--check` fails the build when they diverge. The
 *    evidence this matters is `tokens/color.css`, which declared
 *    `--itx-radius: var(--itx-radius-nominal)` — a radius knob, in the colour
 *    file, silently overridden by `tokens/shape.css` two imports later. A
 *    global knob was put in the wrong file, died, and nobody noticed.
 *
 * 2. THE SELECTOR SET. A custom property is substituted on the element it is
 *    DECLARED on. So an alias that reads a system token has to be declared on
 *    the same selector set as the token it reads, or it freezes:
 *
 *      /* freezes at the root; an itx-scale-scope below is ignored *​/
 *      [interop-root] { --itx-radius: var(--itx-radius-md); }
 *
 *      /* re-resolves at every boundary where the input is re-declared *​/
 *      [interop-root], [itx-scale-scope] { --itx-radius: var(--itx-radius-md); }
 *
 *    Which of those a given knob needs is not guessable from its name. It is
 *    recorded per-knob below, so the emitted file is correct by construction
 *    and a consumer can write Interop's own vocabulary rather than raw pixels.
 *
 * 3. THE BUILD-TIME BOUNDARY. Several levers people reasonably expect to be
 *    tokens are not, and cannot be — the colour ladder's layer count, its
 *    contrast floors, its seeds. Those are config in
 *    `generate-color-ladder.mjs`; the engine unrolls @container blocks per
 *    layer, so the rules have to exist at build time. Only a generator can
 *    print the runtime knobs as live CSS *and* the build-time ones as
 *    signposts. That boundary is invisible otherwise.
 *
 * Usage:
 *   node scripts/generate-starter.mjs          write the file
 *   node scripts/generate-starter.mjs --check  verify it is current, write nothing
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
	decomment,
	readDeclaration,
	readFallback,
	readOverrides,
} from "./lib/css-read.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const STYLES = join(REPO, "projects/interop/src/lib/styles");
const OUT = join(STYLES, "interop.starter.css");
const LADDER_SCRIPT = join(REPO, "scripts/generate-color-ladder.mjs");

/* ── Selector sets ────────────────────────────────────────────────────────
 *
 * Plain attribute selectors, not :where(). This is CONSUMER css — it should
 * win outright, and a consumer who later wraps it in a cascade layer still
 * wants it beating the library's zero-specificity rules.
 */
const ROOT = "[interop-root]";

/* ── The knobs ────────────────────────────────────────────────────────────
 *
 * `from` is the file the current default is READ from, so nothing here is a
 * retyped copy. `on` is the selector set the declaration must carry.
 */
const GROUPS = [
	{
		title: "Radius",
		blurb:
			"--itx-radius is the knob every component falls back to. It defaults to\n" +
			"none: the library is square out of the box, and turning this rounds\n" +
			"everything that has not pinned its own shape (a chip is a pill, a step\n" +
			"indicator is a circle — those do not follow).",
		knobs: [
			{
				token: "--itx-radius",
				from: "tokens/shape.css",
				on: ROOT,
				note: "The house radius: what every component falls back to.",
			},
			{
				token: "--itx-radius-base",
				from: "tokens/shape.css",
				on: ROOT,
				note:
					"Rescales the whole radius ramp proportionally: every step is derived from\n" +
					"this. Root only — a subtree rescales by carrying itx-scale-scope with its\n" +
					"own base, and a base declared here would reset it on every scope.",
			},
		],
		after: `/*
 * ── Writing a knob in terms of another token ──────────────────────────────
 *
 * The values above are lengths, which is the safe case: a length has nothing
 * to resolve. The moment you write one in terms of ANOTHER token, where you
 * declare it starts to matter, because a custom property is substituted on the
 * element it is declared on.
 *
 *   [interop-root] { --itx-radius: var(--itx-radius-md); }
 *
 * That freezes at the root. Inside a subtree that rescales the ramp —
 * <section itx-scale-scope style="--itx-radius-base: 8px"> — the md step is
 * 16px, but --itx-radius still holds the 8px it resolved to up here.
 *
 * To make it follow, declare it wherever its input is re-declared:
 *
 *   [interop-root],
 *   [itx-scale-scope] { --itx-radius: var(--itx-radius-md); }
 *
 * The trade is that this also RESETS the knob at every scope boundary, so a
 * --itx-radius you set on some panel in between is discarded there. That is
 * why the library declares --itx-radius on the root alone, and why this is
 * shown as a choice rather than done for you.
 */`,
	},
	{
		title: "Border width",
		blurb: "hairline / thick / heavy are all derived from one base.",
		knobs: [
			{
				token: "--itx-border-width-base",
				from: "tokens/shape.css",
				on: ROOT,
				note:
					"hairline is 1x, thick 2x, heavy 3x. Under a high-contrast preference the\n" +
					"library thickens hairline to the 2x step on its own.",
			},
		],
	},
	{
		title: "Motion",
		blurb:
			"Every duration in the library derives from one base, which is what lets\n" +
			"prefers-reduced-motion be honoured by a single declaration inside the\n" +
			"library. Set the base to 0ms here to switch motion off for everyone.",
		knobs: [
			{
				token: "--itx-duration-base",
				from: "tokens/motion.css",
				on: ROOT,
				note: "speedy is 0.125x, fast 0.5x, slow 2x. Root only, same reason as the ramps above.",
			},
			{
				token: "--itx-easing-standard",
				from: "tokens/motion.css",
				on: ROOT,
				note: "Symmetric; general purpose.",
			},
			{
				token: "--itx-easing-decelerate",
				from: "tokens/motion.css",
				on: ROOT,
				note: "Ease-out; entering elements.",
			},
			{
				token: "--itx-easing-accelerate",
				from: "tokens/motion.css",
				on: ROOT,
				note: "Ease-in; exiting elements.",
			},
		],
	},
	{
		title: "Focus",
		blurb:
			"One definition of what a focus ring is. Every component reads this chain,\n" +
			"so changing it here reaches all of them — including components you have\n" +
			"not styled and ones added in future versions.",
		knobs: [
			{
				token: "--itx-focus-color",
				from: "tokens/focus.css",
				on: ROOT,
				note:
					"Defaults to the colourway's solid, so focus follows your brand. This is\n" +
					"the one place brand survives an otherwise neutral component.",
			},
			{
				token: "--itx-focus-width",
				from: "tokens/focus.css",
				on: ROOT,
				note: "Goes to the heavy border step under a high-contrast preference, automatically.",
			},
			{
				token: "--itx-focus-style",
				from: "tokens/focus.css",
				on: ROOT,
				note: "Any outline-style.",
			},
			{
				token: "--itx-focus-offset",
				from: "tokens/focus.css",
				on: ROOT,
				note: "NEGATIVE draws the ring inside the box, which tight controls need so a stacked list of them does not collide.",
			},
		],
	},
	{
		title: "Colour — tint",
		blurb:
			"The neutral substrate's chroma and hue: the temperature of the whole\n" +
			"product, per scheme. Two numbers, `<chroma> <hue>`. This is a live knob —\n" +
			"the theme publishes lightness NUMBERS and each layer composes its own\n" +
			"oklch(), so a retint on any ancestor reaches every layer below it.",
		knobs: [
			{
				token: "--itx-tint-light",
				from: "themes/protocol/ladder.css",
				on: ROOT,
				note: "Chroma and hue of the light scheme's neutrals.",
			},
			{
				token: "--itx-tint-dark",
				from: "themes/protocol/ladder.css",
				on: ROOT,
				note: "Chroma and hue of the dark scheme's neutrals.",
			},
		],
	},
	{
		title: "Spacing",
		blurb:
			"One unit; the whole spacing scale is derived from it. Note that spacing is\n" +
			"NOT re-derived on itx-scale-scope — unlike radius, border width and\n" +
			"duration, a subtree cannot currently rescale its spacing.",
		knobs: [
			{
				token: "--itx-spacing-unit",
				from: "tokens/spacing.css",
				on: ROOT,
				note: "Step 1 of the scale; every other step is a multiple.",
			},
		],
	},
	{
		title: "Typography",
		blurb:
			"Measure and vertical rhythm for prose under [interop-typography-root].",
		knobs: [
			{
				token: "--itx-measure",
				from: "tokens/typography.css",
				on: ROOT,
				note: "Line length ceiling for flowing text.",
			},
			{
				token: "--itx-rhythm",
				from: "tokens/typography.css",
				on: ROOT,
				note: "Default flow space between blocks (p to p).",
			},
			{
				token: "--itx-rhythm-loose",
				from: "tokens/typography.css",
				on: ROOT,
				note: "Opening a heading.",
			},
			{
				token: "--itx-rhythm-tight",
				from: "tokens/typography.css",
				on: ROOT,
				note: "Binding a heading to the body that follows it.",
			},
		],
	},
	{
		title: "Touch target",
		blurb: "The hit-area floor applied on coarse pointers.",
		knobs: [
			{
				token: "--itx-button-touch-target",
				from: "components/button.css",
				on: ROOT,
				note:
					"Floors BOTH axes on coarse pointers; buttons genuinely grow to it rather\n" +
					"than looking small inside a larger box. Set 0 to opt out entirely.",
			},
		],
	},
];

/* ── Levers that are markup, not declarations ─────────────────────────── */
const ATTRIBUTES = [
	[
		'itx-theme="light|dark"',
		"[interop-root] only",
		"Pin the colour scheme instead of following the OS.",
	],
	[
		'itx-colorway="amber"',
		"[interop-root] ONLY",
		"Swap the brand family. Compound-selected on the root — putting this on a <div> does nothing.",
	],
	[
		'itx-status-palette="seventies|eighties"',
		"any element",
		"Swap danger/info/success/warning. Unlike itx-colorway, this DOES work on a subtree.",
	],
	[
		"itx-scale-scope",
		"any element",
		"Re-derives the radius, border-width and duration ramps here, so a base set on the same element rescales the subtree proportionally.",
	],
	[
		'itx-radius="none|nominal|sm|md|lg|xl|full"',
		"any element",
		"Applies one radius step to ONE element. Non-inheriting, so it cannot leak into nested children.",
	],
	[
		"itx-decoration",
		"any element",
		"Opts in a decorative ::before layer; see --itx-decoration-* in styles/utilities/decoration.css.",
	],
	[
		'itx-layer / itx-sink / itx-layer="N"',
		"any element",
		"Moves an element up or down the elevation ladder. Components declare that they ARE a layer, never which grey they are.",
	],
];

/* ── Config that is NOT reachable from CSS ─────────────────────────────── */
const BUILD_TIME = [
	[
		"DEPTH.above / DEPTH.below",
		"How many elevation layers exist. The engine unrolls a @container block per layer, so the rules must exist at build time — this can never be a custom property.",
	],
	[
		"RANKS[].ratio",
		"The contrast floor each rank is solved to (1.5:1, 3:1, 4.5:1, 7:1). Raising one re-solves it on every layer at once.",
	],
	[
		"RAMP.<scheme>.page",
		"Moves a whole scheme up or down. The biggest single lever on the look.",
	],
	[
		"RAMP.<scheme>.up / .ease / .down",
		"Step size between layers, its deceleration, and the size of a sink.",
	],
	[
		"TINT",
		"The generated DEFAULT tint. Prefer --itx-tint-light / -dark above for a runtime retint.",
	],
	[
		"SEEDS.colorway / SEEDS.status",
		"Adds a whole new brand or status family from one seed each. Solved, then emitted as numbers.",
	],
];

/* ── Reading the real defaults ────────────────────────────────────────── */

/**
 * The default for `token`, from the library source.
 *
 * Declaration first; failing that the structural fallback, which is a
 * legitimate home for a constant the theme has no opinion about —
 * --itx-button-touch-target has no declaration anywhere, only
 * `var(--itx-button-touch-target, 2.75rem)` inside a coarse-pointer block.
 */
function readDefault(file, token) {
	const raw = decomment(readFileSync(join(STYLES, file), "utf8"));

	const declared = readDeclaration(raw, token);
	if (declared !== null) return declared;

	const fallback = readFallback(raw, token);
	if (fallback !== null) return fallback;

	throw new Error(
		`${token} is neither declared nor given a fallback in ${file} — the starter would ship a stale default`,
	);
}

/**
 * Every at-rule block in `file` that re-declares `token`, as {prelude, value}.
 *
 * This exists because of a trap the first version of this file walked straight
 * into. The library honours prefers-reduced-motion and prefers-contrast by
 * re-declaring a token inside an @media block — but it does so from inside a
 * cascade layer, at zero specificity. A consumer's copy of the starter is
 * UNLAYERED, so it beats every layered rule no matter what, media query or not.
 * Emitting `--itx-duration-base: 200ms` on its own would therefore switch off
 * reduced motion for every user of that app, silently.
 *
 * So any knob with a preference override carries that override with it.
 */
const overridesFor = (file, token) =>
	readOverrides(decomment(readFileSync(join(STYLES, file), "utf8")), token);

/** Confirm a build-time signpost still points at something real. */
function assertConfigKeyExists(key) {
	const src = readFileSync(LADDER_SCRIPT, "utf8");
	const ident = key.split(/[.\[]/)[0].trim();
	if (!new RegExp(`\\b(const|let)\\s+${ident}\\b`).test(src)) {
		throw new Error(
			`build-time signpost "${key}" names ${ident}, which no longer exists in generate-color-ladder.mjs`,
		);
	}
}

/* ── Emit ─────────────────────────────────────────────────────────────── */

const wrap = (text, prefix) =>
	text
		.split("\n")
		.map((l) => (l ? `${prefix}${l}` : prefix.trimEnd()))
		.join("\n");

/** A comment block: `/* ` opens the first line, the rest align under it. */
const comment = (text, indent = "\t") => {
	const lines = text.split("\n");
	if (lines.length === 1) return `${indent}/* ${lines[0]} */`;
	return [
		`${indent}/* ${lines[0]}`,
		...lines.slice(1, -1).map((l) => `${indent}   ${l}`),
		`${indent}   ${lines[lines.length - 1]} */`,
	].join("\n");
};

function build() {
	const out = [];

	out.push(`/*
 * Interop — global starter.
 *
 * GENERATED by scripts/generate-starter.mjs. Every default below is read from
 * the library source, so this file cannot drift from what Interop actually
 * ships. Regenerate rather than hand-editing the copy in this repo.
 *
 * ── Using it ──────────────────────────────────────────────────────────────
 *
 * Copy this file into your app and import it AFTER Interop:
 *
 *   @import "interop/styles/interop.css";
 *   @import "interop/styles/themes/protocol.css";
 *   @import "./interop.starter.css";
 *
 * Every declaration is set to Interop's current default, so dropping it in
 * changes nothing. Edit the ones you care about and delete the rest — what you
 * keep, you pin, including against future changes to that default.
 *
 * ── Two things worth knowing ─────────────────────────────────────────────
 *
 * Every value below is a plain length, colour or number, which is the safe
 * case. The moment you rewrite one in terms of ANOTHER token, where you declare
 * it starts to matter — a custom property is substituted on the element it is
 * declared on, so it can freeze there. The Radius section explains that in full;
 * the same reasoning applies to any knob you rewrite.
 *
 * You can override any of these anywhere, not just here — they are plain
 * inherited custom properties, so setting one on a section restyles that
 * subtree. This file is the place for app-wide intent, not the only place.
 */
`);

	for (const group of GROUPS) {
		out.push(
			`\n/* ── ${group.title} ${"─".repeat(Math.max(0, 68 - group.title.length))} */`,
		);
		out.push(`/*\n${wrap(group.blurb, " * ")}\n */\n`);

		// Group knobs by selector set so the file reads as few blocks, not many.
		const bySelector = new Map();
		for (const k of group.knobs) {
			if (!bySelector.has(k.on)) bySelector.set(k.on, []);
			bySelector.get(k.on).push(k);
		}

		for (const [selector, knobs] of bySelector) {
			out.push(`${selector} {`);
			for (const [i, k] of knobs.entries()) {
				if (i) out.push("");
				out.push(comment(k.note));
				out.push(`\t${k.token}: ${readDefault(k.from, k.token)};`);
			}
			out.push("}\n");

			/* Preference overrides must be restated, or the block above silently
			   outranks them — see readOverrides(). */
			for (const k of knobs) {
				for (const o of overridesFor(k.from, k.token)) {
					out.push(
						`/* Keeps ${k.token} honouring this preference. Your declaration above is\n` +
							`   unlayered, so it outranks the library's own copy of this rule — which\n` +
							`   would otherwise switch the behaviour off for everyone. Keep it. */`,
					);
					out.push(
						`${o.prelude} {\n\t${selector.replace(/\n/g, "\n\t")} {\n\t\t${k.token}: ${o.value};\n\t}\n}\n`,
					);
				}
			}

			if (group.after) out.push(group.after + "\n");
		}
	}

	out.push(`\n/* ── Levers that are markup, not CSS ${"─".repeat(35)} */
/*
 * These are attributes you put on elements. They are listed here because this
 * is where people will look for them, not because they belong in a stylesheet.
 *`);
	for (const [attr, where, why] of ATTRIBUTES) {
		out.push(` *   ${attr}`);
		out.push(` *     ${where} — ${why}`);
	}
	out.push(" */\n");

	out.push(`\n/* ── Not reachable from CSS ${"─".repeat(44)} */
/*
 * These change the colour system's SHAPE, and they are config in
 * scripts/generate-color-ladder.mjs rather than custom properties. Edit that
 * file and re-run it; every dial there is validated, so the worst case is a
 * non-zero exit rather than a quietly inaccessible palette.
 *`);
	for (const [key, why] of BUILD_TIME) {
		assertConfigKeyExists(key);
		out.push(` *   ${key}`);
		out.push(`${wrap(why, " *     ")}`);
	}
	out.push(" */\n");

	out.push(`\n/* ── Do not set these ${"─".repeat(50)} */
/*
 * --itx-surface, --itx-surface-above, --itx-surface-below, --itx-contrast-1..6
 *
 * They are a SOURCE, never an override point. The elevation engine re-declares
 * every one of them at each layer boundary, so a value you set here is stomped
 * the moment it crosses into any component that declares a layer. This is
 * asserted as a negative case in tokens/elevation.spec.ts so the reason stays
 * visible.
 *
 * To move the palette, use --itx-tint-light / --itx-tint-dark above, or any
 * --itx-ramp-* number. Both reach every layer below.
 *
 * To restyle ONE component, use its own namespace — --itx-dialog-background,
 * --itx-button-foreground — which no layer block touches.
 */
`);

	return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

const css = build();

if (process.argv.includes("--check")) {
	let current = null;
	try {
		current = readFileSync(OUT, "utf8");
	} catch {
		console.error(
			"✗ styles/interop.starter.css is missing — run: node scripts/generate-starter.mjs",
		);
		process.exit(1);
	}
	if (current !== css) {
		console.error(
			"✗ styles/interop.starter.css is stale — a default changed in the library.\n  Run: node scripts/generate-starter.mjs",
		);
		process.exit(1);
	}
	console.log(
		"✓ starter is current — every default matches the library source",
	);
	process.exit(0);
}

writeFileSync(OUT, css);
const knobCount = GROUPS.reduce((n, g) => n + g.knobs.length, 0);
console.log(
	`✓ wrote styles/interop.starter.css — ${knobCount} knobs across ${GROUPS.length} groups,`,
);
console.log(
	`  ${ATTRIBUTES.length} attribute levers, ${BUILD_TIME.length} build-time dials signposted`,
);
