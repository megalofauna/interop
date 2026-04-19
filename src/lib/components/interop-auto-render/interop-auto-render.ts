import { computed, Directive, input } from "@angular/core";

/**
 * Lightweight rendering optimisation for repeated items inside any scroll container.
 *
 * Applies [`content-visibility: auto`](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility)
 * to the host element, instructing the browser to skip layout, paint, and style
 * resolution for off-screen items while preserving accurate scrollbar sizing via
 * `contain-intrinsic-size`.
 *
 * This is a **CSS-only, zero-JavaScript** approach to scroll performance that works
 * with any scroll container — `InteropScrollArea`, a plain `<div>`, or the CDK
 * virtual viewport. DOM nodes still exist in the tree (unlike true virtualisation),
 * but rendering cost for off-screen items drops to near zero.
 *
 * ### When to use
 * - Lists of roughly 100–5,000 items where DOM creation cost is acceptable.
 * - As a drop-in performance win with **no architectural changes**.
 *
 * ### When to reach for true virtualisation instead
 * - 10 000+ items where DOM node count itself is the bottleneck.
 * - Memory-constrained environments.
 *
 * ---
 *
 * @example
 * <!-- Default 48 px item-height estimate -->
 * <div *ngFor="let item of items" interopAutoRender>
 *   {{ item.label }}
 * </div>
 *
 * @example
 * <!-- Custom item-height estimate -->
 * <div *ngFor="let item of items" interopAutoRender="80px">
 *   {{ item.label }}
 * </div>
 *
 * @example
 * <!-- Inside an InteropScrollArea with \@for -->
 * <interop-scroll-area ariaLabel="Product list" style="height: 400px">
 *   \@for (product of products(); track product.id) {
 *     <app-product-card [product]="product" interopAutoRender="120px" />
 *   }
 * </interop-scroll-area>
 */
@Directive({
	selector: "[interopAutoRender]",
	standalone: true,
	host: {
		"[style.content-visibility]": '"auto"',
		"[style.contain-intrinsic-size]": "containIntrinsicSize()",
	},
})
export class InteropAutoRender {
	/**
	 * Estimated item height used as a placeholder while the element is off-screen.
	 *
	 * The browser uses this value to calculate scrollbar size and position before
	 * the element is actually rendered. Once rendered, the browser remembers the
	 * real size (via the `auto` keyword in `contain-intrinsic-size`).
	 *
	 * Accepts any valid CSS length — `'48px'`, `'3rem'`, `'5lh'`, etc.
	 * If the value already starts with `auto` it is passed through verbatim,
	 * allowing full control (e.g. `'auto 200px 64px'` for explicit width + height).
	 *
	 * When the directive is applied as a bare attribute (`interopAutoRender` with
	 * no binding), the default estimate of **48 px** is used.
	 */
	readonly interopAutoRender = input<string>("");

	/** @internal Resolved `contain-intrinsic-size` value bound to the host. */
	protected readonly containIntrinsicSize = computed(() => {
		const value = this.interopAutoRender();
		if (!value) return "auto 48px";
		return value.startsWith("auto") ? value : `auto ${value}`;
	});
}
