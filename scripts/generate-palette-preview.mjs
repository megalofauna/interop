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

const STEPS = 12;

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
const envelope = (i) => Math.sin((Math.PI * (i + 0.5)) / STEPS) ** 0.75;

function buildScale({ hue, chroma }) {
	const steps = [];
	for (let i = 0; i < STEPS; i++) {
		const t = i / (STEPS - 1);
		const l = round3(RAMP.lightest - t * (RAMP.lightest - RAMP.darkest));
		const want = chroma * envelope(i);
		const c = round3(Math.min(want, maxChroma(l, hue)));
		steps.push({ step: i + 1, l, c });
	}
	return steps;
}

/** Every step against every other. The whole point. */
function matrix(steps, hue) {
	const y = steps.map((s) => luminance(s.l, s.c, hue));
	return steps.map((_, i) =>
		steps.map((__, j) => round3(contrast(y[i], y[j]))),
	);
}

/**
 * The smallest step distance that clears a floor EVERYWHERE, if one exists.
 *
 * This is the question a rule of thumb answers, asked of the data rather than
 * designed into it. Null means no single distance works for every pair — which
 * is a real answer, and more useful than a rule with silent exceptions.
 */
function minimumOffset(m, ratio) {
	for (let d = 1; d < STEPS; d++) {
		let ok = true;
		for (let i = 0; i + d < STEPS; i++) if (m[i][i + d] < ratio) ok = false;
		if (ok) return d;
	}
	return null;
}

/** Where a given distance stops working, for reporting the exceptions. */
function breaksAt(m, ratio, offset) {
	const out = [];
	for (let i = 0; i + offset < STEPS; i++) {
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

const scales = seededScales().map((s) => {
	const steps = buildScale(s);
	const m = matrix(steps, s.hue);
	const offsets = {};
	for (const f of FLOORS) {
		const d = minimumOffset(m, f.ratio);
		offsets[f.id] = {
			offset: d,
			// If no single distance works, report the smallest that mostly does.
			exceptions: d === null ? breaksAt(m, f.ratio, STEPS - 1) : [],
		};
	}
	return {
		...s,
		ceiling: round3(peakChroma(s.hue)),
		steps,
		matrix: m,
		offsets,
	};
});

console.log("12-step palettes — even in lightness, measured afterwards\n");
console.log(
	`  ramp: L ${RAMP.lightest} → ${RAMP.darkest}, ${STEPS} steps, ` +
		`ΔL ${round3((RAMP.lightest - RAMP.darkest) / (STEPS - 1))} each\n`,
);
for (const s of scales) {
	console.log(`  ${s.id}${s.note ? ` — ${s.note}` : ""}  hue ${s.hue}`);
	for (const f of FLOORS) {
		const o = s.offsets[f.id];
		console.log(
			`    ${f.label.padEnd(28)} ${
				o.offset === null
					? "no single distance works"
					: `any ${o.offset} steps apart`
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
	readonly steps: readonly PaletteStep[];
	/** 12x12. matrix[i][j] is step i+1 against step j+1. */
	readonly matrix: readonly (readonly number[])[];
	readonly offsets: Record<string, PaletteOffset>;
}

export const PALETTE_RAMP = ${JSON.stringify(RAMP)};

export const PALETTE_FLOORS: readonly { id: string; ratio: number; label: string }[] = ${JSON.stringify(FLOORS)};

export const PALETTE_SCALES: readonly PaletteScale[] = ${JSON.stringify(scales)};
`,
);
console.log(`✓ wrote ${OUT.replace(REPO + "/", "")}`);
