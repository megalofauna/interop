import {
  Directive,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  isDevMode,
  model,
  output,
  signal,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import {
  INTEROP_TREE,
  type InteropTreeContext,
  type InteropTreeItemContext,
  type InteropTreeTier,
} from "./interop-tree.context";

/** Typeahead buffer lifetime, per the APG's recommended reset interval. */
const TYPEAHEAD_RESET_MS = 500;

/**
 * InteropTree — the host of a collapsible hierarchy, in one of two tiers.
 *
 * ## The tier decision
 *
 * `role="tree"` is a behaviour contract: one tab stop for the whole widget,
 * roving tabindex, typeahead, arrow keys that expand and collapse, and a
 * selection model. Most things called a "tree" — nav sidebars, docs contents,
 * file lists you click to open — honour none of it. So Interop does not assume
 * it.
 *
 * ```html
 * <!-- Tier A (default): a disclosure structure. No tree roles, natural tab
 *      order, real links. This is what you usually want. -->
 * <ul interop-tree>…</ul>
 *
 * <!-- Tier B: a real treeview widget. Opt in when the user operates *on*
 *      the hierarchy rather than navigating through it. -->
 * <ul interop-tree="select" aria-label="Files">…</ul>
 * ```
 *
 * @example Navigation tree (Tier A)
 * ```html
 * <nav aria-label="Docs">
 *   <ul interop-tree>
 *     <li interop-tree-item>
 *       <span class="row">
 *         <button interop-tree-toggle></button>
 *         <a href="/guide">Guide</a>
 *       </span>
 *       <ul interop-tree-group>
 *         <li interop-tree-item><span class="row"><a href="/guide/start">Start</a></span></li>
 *       </ul>
 *     </li>
 *   </ul>
 * </nav>
 * ```
 *
 * @example Selection tree (Tier B)
 * ```html
 * <ul interop-tree="select" aria-label="Files" [(selected)]="picked">
 *   <li interop-tree-item key="src">
 *     <span class="row"><span interop-tree-toggle></span> src</span>
 *     <ul interop-tree-group>
 *       <li interop-tree-item key="main.ts"><span class="row">main.ts</span></li>
 *     </ul>
 *   </li>
 * </ul>
 * ```
 *
 * @example Reactive forms (select tier only)
 * ```html
 * <ul interop-tree="select" aria-label="Scopes" formControlName="scope">…</ul>
 * ```
 */
@Directive({
  selector: "ul[interop-tree], ol[interop-tree]",
  standalone: true,
  exportAs: "interopTree",
  providers: [
    { provide: INTEROP_TREE, useExisting: InteropTree },
    { provide: NG_VALUE_ACCESSOR, useExisting: InteropTree, multi: true },
  ],
  host: {
    // The tree owns every dimension of its rows, so it opts its whole subtree
    // out of prose. Without this, a globally-declared `interop-typography-root`
    // reads each <li> as running text and caps the row at --itx-measure,
    // adds rhythm margins between rows, and overrides the row's type.
    "interop-typography-isolate": "",
    "[attr.role]": 'isSelectTier() ? "tree" : null',
    "[attr.aria-multiselectable]":
      'isSelectTier() && multiselectable() ? "true" : null',
    "(focusin)": "onFocusIn($event)",
    "(keydown)": "onKeydown($event)",
  },
})
export class InteropTree implements InteropTreeContext, ControlValueAccessor {
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);

  // ── Inputs ────────────────────────────────────────────────────────────────

  /**
   * Tier, read from the identity attribute's value.
   * `interop-tree` → `"navigate"`, `interop-tree="select"` → `"select"`.
   */
  readonly tierInput = input<InteropTreeTier | "">("", {
    alias: "interop-tree",
  });

  /** Allows more than one node to be selected. Select tier only. */
  readonly multiselectable = input<boolean>(false);

  /**
   * Two-way selected keys. Always an array, including in single-select mode,
   * so consumers never branch on cardinality when reading it.
   */
  readonly selected = model<string[]>([]);

  /**
   * Keeps collapsed branches findable by the browser's find-in-page, via
   * `hidden="until-found"`. The browser reveals a match and the matched item
   * expands itself. Set false to fall back to plain `hidden`.
   */
  readonly findable = input<boolean>(true);

  // ── Outputs ───────────────────────────────────────────────────────────────

  /** Fires when an item expands or collapses, from any cause. */
  readonly expandedChange = output<{ key: string; expanded: boolean }>();

  /** Fires when a node is activated (Enter, or click) in the select tier. */
  readonly activated = output<string>();

  // ── Derived tier ──────────────────────────────────────────────────────────

  readonly tier = computed<InteropTreeTier>(() =>
    this.tierInput() === "select" ? "select" : "navigate",
  );

  readonly isSelectTier = computed(() => this.tier() === "select");

  // ── Registry ──────────────────────────────────────────────────────────────

  private readonly items = signal<InteropTreeItemContext[]>([]);
  private readonly focusedKey = signal<string | null>(null);

  private typeaheadBuffer = "";
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  private onChangeFn: (value: unknown) => void = () => {};
  private onTouchedFn: () => void = () => {};

  registerItem(context: InteropTreeItemContext): () => void {
    this.items.update((list) => [...list, context]);
    return () => {
      this.items.update((list) => list.filter((i) => i !== context));
      if (this.focusedKey() === context.key) this.focusedKey.set(null);
    };
  }

  /**
   * Every registered item in DOM order. Registration order tracks DOM order for
   * static content but not for `@if`/`@for` blocks that materialise late, so
   * position is resolved from the document rather than trusted.
   */
  private readonly orderedItems = computed(() =>
    [...this.items()].sort((a, b) =>
      a.element.compareDocumentPosition(b.element) &
      Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
    ),
  );

  /**
   * Items reachable by arrow keys: those whose every ancestor is expanded.
   * Disabled items stay in the list — APG keeps them focusable so they remain
   * discoverable; `activate()` is what refuses them.
   */
  private readonly visibleItems = computed(() =>
    this.orderedItems().filter((item) => {
      for (let p = item.parent; p; p = p.parent) {
        if (!p.isExpanded()) return false;
      }
      return true;
    }),
  );

  // ── Roving tabindex ───────────────────────────────────────────────────────

  isTabbable(context: InteropTreeItemContext): boolean {
    if (!this.isSelectTier()) return false;
    const focused = this.focusedKey();
    if (focused !== null) return focused === context.key;
    // Before first focus the whole widget must still be reachable by Tab, so
    // the first visible item holds the tab stop.
    return this.visibleItems()[0] === context;
  }

  isSelected(key: string): boolean {
    return this.selected().includes(key);
  }

  // ── Activation & selection ────────────────────────────────────────────────

  activate(context: InteropTreeItemContext, additive: boolean): void {
    if (!this.isSelectTier() || context.isDisabled()) return;

    if (this.multiselectable() && additive) {
      const next = this.isSelected(context.key)
        ? this.selected().filter((k) => k !== context.key)
        : [...this.selected(), context.key];
      this.commitSelection(next);
    } else {
      this.commitSelection([context.key]);
    }

    this.activated.emit(context.key);
    this.onTouchedFn();
  }

  private commitSelection(next: string[]): void {
    this.selected.set(next);
    this.onChangeFn(this.multiselectable() ? next : (next[0] ?? null));
  }

  /** Called by items whenever their expanded state settles. */
  notifyExpanded(key: string, expanded: boolean): void {
    this.expandedChange.emit({ key, expanded });
  }

  // ── Imperative API ────────────────────────────────────────────────────────

  /** Expands every expandable item. */
  expandAll(): void {
    for (const item of this.orderedItems()) item.open();
  }

  /** Collapses every item. Focus moves to the shallowest visible ancestor. */
  collapseAll(): void {
    for (const item of this.orderedItems()) item.close();
    const focused = this.findFocused();
    if (focused) {
      let target: InteropTreeItemContext = focused;
      while (target.parent) target = target.parent;
      this.focusItem(target);
    }
  }

  /**
   * Expands every ancestor of `key` so the item becomes visible, then focuses
   * it. This is the primitive that filtering, deep-linking, and
   * "reveal in tree" all reduce to.
   */
  reveal(key: string): void {
    const target = this.orderedItems().find((i) => i.key === key);
    if (!target) return;
    for (let p = target.parent; p; p = p.parent) p.open();
    this.focusItem(target);
  }

  // ── Focus ─────────────────────────────────────────────────────────────────

  onFocusIn(event: Event): void {
    if (!this.isSelectTier()) return;
    const el = event.target as HTMLElement | null;
    const li = el?.closest<HTMLElement>("[interop-tree-item]");
    if (!li) return;
    const context = this.items().find((i) => i.element === li);
    if (context) this.focusedKey.set(context.key);
  }

  private findFocused(): InteropTreeItemContext | null {
    const key = this.focusedKey();
    const visible = this.visibleItems();
    if (key === null) return visible[0] ?? null;
    return visible.find((i) => i.key === key) ?? visible[0] ?? null;
  }

  private focusItem(context: InteropTreeItemContext): void {
    this.focusedKey.set(context.key);
    context.element.focus();
    this.scrollIntoViewport(context.element);
  }

  /**
   * Scrolls only the nearest scrollable ancestor. `scrollIntoView()` walks
   * every scrollable ancestor including the document, which yanks the page
   * when a tree deep in a panel moves its focus.
   */
  private scrollIntoViewport(el: HTMLElement): void {
    let scroller: HTMLElement | null = el.parentElement;
    while (scroller) {
      const style = getComputedStyle(scroller);
      const scrolls = /auto|scroll|overlay/.test(
        style.overflowY + style.overflowX,
      );
      if (scrolls && scroller.scrollHeight > scroller.clientHeight) break;
      scroller = scroller.parentElement;
    }
    if (!scroller) return;

    const item = el.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    if (item.top < view.top) {
      scroller.scrollTo({ top: scroller.scrollTop - (view.top - item.top) });
    } else if (item.bottom > view.bottom) {
      scroller.scrollTo({
        top: scroller.scrollTop + (item.bottom - view.bottom),
      });
    }
  }

  // ── Keyboard (select tier only — Tier A uses the native tab order) ────────

  onKeydown(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;
    if (!this.isSelectTier()) return;

    const current = this.findFocused();
    if (!current) return;

    const visible = this.visibleItems();
    const index = visible.indexOf(current);
    const forward = this.isForwardKey(event.key);

    switch (event.key) {
      case "ArrowRight":
      case "ArrowLeft": {
        event.preventDefault();
        if (forward) {
          // Closed branch opens in place; open branch descends to its first child.
          if (current.isExpandable() && !current.isExpanded()) current.open();
          else if (current.isExpanded()) this.moveTo(visible[index + 1]);
        } else {
          if (current.isExpandable() && current.isExpanded()) current.close();
          else if (current.parent) this.focusItem(current.parent);
        }
        break;
      }
      case "ArrowDown":
        event.preventDefault();
        this.moveTo(visible[index + 1]);
        break;
      case "ArrowUp":
        event.preventDefault();
        this.moveTo(visible[index - 1]);
        break;
      case "Home":
        event.preventDefault();
        this.moveTo(visible[0]);
        break;
      case "End":
        event.preventDefault();
        this.moveTo(visible[visible.length - 1]);
        break;
      case "Enter":
        event.preventDefault();
        this.activate(current, false);
        break;
      case " ":
        event.preventDefault();
        this.activate(current, this.multiselectable());
        break;
      case "*":
        event.preventDefault();
        this.expandSiblings(current);
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          this.handleTypeahead(event.key);
        }
    }
  }

  /**
   * Which arrow means "into the hierarchy". RTL flips it, so this resolves
   * against the computed direction rather than hardcoding LeftArrow as "up".
   */
  private isForwardKey(key: string): boolean {
    const rtl = getComputedStyle(this.hostEl.nativeElement).direction === "rtl";
    return key === (rtl ? "ArrowLeft" : "ArrowRight");
  }

  private moveTo(context: InteropTreeItemContext | undefined): void {
    if (context) this.focusItem(context);
  }

  private expandSiblings(context: InteropTreeItemContext): void {
    const level = context.level();
    for (const item of this.visibleItems()) {
      if (item.level() === level && item.parent === context.parent) item.open();
    }
  }

  private handleTypeahead(char: string): void {
    if (this.typeaheadTimer !== null) clearTimeout(this.typeaheadTimer);
    this.typeaheadBuffer += char.toLowerCase();

    const visible = this.visibleItems();
    if (!visible.length) return;
    const focused = this.findFocused();
    const start = (focused ? visible.indexOf(focused) : -1) + 1;

    for (let i = 0; i < visible.length; i++) {
      const item = visible[(start + i) % visible.length];
      if (item.label().toLowerCase().startsWith(this.typeaheadBuffer)) {
        this.focusItem(item);
        break;
      }
    }

    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadBuffer = "";
    }, TYPEAHEAD_RESET_MS);
  }

  // ── ControlValueAccessor ──────────────────────────────────────────────────

  writeValue(value: string | string[] | null): void {
    this.selected.set(
      Array.isArray(value) ? value : value == null ? [] : [value],
    );
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  // ── devMode guards ────────────────────────────────────────────────────────

  constructor() {
    if (isDevMode()) {
      afterNextRender(() => {
        const el = this.hostEl.nativeElement;
        const tag = el.tagName.toLowerCase();

        if (tag !== "ul" && tag !== "ol") {
          console.warn(
            `interop-tree: expected a <ul> or <ol> host, got <${tag}>. ` +
              "List semantics are what give the tree free item counts and " +
              "forced-colors resilience.",
          );
        }

        if (
          this.isSelectTier() &&
          !el.getAttribute("aria-label") &&
          !el.getAttribute("aria-labelledby")
        ) {
          console.warn(
            'interop-tree: role="tree" requires an accessible name. Add ' +
              "aria-label or aria-labelledby to the host.",
          );
        }

        const seen = new Set<string>();
        for (const item of this.items()) {
          if (seen.has(item.key)) {
            console.warn(
              `interop-tree: duplicate item key "${item.key}". Keys must be ` +
                "unique — selection, reveal(), and focus restoration are keyed by them.",
            );
          }
          seen.add(item.key);
        }
      });
    }
  }
}
