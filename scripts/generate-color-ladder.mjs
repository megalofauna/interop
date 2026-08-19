#!/usr/bin/env node
/*
 * Colour ladder generator.
 *
 * Emits the two-axis ramp that the layer engine (styles/tokens/elevation.css)
 * reads, and validates every value against its contrast floor. One script owns
 * both, so the validator can never drift from the thing it validates.
 *
 * It also emits a DERIVATION RECORD for the demo — the dials that were turned
 * and what the solver made of them, including the facts CSS cannot express: a
 * seed, a chroma ceiling, a lightness the solver had to abandon. Same reasoning
 * one step further out: a demonstration that hand-copies its numbers is a
 * demonstration that can be wrong about the system it is demonstrating.
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
const OUT_LADDER = join(
	REPO,
	"projects/interop/src/lib/styles/themes/protocol/ladder.css",
);
/** Foundation layer — the MECHANIC that selects which values apply. */
const OUT_ENGINE = join(
	REPO,
	"projects/interop/src/lib/styles/tokens/elevation.css",
);
/**
 * The same two files as importable strings, so the spec can exercise the REAL
 * generated CSS instead of a hand-copied replica that could drift from it.
 * Not reachable from public-api, so it never lands in the published bundle.
 */
const OUT_SOURCE = join(
	REPO,
	"projects/interop/src/lib/styles/tokens/ladder.css-source.ts",
);
/**
 * The derivation record — the dials that were turned and what the solver made
 * of them, as a typed module the demo renders. Lives in the demo rather than
 * the library because it documents the system; it is not part of it.
 */
const OUT_FACTS = join(
	REPO,
	"projects/demo/src/app/pages/color/ladder-facts.ts",
);

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
const DEPTH = { below: 4, above: 4 };

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
	light: {
		page: 0.898,
		up: 0.028,
		ease: 0.95,
		down: 0.043,
		min: 0.6,
		max: 1.0,
	},
	dark: {
		page: 0.232,
		up: 0.0395,
		ease: 1.0,
		down: 0.045,
		min: 0.03,
		max: 0.44,
	},
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
	{
		rank: 1,
		intent: "wash — hover fills, stripes",
		delta: { light: 0.038, dark: 0.05 },
		minDeltaL: 0.02,
	},
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

/**
 * Where the hue sweep probes. A default-strength seed walked round the circle,
 * to prove an arbitrary hue resolves — and to name the ones that do not.
 */
const SWEEP = {
	seedL: 0.55,
	seedC: 0.19,
	step: 15,
	/** Finer step for the gamut envelope — it is drawn as a curve, not a list. */
	envelopeStep: 5,
};

/** Minimum lightness separation between adjacent surfaces, so layers read apart. */
const MIN_SURFACE_STEP = 0.02;

/**
 * Accent families, each SEEDED WITH ONE COLOUR as [lightness, chroma, hue].
 *
 * A seed's three components are used very differently, and that asymmetry is
 * the whole point:
 *
 *   hue        carried through untouched. Every role is this hue.
 *   chroma     an INTENT, clamped to what the hue can actually reach. Blue holds
 *              .28 at L .50; teal cannot exceed .146 anywhere. Without the clamp
 *              a teal seed has no solution at any lightness.
 *   lightness  honoured for the solid where the gamut allows, moved only when it
 *              does not. The per-layer roles ignore it entirely and solve their
 *              own from contrast targets.
 *
 * That last line is why this replaces --itx-colorway-1..12. A lightness SLOT
 * cannot survive a hue change: the old amber colourway needed three hand
 * corrections (chroma bronzed at slots 6-12, the accent repointed from slot 8 to
 * 5, the label flipped to dark) and still left slot-8 consumers behind, so tree,
 * code-block, resizable and visimorph render burnt caramel while everything else
 * moves. A contrast TARGET survives, because it is a relationship rather than a
 * position.
 */
const SEEDS = {
	colorway: {
		// Jelly Bean. Replaces Science Blue #0066CC as the default.
		default: { name: "Jelly Bean", seed: [0.522, 0.11, 246.74] },
		// Cream Can. Peaks light, which is exactly what broke the slot model.
		amber: { name: "Cream Can", seed: [0.832, 0.12, 82.32] },
	},
	status: {
		seventies: {
			danger: [0.5, 0.105, 33],
			info: [0.53, 0.058, 218],
			success: [0.53, 0.078, 122],
			warning: [0.62, 0.105, 78],
		},
		eighties: {
			danger: [0.55, 0.19, 25],
			info: [0.5, 0.19, 264],
			success: [0.62, 0.19, 145],
			warning: [0.75, 0.17, 85],
		},
	},
};

