import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	computed,
	inject,
	input,
	isDevMode,
} from "@angular/core";
import {
	INTEROP_SEGMENTED_CONTROL,
	SegmentRef,
} from "../interop-segmented-control.token";

/**
 * InteropSegment — An individual option within an InteropSegmentedControl.
 *
 * Renders as the host `<button>` element directly — no wrapper element.
 * `aria-pressed` reflects whether this segment is the active selection.
 * `tabindex` is managed by the parent container's roving tabindex logic;
 * only the active segment is in the tab order at any given time.
 *
 * Must be used on a `<button>` element inside a
 * `<fieldset interop-segmented-control>`.
 *
 * @example
 * ```html
 * <fieldset interop-segmented-control label="View" [value]="view()">
 *   <button interop-segment value="list">List</button>
 *   <button interop-segment value="grid">Grid</button>
 * </fieldset>
 * ```
 */
@Component({
	selector: "button[interop-segment]",
	standalone: true,
	template: "<ng-content></ng-content>",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"type": "button",
		"[attr.aria-pressed]": "isSelected()",
		"[attr.tabindex]": "tabIndex()",
		"[attr.data-selected]": 'isSelected() ? "" : null',
		"[attr.data-disabled]": 'disabled() ? "" : null',
		"(click)": "onSegmentClick()",
	},
})
export class InteropSegment implements SegmentRef {
	private el = inject(ElementRef<HTMLButtonElement>);
	private parent = inject(INTEROP_SEGMENTED_CONTROL, { optional: true });

	/**
	 * The value this segment represents. Emitted by the container on selection.
	 *
	 * NOT `input.required`: the parent container reads each segment's value
	 * reactively (in effects over its projected `contentChildren`). A required
	 * input read during the brief bind window — before `[value]` propagates —
	 * throws NG0950 and kills the whole page's change detection (intermittently,
	 * since it's timing-dependent). Defaulting to "" makes the read return empty
	 * instead; the effect re-runs and corrects itself once the value lands. A
	 * dev-mode warning below preserves the "every segment needs a value" contract.
	 */
	value = input<string>("");

	/** Disables just this segment, leaving others interactive. */
	disabled = input<boolean>(false);

	// ── Computed state ───────────────────────────────────────────────────────

	readonly isSelected = computed(
		() => this.parent?.effectiveValue() === this.value(),
	);

	readonly tabIndex = computed(() => {
		if (!this.parent) return 0;
		const segs = this.parent.segments();
		const roverIdx = this.parent.roverIndex();
		const myIndex = segs.indexOf(this as unknown as SegmentRef);
		if (myIndex === -1) return -1;
		return myIndex === roverIdx ? 0 : -1;
	});

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				if (!this.parent) {
					console.warn(
						`[InteropSegment] Must be used inside a <fieldset interop-segmented-control> container.`,
					);
				}
				const el = this.el.nativeElement;
				if (el.tagName !== "BUTTON") {
					console.warn(
						`[InteropSegment] Must be used on a <button> element for semantic correctness. ` +
							`Found on: <${el.tagName.toLowerCase()}>`,
					);
				}
				if (!this.value()) {
					console.warn(
						`[InteropSegment] Missing "value" input. Every segment must declare a non-empty value.`,
					);
				}
			});
		}
	}

	// ── Interaction ──────────────────────────────────────────────────────────

	onSegmentClick(): void {
		if (this.disabled() || this.parent?.disabled()) return;
		const segs = this.parent?.segments() ?? [];
		const idx = segs.indexOf(this as unknown as SegmentRef);
		this.parent?.onSegmentSelect(this.value(), idx);
	}

	focus(): void {
		this.el.nativeElement.focus();
	}
}
