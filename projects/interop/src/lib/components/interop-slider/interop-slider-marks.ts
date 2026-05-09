import {
	Directive,
	afterNextRender,
	computed,
	inject,
	input,
	isDevMode,
} from "@angular/core";
import {
	INTEROP_SLIDER_TOKEN,
	type InteropSliderApi,
} from "./interop-slider.token";

export type SliderMark = number | { value: number; label?: string };

const MAJOR_COLOR = "var(--itx-slider-mark-color, currentColor)";
const MINOR_COLOR =
	"var(--itx-slider-mark-minor-color, color-mix(in srgb, currentColor 30%, transparent))";
const MAJOR_THICKNESS = "var(--itx-slider-mark-thickness, 2px)";
const MINOR_THICKNESS =
	"var(--itx-slider-mark-minor-thickness, var(--itx-slider-mark-thickness, 1px))";

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
 * ## Tokens
 *   --itx-slider-mark-color           Major tick stripe color.
 *   --itx-slider-mark-thickness       Major tick stripe width (default 2px).
 *   --itx-slider-mark-minor-color     Minor tick color (default ~30% currentColor).
 *   --itx-slider-mark-minor-thickness Minor tick width (default = major thickness).
 *
 * @remarks Range sliders — marks on `[interop-slider-thumb]` are not
 * visible: the thumb's track is transparent (the parent draws the track).
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

	/**
	 * Major mark positions. Either a list of values, or objects with
	 * `{ value, label? }`. Labels are accepted for forward-compatibility
	 * but not yet rendered — supply your own label row beneath the
	 * slider for now.
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

	private readonly majorPercents = computed<number[]>(() => {
		const slider = this.slider;
		if (!slider) return [];
		const min = slider.min();
		const max = slider.max();
		if (max === min) return [];
		return this.marks()
			.map((m) => (typeof m === "number" ? m : m.value))
			.filter((v) => v >= min && v <= max)
			.sort((a, b) => a - b)
			.map((v) => ((v - min) / (max - min)) * 100);
	});

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
			// Uniform [0, 100] coverage: middle ticks via a single repeating
			// gradient, edge ticks (0% and 100%) layered on top so they sit
			// flush to the track edges instead of being clipped off-screen.
			return [
				edgeTickStart(MAJOR_COLOR, MAJOR_THICKNESS),
				edgeTickEnd(MAJOR_COLOR, MAJOR_THICKNESS),
				repeatingCenteredTicks(stride, MAJOR_COLOR, MAJOR_THICKNESS),
			].join(", ");
		}
		// Fallback: rare, opt-in, non-uniform marks
		return perTickGradient(m, MAJOR_COLOR, MAJOR_THICKNESS);
	});

	protected readonly minorBackground = computed(() => {
		const subs = this.subdivisions();
		if (subs < 2) return null;
		const majorStride = this.uniformMajorStride();
		if (majorStride === null) return null;
		// Minors at 0% and 100% are visually covered by major edge ticks, so
		// we don't bother enhancing them — the half-clipped repeating output
		// hides under the majors. Middle minors are centered correctly.
		return repeatingCenteredTicks(majorStride / subs, MINOR_COLOR, MINOR_THICKNESS);
	});

	constructor() {
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
						`[InteropSliderMarks] subdivisions (${subs}) must be 0 or ≥ 2. ` +
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

/**
 * Stripe of width `thickness` flush to the left edge — the explicit "tick
 * at 0%" that the repeating-gradient pattern can't paint correctly.
 */
function edgeTickStart(color: string, thickness: string): string {
	return `linear-gradient(to right, ${color} 0 ${thickness}, transparent ${thickness})`;
}

/**
 * Stripe of width `thickness` flush to the right edge — the explicit "tick
 * at 100%" that the repeating-gradient pattern can't paint correctly.
 */
function edgeTickEnd(color: string, thickness: string): string {
	return (
		`linear-gradient(to right, ` +
		`transparent calc(100% - ${thickness}), ` +
		`${color} calc(100% - ${thickness}) 100%)`
	);
}

/**
 * Repeating gradient with one centered stripe per cycle. Stripe centers
 * land at `stride`, `2 * stride`, ..., — i.e., at positions, NOT shifted
 * to the left. The 0% and 100% positions get half-stripes (right and
 * left half respectively); callers paint full edge ticks separately.
 */
function repeatingCenteredTicks(
	stridePct: number,
	color: string,
	thickness: string,
): string {
	const half = `calc(${thickness} / 2)`;
	return (
		`repeating-linear-gradient(to right, ` +
		`${color} 0 ${half}, ` +
		`transparent ${half} calc(${stridePct}% - ${half}), ` +
		`${color} calc(${stridePct}% - ${half}) ${stridePct}%)`
	);
}

function perTickGradient(
	positions: number[],
	color: string,
	thickness: string,
): string | null {
	if (positions.length === 0) return null;
	const half = `calc(${thickness} / 2)`;
	return positions
		.map(
			(pct) =>
				`linear-gradient(to right, ` +
					`transparent calc(${pct}% - ${half}), ` +
					`${color} calc(${pct}% - ${half}), ` +
					`${color} calc(${pct}% + ${half}), ` +
					`transparent calc(${pct}% + ${half}))`,
		)
		.join(", ");
}
