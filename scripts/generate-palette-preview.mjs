#!/usr/bin/env node
/*
 * 12-step palettes — PREVIEW ONLY. No CSS, no tokens.
 *
 * A palette, and then a verdict. Not a set of roles wearing step numbers.
 *
 * ── What changed, and why ────────────────────────────────────────────────
 *
 * The first attempt solved steps 6-12 BACKWARDS from contrast floors: step 8
 * was "whatever lightness clears 3:1 against the worst background", step 11
 * "whatever clears 4.5:1", and so on. Each step was a separate answer, so the
 * lightness landed wherever its floor demanded and the ramp did not gradate.
 * It looked like a palette and behaved like the role system, and could not be
 * read as either.
 *
 * This generates a palette. Twelve steps, evenly spaced in OKLCH lightness,
 * which is what OKLCH is for — even in L is even to the eye. Nothing is
 * positioned by a contrast target.
 *
 * THEN it measures. Every step against every other step, all 144 pairs, and
 * reports which clear 3:1, 4.5:1 and 7:1. The guidance is an output, not an
 * input: if "step N against step N+6 clears AA" turns out to be true, it is
 * true because the ramp made it so, and the matrix says where it breaks down.
 *
 * ── Chroma follows the gamut ─────────────────────────────────────────────
 *
 * Lightness is even; chroma cannot be. A hue holds most colour in the middle
 * of the range and almost none at either end — blue reaches .28 at L .49 and
 * .048 at L .90 — so a constant chroma would clip at the extremes and read as
 * a flat grey ramp with a bulge. Chroma is scaled by a curve that peaks
 * mid-scale and clamped to what the hue can actually display at each step.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
	clamp01,
	contrast,
	luminance,
	maxChroma,
	peakChroma,
	round3,
} from "./color/solve.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(REPO, "projects/demo/src/app/pages/color/palette-preview.ts");

/**
 * Candidates, rendered side by side. Two dials, both value decisions.
 *
 * ── Length ──────────────────────────────────────────────────────────────
 *
 * 12 matches Radix. Tailwind ships 11 (50, 100-900, 950) and got there by
 * adding to both ends twice, which is evidence people kept wanting room. Ten
 * is the most common count — Carbon, Ant, Open Color, Bootstrap. Adobe
 * Spectrum runs to 14.
 *
 * Measured here, the single-distance rule survives 12 and 14 and breaks at 16:
 * past that the hues stop agreeing and you need per-hue exceptions. So there is
 * a real ceiling, and it sits between 14 and 16.
 *
 * ── Curve ───────────────────────────────────────────────────────────────
 *
 * Even in OKLCH lightness is NOT even to the eye at the dark end. Measured on
 * the linear ramp, the last step removes 2.86x the light of the one before it
 * while the first removes 1.26x — so it measures uniform and reads as
 * accelerating into the dark. OKLab's uniformity is a model, and it diverges
 * from what the eye reports in a dark context.
 *
 * `curve` shrinks ΔL toward the dark end: L = lightest − (1 − (1 − t)^curve)·range.
 * 1.0 is linear. 1.45 flattens the luminance ratios to 1.40x → 1.47x, the most
 * even of anything tried. Beyond that it overshoots and the dark end goes
 * finer than the light.
 *
 * This is why neither Radix nor Tailwind is linear in any single space. Ours
 * was the naive version.
 */
const CANDIDATES = [
	/* The naive ramp. Evenness 2.38 — the complaint, measurable. */
	{ count: 12, curve: 1.0, note: "linear" },
	/* The most easing 12 steps can take while every hue still shares one
	   distance per floor. Past 1.25 the rule starts fragmenting. */
	{ count: 12, curve: 1.25, note: "eased" },
	{ count: 14, curve: 1.0, note: "linear" },
	/*
	 * CHOSEN, 2026-08-21, on the browser rather than the numbers.
	 *
	 * Best evenness of anything that keeps a single distance per floor (1.39,
	 * against 2.19 for the same length linear), more room than 12, and 7/8/10
	 * holds for all five hues including the 215 teal. Sixteen steps is past the
	 * ceiling at any curve — the rule fragments and needs per-hue exceptions.
	 */
	{ count: 14, curve: 1.3, note: "eased", chosen: true },
];

/**
 * Where the ramp starts and ends.
 *
 * Not 1.0 and 0.0: pure white and pure black are not palette colours, they are
 * the absence of one, and a ramp that reaches them spends two of its twelve
 * steps on values nothing should use as a surface or a mark.
 */
