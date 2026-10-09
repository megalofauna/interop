import {
	DestroyRef,
	Directive,
	afterNextRender,
	computed,
	inject,
	input,
	isDevMode,
} from "@angular/core";
import { InteropSliderRegistry } from "./interop-slider-registry";
import {
	INTEROP_SLIDER_TOKEN,
	type InteropSliderApi,
	type SliderLegendItem,
} from "./interop-slider.token";

export type SliderMark = number | { value: number; label?: string };

/**
 * Gradient direction. Published by the slider's stylesheet as
 * `--itx-slider-axis` (`to right` / `to left` / `to bottom`), so a tick can
 * never disagree with the fill about which way "along the track" is. A tick
 * gradient that hard-coded `to right` painted stripes ACROSS a vertical track.
 */
const AXIS = "var(--itx-slider-axis, to right)";

/**
 * Carbon's tick is `$border-subtle` sitting clear of the track. Ours has to
 * read against both the unfilled track (rank 2) and the filled one (rank 6),
 * so a major tick takes rank 3 and a minor one the hairline rank —
 * `currentColor`, the previous default, is the page's text colour and vanished
 * into the fill.
 *
 * No fallbacks. The values live in `themes/protocol/components/slider.css`
 * with the rest of the slider's surface, and a duplicate stated here — in a
 * language the theme cannot see — is exactly the second source of truth the
 * two-file split exists to remove. Two of them were already stale: the ramp
 * this comment used to name (neutral-4 / neutral-12) was deleted in ITX-40.
 */
const MAJOR_COLOR = "var(--itx-slider-mark-color)";
const MINOR_COLOR = "var(--itx-slider-mark-minor-color)";
const MAJOR_THICKNESS = "var(--itx-slider-mark-thickness)";
const MINOR_THICKNESS = "var(--itx-slider-mark-minor-thickness)";

const TOL = 1e-9;

/**
 * InteropSliderMarks — vertical tick marks on a slider's track.
 *
 * Apply alongside `[interop-slider]`. Reads the slider's `min` / `max`
 * reactively and exposes the rendered ticks as two CSS custom properties
 * (`--itx-slider-marks-image` for majors, `--itx-slider-marks-minor-image`
 * for subdivisions), which the slider's track pseudo-element layers on
 * top of its own background.
 *
 * Marks are visual only — they do NOT change the slider's snap behavior
 * (that's `[step]`'s job) or affect ARIA values. Marks beyond the
 * slider's `[min, max]` range are filtered out.
 *
 * ## Subdivisions
 * When `[interop-slider-marks-subdivisions]` is set to N (≥ 2), N − 1
 * dimmed minor ticks are auto-generated between each consecutive pair of
 * major marks. Subdivisions require uniformly-spaced majors that cover
 * the full `[min, max]` range; non-uniform majors are flagged in dev mode
 * and minor ticks are skipped.
 *
 * ## Rendering
 * Uniform marks compile to a single `repeating-linear-gradient` per layer
 * (compact, fast). Non-uniform marks fall back to a `linear-gradient`
 * per tick — heavier output but still functional. Prefer uniform marks
 * whenever possible.
 *
 * Every tick is painted in the thumb's TRAVEL space, not across the whole
 * element: a native range reserves the thumb's box at each end, so a tick at a
 * raw percentage of the control misses the parked thumb by half the thumb
 * target. The stylesheet handles that by sizing the mark band to the travel
 * (`--_mark-size`), which is why nothing here does endpoint arithmetic — see
 * the "Marks are painted in the thumb's TRAVEL space" note in
 * `styles/components/slider.css`.
 *
 * ## Labels
 * A mark supplied as `{ value, label }` is rendered as visible text by
 * `<interop-slider-legend for="…">`, a sibling component. This directive
 * publishes its resolved marks — value, label and fraction of the domain — to
 * `InteropSliderRegistry` under the slider's element id, so the legend reads
 * back the SAME normalisation that produced the tick. A label therefore cannot
 * drift from the tick it names.
 *
 * ## Tokens
 *   --itx-slider-mark-color           Major tick color (default --itx-contrast-3).
 *   --itx-slider-mark-thickness       Major tick width along the track (2px).
 *   --itx-slider-mark-minor-color     Minor tick color (default --itx-contrast-2).
 *   --itx-slider-mark-minor-thickness Minor tick width along the track (1px).
 *   --itx-slider-mark-length          Tick extent ACROSS the track (0.5rem).
 *
 * All five are declared in `styles/themes/protocol/components/slider.css`.
 * They are read here without fallbacks, deliberately — see the constants.
 *
 * Ticks are painted on the input's own background, behind the track, so they
 * read above and below the 2px track rather than through it — which is where
 * Carbon puts its own mid-point notch.
 *
 * @remarks Range sliders — marks on `[interop-slider-thumb]` are not
 * visible: a thumb inside `<interop-slider-range>` paints no background of
 * its own, because the parent owns the track.
 *
 * @example Major + minor (dimmed) ticks
 * ```html
 * <input type="range" interop-slider [min]="0" [max]="100" [step]="5"
 *        [(value)]="quality"
 *        [interop-slider-marks]="[0, 25, 50, 75, 100]"
 *        [interop-slider-marks-subdivisions]="5"
 *        aria-label="Quality" />
 * ```
 */
