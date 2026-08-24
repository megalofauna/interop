import {
	ChangeDetectionStrategy,
	Component,
	afterNextRender,
	computed,
	inject,
	input,
	isDevMode,
} from "@angular/core";
import { InteropSliderRegistry } from "./interop-slider-registry";
import type { SliderLegendItem } from "./interop-slider.token";

/**
 * InteropSliderLegend — visible text labels for an
 * `<input type="range" interop-slider [interop-slider-marks]>`, each one
 * centred on the tick it belongs to.
 *
 * Place it as a SIBLING of the slider, not a wrapper. The slider generates no
 * `::before` / `::after` of its own (replaced-element rules) and nothing about
 * it is wrapped, so a label row has to be its own element — but it does not
 * have to contain the input, and it does not.
 *
 * ## Where the labels come from
 * The `{ value, label }` entries already passed to `[interop-slider-marks]`.
 * That directive is the only place marks are normalised; it publishes the
 * resolved list under the slider's element id and this component reads it
 * back through `[for]`, exactly as `<output interop-slider-value for>` reads
 * back the value. One source of truth, so a label cannot drift from its tick.
 *
 * Marks with no label draw a tick and contribute no legend entry.
 *
 * ## Positioning
 * Each label is placed at `half-target + p × (100% − target)` — the identical
 * expression the fill uses for `--_fill-stop` and the marks band uses for its
 * background tile. A native range reserves the thumb's box at each end, so
 * that formula, and not a raw percentage, is where the value actually sits.
 * See the "Endpoints" and "Marks are painted in the thumb's TRAVEL space"
 * notes in `styles/components/slider.css`.
 *
 * Orientation is read from the slider, so a vertical slider gets a vertical
 * legend without the consumer restating it.
 *
 * The LENGTH is not, and cannot be. A vertical legend spans
 * `--itx-slider-length`, and the theme declares every `--itx-slider-*` token
 * on the host elements themselves — so a value set on a shared ancestor is
 * shadowed rather than inherited, and the legend would quietly keep the 8rem
 * default while its track ran longer. Set the token on BOTH:
 *
 * ```html
 * <input type="range" interop-slider id="temp" [orientation]="'vertical'"
 *        style="--itx-slider-length: 12rem" … />
 * <interop-slider-legend for="temp" style="--itx-slider-length: 12rem" />
 * ```
 *
 * Horizontal legends need none of this — both boxes take their inline size
 * from the same container.
 *
 * ## Accessibility
 * The host is `aria-hidden="true"`. The legend is a visual restatement of
 * information the slider already announces, and a screen reader that read
 * "Low Med High Best Max" as loose text next to the control would be worse
 * off, not better. Give the SLIDER a `[valueText]` formatter to announce the
 * same vocabulary — `<output interop-slider-value>` inherits it too, so one
 * function drives `aria-valuetext`, the visible number and the legend's
 * intent together.
 *
 * ## Overflow
 * A label wider than the thumb target, centred on the OUTERMOST tick, extends
 * past the control's inline box — that tick sits `target / 2` in from the
 * edge. Deliberately left to overflow rather than clamped: nudging the outer
 * two labels inward would break the one thing this component promises, which
 * is that a label is centred on its tick. Give the row horizontal room, or
 * shorten the outer labels.
 *
 * @example
 * ```html
 * <input type="range" interop-slider id="quality" [min]="0" [max]="100"
 *        [step]="5" [(value)]="quality"
 *        [interop-slider-marks]="[
 *          { value: 0,   label: 'Low'  },
 *          { value: 50,  label: 'High' },
 *          { value: 100, label: 'Max'  }
 *        ]"
 *        [interop-slider-marks-subdivisions]="5"
 *        aria-label="Quality" />
 * <interop-slider-legend for="quality" />
 * ```
 */
@Component({
	selector: "interop-slider-legend",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"aria-hidden": "true",
		"[attr.data-orientation]": "orientation()",
	},
	template: `
		@for (item of items(); track item.value) {
			<span class="itx-slider-legend__item" [style.--_p]="item.p">{{
				item.label
			}}</span>
		}
	`,
})
export class InteropSliderLegend {
	private readonly registry = inject(InteropSliderRegistry);

	/** ID of the slider input whose marks this legend labels. Required. */
	readonly forId = input.required<string>({ alias: "for" });

	private readonly marks = computed(() => this.registry.getMarks(this.forId()));

	protected readonly items = computed<SliderLegendItem[]>(() => {
		const marks = this.marks();
		if (!marks) return [];
		return marks().filter((m) => m.label !== "");
	});

	protected readonly orientation = computed(
		() => this.registry.get(this.forId())?.orientation() ?? "horizontal",
	);

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				if (!this.registry.get(this.forId())) {
					console.warn(
						`[InteropSliderLegend] no slider found with id "${this.forId()}". ` +
							'Set the [for] attribute to the id of an <input type="range" ' +
							"interop-slider> or interop-slider-thumb element.",
					);
					return;
				}
				if (!this.marks()) {
					console.warn(
						`[InteropSliderLegend] slider "${this.forId()}" has no ` +
							"[interop-slider-marks]. A legend labels marks; add the " +
							"directive, or drop the legend.",
					);
				}
			});
		}
	}
}
