import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	computed,
	inject,
	input,
	isDevMode,
	signal,
} from "@angular/core";
import { INTEROP_CHIP_FILTER, ChipOptionRef } from "../interop-chip.token";

/**
 * InteropChipOption — An individual filter chip rendered as a styled checkbox.
 *
 * Must be used on a `<label>` element inside a
 * `<fieldset interop-chip-filter>`. The component injects a hidden
 * `<input type="checkbox">` and provides the chip's visual presentation
 * via the host element.
 *
 * Selected state, keyboard behavior (Tab + Space), and form participation
 * are all provided by the native checkbox — no JavaScript required.
 *
 * @example
 * ```html
 * <fieldset interop-chip-filter label="Size" [(value)]="sizes">
 *   <label interop-chip-option value="sm">Small</label>
 *   <label interop-chip-option value="md">Medium</label>
 *   <label interop-chip-option value="lg" [disabled]="true">Large</label>
 * </fieldset>
 * ```
 */
@Component({
	selector: "label[interop-chip-option]",
	standalone: true,
	template: `
		<input
			class="interop-sr-only"
			type="checkbox"
			[id]="inputId()"
			[checked]="isChecked()"
			[disabled]="isDisabled()"
			[attr.name]="name()"
			[attr.value]="value()"
			(change)="onChange($event)"
			(focus)="focused.set(true)"
			(blur)="focused.set(false)"
		/>
		<ng-content></ng-content>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"[attr.for]": "inputId()",
		"[attr.data-checked]": 'isChecked() ? "" : null',
		"[attr.data-disabled]": 'isDisabled() ? "" : null',
		"[attr.data-focused]": 'focused() ? "" : null',
	},
})
export class InteropChipOption implements ChipOptionRef {
	private el = inject(ElementRef<HTMLLabelElement>);
	private parent = inject(INTEROP_CHIP_FILTER, { optional: true });

	/** The value this option represents. */
	value = input.required<string>();

	/** Disables this option independently of the group. */
	disabled = input<boolean>(false);

	/**
	 * Optional name attribute forwarded to the checkbox input.
	 * Required for native form submission.
	 */
	name = input<string | null>(null);

	// ── Internal state ───────────────────────────────────────────────────────

	readonly focused = signal(false);

	/** Stable ID connecting the <label> for= to the <input> id. */
	readonly inputId = computed(() => `itx-chip-option-${this.value()}`);

	/** Whether this option is currently selected. */
	readonly isChecked = computed(() => this.parent?.isSelected(this.value()) ?? false);

	/** Disabled if either this option or the parent group is disabled. */
	readonly isDisabled = computed(() => this.disabled() || (this.parent?.disabled() ?? false));

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const el = this.el.nativeElement;
				if (el.tagName !== "LABEL") {
					console.warn(
						`[InteropChipOption] Must be used on a <label> element for semantic correctness. ` +
							`Found on: <${el.tagName.toLowerCase()}>`,
					);
				}
				if (!this.parent) {
					console.warn(
						`[InteropChipOption] Must be used inside a <fieldset interop-chip-filter> container.`,
					);
				}
			});
		}
	}

	// ── Interaction ──────────────────────────────────────────────────────────

	onChange(event: Event): void {
		if (this.isDisabled()) return;
		const checked = (event.target as HTMLInputElement).checked;
		this.parent?.onOptionChange(this.value(), checked);
	}
}