/** Contrast floors for the accent roles, mirroring the neutral rank table. */
const ACCENT = {
	/** Label on a solid fill. The constraint amber failed at 1.7:1. */
	onSolid: 4.5,
	/** A wash of the hue: perceptible, not legible. */
	tint: { minDeltaL: 0.02, delta: { light: 0.05, dark: 0.06 } },
	/** Text sitting on that wash. */
	onTint: 4.5,
	/** Ring, rule, accent bar. */
	border: 3.0,
	/** Link, icon, accent text on the plain surface. */
	text: 4.5,
	/**
	 * How much of the seed's chroma must survive before the solver gives up on
	 * the seed's lightness and moves. Higher = more faithful colour, more
	 * lightness drift; lower = stays put and desaturates.
	 */
	keepChroma: 0.8,

	/**
	 * Lightness steps for the solid's hover and active states.
	 *
	 * Moved AWAY from the label, always. A light label means the fill darkens on
	 * hover; a dark label means it lightens. That is not a style preference — it
	 * guarantees the label's contrast can only improve, so a state can never
	 * quietly break what solveSolid proved about the rest state. Carbon darkens
	 * its blue primary on hover for the same reason its label is white.
	 */
	solidHover: 0.05,
	solidActive: 0.09,
};

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

const encodeGamma = (u) =>
	u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055;
const decodeGamma = (u) =>
	u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);

/**
 * WCAG relative luminance of an OKLCH colour, as it would actually be DISPLAYED.
 *
 * Round-trips through gamut clipping, gamma encoding and 8-bit quantisation
 * before linearising again, so the number matches what a contrast checker reads
 * off the screen rather than an idealised value the display cannot show.
 */
function luminance(L, C, H) {
	const linear = oklchToLinearSrgb(L, C, H);
	const [r, g, b] = linear.map((u) =>
		decodeGamma(Math.round(clamp01(encodeGamma(clamp01(u))) * 255) / 255),
	);
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
	const snapped =
		dir > 0 ? Math.ceil(far * 1000) / 1000 : Math.floor(far * 1000) / 1000;
	return clamp01(snapped);
}

/* ── Gamut ──────────────────────────────────────────────────────────────── */

const inGamut = (L, C, H) =>
	oklchToLinearSrgb(L, C, H).every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/**
 * Greatest chroma this (lightness, hue) can actually display in sRGB.
 *
 * This is the function the slot model never had. Max chroma varies enormously
 * with both arguments — blue reaches .285 at L .49 but only .048 at L .90;
 * green is the reverse — so "slot 8" is a different amount of colour in every
 * hue. Clamping here is what lets one seed drive a whole family.
 */
function maxChroma(L, H) {
	let lo = 0;
	let hi = 0.5;
	for (let i = 0; i < 30; i++) {
		const mid = (lo + hi) / 2;
		if (inGamut(L, mid, H)) lo = mid;
		else hi = mid;
	}
	return lo;
}

/** The most chroma this hue can reach at ANY lightness. */
function peakChroma(H) {
	let peak = 0;
	for (let L = 0.15; L <= 0.97; L += 0.01)
		peak = Math.max(peak, maxChroma(L, H));
	return peak;
}

/* ── The solid solver ───────────────────────────────────────────────────── */

/** Near-white and near-black, in the family's own hue, for label candidates. */
const labelPoles = (H) => [
	{ name: "light", L: 0.99, C: 0.006 },
	{ name: "dark", L: 0.18, C: 0.02 },
];

/**
 * Solve a family's solid fill and its label from one seed.
 *
 * Keeps saturation and moves lightness, rather than the reverse: a brand colour
 * that has been desaturated to hit a contrast target is no longer the brand
 * colour (amber-lab Strategy 2 produced "a barely-amber dark brown"), whereas
 * one that has shifted lightness still reads as itself. Strategy 4, adopted.
 *
 * Scheme-invariant by design. A solid that changes between light and dark is
 * not an identity, and holding it constant is what avoids dark-mode mud.
 */
