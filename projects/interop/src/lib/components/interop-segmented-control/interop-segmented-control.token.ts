import { InjectionToken, InputSignal, Signal } from "@angular/core";

/**
 * The slice of InteropSegmentedControl that segments need to read and call.
 * Defined here (not in the container file) to avoid circular imports:
 *   container → segment (for contentChildren)
 *   segment → this file (for the token)
 *   container → this file (to provide itself)
 */
export interface SegmentedControlRef {
	/** Currently resolved value — external input ?? internal signal. */
	readonly effectiveValue: Signal<string | null>;
	/** Index of the segment that currently holds tabindex="0". */
	readonly roverIndex: Signal<number>;
	/** All registered segment instances, in DOM order. */
	readonly segments: Signal<readonly SegmentRef[]>;
	/** Whether the entire control is disabled. */
	readonly disabled: InputSignal<boolean>;
	/** Called by a segment when it is clicked or arrow-key activated. */
	onSegmentSelect(value: string, index: number): void;
}

/** The slice of InteropSegment that the container needs to interact with. */
export interface SegmentRef {
	readonly value: InputSignal<string>;
	readonly disabled: InputSignal<boolean>;
	focus(): void;
}

export const INTEROP_SEGMENTED_CONTROL =
	new InjectionToken<SegmentedControlRef>("INTEROP_SEGMENTED_CONTROL");
