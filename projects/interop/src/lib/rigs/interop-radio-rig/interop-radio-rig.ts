import {
	Component,
	input,
	output,
	computed,
	signal,
	effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { InteropRadioControl } from "../../components/interop-radio/interop-radio-control/interop-radio-control";

export type RadioControl = {
	id: string;
	name?: string;
	value: string | number | boolean;
	label: string;
	disabled?: boolean;
	required?: boolean;
};

/**
 * InteropRadioRig — Accessible `<fieldset>`-based rig for a group of
 * mutually exclusive radio options. Implements `ControlValueAccessor` for
 * seamless reactive-forms and `ngModel` integration.
 *
 * ## Content modes
 *
 * ### Declarative
 * Pass a `RadioControl[]` via `[controls]`. The rig generates all
 * `<label interop-radio>` elements automatically.
 *
 * ```html
 * <interop-radio-rig
 *   groupName="size"
 *   legend="T-shirt size"
 *   [controls]="sizeOptions"
 *   [(value)]="selectedSize"
 * />
 * ```
 *
 * ### Content projection
 * Omit `[controls]` and project `<label interop-radio>` elements directly.
 * Use this when you need custom markup, icons, or complex label layouts.
 *
 * ```html
 * <interop-radio-rig groupName="plan" legend="Choose a plan" [(value)]="selectedPlan">
 *   <label interop-radio id="basic" name="plan" value="basic">Basic</label>
 *   <label interop-radio id="pro"   name="plan" value="pro">Pro</label>
 * </interop-radio-rig>
 * ```
 *
 * ## Reactive forms
 *
 * ```html
 * <interop-radio-rig
 *   formControlName="notifications"
 *   groupName="notifications"
 *   legend="Notify me by"
 *   [controls]="notificationOptions"
 * />
 * ```
 *
 * ## Custom rigs
 * When you need to own the `<fieldset>` yourself, skip this rig and use
 * `<label interop-radio>` elements directly inside your own `<fieldset>`.
 */
@Component({
	selector: "interop-radio-rig",
	standalone: true,
	imports: [CommonModule, InteropRadioControl],
	templateUrl: "./interop-radio-rig.html",
	styleUrl: "./interop-radio-rig.css",
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: InteropRadioRig,
			multi: true,
		},
	],
})
export class InteropRadioRig implements ControlValueAccessor {
	/**
	 * Array of radio control configurations for declarative mode.
	 * When provided, the rig will generate radio inputs automatically.
	 */
	controls = input<RadioControl[]>();

	/**
	 * The name attribute for the radio group.
	 * All radio inputs in the group will share this name.
	 */
	groupName = input.required<string>();

	/**
	 * Optional legend text for the fieldset.
	 * Improves accessibility by describing the radio group's purpose.
	 */
	legend = input<string>();

	/**
	 * The currently selected value in the radio group.
	 */
	value = input<string | number | boolean | null>(null);

	/**
	 * Whether the entire radio group is disabled.
	 */
	disabled = input<boolean>(false);

	/**
	 * Whether the radio group is required for form validation.
	 */
	required = input<boolean>(false);

	/**
	 * CSS class to apply to the fieldset rig.
	 */
	rigClass = input<string>("");

	// Outputs

	/**
	 * Emitted when the selected value changes.
	 */
	valueChange = output<string | number | boolean | null>();

	// Internal state for ControlValueAccessor
	private internalValue = signal<string | number | boolean | null>(null);
	private onChangeFn: (value: any) => void = () => {};
	private onTouchedFn: () => void = () => {};

	/**
	 * Whether the rig is in declarative mode (has controls input).
	 */
	isDeclarativeMode = computed(() => {
		const controls = this.controls();
		return Array.isArray(controls) && controls.length > 0;
	});

	/**
	 * The effective value to use. `internalValue` is the single source of
	 * truth — the sync effect below keeps it up to date when the `[value]`
	 * input changes from outside.
	 */
	effectiveValue = computed(() => {
		return this.internalValue();
	});

	constructor() {
		// Sync the [value] input into internalValue — but only when the input
		// carries a real value (non-null). Skipping null lets CVA / writeValue
		// remain authoritative when no two-way binding is in use.
		effect(() => {
			const inputValue = this.value();
			if (inputValue !== null && inputValue !== this.internalValue()) {
				this.internalValue.set(inputValue);
			}
		});
	}

	/**
	 * Handle radio selection from child components.
	 */
	onRadioChange(selectedValue: string | number | boolean): void {
		this.internalValue.set(selectedValue);
		this.valueChange.emit(selectedValue);
		this.onChangeFn(selectedValue);
		this.onTouchedFn();
	}

	/**
	 * Check if a specific value is currently selected.
	 */
	isSelected(value: string | number | boolean): boolean {
		return this.effectiveValue() === value;
	}

	// ControlValueAccessor implementation

	writeValue(value: any): void {
		this.internalValue.set(value);
	}

	registerOnChange(fn: (value: any) => void): void {
		this.onChangeFn = fn;
	}

	registerOnTouched(fn: () => void): void {
		this.onTouchedFn = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		// This would typically update a disabled signal
		// For now, we rely on the disabled input
	}
}