function solveSolid([seedL, seedC, H], label) {
	// Advisory, not absolute — see maxChroma. Teal tops out at .146.
	const intent = Math.min(seedC, peakChroma(H));

	const attempt = (L) => {
		const C = Math.min(intent, maxChroma(L, H));
		if (C < intent * ACCENT.keepChroma) return null;

		const y = luminance(L, C, H);
		const scored = labelPoles(H)
			.map((p) => ({ ...p, ratio: contrast(luminance(p.L, p.C, H), y) }))
			.sort((a, b) => b.ratio - a.ratio);

		return scored[0].ratio >= ACCENT.onSolid
			? { L, C, label: scored[0], ratio: scored[0].ratio }
			: null;
	};

	/** Hover and active, stepped away from the label so contrast only improves. */
	const withStates = (solved) => {
		const away = solved.label.name === "light" ? -1 : 1;
		const state = (delta) => {
			const L = clamp01(solved.L + away * delta);
			const C = Math.min(intent, maxChroma(L, H));
			return { L: round3(L), C: round3(C) };
		};
		return {
			...solved,
			hover: state(ACCENT.solidHover),
			active: state(ACCENT.solidActive),
		};
	};

	const atSeed = attempt(seedL);
	if (atSeed) return withStates({ ...atSeed, moved: 0 });

	// Nearest lightness that works, searched outward so the result stays as
	// close to the seed as the gamut permits.
	for (let d = 0.005; d <= 0.6; d += 0.005) {
		for (const L of [seedL + d, seedL - d]) {
			if (L < 0.15 || L > 0.97) continue;
			const hit = attempt(L);
			if (hit) return withStates({ ...hit, moved: round3(L - seedL) });
		}
	}

	findings.push(
		`${label}: no solid clears ${ACCENT.onSolid}:1 with a label at any lightness (hue ${H})`,
	);
	return null;
}

/**
 * Solve one accent role against a surface: move away from the surface in the
 * family's hue only as far as the floor requires, keeping as much chroma as the
 * new lightness allows. Same shape as solveRank, but gamut-clamped per step.
 */
function solveAccentRole(surfaceL, surfaceC, surfaceH, H, intent, target, dir) {
	const surfaceY = luminance(surfaceL, surfaceC, surfaceH);

	let near = surfaceL;
	let far = dir > 0 ? 1 : 0;
	for (let i = 0; i < 40; i++) {
		const mid = (near + far) / 2;
		const C = Math.min(intent, maxChroma(mid, H));
		if (contrast(luminance(mid, C, H), surfaceY) >= target) far = mid;
		else near = mid;
	}

	const L = clamp01(
		dir > 0 ? Math.ceil(far * 1000) / 1000 : Math.floor(far * 1000) / 1000,
	);
	const C = Math.min(intent, maxChroma(L, H));
	return { L, C: round3(C), ratio: contrast(luminance(L, C, H), surfaceY) };
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
				L =
					dir > 0
						? Math.max(spec.pole[scheme], prior)
						: Math.min(spec.pole[scheme], prior);
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

/* ── Build the accent families ──────────────────────────────────────────── */

/** Every family that gets generated: the colourways plus each status set. */
function familyList() {
	const out = [];
	for (const [name, entry] of Object.entries(SEEDS.colorway)) {
		out.push({
			id: name === "default" ? "colorway" : `colorway-${name}`,
			role: "colorway",
			variant: name,
			// A seed may be a bare [L, C, H] or a named record. The name is
			// decoration for the demo — nothing solves differently for having one —
			// but "Jelly Bean" is a great deal easier to hold in mind than 246.74.
			name: entry.name ?? null,
			seed: entry.seed ?? entry,
		});
	}
	for (const [palette, set] of Object.entries(SEEDS.status)) {
		for (const [status, entry] of Object.entries(set)) {
			out.push({
				id: palette === "seventies" ? status : `${status}-${palette}`,
				role: status,
				variant: palette,
				name: entry.name ?? null,
				seed: entry.seed ?? entry,
			});
		}
	}
	return out;
}

/**
 * Which families get per-layer roles, and which are solved once.
 *
 * Only the colourway varies by layer. It is read everywhere and at every depth
 * — links, indicators, selected rows, focus on every component — so a tint that
 * was solved against the page is wrong inside a dialog.
 *
 * Statuses are solved against layer 0 and left there. Their consumers (toast,
 * callout, badge, field errors) are self-contained, they use one value per
 * status today, and making all eight layer-aware would multiply the emitted CSS
 * roughly sixfold for a correction nothing currently asks for. Solving against
 * the page also errs safe: a status tint carried onto a higher layer has MORE
 * contrast than its floor, not less.
 */
const perLayer = (family) => family.role === "colorway";

function buildFamily(family) {
	const [, seedC, H] = family.seed;
	const intent = Math.min(seedC, peakChroma(H));
	const solid = solveSolid(family.seed, family.id);
	if (!solid) return null;

	const layers = { light: {}, dark: {} };

	for (const scheme of ["light", "dark"]) {
		const dir = scheme === "light" ? -1 : 1;
		const tint = TINT[scheme];

		for (const layer of perLayer(family) ? LAYERS : ["0"]) {
			const surfaceL = SURFACES[scheme][layer];

			// A tint is a wash: perceptible against its surface, not legible.
			const tintL = clamp01(surfaceL + dir * ACCENT.tint.delta[scheme]);
			const tintC = Math.min(intent, maxChroma(tintL, H));
			const tintY = luminance(tintL, tintC, H);

			if (Math.abs(tintL - surfaceL) < ACCENT.tint.minDeltaL) {
				findings.push(
					`${family.id} ${scheme} layer ${layer}: tint is only ${Math.abs(tintL - surfaceL).toFixed(3)} L from its surface`,
				);
			}

			// Text ON the tint is solved against the tint, not against the surface.
			let onTint = null;
			{
				let near = tintL;
				let far = dir > 0 ? 1 : 0;
				for (let i = 0; i < 40; i++) {
					const mid = (near + far) / 2;
					const c = Math.min(intent, maxChroma(mid, H));
					if (contrast(luminance(mid, c, H), tintY) >= ACCENT.onTint) far = mid;
					else near = mid;
				}
				const L = clamp01(
					dir > 0
						? Math.ceil(far * 1000) / 1000
						: Math.floor(far * 1000) / 1000,
				);
				const C = Math.min(intent, maxChroma(L, H));
				const ratio = contrast(luminance(L, C, H), tintY);
				if (ratio < ACCENT.onTint) {
					findings.push(
						`${family.id} ${scheme} layer ${layer}: on-tint lands at ${ratio.toFixed(2)}:1, under ${ACCENT.onTint}:1`,
					);
				}
				onTint = { L, C: round3(C), ratio };
			}

			const border = solveAccentRole(
				surfaceL,
				tint.c,
				tint.h,
				H,
				intent,
				ACCENT.border,
				dir,
			);
			const text = solveAccentRole(
				surfaceL,
				tint.c,
				tint.h,
				H,
				intent,
				ACCENT.text,
				dir,
			);

			for (const [role, solved, floor] of [
				["border", border, ACCENT.border],
				["text", text, ACCENT.text],
			]) {
				if (solved.ratio < floor) {
					findings.push(
						`${family.id} ${scheme} layer ${layer}: ${role} lands at ${solved.ratio.toFixed(2)}:1, under ${floor}:1`,
					);
				}
			}

			layers[scheme][layer] = {
				tint: { L: tintL, C: round3(tintC) },
				onTint,
				border,
				text,
			};
		}
	}

	return { ...family, hue: H, intent: round3(intent), solid, layers };
}

const families = familyList().map(buildFamily).filter(Boolean);

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
		lines.push(
			...numbers(
				`surface-${layer}`,
				ladder.light[layer].surface,
				ladder.dark[layer].surface,
			),
		);
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

	// Accent declarations that belong on [interop-root] are spliced INTO this
	// block rather than opening a second one: .stylelintrc.json sets
	// no-duplicate-selectors, and stylelint is now installed and enforcing it.
	const accents = emitAccents();
	lines.push(...accents.root);
	lines.push("}", "");
	lines.push(...accents.scoped);
	return lines.join("\n");
}

