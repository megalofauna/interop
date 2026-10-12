import { Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';
import { bindTabs } from 'interop';

/**
 * Calls `bindTabs()` on the element, after it renders in the browser, and unbinds when it is
 * destroyed. Listen for `(interop-tabs-change)` to follow the selection.
 *
 * ```html
 * <div interop-tabs (interop-tabs-change)="selected.set($event.detail.panel.id)">
 *   <div role="tablist" aria-label="Station systems">
 *     <button type="button" role="tab" aria-controls="nav" aria-selected="true">Navigation</button>
 *     <button type="button" role="tab" aria-controls="eng" aria-selected="false" tabindex="-1">Engineering</button>
 *   </div>
 *   <section role="tabpanel" id="nav">…</section>
 *   <section role="tabpanel" id="eng" hidden="until-found">…</section>
 * </div>
 * ```
 */
@Directive({
	selector: '[interop-tabs]',
})
export class InteropTabs {
	private readonly root = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

	/** `automatic` selects a tab as the arrow keys reach it. `manual` waits for Enter or Space. */
	readonly activation = input<'automatic' | 'manual'>('automatic');
	/** Select the tab whose panel matches the URL fragment. */
	readonly hash = input(false);

	constructor() {
		afterRenderEffect((onCleanup) => {
			onCleanup(bindTabs(this.root, { activation: this.activation(), hash: this.hash() }));
		});
	}
}
