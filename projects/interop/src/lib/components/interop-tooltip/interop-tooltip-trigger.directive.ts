import { Directive } from '@angular/core';

/**
 * Marker directive that identifies the tooltip trigger within an interop-tooltip.
 *
 * By default, interop-tooltip auto-detects the first focusable element in its
 * projected content (button, a[href], input, select, textarea, [tabindex]).
 * Apply this directive when auto-detection would pick the wrong element, or when
 * the trigger is a component that renders its focusable element internally.
 *
 * This directive carries no behavior — it is a DI query token only.
 *
 * @example Explicit marker (disambiguation)
 * ```html
 * <interop-tooltip label="Open settings">
 *   <app-icon-button interopTooltipTrigger icon="settings" />
 * </interop-tooltip>
 * ```
 */
@Directive({
  selector: '[interopTooltipTrigger]',
  standalone: true,
})
export class InteropTooltipTriggerDirective {}