/* ── Emit: accent families ──────────────────────────────────────────────── */

const ACCENT_ROLES = ["tint", "on-tint", "border", "text"];
const roleOf = (cell, role) => (role === "on-tint" ? cell.onTint : cell[role]);

/** A solved (L, C) pair as the two numbers the engine will compose. */
function accentNumbers(prefix, solved) {
	return [
		`\t--itx-ramp-${prefix}-l: ${solved.L.toFixed(3)};`,
		`\t--itx-ramp-${prefix}-c: ${solved.C.toFixed(3)};`,
	];
}

function emitAccents() {
	/** Declarations for the single [interop-root] block opened by emit(). */
	const root = [];
	/** Self-contained blocks for scoped variants. */
	const out = [];

	/**
	 * Compose a finished colour from ramp numbers.
	 *
	 * MUST be emitted in every block that declares those numbers, not once at the
	 * root. A custom property is substituted where it is DECLARED, so a variant
	 * block that re-declares only the numbers leaves the composed value frozen at
	 * whatever the root resolved — and the variant silently does nothing on any
	 * element that is not itself a root.
	 *
	 * The old status-palettes.css did not have this problem because it declared
	 * finished colours; splitting into numbers plus composition reintroduces it
	 * unless composition travels with the numbers. Same rule the layer engine
	 * follows when it re-declares its whole token set at every boundary.
	 */
	const compose = (name, role, schemeless, indent = "\t") =>
		schemeless
			? `${indent}--itx-${name}-${role}: oklch(var(--itx-ramp-${name}-${role}-l) var(--itx-ramp-${name}-${role}-c) var(--itx-${name}-hue));`
			: `${indent}--itx-${name}-${role}: light-dark(\n` +
				`${indent}\toklch(var(--itx-ramp-${name}-${role}-light-l) var(--itx-ramp-${name}-${role}-light-c) var(--itx-${name}-hue)),\n` +
				`${indent}\toklch(var(--itx-ramp-${name}-${role}-dark-l) var(--itx-ramp-${name}-${role}-dark-c) var(--itx-${name}-hue))\n${indent});`;

	const SOLID_ROLES = ["solid", "on-solid", "solid-hover", "solid-active"];

	/** The colourway ramp: per layer, per scheme. Re-declared by each variant. */
	const colorwayRamp = (family, indent = "\t") =>
		[
			`${indent}--itx-${family.role === "colorway" ? "colorway" : family.id}-hue: ${family.hue};`,
			`${indent}--itx-ramp-colorway-solid-l: ${family.solid.L.toFixed(3)};`,
			`${indent}--itx-ramp-colorway-solid-c: ${family.solid.C.toFixed(3)};`,
			`${indent}--itx-ramp-colorway-on-solid-l: ${family.solid.label.L.toFixed(3)};`,
			`${indent}--itx-ramp-colorway-on-solid-c: ${family.solid.label.C.toFixed(3)};`,
			`${indent}--itx-ramp-colorway-solid-hover-l: ${family.solid.hover.L.toFixed(3)};`,
			`${indent}--itx-ramp-colorway-solid-hover-c: ${family.solid.hover.C.toFixed(3)};`,
			`${indent}--itx-ramp-colorway-solid-active-l: ${family.solid.active.L.toFixed(3)};`,
			`${indent}--itx-ramp-colorway-solid-active-c: ${family.solid.active.C.toFixed(3)};`,
		].concat(
			LAYERS.flatMap((layer) =>
				ACCENT_ROLES.flatMap((role) =>
					["light", "dark"].flatMap((scheme) => {
						const solved = roleOf(family.layers[scheme][layer], role);
						return [
							`${indent}--itx-ramp-colorway-${role}-${layer}-${scheme}-l: ${solved.L.toFixed(3)};`,
							`${indent}--itx-ramp-colorway-${role}-${layer}-${scheme}-c: ${solved.C.toFixed(3)};`,
						];
					}),
				),
			),
			// Composition travels with the numbers — see compose().
			SOLID_ROLES.map((role) => compose("colorway", role, true, indent)),
		);

	const colorways = families.filter((f) => f.role === "colorway");
	const base = colorways.find((f) => f.variant === "default");

	root.push(
		"",
		"\t/*",
		"\t * Colourway.",
		"\t *",
		"\t * Seeded with ONE colour. Hue carries through; chroma is an intent",
		"\t * clamped to what the hue can actually reach; lightness is honoured for",
		"\t * the solid where the gamut allows and solved from contrast targets for",
		"\t * everything else. That is why this survives a hue change and a",
		"\t * lightness-indexed slot ramp did not.",
		"\t *",
		"\t * solid and on-solid are scheme-invariant on purpose: a brand colour",
		"\t * that shifts between light and dark is not an identity.",
		"\t */",
		...colorwayRamp(base),
	);

	for (const variant of colorways.filter((f) => f.variant !== "default")) {
		out.push(
			"",
			`/* Colourway: ${variant.variant}. Re-declares the same ramp numbers, so every`,
			" * consumer follows. Nothing is hand-corrected — the solver derives the",
			" * label and the gamut-clamped chroma from the seed.",
			" */",
			`:where([interop-root][itx-colorway="${variant.variant}"]) {`,
			...colorwayRamp(variant),
			"}",
		);
	}

	/** Statuses: solved once against layer 0, grouped by palette. */
	const statusOf = (palette) =>
		families.filter((f) => f.role !== "colorway" && f.variant === palette);

	const statusBlock = (family) => {
		const name = family.role;
		const rows = [
			`\t--itx-${name}-hue: ${family.hue};`,
			`\t--itx-ramp-${name}-solid-l: ${family.solid.L.toFixed(3)};`,
			`\t--itx-ramp-${name}-solid-c: ${family.solid.C.toFixed(3)};`,
			`\t--itx-ramp-${name}-on-solid-l: ${family.solid.label.L.toFixed(3)};`,
			`\t--itx-ramp-${name}-on-solid-c: ${family.solid.label.C.toFixed(3)};`,
			`\t--itx-ramp-${name}-solid-hover-l: ${family.solid.hover.L.toFixed(3)};`,
			`\t--itx-ramp-${name}-solid-hover-c: ${family.solid.hover.C.toFixed(3)};`,
			`\t--itx-ramp-${name}-solid-active-l: ${family.solid.active.L.toFixed(3)};`,
			`\t--itx-ramp-${name}-solid-active-c: ${family.solid.active.C.toFixed(3)};`,
		];
		for (const role of ACCENT_ROLES) {
			for (const scheme of ["light", "dark"]) {
				const solved = roleOf(family.layers[scheme]["0"], role);
				rows.push(...accentNumbers(`${name}-${role}-${scheme}`, solved));
			}
		}
		// Composition travels with the numbers — see compose().
		for (const role of SOLID_ROLES) rows.push(compose(name, role, true));
		for (const role of ACCENT_ROLES) rows.push(compose(name, role, false));
		return rows;
	};

	out.push(
		"",
		"/*",
		" * ── Status families ─────────────────────────────────────────────────────",
		" *",
		" * Same solver, four more seeds per palette. Solved against layer 0 rather",
		" * than per layer — see perLayer() in the generator for why.",
		" *",
		" * The labels are derived, which retires two recorded defects: warning used",
		" * to sit at 4.71:1 with 'neither much margin', and the eighties palette used",
		" * flat on-* values, the exact pattern seventies documents as a dark-mode AA",
		" * failure it already had to fix.",
		" */",
		':where([interop-root], [itx-status-palette="seventies"]) {',
		...statusOf("seventies").flatMap(statusBlock),
		"}",
		"",
		':where([itx-status-palette="eighties"]) {',
		...statusOf("eighties").flatMap(statusBlock),
		"}",
	);

	return { root, scoped: out };
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
		out.push(
			`${t}--itx-contrast-${spec.rank}: ${compose(`contrast-${spec.rank}-${key(i)}`)};`,
		);
	}

	/*
	 * Colourway roles re-derive per layer for the same reason the neutral ranks
	 * do: a tint solved against the page is wrong inside a dialog. Composed from
	 * the ramp numbers, so the active colourway (default or a scoped variant)
	 * re-points them all by re-declaring numbers, with no hand corrections.
	 *
	 * solid / on-solid are absent here on purpose — they are scheme- and
	 * layer-invariant, and live in ladder.css.
	 */
	for (const role of ACCENT_ROLES) {
		out.push(
			`${t}--itx-colorway-${role}: light-dark(\n` +
				`${t}\toklch(var(--itx-ramp-colorway-${role}-${key(i)}-light-l) var(--itx-ramp-colorway-${role}-${key(i)}-light-c) var(--itx-colorway-hue)),\n` +
				`${t}\toklch(var(--itx-ramp-colorway-${role}-${key(i)}-dark-l) var(--itx-ramp-colorway-${role}-${key(i)}-dark-c) var(--itx-colorway-hue))\n${t});`,
		);
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

	L.push(
		"/* ── Absolute pins — last, so they outrank the counter ───────────────── */",
	);
	L.push("");
	for (let i = LAYER_MIN; i <= LAYER_MAX; i++) {
		L.push(`:where([itx-layer="${i}"]) {`);
		L.push(tokenSet(i, 1));
		L.push("}");
		L.push("");
	}

	L.push(
		"/* ── Paint. Zero specificity, so any consumer rule wins on contact. ──── */",
	);
	L.push("");
	L.push(":where([itx-layer], [itx-sink]) {");
	L.push("\tbackground-color: var(--itx-surface);");
	L.push("\tcolor: var(--itx-contrast-6);");
	L.push("}");
	L.push("");

	return L.join("\n");
}

