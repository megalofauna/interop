import {
	ChangeDetectionStrategy,
	Component,
	afterNextRender,
	computed,
	inject,
	input,
	isDevMode,
} from "@angular/core";
import { InteropSliderRegistry } from "./interop-slider-registry";
import type { SliderValueFormatter } from "./interop-slider.token";

/**
 * InteropSliderValue — semantic `<output>` companion that displays the
 * current value of an `<input type="range" interop-slider>` (or
 * `interop-slider-thumb`).
 *
 * The host is a real `<output>` with the native `[for]` attribute, which
 * preserves the standard a11y association between an output and its
 * source control.
 *
 * Format precedence (highest first):
 *   1. The output's own `[format]` input
 *   2. The slider's `[valueText]` formatter (so a single function can drive
 *      both `aria-valuetext` and the visual display)
 *   3. The raw number (toString)
 *
 * @example Inherits the slider's valueText formatter
 * ```html
 * <input type="range" interop-slider id="size" [min]="0" [max]="3"
 *        [(value)]="size" [valueText]="(v) => SIZES[v]" />
 * <output interop-slider-value for="size"></output>
 * ```
 *
 * @example Visual-only currency formatting (slider stays numeric for SR)
 * ```html
 * <input type="range" interop-slider id="price" [min]="0" [max]="5000"
 *        [step]="50" [(value)]="price" />
 * <output interop-slider-value for="price"
 *         [format]="(v) => '$' + v.toLocaleString()"></output>
 * ```
 */
@Component({
	selector: "output[interop-slider-value]",
	standalone: true,
	template: "{{ rendered() }}",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropSliderValue {
	private readonly registry = inject(InteropSliderRegistry);

	/** ID of the slider input this output mirrors. Required. */
	readonly forId = input.required<string>({ alias: "for" });

	/**
	 * Visual-only formatter. When set, drives the displayed text. Falls back
	 * to the slider's `[valueText]`, then to the raw number.
	 */
	readonly format = input<SliderValueFormatter | null>(null);

	private readonly api = computed(() => this.registry.get(this.forId()));

	protected readonly rendered = computed(() => {
		const a = this.api();
		const v = a?.value() ?? Number.NaN;
		if (Number.isNaN(v)) return "";

		const localFmt = this.format();
		if (localFmt) return localFmt(v);

		const sliderFmt = a?.valueText();
		if (sliderFmt) return sliderFmt(v);

		return String(v);
	});

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				if (!this.api()) {
					console.warn(
						`[InteropSliderValue] no slider found with id "${this.forId()}". ` +
							"Set the [for] attribute to the id of an <input type=\"range\" " +
							"interop-slider> or interop-slider-thumb element.",
					);
				}
			});
		}
	}
}
