/**
 * Contrast measured from the SHIPPED CSS, at runtime, in the browser.
 *
 * The generator already computes every ratio in this system and refuses to
 * write a stylesheet where one is missing its floor. So why measure again?
 *
 * Because a ratio asserted by the generator only proves the generator agrees
 * with itself. It cannot catch an emission bug, a token that resolved to the
 * wrong layer's value, a `light-dark()` that composed at the wrong ancestor, or
 * a component reading `border` where it meant `text`. Those are failures of the
 * CSS, and the only instrument that sees them is the browser rendering it.
 *
 * So the demo takes the same measurement from the other end. Where the two
 * agree, the pipeline is sound end to end. Where they disagree, the demo is
 * right and something between the solver and the stylesheet is not.
 *
 * Everything here resolves colour through a canvas rather than parsing strings.
 * A computed `background-color` may serialize as `rgb()`, `oklch()`, or
 * `color(srgb …)` depending on the browser and the authored value; the canvas
 * resolves all of them to the same 8-bit sRGB the user actually sees, which is
 * the space WCAG's formula is defined in.
 */

/** Red, green, blue — 0–255, straight sRGB, alpha already composited away. */
export type Rgb = readonly [number, number, number];

/** WCAG's coefficients, and the sRGB transfer function it inverts. */
const COEFFICIENTS = [0.2126, 0.7152, 0.0722] as const;

let context: CanvasRenderingContext2D | null | undefined;

/**
 * One 1×1 canvas for the whole page, created lazily.
 *
 * `undefined` means "not yet asked"; `null` means "asked, and this environment
 * cannot answer" — no DOM, or a context that was refused. Distinguishing the
 * two keeps us from retrying a failure on every swatch in a table.
 */
function ctx(): CanvasRenderingContext2D | null {
	if (context !== undefined) return context;
	if (typeof document === "undefined") return (context = null);
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = 1;
	return (context = canvas.getContext("2d", { willReadFrequently: true }));
}

/**
 * Resolve any CSS colour to sRGB, composited over `backdrop`.
 *
 * Returns null for anything the browser will not accept, rather than a
 * plausible-looking black — a swatch that silently measures as black would read
 * as a dramatic contrast result instead of a bug.
 */
export function resolveRgb(color: string, backdrop = "#ffffff"): Rgb | null {
	const c = ctx();
	if (!c || !color) return null;

	// `fillStyle` keeps its previous value when handed something invalid, so
	// probe against two different sentinels: a colour that fails to change
	// either of them is one the browser does not recognise.
	c.fillStyle = "#000000";
	c.fillStyle = color;
	if (c.fillStyle === "#000000") {
		c.fillStyle = "#ffffff";
		c.fillStyle = color;
		if (c.fillStyle === "#ffffff") return null;
	}
	const resolved = c.fillStyle;

	// Backdrop first, then the colour over it: any alpha composites exactly as
	// it would on the page, instead of being silently dropped.
	c.clearRect(0, 0, 1, 1);
	c.fillStyle = backdrop;
	c.fillRect(0, 0, 1, 1);
	c.fillStyle = resolved;
	c.fillRect(0, 0, 1, 1);

	const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
	return [r, g, b];
}

/** WCAG relative luminance. Expects straight sRGB, 0–255. */
export function relativeLuminance([r, g, b]: Rgb): number {
	const linear = [r, g, b].map((channel) => {
		const v = channel / 255;
		return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	});
	return linear.reduce((sum, v, i) => sum + v * COEFFICIENTS[i], 0);
}

/**
 * Contrast ratio between two CSS colours, as WCAG defines it.
 *
 * `foreground` is composited over `background`, so a translucent text colour or
 * a tint with alpha measures what it actually looks like rather than what it
 * would look like if it were opaque. NaN if either colour cannot be resolved —
 * callers should render that as "—", not as a number.
 */
export function contrastRatio(foreground: string, background: string): number {
	const bg = resolveRgb(background);
	if (!bg) return Number.NaN;
	const fg = resolveRgb(foreground, background);
	if (!fg) return Number.NaN;

	const a = relativeLuminance(fg);
	const b = relativeLuminance(bg);
	return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** A used value off a live element — the value after the cascade, not the token. */
export function usedValue(el: Element, property: string): string {
	if (typeof getComputedStyle === "undefined") return "";
	return getComputedStyle(el).getPropertyValue(property).trim();
}

/**
 * The background an element is really sitting on.
 *
 * Walks ancestors until it finds one that actually paints, because that is the
 * question the ladder cares about: a rank is a contrast target against whatever
 * surface it landed on, and in this system that surface is usually painted by
 * an ancestor several levels up rather than by the element itself. Falls back to
 * the canvas colour so a measurement at the top of the document still resolves.
 */
export function effectiveBackground(el: Element): string {
	for (let node: Element | null = el; node; node = node.parentElement) {
		const color = usedValue(node, "background-color");
		const rgb = resolveRgb(color, "#000000");
		const overWhite = resolveRgb(color, "#ffffff");
		// Transparent resolves to whatever it was drawn over, so a colour that
		// changes with its backdrop is one that does not paint.
		if (rgb && overWhite && rgb.join() === overWhite.join()) return color;
	}
	if (typeof document === "undefined") return "#ffffff";
	return usedValue(document.documentElement, "background-color") || "#ffffff";
}

/**
 * Measure an element's own foreground against the surface it landed on.
 *
 * This is the demo's workhorse: point it at a rendered accent — a callout's
 * accent bar at layer 3, a status text on a nested card — and it reports what
 * that pairing actually measures, wherever the layer engine happened to put it.
 */
export function measure(el: Element, property = "color"): number {
	return contrastRatio(usedValue(el, property), effectiveBackground(el));
}

/** Formatted for display. Non-finite reads as an em dash, never as a number. */
export function formatRatio(ratio: number): string {
	return Number.isFinite(ratio) ? `${ratio.toFixed(2)}:1` : "—";
}

/** Whether a measured ratio clears a floor, with a hair of rounding tolerance. */
export function clearsFloor(ratio: number, floor: number): boolean {
	return Number.isFinite(ratio) && ratio >= floor - 0.005;
}