/* ── Emit: the derivation record ────────────────────────────────────────── */

/**
 * Everything the generator KNOWS, as a typed module the demo can render.
 *
 * The Colour page used to hand-mirror the RANKS table and hardcode the ramp
 * candidates, so the two drifted the moment a dial moved. Worse, the parts of
 * this system that most need showing — how far a seed had to move, how much
 * chroma the gamut ate, which hues cannot resolve at all — exist only as
 * terminal output that nobody reads.
 *
 * So this emits BOTH halves:
 *
 *   inputs   the dials, verbatim. A config file and (later) a GUI need these,
 *            and emitting them now means the extraction reads from something
 *            that already exists rather than inventing a format.
 *   solved   what those dials produced, including the intermediate facts the
 *            CSS cannot express — a seed, a chroma ceiling, a lightness the
 *            solver had to abandon.
 *
 * What is deliberately NOT here: measured contrast ratios. Those are read from
 * the shipped CSS at runtime (see the demo's contrast.ts). A ratio asserted by
 * the generator only proves the generator agrees with itself; one measured in
 * the browser proves the emitted stylesheet is right. The record supplies what
 * CSS cannot reveal; the browser supplies the rest.
 */
function emitFacts(unusable) {
	const rankFloor = (spec) =>
		spec.ratio
			? `${spec.ratio}:1`
			: spec.delta
				? `perceptible (≥ ${spec.minDeltaL} L)`
				: "as far as the scheme allows";

	const facts = {
		ranks: RANKS.map((spec) => ({
			rank: spec.rank,
			intent: spec.intent,
			floor: rankFloor(spec),
			ratio: spec.ratio ?? null,
		})),
		layerKeys: LAYERS,
		surfaces: SURFACES,
		families: families.map((f) => {
			const ceiling = round3(peakChroma(f.hue));
			return {
				id: f.id,
				role: f.role,
				variant: f.variant,
				name: f.name,
				hue: f.hue,
				perLayer: perLayer(f),
				seed: { l: f.seed[0], c: f.seed[1], h: f.seed[2] },
				// What the hue can actually reach anywhere in sRGB, what the seed
				// asked for after clamping, and the difference the gamut took.
				chromaCeiling: ceiling,
				chromaIntent: f.intent,
				chromaClamped: round3(Math.max(0, f.seed[1] - f.intent)),
				solid: {
					l: round3(f.solid.L),
					c: round3(f.solid.C),
					ratio: round3(f.solid.ratio),
					// How far the solver had to leave the seed's lightness to find a
					// label that clears its floor while keeping keepChroma of the hue.
					movedFromSeed: f.solid.moved,
					label: f.solid.label.name,
					labelL: f.solid.label.L,
					labelC: f.solid.label.C,
					hover: { l: f.solid.hover.L, c: f.solid.hover.C },
					active: { l: f.solid.active.L, c: f.solid.active.C },
				},
			};
		}),
		// A guard, not a demonstration: since `intent` is clamped to the hue's own
		// ceiling, a seed can no longer ask for chroma that does not exist, and
		// every hue passes. The evidence that the clamp EARNS its place is the
		// envelope below — the arc where the ceiling sits under a default seed.
		hueSweep: {
			seedL: SWEEP.seedL,
			seedC: SWEEP.seedC,
			step: SWEEP.step,
			failed: unusable,
		},
		hueCeilings: Array.from({ length: 360 / SWEEP.envelopeStep }, (_, i) => {
			const hue = i * SWEEP.envelopeStep;
			return { hue, peakChroma: round3(peakChroma(hue)) };
		}),
		inputs: {
			depth: DEPTH,
			ramp: RAMP,
			tint: TINT,
			accent: ACCENT,
			seeds: SEEDS,
		},
	};

	// JSON, then unquote plain identifier keys: this is a TypeScript module
	// people will read, not a payload.
	const j = (v) =>
		JSON.stringify(v, null, "\t").replace(
			/^(\s*)"([A-Za-z_$][\w$]*)":/gm,
			"$1$2:",
		);

	return `/*
 * Colour derivation record — GENERATED, do not edit by hand.
 *
 *   node scripts/generate-color-ladder.mjs
 *
 * The facts behind projects/demo's Colour page: the dials that were turned and
 * what the solver made of them. Contrast ratios are NOT here on purpose — the
 * demo measures those from the shipped CSS at runtime, so a demonstration can
 * never agree with a generator that is wrong about its own output.
 */

/** A neutral contrast rank and the floor it was solved against. */
export interface RankFact {
	readonly rank: number;
	readonly intent: string;
	/** Human-readable floor, e.g. "4.5:1". Ranks 1 and 6 are not ratio targets. */
	readonly floor: string;
	/** The numeric floor, or null where the rank is not a contrast target. */
	readonly ratio: number | null;
}

/** An (L, C) pair, as the theme publishes them. Hue travels separately. */
export interface Lc {
	readonly l: number;
	readonly c: number;
}

/** A family's solid fill: the one part of an accent that never varies. */
export interface SolidFact extends Lc {
	/** Measured contrast of the chosen label against the fill, per the solver. */
	readonly ratio: number;
	/** Lightness delta from the seed. 0 means the seed was honoured as given. */
	readonly movedFromSeed: number;
	/** Which pole won the label. Derived, never chosen. */
	readonly label: "light" | "dark";
	readonly labelL: number;
	readonly labelC: number;
	/** Stepped AWAY from the label, so a state can only improve its contrast. */
	readonly hover: Lc;
	readonly active: Lc;
}

/** One seeded accent family, and what the solver had to do to the seed. */
export interface FamilyFact {
	readonly id: string;
	readonly role: string;
	readonly variant: string;
	/** The seed's human name, where it has one. Decoration, not an input. */
	readonly name: string | null;
	readonly hue: number;
	/** Colourways re-solve per layer; statuses are solved against layer 0 only. */
	readonly perLayer: boolean;
	readonly seed: { readonly l: number; readonly c: number; readonly h: number };
	/** The most chroma this hue can reach at ANY lightness in sRGB. */
	readonly chromaCeiling: number;
	/** What the seed asked for, after clamping to that ceiling. */
	readonly chromaIntent: number;
	/** How much chroma the gamut took. Non-zero means the seed over-asked. */
	readonly chromaClamped: number;
	readonly solid: SolidFact;
}

/** Which hues resolve at a given seed strength, and which cannot. */
export interface HueSweepFact {
	readonly seedL: number;
	readonly seedC: number;
	readonly step: number;
	/** Hues with no solution at this strength — the case that motivated the clamp. */
	readonly failed: readonly number[];
}

/** The most chroma a hue can reach at any lightness. The gamut, as a curve. */
export interface HueCeiling {
	readonly hue: number;
	readonly peakChroma: number;
}

/** The dials, verbatim. The surface a config file and a live editor would bind to. */
export interface InputFacts {
	readonly depth: { readonly below: number; readonly above: number };
	readonly ramp: Record<string, Record<string, number>>;
	readonly tint: Record<string, { readonly c: number; readonly h: number }>;
	readonly accent: Record<string, unknown>;
	readonly seeds: Record<string, unknown>;
}

export const RANK_FACTS: readonly RankFact[] = ${j(facts.ranks)};

/** Ramp keys, deepest sink first — the order the ladder is emitted in. */
export const LAYER_KEYS: readonly string[] = ${j(facts.layerKeys)};

/** Surface lightness per scheme, per layer. Chroma and hue come from the tint. */
export const SURFACE_FACTS: Record<string, Record<string, number>> = ${j(facts.surfaces)};

export const FAMILY_FACTS: readonly FamilyFact[] = ${j(facts.families)};

export const HUE_SWEEP: HueSweepFact = ${j(facts.hueSweep)};

/**
 * Peak chroma per hue — the gamut, as a curve.
 *
 * This is the constraint every seed is clamped against, and the reason the
 * clamp is not theoretical: 28 of these 72 hues top out BELOW the default .19
 * seed strength, bottoming at .145 around hue 215. A teal seeded at .19 has no
 * solution at any lightness, which is precisely what it used to return.
 */
export const HUE_CEILINGS: readonly HueCeiling[] = ${j(facts.hueCeilings)};

export const INPUT_FACTS: InputFacts = ${j(facts.inputs)};
`;
}

