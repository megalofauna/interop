import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	OnDestroy,
	Signal,
	TemplateRef,
	ViewEncapsulation,
	computed,
	effect,
	inject,
	input,
	output,
	signal,
	untracked,
	viewChild,
} from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { InteropButton } from "../interop-button/interop-button";
import { InteropIcon } from "../interop-icon/interop-icon";
import {
	InteropListbox,
	type SelectControl,
	type SelectControlValue,
} from "../interop-listbox/interop-listbox";
import { InteropPopover } from "../interop-popover/interop-popover";
import { InteropPopoverTrigger } from "../interop-popover/interop-popover-trigger";
import { provideInteropIcons } from "../../iconsets/core";
import { TablerCheck } from "../../iconsets/tabler/outline/tabler-check";
import { TablerAlertCircle } from "../../iconsets/tabler/outline/tabler-alert-circle";
import { TablerMinus } from "../../iconsets/tabler/outline/tabler-minus";
import { TablerList } from "../../iconsets/tabler/outline/tabler-list";
import {
	INTEROP_STEPPER_TOKEN,
	type IInteropStepper,
	type StepIndicatorContext,
	type StepPanelRef,
	type StepStatus,
	type StepperNavContext,
} from "./interop-stepper.token";

export type StepperOrientation = "horizontal" | "vertical";

export type StepperMenuMode = "auto" | "always" | "never";

/** Responsive-actions preset — when set, the action bar stacks vertically
 * with full-width buttons once the stepper container drops below the
 * chosen breakpoint:
 *
 *   "sm" — stacks below 320px
 *   "md" — stacks below 480px
 *   "lg" — stacks below 640px
 *
 * Above the threshold the bar uses the standard horizontal layout. */
export type StepperResponsiveActions = false | "sm" | "md" | "lg";

/**
 * InteropStepper — accessible, composable multi-step wizard container.
 *
 * Provides the coordination context for `ol[interop-step-list]`,
 * `li[interop-step]`, and `section[interop-step-panel]` via an injection token.
 * Does not render navigation buttons — consumers provide these using a template
 * reference variable or by injecting INTEROP_STEPPER_TOKEN.
 *
 * ## Linear mode (default)
 * Future steps are locked until the user advances through them in order.
 * Completed steps remain navigable (the user can go back to review).
 *
 * ## Non-linear mode
 * All steps are freely navigable. Useful for settings wizards or forms where
 * completion order is not enforced.
 *
 * @example Linear wizard
 * ```html
 * <interop-stepper #stepper aria-label="Account setup">
 *   <ol interop-step-list>
 *     <li interop-step label="Profile"></li>
 *     <li interop-step label="Security"></li>
 *     <li interop-step label="Confirm"></li>
 *   </ol>
 *   <section interop-step-panel>
 *     <h2>Profile</h2>
 *     ...
 *   </section>
 *   <section interop-step-panel>
 *     <h2>Security</h2>
 *     ...
 *   </section>
 *   <section interop-step-panel>
 *     <h2>Confirm</h2>
 *     ...
 *   </section>
 * </interop-stepper>
 *
 * <div class="stepper-nav">
 *   <button type="button" [disabled]="!stepper.canGoBack()" (click)="stepper.back()">Back</button>
 *   <button type="button" [disabled]="!stepper.canGoForward()" (click)="stepper.next()">Next</button>
 * </div>
 * ```
 *
 * @example Non-linear (free navigation)
 * ```html
 * <interop-stepper [linear]="false" aria-label="Settings">
 *   ...
 * </interop-stepper>
 * ```
 *
 * @example Consumer-driven step status (e.g. form validation)
 * ```html
 * <li interop-step label="Details" [status]="detailsStatus()"></li>
 * ```
 */
