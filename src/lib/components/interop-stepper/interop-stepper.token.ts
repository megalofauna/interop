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
}

// ── Full internal interface ────────────────────────────────────────────────────

export interface IInteropStepper extends StepperNavContext {
  readonly linear: Signal<boolean>;
  readonly icons: Signal<Partial<Record<StepStatus, string>>>;
  readonly indicatorTemplate: Signal<TemplateRef<StepIndicatorContext> | null>;
  getAutoStatus(index: number): StepStatus;
  isStepLocked(index: number): boolean;
  registerStep(): number;
  registerPanel(panel: StepPanelRef): number;
}

/** Minimal reference the stepper holds for each panel. */
export interface StepPanelRef {
  requestFocus(): void;
}

// ── Token ──────────────────────────────────────────────────────────────────────

export const INTEROP_STEPPER_TOKEN = new InjectionToken<IInteropStepper>(
  "InteropStepper",
);
