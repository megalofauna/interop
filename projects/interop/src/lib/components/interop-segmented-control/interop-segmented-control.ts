import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Renderer2,
	Signal,
	afterNextRender,
	computed,
	contentChildren,
	effect,
	inject,
	input,
	isDevMode,
	output,
	signal,
	untracked,
} from "@angular/core";
import {
	INTEROP_SEGMENTED_CONTROL,
	SegmentedControlRef,
	SegmentRef,
} from "./interop-segmented-control.token";
import { InteropSegment } from "./interop-segment/interop-segment";
import { InteropIndicator } from "../interop-indicator/interop-indicator";

/**
 * InteropSegmentedControl — A semantically correct segmented control built on
 * a native `<fieldset>`.
 *
 * Each segment is a `<button interop-segment>` with `aria-pressed`. The group
 * container is the consumer-provided `<fieldset>`, which provides native browser
 * grouping semantics — no ARIA `role="group"` needed.
 *
 * ## Keyboard contract (roving tabindex)
 * The control is a single Tab stop. Arrow keys move focus and change selection
 * within the group. Home/End jump to first/last. This matches the OS-native
 * segmented control contract and avoids the Angular Material regression where
 * each segment is independently tab-focusable.
 *
 * ## CSS Anchor Positioning
 * An animated pill tracks the active segment via `anchor-name` / `position-anchor`
 * without JavaScript. A `@supports` fallback uses a direct background-color swap
 * for browsers that don't yet support anchor positioning.
 *
 * @example Basic controlled usage
 * ```html
 * <fieldset interop-segmented-control label="View" [value]="view()" (valueChange)="view.set($event)">
 *   <button interop-segment value="list">List</button>
 *   <button interop-segment value="grid">Grid</button>
 *   <button interop-segment value="detail">Detail</button>
 * </fieldset>
 * ```
 *
 * @example With visually hidden label
 * ```html
 * <fieldset interop-segmented-control label="Text size" [labelHidden]="true" [value]="size()">
 *   <button interop-segment value="sm">S</button>
 *   <button interop-segment value="md">M</button>
 *   <button interop-segment value="lg">L</button>
 * </fieldset>
 * ```
 */
@Component({
	selector: "fieldset[interop-segmented-control]",
	standalone: true,
	imports: [InteropIndicator],
	template: `
		<legend [class.interop-sr-only]="labelHidden()">{{ label() }}</legend>
		@if (effectiveValue() !== null) {
			<interop-indicator />
		}
		<ng-content></ng-content>
	`,
	styleUrl: "./interop-segmented-control.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{ provide: INTEROP_SEGMENTED_CONTROL, useExisting: InteropSegmentedControl },
	],
	host: {
		"(keydown)": "onKeydown($event)",
		"[attr.data-has-selection]": 'effectiveValue() !== null ? "" : null',
		"[attr.data-disabled]": 'disabled() ? "" : null',
	},
})
export class InteropSegmentedControl implements SegmentedControlRef {
	private el = inject(ElementRef<HTMLFieldSetElement>);
	private renderer = inject(Renderer2);

	/**
	 * Accessible label for the group, rendered as a `<legend>`.
	 * Always required — every fieldset must have a legend.
	 */
	label = input.required<string>();

	/**
	 * When true, the legend is visually hidden (sr-only) but remains
	 * accessible to screen readers.
	 */
	labelHidden = input<boolean>(false);

	/**
	 * Controlled mode: the currently selected segment value.
	 * When set, the component defers to this value over internal state.
	 * Pair with `(valueChange)` for two-way binding.
	 */
	value = input<string | null>(null);

	/** Whether the entire control is disabled. */
	disabled = input<boolean>(false);

	/** Emitted when the selected segment changes. */
	valueChange = output<string>();

	// ── Internal state ──────────────────────────────────────────────────────

	private _selectedValue = signal<string | null>(null);

	/**
	 * Resolved selection: controlled (external `value`) takes precedence,
	 * falls back to internal state. Matches the radio group pattern.
	 */
	readonly effectiveValue: Signal<string | null> = computed(
		() => this.value() ?? this._selectedValue(),
	);

	/**
	 * Index of the segment that owns tabindex="0".
	 * Starts at 0 and syncs to the selected segment when selection changes.
	 */
	private _roverIndex = signal(0);
	readonly roverIndex: Signal<number> = this._roverIndex.asReadonly();

