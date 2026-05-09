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

/** Semantic element for the bordered input row (input, focus ring, addons). */
@Directive({ selector: "interop-field-control", standalone: true })
export class FieldControlElement {}

/** Semantic container for field error messages. */
@Directive({ selector: "interop-field-errors", standalone: true })
export class FieldErrorsElement {}

/** Semantic container for field notes/hints. */
@Directive({ selector: "interop-field-notes", standalone: true })
export class FieldNotesElement {}
