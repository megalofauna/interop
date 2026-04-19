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
 * Must be used on a `<section>` inside an `<interop-stepper>`. Panels are matched
 * to steps by registration order — the first panel pairs with the first step, etc.
 *
 * When a panel becomes active, focus is moved to its first heading (or the panel
 * itself as a fallback). This is the accessibility behaviour missing from every
 * major stepper implementation.
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
    "[hidden]": "!isActive()",
    role: "region",
  },
})
export class InteropStepPanel implements StepPanelRef {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly stepper = inject(INTEROP_STEPPER_TOKEN, { optional: true });

  private readonly index: number;

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

  /**
   * Called by InteropStepper when this panel is activated via navigation.
   * Schedules focus on the panel's first heading (or the panel itself),
   * after Angular has rendered the newly visible panel.
   */
  requestFocus(): void {
    // requestAnimationFrame defers until after the browser has rendered the
    // panel (the [hidden] attribute is removed by the change detection cycle
    // that also triggers the goTo() call). Without this deferral, the element
    // may still be hidden when focus is attempted.
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

      target.focus({ preventScroll: false });
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
