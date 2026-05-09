import { InjectionToken } from '@angular/core';
import { InteropExpansionPanelContext } from './interop-expansion-panel.context.token';

/**
 * Minimal context interface exposed by InteropAccordion to descendant panels
 * and trigger directives for group coordination and keyboard navigation.
 */
export interface InteropAccordionContext {
  /**
   * Register a panel with the accordion. Called by panels on init.
   * Returns a cleanup function that unregisters the panel.
   */
  registerPanel(panelId: string, context: InteropExpansionPanelContext): () => void;

  /**
   * Notify the accordion that a panel has been opened.
   * In exclusive mode the accordion closes all other panels.
   */
  notifyOpened(panelId: string): void;

  /**
   * Register a trigger button for arrow-key navigation.
   * Returns a cleanup function that unregisters the trigger.
   */
  registerTrigger(button: HTMLButtonElement): () => void;

  /**
   * Move focus to a trigger relative to the given button.
   * Triggers are sorted by DOM order regardless of registration order.
   */
  focusRelativeTrigger(
    from: HTMLButtonElement,
    direction: 'prev' | 'next' | 'first' | 'last',
  ): void;
}

export const INTEROP_ACCORDION_CONTEXT =
  new InjectionToken<InteropAccordionContext>('INTEROP_ACCORDION_CONTEXT');
