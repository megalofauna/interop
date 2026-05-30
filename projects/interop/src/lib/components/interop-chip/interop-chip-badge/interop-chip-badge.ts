import { ChangeDetectionStrategy, Component } from "@angular/core";

/**
 * InteropChipBadge — A standalone, inline-friendly chip for single-use cases.
 *
 * Use this when a chip lives **outside** a list — inline status badges within
 * prose, version tags, key/value pairs, or anywhere a single chip-shaped
 * label belongs without the "list of one" semantic.
 *
 * The host **is** the chip — apply the attribute to any inline-appropriate
 * element (typically `<span>`, but `<output>`, `<mark>`, `<div>`, etc. work).
 * Visual styling comes from the shared `--itx-chip-*` token family with badge
 * overrides under `--itx-chip-badge-*`.
 *
 * ## Non-interactive by design
 * The badge has no remove button, no disabled state, and no inputs. If you
 * need an interactive single chip, use a one-item `<ul interop-chip-list>`
 * instead — that's a *list of one*, semantically distinct from a *badge*.
 *
 * @example Inline badge in flowing text
 * ```html
 * <p>Build: <span interop-chip-badge>v0.1.0</span></p>
 * ```
 *
 * @example Status indicator next to a heading
 * ```html
 * <h2>Cargo bay <span interop-chip-badge>operational</span></h2>
 * ```
 *
 * @example Key/value pair via <dl>
 * ```html
 * <dt>Reactor</dt>
 * <dd><span interop-chip-badge>online</span></dd>
 * ```
 */
@Component({
	selector: "[interop-chip-badge]",
	standalone: true,
	template: "<ng-content></ng-content>",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropChipBadge {}
