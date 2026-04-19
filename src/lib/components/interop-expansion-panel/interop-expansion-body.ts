import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
 * CSS custom properties (set on host or any ancestor):
 * - `--itx-expansion-duration` — transition duration (default: 200ms)
 * - `--itx-expansion-easing`   — transition easing (default: ease)
 */
@Component({
  selector: '[interop-expansion-body]',
  standalone: true,
  template: `<div class="itx-expansion-body-inner"><ng-content /></div>`,
  styleUrl: './interop-expansion-body.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[id]': 'panel.bodyId',
    '[attr.data-expanded]': 'panel.isExpanded() ? "" : null',
    '[attr.aria-hidden]': '!panel.isExpanded() ? "true" : null',
  },
})
export class InteropExpansionBody {
  readonly panel = inject(INTEROP_EXPANSION_PANEL_CONTEXT);
}
