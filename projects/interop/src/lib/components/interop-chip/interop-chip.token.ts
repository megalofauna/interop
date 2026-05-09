import { InjectionToken, InputSignal } from "@angular/core";

/**
 * The slice of InteropChipFilter that chip options need to read and call.
 * Defined in a separate file to avoid circular imports:
 *   filter → option (for contentChildren)
 *   option → this file (for the token)
 *   filter → this file (to provide itself)
 */
export interface ChipFilterRef {
	/** Whether the entire filter group is disabled. */
	readonly disabled: InputSignal<boolean>;
	/** Called by an option when its checked state changes. */
	onOptionChange(value: string, checked: boolean): void;
	/** Whether a given value is currently in the selected set. */
	isSelected(value: string): boolean;
}

/** The slice of InteropChipOption that the filter container needs. */
export interface ChipOptionRef {
	readonly value: InputSignal<string>;
	readonly disabled: InputSignal<boolean>;
}

export const INTEROP_CHIP_FILTER =
	new InjectionToken<ChipFilterRef>("INTEROP_CHIP_FILTER");
