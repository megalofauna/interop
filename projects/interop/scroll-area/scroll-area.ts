import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';
import { bindScrollArea } from 'interop';

/**
 * A scroll container that the keyboard can reach, with a "more content" shadow at each edge
 * that has content beyond it. Name it with `aria-label` or `aria-labelledby` when it needs a name.
 *
 * ```html
 * <div interop-scroll-area aria-labelledby="results-heading">…</div>
 * ```
 */
@Directive({
	selector: '[interop-scroll-area]',
})
export class InteropScrollArea {
	constructor() {
		const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
		let unbind = () => {};
		afterNextRender(() => (unbind = bindScrollArea(element)));
		inject(DestroyRef).onDestroy(() => unbind());
	}
}
