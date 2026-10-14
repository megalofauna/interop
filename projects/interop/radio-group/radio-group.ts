import { Directive, ElementRef, afterRenderEffect, inject } from '@angular/core';
import { bindSegmentedFit } from 'interop';

/**
 * Calls `bindSegmentedFit()` on a segmented radio group, after it renders in the browser, and unbinds
 * when it is destroyed: the control stacks whenever its row does not fit.
 *
 * ```html
 * <fieldset interop-radio-group="segmented" interop-segmented-fit>…</fieldset>
 * ```
 */
@Directive({
	selector: 'fieldset[interop-segmented-fit]',
})
export class InteropSegmentedFit {
	private readonly group = inject<ElementRef<HTMLFieldSetElement>>(ElementRef).nativeElement;

	constructor() {
		afterRenderEffect((onCleanup) => onCleanup(bindSegmentedFit(this.group)));
	}
}
