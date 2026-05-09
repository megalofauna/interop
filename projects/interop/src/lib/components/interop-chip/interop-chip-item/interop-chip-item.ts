import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	inject,
	input,
	isDevMode,
	output,
} from "@angular/core";

/**
 * InteropChipItem — An individual display chip rendered as a `<li>`.
 *
 * Must be used inside a `<ul interop-chip-list>`. When `[removable]="true"`,
 * a delete `<button>` is rendered inside the list item. The button carries
 * `aria-label="Remove [label]"` so the action is unambiguous to screen readers.
 *
 * The chip text itself is not interactive — only the remove button is focusable
 * when removal is enabled.
 *
 * @example Read-only tags
 * ```html
 * <li interop-chip-item label="Angular">Angular</li>
 * ```
 *
 * @example Removable chip
 * ```html
 * <li interop-chip-item label="Angular" [removable]="true" (removed)="remove('angular')">
 *   Angular
 * </li>
 * ```
 */
@Component({
	selector: "li[interop-chip-item]",
	standalone: true,
	template: `
		<ng-content></ng-content>
		@if (removable()) {
			<button
				type="button"
				class="itx-chip-remove"
				[attr.aria-label]="'Remove ' + label()"
				[disabled]="disabled() || null"
				(click)="onRemove()"
			>
				<span aria-hidden="true">&#x2715;</span>
			</button>
		}
	`,
	styleUrl: "./interop-chip-item.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"[attr.data-removable]": 'removable() ? "" : null',
		"[attr.data-disabled]": 'disabled() ? "" : null',
	},
})
export class InteropChipItem {
	private el = inject(ElementRef<HTMLLIElement>);

	/**
	 * The accessible label for this chip.
	 * Used as the base for the remove button's aria-label ("Remove [label]").
	 * Should match the chip's visible text.
	 */
	label = input.required<string>();

	/** When true, renders a remove button inside the chip. */
	removable = input<boolean>(false);

	/** Disables the remove button. */
	disabled = input<boolean>(false);

	/** Emitted when the remove button is clicked. */
	removed = output<void>();

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const el = this.el.nativeElement;
				if (el.tagName !== "LI") {
					console.warn(
						`[InteropChipItem] Must be used on a <li> element for semantic correctness. ` +
							`Found on: <${el.tagName.toLowerCase()}>`,
					);
				}
				// Note: signal-based output() does not expose subscription state,
				// so we cannot warn when (removed) is unbound at runtime.
			});
		}
	}

	onRemove(): void {
		if (this.disabled()) return;
		this.removed.emit();
	}
}