@Directive({
	selector: "input[type=range][interop-slider-marks]",
	standalone: true,
	host: {
		"[style.--itx-slider-marks-image]": "majorBackground()",
		"[style.--itx-slider-marks-minor-image]": "minorBackground()",
	},
})
export class InteropSliderMarks {
	private readonly slider: InteropSliderApi | null = inject(
		INTEROP_SLIDER_TOKEN,
		{ self: true, optional: true },
	);
	private readonly registry = inject(InteropSliderRegistry);
	private readonly destroyRef = inject(DestroyRef);

	/**
	 * Major mark positions. Either a list of values, or objects with
	 * `{ value, label? }`. A mark carrying a label is rendered as visible
	 * text by `<interop-slider-legend for="…">`, centred on its own tick;
	 * marks without one draw a tick and nothing else.
	 */
	readonly marks = input<SliderMark[]>([], { alias: "interop-slider-marks" });

	/**
	 * Number of subdivisions between each consecutive pair of major marks.
	 * `N` produces `N − 1` minor ticks per interval. Set to 0 or 1 to
	 * disable minor ticks entirely. Requires uniformly-spaced majors.
	 * Default: 0.
	 */
	readonly subdivisions = input<number>(0, {
		alias: "interop-slider-marks-subdivisions",
	});

	/**
	 * Every in-range mark, sorted, with its label and its fraction of the
	 * domain. THE normalisation — the tick gradients and the legend both
	 * derive from this one computed, so a label can never disagree with the
	 * tick it sits under about where the value is.
	 */
	readonly resolved = computed<SliderLegendItem[]>(() => {
		const slider = this.slider;
		if (!slider) return [];
		const min = slider.min();
		const max = slider.max();
		if (max === min) return [];
		return this.marks()
			.map((m) =>
				typeof m === "number"
					? { value: m, label: "" }
					: { value: m.value, label: m.label ?? "" },
			)
			.filter((m) => m.value >= min && m.value <= max)
			.sort((a, b) => a.value - b.value)
			.map((m) => ({ ...m, p: (m.value - min) / (max - min) }));
	});

	private readonly majorPercents = computed<number[]>(() =>
		this.resolved().map((m) => m.p * 100),
	);

	/**
	 * Returns the uniform stride (in %) IF all majors are evenly spaced
	 * AND span the full [0, 100] domain. Otherwise null — caller decides
	 * whether to fall back to per-tick rendering or skip altogether.
	 */
	private readonly uniformMajorStride = computed<number | null>(() => {
		const m = this.majorPercents();
		if (m.length < 2) return null;
		if (Math.abs(m[0]) > TOL) return null;
		if (Math.abs(m[m.length - 1] - 100) > TOL) return null;
		const stride = m[1] - m[0];
		for (let i = 2; i < m.length; i++) {
			if (Math.abs(m[i] - m[i - 1] - stride) > TOL) return null;
		}
		return stride;
	});

	protected readonly majorBackground = computed(() => {
		const m = this.majorPercents();
		if (m.length === 0) return null;
		const stride = this.uniformMajorStride();
		if (stride !== null) {
			return uniformTicks(stride / 100, MAJOR_COLOR, MAJOR_THICKNESS, "0px");
		}
		return everyTickInOneGradient(
			m.map((pct) => pct / 100),
			MAJOR_COLOR,
			MAJOR_THICKNESS,
		);
	});

	protected readonly minorBackground = computed(() => {
		const subs = this.subdivisions();
		if (subs < 2) return null;
		const majorStride = this.uniformMajorStride();
		if (majorStride === null) return null;
		return uniformTicks(
			majorStride / 100 / subs,
			MINOR_COLOR,
			MINOR_THICKNESS,
			MINOR_PHASE,
		);
	});

