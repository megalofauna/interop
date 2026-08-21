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

/**
 * A CSS `aspect-ratio` value, restricted to the forms that mean anything on a
 * non-replaced element: a `<number>`, or two numbers separated by a solidus.
 *
 * ```
 * "16/9"   "16 / 9"   "1.7778"   1.7778
 * ```
 *
 * `auto` and `auto <ratio>` are not accepted — they only apply to replaced
 * elements. Degenerate values (zero, negative, non-finite, unparseable) are
 * treated as unset, matching CSS: "if the ratio is degenerate, the property
 * instead behaves as auto".
 */
export type ResizableAspectRatio = string | number;

/** A parsed ratio, kept as its numerator and denominator so projected bounds
 * can be emitted as `calc()` rather than a pre-rounded number. */
export interface ResizableRatio {
	/** Inline-axis term. */
	w: number;
	/** Block-axis term. */
	h: number;
}

/** CSS `container-type` value applied to the host. Default `inline-size`
 * makes the resized element a container-query container so consumers can
 * write CQ rules against its width without extra wiring. */
export type ResizableContainerType = "inline-size" | "size" | "normal";
