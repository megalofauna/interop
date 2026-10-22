import { Directive, ElementRef, afterRenderEffect, inject } from '@angular/core';
import { bindToasts } from 'interop';

/**
 * Calls `bindToasts()` on the region, after it renders in the browser: dismiss buttons, Escape,
 * timers that stop while the user is in the region, and focus that stays in place as toasts go.
 * Show a toast with `toast()` from `interop`.
 *
 * ```html
 * <section interop-toasts popover="manual" aria-label="Notifications"></section>
 * ```
 */
@Directive({
	selector: '[interop-toasts]',
})
export class InteropToasts {
	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

	constructor() {
		afterRenderEffect((onCleanup) => {
			onCleanup(bindToasts(this.element));
		});
	}
}
