import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	computed,
	inject,
	input,
	isDevMode,
	model,
	output,
	signal,
} from "@angular/core";
import {
	INTEROP_SLIDER_RANGE_TOKEN,
	type InteropSliderRangeApi,
	type SliderRangeThumbRef,
	type SliderValueFormatter,
} from "./interop-slider.token";

export interface SliderRangeValue {
	start: number;
	end: number;
}

/**
 * InteropSliderRange — two-thumb range slider built from two real
 * `<input type="range">` elements projected as children.
 *
 * Each thumb is a separately focusable native input — both submit with the
 * surrounding `<form>` (using `name` you provide on each thumb), both are
 * keyboard-operable with the full APG model, and both are independently
 * announced by screen readers.
 *
 * The parent owns shared `min`/`max`/`step`/`disabled` and the `[(value)]`
 * model, and clamps the thumbs against each other so `start` never exceeds
 * `end`.
 *
 * Thumbs are projected with `interop-slider-thumb="start"` and
 * `interop-slider-thumb="end"`. Project them in any order.
 *
 * @example Basic two-thumb range
 * ```html
 * <interop-slider-range [min]="0" [max]="100" [step]="5"
 *                       [(value)]="brightness"
 *                       aria-label="Brightness range">
 *   <input type="range" interop-slider-thumb="start"
 *          aria-label="Brightness minimum" name="brightness-min" />
 *   <input type="range" interop-slider-thumb="end"
 *          aria-label="Brightness maximum" name="brightness-max" />
 * </interop-slider-range>
 * ```
 *
 * @example With value display
 * ```html
 * <interop-slider-range [(value)]="price" aria-label="Price range">
 *   <input type="range" interop-slider-thumb="start" id="p-min" />
 *   <input type="range" interop-slider-thumb="end" id="p-max" />
 * </interop-slider-range>
 *
 * <output interop-slider-value for="p-min"></output>
 * &ndash;
 * <output interop-slider-value for="p-max"></output>
 * ```
 */
@Component({
	selector: "interop-slider-range",
	standalone: true,
	template: `<ng-content></ng-content>`,
	styleUrl: "./interop-slider-range.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: INTEROP_SLIDER_RANGE_TOKEN,
			useExisting: InteropSliderRange,
		},
	],
	host: {
		"role": "group",
		"[attr.aria-label]": "ariaLabel()",
		"[attr.aria-disabled]": "disabled() ? 'true' : null",
		"[attr.data-orientation]": "orientation()",
		"[style.--itx-slider-range-start]": "startPercent() + '%'",
		"[style.--itx-slider-range-end]": "endPercent() + '%'",
	},
})
export class InteropSliderRange implements InteropSliderRangeApi {
	private readonly elementRef = inject(ElementRef<HTMLElement>);

	/** Shared minimum across both thumbs. */
	readonly min = input<number>(0);

	/** Shared maximum across both thumbs. */
	readonly max = input<number>(100);

	/** Shared step granularity across both thumbs. */
	readonly step = input<number>(1);

	/** Disable both thumbs. */
	readonly disabled = input<boolean>(false);

	/** Layout orientation. */
	readonly orientation = input<"horizontal" | "vertical">("horizontal");

	/**
	 * The current `{ start, end }` value. Two-way bindable as `[(value)]`.
	 * Thumb drags clamp against each other — `start <= end` is enforced.
	 */
	readonly value = model<SliderRangeValue>({ start: 0, end: 100 });

	/**
	 * Optional `aria-valuetext` formatter shared by both thumbs. See the
	 * note on `InteropSlider.valueText` — leave unset for plain numeric
	 * values.
	 */
	readonly valueText = input<SliderValueFormatter | null>(null);

	/**
	 * Accessible name for the entire range group. Each thumb still needs
	 * its own `aria-label` (or labelled `<input>`) for individual SR
	 * announcement.
	 */
	readonly ariaLabel = input<string | null>(null, { alias: "aria-label" });

	/** Emitted when either thumb commits a value (mouseup / keyup). */
	readonly interactionEnd = output<SliderRangeValue>();

	readonly start = computed(() => this.value().start);
	readonly end = computed(() => this.value().end);

	readonly startPercent = computed(() => this.percent(this.start()));
	readonly endPercent = computed(() => this.percent(this.end()));

	private readonly registeredThumbs = signal<SliderRangeThumbRef[]>([]);

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => this.devModeChecks());
		}
	}

	registerThumb(thumb: SliderRangeThumbRef): void {
		this.registeredThumbs.update((arr) => [...arr, thumb]);
	}

	unregisterThumb(thumb: SliderRangeThumbRef): void {
		this.registeredThumbs.update((arr) => arr.filter((t) => t !== thumb));
	}

	notifyThumbChange(role: "start" | "end", v: number): void {
		const current = this.value();
		if (role === "start") {
			const clamped = Math.min(v, current.end);
			if (clamped !== current.start) {
				this.value.set({ start: clamped, end: current.end });
			} else if (clamped !== v) {
				// User dragged past `end`; native input may now hold the unclamped
				// value. Re-write the model with same value to force a host re-bind
				// that snaps the native `.value` back.
				this.value.set({ start: clamped, end: current.end });
			}
		} else {
			const clamped = Math.max(v, current.start);
			if (clamped !== current.end) {
				this.value.set({ start: current.start, end: clamped });
			} else if (clamped !== v) {
				this.value.set({ start: current.start, end: clamped });
			}
		}
	}

	notifyThumbCommit(_role: "start" | "end", _v: number): void {
		this.interactionEnd.emit(this.value());
	}

	private percent(v: number): number {
		const min = this.min();
		const max = this.max();
		if (max === min) return 0;
		return Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
	}

	private devModeChecks(): void {
		const thumbs = this.registeredThumbs();
		const roles = thumbs.map((t) => t.role());

		if (thumbs.length !== 2) {
			console.warn(
				`[InteropSliderRange] expected exactly 2 thumbs, found ${thumbs.length}. ` +
					"Project both <input type=\"range\" interop-slider-thumb=\"start\"> " +
					"and <input type=\"range\" interop-slider-thumb=\"end\">.",
			);
		}

		if (!roles.includes("start") || !roles.includes("end")) {
			console.warn(
				"[InteropSliderRange] thumbs must include exactly one " +
					"interop-slider-thumb=\"start\" and one interop-slider-thumb=\"end\". " +
					`Found roles: [${roles.join(", ")}].`,
			);
		}

		const v = this.value();
		if (v.start > v.end) {
			console.warn(
				`[InteropSliderRange] initial value.start (${v.start}) exceeds ` +
					`value.end (${v.end}). Thumbs will clamp on next interaction.`,
			);
		}
		if (v.start < this.min() || v.end > this.max()) {
			console.warn(
				`[InteropSliderRange] value (${v.start}, ${v.end}) is outside ` +
					`[${this.min()}, ${this.max()}].`,
			);
		}

		const host = this.elementRef.nativeElement;
		if (
			!host.hasAttribute("aria-label") &&
			!host.hasAttribute("aria-labelledby")
		) {
			console.warn(
				"[InteropSliderRange] no aria-label or aria-labelledby on the " +
					"range group. Add one so screen readers announce the group's purpose.",
			);
		}
	}
}
