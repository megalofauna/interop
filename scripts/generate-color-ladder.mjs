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
const DEPTH = { below: 0, above: 6 };

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
	/*
	 * The page is the extreme; everything else steps AWAY from it.
	 *
	 * Light used to start at mid-grey .898 and climb toward white, because tone
	 * carried direction — a card was lighter than the page, a field darker — and
	 * that needs headroom both ways. Nobody else works like that. In Radix,
	 * Material and Carbon an elevated card and a recessed field are BOTH darker
	 * than the page in light mode: tone carries distance, shadow carries
	 * direction.
	 *
	 * The bidirectional requirement was ours, the grey page was what it cost,
	 * and it quietly made a monotonic palette impossible — which is what pushed
	 * the palette work into a shape that was neither a palette nor a role
	 * system. Dropping it costs a mechanism and buys back a white page, one
	 * direction of travel, and a scale that means the same thing in both
	 * schemes.
	 *
	 * `down` is gone with it. There is no below any more; a recess is a step
	 * away like everything else, wearing an inset shadow instead of a drop one.
	 */
	light: {
		page: 0.99,
		up: -0.025,
		ease: 1.0,
		min: 0.12,
		max: 0.99,
	},
	dark: {
		page: 0.17,
		up: 0.032,
		ease: 1.0,
		min: 0.17,
		max: 0.62,
	},
};

const round3 = (n) => Math.round(n * 1000) / 1000;

