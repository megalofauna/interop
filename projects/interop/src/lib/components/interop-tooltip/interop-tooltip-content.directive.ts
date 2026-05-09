import { Directive } from '@angular/core';

/**
 * Marks an ng-template as the rich-content projection slot for interop-tooltip.
 *
 * When present, this template is rendered inside the tooltip panel instead of
 * the string [label] input. Use for tooltips that need formatted text, keyboard
 * shortcut indicators, or any HTML structure the [label] string cannot express.
 *
 * This directive carries no behavior — it is a ContentChild query selector only.
 *
 * @example Rich content with keyboard shortcut
 * ```html
 * <interop-tooltip>
 *   <button>Save</button>
 *   <ng-template interopTooltipContent>
 *     Save document &nbsp;<kbd>Ctrl</kbd>+<kbd>S</kbd>
 *   </ng-template>
 * </interop-tooltip>
 * ```
 *
 * @example Formatted description
 * ```html
 * <interop-tooltip>
 *   <button interopTooltipTrigger>Upload</button>
 *   <ng-template interopTooltipContent>
 *     <strong>Accepted formats:</strong> PNG, JPG, SVG &lt; 5 MB
 *   </ng-template>
 * </interop-tooltip>
 * ```
 */
@Directive({
  selector: 'ng-template[interopTooltipContent]',
  standalone: true,
})
export class InteropTooltipContentDirective {}
