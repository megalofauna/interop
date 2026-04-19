import {
  Directive,
  ElementRef,
  Renderer2,
  effect,
  inject,
  input,
} from "@angular/core";
import {
  InteropAttribute,
  SetAttrsConfig,
} from "../services/interop-attribute.service";

/**
 * ManageAttributesDirective
 *
 * A policy-aware, mutation-aware directive for applying HTML attributes to a host
 * element and its subtree via CSS selectors. Backed by InteropAttribute for
 * presets, composition, and performance hints.
 *
 * Design goals:
 * - Prefer native semantics: configs/presets should be used to rescue non-standard markup.
 * - Minimal and opt-in: authors provide configs or presets explicitly.
 * - Immediate children by default: use shallow selectors unless deep targeting is intended.
 * - Opt-out: honor selectors that avoid nodes with data-interop-managed="false".
 * - No override by default: do not clobber author attributes unless requested.
 */
@Directive({
  selector: "[manageAttrs]",
  standalone: true,
})
export class ManageAttributesDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly attrsManager = inject(InteropAttribute);

  /** Primary config input. */
  manageAttrs = input<SetAttrsConfig | null>(null);

  /** When true, existing author-set attributes may be replaced. */
  override = input<boolean>(false);

  /**
   * If provided, enforces subtree observation on the MutationObserver.
   * When null, the directive derives the optimal value from the config.
   */
  observeSubtree = input<boolean | null>(null);

  /** Debounce window (ms) for batching mutation-triggered reapplications. */
  debounceMs = input<number>(16);

  private mutationObserver?: MutationObserver;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect((onCleanup) => {
      const config = this.manageAttrs();
      const override = this.override();
      const observeSubtree = this.observeSubtree();

      // Apply attributes with current policy.
      this.attrsManager.applyConfig(this.renderer, this.el.nativeElement, config, { override });

      // Rebuild the mutation observer for the new config.
      this.mutationObserver?.disconnect();
      this.mutationObserver = undefined;

      if (config) {
        const derived = this.attrsManager.deriveObserverOptions(config);
        const subtree = typeof observeSubtree === "boolean" ? observeSubtree : derived.subtree;

        this.mutationObserver = new MutationObserver(() => this.scheduleReapply());
        this.mutationObserver.observe(this.el.nativeElement, { childList: true, subtree });
      }

      onCleanup(() => {
        this.mutationObserver?.disconnect();
        this.mutationObserver = undefined;
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = null;
        }
      });
    });
  }

  private scheduleReapply(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.attrsManager.applyConfig(
        this.renderer,
        this.el.nativeElement,
        this.manageAttrs(),
        { override: this.override() },
      );
      this.debounceTimer = null;
    }, Math.max(0, this.debounceMs() | 0));
  }
}
