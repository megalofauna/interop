#!/usr/bin/env node
/*
 * SPIKE — 12-step named scales. Throwaway; see the plan.
 *
 * Answers Q2: can an arbitrary hue hold the offset guarantee?
 *
 * ── The step model, and where it departs from Radix ──────────────────────
 *
 * Radix's scale is monotonic in lightness: step 1 is the lightest and step 12
 * the darkest (in its light theme). Interop's elevation moves toward LIGHT in
 * both schemes — the light page is a mid-grey climbing to white — so a
 * monotonic scale would run elevation backwards.
 *
 * So the scale is banded rather than monotonic:
 *
 *   1–5   BACKGROUND band, ordered by elevation. Step 1 is the page; 2–5 are
 *         the layers above it. Moves toward light in both schemes.
 *   6–12  FOREGROUND band, ordered by increasing contrast AGAINST that band.
 *         Moves away from the backgrounds, so its direction flips per scheme.
 *
 * What matters is not that lightness ascends, but that CONTRAST ascends where
 * it is read — and it does. As swatches it still prints as a ramp, because the
 * background band is narrow and the foreground band travels.
 *
 * ── The worst case ───────────────────────────────────────────────────────
 *
 * A foreground has to clear its floor against EVERY background step, so it is
 * solved against the worst one — and which one that is flips per scheme:
 *
 *   light   backgrounds .898 → 1.0, foreground is dark → worst is step 1
 *   dark    backgrounds .232 → .39, foreground is light → worst is step 5
 */
import {
	contrast,
	luminance,
	maxChroma,
	peakChroma,
	round3,
	solveAway,
} from "./color/solve.mjs";

const STEPS = 12;
const BG_BAND = [1, 2, 3, 4, 5];
const FG_BAND = [6, 7, 8, 9, 10, 11, 12];

/** The background sub-ramp — computed, exactly as the engine would compute it. */
const BG = {
	light: { page: 0.898, step: 0.028, ease: 0.95, max: 1.0 },
	dark: { page: 0.232, step: 0.0395, ease: 1.0, max: 0.44 },
};

/** Foreground poles, per scheme. How far the band is allowed to travel. */
const POLE = { light: 0.12, dark: 0.97 };

/**
 * What each foreground step is FOR, and the floor it must clear against the
 * worst background in its band. Steps 9–10 are not contrast targets — they are
 * the brand fill, positioned by chroma, and they answer for their own label.
 */
const FG_SPEC = [
	{ step: 6, intent: "subtle border", floor: 1.5 },
	{ step: 7, intent: "ui border", floor: 2.0 },
	{ step: 8, intent: "strong border / accent rule", floor: 3.0 },
	{ step: 9, intent: "solid fill", solid: true },
	{ step: 10, intent: "solid, hovered", solid: true, away: 0.05 },
	{ step: 11, intent: "text", floor: 4.5 },
	{ step: 12, intent: "text, high contrast", floor: 7.0 },
];

const SCALES = [
	{ id: "neutral", hue: 250, chroma: 0.006 },
	{ id: "colorway", hue: 246.74, chroma: 0.11, note: "Jelly Bean" },
	{ id: "amber", hue: 82.32, chroma: 0.12, note: "Cream Can" },
	// The hostile case: lowest chroma ceiling anywhere on the circle.
	{ id: "hostile", hue: 215, chroma: 0.19, note: "teal — .145 ceiling" },
];

