import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	computed,
	effect,
	inject,
	input,
	isDevMode,
	output,
	signal,
	viewChild,
	viewChildren,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

export interface ChipInputItem {
	/** Display label for the chip. */
	label: string;
	/** Underlying value. Defaults to label if not provided. */
	value?: string;
}

/**
 * InteropChipInput — A free-form text entry field that converts input into chips.
 *
 * Implements the Gmail To: field pattern: type a value, press Enter or comma
 * (configurable), and the text becomes a chip. Backspace on an empty input
 * focuses the last chip rather than deleting it immediately (correct per the
 * eBay MIND Patterns spec). Backspace/Delete while a chip's remove button is
 * focused removes that chip and returns focus to the adjacent chip or the input.
 *
 * ## Correct backspace state machine
 * ```
 * Backspace + input has text   → delete a character (native, never intercepted)
 * Backspace + input is empty   → focus last chip remove button (do NOT delete)
 * Backspace/Delete + chip btn  → remove chip, move focus to prev chip or input
 * ```
 *
 * ## Markup produced
 * ```
 * <div interop-chip-input aria-label="Recipients">
 *   <ul role="list" aria-label="..."> ← internal chip list
 *     <li>
 *       <span>chip label</span>
 *       <button type="button" aria-label="Remove chip label">×</button>
 *     </li>
 *   </ul>
 *   <input type="text" ...> ← internal text input
 * </div>
 * ```
 *
 * ## Forms integration
 * Implements ControlValueAccessor. Use with ngModel or formControlName.
 * The emitted value type is `ChipInputItem[]`.
 *
 * @example Basic usage
 * ```html
 * <div interop-chip-input
 *      aria-label="Tags"
 *      [placeholder]="'Add a tag…'"
 *      [(value)]="tags">
 * </div>
 * ```
 *
 * @example With reactive forms
 * ```html
 * <div interop-chip-input aria-label="Recipients" formControlName="to"></div>
 * ```
 *
 * <!-- TODO: Autocomplete / suggestions dropdown (combobox variant)
 *      Currently supports free-form text entry only. Revisit adding a
 *      suggestions listbox (role="combobox" + role="listbox") once the
 *      core chip primitives are stable.
 *      See eBay MIND Patterns "Chips Combobox" for the interaction model. -->
 */