/* ── Report ─────────────────────────────────────────────────────────────── */

function report() {
	const rows = [];
	for (const scheme of ["light", "dark"]) {
		rows.push(`\n  ${scheme.toUpperCase()}`);
		rows.push(
			`  layer  surface   ${RANKS.map((r) => `r${r.rank}`.padStart(13)).join("")}`,
		);
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

function accentReport() {
	const rows = [
		"\n  ACCENT FAMILIES — solid (scheme-invariant) + per-layer roles at layer 0",
	];
	rows.push(
		`  ${"family".padEnd(18)}${"solid".padStart(22)}${"label".padStart(9)}${"on-solid".padStart(11)}${"seed L".padStart(10)}`,
	);
	for (const f of families) {
		const s = f.solid;
		const moved =
			s.moved === 0 ? "kept" : `${s.moved > 0 ? "+" : ""}${s.moved}`;
		rows.push(
			`  ${f.id.padEnd(18)}` +
				`oklch(${s.L.toFixed(3)} ${s.C.toFixed(3)} ${f.hue})`.padStart(22) +
				`${s.label.name}`.padStart(9) +
				`${s.ratio.toFixed(2)}:1`.padStart(11) +
				`${moved}`.padStart(10),
		);
	}
	return rows.join("\n");
}

/**
 * Sweep the hue circle to prove an arbitrary seed resolves.
 *
 * A warning rather than a failure: an unusable hue is information for whoever
 * is choosing a colourway, not a defect in the ones currently shipped. It
 * exists because teal genuinely returned null during design — its chroma tops
 * out at .146 anywhere, so a .19 intent has no solution at any lightness, and
 * that failure mode is invisible until someone seeds a muted hue.
 */
function hueSweep(seedL = SWEEP.seedL, seedC = SWEEP.seedC) {
	const failed = [];
	for (let H = 0; H < 360; H += SWEEP.step) {
		if (!solveSolid([seedL, seedC, H], `sweep-${H}`)) failed.push(H);
	}
	// solveSolid records its own findings; the sweep is advisory, so drop them.
	for (let i = findings.length - 1; i >= 0; i--) {
		if (findings[i].startsWith("sweep-")) findings.splice(i, 1);
	}
	return failed;
}

console.log(
	"Colour ladder — lightness / measured contrast against own surface",
);
console.log(report());
console.log(accentReport());

const unusable = hueSweep();
console.log(
	unusable.length
		? `\n  note: at L .55 / C .19, ${unusable.length} of 24 hues need a lightness shift or a lower chroma intent: ${unusable.join(", ")}`
		: "\n  every hue on the circle resolves at the default seed strength",
);

if (findings.length) {
	console.error(
		`\n✗ ${findings.length} contrast failure${findings.length === 1 ? "" : "s"}:`,
	);
	for (const f of findings) console.error(`  ${f}`);
	process.exit(1);
}

console.log(
	"\n✓ every rank clears its floor; every adjacent surface pair reads apart",
);

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
		[OUT_FACTS, emitFacts(unusable)],
	]) {
		writeFileSync(path, contents);
		console.log(`✓ wrote ${path.replace(REPO + "/", "")}`);
	}
}
