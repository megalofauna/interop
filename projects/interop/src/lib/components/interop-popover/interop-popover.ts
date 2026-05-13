import {
	AfterViewInit,
	Directive,
	ElementRef,
	HostListener,
	OnDestroy,
	Signal,
	computed,
	contentChildren,
	effect,
	inject,
	input,
	isDevMode,
	output,
	signal,
} from "@angular/core";
import {
	FloatingUiPositionStrategy,
} from "../interop-tooltip/floating-ui.strategy";
import {
	INTEROP_POSITION_STRATEGY,
	type Placement,
	type ResolvedPlacement,
} from "../interop-tooltip/position-strategy";
import {
	INTEROP_POPOVER_CONFIG,
	INTEROP_POPOVER_DEFAULTS,
	type PopoverClosedEvent,
	type PopoverPlacement,
	type PopoverType,
} from "./interop-popover.types";
import { InteropPopoverArrow } from "./interop-popover-arrow";

let nextId = 0;

type ToggleEventLike = Event & { newState?: string };

/**
 * InteropPopover — accessible, role-agnostic anchored panel.
 *
 * Wraps any element in the consumer's template. Adds the native HTML
 * `popover` attribute for top-layer promotion + light-dismiss + Escape
 * handling, then positions the panel against a trigger declared elsewhere
 * via {@link InteropPopoverTrigger}.
 *
 * The directive carries no opinion about WHAT goes inside — `role` is the
 * consumer's responsibility. Snap an `[interop-listbox]` in for a dropdown,
 * a form for a floating editor, prose for a hover-card, etc.
 *
 * ## Mechanics
 * - Native `[popover]` attribute (auto/manual/hint) → top layer, light-dismiss,
 *   Escape, no z-index management needed.
 * - Position via `INTEROP_POSITION_STRATEGY` (default: FloatingUI). Same
 *   strategy interface as `InteropTooltip`; swap to a CSS-anchor-positioning
 *   strategy when that ships in all browsers.
 * - Animation via `@starting-style` + `transition-behavior: allow-discrete`
 *   in the structural CSS — same pattern as `InteropDialog`.
 * - Focus capture/restore on open/close, with `preventScroll: true` to avoid
 *   the page-shift flash that plagues focus-restoration code elsewhere.
 *
 * @example Basic — bottom-anchored menu
 * ```html
 * <button [interop-popover-trigger]="menu" popoverHaspopup="menu">Open</button>
 * <div #menu="interopPopover" interop-popover>
 *   <ul interop-listbox>...</ul>
 * </div>
 * ```
 *
 * @example With opt-in arrow
 * ```html
 * <button [interop-popover-trigger]="info">Help</button>
 * <div #info="interopPopover" interop-popover [showArrow]="true">
 *   <p>Helpful context here.</p>
 * </div>
 * ```
 *
 * @example Custom arrow icon (auto-rotated per placement)
 * ```html
 * <button [interop-popover-trigger]="card">More</button>
 * <div #card="interopPopover" interop-popover>
 *   <span interop-popover-arrow>
 *     <interop-icon name="tabler-caret-up-filled" [size]="12" />
 *   </span>
 *   ...
 * </div>
 * ```
 */
@Directive({
	selector: "[interop-popover]",
	standalone: true,
	exportAs: "interopPopover",
	providers: [
		{
			provide: INTEROP_POSITION_STRATEGY,
			useFactory: () => new FloatingUiPositionStrategy(),
		},
	],
	host: {
		class: "interop-popover",
		"[id]": "popoverId",
		"[attr.popover]": "popoverType()",
		"[attr.data-placement]": "resolvedPlacement()",
		"[attr.data-arrow]": "showArrow() ? '' : null",
		"[attr.data-custom-arrow]": "_hasCustomArrow() ? '' : null",
		"[attr.data-open]": "isOpen() ? '' : null",
		"[attr.data-backdrop]": "showBackdrop() ? '' : null",
		"[style.position-anchor]": "anchorName",
	},
})
export class InteropPopover implements AfterViewInit, OnDestroy {
	private readonly el = inject(ElementRef<HTMLElement>);
	private readonly globalConfig = inject(INTEROP_POPOVER_CONFIG, {
		optional: true,
	});
	private readonly strategy = inject(INTEROP_POSITION_STRATEGY);

	// ── Inputs ────────────────────────────────────────────────────────────────

	/**
	 * Native popover mode. `auto` (default) gets light-dismiss; `manual` is
	 * programmatic-only; `hint` is Chrome 131+ tooltip-mode (graceful
	 * degradation on unsupported browsers).
	 */
	popoverType = input<PopoverType>("auto");

	/** Preferred placement of the panel relative to the trigger. */
	placement = input<PopoverPlacement | undefined>(undefined);

	/** Gap between trigger edge and panel, in pixels. */
	offset = input<number | undefined>(undefined);