@Component({
	selector: "div[interop-chip-input]",
	standalone: true,
	template: `
		@if (chips().length) {
			<ul class="itx-chip-list" role="list" [attr.aria-label]="listLabel()">
				@for (chip of chips(); track chip.value ?? chip.label; let i = $index) {
					<li class="itx-chip">
						<span class="itx-chip-label">{{ chip.label }}</span>
						<button
							#removeBtn
							type="button"
							class="humb  "
							[attr.aria-label]="'Remove ' + chip.label"
							(click)="removeChip(i)"
							(keydown)="onChipKeydown($event, i)"
						>
							<span aria-hidden="true">&#x2715;</span>
						</button>
					</li>
				}
			</ul>
		}
		<input
			#textInput
			type="text"
			class="itx-chip-text-input"
			[placeholder]="placeholder()"
			[disabled]="isDisabled()"
			[attr.aria-label]="inputAriaLabel()"
			(keydown)="onInputKeydown($event)"
			(blur)="onBlur()"
		/>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{ provide: NG_VALUE_ACCESSOR, useExisting: InteropChipInput, multi: true },
	],
	host: {
		"[attr.data-disabled]": 'isDisabled() ? "" : null',
		"[attr.data-has-chips]": 'chips().length ? "" : null',
		"(click)": "onHostClick()",
	},
})
export class InteropChipInput implements ControlValueAccessor {
	private textInputRef =
		viewChild.required<ElementRef<HTMLInputElement>>("textInput");
	private removeBtns = viewChildren<ElementRef<HTMLButtonElement>>("removeBtn");

	private el = inject(ElementRef<HTMLDivElement>);

	/** Placeholder text for the text input. */
	placeholder = input<string>("");

	/**
	 * Controlled chip list. Pair with (valueChange) for two-way binding.
	 * Each item has a `label` (display) and optional `value` (form value).
	 */
	value = input<ChipInputItem[]>([]);

	/** Whether the control is disabled. */
	disabled = input<boolean>(false);

	/**
	 * Keys that trigger chip creation from the current input text.
	 * Defaults to Enter and comma.
	 */
	separators = input<string[]>(["Enter", ","]);

	/** Maximum number of chips. No limit when 0. */
	maxChips = input<number>(0);

	/** Emitted when the chip list changes. */
	valueChange = output<ChipInputItem[]>();

	// ── Internal state ───────────────────────────────────────────────────────

	private _chips = signal<ChipInputItem[]>([]);
	private _disabled = signal<boolean>(false);
	private _onChangeFn: (value: ChipInputItem[]) => void = () => {};
	private _onTouchedFn: () => void = () => {};

	/** Resolved chip list: controlled input takes precedence over internal state. */
	readonly chips = computed(() => {
		const controlled = this.value();
		return controlled.length > 0 ? controlled : this._chips();
	});

	readonly isDisabled = computed(() => this.disabled() || this._disabled());

	/** Accessible label for the internal chip list element. */
	readonly listLabel = computed(() => {
		const host = this.el.nativeElement;
		return host.getAttribute("aria-label") ?? "Selected items";
	});

	/** Accessible label forwarded to the text input. */
	readonly inputAriaLabel = computed(() => {
		const host = this.el.nativeElement;
		return host.getAttribute("aria-label") ?? null;
	});

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const el = this.el.nativeElement;
				if (el.tagName !== "DIV") {
					console.warn(
						`[InteropChipInput] Must be used on a <div> element. ` +
							`Found on: <${el.tagName.toLowerCase()}>`,
					);
				}
				if (
					!el.hasAttribute("aria-label") &&
					!el.hasAttribute("aria-labelledby")
				) {
					console.warn(
						`[InteropChipInput] Provide an accessible label via aria-label or aria-labelledby.`,
					);
				}
			});
		}

		// Sync external value changes into internal state
		effect(() => {
			const v = this.value();
			if (v.length > 0) this._chips.set([...v]);
		});
	}

	// ── Text input keyboard handling ─────────────────────────────────────────

	onInputKeydown(event: KeyboardEvent): void {
		const input = this.textInputRef().nativeElement;
		const key = event.key;

		// Separator pressed with text → create chip
		if (this.separators().includes(key) && input.value.trim()) {
			event.preventDefault();
			this.addChip(input.value.trim());
			input.value = "";
			return;
		}

		// Backspace on empty input → focus last chip (do NOT delete)
		if (key === "Backspace" && input.value === "") {
			event.preventDefault();
			this.focusLastChip();
		}
	}

	// ── Chip button keyboard handling ────────────────────────────────────────

	onChipKeydown(event: KeyboardEvent, index: number): void {
		const key = event.key;

		if (key === "Backspace" || key === "Delete") {
			event.preventDefault();
			this.removeChip(index);
			return;
		}

		// Arrow navigation between chip remove buttons
		if (key === "ArrowLeft" && index > 0) {
			event.preventDefault();
			this.focusChipAt(index - 1);
			return;
		}
		if (key === "ArrowRight") {
			event.preventDefault();
			if (index < this.chips().length - 1) {
				this.focusChipAt(index + 1);
			} else {
				this.focusInput();
			}
		}
	}

	// ── Chip management ──────────────────────────────────────────────────────

	private addChip(text: string): void {
		const max = this.maxChips();
		const current = this.chips();
		if (max > 0 && current.length >= max) return;

		const newChip: ChipInputItem = { label: text, value: text };
		const updated = [...current, newChip];
		this._chips.set(updated);
		this._onChangeFn(updated);
		this.valueChange.emit(updated);
	}

	removeChip(index: number): void {
		const current = [...this.chips()];
		current.splice(index, 1);
		this._chips.set(current);
		this._onChangeFn(current);
		this.valueChange.emit(current);

		// Return focus to the preceding chip or the text input.
		// Defer one microtask so the DOM has updated and viewChildren() reflects
		// the new chip list before we query it.
		Promise.resolve().then(() => {
			const btns = this.removeBtns();
			if (btns.length > 0) {
				btns[Math.min(index, btns.length - 1)].nativeElement.focus();
			} else {
				this.focusInput();
			}
		});
	}

	// ── Focus management ─────────────────────────────────────────────────────

	private focusLastChip(): void {
		const btns = this.removeBtns();
		if (btns.length > 0) {
			btns[btns.length - 1].nativeElement.focus();
		}
	}

	private focusChipAt(index: number): void {
		const btns = this.removeBtns();
		btns[index]?.nativeElement.focus();
	}

	private focusInput(): void {
		this.textInputRef().nativeElement.focus();
	}

	onHostClick(): void {
		// Clicking anywhere on the host focuses the text input
		this.focusInput();
	}

	onBlur(): void {
		// Commit any pending text as a chip on blur
		const input = this.textInputRef().nativeElement;
		if (input?.value.trim()) {
			this.addChip(input.value.trim());
			input.value = "";
		}
		this._onTouchedFn();
	}

	// ── ControlValueAccessor ─────────────────────────────────────────────────

	writeValue(value: ChipInputItem[] | null): void {
		this._chips.set(Array.isArray(value) ? value : []);
	}

	registerOnChange(fn: (value: ChipInputItem[]) => void): void {
		this._onChangeFn = fn;
	}

	registerOnTouched(fn: () => void): void {
		this._onTouchedFn = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this._disabled.set(isDisabled);
	}
}
