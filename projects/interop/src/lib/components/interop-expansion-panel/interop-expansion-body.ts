import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { INTEROP_EXPANSION_PANEL_CONTEXT } from './interop-expansion-panel.context.token';

/**
 * InteropExpansionBody — Animated content region of an `interop-expansion-panel`.
 *
 * Apply to any block element inside the panel. Wires the stable body ID
 * (matching the trigger's `aria-controls`) and animates open/close using a
 * CSS `grid-template-rows` transition — no `@angular/animations` required.
 *
 * The inner wrapper div is required by the grid-rows height animation. Do not
 * add padding or margin to the host element directly; apply it to a wrapper
 * inside the default slot instead.
 *
 * ```html
 * <div interop-expansion-body>
 *   <div class="panel-content">...</div>
 * </div>
 * ```
 *
 * CSS custom properties — see `styles/components/expansion-panel.css` for
 * the complete grouped list. Body-specific surface includes:
 * - `--itx-expansion-panel-body-background` / `-background-image`
 * - `--itx-expansion-panel-body-padding`
 * - `--itx-expansion-panel-body-divider-width` / `-style` / `-color`
 * - `--itx-expansion-panel-body-transition-duration` / `-easing`
 * - `--itx-expansion-panel-body-peek-height` / `-peek-fade-height` / `-peek-fade-color`
 */
@Component({
  selector: '[interop-expansion-body]',
  standalone: true,
  template: `<div class="itx-expansion-body-inner"><ng-content /></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[id]': 'panel.bodyId',
    '[attr.data-expanded]': 'panel.isExpanded() ? "" : null',
    '[attr.data-peek]': 'peek() ? "" : null',
    '[attr.aria-hidden]': '!panel.isExpanded() && !peek() ? "true" : null',
  },
})
export class InteropExpansionBody {
  readonly panel = inject(INTEROP_EXPANSION_PANEL_CONTEXT);

  /**
   * When true, the body shows a partial preview of its content while collapsed
   * rather than hiding it entirely. The visible height is controlled by the
   * `--itx-expansion-panel-body-peek-height` CSS custom property.
   * A fade gradient indicates there is more content beyond the threshold.
   *
   * `aria-hidden` is not applied in peek mode since the content is visible.
   */
  readonly peek = input<boolean>(false);
}
