import {
  Directive,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  isDevMode,
} from "@angular/core";
import { INTEROP_STEPPER_TOKEN } from "./interop-stepper.token";

/**
 * InteropStepList — directive applied to the ordered list of step indicators.
 *
 * Must be used on an `<ol>` inside an `<interop-stepper>`.
 *
 * @example
 * ```html
 * <interop-stepper>
 *   <ol interop-step-list>
 *     <li interop-step label="Details"></li>
 *     <li interop-step label="Review"></li>
 *   </ol>
 * </interop-stepper>
 * ```
 */
@Directive({
  selector: "ol[interop-step-list]",
  standalone: true,
  host: {
    class: "interop-step-list",
    "[attr.aria-orientation]": "orientationAttr()",
  },
})
export class InteropStepList {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly stepper = inject(INTEROP_STEPPER_TOKEN, { optional: true });

  /** Mirror the parent stepper's orientation onto the list so AT users
   * navigating with directional keys know how items are laid out. Defaults
   * to horizontal when no parent is found (the dev-mode warning will fire
   * separately). */
  protected readonly orientationAttr = computed(
    () => this.stepper?.orientation() ?? "horizontal",
  );

  constructor() {
    if (isDevMode()) {
      const stepper = this.stepper;

      afterNextRender(() => {
        if (!stepper) {
          console.warn(
            "interop-step-list: must be used inside <interop-stepper>.",
          );
        }
        const tag = this.el.nativeElement.tagName.toLowerCase();
        if (tag !== "ol") {
          console.warn(
            `interop-step-list: expected <ol>, got <${tag}>. ` +
              "Steps have a meaningful order — use <ol> for correct list semantics.",
          );
        }
      });
    }
  }
}
