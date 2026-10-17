import { Directive, ElementRef, afterRenderEffect, inject } from '@angular/core';
import { bindTargetCurrent } from 'interop';

/**
 * Calls `bindTargetCurrent()` on the nav's list, after it renders in the browser, and unbinds when
 * it is destroyed. Give the links `routerLink` with a `fragment`, so they point at this page.
 *
 * ```html
 * <nav interop-page-nav aria-label="On this page">
 *   <ul role="list">
 *     <li><a routerLink="." fragment="install">Install</a></li>
 *   </ul>
 * </nav>
 * ```
 */
@Directive({
	selector: 'nav[interop-page-nav]',
})
export class InteropPageNav {
	private readonly nav = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

	constructor() {
		afterRenderEffect((onCleanup) => {
			const list = this.nav.querySelector<HTMLElement>(':scope > ul');
			if (list) onCleanup(bindTargetCurrent(list));
		});
	}
}
