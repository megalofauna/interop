import { InjectionToken, Signal } from "@angular/core";

export type SliderOrientation = "horizontal" | "vertical";

/**
 * Formatter for a slider's `aria-valuetext` and (optionally) the visual
 * `<output interop-slider-value>` companion. Pure function — receives the
 * current numeric value, returns a human-readable string.
 */
export type SliderValueFormatter = (value: number) => string;

/**
 * Public reactive surface of an InteropSlider, shared with companion
 * components (`<output interop-slider-value>` and `[interop-slider-marks]`).
 *
 * Exposed via `INTEROP_SLIDER_TOKEN` so companions can read live state
 * without each one re-implementing a DOM listener on the underlying
 * `<input type="range">` element.
 */
export interface InteropSliderApi {
	readonly min: Signal<number>;
	readonly max: Signal<number>;
	readonly step: Signal<number>;
	readonly value: Signal<number>;
	readonly disabled: Signal<boolean>;
	/**
	 * Layout orientation. On the interface — not just on the two
	 * implementations — because `<interop-slider-legend>` has to flip its own
	 * axis to match, and a legend that read the DOM attribute instead would be
	 * a second source of truth for the same question. Both implementations
	 * already had it; a range thumb resolves it from its parent group.
	 */
	readonly orientation: Signal<SliderOrientation>;
	readonly valueText: Signal<SliderValueFormatter | null>;
	readonly fillPercent: Signal<number>;
	readonly element: HTMLInputElement;
	readonly elementId: () => string;
}

/**
 * One resolved mark, ready to position. `p` is the mark's fraction of the
 * slider's `[min, max]` domain — 0 at the minimum, 1 at the maximum.
 *
 * Produced by `[interop-slider-marks]` (the only place that normalises marks)
 * and consumed by `<interop-slider-legend>`, so a label and its tick are
 * computed once and cannot drift. A 0–1 NUMBER rather than a percentage, for
 * the same reason `--itx-slider-fill` is: the stylesheet maps it onto the
 * thumb's travel with `half-target + (100% - target) * p`, and `calc()` can
 * multiply a length-percentage by a number but cannot divide by a percentage.
 */
export interface SliderLegendItem {
	readonly value: number;
	readonly label: string;
	readonly p: number;
}

export const INTEROP_SLIDER_TOKEN = new InjectionToken<InteropSliderApi>(
	"InteropSlider",
);

/**
 * Public reactive surface of an InteropSliderRange parent. Used by the
 * two `<input type="range" interop-slider-thumb>` children to read shared
 * min/max/step and to clamp against each other.
 */
export interface InteropSliderRangeApi {
	readonly min: Signal<number>;
	readonly max: Signal<number>;
	readonly step: Signal<number>;
	readonly disabled: Signal<boolean>;
	/**
	 * Shared orientation. Thumbs read it so the group and its handles cannot
	 * disagree — a vertical range whose thumbs stayed horizontal drew a vertical
	 * track with two handles sliding across it.
	 */
	readonly orientation: Signal<SliderOrientation>;
	readonly valueText: Signal<SliderValueFormatter | null>;
	readonly start: Signal<number>;
	readonly end: Signal<number>;
	registerThumb(thumb: SliderRangeThumbRef): void;
	unregisterThumb(thumb: SliderRangeThumbRef): void;
	notifyThumbChange(role: "start" | "end", value: number): void;
	notifyThumbCommit(role: "start" | "end", value: number): void;
}

export interface SliderRangeThumbRef {
	readonly role: () => "start" | "end";
	readonly element: HTMLInputElement;
}

export const INTEROP_SLIDER_RANGE_TOKEN =
	new InjectionToken<InteropSliderRangeApi>("InteropSliderRange");