const buildBackgrounds = (scheme) => {
	const spec = BG[scheme];
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

function buildScale(scale, scheme) {
	const ceiling = peakChroma(scale.hue);
	const intent = Math.min(scale.chroma, ceiling);
	const backgrounds = buildBackgrounds(scheme);

	// Worst background: the one CLOSEST to where the foreground is heading.
	const worstL =
		scheme === "light"
			? Math.min(...backgrounds)
			: Math.max(...backgrounds);
	const tint = { c: scale.id === "neutral" ? 0.006 : intent, h: scale.hue };
	const worstY = luminance(worstL, tint.c, tint.h);

	const steps = {};
	backgrounds.forEach((L, i) => {
		const C = round3(Math.min(intent, maxChroma(L, scale.hue)));
		steps[BG_BAND[i]] = { L, C, role: "background" };
	});

	const failures = [];
	for (const spec of FG_SPEC) {
		if (spec.solid) {
			// The brand point: the lightness where this hue holds the most colour.
			let bestL = 0.5;
			let best = 0;
			for (let L = 0.2; L <= 0.9; L += 0.005) {
				const c = maxChroma(L, scale.hue);
				if (c > best) {
					best = c;
					bestL = L;
				}
			}
			const L = round3(
				spec.away ? bestL + (scheme === "light" ? -spec.away : spec.away) : bestL,
			);
			steps[spec.step] = {
				L,
				C: round3(Math.min(intent, maxChroma(L, scale.hue))),
				role: spec.intent,
			};
			continue;
		}

		const solved = solveAway(
			worstL,
			intent,
			scale.hue,
			spec.floor,
			POLE[scheme],
			tint,
		);
		if (!solved) {
			failures.push(
				`${scale.id} ${scheme}: step ${spec.step} (${spec.intent}) cannot reach ` +
					`${spec.floor}:1 against background L ${worstL} — the pole tops out at ` +
					`${contrast(luminance(POLE[scheme], maxChroma(POLE[scheme], scale.hue), scale.hue), worstY).toFixed(2)}:1`,
			);
			continue;
		}
		steps[spec.step] = { ...solved, role: spec.intent };
	}

	return { backgrounds, steps, intent, ceiling, failures, worstL };
}

/** Every foreground step against every background step. The real question. */
function verify(scale, scheme, built) {
	const rows = [];
	const breaches = [];
	for (const spec of FG_SPEC) {
		if (spec.solid) continue;
		const fg = built.steps[spec.step];
		if (!fg) continue;
		const cells = BG_BAND.map((b) => {
			const bg = built.steps[b];
			const ratio = contrast(
				luminance(fg.L, fg.C, scale.hue),
				luminance(bg.L, bg.C, scale.hue),
			);
			if (ratio < spec.floor - 0.005) {
				breaches.push(
					`${scale.id} ${scheme}: step ${spec.step} on step ${b} = ${ratio.toFixed(2)}:1 (floor ${spec.floor})`,
				);
			}
			return ratio;
		});
		rows.push({ step: spec.step, intent: spec.intent, floor: spec.floor, cells });
	}
	return { rows, breaches };
}

const allFailures = [];
const allBreaches = [];

for (const scale of SCALES) {
	console.log(
		`\n══ ${scale.id}${scale.note ? ` — ${scale.note}` : ""}  hue ${scale.hue}  ` +
			`seed C ${scale.chroma}  ceiling ${round3(peakChroma(scale.hue))}`,
	);
	for (const scheme of ["light", "dark"]) {
		const built = buildScale(scale, scheme);
		allFailures.push(...built.failures);
		const { rows, breaches } = verify(scale, scheme, built);
		allBreaches.push(...breaches);

		console.log(
			`\n  ${scheme.toUpperCase()}  backgrounds ${built.backgrounds.join(" ")}  (worst: L ${built.worstL})`,
		);
		console.log(
			`  step  ${"intent".padEnd(28)}${"L".padStart(7)}${"C".padStart(7)}` +
				BG_BAND.map((b) => `on ${b}`.padStart(8)).join(""),
		);
		for (const n of [...BG_BAND, ...FG_BAND]) {
			const s = built.steps[n];
			if (!s) continue;
			const row = rows.find((r) => r.step === n);
			const cells = row
				? row.cells
						.map(
							(c) =>
								`${c.toFixed(2)}${c < row.floor - 0.005 ? "!" : " "}`.padStart(8),
						)
						.join("")
				: "";
			console.log(
				`  ${String(n).padEnd(6)}${s.role.padEnd(28)}${s.L.toFixed(3).padStart(7)}${s.C.toFixed(3).padStart(7)}${cells}`,
			);
		}
	}
}

console.log("\n" + "─".repeat(78));
if (allFailures.length) {
	console.log(`\n✗ ${allFailures.length} step(s) had NO solution:`);
	for (const f of allFailures) console.log(`   ${f}`);
}
if (allBreaches.length) {
	console.log(`\n✗ ${allBreaches.length} pairing(s) under floor:`);
	for (const b of allBreaches.slice(0, 20)) console.log(`   ${b}`);
	if (allBreaches.length > 20)
		console.log(`   … and ${allBreaches.length - 20} more`);
}
if (!allFailures.length && !allBreaches.length) {
	console.log(
		"\n✓ Q2 PASSES — every foreground step clears its floor against every\n" +
			"  background step, in both schemes, for all four hues including the\n" +
			"  .145-ceiling hostile case.",
	);
}
