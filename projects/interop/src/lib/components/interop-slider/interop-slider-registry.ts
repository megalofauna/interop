import { Injectable, signal } from "@angular/core";
import type { InteropSliderApi } from "./interop-slider.token";

/**
 * Tiny element-id-keyed registry of `InteropSliderApi` instances. Used by
 * `<output interop-slider-value>` to resolve its target slider via the
 * native `[for]` attribute without forcing the consumer to wire DI.
 *
 * Sliders register themselves on construction (after their element id is
 * resolved) and unregister on destroy. Output companions read the registry
 * inside a `computed` — `version` is bumped on every (un)register so the
 * signal participates in change detection.
 */
@Injectable({ providedIn: "root" })
export class InteropSliderRegistry {
	private readonly apis = new Map<string, InteropSliderApi>();
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
}
