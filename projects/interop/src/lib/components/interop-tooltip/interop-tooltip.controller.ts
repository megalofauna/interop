import type {
	InteropPositionStrategy,
	ResolvedPlacement,
} from "./position-strategy";
import type { InteropTooltipConfig } from "./interop-tooltip.config";

/**
 * Subset of InteropTooltipConfig that the controller reads on every show.
 * Caller supplies a function so input-driven config can be re-resolved.
 */
export type TooltipControllerConfig = Pick<
	InteropTooltipConfig,
	"placement" | "showDelay" | "offset" | "semantic"
>;

/**
 * Shared show/hide/listener state machine used by both <interop-tooltip>
 * (component, projection-slot ergonomics) and [interopTooltip] (directive,
 * attached directly to a focusable element). Same controller, two surfaces.
 *
 * Construction wires everything: ARIA on trigger, strategy.connect, all
 * listeners, document-level Escape handler. Call destroy() to tear it down.
 *
 * Lifecycle of an open/close cycle:
 *   pointerenter/focus → requestShow → setTimeout → showTooltip
 *     → strategy.position → panel.showPopover() → onVisibilityChange(true)
 *     → strategy.startAutoUpdate → document keydown for Escape
 *   pointerleave/blur/click → requestHide → setTimeout → hideTooltip
 *     → stopAutoUpdate → panel.hidePopover() → onVisibilityChange(false)
 */
export class InteropTooltipController {
	private readonly showReasons = new Set<"focus" | "hover">();
	private openTimer: ReturnType<typeof setTimeout> | null = null;
	private closeTimer: ReturnType<typeof setTimeout> | null = null;
	private stopAutoUpdate: (() => void) | null = null;
	private escapeListener: ((e: KeyboardEvent) => void) | null = null;
	private readonly cleanupListeners: Array<() => void> = [];
	private _isVisible = false;
	private readonly ariaAttr: "aria-describedby" | "aria-labelledby";

	constructor(
		private readonly trigger: HTMLElement,
		private readonly panel: HTMLElement,
		private readonly strategy: InteropPositionStrategy,
		private readonly readConfig: () => TooltipControllerConfig,
		private readonly onVisibilityChange: (visible: boolean) => void,
		private readonly onResolvedPlacement: (
			placement: ResolvedPlacement,
		) => void,
	) {
		const cfg = this.readConfig();
		this.ariaAttr =
			cfg.semantic === "label" ? "aria-labelledby" : "aria-describedby";

		// Wire ARIA. The tooltip is opacity:0 (not display:none) in the closed
		// state so NVDA/JAWS can resolve this reference at focus time, before
		// the tooltip is first shown.
		this.trigger.setAttribute(this.ariaAttr, this.panel.id);

		this.strategy.connect(this.trigger, this.panel);
		this.attachListeners();
	}

	get isVisible(): boolean {
		return this._isVisible;
	}

	destroy(): void {
		this.cleanupListeners.forEach((fn) => fn());
		this.cleanupListeners.length = 0;
		this.clearTimers();

		if (this.escapeListener) {
			document.removeEventListener("keydown", this.escapeListener);
			this.escapeListener = null;
		}

		if (this.trigger.getAttribute(this.ariaAttr) === this.panel.id) {
			this.trigger.removeAttribute(this.ariaAttr);
		}

		try {
			this.panel.hidePopover();
		} catch {
			// Swallow if popover was not open.
		}

		this.strategy.disconnect();
	}

	// ── Listeners ──────────────────────────────────────────────────────────

