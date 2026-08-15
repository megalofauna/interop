#!/usr/bin/env node
/*
 * Colour ladder generator.
 *
 * Emits the two-axis ramp that the layer engine (styles/tokens/elevation.css)
 * reads, and validates every value against its contrast floor. One script owns
 * both, so the validator can never drift from the thing it validates.
 *
 * ── The two axes ──────────────────────────────────────────────────────────
 *
 * ELEVATION is the neutral substrate a component stands on. It moves toward
 * LIGHT in both schemes: the light page is a mid-grey climbing to white, the
 * dark page is near-black climbing to charcoal. Its lightness table is
 * art-directed (below) — perceptual ramps are not a formula, and the light
 * steps have to decelerate as they run out of headroom under white.
 *
 * CONTRAST is everything applied on top of that substrate — washes, dividers,
 * borders, icons, text. It moves AWAY from the current surface toward the
 * foreground pole: darker in light, lighter in dark. It is NOT art-directed.
 * Each rank is SOLVED for its contrast floor against its own surface, and
 * pushed only as far as that floor requires — no further. That is what makes a
 * rank portable across layers and (later) across hues: rank 3 means "3:1
 * against whatever I am sitting on", not "this particular grey".
 *
 * Because ranks are solved per surface rather than tabulated once, running out
 * of headroom resolves itself: at dark layer 4 the surface is light enough that
 * rank 4 simply lands higher up. It only fails if even the pole cannot reach
 * the floor, and then it fails loudly here rather than in QA.
 *
 * Usage:
 *   node scripts/generate-color-ladder.mjs          write the CSS + print report
 *   node scripts/generate-color-ladder.mjs --check  validate only, write nothing
 *
 * ── What is safe to change ────────────────────────────────────────────────
 *
 * Everything in the CONFIGURATION block is a dial, and every dial is checked.
 * Turn one, run the script, and it either prints a new ladder or tells you
 * which rank stopped clearing its floor. You cannot quietly make the system
 * inaccessible from up there; the worst case is a non-zero exit.
 *
 *   RAMP.<scheme>.page   Move the whole scheme up or down. The biggest lever.
 *   RAMP.<scheme>.up     Step size going up. This is the "layers feel too far
 *                        apart" dial.
 *   RAMP.<scheme>.ease   Deceleration. 1 = uniform steps.
 *   RAMP.<scheme>.down   Step size going down (sinks).
 *   RAMP.<scheme>.max    Ceiling. Raising dark's past ~.44 WILL fail: rank 5
 *                        cannot reach 7:1 from there even against pure white.
 *   DEPTH.above/.below   How many layers exist. Costs nothing but file size —
 *                        the engine unrolls to match automatically.
 *   TINT                 Chroma + hue of the neutrals, per scheme. This is the
 *                        temperature of the entire product.
 *   RANKS[].ratio        A rank's contrast floor. Raising one re-solves it on
 *                        every layer at once.
 *   RANKS[].delta        Rank 1 only: how strong a wash is.
 *   RANKS[6].pole        Where "maximum" sits.
 *   MIN_SURFACE_STEP     How far apart adjacent layers must read.
 *
 * Adding a RANK entry is also safe — the engine emits one more token per layer
 * and the solver handles it. Removing one is not: components reference
 * --itx-contrast-N by number, so run the axis lint afterwards.
 *
 * ── What not to touch ─────────────────────────────────────────────────────
 *
 * Below the configuration block is mechanism, not taste: the OKLCH → sRGB
 * matrices, the luminance round-trip, the solver, and the emitters. The one
 * that looks most editable and is not is `tokenSet()` — the repetition there is
 * load-bearing (see its comment), not verbosity to be tidied away.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Theme layer — the colour VALUES. */
const OUT_LADDER = join(REPO, "projects/interop/src/lib/styles/themes/protocol/ladder.css");
/** Foundation layer — the MECHANIC that selects which values apply. */
const OUT_ENGINE = join(REPO, "projects/interop/src/lib/styles/tokens/elevation.css");
/**
 * The same two files as importable strings, so the spec can exercise the REAL
 * generated CSS instead of a hand-copied replica that could drift from it.
 * Not reachable from public-api, so it never lands in the published bundle.
 */