	constructor() {
		// Publish the resolved marks under the slider's element id, the same key
		// `<output interop-slider-value for>` already resolves through. The
		// SIGNAL is registered, not its value, so the legend re-renders on an
		// input change without the registry having to notice.
		afterNextRender(() => {
			const slider = this.slider;
			if (!slider) return;
			const id = slider.elementId();
			this.registry.registerMarks(id, this.resolved);
			this.destroyRef.onDestroy(() => this.registry.unregisterMarks(id));
		});

		if (isDevMode()) {
			afterNextRender(() => {
				if (!this.slider) {
					console.warn(
						"[InteropSliderMarks] must be applied alongside " +
							"[interop-slider] or [interop-slider-thumb].",
					);
				}
				const subs = this.subdivisions();
				if (subs !== 0 && subs < 2) {
					console.warn(
						`[InteropSliderMarks] subdivisions (${subs}) must be 0 or \u2265 2. ` +
							"Treating as 0 (no minor ticks).",
					);
				}
				if (subs >= 2 && this.uniformMajorStride() === null) {
					console.warn(
						"[InteropSliderMarks] subdivisions require uniformly-spaced " +
							"majors that span the full [min, max] range. Minor ticks " +
							"will be skipped.",
					);
				}
			});
		}
	}
}

/*
 * ── The tile, and why every offset below is a length rather than a % ────────
 *
 * The stylesheet paints these into a tile of
 * `travel + --itx-slider-mark-thickness`, centred, where travel is the thumb
 * centre's range. Tile-local 0 is therefore half a MAJOR tick before the
 * travel's start, which is exactly the room a tick centred on the first value
 * needs in order not to be clipped.
 *
 * Two things follow, and both are why this file no longer paints separate
 * "edge ticks" on top of the pattern:
 *
 *   A tick centred on travel-fraction p sits at tile-local
 *   `MAJOR_THICKNESS / 2 + p * travel`, and `travel` is expressible inside the
 *   gradient as `100% - MAJOR_THICKNESS` — because there, `100%` IS the tile.
 *   So every position is exact, including the outermost two, with no
 *   special case and no 1px fudge.
 *
 *   The first tick's band starts at tile-local 0 and the last one's ends at
 *   tile-local 100%. Nothing overflows, so `no-repeat` clips nothing, and a
 *   repeating pattern cannot bleed a spurious tick into the gutter however
 *   short its period gets.
 *
 * MAJOR_THICKNESS is the tile's padding in BOTH cases — a minor tick reads it
 * too, and takes MINOR_PHASE to put its thinner band back on centre.
 */

/** The tile's own travel span: everything but the half-tick of padding. */
const TRAVEL = `calc(100% - ${MAJOR_THICKNESS})`;

/**
 * How far a minor tick's band must start after a major's for the two to share
 * a centre — half the difference in their thicknesses.
 */
const MINOR_PHASE = `calc((${MAJOR_THICKNESS} - ${MINOR_THICKNESS}) / 2)`;

/**
 * One repeating gradient, one tick per cycle, centred on
 * `phase + k * stride * travel` for every k.
 *
 * A repeating gradient's period is (last stop - first stop) and it repeats in
 * BOTH directions from there, so stating the first stop at `phase` is what
 * sets the pattern's alignment. No `background-position` is involved and none
 * can be — that would move every layer at once.
 */
function uniformTicks(
	stride: number,
	color: string,
	thickness: string,
	phase: string,
): string {
	const period = `calc(${TRAVEL} * ${stride})`;
	return (
		`repeating-linear-gradient(${AXIS}, ` +
		`${color} ${phase} calc(${phase} + ${thickness}), ` +
		`transparent calc(${phase} + ${thickness}) calc(${phase} + ${period}))`
	);
}

/**
 * Non-uniform marks: ONE gradient carrying every tick, not one gradient per
 * tick. The positions are already sorted, which is the only precondition a
 * multi-stop gradient has — and a fixed layer count is what lets the
 * stylesheet give the marks and the track different background-sizes without
 * the list cycling out of step.
 */
function everyTickInOneGradient(
	fractions: number[],
	color: string,
	thickness: string,
): string | null {
	if (fractions.length === 0) return null;
	const half = `calc(${thickness} / 2)`;
	const stops = fractions.flatMap((p) => {
		const centre = `calc(${MAJOR_THICKNESS} / 2 + ${TRAVEL} * ${p})`;
		const start = `calc(${centre} - ${half})`;
		const end = `calc(${centre} + ${half})`;
		return [
			`transparent ${start}`,
			`${color} ${start}`,
			`${color} ${end}`,
			`transparent ${end}`,
		];
	});
	return `linear-gradient(${AXIS}, ${stops.join(", ")})`;
}
