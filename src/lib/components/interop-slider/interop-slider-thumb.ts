import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	afterNextRender,
	computed,
	effect,
	inject,
	input,
	isDevMode,
} from "@angular/core";
import { InteropSliderRegistry } from "./interop-slider-registry";
import { generateSliderId } from "./interop-slider";
import {
	INTEROP_SLIDER_RANGE_TOKEN,
	INTEROP_SLIDER_TOKEN,
	type InteropSliderApi,
	type SliderRangeThumbRef,
} from "./interop-slider.token";

/**
 * InteropSliderThumb — one of two `<input type="range">` thumbs of an
 * `<interop-slider-range>` parent.
 *
 * The parent owns shared `min`/`max`/`step`/`disabled`. The thumb reads
 * those reactively, owns its own `name` / `aria-label` / `id`, and reports
 * value changes upward for clamping.
 *
 * The role (`"start"` or `"end"`) is supplied as the directive's selector
 * value — i.e., `interop-slider-thumb="start"`.
 *
 * Must be a child of `<interop-slider-range>`.
 */
@Component({
	selector: "input[type=range][interop-slider-thumb]",
	standalone: true,
	template: "",
	styleUrl: "./interop-slider.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{ provide: INTEROP_SLIDER_TOKEN, useExisting: InteropSliderThumb },
	],
	host: {
		"[disabled]": "disabled()",
		"[attr.aria-valuetext]": "computedValueText()",
		"[attr.data-thumb-role]": "role()",
		"[attr.data-orientation]": "orientation()",
		"[style.--itx-slider-fill]": "fillPercent() + '%'",
		"(input)": "onInput($event)",
		"(change)": "onChange($event)",
	},
})
export class InteropSliderThumb implements SliderRangeThumbRef, InteropSliderApi {
	private readonly elementRef = inject(ElementRef<HTMLInputElement>);
	private readonly parent = inject(INTEROP_SLIDER_RANGE_TOKEN, {
		optional: true,
	});
	private readonly registry = inject(InteropSliderRegistry);
	private readonly destroyRef = inject(DestroyRef);

	/**
	 * Which thumb this is. Provided as the attribute value:
	 * `interop-slider-thumb="start"` or `interop-slider-thumb="end"`.
	 */
	readonly role = input.required<"start" | "end">({
		alias: "interop-slider-thumb",
	});

	readonly min = computed(() => this.parent?.min() ?? 0);
	readonly max = computed(() => this.parent?.max() ?? 100);
	readonly step = computed(() => this.parent?.step() ?? 1);
	readonly disabled = computed(() => this.parent?.disabled() ?? false);
	readonly valueText = computed(() => this.parent?.valueText() ?? null);
	readonly orientation = computed(
		(): "horizontal" | "vertical" => "horizontal",
	);

	readonly ownValue = computed(() => {
		const r = this.role();
		if (!this.parent) return 0;
		return r === "start" ? this.parent.start() : this.parent.end();
	});

	/** Alias of ownValue — present so `InteropSliderApi` is satisfied. */
	readonly value = this.ownValue;

	readonly fillPercent = computed(() => {
		const min = this.min();
		const max = this.max();
		const v = this.ownValue();
		if (max === min) return 0;
		return Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
	});

	readonly computedValueText = computed(() => {
		const fn = this.valueText();
		return fn ? fn(this.ownValue()) : null;
	});

	get element(): HTMLInputElement {
		return this.elementRef.nativeElement;
	}

	elementId(): string {
		const el = this.elementRef.nativeElement;
		if (!el.id) el.id = generateSliderId();
		return el.id;
	}

	constructor() {
		if (this.parent) {
			this.parent.registerThumb(this);
			this.destroyRef.onDestroy(() => this.parent?.unregisterThumb(this));
		}

		// Sync min/max/step BEFORE value — see InteropSlider for rationale.
		effect(() => {
			const el = this.elementRef.nativeElement;
			el.min = String(this.min());
			el.max = String(this.max());
			el.step = String(this.step());
			el.value = String(this.ownValue());
		});

		afterNextRender(() => {
			const id = this.elementId();
			this.registry.register(this);
			this.destroyRef.onDestroy(() => this.registry.unregister(id));

			if (isDevMode()) this.devModeChecks();
		});
	}

	protected onInput(event: Event): void {
		if (!this.parent) return;
		const v = parseFloat((event.target as HTMLInputElement).value);
		if (Number.isNaN(v)) return;
		this.parent.notifyThumbChange(this.role(), v);
	}

	protected onChange(event: Event): void {
		if (!this.parent) return;
		const v = parseFloat((event.target as HTMLInputElement).value);
		if (Number.isNaN(v)) return;
		this.parent.notifyThumbCommit(this.role(), v);
	}

	private devModeChecks(): void {
		if (!this.parent) {
			console.warn(
				"[InteropSliderThumb] must be a child of <interop-slider-range>. " +
					"Use <input type=\"range\" interop-slider> for a single-thumb slider.",
			);
		}

		const r = this.role();
		if (r !== "start" && r !== "end") {
			console.warn(
				`[InteropSliderThumb] role "${r}" is invalid. ` +
					'Use interop-slider-thumb="start" or interop-slider-thumb="end".',
			);
		}

		const el = this.elementRef.nativeElement;
		const hasAriaLabel = el.hasAttribute("aria-label");
		const hasAriaLabelledBy = el.hasAttribute("aria-labelledby");
		const hasNativeLabel = el.id
			? !!document.querySelector(`label[for="${el.id}"]`)
			: false;

		if (!hasAriaLabel && !hasAriaLabelledBy && !hasNativeLabel) {
			console.warn(
				`[InteropSliderThumb] thumb "${r}" has no accessible name. ` +
					"Each thumb needs its own aria-label, aria-labelledby, or " +
					"associated <label for> — the parent's aria-label only names " +
					"the group, not the individual thumbs.",
			);
		}
	}
}
