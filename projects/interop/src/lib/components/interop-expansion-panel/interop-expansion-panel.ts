import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import {
  INTEROP_EXPANSION_PANEL_CONTEXT,
  type InteropExpansionPanelContext,
} from './interop-expansion-panel.context.token';
import { INTEROP_ACCORDION_CONTEXT } from './interop-accordion.context.token';

let _panelIdCounter = 0;

/**
 * InteropExpansionPanel — Accessible, standalone collapsible panel.
 *
 * Works independently or inside `interop-accordion` for group coordination.
 * Connects a `button[interop-expansion-trigger]` child to a
 * `[interop-expansion-body]` child via shared ARIA IDs and a context token.
 *
 * ## Heading requirement
 * The APG accordion pattern requires the trigger button to live inside a
 * heading element so the panel title is part of the document outline.
 * Consumer is responsible for providing the heading wrapper:
 *
 * ```html
 * <h3><button interop-expansion-trigger>Title</button></h3>
 * ```
 *
 * A dev-mode warning fires on the trigger if no heading ancestor is found.
 *
 * ## Controlled vs uncontrolled
 * - **Uncontrolled (default):** state is managed internally. `(expandedChange)` fires on toggle.
 * - **Controlled:** bind `[(expanded)]="mySignal"` to drive state from the parent.
 *
 * ## Standalone example
 * ```html
 * <interop-expansion-panel>
 *   <h3><button interop-expansion-trigger>Details</button></h3>
 *   <div interop-expansion-body>
 *     <p>Panel content goes here.</p>
 *   </div>
 * </interop-expansion-panel>
 * ```
 *
 * ## Inside an accordion
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
 * // TODO: Revisit <details>/<summary> as an opt-in mode for progressive
 * // enhancement when heading nesting constraints can be worked around.
 */
@Component({
  selector: 'interop-expansion-panel',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: INTEROP_EXPANSION_PANEL_CONTEXT,
      useExisting: InteropExpansionPanel,
    },
  ],
  host: {
    '[attr.data-expanded]': 'isExpanded() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
  },
})
export class InteropExpansionPanel implements InteropExpansionPanelContext {
  private readonly accordion = inject(INTEROP_ACCORDION_CONTEXT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  private readonly _uid = `itx-expansion-${_panelIdCounter++}`;

  /** Stable body ID shared with the trigger (aria-controls) and body (id). */
  readonly bodyId = `${this._uid}-body`;

  // ── Inputs ──────────────────────────────────────────────────────────────────

  /**
   * Two-way bindable expanded state.
   * Uncontrolled by default — the panel manages its own state.
   * Use `[(expanded)]="myBoolSignal"` to control from the parent.
   */
  readonly expanded = model<boolean>(false);

  /**
   * Whether the panel is disabled. Prevents user interaction.
   */
  readonly disabled = input<boolean>(false);

  // ── Context API ──────────────────────────────────────────────────────────────

  readonly isExpanded = computed(() => this.expanded());

  toggle(): void {
    if (this.disabled()) return;
    const next = !this.expanded();
    this.expanded.set(next);
    if (next) {
      this.accordion?.notifyOpened(this._uid);
    }
  }

  open(): void {
    if (this.disabled() || this.expanded()) return;
    this.expanded.set(true);
    this.accordion?.notifyOpened(this._uid);
  }

  close(): void {
    if (!this.expanded()) return;
    this.expanded.set(false);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  constructor() {
    if (this.accordion) {
      const unregister = this.accordion.registerPanel(this._uid, this);
      this.destroyRef.onDestroy(unregister);
    }
  }
}
