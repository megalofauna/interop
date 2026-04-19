import { Directive, ElementRef, afterNextRender, computed, inject, input, isDevMode } from "@angular/core";
import {
  INTEROP_LISTBOX_TOKEN,
  type SelectControlValue,
} from "./interop-listbox.token";

let nextOptionId = 0;

/**
 * InteropOption — directive applied to projected list items inside an interop-listbox.
 *
 * Use this when you need custom option content beyond what the declarative
 * `controls[]` API supports. The directive wires the host element into the
 * parent listbox's selection and keyboard navigation.
 *
 * Must be used as a `<li>` inside a `<ul interop-listbox>` or `<ol interop-listbox>`.
 *
 * @example
 * ```html
 * <ul interop-listbox [(value)]="selected">
 *   <li interop-option value="a" label="Alpha">
 *     <app-icon name="alpha" /> Alpha
 *   </li>
 *   <li interop-option value="b" label="Beta" [disabled]="true">
 *     <app-icon name="beta" /> Beta
 *   </li>
 * </ul>
 * ```
 */
@Directive({
  selector: "li[interop-option]",
  standalone: true,
  host: {
    class: "interop-option",
    role: "option",
    "[id]": "optionId",
    "[attr.aria-selected]": "isSelected()",
    "[attr.aria-disabled]": "disabled() || null",
    "[class.interop-option--active]": "isActive()",
    "[class.interop-option--selected]": "isSelected()",
    "[class.interop-option--disabled]": "disabled()",
    "(click)": "onClick()",
    "(mouseenter)": "onMouseEnter()",
  },
})
export class InteropOption {
  /** The value this option represents when selected. */
  value = input.required<SelectControlValue>();

  /**
   * Text label used for type-ahead keyboard navigation.
   * Should reflect the option's visible text content.
   */
  label = input.required<string>();

  /** Whether this option is disabled and cannot be selected. */
  disabled = input<boolean>(false);

  /** Stable, auto-generated ID. Used by the parent listbox for aria-activedescendant. */
  readonly optionId = `interop-option-${nextOptionId++}`;

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly listbox = inject(INTEROP_LISTBOX_TOKEN, { optional: true });

  constructor() {
    if (isDevMode()) {
      afterNextRender(() => {
        if (this.el.nativeElement.tagName.toLowerCase() !== "li") {
          console.warn(
            "interop-option: expected a <li> host element. " +
            "Use <li interop-option> inside a <ul interop-listbox> or <ol interop-listbox>.",
          );
        }
      });
    }
  }

  isSelected = computed(() => this.listbox?.isSelected(this.value()) ?? false);
  isActive = computed(() => this.listbox?.isActiveValue(this.value()) ?? false);

  onClick(): void {
    if (this.disabled()) return;
    this.listbox?.selectValue(this.value());
  }

  onMouseEnter(): void {
    if (this.disabled()) return;
    this.listbox?.setActiveValue(this.value());
  }
}
