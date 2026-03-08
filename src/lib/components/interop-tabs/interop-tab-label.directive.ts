import { Directive, TemplateRef, inject } from "@angular/core";

/**
 * InteropTabLabel
 *
 * Marker directive for rich tab button labels. Place it on an `ng-template`
 * inside an `interop-tab-panel` to project custom content (icons, badges, etc.)
 * into the generated tab button instead of using the plain `label` string input.
 *
 * The directive simply exposes the host TemplateRef — the parent `interop-tabs`
 * reads it via `contentChild(InteropTabLabel)` and renders it in the tablist.
 *
 * @example Text-only (no directive needed)
 * ```html
 * <section interop-tab-panel label="Profile">
 *   ...panel content...
 * </section>
 * ```
 *
 * @example Rich label with icon and badge
 * ```html
 * <section interop-tab-panel>
 *   <ng-template interop-tab-label>
 *     <interop-icon name="user" />
 *     Profile
 *     <span class="badge">3</span>
 *   </ng-template>
 *   ...panel content...
 * </section>
 * ```
 */
@Directive({
  selector: "[interop-tab-label]",
  standalone: true,
})
export class InteropTabLabel {
  readonly templateRef = inject(TemplateRef<unknown>);
}
