import {
	AfterViewInit,
	Directive,
	ElementRef,
	OnDestroy,
	computed,
	inject,
	input,
	isDevMode,
} from "@angular/core";
import type { InteropPopover } from "./interop-popover";

/**
 * `aria-haspopup` attribute values. Maps directly to the WAI-ARIA spec.
 * Choose the value that describes the popover's content semantics:
 *
 * - `'menu'` — for command lists (`role="menu"` content)
 * - `'listbox'` — for selection lists (`role="listbox"` content)
 * - `'tree'` — for tree pickers
 * - `'grid'` / `'dialog'` — rare cases
 * - `true` — generic "this opens something"
 *
 * When unset, the trigger emits no `aria-haspopup`.
 */
export type PopoverHaspopup =
	| "menu"
	| "listbox"
	| "tree"
	| "grid"
	| "dialog"
	| boolean;

/**
 * InteropPopoverTrigger — the consumer-side wiring for {@link InteropPopover}.
 *
 * Place on the focusable element (typically a `<button>`) that should open
 * the popover. Auto-wires:
 * - `popovertarget` → popover's id (native browser opens/closes the panel)
 * - `popovertargetaction="toggle"`
 * - `aria-expanded` → reflects the popover's open state (signal-driven)
 * - `aria-controls` → popover's id
 * - `aria-haspopup` → from the [popoverHaspopup] input
 * - `style.anchor-name` → matches the popover's `position-anchor` (for
 *   future CSS-anchor-positioning strategies; harmless for FloatingUI)
 *
 * @example
 * ```html
 * <button [interop-popover-trigger]="menu" [popoverHaspopup]="'menu'">Open</button>
 * <div #menu="interopPopover" interop-popover>
 *   <ul interop-listbox>...</ul>
 * </div>
 * ```
 */
@Directive({
	selector: "[interop-popover-trigger]",
	standalone: true,
	host: {
		"[attr.popovertarget]": "popoverId()",
		"[attr.popovertargetaction]": "popoverId() ? 'toggle' : null",
		"[attr.aria-expanded]": "ariaExpanded()",
		"[attr.aria-controls]": "popoverId()",
		"[attr.aria-haspopup]": "ariaHaspopup()",
		"[style.anchor-name]": "anchorName()",
	},
})
export class InteropPopoverTrigger implements AfterViewInit, OnDestroy {
	private readonly el = inject(ElementRef<HTMLElement>);

	/**
	 * The popover this trigger controls. Bind via a template-ref:
	 *
	 * ```html
	 * <div #ref="interopPopover" interop-popover>...</div>
	 * <button [interop-popover-trigger]="ref">...</button>
	 * ```
	 */
	target = input<InteropPopover | null>(null, {
		alias: "interop-popover-trigger",
	});

	/** Value for `aria-haspopup`. Set per popover content semantics. */
	popoverHaspopup = input<PopoverHaspopup | null>(null);

	// ── Host-binding signals ──────────────────────────────────────────────────

	protected readonly popoverId = computed(() => this.target()?.popoverId ?? null);
	protected readonly anchorName = computed(
		() => this.target()?.anchorName ?? null,
	);
	protected readonly ariaExpanded = computed(() =>
		this.target() ? String(this.target()!.isOpen()) : null,
	);
	protected readonly ariaHaspopup = computed(() => {
		const v = this.popoverHaspopup();
		if (v == null) return null;
		return typeof v === "boolean" ? (v ? "true" : null) : v;
	});

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	ngAfterViewInit(): void {
		const target = this.target();
		if (target) {
			target.registerTrigger(this.el.nativeElement);
		} else if (isDevMode()) {
			console.warn(
				"InteropPopoverTrigger: no target popover bound. Pass an InteropPopover " +
					"reference via [interop-popover-trigger]=\"#ref=\\\"interopPopover\\\"\".",
			);
		}
	}

	ngOnDestroy(): void {
		this.target()?.registerTrigger(null);
	}
}
