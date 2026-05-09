import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	ViewChild,
	afterNextRender,
	inject,
	input,
	isDevMode,
	output,
	signal,
} from "@angular/core";
import { InteropVisimorph } from "../../interop-visimorph/interop-visimorph";

/**
 * InteropToggle - A semantically correct toggle switch built on a native checkbox.
 *
 * Visually renders as a pill-track-and-thumb switch. Semantically it is
 * `<input type="checkbox" role="switch">` — a real form control that participates
 * in native `<form>` submission and constraint validation without JavaScript.
 *
 * The `role="switch"` attribute is the key accessibility detail: screen readers
 * announce the state as "on" / "off" rather than "checked" / "unchecked", which
 * matches the physical switch affordance and user expectation.
 *
 * No `indeterminate` state exists on this component. A switch is binary by
 * definition; if you need a three-state control, use `interop-checkbox`.
 *
 * @example Basic usage
 * ```html
 * <label interop-toggle [id]="'dark-mode'" [checked]="darkMode()">
 *   Dark mode
 * </label>
 * ```
 *
 * @example Disabled
 * ```html
 * <label interop-toggle [id]="'notifications'" [checked]="true" [disabled]="true">
 *   Notifications
 * </label>
 * ```
 *
 * @example In a form (native submission works — no extra wiring needed)
 * ```html
 * <form>
 *   <label interop-toggle [id]="'terms'" name="terms" value="accepted">
 *     Accept terms
 *   </label>
 * </form>
 * ```
 *
 * @example Theming — override at any ancestor scope
 * ```css
 * .my-section {
 *   --itx-control-accent: hotpink;
 *   --itx-control-toggle-width: 3rem;
 * }
 * ```
 */
@Component({
	selector: "label[interop-toggle]",
	standalone: true,
	imports: [InteropVisimorph],
	template: `
		<input
			#toggleInput
			type="checkbox"
			role="switch"
			class="interop-sr-only"
			[id]="id()"
			[checked]="checked()"
			[disabled]="disabled()"
			[required]="required()"
			[attr.name]="name()"
			[attr.value]="value()"
			(change)="onToggleChange($event)"
			(focus)="focused.set(toggleInput.matches(':focus-visible'))"
			(blur)="focused.set(false)"
		/>
		<interop-visimorph
			[type]="'toggle'"
			[checked]="checked()"
			[disabled]="disabled()"
			[focused]="focused()"
		/>
		<ng-content></ng-content>
	`,
	styleUrl: "./interop-toggle-control.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropToggle {
	@ViewChild("toggleInput", { static: true })
	private inputElement!: ElementRef<HTMLInputElement>;

	private labelElement = inject(ElementRef<HTMLLabelElement>);

	/**
	 * Unique identifier for the toggle input.
	 * Used for label association and accessibility.
	 */
	id = input.required<string>();

	/**
	 * Whether this toggle is currently on (checked).
	 */
	checked = input<boolean>(false);

	/**
	 * Whether the toggle is disabled.
	 */
	disabled = input<boolean>(false);

	/**
	 * Whether the toggle is required for form validation.
	 */
	required = input<boolean>(false);

	/**
	 * Optional name attribute for form submission.
	 */
	name = input<string | null>(null);

	/**
	 * The value submitted with the form when the toggle is on.
	 * Defaults to 'on' (browser default).
	 */
	value = input<string | number | boolean>("on");

	/**
	 * Emitted when the toggle's on/off state changes.
	 */
	checkedChange = output<boolean>();

	/**
	 * Emitted when the toggle is turned on, providing its value.
	 */
	valueChange = output<string | number | boolean>();

	readonly focused = signal(false);

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const element = this.labelElement.nativeElement;
				if (element.tagName !== "LABEL") {
					console.warn(
						"InteropToggle must be used on <label> elements for semantic correctness. " +
							`Found on: ${element.tagName.toLowerCase()}`,
					);
				}
			});
		}
	}

	onToggleChange(event: Event): void {
		const element = event.target as HTMLInputElement;
		const isChecked = element.checked;

		this.checkedChange.emit(isChecked);

		if (isChecked) {
			this.valueChange.emit(this.value());
		}
	}

	getInputElement(): HTMLInputElement {
		return this.inputElement.nativeElement;
	}
}