const RAMP = { lightest: 0.97, darkest: 0.17 };

/** Contrast floors reported for every pair. */
const FLOORS = [
	{ id: "aa-large", ratio: 3, label: "3:1 — large text, borders" },
	{ id: "aa", ratio: 4.5, label: "4.5:1 — body text" },
	{ id: "aaa", ratio: 7, label: "7:1 — enhanced" },
];

/**
 * Chroma envelope across the ramp.
 *
 * A raised sine: zero-ish at both ends, peak in the middle, which is roughly
 * where every hue holds the most colour. Multiplied by the seed's chroma and
 * then clamped to the gamut, so the seed sets intensity and the hue sets what
 * is actually reachable.
 */
const envelope = (i, count) => Math.sin((Math.PI * (i + 0.5)) / count) ** 0.75;

function buildScale({ hue, chroma }, count, curve) {
	const steps = [];
	for (let i = 0; i < count; i++) {
		const t = i / (count - 1);
		const eased = 1 - Math.pow(1 - t, curve);
		const l = round3(RAMP.lightest - eased * (RAMP.lightest - RAMP.darkest));
		const want = chroma * envelope(i, count);
		const c = round3(Math.min(want, maxChroma(l, hue)));
		steps.push({ step: i + 1, l, c });
	}
	return steps;
}

/**
 * How uneven the ramp reads: the largest adjacent luminance jump over the
 * smallest. 1.0 would be perfectly even in the physical light; the linear ramp
 * scores 2.27, which is the complaint made measurable.
 */
function spreadOf(steps, hue) {
	const y = steps.map((s) => luminance(s.l, s.c, hue));
	const rs = [];
	for (let i = 1; i < y.length; i++) rs.push(y[i - 1] / y[i]);
	return Math.max(...rs) / Math.min(...rs);
}

/** Every step against every other. The whole point. */
function matrix(steps, hue) {
	const y = steps.map((s) => luminance(s.l, s.c, hue));
	return steps.map((_, i) =>
		steps.map((__, j) => round3(contrast(y[i], y[j]))),
	);
}

/**
 * For each step used as a BACKGROUND, which steps are legible on it.
 *
 * The same information as the matrix, asked the way anyone actually asks it:
 * "I am painting on step 4 — what can I write with?" A table of ratios answers
 * that only after arithmetic. This answers it directly, and the demo renders
 * each answer in the colour it names, so a claim that is wrong looks wrong.
 */
function legibleOn(m, floors) {
	return m.map((row) => {
		const out = {};
		for (const f of floors) {
			out[f.id] = row
				.map((ratio, j) => ({ step: j + 1, ratio }))
				.filter((x) => x.ratio >= f.ratio - 0.005);
		}
		return out;
	});
}

/**
 * The smallest step distance that clears a floor EVERYWHERE, if one exists.
 *
 * This is the question a rule of thumb answers, asked of the data rather than
 * designed into it. Null means no single distance works for every pair — which
 * is a real answer, and more useful than a rule with silent exceptions.
 */
function minimumOffset(m, ratio) {
	const n = m.length;
	for (let d = 1; d < n; d++) {
		let ok = true;
		for (let i = 0; i + d < n; i++) if (m[i][i + d] < ratio) ok = false;
		if (ok) return d;
	}
	return null;
}

/** Where a given distance stops working, for reporting the exceptions. */
function breaksAt(m, ratio, offset) {
	const out = [];
	for (let i = 0; i + offset < m.length; i++) {
		if (m[i][i + offset] < ratio)
			out.push({ from: i + 1, to: i + offset + 1, ratio: m[i][i + offset] });
	}
	return out;
}

function seededScales() {
	const facts = readFileSync(
		join(REPO, "projects/demo/src/app/pages/color/ladder-facts.ts"),
		"utf8",
	);
	const families = JSON.parse(
		facts
			.match(/FAMILY_FACTS: readonly FamilyFact\[\] = (\[[\s\S]*?\n\]);/)[1]
			.replace(/^(\s*)([A-Za-z_$][\w$]*):/gm, '$1"$2":'),
	);
	const of = (id) => families.find((f) => f.id === id);
	const cw = of("colorway");
	const am = of("colorway-amber");
	return [
		{ id: "neutral", hue: 250, chroma: 0.012, note: null },
		{ id: "colorway", hue: cw.hue, chroma: cw.seed.c, note: cw.name },
		{ id: "amber", hue: am.hue, chroma: am.seed.c, note: am.name },
		{
			id: "danger",
			hue: of("danger").hue,
			chroma: of("danger").seed.c,
			note: null,
		},
		{
			id: "teal",
			hue: 215,
			chroma: 0.19,
			note: "lowest chroma ceiling on the circle",
		},
	];
}

