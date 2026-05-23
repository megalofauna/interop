import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  contentChild,
  effect,
  inject,
  input,
  isDevMode,
  signal,
} from "@angular/core";
import { InteropTabLabel } from "./interop-tab-label.directive";
import { INTEROP_TABS_CONTEXT } from "./interop-tabs-context.token";

let _panelIdCounter = 0;

/**
 * InteropTabPanel — Individual tab panel for use inside `section[interop-tabs]`.
 *
 * Must be used on a `<section>` element. Each panel manages its own render
 * lifecycle: content is not initialized until the panel is first activated
 * (lazy first-render), then stays in the DOM permanently thereafter
 * (state-preserving). Visibility is controlled by the `hidden` attribute
 * on the host element — no destroy/recreate on tab switch.
 *
 * ## Render behavior
 * - **Before first visit:** content is not projected — zero DOM, zero cost.
 * - **On first activation:** content is rendered exactly once.
 * - **On switch away:** host gains `hidden` attribute. DOM intact, state preserved.
 * - **On return:** `hidden` removed. No re-render, content resumes from exact state.
 *
 * ## Escape hatches
 * - `destroyOnHide`: opt back into destroy-on-switch (for memory-sensitive cases).
 * - `preRender`: render immediately on init regardless of active state.
 *
 * ## Labels
 * - `label` input for plain text (common case).
 * - `<ng-template interop-tab-label>` for rich content (icons, badges).
 *   When both are present, the template takes precedence.
 *
 * @example Plain text label
 * ```html
 * <section interop-tab-panel label="Profile">
 *   <form>...</form>
 * </section>
 * ```
 *
 * @example Rich label with icon
 * ```html
 * <section interop-tab-panel>
 *   <ng-template interop-tab-label>
 *     <interop-icon name="user" /> Profile
 *   </ng-template>
 *   <form>...</form>
 * </section>
 * ```
 *
 * @example Opt out of state preservation (destroy on hide)
 * ```html
 * <section interop-tab-panel label="Heavy Map" [destroyOnHide]="true">
 *   <expensive-map-component />
 * </section>
 * ```
 *
 * @example Pre-render before first visit
 * ```html
 * <section interop-tab-panel label="Dashboard" [preRender]="true">
 *   <dashboard-with-eager-data />
 * </section>
 * ```
 */
@Component({
  selector: "section[interop-tab-panel]",
  standalone: true,
  imports: [],
  templateUrl: "./interop-tab-panel.html",
  styleUrl: "./interop-tab-panel.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: "tabpanel",
    "[id]": "panelId()",
    "[attr.aria-labelledby]": "tabId()",
    "[hidden]": "!isActive()",
    "[attr.tabindex]": "0",
  },
})
export class InteropTabPanel {
  private readonly tabs = inject(INTEROP_TABS_CONTEXT, { optional: true });

  /**
   * Unique key for this panel. Used to identify the active panel and to
   * generate stable ARIA IDs. Auto-generated if not provided.
   *
   * @example
   * ```html
   * <section interop-tab-panel key="profile" label="Profile">...</section>
   * ```
   */
  readonly key = input<string>(`panel-${_panelIdCounter++}`);

  /**
   * Plain-text label for the tab button. Ignored if `interop-tab-label` template
   * is also present in this panel's content.
   */
  readonly label = input<string | null>(null);

  /**
   * When true, the panel content is destroyed when the panel becomes inactive,
   * restoring the traditional destroy-on-switch behavior. Use for panels where
   * memory pressure outweighs the cost of re-initialization.
   *
   * Default: false (content is preserved after first render).
   */
  readonly destroyOnHide = input<boolean>(false);

  /**
   * When true, the panel content renders immediately on init regardless of
   * whether this panel is the active one. Use to pre-warm expensive panels.
   *
   * Default: false (content renders on first activation).
   */
  readonly preRender = input<boolean>(false);

  /**
   * Rich label template. When present, overrides the `label` string input.
   * Populated by `<ng-template interop-tab-label>` inside panel content.
   */
  readonly labelTemplate = contentChild(InteropTabLabel);

  /**
   * Whether this panel is currently the active panel.
   * Derived from the parent InteropTabs context.
   */
  readonly isActive = computed(
    () => this.tabs?.resolvedActive() === this.key(),
  );

  /**
   * ID of the corresponding tab button in the tablist.
   * Used as `aria-labelledby` on this panel.
   */
  readonly tabId = computed(
    () => `${this.tabs?.uid ?? "itx-tabs"}-tab-${this.key()}`,
  );

  /**
   * ID of this panel element.
   * Used as `aria-controls` on the corresponding tab button.
   */
  readonly panelId = computed(
    () => `${this.tabs?.uid ?? "itx-tabs"}-panel-${this.key()}`,
  );

  /**
   * One-way render latch. Starts false; set to true on first activation.
   * Once true, stays true (unless destroyOnHide is set).
   * Controls the @if gate in the template.
   */
  protected readonly rendered = signal(false);

  constructor() {
    if (isDevMode()) {
      afterNextRender(() => {
        const el = document.getElementById(this.panelId());
        if (el && el.tagName !== "SECTION") {
          console.warn(
            `InteropTabPanel must be used on <section> elements for semantic correctness. ` +
              `Found on: ${el.tagName.toLowerCase()}`,
          );
        }
      });
    }

    effect(() => {
      const active = this.isActive();
      const preRender = this.preRender();
      const destroy = this.destroyOnHide();

      if ((active || preRender) && !this.rendered()) {
        this.rendered.set(true);
      }

      if (!active && destroy) {
        this.rendered.set(false);
      }
    });
  }
}