const OUT_SOURCE = join(REPO, "projects/interop/src/lib/styles/tokens/ladder.css-source.ts");

/* ── Configuration ──────────────────────────────────────────────────────── */

/*
 * Light enters IBM Carbon's real grey ramp from the BOTTOM instead of the top —
 * #e0e0e0 / #e8e8e8 / #f4f4f4 / #ffffff — so we use the same greys the borrow
 * rounds already match against, travelling the other way. That is what removes
 * the polarity conflict every carbon-borrow had to invert by hand.
 */

/**
 * How deep the ladder goes in each direction. Changing these changes how many
 * @container blocks the engine emits; everything downstream follows.
 */
const DEPTH = { below: 2, above: 4 };

/**
 * The ramp SPEC — five numbers per scheme, not a hand-kept table of seven.
 *
 *   page   where layer 0 sits. The most consequential number in this file.
 *   up     the first step away from the page, upward (elevation).
 *   ease   what each successive up-step is multiplied by. 1 = uniform,
 *          < 1 decelerates (light needs this — it is running out of room under
 *          white), > 1 accelerates.
 *   down   step below the page. Uniform: sinking has no ceiling to crowd, and
 *          it gains contrast against text rather than losing it.
 *   min/max hard stops. `max` on dark is not taste — above about L .44 rank 5
 *          cannot reach 7:1 even against pure white, so the ladder has to end.
 *
 * The dark page sits at .20, near the .22 this house has always used — NOT at
 * Carbon's #161616 (.13). Carbon's page is that dark because its layers step
 * DOWN from white in its light theme and it needs the room; ours step up in both
 * schemes, so anchoring that low just makes the page murky and cramps the lift.
 *
 * Dark step size is under review — see "Step size" on the demo's
 * Foundations → Colour page, which renders candidates nested rather than
 * adjacent, because nesting is how layers actually appear and adjacency
 * flatters a ramp.
 */
const RAMP = {
	// Light has only .102 of room between the page and white for four steps, so
	// `ease` cannot be aggressive: at .87 the last step compresses to .018 and
	// trips the separation guard. .95 decelerates enough to feel like it is
	// approaching a ceiling while keeping every step ≥ .02.
	light: { page: 0.898, up: 0.028, ease: 0.95, down: 0.043, min: 0.6, max: 1.0 },
	dark: { page: 0.2, up: 0.0375, ease: 1.0, down: 0.045, min: 0.03, max: 0.44 },
};

const round3 = (n) => Math.round(n * 1000) / 1000;

/** Expand a ramp spec into the per-layer lightness table. */
function buildRamp(spec) {
	const out = { 0: round3(spec.page) };

	let l = spec.page;
	let step = spec.up;
	for (let i = 1; i <= DEPTH.above; i++) {
		l = Math.min(spec.max, l + step);
		out[i] = round3(l);
		step *= spec.ease;
	}

	l = spec.page;
	for (let i = 1; i <= DEPTH.below; i++) {
		l = Math.max(spec.min, l - spec.down);
		out[`n${i}`] = round3(l);
	}

	return out;
}

const SURFACES = { light: buildRamp(RAMP.light), dark: buildRamp(RAMP.dark) };

/** Ramp keys, deepest sink first. Derived, so DEPTH is the only place to edit. */
const LAYERS = [
	...Array.from({ length: DEPTH.below }, (_, i) => `n${DEPTH.below - i}`),
	...Array.from({ length: DEPTH.above + 1 }, (_, i) => `${i}`),
];

/** Chroma + hue for the neutral family. Tiny chroma keeps greys from going dead. */
const TINT = {
	light: { c: 0.006, h: 250 },
	dark: { c: 0.006, h: 250 },
};

