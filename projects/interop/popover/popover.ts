import { Directive, ElementRef, afterRenderEffect, inject } from '@angular/core';
import { bindDrawer } from 'interop';

/**
 * Calls `bindDrawer()` on a drawer popover, after it renders in the browser.
 *
 * ```html
 * <button interop-button type="button" commandfor="site-nav" command="toggle-popover">Menu</button>
 * <nav id="site-nav" interop-popover="drawer" popover aria-label="Pages">…</nav>
 * ```
 */
@Directive({
	selector: '[interop-popover="drawer"]',
})
export class InteropDrawer {
	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

	constructor() {
		afterRenderEffect((onCleanup) => onCleanup(bindDrawer(this.element)));
	}
}
