import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  input,
  isDevMode,
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { InteropIcon } from "../interop-icon/interop-icon";
import {
  INTEROP_STEPPER_TOKEN,
  type StepStatus,
} from "./interop-stepper.token";

/**
 * InteropStep — directive applied to each step indicator item.
 *
 * Must be used on an `<li>` inside an `ol[interop-step-list]`.
 * Renders a button (navigable) or a static indicator (locked) inside the `<li>`,
 * and wires ARIA state from the parent stepper context.
 *
 * @example
 * ```html
 * <ol interop-step-list>
 *   <li interop-step label="Personal Info"></li>
 *   <li interop-step label="Address"></li>
 *   <li interop-step label="Review" [optional]="true"></li>
 * </ol>
 * ```
 *
 * @example With explicit status override
 * ```html
 * <li interop-step label="Details" [status]="stepStatus()"></li>
 * ```
 */
@Component({
  selector: "li[interop-step]",
  standalone: true,
  imports: [InteropIcon, NgTemplateOutlet],
  template: `
    <button
      type="button"
      class="interop-step__btn"
      [disabled]="isLocked()"
      [attr.aria-controls]="panelId()"
      (click)="activate()"
    >
      <span class="interop-step__indicator" aria-hidden="true">
        @if (indicatorTpl(); as tpl) {
          <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="indicatorContext()" />
        } @else {
          @switch (effectiveStatus()) {
            @case ("completed") {
              <interop-icon [name]="resolvedIcons().completed ?? 'tabler-check'" [size]="16" />
            }
            @case ("error") {
              <interop-icon [name]="resolvedIcons().error ?? 'tabler-alert-circle'" [size]="16" />
            }
            @case ("skipped") {
              <interop-icon [name]="resolvedIcons().skipped ?? 'tabler-minus'" [size]="16" />
            }
            @default {
              @if (resolvedIcons()[effectiveStatus()]; as iconName) {
                <interop-icon [name]="iconName" [size]="16" />
              } @else {
                <span class="interop-step__number">{{ displayIndex() }}</span>
              }
            }
          }
        }
      </span>
      <span class="interop-step__label">
        {{ label() }}
        @if (optional()) {
          <span class="interop-step__optional">(optional)</span>
        }
      </span>
      @if (statusSuffix(); as suffix) {
        <span class="interop-step__status">{{ suffix }}</span>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[attr.aria-current]": 'isActive() ? "step" : null',
    "[class.interop-step--active]": "isActive()",
    "[class.interop-step--completed]": 'effectiveStatus() === "completed"',
    "[class.interop-step--error]": 'effectiveStatus() === "error"',
    "[class.interop-step--skipped]": 'effectiveStatus() === "skipped"',
    "[class.interop-step--locked]": "isLocked()",
    "[class.interop-step--pending]": 'effectiveStatus() === "pending"',
    // Applied independently of effective status. Combined with --active, this
    // marks the "you came back to a step you'd already finished" case so it
    // can be styled distinctly from a fresh active step.
    "[class.interop-step--reviewed]": "isReviewed()",
  },
})
export class InteropStep implements OnDestroy {
  private readonly stepper = inject(INTEROP_STEPPER_TOKEN, { optional: true });

  /** The step's visible label. */
  label = input.required<string>();

  /**
   * Overrides the auto-calculated status. Use to drive error or skipped states
   * from external validation. When null, the stepper auto-calculates from
   * navigation history.
   */
  status = input<StepStatus | null>(null);

  /** Marks the step as optional. Appends "(optional)" to the label. */
  optional = input<boolean>(false);

  /**
   * Overrides the default icon names for specific statuses. Unset keys fall
   * back to the library defaults (check / warning-circle / minus). Ignored
   * when the parent stepper has an [indicatorTemplate] set.
   *
   * @example
   * ```html
   * <li interop-step label="Done" [icons]="{ completed: 'star-fill', error: 'x-circle' }"></li>
   * ```
   */
  icons = input<Partial<Record<StepStatus, string>>>({});

  private readonly index: number;

  constructor() {
    this.index = this.stepper?.registerStep(this.label, this.status) ?? 0;

    if (isDevMode()) {
      if (!this.stepper) {
        afterNextRender(() => {
          console.warn(
            "interop-step: must be used inside <interop-stepper>.",
          );
        });
      }
    }
  }

  /** 1-based display number shown inside the indicator. */
  protected readonly displayIndex = computed(() => this.index + 1);

  /** "Active" from the step indicator's perspective: the user is currently on
   * this step AND the flow is not finished. Once `(finish)` fires the active
   * step's status flips to "completed" (see InteropStepper.getAutoStatus)
   * and this signal drops to false so the `--active` CSS class no longer
   * applies — letting the `--completed` colourway win — and `aria-current`
   * stops claiming a current step in a finished flow. */
  protected readonly isActive = computed(
    () =>
      !this.stepper?.isFinished() &&
      this.stepper?.activeIndex() === this.index,
  );

  protected readonly isLocked = computed(
    () => this.stepper?.isStepLocked(this.index) ?? false,
  );

  /** True when the user has advanced past this step at any point. Combines
   * with isActive() to drive distinct treatment for "active+reviewed" vs
   * "active+first-visit" and the existing "completed" (reviewed-not-active). */
  protected readonly isReviewed = computed(
    () => this.stepper?.wasReached(this.index) ?? false,
  );

  /** Pulls the stepper-level indicator template down so the template can reference it. */
  protected readonly indicatorTpl = computed(
    () => this.stepper?.indicatorTemplate() ?? null,
  );

  /**
   * Stepper-level [icons] provide the baseline; step-level [icons] merge on top.
   * Step wins on any key both define.
   */
  protected readonly resolvedIcons = computed((): Partial<Record<StepStatus, string>> => ({
    ...this.stepper?.icons() ?? {},
    ...this.icons(),
  }));

  /** Context object passed to [indicatorTemplate] when it is set. */
  protected readonly indicatorContext = computed(() => ({
    $implicit: this.effectiveStatus(),
    index: this.index,
    label: this.label(),
    optional: this.optional(),
  }));

  /**
   * Consumer-provided [status] takes precedence over the stepper's auto-calculated
   * status. This lets external form validation drive error/skipped states without
   * the stepper needing to know about form internals.
   */
  protected readonly effectiveStatus = computed((): StepStatus => {
    const override = this.status();
    if (override !== null) return override;
    return this.stepper?.getAutoStatus(this.index) ?? "pending";
  });

  /**
   * Visually-hidden status suffix appended after the visible label. Lets AT
   * users hear "Profile, Completed" without the explicit `aria-label`
   * override that previously displaced the natural accessible name from the
   * visible button content. Returns an empty string for `pending` / `active`
   * — those don't need announcing as status (active is conveyed by
   * `aria-current="step"` on the host).
   */
  protected readonly statusSuffix = computed((): string => {
    switch (this.effectiveStatus()) {
      case "completed": return "Completed";
      case "error":     return "Error";
      case "skipped":   return "Skipped";
      default:          return "";
    }
  });

  /** Panel id this step controls — sourced from the parent stepper so step
   * and panel agree on the same identifier. */
  protected readonly panelId = computed(
    () => this.stepper?.getPanelId(this.index),
  );

  ngOnDestroy(): void {
    this.stepper?.unregisterStep(this.index);
  }

  protected activate(): void {
    this.stepper?.goTo(this.index);
  }
}
