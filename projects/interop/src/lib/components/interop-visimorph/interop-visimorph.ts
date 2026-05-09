import {
  ChangeDetectionStrategy,
  Component,
  input,
} from "@angular/core";

export type VisiMorphType = "radio" | "checkbox" | "toggle";

/**
 * InteropVisimorph - The shared visual indicator layer for faux form controls.
 *
 * This component renders the visible portion of a form control (the ring/dot for
 * radio buttons, the box/checkmark/dash for checkboxes). It is entirely decorative —
 * the native `<input>` element in the parent control handles all accessibility,
 * focus management, and form submission.
 *
 * The entire visual is CSS-driven via a set of `--itx-control-*` custom properties.
 * Because every control type uses this same component, adjusting those properties
 * at any ancestor updates all controls simultaneously.
 *
 * @example Inside a radio control template
 * ```html
 * <input #radioInput type="radio" class="sr-only" ... />
 * <interop-visimorph [type]="'radio'" [checked]="checked()" [disabled]="disabled()" [focused]="focused()" />
 * ```
 *
 * @example Inside a checkbox control template
 * ```html
 * <input #checkboxInput type="checkbox" class="sr-only" ... />
 * <interop-visimorph [type]="'checkbox'" [checked]="checked()" [disabled]="disabled()" [indeterminate]="indeterminate()" [focused]="focused()" />
 * ```
 *
 * @example Theming — override any control at any scope
 * ```css
 * .my-section {
 *   --itx-control-accent: hotpink;
 *   --itx-control-size: 1.25rem;
 * }
 * ```
 */
@Component({
  selector: "interop-visimorph",
  standalone: true,
  template: "",
  styleUrl: "./interop-visimorph.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[attr.itx-visimorph]": "type()",
    "[attr.data-selected]": 'type() === "radio" && checked() ? "" : null',
    "[attr.data-checked]":  'type() !== "radio" && checked() ? "" : null',
    "[attr.data-disabled]": 'disabled() ? "" : null',
    "[attr.data-indeterminate]": 'indeterminate() ? "" : null',
    "[attr.data-focused]": 'focused() ? "" : null',
    "aria-hidden": "true",
    "role": "presentation",
  },
})
export class InteropVisimorph {
  /**
   * The control type this instance represents.
   * Reflected to the `itx-visimorph` host attribute for CSS type-specific styling.
   */
  type = input.required<VisiMorphType>();

  /**
   * Whether the associated control is in a checked/selected state.
   */
  checked = input<boolean>(false);

  /**
   * Whether the associated control is disabled.
   */
  disabled = input<boolean>(false);

  /**
   * Whether the associated control is in an indeterminate state (checkbox only).
   */
  indeterminate = input<boolean>(false);

  /**
   * Whether the associated native input currently has focus.
   * The parent control is responsible for tracking this and passing it in.
   */
  focused = input<boolean>(false);
}
