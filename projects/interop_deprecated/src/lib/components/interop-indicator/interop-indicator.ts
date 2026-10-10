import { ChangeDetectionStrategy, Component } from "@angular/core";

/**
 * InteropIndicator — Decorative anchored indicator surface.
 *
 * A purpose-built element for the "sliding pill" pattern used by segmented
 * controls, tab strips, toggle groups, and similar selection visualisations.
 * It owns no behaviour and exposes no inputs — its sole job is to provide a
 * styled, animatable surface that follows an external anchor.
 *
 * ## Anchoring
 *
 * Positioning uses CSS Anchor Positioning. A parent component is expected to
 * place this element inside a positioning context and to expose an
 * `anchor-name: --itx-indicator-anchor` on the currently-active item. The
 * indicator's host CSS reads that anchor name and tracks the four edges.
 *
 * In browsers without anchor-positioning support the indicator hides itself,
 * and the parent component is expected to provide a non-animated fallback
 * (typically by painting the active item's background directly).
 *
 * ## Theming
 *
 * Visuals are entirely token-driven via the `--itx-indicator-*` namespace.
 * Set those tokens at any ancestor scope to retheme every indicator
 * simultaneously, or at a per-component scope to differentiate.
 *
 * @example Inside a segmented control template
 * ```html
 * <interop-indicator />
 * <ng-content></ng-content>
 * ```
 */
@Component({
	selector: "interop-indicator",
	standalone: true,
	template: "",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"aria-hidden": "true",
	},
})
export class InteropIndicator {}
