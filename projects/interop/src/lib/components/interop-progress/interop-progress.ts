import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	computed,
	inject,
	input,
	isDevMode,
} from "@angular/core";

let idCounter = 0;
export function generateProgressId(): string {
	return `itx-progress-${++idCounter}`;
}

/**
 * InteropProgress — Semantic progress bar built on the native `<progress>` element.
 *
 * Use on any `<progress>` element. Handles ARIA wiring (valuenow, valuemin, valuemax,
 * valuetext), indeterminate state, and normalized fill when min ≠ 0.
 *
 * For labelling, prefer a `<label interop-progress-label>` which auto-wires the
 * association. For milestone announcements, add `<interop-progress-status>` alongside.
 *
 * @example Determinate with label directive
 * ```html
 * <label interop-progress-label>Uploading</label>
 * <progress interop-progress [value]="42" [max]="100"></progress>
 * ```
 *
 * @example Step-based with humanized valueText
 * ```html
 * <label interop-progress-label>Account setup</label>
 * <progress interop-progress
 *           [value]="currentStep"
 *           [min]="1"
 *           [max]="totalSteps"
 *           [valueText]="currentStep + ' of ' + totalSteps + ' steps complete'">
 * </progress>
 * ```
 *
 * @example Indeterminate
 * ```html
 * <label interop-progress-label>Loading</label>
 * <progress interop-progress [indeterminate]="true"></progress>
 * ```
 *
 * @example Vertical
 * ```html
 * <progress interop-progress
 *           [value]="75"
 *           [orientation]="'vertical'"
 *           aria-label="Storage used">
 * </progress>
 * ```
 */
@Component({
	selector: "progress[interop-progress]",
	standalone: true,
	template: "",
	styleUrl: "./interop-progress.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"role": "progressbar",
		// Native progress attrs — normalized to 0-100 so the browser fill is correct
		// even when min ≠ 0.
		"[attr.value]": "indeterminate() ? null : normalizedNativeValue()",
		"[attr.max]": "indeterminate() ? null : 100",
		// ARIA carries the semantic values the consumer provided.
		"[attr.aria-valuenow]": "indeterminate() ? null : value()",
		"[attr.aria-valuemin]": "min()",
		"[attr.aria-valuemax]": "max()",
		"[attr.aria-valuetext]": "valueText() ?? null",
		// Data attributes for CSS hooks
		"[attr.data-orientation]": "orientation()",
	},
})
export class InteropProgress {
	private readonly elementRef = inject(ElementRef<HTMLProgressElement>);

	/** Current value. Must be between [min] and [max]. */
	readonly value = input<number>(0);

	/** Minimum value. Defaults to 0. Affects ARIA and fill normalization. */
	readonly min = input<number>(0);

	/** Maximum value. Defaults to 100. */
	readonly max = input<number>(100);

	/**
	 * When true, aria-valuenow and value are omitted so assistive technology
	 * announces "in progress" rather than a meaningless percentage.
	 * Takes precedence over [value].
	 */
	readonly indeterminate = input<boolean>(false);

	/**
	 * Human-readable description of the current value, announced by screen readers
	 * instead of the raw number. Use for step-based or labelled-quantity progress.
	 *
	 * @example "Step 3 of 7" | "42 MB of 100 MB uploaded"
	 */
	readonly valueText = input<string | null>(null);

	/** Orientation of the progress bar track. */
	readonly orientation = input<"horizontal" | "vertical">("horizontal");

	/**
	 * Native progress fill percentage (0-100), normalized from the consumer's
	 * min/max/value so the browser renders the correct fill width regardless of scale.
	 */
	readonly normalizedNativeValue = computed(() => {
		const v = Math.min(Math.max(this.value(), this.min()), this.max());
		return Math.round(((v - this.min()) / (this.max() - this.min())) * 100);
	});

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const el = this.elementRef.nativeElement;

				// Check for accessible name from all three valid sources.
				const hasAriaLabel = el.hasAttribute("aria-label");
				const hasAriaLabelledBy = el.hasAttribute("aria-labelledby");
				const hasNativeLabel =
					el.id ? !!document.querySelector(`label[for="${el.id}"]`) : false;

				if (!hasAriaLabel && !hasAriaLabelledBy && !hasNativeLabel) {
					console.warn(
						"[InteropProgress] No accessible name found. " +
						"Add aria-label, use aria-labelledby, or add a " +
						"<label interop-progress-label> adjacent to this element.",
					);
				}

				if (this.indeterminate() && this.value() !== 0) {
					console.warn(
						"[InteropProgress] Both [indeterminate] and [value] are set. " +
						"The indeterminate state takes precedence; [value] is ignored.",
					);
				}

				if (this.value() > this.max()) {
					console.warn(
						`[InteropProgress] value (${this.value()}) exceeds max (${this.max()}).`,
					);
				}

				if (this.value() < this.min()) {
					console.warn(
						`[InteropProgress] value (${this.value()}) is below min (${this.min()}).`,
					);
				}
			});
		}
	}
}
