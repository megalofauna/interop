import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	inject,
	input,
	viewChild,
} from "@angular/core";
import { NgControl } from "@angular/forms";

import { FieldBase } from "../shared/field-base";
import {
	FieldControlElement,
	FieldErrorsElement,
	FieldNotesElement,
} from "../internal/field-elements";

/**
 * InteropFieldTextarea — High-level field component for `<textarea>` elements.
 *
 * Renders a complete, accessible multiline text field from declarative inputs:
 * label, native textarea, notes, and validation errors — with automatic
 * ARIA wiring, error message resolution, and Angular Forms integration.
 *
 * @example Basic usage
 * ```html
 * <interop-field-textarea
 *   id="bio"
 *   label="Biography"
 *   [formControl]="bioCtrl"
 * />
 * ```
 *
 * @example With auto-resize and notes
 * ```html
 * <interop-field-textarea
 *   id="description"
 *   label="Description"
 *   [autoResize]="true"
 *   [rows]="3"
 *   [formControl]="descCtrl"
 *   [fieldNotes]="'Describe the item in detail'"
 * />
 * ```
 */
@Component({
	selector: "interop-field-textarea",
	standalone: true,
	imports: [FieldControlElement, FieldErrorsElement, FieldNotesElement],
	templateUrl: "./interop-field-textarea.html",
	styleUrl: "./interop-field-textarea.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,

	host: {
		"[attr.data-invalid]": 'hasVisibleErrors() ? "" : null',
		"[attr.data-disabled]": 'disabled() ? "" : null',
		"[attr.data-required]": 'required() ? "" : null',
		"[attr.data-readonly]": 'readonly() ? "" : null',
	},
})
export class InteropFieldTextarea extends FieldBase {
	/**
	 * When true, the textarea height automatically adjusts to fit content.
	 */
	autoResize = input<boolean>(false);

	/**
	 * Number of visible text rows for the textarea.
	 */
	rows = input<number | null>(null);

	/** Reference to the native textarea element for auto-resize. */
	private textareaRef =
		viewChild<ElementRef<HTMLTextAreaElement>>("textareaEl");

	constructor() {
		super();

		// Wire up CVA: inject NgControl and self-assign the value accessor,
		// then register the control with the base class after render.
		const ngControl = inject(NgControl, { self: true, optional: true });
		if (ngControl) {
			ngControl.valueAccessor = this;
			afterNextRender(() => this.setCvaControl(ngControl.control));
		}
	}

	/**
	 * Override base onInput to add auto-resize behavior.
	 */
	override onInput(event: Event): void {
		super.onInput(event);

		if (this.autoResize()) {
			this.resizeToFit();
		}
	}

	/** Resize textarea to fit its content. */
	private resizeToFit(): void {
		const ref = this.textareaRef();
		if (!ref) return;

		const textarea = ref.nativeElement;
		textarea.style.height = "auto";
		textarea.style.height = `${textarea.scrollHeight}px`;
	}
}
