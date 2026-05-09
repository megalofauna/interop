import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	resource,
	signal,
} from "@angular/core";
import {
	InteropSlider,
	InteropSliderMarks,
	InteropSliderRange,
	InteropSliderThumb,
	InteropSliderValue,
	InteropTable,
	InteropCellDef,
	InteropButton,
	type SliderRangeValue,
	type TableColumn,
} from 'interop';
import { CodeBlock } from "@interop/composites";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";
import {
	DemoNotes,
	type DemoNote,
} from "../../components/demo-notes/demo-notes";
import { HighlightService } from "../../services/highlight.service";

interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

const SHIRT_SIZES = ["XS", "S", "M", "L", "XL"] as const;

@Component({
	selector: "slider-page",
	standalone: true,
	imports: [
		InteropSlider,
		InteropSliderMarks,
		InteropSliderRange,
		InteropSliderThumb,
		InteropSliderValue,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
		DemoNotes,
		InteropButton,
	],
	templateUrl: "./slider-page.html",
	styleUrl: "./slider-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderPage {
	private readonly hl = inject(HighlightService);

	// ── Interactive state ────────────────────────────────────────────────
	brightness = signal(60);
	volume = signal(35);
	price = signal(1200);
	sizeIndex = signal(2);
	quality = signal(75);
	priceRange = signal<SliderRangeValue>({ start: 250, end: 1750 });
	temperature = signal(72);

	readonly sizes = SHIRT_SIZES;

	// Formatters used in template — captured as fields so they keep stable identity
	readonly sizeFormatter = (v: number): string =>
		SHIRT_SIZES[Math.round(v)] ?? "";
	readonly currencyFormatter = (v: number): string =>
		"$" + Math.round(v).toLocaleString();

	// ── Code snippets ────────────────────────────────────────────────────

	readonly basicCode = `<label for="brightness">Brightness</label>
<input type="range" interop-slider id="brightness"
       [min]="0" [max]="100" [step]="1"
       [(value)]="brightness" name="brightness" />
<output interop-slider-value for="brightness"></output>`;

	readonly currencyCode = `<label for="price">Budget</label>
<input type="range" interop-slider id="price"
       [min]="0" [max]="5000" [step]="50"
       [(value)]="price" />
<output interop-slider-value for="price"
        [format]="currencyFormatter"></output>`;

	readonly sizesCode = `<label for="size">Shirt size</label>
<input type="range" interop-slider id="size"
       [min]="0" [max]="4" [step]="1"
       [(value)]="sizeIndex"
       [valueText]="sizeFormatter" />
<output interop-slider-value for="size"></output>`;

	readonly marksCode = `<input type="range" interop-slider id="quality"
       [min]="0" [max]="100" [step]="5"
       [(value)]="quality"
       [interop-slider-marks]="[0, 25, 50, 75, 100]"
       [interop-slider-marks-subdivisions]="5"
       aria-label="Quality" />`;

	readonly rangeCode = `<interop-slider-range
    [min]="0" [max]="2000" [step]="50"
    [(value)]="priceRange"
    aria-label="Price range">
  <input type="range" interop-slider-thumb="start"
         id="price-min" aria-label="Minimum price" name="price-min" />
  <input type="range" interop-slider-thumb="end"
         id="price-max" aria-label="Maximum price" name="price-max" />
</interop-slider-range>

<output interop-slider-value for="price-min" [format]="currencyFormatter"></output>
<span aria-hidden="true">&ndash;</span>
<output interop-slider-value for="price-max" [format]="currencyFormatter"></output>`;

	readonly verticalCode = `<input type="range" interop-slider id="temp"
       [orientation]="'vertical'"
       [(value)]="temperature"
       style="--itx-slider-length: 12rem"
       aria-label="Temperature" />`;

	readonly formCode = `<form (submit)="onSubmit($event)">
  <label for="vol">Volume</label>
  <input type="range" interop-slider id="vol"
         [min]="0" [max]="100" [(value)]="volume"
         name="volume" />
  <button type="submit">Submit</button>
</form>

<!-- FormData on submit:  volume=35  -->`;

	// ── Highlighted tokens ───────────────────────────────────────────────

	readonly basicTokens = resource({
		loader: () => this.hl.highlight(this.basicCode, "html"),
	});
	readonly currencyTokens = resource({
		loader: () => this.hl.highlight(this.currencyCode, "html"),
	});
	readonly sizesTokens = resource({
		loader: () => this.hl.highlight(this.sizesCode, "html"),
	});
	readonly marksTokens = resource({
		loader: () => this.hl.highlight(this.marksCode, "html"),
	});
	readonly rangeTokens = resource({
		loader: () => this.hl.highlight(this.rangeCode, "html"),
	});
	readonly verticalTokens = resource({
		loader: () => this.hl.highlight(this.verticalCode, "html"),
	});
	readonly formTokens = resource({
		loader: () => this.hl.highlight(this.formCode, "html"),
	});

	// ── Form demo ────────────────────────────────────────────────────────

	lastSubmittedFormData = signal<string>("(not yet submitted)");

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();
		const fd = new FormData(event.target as HTMLFormElement);
		const parts: string[] = [];
		fd.forEach((value, key) => parts.push(`${key}=${value}`));
		this.lastSubmittedFormData.set(parts.join(", ") || "(empty)");
	}

	// ── API tables ───────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	sliderApi: ApiEntry[] = [
		{
			name: "min",
			type: "number",
			default: "0",
			description: "Minimum value.",
		},
		{
			name: "max",
			type: "number",
			default: "100",
			description: "Maximum value.",
		},
		{
			name: "step",
			type: "number",
			default: "1",
			description: "Step granularity.",
		},
		{
			name: "value",
			type: "number (model)",
			default: "0",
			description:
				"Current value. Two-way bindable as [(value)]. Updated by user drags / keyboard.",
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description:
				"Native disabled — prevents focus and interaction; submitted value is omitted from FormData.",
		},
		{
			name: "name",
			type: "string | null",
			default: "null",
			description: "Form-submission name attribute.",
		},
		{
			name: "orientation",
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			description: "Layout. Vertical uses writing-mode: vertical-lr.",
		},
		{
			name: "valueText",
			type: "(v: number) => string | null",
			default: "null",
			description:
				"Drives aria-valuetext. Set ONLY when the raw number would mislead a screen reader (e.g. discrete categories). Leave unset for plain numerics.",
		},
	];

	rangeApi: ApiEntry[] = [
		{
			name: "min",
			type: "number",
			default: "0",
			description: "Shared minimum across both thumbs.",
		},
		{
			name: "max",
			type: "number",
			default: "100",
			description: "Shared maximum across both thumbs.",
		},
		{
			name: "step",
			type: "number",
			default: "1",
			description: "Shared step granularity.",
		},
		{
			name: "value",
			type: "{ start, end } (model)",
			default: "{ start: 0, end: 100 }",
			description:
				"Two-way bindable. Thumbs clamp against each other so start ≤ end is always preserved.",
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables both thumbs.",
		},
		{
			name: "valueText",
			type: "(v: number) => string | null",
			default: "null",
			description: "Shared aria-valuetext formatter applied to each thumb.",
		},
		{
			name: "aria-label",
			type: "string | null",
			default: "null",
			description:
				"Accessible name for the range group. Each thumb still needs its own aria-label or label association.",
		},
	];

	valueApi: ApiEntry[] = [
		{
			name: "for",
			type: "string",
			default: "—",
			required: true,
			description: "ID of the slider input this output mirrors.",
		},
		{
			name: "format",
			type: "(v: number) => string | null",
			default: "null",
			description:
				"Visual-only formatter. Falls back to the slider's [valueText], then to the raw number.",
		},
	];

	notes: DemoNote[] = [
		{
			type: "release",
			label: "v0.1.0",
			title: "Slider component added",
			body: 'InteropSlider, InteropSliderRange (with InteropSliderThumb), InteropSliderValue, and InteropSliderMarks. Built on real <input type="range"> for free form participation, keyboard, RTL, and AT support.',
		},
		{
			type: "note",
			label: "Form participation",
			body: "Single-thumb sliders submit via their native [name] attribute. Range sliders use one [name] per thumb (set on each <input interop-slider-thumb>). No ngModel required for the value to land in FormData.",
		},
		{
			type: "note",
			label: "valueText vs visual format",
			body: "Set [valueText] on the slider only when the raw number would be misleading (e.g., discrete categories like XS/S/M/L). For purely cosmetic visual formatting (currency, units), set [format] on <output interop-slider-value> instead — that way the screen reader keeps announcing the raw number, which speech engines pronounce more reliably.",
		},
		{
			type: "note",
			label: "Range clamp behavior",
			body: "When the start thumb is dragged past the end (or vice versa), it clamps at the other thumb's value. Predictable and avoids focus jumps.",
		},
		{
			type: "note",
			label: "Two-way binding vs Reactive Forms",
			body: "Use [(value)] OR ngModel/formControl on a single slider — not both. Pick one strategy per slider to avoid native value updates fighting each other.",
		},
	];
}
