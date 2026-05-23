import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Injector,
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
import { DOCUMENT, NgTemplateOutlet } from "@angular/common";
import { InteropButton } from "../interop-button/interop-button";
import { InteropIcon } from "../interop-icon/interop-icon";
import {
	InteropListbox,
	type SelectControl,
	type SelectControlValue,
} from "../interop-listbox/interop-listbox";
import { InteropPopover } from "../interop-popover/interop-popover";
import { InteropPopoverTrigger } from "../interop-popover/interop-popover-trigger";
import { InteropScrollArea } from "../interop-scroll-area/interop-scroll-area";
import { provideInteropIcons } from "../../iconsets/core";
import { TablerCheck } from "../../iconsets/tabler/outline/tabler-check";
import { TablerArrowNarrowRight } from "../../iconsets/tabler/outline/tabler-arrow-narrow-right";
import { TablerArrowNarrowLeft } from "../../iconsets/tabler/outline/tabler-arrow-narrow-left";
import { TablerAlertCircle } from "../../iconsets/tabler/outline/tabler-alert-circle";
import { TablerMinus } from "../../iconsets/tabler/outline/tabler-minus";
import { TablerCircle } from "../../iconsets/tabler/outline/tabler-circle";
import { TablerList } from "../../iconsets/tabler/outline/tabler-list";
import { TablerChevronDown } from "../../iconsets/tabler/outline/tabler-chevron-down";
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
		NgTemplateOutlet,
		InteropButton,
		InteropIcon,
		InteropListbox,
		InteropPopover,
		InteropPopoverTrigger,
		InteropScrollArea,
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
			TablerArrowNarrowRight,
			TablerArrowNarrowLeft,
			TablerCircle,
			TablerChevronDown,
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
	readonly injector = inject(Injector);
	// ── Inputs ─────────────────────────────────────────────────────────────────

	/**
	 * Accessible label for the step indicator navigation landmark. Describes
	 * the purpose of the stepper to screen reader users.
	 *
	 * **Composition note:** when multiple `<interop-stepper>` instances appear
	 * in the same view, set a unique label on each — otherwise AT users hear
	 * two indistinguishable "Progress" navigation landmarks. The default is
	 * intentionally generic; per-page uniqueness is the consumer's call.
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
	 * **Scope note:** the template replaces *only* the indicator graphic. The
	 * step's visible label (and the visually-hidden status suffix that drives
	 * the step's accessible name) continue to render alongside. Templates
	 * should treat the indicator as decorative — the indicator graphic itself
	 * is `aria-hidden`; the accessible name comes from the label + status.
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

	/**
	 * Template rendered inside the popover menu when orientation="vertical".
	 * Provide an `ng-template` containing `ol[interop-step-list]` so the popover
	 * shows the full rich step list instead of a separate listbox.
	 *
	 * @example
	 * ```html
	 * <ng-template #steps>
	 *   <ol interop-step-list>
	 *     <li interop-step label="Account"></li>
	 *   </ol>
	 * </ng-template>
	 * <interop-stepper orientation="vertical" [stepListTemplate]="steps">
	 * ```
	 */
	stepListTemplate = input<TemplateRef<unknown> | null>(null);

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
	 * Popover-menu visibility (horizontal orientation only — vertical mode
	 * always uses the popover because the step list lives inside it).
	 *
	 * - `"auto"`   — no popover trigger. The step list renders in-flow and
	 *   becomes horizontally scrollable on narrow viewports via the
	 *   InteropScrollArea wrapper (lighter bundle, no positioning logic).
	 *   This is the default and the recommended mobile pattern.
	 * - `"always"` — popover trigger present at every viewport size. On
	 *   narrow viewports the trigger replaces the inline step list (compact
	 *   "Step N of M" pill with the icon + label). On wide viewports the
	 *   step list stays in-flow and a separate menu button appears in the
	 *   action bar. Use when the flow has many steps or when consumers
	 *   prefer the popover affordance over the scroll affordance.
	 * - `"never"`  — no popover trigger ever; the scroll-area handles
	 *   horizontal overflow on narrow viewports. Behavioural equivalent of
	 *   `"auto"` today; the distinction is forward-compatibility (if a
	 *   future heuristic causes `"auto"` to surface the popover for some
	 *   workloads, `"never"` keeps the explicit opt-out).
	 */
	menu = input<StepperMenuMode>("auto");

	/** Accessible label for the menu trigger button (and the menu itself). */
	menuLabel = input<string>("Steps");

	/**
	 * Step statuses that block forward navigation past them. Forward navigation
	 * (`next()`, or `goTo(target)` with `target > activeIndex`) checks every
	 * step from the current index up to (but not including) the target — if
	 * any has an effective status listed here, the navigation is rejected and
	 * `stepAttempt` fires with `reason: "blocked"`.
	 *
	 * Defaults to an empty array — only `linear`-mode locking blocks. Set
	 * `[blockOn]="['error']"` to prevent the user from advancing past a step
	 * the consumer has flagged invalid via `[status]="'error'"`. Pass
	 * `["error", "skipped"]` to block both, etc.
	 *
	 * Backward navigation is never blocked. The active step itself is
	 * included in the check, so `next()` is blocked while the active step
	 * has a blocking status.
	 */
	blockOn = input<readonly StepStatus[]>([]);

	// ── Outputs ────────────────────────────────────────────────────────────────

	/** Emitted when the active step changes. Use with [(activeStep)] for two-way binding. */
	activeStepChange = output<number>();

	/**
	 * Emitted when the user attempts a navigation the stepper rejects.
	 *
	 * - `"bounds"`  — target index is `< 0` or `>= totalSteps`
	 * - `"locked"`  — target is past the linear-mode completion frontier
	 * - `"blocked"` — a step on the forward path has a status listed in
	 *   `[blockOn]` (e.g. an `"error"` step ahead). `index` is the blocking
	 *   step's index, not the requested target.
	 */
	stepAttempt = output<{
		index: number;
		reason: "locked" | "bounds" | "blocked";
	}>();

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
	private _registeredStepCount = 0;
	private _panelCount = 0;
	private _registeredPanelCount = 0;
	private _panels: StepPanelRef[] = [];
	private _stepLabels: Signal<string>[] = [];
	private _stepStatusOverrides: (Signal<StepStatus | null> | undefined)[] = [];

	/**
	 * Per-instance unique id. Used to build stable panel ids
	 * (`{uid}-panel-{index}`) so the step buttons can wire `aria-controls`
	 * at the corresponding panel. Counter-based — predictable in tests and
	 * cheap. Module-private; never exposed to consumers.
	 */
	private readonly uid = `itx-stepper-${++InteropStepper._uidSequence}`;
	private static _uidSequence = 0;

	/**
	 * Monotonic completion frontier — the highest index the user has ever
	 * advanced past. Steps with index < frontier are auto-statused as
	 * "completed". Going backwards never decreases this value: completion is
	 * irreversible by navigation alone. The frontier is rolled back only by
	 * `reset()` (and a future `cancel(index)`).
	 */
	private readonly _frontier = signal<number>(0);

	/**
	 * Set to true when `(finish)` is emitted; cleared on any subsequent
	 * navigation or on `reset()`. The frontier model alone can't represent
	 * "last step completed" — the frontier equals the active index on the
	 * last step, so the active step would otherwise stay "active" indefinitely
	 * after finish. This flag tips the active step's auto-status to
	 * "completed" while it's set, and the step indicator drops its `--active`
	 * class so the completed colourway shows.
	 */
	private readonly _finished = signal<boolean>(false);
	readonly isFinished = this._finished.asReadonly();

	// ── Viewport / scroll-snap state ───────────────────────────────────────────

	private readonly viewport = viewChild<ElementRef<HTMLDivElement>>("viewport");

	/** The InteropScrollArea wrapping the horizontal step list. Used to scroll
	 * the active step indicator into view when navigation makes it off-screen
	 * on narrow viewports. Hidden by CSS in vertical orientation, so both
	 * fields resolve to non-null even in vertical mode — the
	 * `_scrollActiveStepIntoView` method bails when the host is not laid out
	 * (`offsetParent === null`). */
	private readonly listScroll = viewChild(InteropScrollArea);
	private readonly listScrollEl = viewChild(InteropScrollArea, {
		read: ElementRef,
	});

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

	/** True when the active step is the last one. Used internally; doesn't
	 * imply that the Next button should switch to Finish — see `canFinish`. */
	protected readonly isOnLastStep = computed(
		() => this.totalSteps() > 0 && this.activeIndex() === this.totalSteps() - 1,
	);

	/**
	 * True only when the action bar's Next button should switch to Finish AND
	 * the click should emit `(finish)`. Gated on `linear` because non-linear
	 * steppers have no canonical "last" step — there's no completion semantics
	 * to assert. Consumers wiring non-linear flows are expected to provide
	 * their own completion control outside the built-in action bar.
	 */
	protected readonly canFinish = computed(
		() =>
			this.linear() &&
			this.totalSteps() > 0 &&
			this.activeIndex() === this.totalSteps() - 1,
	);

	/** Label of the currently active step. Used by the compact nav-trigger
	 * shown on narrow viewports, where the full step list collapses into a
	 * single status/menu button — and by the always-on nav-trigger in
	 * vertical orientation, where the step list lives in the popover.
	 *
	 * `_stepLabels` is a plain array; pushes during `registerStep` don't
	 * invalidate this computed on their own. Reading `totalSteps()` (a
	 * signal that the same `registerStep` call updates) gives the computed
	 * something reactive to depend on, so it re-runs when steps come in
	 * late — notably the vertical-orientation case where steps live in
	 * `[stepListTemplate]` and register after `<nav>` first renders. Same
	 * trick as `menuOptions` below. */
	protected readonly activeStepLabel = computed(() => {
		this.totalSteps();
		return this._stepLabels[this.activeIndex()]?.() ?? "";
	});

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

	registerStep(
		label: Signal<string>,
		status?: Signal<StepStatus | null>,
	): number {
		const index = this._stepCount++;
		this._registeredStepCount++;
		this._stepLabels.push(label);
		this._stepStatusOverrides.push(status);
		this.totalSteps.set(this._registeredStepCount);
		return index;
	}

	unregisterStep(_index: number): void {
		this._registeredStepCount--;
		if (this._registeredStepCount <= 0) {
			this._stepCount = 0;
			this._registeredStepCount = 0;
			this._stepLabels = [];
			this._stepStatusOverrides = [];
			this.totalSteps.set(0);
		} else {
			this.totalSteps.set(this._registeredStepCount);
		}
	}

	getPanelId(index: number): string | undefined {
		if (index < 0 || index >= this._panels.length) return undefined;
		return `${this.uid}-panel-${index}`;
	}

	registerPanel(panel: StepPanelRef): number {
		const index = this._panelCount++;
		this._registeredPanelCount++;
		this._panels[index] = panel;
		return index;
	}

	unregisterPanel(_index: number): void {
		this._registeredPanelCount--;
		if (this._registeredPanelCount <= 0) {
			this._panelCount = 0;
			this._registeredPanelCount = 0;
			this._panels = [];
		}
	}

	/**
	 * Auto-status is derived from `activeIndex` and the completion
	 * `_frontier`. Exactly one step can be "active" at a time (the current
	 * one), and "completed" encompasses everything before the frontier.
	 * Consumer-provided [status] on InteropStep overrides this default.
	 */
	getAutoStatus(index: number): StepStatus {
		if (index === this.activeIndex()) {
			// While finished, treat the active (last) step as completed so the
			// visual matches the flow's terminal state. The step component
			// separately drops the `--active` class so the completed colourway
			// wins; aria-current is also removed since "current" no longer
			// applies to a finished flow.
			return this._finished() ? "completed" : "active";
		}
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
		const blocker = this._firstBlockingStepIndex(index);
		if (blocker !== null) {
			this.stepAttempt.emit({ index: blocker, reason: "blocked" });
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
		const blocker = this._firstBlockingStepIndex(index);
		if (blocker !== null) {
			this.stepAttempt.emit({ index: blocker, reason: "blocked" });
			return;
		}
		this._navigate(index);
	}

	/**
	 * Returns the index of the first step that blocks forward navigation from
	 * the current `activeIndex` to (but not including) `targetIndex`, or
	 * `null` when no step blocks. Only forward navigation is checked —
	 * backward navigation is never blocked. The active step itself is
	 * included in the scan, so `next()` is blocked while the active step has
	 * a blocking status.
	 */
	private _firstBlockingStepIndex(targetIndex: number): number | null {
		const blocking = this.blockOn();
		if (blocking.length === 0) return null;
		const current = this.activeIndex();
		if (targetIndex <= current) return null;
		for (let i = current; i < targetIndex; i++) {
			const statusSignal = this._stepStatusOverrides[i];
			const status = statusSignal?.();
			if (status != null && blocking.includes(status)) return i;
		}
		return null;
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
		this._finished.set(false);
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

		// Defensive bounds. Public callers (goTo/next/back/reset) all bounds-
		// check before reaching here, but this is the single write site for
		// activeIndex — guard it so no future caller (and no scroll-derived
		// update) can put the index past the registered step count.
		if (index < 0 || index >= this.totalSteps()) return;

		// Advance the completion frontier when moving forward. Going backwards
		// never decreases it — completion is irreversible by navigation.
		if (index > this._frontier()) {
			this._frontier.set(index);
		}

		// Any navigation away from a finished state clears the flag — the user
		// has moved on (back, jump-to, etc.), so the "flow is complete"
		// indication should drop.
		if (this._finished()) {
			this._finished.set(false);
		}

		this.activeIndex.set(index);
		this.activeStepChange.emit(index);

		// In vertical mode the step list lives inside the popover, so any
		// navigation (step click, Back, Next) should dismiss it.
		this.menuPopover()?.close();

		// Scroll the new panel into view. Focus is moved once the scroll
		// settles (see `_onScrollEnd`), so swiping doesn't yank focus around
		// mid-gesture and click navigation lands focus where the eye is.
		this._scrollToActivePanel();
		// Keep the step nav strip in sync — bring the active step into view in
		// the horizontal-overflow scroll-area when it's off-screen.
		this._scrollActiveStepIntoView();
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
			queueMicrotask(() => {
				this._scrollToActivePanel();
				this._scrollActiveStepIntoView();
			});
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

	/**
	 * Scroll the active step's `<li>` into view inside the horizontal
	 * `InteropScrollArea` wrapping the step list. Nearest-edge policy —
	 * already-visible steps trigger no scroll. Bails in vertical orientation
	 * (the scroll-area host is `display:none` per the CSS), on missing host,
	 * and on missing step element (panel/step registration in flight).
	 *
	 * Uses the scroll-area's own `scrollTo` so the wrapper element scrolls,
	 * not the page. Honours `prefers-reduced-motion` — instant vs smooth
	 * — matching the panel viewport's policy.
	 */
	private _scrollActiveStepIntoView(): void {
		const scrollArea = this.listScroll();
		const hostRef = this.listScrollEl();
		if (!scrollArea || !hostRef) return;

		const host = hostRef.nativeElement as HTMLElement;
		// `offsetParent === null` covers the vertical-orientation case where
		// CSS hides the wrapper, plus any consumer-driven display:none. No
		// rects to compute in that state.
		if (host.offsetParent === null) return;

		const target =
			host.querySelectorAll<HTMLLIElement>("li[interop-step]")[
				this.activeIndex()
			];
		if (!target) return;

		const targetRect = target.getBoundingClientRect();
		const hostRect = host.getBoundingClientRect();

		// Nearest-edge policy: only scroll when the active step is off-screen.
		// Centring on every navigation feels twitchy mid-flow; this matches a
		// tab-strip's "stays put if already visible" expectation.
		if (
			targetRect.left >= hostRect.left &&
			targetRect.right <= hostRect.right
		) {
			return;
		}

		const delta =
			targetRect.right > hostRect.right
				? targetRect.right - hostRect.right
				: targetRect.left - hostRect.left;

		const reducedMotion = this.document?.defaultView?.matchMedia?.(
			"(prefers-reduced-motion: reduce)",
		).matches;

		void scrollArea.scrollTo({
			left: host.scrollLeft + delta,
			behavior: reducedMotion ? "instant" : "smooth",
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
	 * but skips the `_scrollToActivePanel()` call (the panel is already there).
	 *
	 * Bounds-checks defensively — scroll math (`Math.round(pos / dim)`) can
	 * resolve to an out-of-bounds index when the viewport overscrolls or
	 * contains extra space beyond the last panel; we silently ignore those
	 * rather than corrupt activeIndex. */
	private _setActiveFromScroll(index: number): void {
		if (index < 0 || index >= this.totalSteps()) return;
		if (index > this._frontier()) this._frontier.set(index);
		if (this._finished()) this._finished.set(false);
		this.activeIndex.set(index);
		this.activeStepChange.emit(index);
		this._panels[index]?.requestFocus();
		// Bring the new active step into view in the nav strip. The user may
		// have swiped to a panel whose corresponding step indicator is
		// off-screen in the horizontal-overflow list.
		this._scrollActiveStepIntoView();
	}

	// ── Action bar handlers ────────────────────────────────────────────────────

	/** Next-or-finish: emits (finish) when on the last step of a linear flow
	 * (see `canFinish`), otherwise advances. In non-linear mode the action
	 * bar never fires finish — consumers wire their own completion control.
	 *
	 * The `_finished` flag flips before `(finish)` emits so consumers reacting
	 * to the output (e.g. opening a confirmation dialog) see the stepper in
	 * its finished state. Re-clicking Finish while still on the last step is
	 * a no-op — the flag short-circuits further emissions until the user
	 * navigates or `reset()` is called. */
	protected onNextOrFinish(): void {
		if (this.canFinish()) {
			if (this._finished()) return;
			this._finished.set(true);
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
