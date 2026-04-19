import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	contentChildren,
	inject,
	input,
	isDevMode,
	output,
	signal,
} from "@angular/core";
import { INTEROP_CHIP_FILTER, ChipFilterRef } from "../interop-chip.token";
import { InteropChipOption } from "../interop-chip-option/interop-chip-option";

/**
 * InteropChipFilter — A semantically correct filter chip group built on a
 * native `<fieldset>`.
 *
 * Filter chips are checkboxes. Not ARIA listboxes. Not ARIA grids. Checkboxes.
 * This component uses `<fieldset>/<legend>/<label>/<input type="checkbox">`
 * so that every filter chip is natively form-associated, keyboard-accessible
 * (Tab + Space), and correctly announced by every screen reader on every
 * platform — with zero custom ARIA and zero JavaScript keyboard handling.
 *
 * ## Why this matters
 * Every major library (Angular Material, MUI, Vuetify) implements filter chips
 * as ARIA listbox/option or grid/row/gridcell, requiring custom keyboard
 * handling, ControlValueAccessor, and incurring known AT inconsistencies.
 * Native checkboxes solve all of this for free.
 *
 * ## Usage
 * ```html
 * <fieldset interop-chip-filter label="Size" [value]="sizes()" (valueChange)="sizes.set($event)">
 *   <label interop-chip-option value="xs">XS</label>
 *   <label interop-chip-option value="sm">SM</label>
 *   <label interop-chip-option value="md">MD</label>
 *   <label interop-chip-option value="lg">LG</label>
 * </fieldset>
 * ```
 *
 * ## Keyboard contract
 * Tab moves between chips. Space toggles the focused chip. This is the native
 * checkbox keyboard model — no custom implementation required.
 *
 * ## Form participation
 * Because each option contains a native `<input type="checkbox">`, the group
 * participates in HTML form submission natively. Pass `[name]` to options for
 * standard form encoding.
 */
@Component({
	selector: "fieldset[interop-chip-filter]",
	standalone: true,
	template: `
		<legend [class.interop-sr-only]="labelHidden()">{{ label() }}</legend>
		<ng-content></ng-content>
	`,
	styleUrl: "./interop-chip-filter.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{ provide: INTEROP_CHIP_FILTER, useExisting: InteropChipFilter },
	],
	host: {
		"[attr.data-disabled]": 'disabled() ? "" : null',
	},
})
export class InteropChipFilter implements ChipFilterRef {
	private el = inject(ElementRef<HTMLFieldSetElement>);

	/**
	 * Accessible label for the group, rendered as a `<legend>`.
	 * Required — every fieldset must have a legend.
	 */
	label = input.required<string>();

	/**
	 * When true, the legend is visually hidden but remains accessible
	 * to screen readers.
	 */
	labelHidden = input<boolean>(false);

	/**
	 * Controlled mode: the currently selected values.
	 * Pair with `(valueChange)` for two-way binding.
	 */
	value = input<string[]>([]);

	/** Whether the entire group is disabled. */
	disabled = input<boolean>(false);

	/** Emitted when the selected values change. */
	valueChange = output<string[]>();

	/** All projected chip options, in DOM order. */
	readonly options = contentChildren(InteropChipOption);

	// ── Internal state ───────────────────────────────────────────────────────

	private _selected = signal<string[]>([]);

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const el = this.el.nativeElement;
				if (el.tagName !== "FIELDSET") {
					console.warn(
						`[InteropChipFilter] Must be used on a <fieldset> element for semantic correctness. ` +
							`Found on: <${el.tagName.toLowerCase()}>`,
					);
				}
				if (!el.querySelector("legend")) {
					console.warn(
						`[InteropChipFilter] A <legend> element is required for accessible grouping. ` +
							`Ensure the [label] input is provided.`,
					);
				}
				const count = this.options().length;
				if (count < 2) {
					console.warn(
						`[InteropChipFilter] A filter chip group should have at least 2 options (found ${count}).`,
					);
				}
			});
		}
	}

	// ── ChipFilterRef ────────────────────────────────────────────────────────

	isSelected(value: string): boolean {
		const controlled = this.value();
		const source = controlled.length > 0 ? controlled : this._selected();
		return source.includes(value);
	}

	onOptionChange(value: string, checked: boolean): void {
		const current = this.value().length > 0
			? [...this.value()]
			: [...this._selected()];

		if (checked) {
			if (!current.includes(value)) current.push(value);
		} else {
			const idx = current.indexOf(value);
			if (idx > -1) current.splice(idx, 1);
		}

		this._selected.set(current);
		this.valueChange.emit(current);
	}
}
