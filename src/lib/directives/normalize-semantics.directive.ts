import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  inject,
} from "@angular/core";

/**
 * NormalizeSemanticsDirective
 *
 * Automatically, and conservatively, normalizes passive list semantics on non-standard markup.
 * Designed to be auto-attached via hostDirectives on Interop components (e.g., `interop-list`)
 * to provide "magical by default" behavior, while remaining opt-out and non-invasive.
 *
 * Policy:
 * - Native-first: never add roles to native UL/OL/DL or LI; rely on native semantics.
 * - Minimal semantics: on non-semantic hosts, set role="list"; on non-`li` immediate children, set role="listitem".
 * - Nested lists: when an explicit marker `data-nested-list` is present, treat it as a list root and normalize its immediate children.
 * - Opt-out:
 *   - Host: `data-interop-normalize="false"` disables normalization entirely.
 *   - Child: `data-interop-managed="false"` skips normalization for that node.
 * - Idempotence: do not override author-supplied attributes by default.
 *
 * Performance:
 * - Observes only `childList` on the host (no subtree) by default.
 * - Debounced re-application to batch DOM changes.
 */
@Directive({
  selector: "[normalizeSemantics]",
  standalone: true,
})
export class NormalizeSemanticsDirective implements OnInit, OnDestroy {
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef)
    .nativeElement;
  private readonly renderer = inject(Renderer2);

  /**
   * When true, author-supplied attributes may be replaced.
   * Default: false — conservative, non-invasive normalization.
   */
  @Input() override: boolean = false;

  /**
   * Control nested normalization behavior.
   * When true (default), explicit markers `data-nested-list` are normalized as list roots.
   */
  @Input() normalizeNested: boolean = true;

  /**
   * Debounce interval (ms) to batch DOM mutations.
   */
  @Input() debounceMs: number = 16;

  /**
   * Mutation observer and debounce timer
   */
  private mutationObserver?: MutationObserver;
  private debounceTimer: any = null;

  ngOnInit(): void {
    // Respect host opt-out
    if (this.isHostOptedOut()) return;

    // Initial normalization pass
    this.normalizeHostAndChildren();

    // Observe dynamic child changes (only direct children)
    this.setupObserver();
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Normalize semantics on the host and its immediate children.
   * Also apply nested normalization for explicit markers if enabled.
   */
  private normalizeHostAndChildren(): void {
    // Host-level normalization: native lists keep native semantics
    if (!this.isNativeList(this.hostEl)) {
      this.setAttrIfNeeded(this.hostEl, "role", "list");
    }

    // Immediate children normalization
    const children = Array.from(this.hostEl.children);
    for (const child of children) {
      if (this.isChildOptedOut(child)) continue;

      // Native list items (LI) keep native semantics
      if (!this.isNativeListItem(child)) {
        this.setAttrIfNeeded(child, "role", "listitem");
      }

      // Nested list normalization via explicit marker
      if (this.normalizeNested && this.isNestedListMarker(child)) {
        this.normalizeNestedList(child);
      }
    }
  }

  /**
   * Normalize an explicitly marked nested list root and its immediate children.
   */
  private normalizeNestedList(root: Element): void {
    // If the nested root itself is native UL/OL/DL, skip role
    if (!this.isNativeList(root)) {
      this.setAttrIfNeeded(root, "role", "list");
    }

    const children = Array.from(root.children);
    for (const child of children) {
      if (this.isChildOptedOut(child)) continue;
      if (!this.isNativeListItem(child)) {
        this.setAttrIfNeeded(child, "role", "listitem");
      }
    }
  }

  /**
   * Setup mutation observer for dynamic additions/removals of immediate children.
   */
  private setupObserver(): void {
    this.mutationObserver = new MutationObserver((records) => {
      // Only relevant records: added/removed children of host
      const relevant = records.some((r) => r.type === "childList");
      if (!relevant) return;
      this.scheduleReapply();
    });

    this.mutationObserver.observe(this.hostEl, {
      childList: true,
      subtree: false, // Observe only direct children for performance
    });
  }

  /**
   * Debounce re-apply to batch mutations.
   */
  private scheduleReapply(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.debounceTimer = setTimeout(() => {
      // Respect host opt-out dynamically as well
      if (this.isHostOptedOut()) return;
      this.normalizeHostAndChildren();
    }, Math.max(0, this.debounceMs | 0));
  }

  /**
   * Set an attribute only if needed (idempotent), or override when requested.
   */
  private setAttrIfNeeded(
    el: Element,
    name: string,
    value: string | number | boolean,
  ): void {
    const has = el.hasAttribute(name);
    if (!has || this.override) {
      this.renderer.setAttribute(el, name, String(value));
    }
  }

  /**
   * Host-level opt-out check.
   */
  private isHostOptedOut(): boolean {
    return (
      this.hostEl.getAttribute("data-interop-normalize") === "false" ||
      this.hostEl.getAttribute("data-interop-managed") === "false"
    );
  }

  /**
   * Child-level opt-out check.
   */
  private isChildOptedOut(el: Element): boolean {
    return el.getAttribute("data-interop-managed") === "false";
  }

  /**
   * Detect native list containers.
   */
  private isNativeList(el: Element): boolean {
    const tag = el.tagName.toUpperCase();
    return tag === "UL" || tag === "OL" || tag === "DL";
  }

  /**
   * Detect native list items.
   */
  private isNativeListItem(el: Element): boolean {
    return el.tagName.toUpperCase() === "LI";
  }

  /**
   * Detect explicit nested list markers.
   */
  private isNestedListMarker(el: Element): boolean {
    return el.hasAttribute("data-nested-list");
  }
}
