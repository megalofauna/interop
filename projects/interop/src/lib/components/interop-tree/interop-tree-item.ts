import {
	DestroyRef,
	Directive,
	ElementRef,
	afterNextRender,
	computed,
	inject,
	input,
	isDevMode,
	model,
	signal,
} from "@angular/core";
import {
	INTEROP_TREE,
	INTEROP_TREE_ITEM,
	type InteropTreeItemContext,
} from "./interop-tree.context";

let _itemIdCounter = 0;

/**
 * InteropTreeItem — one node of an `[interop-tree]`.
 *
 * Always an `<li>`: list semantics are what give the tree correct item counts
 * computed by the browser, and what makes forced-colors mode recognise it
 * without any extra CSS.
 *
 * The directive derives its own depth from the ancestor chain, so nothing has
 * to be threaded down. That depth is emitted twice — once as `aria-level` for
 * assistive tech, and once as the `--itx-tree-level` custom property, which is
 * what the structural CSS indents by. The accessibility attribute and the
 * layout input are the same number.
 *
 * ## Expected shape
 *
 * A child `[interop-tree-group]` must be a **direct child** of the item. The
 * row content is everything else.
 *
 * ```html
 * <li interop-tree-item key="src">
 *   <span class="row">
 *     <button interop-tree-toggle></button>
 *     <a href="/src">src</a>
 *   </span>
 *   <ul interop-tree-group>…</ul>
 * </li>
 * ```
 */
@Directive({
	selector: "li[interop-tree-item]",
	standalone: true,
	exportAs: "interopTreeItem",
	providers: [{ provide: INTEROP_TREE_ITEM, useExisting: InteropTreeItem }],
	host: {
		"[attr.role]": 'tree.isSelectTier() ? "treeitem" : null',
		"[attr.aria-level]": "level()",
		"[attr.aria-expanded]": "ariaExpanded()",
		"[attr.aria-selected]": "ariaSelected()",
		"[attr.aria-disabled]": 'disabled() ? "true" : null',
		"[attr.tabindex]": "tabIndex()",
		"[style.--itx-tree-level]": "level()",
		"[attr.data-expanded]": 'isExpanded() ? "" : null',
		"[attr.data-leaf]": 'isExpandable() ? null : ""',
		"(click)": "onClick($event)",
	},
})
export class InteropTreeItem implements InteropTreeItemContext {
	readonly tree = inject(INTEROP_TREE);
	readonly parent = inject<InteropTreeItemContext | null>(INTEROP_TREE_ITEM, {
		optional: true,
		skipSelf: true,
	});

	private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
	private readonly destroyRef = inject(DestroyRef);

	readonly element = this.elRef.nativeElement;

	private readonly uid = `itx-tree-item-${_itemIdCounter++}`;

	/** `aria-controls` target on the toggle, `id` on the group. */
	readonly groupId = `${this.uid}-group`;

	// ── Inputs ────────────────────────────────────────────────────────────────

	/**
	 * Stable identity for selection, `reveal()`, and focus restoration.
	 * Auto-generated when absent, but a real key is what makes any of those
	 * survive a re-render.
	 */
	readonly keyInput = input<string | undefined>(undefined, { alias: "key" });

	/** Two-way expanded state. Uncontrolled by default. */
	readonly expanded = model<boolean>(false);

	readonly disabled = input<boolean>(false);

	/**
	 * Typeahead text. Defaults to the row's own text — the child group is
	 * excluded, or every branch would match on its whole subtree's contents.
	 */
	readonly labelInput = input<string | undefined>(undefined, {
		alias: "label",
	});

	/**
	 * Forces the item to advertise itself as expandable. Needed only when the
	 * child group renders lazily (`@if`), since the item otherwise infers
	 * expandability from a group being present — and a group inside a false
	 * `@if` is not present.
	 */
	readonly expandable = input<boolean | undefined>(undefined);

	// ── Derived state ─────────────────────────────────────────────────────────

	/**
	 * A getter, not a field: inputs are not bound yet when field initialisers
	 * run, so `keyInput()` would always read its `undefined` default there.
	 */
	get key(): string {
		return this.keyInput() ?? this.uid;
	}

	readonly level = computed(() => (this.parent ? this.parent.level() + 1 : 1));

	private readonly hasGroup = signal(false);

	readonly isExpandable = computed(() => this.expandable() ?? this.hasGroup());

	readonly isExpanded = computed(() => this.isExpandable() && this.expanded());

	readonly isDisabled = computed(() => this.disabled());

	protected readonly ariaExpanded = computed(() =>
		this.isExpandable() ? String(this.isExpanded()) : null,
	);

	/**
	 * `aria-selected` is only meaningful in the select tier. In the navigate
	 * tier the current node is marked by `aria-current` on the consumer's own
	 * link — the honest attribute for "this is the page you are on".
	 */
	protected readonly ariaSelected = computed(() =>
		this.tree.isSelectTier() ? String(this.tree.isSelected(this.key)) : null,
	);

	protected readonly tabIndex = computed(() =>
		this.tree.isSelectTier() ? (this.tree.isTabbable(this) ? 0 : -1) : null,
	);

	// ── Context API ───────────────────────────────────────────────────────────

	label(): string {
		const explicit = this.labelInput();
		if (explicit !== undefined) return explicit;

		let text = "";
		for (const node of Array.from(this.element.childNodes)) {
			if (node instanceof Element && node.hasAttribute("interop-tree-group")) {
				continue;
			}
			text += node.textContent ?? "";
		}
		return text.trim();
	}

	open(): void {
		if (this.disabled() || !this.isExpandable() || this.expanded()) return;
		this.expanded.set(true);
		this.tree.notifyExpanded(this.key, true);
	}

	close(): void {
		if (!this.expanded()) return;
		this.expanded.set(false);
		this.tree.notifyExpanded(this.key, false);
	}

	toggle(): void {
		if (this.isExpanded()) this.close();
		else this.open();
	}

	registerGroup(): () => void {
		this.hasGroup.set(true);
		return () => this.hasGroup.set(false);
	}

	// ── Interaction ───────────────────────────────────────────────────────────

	onClick(event: Event): void {
		if (!this.tree.isSelectTier()) return;

		const target = event.target as HTMLElement | null;
		// The twisty expands; it does not also select.
		if (target?.closest("[interop-tree-toggle]")) return;
		// Only the nearest item handles the click, or every ancestor would
		// select on the way up.
		if (target?.closest("[interop-tree-item]") !== this.element) return;

		// Cmd on macOS, Ctrl elsewhere — additive selection uses whichever the
		// platform's users reach for.
		const additive =
			event instanceof MouseEvent && (event.ctrlKey || event.metaKey);
		this.tree.activate(this, additive);
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	constructor() {
		this.destroyRef.onDestroy(this.tree.registerItem(this));

		if (isDevMode()) {
			afterNextRender(() => {
				if (!this.tree.isSelectTier()) return;

				const interactive = Array.from(
					this.element.querySelectorAll<HTMLElement>(
						"a[href], button, input, select, textarea",
					),
				).find(
					(el) =>
						el.closest("[interop-tree-item]") === this.element &&
						!el.closest("[interop-tree-toggle]"),
				);

				if (interactive) {
					console.warn(
						"interop-tree-item: interactive content inside a treeitem is not " +
							"reachable by screen-reader users — a composite widget has one " +
							`tab stop. Found <${interactive.tagName.toLowerCase()}>. Drop the ` +
							'"select" value to use the navigate tier if rows contain links ' +
							"or form controls.",
					);
				}
			});
		}
	}
}
