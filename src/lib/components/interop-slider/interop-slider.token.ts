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
	readonly valueText: Signal<SliderValueFormatter | null>;
	readonly fillPercent: Signal<number>;
	readonly element: HTMLInputElement;
	readonly elementId: () => string;
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
