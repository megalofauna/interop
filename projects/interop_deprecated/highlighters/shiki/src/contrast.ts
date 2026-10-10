/**
 * Contrast repair for syntax themes.
 *
 * A syntax theme is the one place colour enters this system without passing a
 * floor. Everything else is either solved by the generator or measured against
 * the surface it lands on; a theme ships fixed hex values chosen against a
 * background it has never seen. Measured against Interop's dark ramp,
 * `github-dark` puts comments at 3.48:1 falling to 2.00:1 by layer 4, and its
 * keyword and entity colours drop under AA from layer 3 down.
 *
 * So the colours get lifted before they are rendered: hold the hue, move the
 * lightness away from the background only as far as the floor requires. That is
 * the same strategy the colour generator adopted for accent solids — a colour
 * that has been desaturated to hit a target is no longer the colour, whereas
 * one that has shifted lightness still reads as itself.
 *
 * The work happens in OKLab, where holding `a` and `b` while moving `L` keeps
 * the hue stable. Doing it in sRGB would swing the hue as channels clip.
 */

/** sRGB transfer function and its inverse. */
const toLinear = (u: number): number =>
	u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4;
const toGamma = (u: number): number =>
	u <= 0.0031308 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - 0.055;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** Linear sRGB triple, 0–1. */
type Rgb = [number, number, number];

export function parseHex(hex: string): Rgb | null {
	const h = hex.trim().replace(/^#/, "");
	const full =
		h.length === 3
			? h
					.split("")
					.map((c) => c + c)
					.join("")
			: h;
	if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
	return [0, 2, 4].map((i) =>
		toLinear(Number.parseInt(full.slice(i, i + 2), 16) / 255),
	) as Rgb;
}

function toHex([r, g, b]: Rgb): string {
	const channel = (u: number): string =>
		Math.round(clamp01(toGamma(clamp01(u))) * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** WCAG relative luminance from linear sRGB. */
function luminance([r, g, b]: Rgb): number {
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: number, b: number): number {
	const [hi, lo] = a >= b ? [a, b] : [b, a];
	return (hi + 0.05) / (lo + 0.05);
}

/* ── OKLab, both directions. Björn Ottosson's matrices. ──────────────────── */

function toOklab([r, g, b]: Rgb): [number, number, number] {
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	];
}

function fromOklab([L, a, b]: [number, number, number]): Rgb {
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	];
}

/** What a colour actually measures against a background. */
export function contrastOf(colorHex: string, backgroundHex: string): number {
	const fg = parseHex(colorHex);
	const bg = parseHex(backgroundHex);
	if (!fg || !bg) return Number.NaN;
	return ratio(luminance(fg), luminance(bg));
}

/**
 * Move `colorHex` away from `backgroundHex` until it clears `minRatio`.
 *
 * Returns the colour unchanged when it already clears, or when no lightness
 * can reach the floor — a theme colour that cannot be repaired is better left
 * recognisable than pushed to a pole it will never reach. Callers that need to
 * know can compare against `contrastOf`.
 */
export function liftContrast(
	colorHex: string,
	backgroundHex: string,
	minRatio: number,
): string {
	const fg = parseHex(colorHex);
	const bg = parseHex(backgroundHex);
	if (!fg || !bg) return colorHex;

	const bgY = luminance(bg);
	if (ratio(luminance(fg), bgY) >= minRatio) return colorHex;

	const [, a, b] = toOklab(fg);
	// Away from the background: lighter on a dark ground, darker on a light one.
	const pole = bgY < 0.18 ? 1 : 0;
	const at = (L: number): Rgb => fromOklab([L, a, b]);

	// The pole is the best this hue can do. If even that falls short, the theme
	// colour is unreachable and stays as authored.
	if (ratio(luminance(at(pole)), bgY) < minRatio) return colorHex;

	let near = toOklab(fg)[0];
	let far = pole;
	for (let i = 0; i < 30; i++) {
		const mid = (near + far) / 2;
		if (ratio(luminance(at(mid)), bgY) >= minRatio) far = mid;
		else near = mid;
	}
	return toHex(at(far));
}
