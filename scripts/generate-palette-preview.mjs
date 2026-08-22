#!/usr/bin/env node
/*
 * 12-step palette — PREVIEW ONLY.
 *
 * Emits scales for the demo to render. It writes no CSS and ships no tokens:
 * the point is to see the model before committing to it, which is stage 2 of
 * the plan in .agent/records/palette-spike.md.
 *
 * ── The band model ───────────────────────────────────────────────────────
 *
 * Radix's scale is monotonic in lightness. Interop's elevation moves toward
 * LIGHT in both schemes, so a monotonic scale would run elevation backwards.
 * The scale is banded instead:
 *
 *   1–5    BACKGROUND, ordered by elevation. Step 1 is the page; 2–5 are the
 *          layers above it.
 *   6–12   FOREGROUND, ordered by increasing contrast AGAINST that band.
 *
 * What matters is not that lightness ascends but that contrast ascends where
 * it is read.
 *
 * ── The worst case ───────────────────────────────────────────────────────
 *
 * A foreground must clear its floor against EVERY background step, so it is
 * solved against the worst one — and which that is flips per scheme, because
 * the backgrounds climb toward light while the foreground travels away:
 *
 *   light   backgrounds .898 → 1.0, foreground darkens → worst is step 1
 *   dark    backgrounds .232 → .39, foreground lightens → worst is step 5
 *
 * ── What is new since the spike ──────────────────────────────────────────
 *
 * The spike solved with plain luminance. The shipping generator now measures
 * PESSIMISTICALLY — each colour nudged one 8-bit unit toward the other, which
 * is the worst a disagreeing engine can render — after --itx-contrast-4 shipped
 * at 4.48:1 in Chrome against a 4.5 floor. This preview uses the same bound, so
 * its "yes" is the one that survives a browser rather than the one that only
 * survived arithmetic.
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
	oklchToLinearSrgb,
} from "./color/solve.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(REPO, "projects/demo/src/app/pages/color/palette-preview.ts");

const BG_BAND = [1, 2, 3, 4, 5];
const FG_BAND = [6, 7, 8, 9, 10, 11, 12];

/** The background sub-ramp, from the same dials the engine computes with. */
const RAMP = {
	light: { page: 0.898, step: 0.028, ease: 0.95, max: 1.0 },
	dark: { page: 0.232, step: 0.0395, ease: 1.0, max: 0.44 },
};

/** How far a foreground may travel. */
const POLE = { light: 0.12, dark: 0.97 };

/**
 * What each foreground step is FOR, and the floor it must clear against the
 * worst background in the band. Steps 9–10 are not contrast targets — they are
 * the brand fill, positioned by chroma, and they answer for their own label.
 */
const FG_SPEC = [
	{ step: 6, intent: "subtle border", floor: 1.5 },
	{ step: 7, intent: "ui border", floor: 2.0 },
	{ step: 8, intent: "strong border, accent rule", floor: 3.0 },
	{ step: 9, intent: "solid fill", solid: true },
	{ step: 10, intent: "solid, hovered", solid: true, away: 0.05 },
	{ step: 11, intent: "text", floor: 4.5 },
	{ step: 12, intent: "text, high contrast", floor: 7.0 },
];

/**
 * The scales to preview.
 *
 * The real seeds are READ from the ladder's derivation record rather than
 * copied here — a preview holding its own idea of the colourway is a preview
 * that quietly stops describing the system. The neutral comes from the tint
 * pack; the teal is invented, and says so.
 */
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
	const colorway = of("colorway");
	const amber = of("colorway-amber");
	return [
		{ id: "neutral", hue: 250, chroma: 0.006 },
		{
			id: "colorway",
			hue: colorway.hue,
			chroma: colorway.seed.c,
			note: colorway.name,
		},
		{ id: "amber", hue: amber.hue, chroma: amber.seed.c, note: amber.name },
		{ id: "teal", hue: 215, chroma: 0.19, note: "hostile — .145 ceiling" },
	];
}

const SCALES = seededScales();

/* ── The pessimistic bound, as the shipping generator uses it ────────────── */

const encodeGamma = (u) =>
	u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055;
