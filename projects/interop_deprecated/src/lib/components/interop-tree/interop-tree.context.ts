import { InjectionToken, Signal } from "@angular/core";

/**
 * Which of the two tree tiers an `[interop-tree]` host is operating as.
 *
 * `"navigate"` (the default) is a **disclosure structure**: nested `<ul>`/`<li>`
 * with real links and disclosure buttons, no tree roles, natural tab order.
 * This is what most "trees" actually are — nav sidebars, docs contents, browse
 * lists — and it works without any authored keyboard model.
 *
 * `"select"` is a **treeview widget**: `role="tree"`, one tab stop, roving
 * tabindex, typeahead, arrow-key expand/collapse, and a selection model. Opt
 * into it only when the user operates *on* the hierarchy (selects nodes, checks
 * them, reorders them) rather than navigating through it.
 *
 * The role is a behaviour contract. Signing it and then not honouring it is
 * worse than not signing it — which is why the tier is explicit rather than
 * assumed. See `.agent/explorations/tree-research.md` §1.
 */
export type InteropTreeTier = "navigate" | "select";

/**
 * Context a single `li[interop-tree-item]` exposes to its parent tree, its
 * toggle, its group, and any nested items beneath it.
 *
 * A token + interface (rather than the directive class) keeps the four
 * directives free of circular imports.
 */
export interface InteropTreeItemContext {
	/** Stable identity. Consumer-supplied via `[key]`, else auto-generated. */
	readonly key: string;

	/** ID of this item's child group — the toggle's `aria-controls` target. */
	readonly groupId: string;

	/** The `<li>` itself. Used for DOM-order sorting and focus. */
	readonly element: HTMLElement;

	/** Nearest ancestor item, or `null` at the root. */
	readonly parent: InteropTreeItemContext | null;

	/** 1-based depth. Emitted as `aria-level` and as `--itx-tree-level`. */
	readonly level: Signal<number>;

	readonly isExpanded: Signal<boolean>;
	readonly isExpandable: Signal<boolean>;
	readonly isDisabled: Signal<boolean>;

	/** Typeahead text: the `[label]` input, else the row's own text. */
	label(): string;

	open(): void;
	close(): void;
	toggle(): void;

	/** Called by `[interop-tree-group]` on init so the item knows it has children. */
	registerGroup(): () => void;
}

/**
 * Context the `[interop-tree]` host exposes to every descendant directive.
 */
export interface InteropTreeContext {
	readonly tier: Signal<InteropTreeTier>;

	/** True when `tier() === "select"`. Gates every tree-role behaviour. */
	readonly isSelectTier: Signal<boolean>;

	readonly multiselectable: Signal<boolean>;

	/** When true, collapsed groups stay findable by the browser's find-in-page. */
	readonly findable: Signal<boolean>;

	registerItem(context: InteropTreeItemContext): () => void;

	/** Called by an item whenever its expanded state settles, from any cause. */
	notifyExpanded(key: string, expanded: boolean): void;

	/** Roving tabindex: true for the one item that currently owns the tab stop. */
	isTabbable(context: InteropTreeItemContext): boolean;

	isSelected(key: string): boolean;

	/** Pointer/keyboard activation of a row in the select tier. */
	activate(context: InteropTreeItemContext, additive: boolean): void;
}

export const INTEROP_TREE = new InjectionToken<InteropTreeContext>(
	"INTEROP_TREE",
);

export const INTEROP_TREE_ITEM = new InjectionToken<InteropTreeItemContext>(
	"INTEROP_TREE_ITEM",
);
