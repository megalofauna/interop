import { Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';
import { bindFilter, type FilterOptions } from 'interop';

/**
 * Calls `bindFilter()` on a search field and the list it filters, after they render in the browser,
 * and unbinds when the field is destroyed. Items the list renders later are filtered as the user types.
 *
 * ```html
 * <input type="search" id="go-to-query" [interopFilter]="pages" [filterEmpty]="none">
 * <ul #pages>…</ul>
 * <p #none hidden>No pages match</p>
 * ```
 */
@Directive({
	selector: 'input[interopFilter]',
})
export class InteropFilter {
	private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

	/** The list whose children are filtered. */
	readonly interopFilter = input.required<HTMLElement>();
	readonly filterEmpty = input<HTMLElement | null>(null);
	readonly filterMatch = input<FilterOptions['match']>(undefined);
	readonly filterMessage = input<FilterOptions['message']>(undefined);
	readonly filterStatus = input<HTMLElement | null>(null);

	constructor() {
		afterRenderEffect((onCleanup) => {
			onCleanup(
				bindFilter(this.input, this.interopFilter(), {
					empty: this.filterEmpty(),
					match: this.filterMatch(),
					message: this.filterMessage(),
					status: this.filterStatus(),
				}),
			);
		});
	}
}
