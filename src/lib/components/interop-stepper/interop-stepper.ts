import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  WritableSignal,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from "@angular/core";
import {
  INTEROP_STEPPER_TOKEN,
  type IInteropStepper,
  type StepIndicatorContext,
  type StepPanelRef,
  type StepStatus,
  type StepperNavContext,
} from "./interop-stepper.token";

export type StepperOrientation = "horizontal" | "vertical";

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
  templateUrl: "./interop-stepper.html",
  styleUrl: "./interop-stepper.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: INTEROP_STEPPER_TOKEN, useExisting: InteropStepper },
  ],
  host: {
    "[attr.data-orientation]": "orientation()",
    "[attr.data-linear]": "linear() ? '' : null",
  },
})
export class InteropStepper implements IInteropStepper {
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

  // ── Outputs ────────────────────────────────────────────────────────────────

  /** Emitted when the active step changes. Use with [(activeStep)] for two-way binding. */
  activeStepChange = output<number>();

  /**
   * Emitted when the user attempts to navigate to a locked or out-of-bounds step.
   * Use this to show validation errors when [linear]="true" and the user clicks
   * a future step.
   */
  stepAttempt = output<{ index: number; reason: "locked" | "bounds" }>();

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

  /**
   * Per-step auto-calculated statuses. Each is a writable signal so individual
   * steps can update reactively without re-allocating the array. InteropStep
   * components read these via getAutoStatus().
   */
  private _autoStatuses: WritableSignal<StepStatus>[] = [];

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

  registerStep(): number {
    const index = this._stepCount++;
    // First step starts active; all others start pending.
    this._autoStatuses.push(signal<StepStatus>(index === 0 ? "active" : "pending"));
    this.totalSteps.set(this._stepCount);
    return index;
  }

  registerPanel(panel: StepPanelRef): number {
    const index = this._panelCount++;
    this._panels[index] = panel;
    return index;
  }

  getAutoStatus(index: number): StepStatus {
    return this._autoStatuses[index]?.() ?? "pending";
  }

  isStepLocked(index: number): boolean {
    if (!this.linear()) return false;
    // A step is locked when it is ahead of the furthest reached step.
    // Completed steps are not locked (the user can go back to review them).
    const status = this._autoStatuses[index]?.() ?? "pending";
    return status === "pending" && index > this.activeIndex();
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

  private _navigate(index: number): void {
    const prev = this.activeIndex();
    if (index === prev) return;

    // Auto-complete: mark the previous step completed when moving forward.
    if (index > prev) {
      this._autoStatuses[prev]?.set("completed");
    }

    // Update the new step's auto-status to active (unless consumer overrides).
    if (this._autoStatuses[index]?.() === "pending") {
      this._autoStatuses[index]?.set("active");
    }

    this.activeIndex.set(index);
    this.activeStepChange.emit(index);

    // Move focus to the newly active panel — the primary a11y differentiator.
    this._panels[index]?.requestFocus();
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
