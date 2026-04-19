import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  INTEROP_ACCORDION_CONTEXT,
  type InteropAccordionContext,
} from './interop-accordion.context.token';
import { type InteropExpansionPanelContext } from './interop-expansion-panel.context.token';

/**
 * InteropAccordion — Group coordinator for `interop-expansion-panel` children.
 *
 * Provides two features beyond standalone panels:
 *
 * 1. **Exclusive mode** (default): opening one panel automatically closes all others.
 *    Set `[exclusive]="false"` to allow multiple panels open simultaneously.
 *
 * 2. **Arrow-key navigation**: Up/Down arrows, Home, and End move focus between
 *    trigger buttons per the ARIA APG accordion pattern. Navigation is scoped to
 *    this accordion and does not bleed into nested accordions.
 *
 * ```html
 * <interop-accordion>
 *   <interop-expansion-panel>
 *     <h3><button interop-expansion-trigger>Section A</button></h3>
 *     <div interop-expansion-body>Content A</div>
 *   </interop-expansion-panel>
 *   <interop-expansion-panel>
 *     <h3><button interop-expansion-trigger>Section B</button></h3>
 *     <div interop-expansion-body>Content B</div>
 *   </interop-expansion-panel>
 * </interop-accordion>
 * ```
 *
 * @example Multi-expand (all panels can be open simultaneously)
 * ```html
 * <interop-accordion [exclusive]="false">
 *   ...panels...
 * </interop-accordion>
 * ```
 *
 * // TODO: Add declarative `panels` input for data-driven accordion usage
 * // (consumer passes an array of panel configs; accordion renders them).
 *
 * // TODO: Add support for custom trigger ng-template per panel in declarative mode.
 */
@Component({
  selector: 'interop-accordion',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: INTEROP_ACCORDION_CONTEXT,
      useExisting: InteropAccordion,
    },
  ],
})
export class InteropAccordion implements InteropAccordionContext {
  /**
   * When true (default), only one panel may be open at a time.
   * Opening a panel closes any previously open panel.
   * Set to false to allow multiple panels open simultaneously.
   */
  readonly exclusive = input<boolean>(true);

  private readonly _panels = new Map<string, InteropExpansionPanelContext>();
  private readonly _triggers: HTMLButtonElement[] = [];

  // ── InteropAccordionContext ──────────────────────────────────────────────────

  registerPanel(panelId: string, context: InteropExpansionPanelContext): () => void {
    this._panels.set(panelId, context);
    return () => this._panels.delete(panelId);
  }

  notifyOpened(panelId: string): void {
    if (!this.exclusive()) return;
    for (const [id, ctx] of this._panels) {
      if (id !== panelId) {
        ctx.close();
      }
    }
  }

  registerTrigger(button: HTMLButtonElement): () => void {
    this._triggers.push(button);
    return () => {
      const idx = this._triggers.indexOf(button);
      if (idx !== -1) this._triggers.splice(idx, 1);
    };
  }

  focusRelativeTrigger(
    from: HTMLButtonElement,
    direction: 'prev' | 'next' | 'first' | 'last',
  ): void {
    // Sort by DOM order so arrow navigation is correct regardless of
    // registration order (panels may register in non-sequential order).
    const sorted = [...this._triggers]
      .filter((t) => !t.disabled)
      .sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );

    if (!sorted.length) return;

    const currentIdx = sorted.indexOf(from);
    let targetIdx: number;

    switch (direction) {
      case 'next':
        targetIdx = (currentIdx + 1) % sorted.length;
        break;
      case 'prev':
        targetIdx = (currentIdx - 1 + sorted.length) % sorted.length;
        break;
      case 'first':
        targetIdx = 0;
        break;
      case 'last':
        targetIdx = sorted.length - 1;
        break;
    }

    sorted[targetIdx]?.focus();
  }
}
