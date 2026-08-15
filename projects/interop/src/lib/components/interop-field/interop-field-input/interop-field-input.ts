import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	inject,
	input,
	isDevMode,
} from "@angular/core";
import { NgControl } from "@angular/forms";

import { FieldBase } from "../shared/field-base";
import {
	FieldControlElement,
	FieldErrorsElement,
	FieldNotesElement,
} from "../internal/field-elements";

/**
 * InteropFieldInput — High-level field component for `<input>` elements.
 *
 * Renders a complete, accessible form field from declarative inputs:
 * label, native input, notes, and validation errors — with automatic
 * ARIA wiring, error message resolution, and Angular Forms integration.
 *
 * @example Basic usage
 * ```html
 * <interop-field-input
 *   id="email"
 *   type="email"
 *   label="Email address"
 *   required
 *   [formControl]="emailCtrl"
 * />
 * ```
 *
 * @example With prefix, suffix, notes, and custom error messages
 * ```html
 * <interop-field-input
 *   id="price"
 *   type="number"
 *   label="Price"
 *   required
 *   [formControl]="priceCtrl"
 *   [fieldNotes]="'Enter the retail price in USD'"
 *   [errorMessages]="{ required: 'Every item needs a price.' }">
 *   <span interop-field-prefix>$</span>
 *   <span interop-field-suffix>.00</span>
 * </interop-field-input>
 * ```
 *
 * @example Without Angular Forms (manual errors)
 * ```html
 * <interop-field-input
 *   id="username"
 *   type="text"
 *   label="Username"
 *   [fieldErrors]="[
 *     { key: 'required', message: 'Username is required' },
 *     { key: 'taken', message: 'This username is already taken' }
 *   ]"
 * />
 * ```
 */
@Component({
	selector: "interop-field-input",
	standalone: true,
	imports: [FieldControlElement, FieldErrorsElement, FieldNotesElement],
	templateUrl: "./interop-field-input.html",
	changeDetection: ChangeDetectionStrategy.OnPush,

	host: {
		// The field owns its own type scale — 12px label, 14px value, 12px
		// helper, all fixed rem inside a fixed-height control. A global
		// `interop-typography-root` turns prose.css's bare element selectors
		// into de-facto global element styles, which is correct for flowing
		// content and wrong here: a fluid clamp() font-size or a rhythm margin
		// landing on the label would break the pinned height. Static attribute,
		// never conditional — see the round 3 note in
		// .agent/workflows/carbon-borrow.md.
		"interop-typography-isolate": "",

		"[attr.data-invalid]": 'hasVisibleErrors() ? "" : null',
		"[attr.data-disabled]": 'disabled() ? "" : null',
		"[attr.data-required]": 'required() ? "" : null',
		"[attr.data-readonly]": 'readonly() ? "" : null',
	},
})
export class InteropFieldInput extends FieldBase {
	/**
	 * The `type` attribute for the native `<input>` element.
	 * Accepts any valid input type (text, number, email, password, etc.).
	 */
	type = input<string>("text");

	constructor() {
		super();

		// Wire up CVA: inject NgControl and self-assign the value accessor,
		// then register the control with the base class after render.
		const ngControl = inject(NgControl, { self: true, optional: true });
		if (ngControl) {
			ngControl.valueAccessor = this;
			afterNextRender(() => this.setCvaControl(ngControl.control));
		}

		// Dev-mode guard: warn if someone passes type="textarea"
		if (isDevMode()) {
			afterNextRender(() => {
				if (this.type() === "textarea") {
					console.warn(
						`[InteropFieldInput] type="textarea" is not supported. ` +
							`Use <interop-field-textarea> instead.`,
					);
				}
			});
		}
	}
}
