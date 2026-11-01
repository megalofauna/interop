import { Directive, ElementRef, effect, inject, input } from '@angular/core';

/**
 * Sets the control's custom validity from a message, e.g. the result of an Angular validator or a
 * server check, and tells `<interop-validation>` to update its error. An empty message, `null` or
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
