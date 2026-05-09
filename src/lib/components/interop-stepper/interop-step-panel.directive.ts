import {
  Directive,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  isDevMode,
} from "@angular/core";
import {
  INTEROP_STEPPER_TOKEN,
  type StepPanelRef,
} from "./interop-stepper.token";

/**
 * InteropStepPanel — directive applied to each step's content panel.
 *
 * Must be used on a `<section>` inside an `<interop-stepper>`. Panels are
 * matched to steps by registration order — the first panel pairs with the
 * first step, etc.
 *
 * In the scroll-snap viewport, all reachable panels are siblings inside the
 * scroll container. Locked panels (linear mode + index past the frontier)
 * are removed from the DOM via `[hidden]` so swipe physics can't pass the
 * frontier — that's the hard-lock model.
 *
 * When a panel becomes active (scroll settles on it, or programmatic nav),
 * focus is moved to its first heading. The accessibility behaviour missing
 * from every major stepper implementation.
 *
 * @example
 * ```html
 * <section interop-step-panel>
 *   <h2>Personal Info</h2>
 *   <!-- form fields -->
 * </section>
 * ```
 */
@Directive({
  selector: "section[interop-step-panel]",
  standalone: true,
  host: {
    class: "interop-step-panel",
    "[hidden]": "isLocked()",
    "[attr.data-step-index]": "index",
    "[attr.aria-current]": 'isActive() ? "step" : null',
    role: "region",
  },
})
export class InteropStepPanel implements StepPanelRef {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly stepper = inject(INTEROP_STEPPER_TOKEN, { optional: true });

  protected readonly index: number;

  constructor() {
    this.index = this.stepper?.registerPanel(this) ?? 0;

    afterNextRender(() => {
      this.wireAriaLabel();

      if (isDevMode()) {
        if (!this.stepper) {
          console.warn(
            "interop-step-panel: must be used inside <interop-stepper>.",
          );
        }

        const tag = this.el.nativeElement.tagName.toLowerCase();
        if (tag !== "section") {
          console.warn(
            `interop-step-panel: expected <section>, got <${tag}>. ` +
              "Use <section interop-step-panel> for correct landmark semantics.",
          );
        }

        const heading = this.el.nativeElement.querySelector(
          "h1,h2,h3,h4,h5,h6",
        );
        if (!heading) {
          console.warn(
            `interop-step-panel (panel ${this.index}): no heading found. ` +
              "Provide an <h2>–<h6> as the first child to label the panel and " +
              "enable focus management. The panel element itself will be focused " +
              "as a fallback.",
          );
        }
      }
    });
  }

  protected readonly isActive = computed(
    () => this.stepper?.activeIndex() === this.index,
  );

  /** Locked panels are removed from the DOM via [hidden] so the scroll-snap
   * viewport cannot reach them — the linear-mode hard-lock. */
  protected readonly isLocked = computed(
    () => this.stepper?.isStepLocked(this.index) ?? false,
  );

  getElement(): HTMLElement {
    return this.el.nativeElement;
  }

  /**
   * Called by InteropStepper when this panel becomes active. Schedules focus
   * on the panel's first heading (or the panel itself as a fallback).
   *
   * The `preventScroll` option (default true) avoids a focus-induced scroll
   * adjustment, since the stepper has already programmatically scrolled the
   * panel into view via `scrollIntoView`. Pass `{ preventScroll: false }` to
   * fall back to native focus-scroll behaviour.
   */
  requestFocus(options?: { preventScroll?: boolean }): void {
    // requestAnimationFrame defers until after the browser has rendered, so
    // the panel is laid out by the time we reach for its heading.
    requestAnimationFrame(() => {
      const el = this.el.nativeElement;
      const heading = el.querySelector(
        "h1,h2,h3,h4,h5,h6",
      ) as HTMLElement | null;
      const target = heading ?? el;

      // If falling back to the panel element itself, make it programmatically
      // focusable. Remove tabindex on blur so it doesn't enter the tab order.
      if (target === el && !el.hasAttribute("tabindex")) {
        el.setAttribute("tabindex", "-1");
        el.addEventListener("blur", () => el.removeAttribute("tabindex"), {
          once: true,
        });
      }

      target.focus({ preventScroll: options?.preventScroll ?? true });
    });
  }

  /**
   * Auto-wires aria-labelledby to the panel's first heading.
   * Generates a stable ID on the heading if one isn't already present.
   */
  private wireAriaLabel(): void {
    const el = this.el.nativeElement;
    const heading = el.querySelector("h1,h2,h3,h4,h5,h6") as HTMLElement | null;
    if (!heading) return;

    if (!heading.id) {
      heading.id = `itx-step-panel-label-${this.index}`;
    }
    el.setAttribute("aria-labelledby", heading.id);
  }
}
