import { Directive, ElementRef, afterEveryRender, afterRenderEffect, inject, input } from '@angular/core';
import { bindSlider, paintSlider } from 'interop';

/**
 * Calls `bindSlider()` on the slider, after it renders in the browser: the fill follows the value,
 * and `format` sets `aria-valuetext` and the readout.
 *
 * ```html
 * <label for="budget">Budget</label>
 * <input type="range" interop-slider id="budget" min="0" max="500" step="10" [format]="dollars" [readout]="shown">
 * <span #shown></span>
 * ```
 */
@Directive({
	selector: 'input[type="range"][interop-slider]',
})
export class InteropSlider {
	private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

	/** The value as words, for a number that alone misleads, e.g. a price or a temperature. */
	readonly format = input<((value: number) => string) | undefined>(undefined);
	/** An element to show the value in. It is hidden from assistive technology. */
	readonly readout = input<HTMLElement | null>(null);

	constructor() {
		afterRenderEffect((onCleanup) => {
			onCleanup(bindSlider(this.element, { format: this.format(), readout: this.readout() }));
		});
		// A value bound by Angular, or written by a form control, fires no input event.
		afterEveryRender(() => paintSlider(this.element, { format: this.format(), readout: this.readout() }));
	}
}
