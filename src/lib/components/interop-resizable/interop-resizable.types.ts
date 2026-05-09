/**
 * Resize axis. Maps directly to CSS `resize` values in Tier 0; in Tier 1
 * (custom-handle mode) drives the directionality of the corner handle and
 * the keyboard arrow-key contract.
 */
export type ResizableAxis = "horizontal" | "vertical" | "both";

/** Per-axis size or bound. Numeric values are pixels. Either axis is optional
 * — pass only the dimension(s) you want to constrain or seed. */
export interface ResizableBounds {
  width?: number;
  height?: number;
}

/** Payload for `(resize)` and `(resizeEnd)` outputs. Always contains both
 * dimensions, measured from the host's `getBoundingClientRect()`. */
export interface ResizableDimensions {
  width: number;
  height: number;
}

/** CSS `container-type` value applied to the host. Default `inline-size`
 * makes the resized element a container-query container so consumers can
 * write CQ rules against its width without extra wiring. */
export type ResizableContainerType = "inline-size" | "size" | "normal";
