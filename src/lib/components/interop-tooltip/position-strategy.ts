import { InjectionToken } from '@angular/core';

/**
 * Placement variants for the tooltip panel relative to its trigger.
 * Passed to position() on each call; strategies use the current value
 * so placement changes are reflected without re-connecting.
 */
export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/** The main axis resolved after flip/shift — used to set [data-placement] on the panel. */
export type ResolvedPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface PositionOptions {
  placement: Placement;
  /** Gap between trigger edge and tooltip panel in pixels. */
  offset: number;
}

/**
 * Positioning strategy interface.
 *
 * Each interop-tooltip instance gets its own strategy instance via the
 * INTEROP_POSITION_STRATEGY token (provided per-component via useFactory).
 *
 * ## Lifecycle
 * 1. `connect(trigger, tooltip)` — called once after both elements exist in the DOM.
 * 2. `position(options)` — called on show (and inside the autoUpdate loop).
 *    Receives current options so dynamic placement changes are handled automatically.
 * 3. `startAutoUpdate(cb)` — called after show; returns a cleanup function.
 *    JS strategies start scroll/resize listeners; CSS anchor strategy is a no-op here.
 * 4. `disconnect()` — called on component destroy; clean up all resources.
 *
 * ## CSS Anchor Positioning migration path
 * When CSS anchor positioning (`anchor-name` / `position-anchor`) reaches
 * "Newly Available" baseline, a `CssAnchorPositionStrategy` will implement this
 * interface. Its `connect()` will set `anchor-name` on the trigger and
 * `position-anchor` + `position-area` + `position-try-fallbacks` on the tooltip.
 * `position()` and `startAutoUpdate()` will be no-ops — the browser handles
 * repositioning. Swapping to that strategy is a one-line provider change;
 * no component code changes.
 */
export interface InteropPositionStrategy {
  readonly name: string;

  /**
   * Wire up the trigger and tooltip elements.
   * Called once after both elements exist in the DOM.
   */
  connect(trigger: HTMLElement, tooltip: HTMLElement): void;

  /**
   * Compute and apply position.
   * JS strategies set inline `top`/`left` and return the resolved placement.
   * CSS anchor strategy returns the requested placement; the browser owns layout.
   */
  position(options: PositionOptions): Promise<ResolvedPlacement>;

  /**
   * Start listening for scroll/resize to keep the tooltip positioned correctly.
   * Returns a cleanup function; call it on hide to stop the update loop.
   * CSS anchor strategy returns a no-op cleanup.
   */
  startAutoUpdate(onUpdate: () => void): () => void;

  /**
   * Release all resources held by the strategy.
   * Called once on component destroy.
   */
  disconnect(): void;
}

/**
 * Injection token for the positioning strategy.
 *
 * InteropTooltip provides FloatingUiPositionStrategy by default (useFactory per
 * component instance). Override at any provider level to swap strategy globally
 * or for a specific subtree:
 *
 * ```typescript
 * // App-wide
 * providers: [
 *   { provide: INTEROP_POSITION_STRATEGY, useFactory: () => new NativePositionStrategy() }
 * ]
 * ```
 */
export const INTEROP_POSITION_STRATEGY = new InjectionToken<InteropPositionStrategy>(
  'INTEROP_POSITION_STRATEGY',
);
