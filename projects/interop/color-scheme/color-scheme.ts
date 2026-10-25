import { Directive, ElementRef, afterRenderEffect, inject } from '@angular/core';
import { bindColorScheme } from 'interop';

/**
 * Calls `bindColorScheme()` on a radio group of Light, Dark and System, after it renders in the
 * browser, and unbinds when it is destroyed.
 *
 * ```html
 * <fieldset interop-radio-group="segmented" itx-size="sm" interopColorScheme>
 *   <legend itx-visually-hidden>Theme</legend>
 *   <label><input type="radio" name="theme" value="light"> Light</label>
 *   <label><input type="radio" name="theme" value="dark"> Dark</label>
 *   <label><input type="radio" name="theme" value="system"> System</label>
 * </fieldset>
 * ```
 */
@Directive({
	selector: 'fieldset[interopColorScheme]',
})
export class InteropColorScheme {
	private readonly fieldset = inject<ElementRef<HTMLFieldSetElement>>(ElementRef).nativeElement;

	constructor() {
		afterRenderEffect((onCleanup) => {
			onCleanup(bindColorScheme(this.fieldset));
		});
	}
}