	/**
	 * Render the built-in CSS-triangle arrow on the panel edge nearest the
	 * trigger. Suppressed automatically when an `[interop-popover-arrow]`
	 * marker child is present (consumer-supplied custom arrow wins).
	 */
	showArrow = input<boolean>(false);

	/**
	 * Render an opt-in backdrop behind the panel (consumes the global
	 * `--itx-backdrop-*` tokens). Default off — backdrops are rarely the
	 * right call for popovers since they defeat the "still-active context"
	 * value of an anchored panel.
	 */
	showBackdrop = input<boolean>(false);

	/**
	 * CSS selector for an element to focus when the panel opens. When null
	 * (default) focus stays on the trigger — correct for non-modal info
	 * panels. Set to `"first-focusable"` to focus the first focusable
	 * descendant — correct for menus and command palettes.
	 */
	autoFocus = input<string | "first-focusable" | null>(null);

	readonly _arrowChildren = contentChildren(InteropPopoverArrow);
	readonly _hasCustomArrow = computed(() => this._arrowChildren().length > 0);

	// ── Outputs ───────────────────────────────────────────────────────────────

	/** Fires when the panel becomes visible. */
	opened = output<void>();

	/** Fires when the panel hides, with the reason. */
	closed = output<PopoverClosedEvent>();

	// ── Public state ──────────────────────────────────────────────────────────

	/** Stable id; the trigger directive reads this to set `popovertarget`. */
	readonly popoverId = `interop-popover-${nextId++}`;

	/**
	 * Per-instance CSS anchor name. The trigger directive sets this on its
	 * own element via `style.anchor-name`; the popover directive sets
	 * `style.position-anchor` to the same value. Used by the future CSS
	 * anchor positioning strategy without needing a config change.
	 */
	readonly anchorName = `--${this.popoverId}-anchor`;

	/** True while the panel is in the open state (post-toggle event). */
	readonly isOpen = signal(false);

	/** Resolved placement after flip/shift; powers `[data-placement]`. */
	readonly resolvedPlacement = signal<ResolvedPlacement>("bottom");

	// ── Resolved config: input > global token > library defaults ──────────────

	private readonly effectivePlacement = computed<Placement>(
		() =>
			this.placement() ??
			this.globalConfig?.placement ??
			INTEROP_POPOVER_DEFAULTS.placement,
	);
	private readonly effectiveOffset = computed<number>(
		() =>
			this.offset() ??
			this.globalConfig?.offset ??
			INTEROP_POPOVER_DEFAULTS.offset,
	);

	// ── Internals ─────────────────────────────────────────────────────────────

	private triggerEl: HTMLElement | null = null;
	private previousFocus: HTMLElement | null = null;
	private stopAutoUpdate: (() => void) | null = null;
	/** The trigger currently wired into the position strategy. When multiple
	 * triggers are bound (e.g. responsive UIs that swap nav-trigger vs
	 * action-bar trigger by viewport width), this changes to whichever
	 * trigger fired the most recent toggle, and the strategy reconnects. */
	private connectedTrigger: HTMLElement | null = null;
	/**
	 * Tracks whether this popover initiated its own close (e.g. via the
	 * close() method). When true, the toggle event reports
	 * 'programmatic'. Otherwise, light-dismiss or trigger-click.
	 */
	private programmaticClose = false;

