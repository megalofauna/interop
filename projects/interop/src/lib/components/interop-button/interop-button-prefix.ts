import {
	Directive,
	ElementRef,
	afterNextRender,
	inject,
	isDevMode,
} from "@angular/core";

/**
 * InteropButtonPrefix — Marker directive for the leading addon slot inside
 * an `<button interop-button>` (icon, badge, spinner, decorative glyph).
 *
 * Applied as either an element or an attribute. The host receives the class
 * `interop-button__prefix` for CSS targeting; no other DOM or behavior is
 * imposed — the existing flexbox layout positions the slot inline-start by
 * source order.
 *
 * Unlike `InteropFieldPrefix`, this directive does **not** set
 * `aria-hidden="true"` by default. A button's contents can BE its accessible
 * name (icon-only buttons), and an unconditional `aria-hidden` would erase
 * that. When the prefix is decorative alongside a visible label, mark it
 * `aria-hidden` explicitly:
 *
 * ```html
 * <button interop-button>
 *   <interop-button-prefix>
 *     <interop-icon name="x" aria-hidden="true" />
 *   </interop-button-prefix>
 *   Cancel
 * </button>
 * ```
 *
 * For icon-only buttons, give the host an `aria-label` and leave the
 * prefix contents alone:
 *
 * ```html
 * <button interop-button aria-label="Cancel">
 *   <interop-button-prefix>
 *     <interop-icon name="x" />
 *   </interop-button-prefix>
 * </button>
 * ```
 *
 * Dev-mode warns if applied to an interactive element (`<button>`/`<a>`) —
 * nesting interactives inside a button is invalid HTML and will not produce
 * the focus behavior the author probably wants.
 */
@Directive({
	selector: "interop-button-prefix, [interop-button-prefix]",
	standalone: true,
	host: {
		class: "interop-button__prefix",
	},
})
export class InteropButtonPrefix {
	private el = inject(ElementRef);

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const tag = this.el.nativeElement.tagName;
				if (tag === "BUTTON" || tag === "A") {
					console.warn(
						`[InteropButtonPrefix] Used on an interactive element ` +
							`(<${tag.toLowerCase()}>). Nesting interactive elements inside a ` +
							`button is invalid HTML.`,
					);
				}
			});
		}
	}
}
