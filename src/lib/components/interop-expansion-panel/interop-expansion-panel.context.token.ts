import { InjectionToken, Signal } from '@angular/core';

/**
 * Minimal context interface exposed by InteropExpansionPanel to its
 * descendant trigger and body directives. Using a token + interface avoids
 * the circular dependency that would arise from the children importing the
 * parent component class directly.
 */
export interface InteropExpansionPanelContext {
  /**
   * Stable ID used as the body element's `id` and the trigger's `aria-controls`.
   */
  readonly bodyId: string;

  /**
   * Whether the panel is currently expanded.
   */
  readonly isExpanded: Signal<boolean>;

  /**
   * Toggle expanded state. No-op when disabled.
   */
  toggle(): void;

  /**
   * Expand the panel. No-op when disabled.
   */
  open(): void;

  /**
   * Collapse the panel.
   */
  close(): void;
}

export const INTEROP_EXPANSION_PANEL_CONTEXT =
  new InjectionToken<InteropExpansionPanelContext>('INTEROP_EXPANSION_PANEL_CONTEXT');
