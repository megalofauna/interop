import { InjectionToken, Signal, TemplateRef } from "@angular/core";

// ── Status ─────────────────────────────────────────────────────────────────────

export type StepStatus =
  | "pending"
  | "active"
  | "completed"
  | "error"
  | "skipped";

// ── Indicator template context ─────────────────────────────────────────────────
//
// Passed to the [indicatorTemplate] TemplateRef on <interop-stepper>.
// Gives the consumer everything they need to render a custom step indicator.
//
// @example
// ```html
// <ng-template #myIndicator let-status let-i="index" let-lbl="label">
//   <app-badge [variant]="status">{{ i + 1 }}</app-badge>
// </ng-template>
// <interop-stepper [indicatorTemplate]="myIndicator">
// ```

export interface StepIndicatorContext {
  /** The step's effective status (auto-calculated or consumer-overridden). */
  $implicit: StepStatus;
  /** 0-based index of the step. */
  index: number;
  /** The step's visible label. */
  label: string;
  /** Whether the step is marked optional. */
  optional: boolean;
}

// ── Nav context ────────────────────────────────────────────────────────────────
//
// The subset of the stepper API needed to build navigation controls (Next / Back /
// Go-to buttons). Exposed as a standalone interface so consumers can type their own
// nav components without coupling to the concrete InteropStepper class.
//
// @example Template reference variable
// ```html
// <interop-stepper #stepper>...</interop-stepper>
// <button [disabled]="!stepper.canGoBack()" (click)="stepper.back()">Back</button>
// ```
//
// @example Injection in a child component
// ```typescript
// readonly stepper = inject(INTEROP_STEPPER_TOKEN);
// ```

export interface StepperNavContext {
  readonly activeIndex: Signal<number>;
  readonly totalSteps: Signal<number>;
  readonly canGoBack: Signal<boolean>;
  readonly canGoForward: Signal<boolean>;
  next(): void;
  back(): void;
  goTo(index: number): void;
  /** Roll the stepper back to its initial state — step 0, frontier cleared.
   * Consumer-provided `[status]` overrides (error/skipped) are NOT cleared —
   * the form's validity state remains the source of truth for those, and the
   * stepper should not second-guess it. Use this as the "abandon and restart"
   * path; typically wired to a Cancel button. */
  reset(): void;
}

// ── Full internal interface ────────────────────────────────────────────────────

export interface IInteropStepper extends StepperNavContext {
  readonly linear: Signal<boolean>;
  readonly orientation: Signal<"horizontal" | "vertical">;
  readonly icons: Signal<Partial<Record<StepStatus, string>>>;
  readonly indicatorTemplate: Signal<TemplateRef<StepIndicatorContext> | null>;
  getAutoStatus(index: number): StepStatus;
  isStepLocked(index: number): boolean;
  /** True when the user has previously advanced past this step. Independent
   * of whether the step is currently active — a step revisited via `back()`
   * remains "reached". Drives the `interop-step--reviewed` host class so the
   * "active+reviewed" combination can be styled distinctly. */
  wasReached(index: number): boolean;
  /** Stable, per-instance id used to wire ARIA relationships between steps
   * and panels. The panel at `index` is given the id returned by
   * `getPanelId(index)`; the corresponding step button binds `aria-controls`
   * to the same id. Returns undefined when no panel is registered at that
   * index yet (panel registration can lag step registration depending on
   * content projection order). */
  getPanelId(index: number): string | undefined;
  /** True while the flow has emitted `finish` and the user has not yet
   * navigated away from the last step. In this state the active step's
   * auto-status is reported as "completed" so the last step gets a
   * completed visual, and the step indicator's `--active` class is dropped
   * so the completed colourway wins. Cleared by any navigation
   * (`next` / `back` / `goTo` / scroll-driven activation) and by `reset()`. */
  readonly isFinished: Signal<boolean>;
  /** Each step registers itself, surfacing label + status-override signals
   * so the stepper can build menu options and evaluate `blockOn` without a
   * back-reference to InteropStep. */
  registerStep(
    label: Signal<string>,
    status?: Signal<StepStatus | null>,
  ): number;
  unregisterStep(index: number): void;
  registerPanel(panel: StepPanelRef): number;
  unregisterPanel(index: number): void;
}

/** Minimal reference the stepper holds for each panel. */
export interface StepPanelRef {
  /** Move focus to the panel's first heading (or the panel itself as a
   * fallback). The `preventScroll` option avoids a focus-induced scroll
   * adjustment when the stepper has already programmatically scrolled the
   * panel into view. */
  requestFocus(options?: { preventScroll?: boolean }): void;
  /** The DOM element representing the panel. The stepper uses this to drive
   * `scrollIntoView()` for click-driven navigation in the scroll-snap viewport. */
  getElement(): HTMLElement;
}

// ── Token ──────────────────────────────────────────────────────────────────────

export const INTEROP_STEPPER_TOKEN = new InjectionToken<IInteropStepper>(
  "InteropStepper",
);
