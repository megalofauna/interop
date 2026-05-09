import { Directive } from "@angular/core";

/**
 * InteropPopoverArrow — marker directive for a custom arrow.
 *
 * Place on any child element of an `[interop-popover]` to render that element
 * as the arrow. The structural CSS positions and rotates it based on the
 * popover's resolved placement (`[data-placement]`). When this marker is
 * present, the built-in CSS-triangle arrow (`[showArrow]="true"`) is
 * suppressed automatically.
 *
 * @example
 * ```html
 * <div interop-popover>
 *   <span interop-popover-arrow>
 *     <interop-icon name="tabler-caret-up-filled" [size]="12" />
 *   </span>
 *   <p>Panel content.</p>
 * </div>
 * ```
 */
@Directive({
	selector: "[interop-popover-arrow]",
	standalone: true,
	host: {
		class: "interop-popover__arrow",
		"aria-hidden": "true",
	},
})
export class InteropPopoverArrow {}
