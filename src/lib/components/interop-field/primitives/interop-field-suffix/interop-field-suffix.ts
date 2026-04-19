import {
	Directive,
	ElementRef,
	afterNextRender,
	inject,
	isDevMode,
} from "@angular/core";

/**
 * InteropFieldSuffix — Directive for static suffix addons (units, icons)
 * inside an `<interop-field-control>`.
 *
 * Marked `aria-hidden="true"` because static addons are decorative —
 * the semantic meaning should be conveyed in the label text.
 *
 * For **interactive** suffixes (clear button, password toggle), do NOT
 * use this directive — use a regular `<button>` with its own `aria-label`.
 *
 * @example
 * ```html
 * <span interop-field-suffix>.00</span>
 * ```
 * @example
 * ```html
 * <interop-field-suffix>.00</interop-field-suffix>
 * ```
 */
@Directive({
	selector: "interop-field-suffix, [interop-field-suffix]",
	standalone: true,
	host: {
		"aria-hidden": "true",
		class: "interop-field-suffix",
	},
})
export class InteropFieldSuffix {
	private el = inject(ElementRef);

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const tag = this.el.nativeElement.tagName;
				if (tag === "BUTTON" || tag === "A") {
					console.warn(
						`[InteropFieldSuffix] Used on an interactive element (<${tag.toLowerCase()}>). ` +
							`This directive sets aria-hidden="true", which hides the element from screen readers. ` +
							`For interactive suffixes, use a plain <button> with aria-label instead.`,
					);
				}
			});
		}
	}
}