const decodeGamma = (u) =>
	u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);

/** Luminance with every channel nudged one 8-bit unit toward `toward`. */
function luminanceBiased(L, C, H, toward) {
	const [r, g, b] = oklchToLinearSrgb(L, C, H).map((u) => {
		const q = Math.round(clamp01(encodeGamma(clamp01(u))) * 255);
		return decodeGamma(clamp01((q + toward) / 255));
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const backgrounds = (scheme) => {
	const spec = RAMP[scheme];
	const out = [];
	let l = spec.page;
	let step = spec.step;
	for (let i = 0; i < BG_BAND.length; i++) {
		out.push(round3(Math.min(spec.max, l)));
		l = Math.min(spec.max, l + step);
		step *= spec.ease;
	}
	return out;
};

/** The lightness where this hue holds the most colour — the brand point. */
function brandPoint(H) {
	let bestL = 0.5;
	let best = 0;
	for (let L = 0.2; L <= 0.9; L += 0.005) {
		const c = maxChroma(L, H);
		if (c > best) {
			best = c;
			bestL = L;
		}
	}
	return bestL;
}

function buildScale(scale, scheme) {
	const intent = Math.min(scale.chroma, peakChroma(scale.hue));
	const bgs = backgrounds(scheme);
	const dir = scheme === "light" ? -1 : 1;
	const worstL = scheme === "light" ? Math.min(...bgs) : Math.max(...bgs);
	const tint = scale.id === "neutral" ? 0.006 : intent;
	// Pessimistic on both sides, exactly as the shipping solver does.
	const worstY = luminanceBiased(worstL, tint, scale.hue, dir);

	const steps = {};
	bgs.forEach((L, i) => {
		steps[BG_BAND[i]] = {
			l: L,
			c: round3(Math.min(intent, maxChroma(L, scale.hue))),
			role: "background",
		};
	});

	const failures = [];
	for (const spec of FG_SPEC) {
		if (spec.solid) {
			const base = brandPoint(scale.hue);
			const l = round3(clamp01(spec.away ? base + dir * spec.away : base));
			steps[spec.step] = {
				l,
				c: round3(Math.min(intent, maxChroma(l, scale.hue))),
				role: spec.intent,
			};
			continue;
		}

		const at = (L) =>
			luminanceBiased(
				L,
				Math.min(intent, maxChroma(L, scale.hue)),
				scale.hue,
				-dir,
			);
		if (contrast(at(POLE[scheme]), worstY) < spec.floor) {
			failures.push(
				`${scale.id} ${scheme}: step ${spec.step} cannot reach ${spec.floor}:1`,
			);
			continue;
		}
		let near = worstL;
		let far = POLE[scheme];
		for (let i = 0; i < 40; i++) {
			const mid = (near + far) / 2;
			if (contrast(at(mid), worstY) >= spec.floor) far = mid;
			else near = mid;
		}
		const l = clamp01(
			dir > 0 ? Math.ceil(far * 1000) / 1000 : Math.floor(far * 1000) / 1000,
		);
		steps[spec.step] = {
			l,
			c: round3(Math.min(intent, maxChroma(l, scale.hue))),
			role: spec.intent,
		};
	}
	return {
		steps,
		intent: round3(intent),
		ceiling: round3(peakChroma(scale.hue)),
		failures,
	};
}

/** Every foreground step against every background step. The real question. */
function verify(scale, scheme, built) {
	const breaches = [];
	const rows = [];
	for (const spec of FG_SPEC) {
		if (spec.solid) continue;
		const fg = built.steps[spec.step];
		if (!fg) continue;
		const cells = BG_BAND.map((b) => {
			const bg = built.steps[b];
			const r = contrast(
				luminance(fg.l, fg.c, scale.hue),
				luminance(bg.l, bg.c, scale.hue),
			);
			if (r < spec.floor - 0.005) {
				breaches.push(
					`${scale.id} ${scheme}: step ${spec.step} on ${b} = ${r.toFixed(2)} (floor ${spec.floor})`,
				);
			}
			return round3(r);
		});
		rows.push({ step: spec.step, floor: spec.floor, cells });
	}
	return { rows, breaches };
}

const scales = [];
const allBreaches = [];
const allFailures = [];

for (const scale of SCALES) {
	const schemes = {};
	for (const scheme of ["light", "dark"]) {
		const built = buildScale(scale, scheme);
		const { rows, breaches } = verify(scale, scheme, built);
		allFailures.push(...built.failures);
		allBreaches.push(...breaches);
		schemes[scheme] = {
			steps: built.steps,
			ratios: rows,
			backgrounds: backgrounds(scheme),
		};
	}
	scales.push({
		id: scale.id,
		note: scale.note ?? null,
		hue: scale.hue,
		seedChroma: scale.chroma,
		schemes,
	});
}

/** The three constants Q3 found — recomputed, not quoted. */
function ruleOfThumb() {
	const need = { border: 3, text: 4.5, high: 7 };
	const out = {};
	for (const [name, floor] of Object.entries(need)) {
		let step = null;
		for (const spec of FG_SPEC) {
			if (spec.solid || spec.floor < floor) continue;
			const ok = scales.every((s) =>
				["light", "dark"].every((sch) => {
					const row = s.schemes[sch].ratios.find((r) => r.step === spec.step);
					return row && row.cells.every((c) => c >= floor - 0.005);
				}),
			);
			if (ok) {
				step = spec.step;
				break;
			}
		}
		out[name] = step;
	}
	return out;
}

const rule = ruleOfThumb();

console.log("12-step palette preview\n");
for (const s of scales) {
	console.log(`  ${s.id}${s.note ? ` — ${s.note}` : ""}  hue ${s.hue}`);
}
console.log(
	`\n  rule of thumb — borders: step ${rule.border}, text: step ${rule.text}, high contrast: step ${rule.high}`,
);
if (allFailures.length) {
	console.error(`\n✗ ${allFailures.length} step(s) unreachable:`);
	for (const f of allFailures) console.error(`   ${f}`);
}
if (allBreaches.length) {
	console.error(`\n✗ ${allBreaches.length} pairing(s) under floor:`);
	for (const b of allBreaches.slice(0, 10)) console.error(`   ${b}`);
} else {
	console.log(
		"\n✓ every foreground step clears its floor against every background step,\n" +
			"  in both schemes, for all four hues — solved pessimistically.",
	);
}

const types = `/** One step: a lightness and a chroma, wearing the scale's hue. */
export interface PaletteStep {
	readonly l: number;
	readonly c: number;
	readonly role: string;
}

/** Measured ratios for one foreground step against every background step. */
export interface PaletteRatios {
	readonly step: number;
	readonly floor: number;
	readonly cells: readonly number[];
}

export interface PaletteScheme {
	readonly steps: Record<string, PaletteStep>;
	readonly ratios: readonly PaletteRatios[];
	readonly backgrounds: readonly number[];
}

export interface PaletteScale {
	readonly id: string;
	readonly note: string | null;
	readonly hue: number;
	readonly seedChroma: number;
	readonly schemes: Record<"light" | "dark", PaletteScheme>;
}

/** What a foreground step is for, and the floor it was solved against. */
export interface PaletteIntent {
	readonly step: number;
	readonly intent: string;
	readonly floor?: number;
	readonly solid?: boolean;
	readonly away?: number;
}

`;

writeFileSync(
	OUT,
	"/* GENERATED — node scripts/generate-palette-preview.mjs. Preview only:\n" +
		"   no CSS, no tokens. See .agent/records/palette-spike.md. */\n\n" +
		types +
		`export const PALETTE_BANDS: Record<"background" | "foreground", readonly number[]> = ${JSON.stringify({ background: BG_BAND, foreground: FG_BAND })};\n\n` +
		`export const PALETTE_INTENTS: readonly PaletteIntent[] = ${JSON.stringify(FG_SPEC)};\n\n` +
		`export const PALETTE_RULE: Record<string, number | null> = ${JSON.stringify(rule)};\n\n` +
		`export const PALETTE_SCALES: readonly PaletteScale[] = ${JSON.stringify(scales)};\n`,
);
console.log(`\n✓ wrote ${OUT.replace(REPO + "/", "")}`);