/**
 * The rank ladder. `ratio` is a WCAG contrast floor against the rank's own
 * surface; the solver finds the CLOSEST lightness that clears it.
 *
 * Rank 1 is not a contrast target — a wash only has to be perceptible, so it is
 * specified as a lightness delta and then checked against a floor.
 * Rank 6 is not a target either — it is the pole, as far as the scheme goes.
 */
const RANKS = [
	{ rank: 1, intent: "wash — hover fills, stripes", delta: { light: 0.038, dark: 0.05 }, minDeltaL: 0.02 },
	{ rank: 2, intent: "hairline, dividers", ratio: 1.5 },
	{ rank: 3, intent: "border, emphasis edge", ratio: 3.0 },
	{ rank: 4, intent: "secondary text", ratio: 4.5 },
	{ rank: 5, intent: "body text", ratio: 7.0 },
	// The pole is set to the old --itx-neutral-12, which is where this house has
	// always put primary text (~15:1). Keeping it there makes the conversion of
	// --itx-on-surface appearance-preserving instead of harsher, and leaves rank
	// 5 as the softer body-text option rather than an unused notch.
	{ rank: 6, intent: "maximum", pole: { light: 0.15, dark: 0.92 } },
];

/** Minimum lightness separation between adjacent surfaces, so layers read apart. */
const MIN_SURFACE_STEP = 0.02;

/* ── Colour maths: OKLCH → sRGB → WCAG relative luminance ───────────────── */

const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** OKLCH → linear sRGB. Björn Ottosson's matrices. */
function oklchToLinearSrgb(L, C, H) {
	const hRad = (H * Math.PI) / 180;
	const a = C * Math.cos(hRad);
	const b = C * Math.sin(hRad);

	const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = L - 0.0894841775 * a - 1.291485548 * b;

	const l = l_ * l_ * l_;
	const m = m_ * m_ * m_;
	const s = s_ * s_ * s_;

	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	];
}

const encodeGamma = (u) => (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);
const decodeGamma = (u) => (u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4));

/**
 * WCAG relative luminance of an OKLCH colour, as it would actually be DISPLAYED.
 *
 * Round-trips through gamut clipping, gamma encoding and 8-bit quantisation
 * before linearising again, so the number matches what a contrast checker reads
 * off the screen rather than an idealised value the display cannot show.
 */
