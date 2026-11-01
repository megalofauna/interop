import { Directive, ElementRef, afterRenderEffect, effect, inject, input } from '@angular/core';
import { bindValidation, type ValidationOptions } from 'interop';

/**
 * Calls `bindValidation()` on the form, after it renders in the browser, and unbinds when it is
 * destroyed. Use the native constraints (`required`, `type`, `minlength`, `pattern`): Angular's
 * matching validators read the same attributes, so the form and the browser agree.
 *
 * ```html
 * <div interop-error-summary hidden><h2>There is a problem</h2><ul></ul></div>
 * <form interop-form [summary]="summary" (submit)="save()">…</form>
 * ```
 */
@Directive({
	selector: 'form[interop-form]',
})
export class InteropForm {
	private readonly form = inject<ElementRef<HTMLFormElement>>(ElementRef).nativeElement;

	/** An `[interop-error-summary]` with an empty `<ul>`, filled and focused on a failed submit. */
	readonly summary = input<HTMLElement | null>(null);
	/** Messages per validity key, merged over the defaults. */
	readonly messages = input<ValidationOptions['messages']>(undefined);

	constructor() {
		afterRenderEffect((onCleanup) => {
			onCleanup(bindValidation(this.form, { summary: this.summary(), messages: this.messages() }));
		});
	}
}

/**
 * Sets the control's custom validity from a message, e.g. the result of an Angular validator or a
 * server check, and tells `bindValidation()` to update its error. An empty message, `null` or
 * `undefined` makes it valid.
 *
 * ```html
 * <input interop-input [interopCustomValidity]="taken() ? 'That name is taken' : ''">
 * ```
 */
@Directive({
	selector: 'input[interopCustomValidity], textarea[interopCustomValidity], select[interopCustomValidity]',
})
export class InteropCustomValidity {
	private readonly control = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>>(ElementRef).nativeElement;

	readonly interopCustomValidity = input<string | null | undefined>('');

	constructor() {
		effect(() => {
			this.control.setCustomValidity(this.interopCustomValidity() ?? '');
			this.control.dispatchEvent(new Event('interop-validity-change', { bubbles: true }));
		});
	}
}
