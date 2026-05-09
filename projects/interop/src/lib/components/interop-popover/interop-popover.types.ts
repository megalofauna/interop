import { InjectionToken } from "@angular/core";

/**
 * Placement variants for the popover panel relative to its anchor (trigger).
 * Mirrors the tooltip's Placement type so the same position strategies are
 * reusable across both components.
 */
export type PopoverPlacement =
	| "top"
	| "top-start"
	| "top-end"
	| "right"
	| "right-start"
	| "right-end"
	| "bottom"
	| "bottom-start"
	| "bottom-end"
	| "left"
	| "left-start"
	| "left-end";

/**
 * Native popover modes. Mirrors the values the HTML `popover` attribute
 * accepts.
 *
 * - `auto` (default): light-dismiss (click outside or Escape closes), only
 *   one `auto` popover open at a time in a stack. Right for menus and
 *   selection panels.
 * - `manual`: programmatic control only, stacks independently. Right for
 *   notification panels or anything that should NOT light-dismiss.
 * - `hint`: Chrome 131+ — closes on any pointer event outside the panel,
 *   stacks separately from `auto`. Falls back to ignoring the attribute on
 *   browsers without support (treated like `auto` semantics in practice).
 */
export type PopoverType = "auto" | "manual" | "hint";

/**
 * Reason a popover closed. Reported via the `(closed)` output. Mirrors the
 * dialog's close-reason pattern so consumers can branch on origin.
 */
export type PopoverCloseReason = "light-dismiss" | "programmatic" | "trigger";

export interface PopoverClosedEvent {
	reason: PopoverCloseReason;
}

/**
 * Per-instance configuration accepted by the optional global config token.
 */
export interface InteropPopoverGlobalConfig {
	placement?: PopoverPlacement;
	offset?: number;
}

/**
 * Inject this to set library-wide popover defaults. Per-instance inputs
 * still override these.
 */
export const INTEROP_POPOVER_CONFIG =
	new InjectionToken<InteropPopoverGlobalConfig>("INTEROP_POPOVER_CONFIG");

export const INTEROP_POPOVER_DEFAULTS: Required<InteropPopoverGlobalConfig> = {
	placement: "bottom",
	offset: 8,
};