/** Every seeded hue, at every candidate length. */
const scales = [];
for (const { count, curve, chosen } of CANDIDATES) {
	for (const seed of seededScales()) {
		const steps = buildScale(seed, count, curve);
		const m = matrix(steps, seed.hue);
		const offsets = {};
		for (const f of FLOORS) {
			const d = minimumOffset(m, f.ratio);
			offsets[f.id] = {
				offset: d,
				exceptions: d === null ? breaksAt(m, f.ratio, count - 1) : [],
			};
		}
		scales.push({
			...seed,
			legible: legibleOn(m, FLOORS),
			count,
			curve,
			note: seed.note,
			chosen: chosen === true,
			candidate: `${count}-${curve.toFixed(2)}`,
			/** Ratio of the largest adjacent luminance jump to the smallest. */
			spread: round3(spreadOf(steps, seed.hue)),
			ceiling: round3(peakChroma(seed.hue)),
			deltaFirst: round3(steps[0].l - steps[1].l),
			deltaLast: round3(steps[count - 2].l - steps[count - 1].l),
			steps,
			matrix: m,
			offsets,
		});
	}
}

console.log("Palettes — an even ramp, then a verdict\n");
for (const { count, curve } of CANDIDATES) {
	const here = scales.filter((s) => s.count === count && s.curve === curve);
	const n = here[0];
	console.log(
		`  ${count} steps, curve ${curve.toFixed(2)}${here[0].chosen ? "  ← CHOSEN" : ""}` +
			`   ΔL ${n.deltaFirst} → ${n.deltaLast}   evenness ${n.spread} (1.0 = perfect)`,
	);
	for (const f of FLOORS) {
		const all = here.map((s) => s.offsets[f.id].offset);
		const agree = all.every((v) => v !== null && v === all[0]);
		console.log(
			`    ${f.label.padEnd(28)} ${
				agree ? `any ${all[0]} steps apart` : `varies: ${all.join(", ")}`
			}`,
		);
	}
	console.log("");
}

writeFileSync(
	OUT,
	`/* GENERATED — node scripts/generate-palette-preview.mjs. Preview only:
   no CSS, no tokens. See .agent/records/palette-spike.md. */

/** One step of a palette: even in lightness, chroma clamped to the gamut. */
export interface PaletteStep {
	readonly step: number;
	readonly l: number;
	readonly c: number;
}

/** The smallest step distance clearing a floor everywhere, or null. */
export interface PaletteOffset {
	readonly offset: number | null;
	readonly exceptions: readonly { from: number; to: number; ratio: number }[];
}

export interface PaletteScale {
	readonly id: string;
	readonly note: string | null;
	readonly hue: number;
	readonly chroma: number;
	readonly ceiling: number;
	/** How many steps this candidate has, and how eased. */
	readonly count: number;
	readonly curve: number;
	/** Stable key for grouping: "14-1.30". */
	readonly candidate: string;
	/** The candidate settled on. */
	readonly chosen: boolean;
	/** Largest adjacent luminance jump over the smallest. 1.0 = perfectly even. */
	readonly spread: number;
	readonly deltaFirst: number;
	readonly deltaLast: number;
	readonly steps: readonly PaletteStep[];
	/** NxN. matrix[i][j] is step i+1 against step j+1. */
	readonly matrix: readonly (readonly number[])[];
	/** Per background step, the steps legible on it at each floor. */
	readonly legible: readonly Record<
		string,
		readonly { step: number; ratio: number }[]
	>[];
	readonly offsets: Record<string, PaletteOffset>;
}

export const PALETTE_RAMP = ${JSON.stringify(RAMP)};

export const PALETTE_CANDIDATES = ${JSON.stringify(CANDIDATES)};

export const PALETTE_FLOORS: readonly { id: string; ratio: number; label: string }[] = ${JSON.stringify(FLOORS)};

export const PALETTE_SCALES: readonly PaletteScale[] = ${JSON.stringify(scales)};
`,
);
console.log(`✓ wrote ${OUT.replace(REPO + "/", "")}`);