/** Expand a ramp spec into the per-layer lightness table. */
function buildRamp(spec) {
	const out = { 0: round3(spec.page) };

	let l = spec.page;
	let step = spec.up;
	for (let i = 1; i <= DEPTH.above; i++) {
		l =
			spec.up < 0 ? Math.max(spec.min, l + step) : Math.min(spec.max, l + step);
		out[i] = round3(l);
		step *= spec.ease;
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

/**
 * One unit of 8-bit channel, as a safety bound on every solve.
 *
 * This generator's OKLCH → sRGB and a browser's disagree by a single unit in a
 * single channel on a few percent of values. Neither is wrong — it is a
 * rounding boundary, and other engines land on their own side of it. But green
 * carries 0.7152 of the luminance weight, and the WCAG ratio is most sensitive
 * where the darker colour is darkest, so one unit is worth up to 0.047 of
 * contrast on the neutral hue and 0.118 on a saturated one.
 *
 * That is not hypothetical. It shipped: --itx-contrast-4 measured 4.48:1
 * against light layer 2 in Chrome while this file computed 4.52:1, and the
 * runtime audit caught it.
 *
 * A fixed ratio margin is the wrong shape — sized for the neutral hue it misses
 * saturated ones by more than double. So instead of guessing, the solver
 * measures PESSIMISTICALLY: it nudges each colour one unit toward the other,
 * which is the worst a disagreeing engine can do, and requires the floor to
 * clear even then. Self-sizing, and it bounds the real error rather than
 * approximating it.
 *
 * Reported ratios stay honest — they are computed unbiased, so the table says
 * what a rank measures, not what it was solved against.
 */
/**
 * How much hue a derived status role carries, and which neutral rank it rides.
 *
 * The lightness always comes from the rank, so these chroma values are the only
 * numbers deciding how coloured a status surface looks — and they carry no
 * contrast consequence, because the ratio belongs to the rank. Raise the tint
 * and callouts get more saturated; nothing else moves.
 */
const STATUS_ROLES = [
	/* A wash. Rank 1 is solved away from its own surface at every layer, so a
	   tint riding it cannot invert — which is what the old fixed value did
	   from layer 2 down. */
	{ role: "tint", rank: 1, chroma: 0.05 },
	/* Text on that wash. Rank 5 against a rank-1 ground measures 5.79:1 at
	   worst (dark, layer 4). */
	{ role: "on-tint", rank: 5, chroma: 0.02 },
	/* The accent rule. Rank 4, not rank 3, even though its floor is 3:1: rank 3
	   is solved to EXACTLY 3:1, and adding chroma at a fixed lightness shifts
	   luminance enough to eat that margin — measured at 2.947:1 worst, and no
	   chroma low enough to fix it still reads as the status colour. Rank 4
	   leaves 4.43:1 against a 3:1 floor, and a status bar carrying more
	   emphasis than the minimum is the right way to be wrong. */
	{ role: "border", rank: 4, chroma: 0.08 },
	/* Status text on the plain surface. 7.04:1 worst against a 4.5 floor. */
	{ role: "text", rank: 5, chroma: 0.02 },
];

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
		// Science Blue #0066CC, the long-standing default.
		default: { name: "Science Blue", seed: [0.5, 0.19, 264] },
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

/**
 * Luminance with every channel nudged one 8-bit unit in `toward` (+1 or -1).
 *
 * Used only for SOLVING. Nudging a colour toward the thing it is measured
 * against gives the least contrast a disagreeing engine could render, so a
 * value that clears its floor here clears it anywhere.
 */
function luminanceBiased(L, C, H, toward) {
	const linear = oklchToLinearSrgb(L, C, H);
	const [r, g, b] = linear.map((u) => {
		const q = Math.round(clamp01(encodeGamma(clamp01(u))) * 255);
		return decodeGamma(clamp01((q + toward) / 255));
	});
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
	// Pessimistic on BOTH sides: the surface nudged toward the rank, the rank
	// nudged toward the surface. That is the least contrast a disagreeing engine
	// can render, so clearing it here clears it anywhere. See luminanceBiased.
	const surfaceY = luminanceBiased(surfaceL, c, h, dir);
	const rankY = (L) => luminanceBiased(L, c, h, -dir);
	const poleL = dir > 0 ? 1 : 0;

	if (contrast(rankY(poleL), surfaceY) < target) return null;

	let near = surfaceL;
	let far = poleL;
	for (let i = 0; i < 40; i++) {
		const mid = (near + far) / 2;
		if (contrast(rankY(mid), surfaceY) >= target) far = mid;
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
			.map((p) => {
				// A label sits ON the fill, so each is nudged toward the other.
				const toward = p.L > L ? -1 : 1;
				return {
					...p,
					ratio: contrast(luminance(p.L, p.C, H), y),
					safeRatio: contrast(
						luminanceBiased(p.L, p.C, H, toward),
						luminanceBiased(L, C, H, -toward),
					),
				};
			})
			.sort((a, b) => b.safeRatio - a.safeRatio);

		return scored[0].safeRatio >= ACCENT.onSolid
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
	// Solved against the pessimistic pair; reported against the true one.
	const solveY = luminanceBiased(surfaceL, surfaceC, surfaceH, dir);
	const trueY = luminance(surfaceL, surfaceC, surfaceH);

	let near = surfaceL;
	let far = dir > 0 ? 1 : 0;
	for (let i = 0; i < 40; i++) {
		const mid = (near + far) / 2;
		const C = Math.min(intent, maxChroma(mid, H));
		if (contrast(luminanceBiased(mid, C, H, -dir), solveY) >= target) far = mid;
		else near = mid;
	}

	const L = clamp01(
		dir > 0 ? Math.ceil(far * 1000) / 1000 : Math.floor(far * 1000) / 1000,
	);
	const C = Math.min(intent, maxChroma(L, H));
	return { L, C: round3(C), ratio: contrast(luminance(L, C, H), trueY) };
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

/**
 * The ramp formula, in JS, exactly as the CSS computes it.
 *
 * Emitted as a test fixture so the spec has an oracle that is NOT the engine
 * it is testing. The browser evaluating clamp/pow/min inside oklch() and this
 * arithmetic have to land on the same colour; if `pow()` were unsupported, a
 * var name were wrong, or a clamp were inverted, they would not.
 *
 * Deliberately UNROUNDED. buildRamp() rounds to 3dp for the published table,
 * and the CSS does not round at all — comparing the two would fail on 0.2715
 * against 0.272, a difference of 0.0005 in L that renders to the same byte.
 */
function layerLightnessJs(scheme, n) {
	const r = RAMP[scheme];
	const up =
		r.ease === 1
			? r.up * Math.max(0, n)
			: (r.up * (1 - Math.pow(r.ease, Math.max(0, n)))) / (1 - r.ease);
	return Math.min(r.max, Math.max(r.min, r.page + up));
}

const ladder = { light: buildScheme("light"), dark: buildScheme("dark") };

/** The status families, by role name. Both palettes publish the same four. */
const STATUS_NAMES = [
	...new Set(
		familyList()
			.filter((f) => f.role !== "colorway")
			.map((f) => f.role),
	),
];

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
			// but "Science Blue" is a great deal easier to hold in mind than 264.
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
					// Pessimistic on both sides, as everywhere else a floor is solved.
					if (
						contrast(
							luminanceBiased(mid, c, H, -dir),
							luminanceBiased(tintL, tintC, H, dir),
						) >= ACCENT.onTint
					)
						far = mid;
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

	/*
	 * The ramp SPEC, not a table of surfaces.
	 *
	 * Every layer's lightness is one expression away from these six numbers, so
	 * the engine computes rather than enumerates — and because they are read at
	 * use time rather than baked, setting one on any ancestor moves every layer
	 * below it at once. That is the same override story the discrete numbers
	 * told, with a dial instead of a step.
	 */
	for (const scheme of ["light", "dark"]) {
		const r = RAMP[scheme];
		lines.push(
			`\t--itx-ramp-${scheme}-page: ${r.page};`,
			`\t--itx-ramp-${scheme}-step: ${r.up};`,
			`\t--itx-ramp-${scheme}-ease: ${r.ease};`,
			`\t--itx-ramp-${scheme}-min: ${r.min};`,
			`\t--itx-ramp-${scheme}-max: ${r.max};`,
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
		// Composition travels with the numbers — see compose().
		for (const role of SOLID_ROLES) rows.push(compose(name, role, true));

		/*
		 * The surface-relative roles are DERIVED, not solved.
		 *
		 * They used to be solved once against layer 0 and emitted as fixed
		 * numbers, which meant they were only correct at layer 0. Measured on
		 * the dark ramp, a callout's tint inverted from layer 2 — reading as a
		 * recess where it means a lift — and its accent rule fell under 3:1 from
		 * layer 1. Nothing caught it, because the generator never claimed a floor
		 * anywhere but layer 0, so there was nothing for the render check to
		 * check.
		 *
		 * Solving them per layer would have worked and cost four times the
		 * tokens. Riding the neutral ranks costs none: the ranks are already
		 * re-solved at every depth, so a role that borrows a rank's LIGHTNESS
		 * inherits its guarantee and wears the status hue on top. Relative colour
		 * syntax does exactly that, and takes a light-dark() origin, so one
		 * declaration serves both schemes.
		 *
		 *   tint     rank 1, the neutral wash. Cannot invert, because rank 1 is
		 *            solved away from its own surface at every layer.
		 *   on-tint  rank 5. Measured against a rank-1 ground it clears 4.5:1
		 *            everywhere, worst case 5.79:1 at dark layer 4.
		 *   border   rank 3, the 3:1 edge. Inherits that floor at every depth.
		 */
		/*
		 * The surface-relative roles are NOT here. They are derived from the
		 * neutral ranks, and a derivation has to sit where those ranks are
		 * re-declared — see statusRoles(), emitted per layer by the engine.
		 *
		 * Declaring them here would look right and be frozen: a var() inside a
		 * custom property is substituted where the property is DECLARED, so a
		 * derivation written at [interop-root] bakes layer 0's rank and inherits
		 * that value everywhere. Verified in a browser rather than assumed —
		 * root and depth returned the identical colour.
		 */
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
/**
 * The lightness of `--itx-layer` plus a fixed offset, as one CSS expression.
 *
 *   clamp(min, page + step·(1 − ease^max(0,n))/(1 − ease) + down·min(0,n), max)
 *          └ geometric going up: the light ramp decelerates under its ceiling
 *                                        └ linear going down: sinks have no ceiling
 *
 * A uniform ramp (ease 1) would divide by zero, so it gets the plain
 * multiplication instead. The two schemes already sit in separate arms of
 * light-dark(), so emitting the right form per scheme costs nothing and keeps
 * a uniform ramp EXACT rather than approximated.
 *
 * `n` is clamped to the ramp's own bounds, which is what key() does for the
 * enumerated version — at the top layer, "one above" is still the top layer.
 */
function layerLightness(scheme, offset) {
	const r = RAMP[scheme];
	const v = (k) => `var(--itx-ramp-${scheme}-${k})`;
	const n =
		offset === 0
			? "var(--itx-layer)"
			: `max(0, calc(var(--itx-layer) + ${offset}))`;
	const up =
		r.ease === 1
			? `${v("step")} * ${n}`
			: `${v("step")} * (1 - pow(${v("ease")}, ${n})) / (1 - ${v("ease")})`;
	return (
		`clamp(\n\t\t\t\t${v("min")},\n` +
		`\t\t\t\tcalc(${v("page")} + ${up}),\n` +
		`\t\t\t\t${v("max")}\n\t\t\t)`
	);
}

/**
 * The whole elevation ladder, in one rule.
 *
 * The selector has to match every element that carries a layer. A custom
 * property containing var() is substituted where it is DECLARED, so a value
 * composed once at [interop-root] would bake --itx-layer: 0 and inherit frozen;
 * matching each layer-bearing element makes every one resolve against its own
 * depth. One rule, not one block per depth.
 */
function surfaceRule() {
	const compose = (offset) =>
		`light-dark(\n\t\toklch(${layerLightness("light", offset)} var(--itx-tint-light)),\n` +
		`\t\toklch(${layerLightness("dark", offset)} var(--itx-tint-dark))\n\t)`;
	return [
		":where([interop-root], [itx-layer], [itx-sink]) {",
		`\t--itx-surface: ${compose(0)};`,
		`\t--itx-surface-above: ${compose(1)};`,
		`\t--itx-surface-above-2: ${compose(2)};`,
		/*
		 * --itx-surface-below is an ALIAS now, not a direction.
		 *
		 * A recess used to be a step toward the page's opposite; under one
		 * direction of travel it is a step away like everything else, and what
		 * makes it read as recessed is an inset shadow rather than its tone.
		 * Kept as a name so consumers reading it keep working, and so "below"
		 * still means something a component can ask for.
		 */
		`\t--itx-surface-below: ${compose(1)};`,
		"}",
		"",
	].join("\n");
}

function tokenSet(i, indent) {
	const t = "\t".repeat(indent);

	/** Compose the colour HERE, so lightness and tint both stay overridable. */
	const compose = (name) =>
		`light-dark(\n${t}\toklch(var(--itx-ramp-${name}-light) var(--itx-tint-light)),\n` +
		`${t}\toklch(var(--itx-ramp-${name}-dark) var(--itx-tint-dark))\n${t})`;

	/*
	 * Surfaces are NOT here. They are computed once from the ramp spec, in a
	 * single rule that matches every layer-bearing element — see surfaceRule().
	 * Ranks and accent roles stay, because they are SOLVED per surface rather
	 * than derived from it, and a solver's output cannot be reached by calc().
	 */
	const out = [`${t}--itx-layer: ${i};`];
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

	/*
	 * Status roles, derived from the ranks declared just above.
	 *
	 * They ride a neutral rank's LIGHTNESS and wear the status hue, so they
	 * inherit that rank's guarantee at every depth for free. Solving them per
	 * layer instead would have cost four times the tokens; this costs one line
	 * each and cannot drift, because the thing it borrows from cannot.
	 *
	 * They must be re-declared here, in the same block as the ranks, for the
	 * reason the whole engine re-declares everything: a var() inside a custom
	 * property resolves where it is DECLARED. Written once at [interop-root]
	 * these freeze at layer 0 — measured, not assumed.
	 */
	for (const status of STATUS_NAMES) {
		for (const { role, rank, chroma } of STATUS_ROLES) {
			out.push(
				`${t}--itx-${status}-${role}: oklch(\n` +
					`${t}\tfrom var(--itx-contrast-${rank}) l ${chroma} var(--itx-${status}-hue)\n${t});`,
			);
		}
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
		surfaceRule(),
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
		tokenSet(1, 1),
		"}",
		"",
		"/* ── Tier 3 — the counter. Strictly monotone up the tree, so never a cycle. */",
		"",
	];

	for (let ancestor = LAYER_MIN; ancestor <= LAYER_MAX; ancestor++) {
		/*
		 * A sink counts UP, exactly like a raise.
		 *
		 * It used to count down, because tone carried direction and a recess was
		 * a step toward the page's opposite. Under one direction of travel both
		 * move away from the page by the same amount; what separates them is the
		 * shadow, not the tone. So the counter has one behaviour, and `itx-sink`
		 * now means "a step away, drawn as a recess" rather than "a step the
		 * other way".
		 */
		const raise = Math.min(LAYER_MAX, ancestor + 1);
		const sink = raise;
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
	L.push("/*");
	L.push(
		" * Direction. Tone already said how FAR from the page a surface is; these",
	);
	L.push(
		" * say which way, which is the half of the model tone used to carry.",
	);
	L.push(" *");
	L.push(
		" * A layer and a sink at the same depth are the same colour on purpose —",
	);
	L.push(
		" * light from above is what separates them, so a raise casts a shadow and a",
	);
	L.push(
		" * recess is shadowed within. Zero specificity, so a component that paints",
	);
	L.push(
		" * its own box-shadow wins on contact and nothing here needs unwinding.",
	);
	L.push(" */");
	L.push(":where([itx-layer]) {");
	L.push("\tbox-shadow: var(--itx-elevation-shadow);");
	L.push("}");
	L.push("");
	L.push(":where([itx-sink]) {");
	L.push("\tbox-shadow: var(--itx-recess-shadow);");
	L.push("}");
	L.push("");

	return L.join("\n");
}

/* ── Emit: the render-verification manifest ─────────────────────────────── */

/**
 * Every pairing this generator claims a floor for, as data a browser can check.
 *
 * The build validates its own arithmetic; it cannot see what an engine actually
 * renders. That gap is not theoretical — --itx-contrast-4 shipped at 4.48:1 in
 * Chrome while this file computed 4.52:1, because the two round one 8-bit
 * channel differently. The solver now measures pessimistically so that cannot
 * recur, but "cannot recur" is a claim, and this is what checks it.
 *
 * Backgrounds use the lightness the engine COMPUTES (layerLightnessJs), not the
 * rounded table the solver worked from — the point is to verify what ships.
 *
 * Consumed by scripts/check-contrast-render.mjs.
 */
function contrastPairs() {
	const index = (k) => (k.startsWith("n") ? -Number(k.slice(1)) : Number(k));
	const pairs = [];

	for (const scheme of ["light", "dark"]) {
		const tint = TINT[scheme];

		for (const layer of LAYERS) {
			const bgL = layerLightnessJs(scheme, index(layer));
			const bg = { l: bgL, c: tint.c, h: tint.h };

			for (const spec of RANKS) {
				if (!spec.ratio) continue; // rank 1 is a delta, rank 6 is a pole
				const { L } = ladder[scheme][layer].ranks[spec.rank];
				pairs.push({
					label: `${scheme} layer ${layer} rank ${spec.rank}`,
					fg: { l: L, c: tint.c, h: tint.h },
					bg,
					floor: spec.ratio,
				});
			}

			// The COLOURWAY re-solves per layer, so its roles are checked as solved.
			for (const family of families.filter((f) => f.role === "colorway")) {
				const cell = family.layers[scheme][layer];
				if (!cell) continue;
				for (const [role, floor] of [
					["border", ACCENT.border],
					["text", ACCENT.text],
				]) {
					pairs.push({
						label: `${scheme} layer ${layer} ${family.id} ${role}`,
						fg: { l: cell[role].L, c: cell[role].C, h: family.hue },
						bg,
						floor,
					});
				}
				pairs.push({
					label: `${scheme} layer ${layer} ${family.id} on-tint`,
					fg: { l: cell.onTint.L, c: cell.onTint.C, h: family.hue },
					bg: { l: cell.tint.L, c: cell.tint.C, h: family.hue },
					floor: ACCENT.onTint,
				});
			}

			/*
			 * STATUS roles are derived, so they are checked as derived — the same
			 * arithmetic the CSS performs, against the same rank.
			 *
			 * Checking their old solved values here would be worse than checking
			 * nothing: those numbers no longer ship, so the pairing would pass
			 * while verifying a colour the browser never paints. That is the exact
			 * failure this manifest exists to prevent, one level up.
			 *
			 * And because the derivation is defined at every layer, these pairings
			 * now exist at every layer — which is what the old shape could not do,
			 * and why a tint that inverted from layer 2 went uncaught.
			 */
			const rankL = (n) => ladder[scheme][layer].ranks[n].L;
			const tintSpec = STATUS_ROLES.find((r) => r.role === "tint");
			for (const family of families.filter((f) => f.role !== "colorway")) {
				const tintBg = {
					l: rankL(tintSpec.rank),
					c: tintSpec.chroma,
					h: family.hue,
				};
				for (const { role, rank, chroma } of STATUS_ROLES) {
					// The tint is a wash: a perceptibility delta, not a ratio, and it
					// cannot invert now that it rides a rank. Nothing to assert here.
					if (role === "tint") continue;
					pairs.push({
						label: `${scheme} layer ${layer} ${family.id} ${role}`,
						fg: { l: rankL(rank), c: chroma, h: family.hue },
						// on-tint sits on the tint; the rest sit on the surface.
						bg: role === "on-tint" ? tintBg : bg,
						floor: role === "border" ? ACCENT.border : ACCENT.text,
					});
				}
			}
		}
	}

	// Solids are scheme- and layer-invariant, so they are checked once.
	for (const family of families) {
		pairs.push({
			label: `${family.id} label on solid`,
			fg: {
				l: family.solid.label.L,
				c: family.solid.label.C,
				h: family.hue,
			},
			bg: { l: family.solid.L, c: family.solid.C, h: family.hue },
			floor: ACCENT.onSolid,
		});
	}

	return pairs;
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
	const surfaceL = { light: {}, dark: {} };
	for (const scheme of ["light", "dark"]) {
		for (let i = -DEPTH.below; i <= DEPTH.above; i++) {
			surfaceL[scheme][key(i)] = layerLightnessJs(scheme, i);
		}
	}

	const asModule =
		"/* GENERATED — node scripts/generate-color-ladder.mjs. Test fixture only. */\n" +
		`export const LADDER_CSS = ${JSON.stringify(ladderCss)};\n\n` +
		`export const ENGINE_CSS = ${JSON.stringify(engineCss)};\n\n` +
		"/* The ramp formula in JS — an oracle independent of the CSS engine. */\n" +
		`export const SURFACE_L: Record<string, Record<string, number>> = ${JSON.stringify(surfaceL)};\n\n` +
		"/* Every floor this generator claims, for a browser to check. See\n" +
		"   scripts/check-contrast-render.mjs. */\n" +
		`export const CONTRAST_PAIRS = ${JSON.stringify(contrastPairs())};\n`;

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
