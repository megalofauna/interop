import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { bindTooltip } from 'interop';

/**
 * Gives an element a tooltip, by element or ID. The tooltip names the element when it is
 * `interop-tooltip="label"`, and describes it otherwise.
 *
 * ```html
 * <button interop-button [interopTooltip]="close" (click)="dismiss()">
 *   <svg interop-icon name="tabler-x"></svg>
 * </button>
 * <span interop-tooltip="label" #close>Close</span>
 * ```
 */
@Directive({
	selector: '[interopTooltip]',
})
export class InteropTooltip {
	private readonly trigger = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

	/** The tooltip, or its ID. */
	readonly interopTooltip = input.required<HTMLElement | string | null>();

	constructor() {
		effect((onCleanup) => {
			const value = this.interopTooltip();
			const tooltip = typeof value === 'string' ? this.trigger.ownerDocument.getElementById(value) : value;
			if (tooltip) onCleanup(bindTooltip(this.trigger, tooltip));
		});
	}
}
