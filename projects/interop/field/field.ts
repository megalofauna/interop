import { Directive, ElementRef, afterRenderEffect, effect, inject, input } from '@angular/core';
import { bindCharacterCount, bindPasswordToggle, bindValidation, type CharacterCountOptions, type ValidationOptions } from 'interop';

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

/**
 * Calls `bindPasswordToggle()` on the input. Aim a button at it with `commandfor` and
 * `command="--toggle-password"`, `aria-pressed="false"` and `hidden`.
 *
 * ```html
 * <input interop-input interop-password-toggle id="password" type="password" autocomplete="current-password">
 * <button interop-button type="button" commandfor="password" command="--toggle-password" aria-pressed="false" hidden>Show password</button>
 * ```
 */
@Directive({
	selector: 'input[interop-password-toggle]',
})
export class InteropPasswordToggle {
	private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

	constructor() {
		afterRenderEffect((onCleanup) => onCleanup(bindPasswordToggle(this.input)));
	}
}

/**
 * Calls `bindCharacterCount()` on the field. The input is `characterLimit`, not `maxlength`, which
 * would stop the user typing.
 *
 * ```html
 * <textarea interop-input interop-character-count [characterLimit]="200" [count]="count"></textarea>
 * <p #count interop-count></p>
 * ```
 */
@Directive({
	selector: 'textarea[interop-character-count], input[interop-character-count]',
})
export class InteropCharacterCount {
	private readonly control = inject<ElementRef<HTMLTextAreaElement | HTMLInputElement>>(ElementRef).nativeElement;

	readonly characterLimit = input.required<number>();
	readonly count = input<HTMLElement | null>(null);
	readonly status = input<HTMLElement | null>(null);
	readonly threshold = input(0);
	readonly message = input<CharacterCountOptions['message']>(undefined);
	readonly tooLong = input<CharacterCountOptions['tooLong']>(undefined);

	constructor() {
		afterRenderEffect((onCleanup) => {
			onCleanup(
				bindCharacterCount(this.control, {
					limit: this.characterLimit(),
					count: this.count(),
					status: this.status(),
					threshold: this.threshold(),
					message: this.message(),
					tooLong: this.tooLong(),
				}),
			);
		});
	}
}
