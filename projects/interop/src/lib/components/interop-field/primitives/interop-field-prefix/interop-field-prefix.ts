import {
	Directive,
	ElementRef,
	afterNextRender,
	inject,
	isDevMode,
} from "@angular/core";

/**
 * InteropFieldPrefix — Directive for static prefix addons (currency symbols,
 * icons, unit labels) inside an `<interop-field-control>`.
 *
 * Marked `aria-hidden="true"` because static addons are decorative —
 * the semantic meaning should be conveyed in the label text
 * (e.g., "Price, in US dollars" not just "Price").
 *
 * For **interactive** prefixes (buttons), do NOT use this directive —
 * use a regular `<button>` with its own `aria-label`.
 *
 * @example
 * ```html
 * <span interop-field-prefix>$</span>
 * ```
 */
@Directive({
	selector: "interop-field-prefix, [interop-field-prefix]",
	standalone: true,
	host: {
		"aria-hidden": "true",
		class: "interop-field-prefix",
	},
})
export class InteropFieldPrefix {
	private el = inject(ElementRef);

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const tag = this.el.nativeElement.tagName;
				if (tag === "BUTTON" || tag === "A") {
					console.warn(
						`[InteropFieldPrefix] Used on an interactive element (<${tag.toLowerCase()}>). ` +
							`This directive sets aria-hidden="true", which hides the element from screen readers. ` +
							`For interactive prefixes, use a plain <button> with aria-label instead.`,
					);
				}
			});
		}
	}
}
