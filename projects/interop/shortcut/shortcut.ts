import { Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';
import { bindShortcut } from 'interop';

/**
 * Calls `bindShortcut()` on the button, after it renders in the browser, and unbinds when it is
 * destroyed. The key clicks the button.
 *
 * ```html
 * <button interop-button type="button" command="show-modal" commandfor="go-to" interopShortcut="mod+k">
 *   Search <kbd></kbd>
 * </button>
 * ```
 */
@Directive({
	selector: 'button[interopShortcut]',
})
export class InteropShortcut {
	private readonly button = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;

	/** The keys: `mod+k`, `mod+shift+p`. `mod` is ⌘ on Apple platforms and Ctrl elsewhere. */
	readonly interopShortcut = input.required<string>();

	constructor() {
		afterRenderEffect((onCleanup) => {
			onCleanup(bindShortcut(this.button, this.interopShortcut()));
		});
	}
}