function luminance(L, C, H) {
	const linear = oklchToLinearSrgb(L, C, H);
	const [r, g, b] = linear.map((u) => decodeGamma(Math.round(clamp01(encodeGamma(clamp01(u))) * 255) / 255));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (y1, y2) => {
	const [hi, lo] = y1 >= y2 ? [y1, y2] : [y2, y1];
	return (hi + 0.05) / (lo + 0.05);
};

/* ── The solver ─────────────────────────────────────────────────────────── */

/**
 * Smallest movement away from `surfaceL` (toward the scheme's foreground pole)
 * that clears `target` contrast. Returns null when even the pole cannot.
 *
 * Binary search rather than a closed form: luminance is not analytically
 * invertible once gamut clipping and 8-bit quantisation are in the loop, and
 * those are exactly what make the answer true on a real screen.
 */
function solveRank(surfaceL, target, dir, { c, h }) {
	const surfaceY = luminance(surfaceL, c, h);
	const poleL = dir > 0 ? 1 : 0;

	if (contrast(luminance(poleL, c, h), surfaceY) < target) return null;

	let near = surfaceL;
	let far = poleL;
	for (let i = 0; i < 40; i++) {
		const mid = (near + far) / 2;
		if (contrast(luminance(mid, c, h), surfaceY) >= target) far = mid;
		else near = mid;
	}

	// Round AWAY from the surface. Rounding to 3dp moves L by up to 0.0005, which
	// is enough to drop the ratio ~0.02 below its floor — so round in the
	// direction that can only ever add contrast, never remove it.
	const snapped = dir > 0 ? Math.ceil(far * 1000) / 1000 : Math.floor(far * 1000) / 1000;
	return clamp01(snapped);
}

/* ── Build the ladder ───────────────────────────────────────────────────── */

const findings = [];

function buildScheme(scheme) {
	const dir = scheme === "light" ? -1 : 1; // contrast moves away from the surface
	const tint = TINT[scheme];
	const out = {};

	for (const layer of LAYERS) {
		const surfaceL = SURFACES[scheme][layer];
		const surfaceY = luminance(surfaceL, tint.c, tint.h);
		out[layer] = { surface: surfaceL, ranks: {} };

		for (const spec of RANKS) {
			let L;

			if (spec.delta) {
				L = clamp01(surfaceL + dir * spec.delta[scheme]);
			} else if (spec.pole) {
				// The pole is a fixed point, but the solved ranks climb as the surface
				// rises — so on high layers a fixed pole can end up with LESS contrast
				// than rank 5, inverting the ladder. Rank 6 is "maximum", so it takes
				// whichever is further from the surface.
				const prior = out[layer].ranks[spec.rank - 1]?.L ?? spec.pole[scheme];
				L = dir > 0 ? Math.max(spec.pole[scheme], prior) : Math.min(spec.pole[scheme], prior);
			} else {
				L = solveRank(surfaceL, spec.ratio, dir, tint);
				if (L === null) {
					findings.push(
						`${scheme} layer ${layer}: rank ${spec.rank} cannot reach ${spec.ratio}:1 ` +
							`against surface L ${surfaceL} — even the pole tops out at ` +
							`${contrast(luminance(dir > 0 ? 1 : 0, tint.c, tint.h), surfaceY).toFixed(2)}:1`,
					);
					L = dir > 0 ? 1 : 0;
				}
			}

			const ratio = contrast(luminance(L, tint.c, tint.h), surfaceY);

			if (spec.minDeltaL && Math.abs(L - surfaceL) < spec.minDeltaL) {
				findings.push(
					`${scheme} layer ${layer}: rank ${spec.rank} is only ` +
						`${Math.abs(L - surfaceL).toFixed(3)} L from its surface (needs ${spec.minDeltaL})`,
				);
			}
			if (spec.ratio && ratio < spec.ratio) {
				findings.push(
					`${scheme} layer ${layer}: rank ${spec.rank} lands at ${ratio.toFixed(2)}:1, ` +
						`under its ${spec.ratio}:1 floor`,
				);
			}

			out[layer].ranks[spec.rank] = { L, ratio };
		}
	}

	// Adjacent surfaces must read apart.
	for (let i = 1; i < LAYERS.length; i++) {
		const a = SURFACES[scheme][LAYERS[i - 1]];
		const b = SURFACES[scheme][LAYERS[i]];
		if (Math.abs(b - a) < MIN_SURFACE_STEP) {
			findings.push(
				`${scheme}: surfaces ${LAYERS[i - 1]} and ${LAYERS[i]} are only ` +
					`${Math.abs(b - a).toFixed(3)} L apart (needs ${MIN_SURFACE_STEP})`,
			);
		}
	}

	return out;
}

const ladder = { light: buildScheme("light"), dark: buildScheme("dark") };

/* ── Emit ───────────────────────────────────────────────────────────────── */

/**
 * The theme publishes bare LIGHTNESS NUMBERS, not finished colours.
 *
 * If it published `light-dark(oklch(0.93 var(--itx-tint-light)), …)`, that
 * oklch() would be composed at [interop-root] — where the token is declared —
 * and `var(--itx-tint-*)` would bake there. Setting the tint on any other
 * ancestor would then do nothing, because a custom property is substituted where
 * it is DECLARED and cannot re-evaluate further down.
 *
 * Publishing numbers moves the composition into the layer blocks, which are
 * re-declared at every boundary. Lightness AND tint both stay live, so either
 * can be overridden on any ancestor and every layer below follows. The theme
 * still owns the values; it just hands them over before they set.
 */
const numbers = (name, lightL, darkL) => [
	`\t--itx-ramp-${name}-light: ${lightL.toFixed(3)};`,
	`\t--itx-ramp-${name}-dark: ${darkL.toFixed(3)};`,
];

function emit() {
	const lines = [
		"/*",
		" * Colour ladder — GENERATED, do not edit by hand.",
		" *",
		" *   node scripts/generate-color-ladder.mjs",
		" *",
		" * Surfaces are art-directed; contrast ranks are solved against their own",
		" * surface for a contrast floor. See the script for the reasoning, and",
		" * .agent/color.md for the model.",
		" *",
		" * Both schemes live in one light-dark() per token. That is not a style",
		" * choice: color-scheme is `light dark` on [interop-root], and while it",
		" * computes to that, nothing in CSS can observe which scheme is actually in",
		" * use — not @supports, not a style query, not @container. Only light-dark()",
		" * knows. So scheme-varying NUMBERS have to ride inside a colour function.",
		" *",
		" * Chroma and hue stay live via the tint packs, so a whole-palette retint is",
		" * one declaration on any ancestor. Lightness is baked per layer.",
		" */",
		"",
		":where([interop-root]) {",
		"\t/* ── Tint packs — chroma + hue, per scheme. The retint knob. ────── */",
		`\t--itx-tint-light: ${TINT.light.c} ${TINT.light.h};`,
		`\t--itx-tint-dark: ${TINT.dark.c} ${TINT.dark.h};`,
		"",
		"\t/* ── Elevation: the neutral substrate ───────────────────────────── */",
	];

	for (const layer of LAYERS) {
		lines.push(...numbers(`surface-${layer}`, ladder.light[layer].surface, ladder.dark[layer].surface));
	}

	for (const spec of RANKS) {
		lines.push("");
		lines.push(
			`\t/* ── Contrast rank ${spec.rank} — ${spec.intent} ` +
				`${"─".repeat(Math.max(0, 34 - spec.intent.length))} */`,
		);
		for (const layer of LAYERS) {
			const l = ladder.light[layer].ranks[spec.rank];
			const d = ladder.dark[layer].ranks[spec.rank];
			const [a, b] = numbers(`contrast-${spec.rank}-${layer}`, l.L, d.L);
			lines.push(`${a} /* ${l.ratio.toFixed(2)}:1 on its surface */`);
			lines.push(`${b} /* ${d.ratio.toFixed(2)}:1 on its surface */`);
		}
	}

	lines.push("}", "");
	return lines.join("\n");
}

/* ── Emit: the engine ───────────────────────────────────────────────────── */

const LAYER_MIN = -DEPTH.below;
const LAYER_MAX = DEPTH.above;

/** Integer layer → ramp key, clamped at both terminals. */
const key = (i) => {
	const c = Math.min(LAYER_MAX, Math.max(LAYER_MIN, i));
	return c < 0 ? `n${-c}` : `${c}`;
};

/**
 * The full token set for one layer. Every layer block must re-declare ALL of it:
 * a custom property is substituted at the element where it is declared, so a
 * value written once at the root cannot re-evaluate further down. There is no
 * late binding for custom properties in CSS. This repetition IS the mechanism.
 */
function tokenSet(i, indent) {
	const t = "\t".repeat(indent);

	/** Compose the colour HERE, so lightness and tint both stay overridable. */
	const compose = (name) =>
		`light-dark(\n${t}\toklch(var(--itx-ramp-${name}-light) var(--itx-tint-light)),\n` +
		`${t}\toklch(var(--itx-ramp-${name}-dark) var(--itx-tint-dark))\n${t})`;

	const out = [`${t}--itx-layer: ${i};`];
	out.push(`${t}--itx-surface: ${compose(`surface-${key(i)}`)};`);
	out.push(`${t}--itx-surface-above: ${compose(`surface-${key(i + 1)}`)};`);
	out.push(`${t}--itx-surface-above-2: ${compose(`surface-${key(i + 2)}`)};`);
	out.push(`${t}--itx-surface-below: ${compose(`surface-${key(i - 1)}`)};`);
	for (const spec of RANKS) {
		out.push(`${t}--itx-contrast-${spec.rank}: ${compose(`contrast-${spec.rank}-${key(i)}`)};`);
	}
	return out.join("\n");
}

function emitEngine() {
	const L = [
		"/*",
		" * Layer engine — GENERATED, do not edit by hand.",
		" *",
		" *   node scripts/generate-color-ladder.mjs",
		" *",
		" * Two axes, and the notation keeps them apart on sight:",
		" *",
		" *   ELEVATION  --itx-surface / -above / -above-2 / -below.",
		" *              Spatial words, never a bare number. The neutral substrate.",
		" *              Moves toward light in BOTH schemes.",
		" *",
		" *   CONTRAST   --itx-contrast-1 … -6.",
		" *              A bare scalar, never a spatial word. Everything applied on",
		" *              top — washes, dividers, borders, icons, text. Moves AWAY",
		" *              from the current surface, so it flips per scheme.",
		" *",
		" * A rank is a contrast TARGET against its own surface, not a grey. That is",
		" * why it stays correct at every depth without anyone re-picking it.",
		" *",
		" * ── Why this file looks the way it does ─────────────────────────────────",
		" *",
		" * An inherited custom property CANNOT increment itself. `--x: calc(var(--x)",
		" * + 1)` is a self-cycle, and a chain of slots re-declared in one block all",
		" * resolve against the SAME element, so it collapses to whichever slot the",
		" * block did not redeclare. The previous sliding-window implementation did",
		" * exactly that and never worked; see the spec beside this file.",
		" *",
		" * @container style() is the way out: a container query is evaluated against",
		" * the nearest ANCESTOR container, never the element itself, so there is no",
		" * cycle. Every element is a style container by default, so no container-type",
		" * is needed, and because --itx-layer inherits it compounds correctly through",
		" * arbitrary intermediate DOM.",
		" *",
		" * Three tiers, in source order — everything is :where() zero-specificity and",
		" * @container adds none, so later simply wins:",
		" *",
		" *   1. Layer 0, unconditional. NOT inside @container: if [interop-root] is",
		" *      <html> it has no ancestor container and the query is never known.",
		" *   2. A one-step floor for [itx-layer] / [itx-sink]. Browsers without style",
		" *      queries stop here — one step, not compounding, which is a defensible",
		" *      degradation rather than a broken page.",
		" *   3. The counter, unrolled. Overrides tier 2 wherever it is supported.",
		" *",
		" * Absolute pins come last so they outrank the counter — a dialog must not",
		" * inherit its depth from wherever it happens to sit in the DOM.",
		" *",
		" * If toggle() ever ships, tiers 2 and 3 collapse to one declaration:",
		" *   --itx-layer: toggle(0, 1, 2, 3, 4);",
		" */",
		"",
		"@property --itx-layer {",
		'\tsyntax: "<integer>";',
		"\tinherits: true;",
		"\tinitial-value: 0;",
		"}",
		"",
		"/*",
		" * Registered as <color> deliberately. An unregistered custom property that",
		" * goes invalid becomes the guaranteed-invalid value, which INHERITS and takes",
		" * the whole subtree down with it. Registered, a broken layer degrades to the",
		" * parent surface instead — and surfaces become transition-able between layers.",
		" */",
		"@property --itx-surface {",
		'\tsyntax: "<color>";',
		"\tinherits: true;",
		"\tinitial-value: transparent;",
		"}",
		"",
		"/* ── Tier 1 — layer 0, unconditional ─────────────────────────────────── */",
		"",
		":where([interop-root]) {",
		tokenSet(0, 1),
		"",
		"\tbackground-color: var(--itx-surface);",
		"\tcolor: var(--itx-contrast-6);",
		"",
		"\t/* ── Z-index scale ───────────────────────────────────────────────── */",
		"\t--itx-z-dropdown: 1000;",
		"\t--itx-z-sticky: 1020;",
		"\t--itx-z-fixed: 1030;",
		"}",
		"",
		"/* ── Tier 2 — progressive-enhancement floor (no style queries) ───────── */",
		"",
		":where([itx-layer]) {",
		tokenSet(1, 1),
		"}",
		"",
		":where([itx-sink]) {",
		tokenSet(-1, 1),
		"}",
		"",
		"/* ── Tier 3 — the counter. Strictly monotone up the tree, so never a cycle. */",
		"",
	];

	for (let ancestor = LAYER_MIN; ancestor <= LAYER_MAX; ancestor++) {
		const raise = Math.min(LAYER_MAX, ancestor + 1);
		const sink = Math.max(LAYER_MIN, ancestor - 1);
		// A terminal block re-asserts its layer WITHOUT moving. Without it, an
		// element already at the ceiling matches no counter block, falls through
		// to the tier-2 floor, and snaps back to layer 1.
		const clamped = " /* terminal — re-asserts without moving */";

		L.push(`@container style(--itx-layer: ${ancestor}) {`);
		L.push(`\t:where([itx-layer]) {${raise === ancestor ? clamped : ""}`);
		L.push(tokenSet(raise, 2));
		L.push("\t}");
		L.push("");
		L.push(`\t:where([itx-sink]) {${sink === ancestor ? clamped : ""}`);
		L.push(tokenSet(sink, 2));
		L.push("\t}");
		L.push("}");
		L.push("");
	}

	L.push("/* ── Absolute pins — last, so they outrank the counter ───────────────── */");
	L.push("");
	for (let i = LAYER_MIN; i <= LAYER_MAX; i++) {
		L.push(`:where([itx-layer="${i}"]) {`);
		L.push(tokenSet(i, 1));
		L.push("}");
		L.push("");
	}

	L.push("/* ── Paint. Zero specificity, so any consumer rule wins on contact. ──── */");
	L.push("");
	L.push(":where([itx-layer], [itx-sink]) {");
	L.push("\tbackground-color: var(--itx-surface);");
	L.push("\tcolor: var(--itx-contrast-6);");
	L.push("}");
	L.push("");

	return L.join("\n");
}

/* ── Report ─────────────────────────────────────────────────────────────── */

function report() {
	const rows = [];
	for (const scheme of ["light", "dark"]) {
		rows.push(`\n  ${scheme.toUpperCase()}`);
		rows.push(`  layer  surface   ${RANKS.map((r) => `r${r.rank}`.padStart(13)).join("")}`);
		for (const layer of LAYERS) {
			const cell = ladder[scheme][layer];
			const ranks = RANKS.map((r) => {
				const { L, ratio } = cell.ranks[r.rank];
				return `${L.toFixed(3)}/${ratio.toFixed(1)}:1`.padStart(13);
			}).join("");
			rows.push(`  ${layer.padEnd(6)} ${cell.surface.toFixed(3)}    ${ranks}`);
		}
	}
	return rows.join("\n");
}

const check = process.argv.includes("--check");

console.log("Colour ladder — lightness / measured contrast against own surface");
console.log(report());

if (findings.length) {
	console.error(`\n✗ ${findings.length} contrast failure${findings.length === 1 ? "" : "s"}:`);
	for (const f of findings) console.error(`  ${f}`);
	process.exit(1);
}

console.log("\n✓ every rank clears its floor; every adjacent surface pair reads apart");

if (!check) {
	const ladderCss = emit();
	const engineCss = emitEngine();
	const asModule =
		"/* GENERATED — node scripts/generate-color-ladder.mjs. Test fixture only. */\n" +
		`export const LADDER_CSS = ${JSON.stringify(ladderCss)};\n\n` +
		`export const ENGINE_CSS = ${JSON.stringify(engineCss)};\n`;

	for (const [path, contents] of [
		[OUT_LADDER, ladderCss],
		[OUT_ENGINE, engineCss],
		[OUT_SOURCE, asModule],
	]) {
		writeFileSync(path, contents);
		console.log(`✓ wrote ${path.replace(REPO + "/", "")}`);
	}
}
