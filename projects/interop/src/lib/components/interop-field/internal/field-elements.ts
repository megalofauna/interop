import { Directive } from "@angular/core";

/**
 * Semantic element directives for internal field templates.
 *
 * These register custom element names with Angular's template compiler
 * so that internal templates can use semantic element names like
 * `<interop-field-control>` instead of `<div>`.
 *
 * These directives are:
 * - Zero-logic: no inputs, outputs, lifecycle hooks, or styles.
 * - Internal only: imported by high-level field components, never exported
 *   in the public API.
 * - All in one file: adding a new semantic element can be done in two lines of code.
 */

/**
 * Semantic element for the bordered input row (input, focus ring, addons).
 *
 * Declares `itx-sink`, which is load-bearing rather than cosmetic. A field is a
 * recess, and a component that changes its surface has to SAY so — otherwise
 * every relative token it reads is measured from the wrong place. Painting a
 * sunken background without declaring the sink left the hover wash
 * (`--itx-contrast-1`) computed against the HOST's surface, so hovering lifted
 * the field above the very container it sits in.
 *
 * With the sink declared, the field's own surface is the baseline for its wash,
 * border and text, and it stays a recess in both schemes at any depth.
 */
@Directive({
	selector: "interop-field-control",
	standalone: true,
	host: { "itx-sink": "" },
})
export class FieldControlElement {}

/** Semantic container for field error messages. */
@Directive({ selector: "interop-field-errors", standalone: true })
export class FieldErrorsElement {}

/** Semantic container for field notes/hints. */
@Directive({ selector: "interop-field-notes", standalone: true })
export class FieldNotesElement {}
