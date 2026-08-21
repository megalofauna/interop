/*
 * OKLCH → sRGB → WCAG, as pure functions.
 *
 * SPIKE: lifted verbatim from scripts/generate-color-ladder.mjs to test how
 * hard the extraction is. It was easy — this block has no dependencies on the
 * generator's configuration at all, which is the answer the config-seam work
 * needed. Nothing here knows what a layer or a rank is.
 */

export const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** OKLCH → linear sRGB. Björn Ottosson's matrices. */
export function oklchToLinearSrgb(L, C, H) {
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
export function luminance(L, C, H) {
	const linear = oklchToLinearSrgb(L, C, H);
	const [r, g, b] = linear.map((u) =>
		decodeGamma(Math.round(clamp01(encodeGamma(clamp01(u))) * 255) / 255),
	);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const contrast = (y1, y2) => {
	const [hi, lo] = y1 >= y2 ? [y1, y2] : [y2, y1];
	return (hi + 0.05) / (lo + 0.05);
};

export const inGamut = (L, C, H) =>
	oklchToLinearSrgb(L, C, H).every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** Greatest chroma this (lightness, hue) can actually display in sRGB. */
export function maxChroma(L, H) {
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
export function peakChroma(H) {
	let peak = 0;
	for (let L = 0.15; L <= 0.97; L += 0.01)
		peak = Math.max(peak, maxChroma(L, H));
	return peak;
}

export const round3 = (n) => Math.round(n * 1000) / 1000;

/**
 * Smallest lightness away from `fromL` toward `poleL` that clears `target`
 * against it, keeping as much of `chromaIntent` as the gamut allows.
 *
 * Returns null when even the pole cannot reach the target — which is the answer
 * the spike is looking for.
 */
export function solveAway(fromL, chromaIntent, H, target, poleL, tint) {
	const fromY = luminance(fromL, tint.c ?? chromaIntent, tint.h ?? H);
	const at = (L) => {
		const C = Math.min(chromaIntent, maxChroma(L, H));
		return { L, C, y: luminance(L, C, H) };
	};
	if (contrast(at(poleL).y, fromY) < target) return null;

	let near = fromL;
	let far = poleL;
	for (let i = 0; i < 40; i++) {
		const mid = (near + far) / 2;
		if (contrast(at(mid).y, fromY) >= target) far = mid;
		else near = mid;
	}
	// Round AWAY from the surface: rounding to 3dp can drop the ratio below its
	// floor, so round in the direction that can only add contrast.
	const snapped =
		poleL > fromL ? Math.ceil(far * 1000) / 1000 : Math.floor(far * 1000) / 1000;
	const L = clamp01(snapped);
	const C = round3(Math.min(chromaIntent, maxChroma(L, H)));
	return { L, C, ratio: contrast(luminance(L, C, H), fromY) };
}