	private attachListeners(): void {
		const trigger = this.trigger;
		const panel = this.panel;

		const onHoverEnter = () =>
			this.requestShow("hover", this.readConfig().showDelay);
		const onHoverLeave = () => this.requestHide("hover", 150);
		// Only show on focus when the focus is keyboard-visible. After a
		// pointerdown-dismiss, the button still takes focus via the same
		// gesture — an unconditional focus-show would immediately re-open the
		// tooltip over the just-pressed control. :focus-visible is exactly
		// the browser's "keyboard / AT origin" heuristic, so deferring to it
		// keeps Tab-focus showing tooltips while suppressing click-focus.
		const onTriggerFocus = () => {
			if (this.trigger.matches(":focus-visible")) {
				this.requestShow("focus", 0);
			}
		};
		const onTriggerBlur = () => this.requestHide("focus", 0);

		// User has acted on the trigger — dismiss immediately regardless of
		// the show reason. A tooltip lingering over a just-pressed control is
		// noise; the action it described is in flight. Focus may remain on
		// the trigger (button activation doesn't blur), so we also clear the
		// focus reason so the tooltip doesn't immediately re-show.
		const onTriggerActivate = () => this.dismissOnActivate();

		// Keep tooltip open when mouse travels from trigger to panel
		// (WCAG 1.4.13 Hoverable).
		const onPanelHoverEnter = () => this.cancelClose();
		const onPanelHoverLeave = () => this.requestHide("hover", 0);

		trigger.addEventListener("mouseenter", onHoverEnter);
		trigger.addEventListener("mouseleave", onHoverLeave);
		trigger.addEventListener("pointerenter", onHoverEnter);
		trigger.addEventListener("pointerleave", onHoverLeave);
		trigger.addEventListener("focus", onTriggerFocus);
		trigger.addEventListener("blur", onTriggerBlur);
		trigger.addEventListener("pointerdown", onTriggerActivate);
		panel.addEventListener("mouseenter", onPanelHoverEnter);
		panel.addEventListener("mouseleave", onPanelHoverLeave);
		panel.addEventListener("pointerenter", onPanelHoverEnter);
		panel.addEventListener("pointerleave", onPanelHoverLeave);

		this.cleanupListeners.push(
			() => trigger.removeEventListener("mouseenter", onHoverEnter),
			() => trigger.removeEventListener("mouseleave", onHoverLeave),
			() => trigger.removeEventListener("pointerenter", onHoverEnter),
			() => trigger.removeEventListener("pointerleave", onHoverLeave),
			() => trigger.removeEventListener("focus", onTriggerFocus),
			() => trigger.removeEventListener("blur", onTriggerBlur),
			() => trigger.removeEventListener("pointerdown", onTriggerActivate),
			() => panel.removeEventListener("mouseenter", onPanelHoverEnter),
			() => panel.removeEventListener("mouseleave", onPanelHoverLeave),
			() => panel.removeEventListener("pointerenter", onPanelHoverEnter),
			() => panel.removeEventListener("pointerleave", onPanelHoverLeave),
		);
	}

	// ── Show / hide ────────────────────────────────────────────────────────

	private requestShow(reason: "focus" | "hover", delay: number): void {
		this.showReasons.add(reason);
		if (this._isVisible) {
			this.cancelClose();
			return;
		}
		this.clearTimers();
		this.openTimer = setTimeout(() => this.showTooltip(), delay);
	}

	private requestHide(reason: "focus" | "hover", delay: number): void {
		this.showReasons.delete(reason);
		if (this.showReasons.size > 0) return; // another reason still active
		this.clearTimers();
		this.closeTimer = setTimeout(() => this.hideTooltip(), delay);
	}

	private cancelClose(): void {
		if (this.closeTimer !== null) {
			clearTimeout(this.closeTimer);
			this.closeTimer = null;
		}
	}

	private clearTimers(): void {
		if (this.openTimer !== null) {
			clearTimeout(this.openTimer);
			this.openTimer = null;
		}
		if (this.closeTimer !== null) {
			clearTimeout(this.closeTimer);
			this.closeTimer = null;
		}
	}

	private dismissOnActivate(): void {
		// Drop both reasons. A sticky focus reason on a just-pressed button
		// would re-open the tooltip immediately, which is exactly the bug we
		// are fixing.
		this.showReasons.clear();
		this.clearTimers();
		if (this._isVisible) this.hideTooltip();
	}

	private async showTooltip(): Promise<void> {
		if (this._isVisible) return;

		const cfg = this.readConfig();
		// Position while still opacity:0 (measurable but invisible) to avoid
		// a visible flash at the wrong coordinates when showPopover() runs.
		const placement = await this.strategy.position({
			placement: cfg.placement,
			offset: cfg.offset,
		});
		this.onResolvedPlacement(placement);

		this.panel.showPopover();
		this._isVisible = true;
		this.onVisibilityChange(true);

		this.stopAutoUpdate = this.strategy.startAutoUpdate(async () => {
			const liveCfg = this.readConfig();
			const updated = await this.strategy.position({
				placement: liveCfg.placement,
				offset: liveCfg.offset,
			});
			this.onResolvedPlacement(updated);
		});

		// Document-level Escape handler (WCAG 1.4.13 Dismissible). Document-
		// level (not trigger-level) so hover-triggered tooltips can also be
		// dismissed when the user's keyboard focus is elsewhere.
		this.escapeListener = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				this.showReasons.clear();
				this.hideTooltip();
			}
		};
		document.addEventListener("keydown", this.escapeListener);
	}

	private hideTooltip(): void {
		if (!this._isVisible) return;

		this.stopAutoUpdate?.();
		this.stopAutoUpdate = null;

		try {
			this.panel.hidePopover();
		} catch {
			// Swallow if already hidden.
		}

		this._isVisible = false;
		this.onVisibilityChange(false);

		if (this.escapeListener) {
			document.removeEventListener("keydown", this.escapeListener);
			this.escapeListener = null;
		}
	}
}
