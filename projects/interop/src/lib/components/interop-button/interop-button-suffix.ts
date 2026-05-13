import {
	Directive,
	ElementRef,
	afterNextRender,
	inject,
	isDevMode,
} from "@angular/core";

/**
 * InteropButtonSuffix — Marker directive for the trailing addon slot inside
 * a `<button interop-button>` (icon, chevron, badge, count).
 *
 * Applied as either an element or an attribute. The host receives the class
 * `interop-button__suffix` for CSS targeting; no other DOM or behavior is
 * imposed — the existing flexbox layout positions the slot inline-end by
 * source order.
 *
 * Like {@link InteropButtonPrefix}, this directive does **not** set
 * `aria-hidden="true"`. The button's contents can BE its accessible name;
 * the author marks decorative content `aria-hidden` explicitly when a
 * visible label is also present.
 *
 * @example Decorative chevron alongside a label
 * ```html
 * <button interop-button>
 *   More
 *   <interop-button-suffix>
 *     <interop-icon name="chevron-right" aria-hidden="true" />
 *   </interop-button-suffix>
 * </button>
 * ```
 *
 * Dev-mode warns if applied to an interactive element (`<button>`/`<a>`).
 */
@Directive({
	selector: "interop-button-suffix, [interop-button-suffix]",
	standalone: true,
	host: {
		class: "interop-button__suffix",
	},
})
export class InteropButtonSuffix {
	private el = inject(ElementRef);

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const tag = this.el.nativeElement.tagName;
				if (tag === "BUTTON" || tag === "A") {
					console.warn(
						`[InteropButtonSuffix] Used on an interactive element ` +
							`(<${tag.toLowerCase()}>). Nesting interactive elements inside a ` +
							`button is invalid HTML.`,
					);
				}
			});
		}
	}
}
