import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	inject,
	input,
	isDevMode,
} from "@angular/core";

/**
 * InteropChipList — A semantically correct container for display chips.
 *
 * Renders as the host `<ul>` element directly. Screen readers announce
 * "list, N items" automatically — no ARIA roles needed.
 *
 * Use this for read-only chip collections (tags, categories, labels).
 * For interactive filter chips use `interop-chip-filter`.
 * For free-form text entry use `interop-chip-input`.
 *
 * @example Blog post tags
 * ```html
 * <ul interop-chip-list aria-label="Post tags">
 *   <li interop-chip-item label="Angular">Angular</li>
 *   <li interop-chip-item label="CSS">CSS</li>
 *   <li interop-chip-item label="A11y" (removed)="removeTag('a11y')">A11y</li>
 * </ul>
 * ```
 */
@Component({
	selector: "ul[interop-chip-list]",
	standalone: true,
	template: "<ng-content></ng-content>",
	styleUrl: "./interop-chip-list.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		/* VoiceOver + Safari strips list semantics from <ul> elements with
		   list-style: none applied in CSS. Explicitly restoring role="list"
		   ensures consistent AT announcement across all browsers. */
		"role": "list",
	},
})
export class InteropChipList {
	private el = inject(ElementRef<HTMLUListElement>);

	/** Whether the entire list is in a disabled presentation state. */
	disabled = input<boolean>(false);

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const el = this.el.nativeElement;
				if (el.tagName !== "UL") {
					console.warn(
						`[InteropChipList] Must be used on a <ul> element for semantic correctness. ` +
							`Found on: <${el.tagName.toLowerCase()}>`,
					);
				}
				if (!el.hasAttribute("aria-label") && !el.hasAttribute("aria-labelledby")) {
					console.warn(
						`[InteropChipList] Provide an accessible label via aria-label or aria-labelledby ` +
							`so screen readers can identify the purpose of the chip list.`,
					);
				}
			});
		}
	}
}
