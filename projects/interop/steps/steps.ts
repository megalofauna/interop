import { Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';
import { bindSteps } from 'interop';

/**
 * Calls `bindSteps()` on the form, after it renders in the browser, and unbinds when it is
 * destroyed. Listen for `(interop-steps-change)` to follow the step. Add `ngNativeValidate` when
 * `FormsModule` is imported, which otherwise turns off the browser's validation the steps rely on.
 *
 * ```html
 * <form id="apply" interop-steps-form ngNativeValidate>
 *   <ol interop-steps aria-label="Application progress">…</ol>
 *   <fieldset id="details">…<button type="button" command="--next" commandfor="apply">Next</button></fieldset>
 *   <fieldset id="address" hidden>…</fieldset>
 * </form>
 * ```
 */
@Directive({
	selector: 'form[interop-steps-form]',
})
export class InteropStepsForm {
	private readonly form = inject<ElementRef<HTMLFormElement>>(ElementRef).nativeElement;

	/** The step indicator, when it is outside the form. */
	readonly indicator = input<HTMLOListElement | null>(null);
	/** Add a history entry per step, so the browser's Back and Forward move between reached steps. */
	readonly history = input(false);

	constructor() {
		afterRenderEffect((onCleanup) => {
			onCleanup(bindSteps(this.form, { indicator: this.indicator(), history: this.history() }));
		});
	}
}
