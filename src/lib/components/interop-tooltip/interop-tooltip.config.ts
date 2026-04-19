import { InjectionToken } from '@angular/core';
import type { Placement } from './position-strategy';

/**
 * Global configuration for all interop-tooltip instances in a provider subtree.
 *
 * Provide at the root level (or any component/route boundary) to set defaults
 * for every tooltip below that point. Instance-level inputs always take precedence
 * over the token values.
 *
 * @example Root-level defaults
 * ```typescript
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     {
 *       provide: INTEROP_TOOLTIP_CONFIG,
 *       useValue: {
 *         showDelay: 400,
 *         placement: 'bottom',
 *       } satisfies Partial<InteropTooltipConfig>,
 *     },
 *   ],
 * };
 * ```
 */
export interface InteropTooltipConfig {
  /** Preferred tooltip placement. Default: 'top'. */
  placement: Placement;
  /** Milliseconds before a hover-triggered tooltip appears. Focus always shows immediately. Default: 600. */
  showDelay: number;
  /** Gap between trigger edge and tooltip panel in pixels. Default: 8. */
  offset: number;
  /**
   * Whether the tooltip content serves as the trigger's accessible description or label.
   * - 'description' (default): wires `aria-describedby` — supplemental info, announced after the name.
   * - 'label': wires `aria-labelledby` — replaces the accessible name. Use only for icon-only controls.
   */
  semantic: 'description' | 'label';
  /**
   * Tooltip behavior on touch devices.
   * - 'none' (default): tooltip does not activate on touch. Ensure tooltip content is supplemental.
   * - 'longpress': show after a 500ms press.
   * - 'tap': show on first tap; subsequent taps activate the trigger.
   */
  touchBehavior: 'none' | 'longpress' | 'tap';
}

export const INTEROP_TOOLTIP_DEFAULTS: InteropTooltipConfig = {
  placement: 'top',
  showDelay: 600,
  offset: 8,
  semantic: 'description',
  touchBehavior: 'none',
};

/**
 * Injection token for global InteropTooltip configuration.
 * Defaults to an empty object (all values resolved from INTEROP_TOOLTIP_DEFAULTS).
 */
export const INTEROP_TOOLTIP_CONFIG = new InjectionToken<Partial<InteropTooltipConfig>>(
  'INTEROP_TOOLTIP_CONFIG',
  { providedIn: 'root', factory: () => ({}) },
);
