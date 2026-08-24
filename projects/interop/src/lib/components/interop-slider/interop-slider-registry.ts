import { Injectable, type Signal, signal } from "@angular/core";
import type {
	InteropSliderApi,
	SliderLegendItem,
} from "./interop-slider.token";

/**
 * Tiny element-id-keyed registry of `InteropSliderApi` instances. Used by
 * `<output interop-slider-value>` to resolve its target slider via the
 * native `[for]` attribute without forcing the consumer to wire DI.
 *
 * Sliders register themselves on construction (after their element id is
 * resolved) and unregister on destroy. Output companions read the registry
 * inside a `computed` — `version` is bumped on every (un)register so the
 * signal participates in change detection.
 *
 * Resolved marks travel through a SECOND map keyed by the same element id,
 * so `<interop-slider-legend for="…">` can find its labels the same way the
 * value output finds its number. They are kept off `InteropSliderApi`
 * deliberately: marks are a companion DIRECTIVE's data, not part of the
 * slider's own reactive surface, and a slider with no `[interop-slider-marks]`
 * should not have to pretend it has an empty list of them.
 */
@Injectable({ providedIn: "root" })
export class InteropSliderRegistry {
	private readonly apis = new Map<string, InteropSliderApi>();
	private readonly marks = new Map<string, Signal<SliderLegendItem[]>>();
	private readonly version = signal(0);

	register(api: InteropSliderApi): void {
		this.apis.set(api.elementId(), api);
		this.version.update((v) => v + 1);
	}

	unregister(id: string): void {
		if (this.apis.delete(id)) {
			this.version.update((v) => v + 1);
		}
	}

	get(id: string): InteropSliderApi | null {
		// Track the version so callers re-evaluate when sliders mount/unmount.
		this.version();
		return this.apis.get(id) ?? null;
	}

	registerMarks(id: string, marks: Signal<SliderLegendItem[]>): void {
		this.marks.set(id, marks);
		this.version.update((v) => v + 1);
	}

	unregisterMarks(id: string): void {
		if (this.marks.delete(id)) {
			this.version.update((v) => v + 1);
		}
	}

	/**
	 * The signal itself, not its value — the caller reads it inside its own
	 * `computed`, so a change to the marks input propagates without going
	 * through `version` at all. `version` only covers mount and unmount.
	 */
	getMarks(id: string): Signal<SliderLegendItem[]> | null {
		this.version();
		return this.marks.get(id) ?? null;
	}
}
