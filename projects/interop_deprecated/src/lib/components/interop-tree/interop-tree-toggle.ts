import {
	Directive,
	ElementRef,
	afterNextRender,
	computed,
	inject,
	input,
	isDevMode,
	signal,
} from "@angular/core";
import { INTEROP_TREE, INTEROP_TREE_ITEM } from "./interop-tree.context";

/**
 * InteropTreeToggle — the twisty.
 *
 * What it *is* depends on the tier, because the correct answer genuinely
 * differs:
 *
 * - **On a `<button>`** it is a real disclosure button: `aria-expanded`,
 *   `aria-controls`, its own tab stop, and an accessible name taken from the
 *   row it belongs to (so AT announces "Guide, collapsed, button"). This is
 *   right for the navigate tier.
 *
 * - **On anything else** (`<span>`, `<i>`) it is a pointer affordance only:
 *   `aria-hidden`, not focusable, click still expands. This is right for the
 *   select tier, where the `treeitem` itself owns `aria-expanded` and keyboard
 *   users expand with Arrow keys. A second tab stop inside a composite widget
 *   is unreachable for screen-reader users.
 *
 * A `<button>` toggle inside a select-tier tree therefore dev-warns.
 *
 * ```html
 * <button interop-tree-toggle></button>   <!-- navigate tier -->
 * <span interop-tree-toggle></span>       <!-- select tier -->
 * ```
 *
 * Leave it empty and the structural CSS draws a chevron; project content to
 * replace it.
 */
@Directive({
	selector: "[interop-tree-toggle]",
	standalone: true,
	exportAs: "interopTreeToggle",
	host: {
		"[attr.type]": 'isButton ? "button" : null',
		"[attr.aria-expanded]": "ariaExpanded()",
		"[attr.aria-controls]": "ariaControls()",
		"[attr.aria-label]": "ariaLabel()",
		"[attr.aria-hidden]": 'isButton ? null : "true"',
		"[attr.disabled]": "isDisabled()",
		"[attr.data-leaf]": 'item.isExpandable() ? null : ""',
		"[attr.data-expanded]": 'item.isExpanded() ? "" : null',
		"(click)": "onClick($event)",
	},
})
export class InteropTreeToggle {
	private readonly tree = inject(INTEROP_TREE);
	readonly item = inject(INTEROP_TREE_ITEM);

	private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);

	/** Fixed for the element's lifetime — the host tag cannot change. */
	readonly isButton = this.elRef.nativeElement.tagName === "BUTTON";

	/**
	 * Accessible name for the button form. Defaults to the row's own text, so
	 * an icon-only twisty is never nameless.
	 */
	readonly label = input<string | undefined>(undefined);

	private readonly resolvedLabel = signal<string | null>(null);

	protected readonly ariaExpanded = computed(() =>
		this.isButton && this.item.isExpandable()
			? String(this.item.isExpanded())
			: null,
	);

	protected readonly ariaControls = computed(() =>
		this.isButton && this.item.isExpandable() ? this.item.groupId : null,
	);

	protected readonly ariaLabel = computed(() => {
		if (!this.isButton) return null;
		return this.label() ?? this.resolvedLabel();
	});

	/** A leaf has nothing to disclose, so its button is not a live tab stop. */
	protected readonly isDisabled = computed(() =>
		this.isButton && !this.item.isExpandable() ? "" : null,
	);

	onClick(event: Event): void {
		event.preventDefault();
		this.item.toggle();
	}

	constructor() {
		afterNextRender(() => {
			// Read the row text once, after render — a host binding would re-walk
			// the DOM on every change-detection pass.
			if (this.label() === undefined) {
				this.resolvedLabel.set(this.item.label() || null);
			}

			if (isDevMode() && this.isButton && this.tree.isSelectTier()) {
				console.warn(
					"interop-tree-toggle: a <button> twisty inside a select-tier tree " +
						"adds a tab stop that screen-reader users cannot reach — a " +
						"composite widget has exactly one. Use a non-interactive host " +
						"(<span interop-tree-toggle>); the treeitem already carries " +
						"aria-expanded and Arrow keys already expand.",
				);
			}
		});
	}
}
