import { Directive, ElementRef, afterRenderEffect, inject } from '@angular/core';
import { bindToolbar } from 'interop';

/**
 * Calls `bindToolbar()` on the element, after it renders in the browser, and unbinds when it is
 * destroyed. In browsers with the `focusgroup` attribute, the browser does the work and the helper
 * does nothing.
 *
 * ```html
 * <div interop-toolbar role="toolbar" focusgroup="toolbar" aria-label="Formatting">
 *   <button interop-button="icon" type="button" aria-label="Bold">…</button>
 *   <button interop-button="icon" type="button" aria-label="Italic">…</button>
 *   <button interop-button="icon" type="button" aria-label="Code">…</button>
 * </div>
 * ```
 */
@Directive({
	selector: '[interop-toolbar]',
})
export class InteropToolbar {
	private readonly root = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

	constructor() {
		afterRenderEffect((onCleanup) => {
			onCleanup(bindToolbar(this.root));
		});
	}
}