@Component({
	selector: "interop-stepper",
	standalone: true,
	imports: [
		InteropButton,
		InteropIcon,
		InteropListbox,
		InteropPopover,
		InteropPopoverTrigger,
	],
	templateUrl: "./interop-stepper.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	providers: [
		{ provide: INTEROP_STEPPER_TOKEN, useExisting: InteropStepper },
		// Default indicator + menu-trigger icons. Registered at the component
		// scope so the stepper renders correctly out of the box without forcing
		// every consumer to know which icons it uses internally. Per-status
		// overrides via [icons] still take precedence; consumers can also
		// register replacements at any ancestor scope to swap iconsets.
		provideInteropIcons(
			TablerCheck,
			TablerAlertCircle,
			TablerMinus,
			TablerList,
		),
	],
	host: {
		"[attr.data-orientation]": "orientation()",
		"[attr.data-linear]": "linear() ? '' : null",
		"[attr.data-menu]": "menu()",
		"[attr.data-actions-responsive]": "responsiveActions() || null",
	},
})
export class InteropStepper
	implements IInteropStepper, AfterViewInit, OnDestroy
{
	private readonly document = inject(DOCUMENT);
	// ── Inputs ─────────────────────────────────────────────────────────────────

	/**
	 * Accessible label for the step indicator navigation landmark.
	 * Describes the purpose of the stepper to screen reader users.
	 */
	ariaLabel = input<string>("Progress", { alias: "aria-label" });

	/**
	 * When true (default), steps must be completed in order. Future steps are
	 * locked until the user advances to them. Completed steps remain accessible
	 * for review. When false, all steps are freely navigable.
	 */
	linear = input<boolean>(true);

	/**
	 * The currently active step index (0-based). Two-way bindable.
	 * Programmatic changes are routed through goTo() so focus management and
	 * status auto-calculation remain consistent.
	 */
	activeStep = input<number>(0);

	/**
	 * Layout orientation. Both orientations use the same DOM structure — CSS
	 * handles the rearrangement. Vertical orientation is styled separately.
	 */
	orientation = input<StepperOrientation>("horizontal");

	/**
	 * Default icon name overrides applied to all steps. Step-level [icons] merges
	 * on top of this, so individual steps can still diverge from the stepper default.
	 *
	 * @example
	 * ```html
	 * <interop-stepper [icons]="{ completed: 'star-fill', error: 'x-circle' }">
	 * ```
	 */
	icons = input<Partial<Record<StepStatus, string>>>({});

	/**
	 * Custom template to render inside every step's indicator circle.
	 * When provided, replaces the default icon / number content for all steps.
	 * The template receives a {@link StepIndicatorContext} as its implicit value.
	 *
	 * @example
	 * ```html
	 * <ng-template #myIndicator let-status let-i="index">
	 *   <app-badge [variant]="status">{{ i + 1 }}</app-badge>
	 * </ng-template>
	 * <interop-stepper [indicatorTemplate]="myIndicator">
	 * ```
	 */
	indicatorTemplate = input<TemplateRef<StepIndicatorContext> | null>(null);

	// ── Action bar inputs ──────────────────────────────────────────────────────

	/** Render the built-in action bar (menu | cancel ↔ back | next). */
	actions = input<boolean>(true);

	/** Opt-in responsive action bar. When set to a preset, the bar stacks
	 * vertically with full-width buttons below the chosen container width.
	 * See {@link StepperResponsiveActions} for the breakpoint values. */
	responsiveActions = input<StepperResponsiveActions>(false);

	/** Show a Cancel button on the left side of the action bar. */
	cancellable = input<boolean>(false);

	/** Label for the Cancel button. */
	cancelLabel = input<string>("Cancel");

	/** Label for the Back button. */
	backLabel = input<string>("Back");

	/** Label for the Next button (when not on the last step). */
	nextLabel = input<string>("Next");

	/** Label for the Next button when on the last step. Fires (finish). */
	finishLabel = input<string>("Finish");

	/**
	 * Menu trigger visibility:
	 * - "auto"   — shown on narrow viewports (container query, default 600px)
	 * - "always" — shown at all sizes
	 * - "never"  — hidden at all sizes
	 */
	menu = input<StepperMenuMode>("auto");

	/** Accessible label for the menu trigger button (and the menu itself). */
	menuLabel = input<string>("Steps");

	// ── Outputs ────────────────────────────────────────────────────────────────

	/** Emitted when the active step changes. Use with [(activeStep)] for two-way binding. */
	activeStepChange = output<number>();

	/**
	 * Emitted when the user attempts to navigate to a locked or out-of-bounds step.
	 * Use this to show validation errors when [linear]="true" and the user clicks
	 * a future step.
	 */
	stepAttempt = output<{ index: number; reason: "locked" | "bounds" }>();

	/** Fired when the action bar's Cancel button is activated. */
	cancel = output<void>();

	/** Fired when the action bar's Next button is activated on the last step. */
	finish = output<void>();

	// ── Public state (StepperNavContext) ────────────────────────────────────────

	readonly activeIndex = signal<number>(0);
	readonly totalSteps = signal<number>(0);

	readonly canGoBack = computed(() => this.activeIndex() > 0);
	readonly canGoForward = computed(
		() => this.activeIndex() < this.totalSteps() - 1,
	);

	// ── Internal registration state ────────────────────────────────────────────

	private _stepCount = 0;
	private _panelCount = 0;
	private _panels: StepPanelRef[] = [];
	private _stepLabels: Signal<string>[] = [];

	/**
	 * Monotonic completion frontier — the highest index the user has ever
	 * advanced past. Steps with index < frontier are auto-statused as
	 * "completed". Going backwards never decreases this value: completion is
	 * irreversible by navigation alone. The frontier is rolled back only by
	 * `reset()` (and a future `cancel(index)`).
	 */
	private readonly _frontier = signal<number>(0);

	// ── Viewport / scroll-snap state ───────────────────────────────────────────

	private readonly viewport = viewChild<ElementRef<HTMLDivElement>>("viewport");

	/** True while a programmatic scroll is in flight (Back/Next/menu/goTo).
	 * The scrollend handler ignores updates while this is set so a smooth
	 * animated scroll doesn't echo back through the gesture path. */
	private _isProgrammaticScroll = false;

	/** Belt-and-braces fallback in case `scrollend` doesn't fire (interrupted
	 * scroll, browser quirk, etc.). Cleared on every scroll attempt. */
	private _scrollSettleFallback?: ReturnType<typeof setTimeout>;

	// ── Menu / popover state ───────────────────────────────────────────────────

	/** Reference to the InteropPopover hosting the step menu. Populated when
	 * `menu() !== "never"`; used to programmatically dismiss the menu after
	 * a step is selected. Per-instance id + anchor name are managed by the
	 * popover directive itself. */
	private readonly menuPopover = viewChild<InteropPopover>("menuPopover");

	/** Listbox option list for the step menu. Recomputes when steps register
	 *  or when lock state changes (frontier/linear). */
	protected readonly menuOptions = computed<SelectControl[]>(() => {
		// Track the count so this re-runs as steps register.
		this.totalSteps();
		return this._stepLabels.map((labelSignal, i) => ({
			value: i,
			label: labelSignal(),
			disabled: this.isStepLocked(i),
		}));
	});

	/** True when the active step is the last one — Next becomes Finish. */
	protected readonly isOnLastStep = computed(
		() => this.totalSteps() > 0 && this.activeIndex() === this.totalSteps() - 1,
	);

	/** Label of the currently active step. Used by the compact nav-trigger
	 * shown on narrow viewports, where the full step list collapses into a
	 * single status/menu button. */
	protected readonly activeStepLabel = computed(
		() => this._stepLabels[this.activeIndex()]?.() ?? "",
	);

	// ── Constructor ────────────────────────────────────────────────────────────

	constructor() {
		// Route programmatic [activeStep] changes through goTo() so focus
		// management and status auto-calculation remain consistent.
		effect(
			() => {
				const requested = this.activeStep();
				untracked(() => {
					if (requested !== this.activeIndex()) {
						this.goTo(requested);
					}
				});
			},
			{ allowSignalWrites: true },
		);
	}

	// ── IInteropStepper ────────────────────────────────────────────────────────

	registerStep(label: Signal<string>): number {
		const index = this._stepCount++;
		this._stepLabels.push(label);
		this.totalSteps.set(this._stepCount);
		return index;
	}

	registerPanel(panel: StepPanelRef): number {
		const index = this._panelCount++;
		this._panels[index] = panel;
		return index;
	}

	/**
	 * Auto-status is derived from `activeIndex` and the completion
	 * `_frontier`. Exactly one step can be "active" at a time (the current
	 * one), and "completed" encompasses everything before the frontier.
	 * Consumer-provided [status] on InteropStep overrides this default.
	 */
	getAutoStatus(index: number): StepStatus {
		if (index === this.activeIndex()) return "active";
		if (index < this._frontier()) return "completed";
		return "pending";
	}

	isStepLocked(index: number): boolean {
		if (!this.linear()) return false;
		// Locked = ahead of the furthest the user has reached. The frontier
		// tracks "highest visited", which in linear mode is also the highest
		// completed step + 1 (the active step).
		return index > this._frontier();
	}

	wasReached(index: number): boolean {
		return index < this._frontier();
	}

	goTo(index: number): void {
		if (index < 0 || index >= this.totalSteps()) {
			this.stepAttempt.emit({ index, reason: "bounds" });
			return;
		}
		if (this.isStepLocked(index)) {
			this.stepAttempt.emit({ index, reason: "locked" });
			return;
		}
		this._navigate(index);
	}

	next(): void {
		const index = this.activeIndex() + 1;
		if (index >= this.totalSteps()) {
			this.stepAttempt.emit({ index, reason: "bounds" });
			return;
		}
		this._navigate(index);
	}

	back(): void {
		const index = this.activeIndex() - 1;
		if (index < 0) {
			this.stepAttempt.emit({ index, reason: "bounds" });
			return;
		}
		this._navigate(index);
	}

	reset(): void {
		this._frontier.set(0);
		if (this.activeIndex() !== 0) {
			this._navigate(0);
		} else {
			// Already at 0 — re-snap the viewport in case a swipe left it elsewhere.
			this._scrollToActivePanel();
		}
	}

	private _navigate(index: number): void {
		const prev = this.activeIndex();
		if (index === prev) return;

		// Advance the completion frontier when moving forward. Going backwards
		// never decreases it — completion is irreversible by navigation.
		if (index > this._frontier()) {
			this._frontier.set(index);
		}

		this.activeIndex.set(index);
		this.activeStepChange.emit(index);

		// Scroll the new panel into view. Focus is moved once the scroll
		// settles (see `_onScrollEnd`), so swiping doesn't yank focus around
		// mid-gesture and click navigation lands focus where the eye is.
		this._scrollToActivePanel();
	}

	// ── Scroll-snap viewport coordination ─────────────────────────────────────

	ngAfterViewInit(): void {
		const el = this.viewport()?.nativeElement;
		if (!el) return;
		el.addEventListener("scrollend", this._onScrollEnd);

		// Sync the initial scroll position with [activeStep], in case it was
		// initialised non-zero. The constructor's effect already ran goTo(),
		// but the panel elements weren't laid out yet — re-issue the scroll now.
		if (this.activeIndex() !== 0) {
			queueMicrotask(() => this._scrollToActivePanel());
		}
	}

	ngOnDestroy(): void {
		const el = this.viewport()?.nativeElement;
		el?.removeEventListener("scrollend", this._onScrollEnd);
		if (this._scrollSettleFallback) clearTimeout(this._scrollSettleFallback);
	}

	/** Drive `scrollIntoView` on the currently active panel. Used by
	 * `_navigate()` and `reset()`. Honours `prefers-reduced-motion`.
	 *
	 * Scheduled via requestAnimationFrame so Angular has a chance to flush
	 * the change-detection that updates panel `[hidden]` bindings before we
	 * try to scroll. Without this, the first forward navigation past the
	 * linear-mode frontier targets a still-hidden (display:none) panel with
	 * no layout box — `scrollIntoView` becomes a no-op and the viewport
	 * never moves. The bug is masked in horizontal mode because the
	 * `1fr`-height row visually absorbs the missed scroll, but in vertical
	 * mode (fixed block-size) the failure is obvious.
	 */
	private _scrollToActivePanel(): void {
		this._isProgrammaticScroll = true;
		if (this._scrollSettleFallback) clearTimeout(this._scrollSettleFallback);
		this._scrollSettleFallback = setTimeout(() => {
			// If `scrollend` never fires (interrupted scroll, browser without
			// scrollend support), focus the panel and clear the flag anyway so
			// gesture detection isn't permanently blocked.
			if (this._isProgrammaticScroll) {
				this._isProgrammaticScroll = false;
				this._panels[this.activeIndex()]?.requestFocus();
			}
		}, 1000);

		const reducedMotion = this.document?.defaultView?.matchMedia?.(
			"(prefers-reduced-motion: reduce)",
		).matches;
		const isVertical = this.orientation() === "vertical";

		requestAnimationFrame(() => {
			const viewportEl = this.viewport()?.nativeElement;
			const panel = this._panels[this.activeIndex()];
			const el = panel?.getElement();
			if (!viewportEl || !el) return;

			// Drive scrollTo on the viewport directly rather than scrollIntoView,
			// which would scroll EVERY scrollable ancestor (including the page)
			// until the panel is in view. We only want the viewport itself to
			// move; the page should never shift.
			const elRect = el.getBoundingClientRect();
			const vpRect = viewportEl.getBoundingClientRect();

			viewportEl.scrollTo({
				behavior: reducedMotion ? "instant" : "smooth",
				top: isVertical
					? viewportEl.scrollTop + (elRect.top - vpRect.top)
					: viewportEl.scrollTop,
				left: isVertical
					? viewportEl.scrollLeft
					: viewportEl.scrollLeft + (elRect.left - vpRect.left),
			});
		});
	}

	/** Scrollend handler — fires once when the viewport's scroll settles. */
	private readonly _onScrollEnd = (): void => {
		if (this._scrollSettleFallback) {
			clearTimeout(this._scrollSettleFallback);
			this._scrollSettleFallback = undefined;
		}

		if (this._isProgrammaticScroll) {
			// Programmatic scroll just finished — focus the destination panel and
			// release the flag.
			this._isProgrammaticScroll = false;
			this._panels[this.activeIndex()]?.requestFocus();
			return;
		}

		// Gesture-driven scroll settled. Compute which panel snapped into place
		// and update active state if it differs.
		const idx = this._currentPanelFromScroll();
		if (idx >= 0 && idx !== this.activeIndex()) {
			this._setActiveFromScroll(idx);
		}
	};

	/** Read the snapped panel index directly from scroll position. Assumes
	 * panels are 100% of the viewport on the snap axis (the structural CSS
	 * enforces this). */
	private _currentPanelFromScroll(): number {
		const el = this.viewport()?.nativeElement;
		if (!el) return -1;
		const isVertical = this.orientation() === "vertical";
		const pos = isVertical ? el.scrollTop : el.scrollLeft;
		const dim = isVertical ? el.clientHeight : el.clientWidth;
		if (dim === 0) return -1;
		return Math.round(pos / dim);
	}

	/** Update active state from a gesture-driven scroll. Mirrors `_navigate()`
	 * but skips the `_scrollToActivePanel()` call (the panel is already there). */
	private _setActiveFromScroll(index: number): void {
		if (index > this._frontier()) this._frontier.set(index);
		this.activeIndex.set(index);
		this.activeStepChange.emit(index);
		this._panels[index]?.requestFocus();
	}

	// ── Action bar handlers ────────────────────────────────────────────────────

	/** Next-or-finish: emits (finish) on the last step, otherwise advances. */
	protected onNextOrFinish(): void {
		if (this.isOnLastStep()) {
			this.finish.emit();
			return;
		}
		this.next();
	}

	/** Selection from the popover menu — go to the chosen step and dismiss. */
	protected onMenuSelect(
		value: SelectControlValue | SelectControlValue[] | null,
	): void {
		if (typeof value !== "number") return;
		this.goTo(value);
		this.menuPopover()?.close();
	}

	// ── StepperNavContext passthrough ──────────────────────────────────────────
	//
	// InteropStepper implements StepperNavContext directly, so a template
	// reference variable (#stepper) gives consumers the full nav context without
	// any additional wiring.
}

// Re-export the nav context interface so consumers can import it from the
// component's public API without knowing about the token file.
export type { StepperNavContext };
