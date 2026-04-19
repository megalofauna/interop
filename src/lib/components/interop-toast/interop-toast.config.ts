import { InjectionToken } from '@angular/core';
import type { ToastPosition } from './interop-toast.types';

/**
 * Global configuration for all InteropToast instances in a provider subtree.
 *
 * Provide at the root level (or any component/route boundary) to set defaults
 * for every toast below that point. Per-toast options always take precedence
 * over the token values.
 *
 * @example Root-level defaults
 * ```typescript
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     {
 *       provide: INTEROP_TOAST_CONFIG,
 *       useValue: {
 *         position: 'top-right',
 *         duration: 8000,
 *       } satisfies Partial<InteropToastConfig>,
 *     },
 *   ],
 * };
 * ```
 */
export interface InteropToastConfig {
  /** Auto-dismiss duration in milliseconds. Default: 6000. */
  duration: number;
  /** Viewport position for the toast stack. Default: 'bottom-right'. */
  position: ToastPosition;
  /** Maximum visible toasts before excess are queued. Default: 3. */
  maxVisible: number;
  /** Gap between stacked toasts in pixels. Default: 14. */
  gap: number;
  /** Keyboard shortcut to focus the toast viewport. Default: 'alt+KeyT'. */
  hotkey: string;
  /** Enable swipe-to-dismiss gesture. Default: true. */
  swipeDismiss: boolean;
  /** Minimum swipe distance in pixels to trigger dismiss. Default: 50. */
  swipeThreshold: number;
  /** Pause auto-dismiss timer on hover. Default: true. */
  pauseOnHover: boolean;
  /** Pause auto-dismiss timer when a toast child has focus. Default: true. */
  pauseOnFocusWithin: boolean;
  /** Pause auto-dismiss timer when the document is hidden. Default: true. */
  pauseOnDocumentHidden: boolean;
  /** Expand the toast stack on hover to show all toasts. Default: true. */
  expandOnHover: boolean;
}

export const INTEROP_TOAST_DEFAULTS: InteropToastConfig = {
  duration: 6000,
  position: 'bottom-right',
  maxVisible: 3,
  gap: 14,
  hotkey: 'alt+KeyT',
  swipeDismiss: true,
  swipeThreshold: 50,
  pauseOnHover: true,
  pauseOnFocusWithin: true,
  pauseOnDocumentHidden: true,
  expandOnHover: true,
};

/**
 * Injection token for global InteropToast configuration.
 * Defaults to an empty object (all values resolved from INTEROP_TOAST_DEFAULTS).
 */
export const INTEROP_TOAST_CONFIG = new InjectionToken<Partial<InteropToastConfig>>(
  'INTEROP_TOAST_CONFIG',
  { providedIn: 'root', factory: () => ({}) },
);
