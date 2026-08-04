import { DestroyRef, Directive, computed, inject } from "@angular/core";
import { INTEROP_TREE, INTEROP_TREE_ITEM } from "./interop-tree.context";

/**
 * InteropTreeGroup — the child list of an `li[interop-tree-item]`.
 *
 * Must be a direct child of the item it belongs to. Registering with the item
 * is what makes that item expandable, so a leaf is simply an item with no
 * group — no `isLeaf` flag to keep in sync with reality.
 *
 * ## Collapsed, but still findable
 *
 * A collapsed group is hidden with `hidden="until-found"` rather than plain
 * `hidden`. Supporting browsers keep the subtree searchable by find-in-page:
 * Ctrl+F a leaf nine levels down, and the browser reveals it and fires
 * `beforematch`, which this directive turns into a real expand so the
 * component's state matches what the user is looking at.
 *
 * Browsers without support treat any `hidden` value as hidden, so this
 * degrades to the plain behaviour with nothing to detect and no fallback to
 * write. Set `[findable]="false"` on the tree to opt out.
 *
 * ```html
 * <ul interop-tree-group>
 *   <li interop-tree-item>…</li>
 * </ul>
 * ```
 */
@Directive({
  selector: "ul[interop-tree-group], ol[interop-tree-group]",
  standalone: true,
  exportAs: "interopTreeGroup",
  host: {
    "[id]": "item.groupId",
    "[attr.role]": 'tree.isSelectTier() ? "group" : null',
    "[attr.hidden]": "hidden()",
    "(beforematch)": "onBeforeMatch()",
  },
})
export class InteropTreeGroup {
  readonly tree = inject(INTEROP_TREE);
  readonly item = inject(INTEROP_TREE_ITEM);

  private readonly destroyRef = inject(DestroyRef);

  protected readonly hidden = computed(() => {
    if (this.item.isExpanded()) return null;
    return this.tree.findable() ? "until-found" : "";
  });

  /**
   * The browser has revealed this subtree to show a find-in-page match.
   * Adopt that as real expansion rather than letting the DOM and the
   * component's state disagree.
   */
  onBeforeMatch(): void {
    this.item.open();
  }

  constructor() {
    this.destroyRef.onDestroy(this.item.registerGroup());
  }
}