	/** All content-projected segments, in DOM order. */
	readonly segments = contentChildren(InteropSegment);

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const el = this.el.nativeElement;
				if (el.tagName !== "FIELDSET") {
					console.warn(
						`[InteropSegmentedControl] Must be used on a <fieldset> element for semantic correctness. ` +
							`Found on: <${el.tagName.toLowerCase()}>`,
					);
				}

				const count = this.segments().length;
				if (count < 2) {
					console.warn(
						`[InteropSegmentedControl] A segmented control should have at least 2 segments (found ${count}).`,
					);
				}
				if (count > 5) {
					console.warn(
						`[InteropSegmentedControl] ${count} segments found. Consider a <select> or radio group for more than 5 options.`,
					);
				}
			});
		}

		// Keep the rover in sync with controlled value changes so that when
		// the consumer drives selection externally, Tab focus lands correctly.
		effect(() => {
			const effective = this.effectiveValue();
			const segs = this.segments();
			if (effective === null) return;
			const idx = segs.findIndex((s) => s.value() === effective);
			if (idx >= 0) this._roverIndex.set(idx);
		});

		// Auto-inject <hr itx-rule> separators between segments. The rule
		// utility (styles/utilities/rule.css) styles them as layout-inert
		// dividers; axis is implicit so the same markup works for column or
		// row tracks. Re-runs whenever segment count changes.
		effect(() => {
			const count = this.segments().length;
			untracked(() => this.syncSeparators(count));
		});
	}

	/**
	 * Insert one <hr itx-rule> immediately before each segment except the
	 * first, removing any stale separators we previously injected. The
	 * separators are decorative (aria-hidden) and don't participate in
	 * the segments() query (filtered by InteropSegment component class).
	 */
	private syncSeparators(_count: number): void {
		const host = this.el.nativeElement;
		const renderer = this.renderer;

		// Tear down stale separators from a prior run.
		const stale = Array.from(
			host.querySelectorAll(":scope > [data-itx-rule-injected]"),
		);
		for (const node of stale) renderer.removeChild(host, node);

		// Re-walk in DOM order so we can insert before each non-first
		// <button interop-segment> we encounter.
		const segmentEls: NodeListOf<HTMLButtonElement> = host.querySelectorAll(
			":scope > button[interop-segment]",
		);
		segmentEls.forEach((segEl, i) => {
			if (i === 0) return;
			const hr = renderer.createElement("hr");
			renderer.setAttribute(hr, "itx-rule", "");
			renderer.setAttribute(hr, "data-itx-rule-injected", "");
			renderer.setAttribute(hr, "aria-hidden", "true");
			renderer.insertBefore(host, hr, segEl);
		});
	}

	// ── SegmentedControlRef ──────────────────────────────────────────────────

	onSegmentSelect(value: string, index: number): void {
		this._selectedValue.set(value);
		this._roverIndex.set(index);
		this.valueChange.emit(value);
	}

	// ── Keyboard handling ────────────────────────────────────────────────────

	onKeydown(event: KeyboardEvent): void {
		const segs = this.segments();
		if (!segs.length) return;

		const key = event.key;
		if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(key)) {
			return;
		}

		event.preventDefault();

		let newIndex = this._roverIndex();
		const len = segs.length;

		if (key === "ArrowRight" || key === "ArrowDown") {
			// Skip disabled segments forward
			let next = (newIndex + 1) % len;
			while (next !== newIndex && segs[next].disabled()) next = (next + 1) % len;
			newIndex = next;
		} else if (key === "ArrowLeft" || key === "ArrowUp") {
			// Skip disabled segments backward
			let prev = (newIndex - 1 + len) % len;
			while (prev !== newIndex && segs[prev].disabled()) prev = (prev - 1 + len) % len;
			newIndex = prev;
		} else if (key === "Home") {
			newIndex = segs.findIndex((s) => !s.disabled());
			if (newIndex === -1) return;
		} else if (key === "End") {
			for (let i = len - 1; i >= 0; i--) {
				if (!segs[i].disabled()) { newIndex = i; break; }
			}
		}

		const target = segs[newIndex];
		if (!target.disabled()) {
			this.onSegmentSelect(target.value(), newIndex);
			target.focus();
		}
	}
}
