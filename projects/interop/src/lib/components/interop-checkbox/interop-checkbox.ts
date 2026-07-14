import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	ViewChild,
	computed,
	effect,
	inject,
	input,
	model,
	output,
	isDevMode,
	signal,
	afterNextRender,
} from "@angular/core";
import {
	InteropAttribute,
	PresetKey,
	SetAttrsConfig,
} from "../../services/interop-attribute.service";
import { InteropVisimorph } from "../interop-visimorph/interop-visimorph";

/**
 * InteropCheckbox - Enhanced checkbox input with indeterminate state management.
 *
 * This component wraps a native `<input type="checkbox">` inside a `<label>` element,
 * enforcing semantic HTML while providing the one augmentation that native Angular
 * template binding cannot: declarative indeterminate state via `[indeterminate]`.
 *
 * The `.indeterminate` property is DOM-only — not an HTML attribute, not template-bindable.
 * This component makes `[indeterminate]="someSignal()"` just work via an internal effect.
 * It also ensures `aria-checked="mixed"` is set correctly for screen readers.
 *
 * No activation system is included. A checkbox is a form control, not an action trigger.
 * Consumers react to `(checkedChange)` with their own logic.
 *
 * @example Simplest usage (uncontrolled — state managed internally)
 * ```html
 * <label interop-checkbox id="agree">
 *   I accept the terms
 * </label>
 * ```
 *
 * @example Two-way binding (parent controls state)
 * ```html
 * <label interop-checkbox id="agree" [(checked)]="accepted">
 *   I accept the terms
 * </label>
 * ```
 *
 * @example With indeterminate state (select-all pattern)
 * ```html
 * <label interop-checkbox
 *        [id]="'select-all'"
 *        [(checked)]="allSelected"
 *        [indeterminate]="someSelected()"
 *        (checkedChange)="toggleAll($event)">
 *   Select All
 * </label>
 * ```
 */
@Component({
	selector: "label[interop-checkbox]",
	standalone: true,
	imports: [InteropVisimorph],
	template: `
		<input
			#checkboxInput
			type="checkbox"
			class="interop-sr-only"
			[id]="id()"
			[checked]="checked()"
			[disabled]="disabled()"
			[required]="required()"
			[attr.name]="name()"
			[attr.value]="value()"
			(change)="onCheckboxChange($event)"
			(focus)="focused.set(checkboxInput.matches(':focus-visible'))"
			(blur)="focused.set(false)"
		/>
		<interop-visimorph
			[type]="'checkbox'"
			[checked]="checked()"
			[disabled]="disabled()"
			[indeterminate]="indeterminate()"
			[focused]="focused()"
		/>
		<ng-content></ng-content>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropCheckbox {
	@ViewChild("checkboxInput", { static: true })
	private inputElement!: ElementRef<HTMLInputElement>;

	private labelElement = inject(ElementRef<HTMLLabelElement>);
	private attrsManager = inject(InteropAttribute);

	// Core checkbox input properties

	/**
	 * Unique identifier for the checkbox input.
	 * Used for label association and accessibility.
	 */
	id = input.required<string>();

	/**
	 * Whether this checkbox is currently checked.
	 *
	 * As a `model()`, this works in three modes:
	 * - **Uncontrolled**: no binding — the checkbox manages its own state.
	 * - **Two-way**: `[(checked)]="signal"` — parent and checkbox stay in sync.
	 * - **One-way in**: `[checked]="expr"` — parent drives state; listen to
	 *   `(checkedChange)` to react.
	 */
	checked = model<boolean>(false);

	/**
	 * Whether the checkbox is in an indeterminate (mixed) state.
	 * This is the primary augmentation this component provides — the native
	 * `.indeterminate` property is not an HTML attribute and cannot be
	 * template-bound without imperative DOM access.
	 */
	indeterminate = input<boolean>(false);

	/**
	 * Whether the checkbox is disabled.
	 */
	disabled = input<boolean>(false);

	/**
	 * Whether the checkbox is required for form validation.
	 */
	required = input<boolean>(false);

	/**
	 * Optional name attribute for form submission grouping.
	 */
	name = input<string | null>(null);

	/**
	 * The value this checkbox represents when checked.
	 * Defaults to 'on' (browser default). Use meaningful values when
	 * the checkbox participates in a group (e.g., pizza toppings).
	 */
	value = input<string | number | boolean>("on");

	// Semantic conformity

	/**
	 * Optional preset key for semantic conformity attributes.
	 */
	attrsPreset = input<PresetKey | null>(null);

	// Outputs

	/**
	 * Emitted when the checkbox is checked, providing its value.
	 * Mirrors the radio component's valueChange pattern — the group
	 * needs to know which value was selected, not just that something toggled.
	 */
	valueChange = output<string | number | boolean>();

	/**
	 * Emitted when the indeterminate state changes.
	 * Browser always clears indeterminate on user interaction,
	 * so this emits `false` on every user click.
	 */
	indeterminateChange = output<boolean>();

	// Internal state
	readonly focused = signal(false);

	// Computed properties

	/**
	 * Resolved preset config for ManageAttributesDirective if needed.
	 */
	attrsPresetResolved = computed<SetAttrsConfig | null>(() => {
		const key = this.attrsPreset();
		return key ? this.attrsManager.Presets[key] : null;
	});

	constructor() {
		// Validate semantic usage in development
		if (isDevMode()) {
			afterNextRender(() => {
				const element = this.labelElement.nativeElement;
				if (element.tagName !== "LABEL") {
					console.warn(
						"InteropCheckbox must be used on <label> elements for semantic correctness. " +
							`Found on: ${element.tagName.toLowerCase()}`,
					);
				}
			});
		}

		// Sync indeterminate property to the DOM element.
		// This is the core augmentation — .indeterminate is a DOM property,
		// not an HTML attribute, so it cannot be template-bound.
		// The ViewChild is { static: true }, so inputElement is available
		// by the time effects first run.
		effect(() => {
			const isIndeterminate = this.indeterminate();
			const input = this.inputElement?.nativeElement;
			if (!input) return;

			input.indeterminate = isIndeterminate;

			// Screen readers need aria-checked="mixed" — browsers do NOT
			// set this automatically from the .indeterminate property.
			if (isIndeterminate) {
				input.setAttribute("aria-checked", "mixed");
			} else {
				input.removeAttribute("aria-checked");
			}
		});
	}

	/**
	 * Handle checkbox change events.
	 * Emits checked state, value (when checked), and clears indeterminate.
	 */
	onCheckboxChange(event: Event): void {
		const element = event.target as HTMLInputElement;
		const isChecked = element.checked;

		this.checked.set(isChecked);

		// Emit value when checked (mirrors radio's valueChange pattern)
		if (isChecked) {
			this.valueChange.emit(this.value());
		}

		// Browser always clears indeterminate on user interaction
		this.indeterminateChange.emit(false);
	}

	/**
	 * Get reference to the native checkbox input element.
	 */
	getInputElement(): HTMLInputElement {
		return this.inputElement.nativeElement;
	}
}