	constructor() {
		// Re-position when placement/offset inputs change while the popover is open.
		effect(() => {
			const placement = this.effectivePlacement();
			const offset = this.effectiveOffset();
			if (this.isOpen() && this.connectedTrigger) {
				queueMicrotask(() => this.runPosition(placement, offset));
			}
		});
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	ngAfterViewInit(): void {
		if (isDevMode()) {
			queueMicrotask(() => this.validateDevWarnings());
		}
	}

	ngOnDestroy(): void {
		this.stopAutoUpdate?.();
		this.stopAutoUpdate = null;
		if (this.connectedTrigger) {
			this.strategy.disconnect();
			this.connectedTrigger = null;
		}
	}

	// ── Public API ────────────────────────────────────────────────────────────

	/** Open the panel programmatically. Idempotent. */
	open(): void {
		if (this.isOpen()) return;
		this.el.nativeElement.showPopover?.();
	}

	/** Close the panel programmatically. Reason will be `'programmatic'`. */
	close(): void {
		if (!this.isOpen()) return;
		this.programmaticClose = true;
		this.el.nativeElement.hidePopover?.();
	}

	/** Toggle the panel. */
	toggle(): void {
		this.el.nativeElement.togglePopover?.();
	}

	/**
	 * Internal — called by {@link InteropPopoverTrigger} on init to register
	 * the trigger element. Used by the position strategy and as the focus
	 * return target.
	 */
	registerTrigger(trigger: HTMLElement | null): void {
		this.triggerEl = trigger;
	}

	// ── Native popover toggle event ───────────────────────────────────────────

	@HostListener("toggle", ["$event"])
	onToggle(event: ToggleEventLike): void {
		const newState = event.newState;
		if (newState === "open") {
			this.previousFocus =
				(document.activeElement as HTMLElement) ?? this.triggerEl;
			this.isOpen.set(true);
			this.handleOpen();
			this.opened.emit();
		} else {
			this.isOpen.set(false);
			this.handleClose();
			const reason = this.programmaticClose
				? "programmatic"
				: this.lastTriggerInteractionWasRecent()
					? "trigger"
					: "light-dismiss";
			this.programmaticClose = false;
			this.closed.emit({ reason });
		}
	}

	// ── Internal helpers ──────────────────────────────────────────────────────

	private async handleOpen(): Promise<void> {
		const trigger = this.resolveTriggerForOpen();
		if (!trigger) return;

		// Multi-trigger setups: if the trigger that opened us is different from
		// the one currently wired into the position strategy, reconnect.
		// Without this, the strategy's cached trigger reference can point at
		// a sibling trigger that's `display:none` (e.g. the responsive
		// nav-trigger when only the action-bar trigger is visible), which
		// resolves to a zero-size rect and parks the popover at (0,0).
		if (this.connectedTrigger !== trigger) {
			this.strategy.disconnect?.();
			this.strategy.connect(trigger, this.el.nativeElement);
			this.connectedTrigger = trigger;
		}

		await this.runPosition(this.effectivePlacement(), this.effectiveOffset());

		this.stopAutoUpdate?.();
		this.stopAutoUpdate = this.strategy.startAutoUpdate(async () => {
			await this.runPosition(
				this.effectivePlacement(),
				this.effectiveOffset(),
			);
		});

		queueMicrotask(() => this.applyAutoFocus());
	}

	/**
	 * Resolve which element should anchor the popover for this open.
	 *
	 * When a popover has a single `[interop-popover-trigger]` directive, the
	 * single registered `triggerEl` is correct. With multiple triggers (e.g.
	 * responsive UI: one trigger on narrow, another on wide; both bound to
	 * the same popover ref), the LAST-registered trigger wins by default —
	 * which can be the wrong, currently-hidden one.
	 *
	 * Prefer `document.activeElement` when it's an element targeting this
	 * popover via `popovertarget`. The browser's invoker semantics put focus
	 * on the clicked trigger before dispatching the toggle, so this resolves
	 * to whichever trigger the user actually clicked. Falls back to the
	 * registered `triggerEl` for programmatic opens (no focused invoker).
	 */
	private resolveTriggerForOpen(): HTMLElement | null {
		const doc = this.el.nativeElement.ownerDocument;
		const active = doc?.activeElement;
		if (
			active instanceof HTMLElement &&
			active.getAttribute("popovertarget") === this.popoverId
		) {
			return active;
		}
		return this.triggerEl;
	}

	private handleClose(): void {
		this.stopAutoUpdate?.();
		this.stopAutoUpdate = null;

		// Restore focus, with preventScroll: true so the page doesn't shift as
		// the panel exits (matches the dialog dismissal fix).
		const target = this.previousFocus;
		this.previousFocus = null;
		if (target instanceof HTMLElement) {
			target.focus({ preventScroll: true });
		}
	}

	private async runPosition(
		placement: Placement,
		offset: number,
	): Promise<void> {
		const resolved = await this.strategy.position({ placement, offset });
		this.resolvedPlacement.set(resolved);
	}

	private applyAutoFocus(): void {
		const mode = this.autoFocus();
		if (!mode) return;

		const root = this.el.nativeElement as HTMLElement;
		const selector = mode === "first-focusable" ? FOCUSABLE_SELECTORS : mode;
		const target = root.querySelector(selector) as HTMLElement | null;

		target?.focus({ preventScroll: true });
	}

	/**
	 * Heuristic: when the close was triggered by a click on the trigger
	 * (popovertarget toggle), `document.activeElement` is the trigger and
	 * the close happens within a few ms of the click. We track the last
	 * trigger pointer event time externally.
	 *
	 * For now, we treat all non-programmatic closes as 'light-dismiss' —
	 * differentiating trigger-click from outside-click reliably requires
	 * more invasive event tracking on the trigger directive. Consumers
	 * who care can listen on the trigger's `(click)` directly.
	 */
	private lastTriggerInteractionWasRecent(): boolean {
		return false;
	}

	private validateDevWarnings(): void {
		if (!this.triggerEl) {
			console.warn(
				`InteropPopover (${this.popoverId}): no [interop-popover-trigger] is targeting this popover at init. ` +
					"Trigger pairing is required for ARIA wiring (aria-expanded, aria-controls). " +
					"If you're toggling programmatically, call register-via-trigger or wire popovertarget manually.",
			);
		}
	}
}

/**
 * Selector matching elements that should be considered focusable when
 * `autoFocus="first-focusable"` is set.
 */
const FOCUSABLE_SELECTORS = [
	"a[href]",
	"button:not([disabled])",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	'[tabindex]:not([tabindex="-1"])',
	"[contenteditable]:not([contenteditable=false])",
].join(",");

export type { PopoverClosedEvent, PopoverCloseReason } from "./interop-popover.types";
