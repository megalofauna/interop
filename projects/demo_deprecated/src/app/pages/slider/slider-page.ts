import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import {
	CodeBlock,
	InteropButton,
	InteropCellDef,
	InteropSlider,
	InteropSliderLegend,
	InteropSliderMarks,
	InteropSliderRange,
	InteropSliderThumb,
	InteropSliderValue,
	InteropTable,
	type CodeFile,
	type SliderRangeValue,
	type TableColumn,
} from "interop";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";

type TokenEntry = { property: string; default: string };

interface ApiEntry {
	/** Present because the surface spans five directives — see the sticky
	    leading column in apiColumns. */
	directive: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

interface ApiOutputEntry {
	directive: string;
	name: string;
	type: string;
	description: string;
}

const SHIRT_SIZES = ["XS", "S", "M", "L", "XL"] as const;

/**
 * `SliderMark` is a union — a bare number, or `{ value, label? }`. These
 * examples only use the labelled variant, and the formatter below reads the
 * label back, so narrowing it here beats narrowing at every use site.
 */
type LabeledMark = { value: number; label: string };

@Component({
	selector: "slider-page",
	standalone: true,
	imports: [
		InteropSlider,
		InteropSliderLegend,
		InteropSliderMarks,
		InteropSliderRange,
		InteropSliderThumb,
		InteropSliderValue,
		InteropTable,
		InteropCellDef,
		InteropButton,
		CodeBlock,
		DemoPage,
		DemoMasthead,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
	],
	templateUrl: "./slider-page.html",
	styleUrl: "./slider-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderPage {
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

	private readonly basicHtml = `<label for="brightness">Brightness</label>
<output interop-slider-value for="brightness"></output>

<input type="range" interop-slider id="brightness"
       [min]="0" [max]="100" [step]="1"
       [(value)]="brightness" name="brightness" />`;

	private readonly basicTs = `brightness = signal(60);`;

	readonly basicFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.basicHtml },
		{ label: "component.ts", language: "ts", code: this.basicTs },
	];

	readonly disabledCode = `<label for="locked">Sensor gain (locked)</label>
<input type="range" interop-slider id="locked"
       [value]="40" [disabled]="true" />`;

	private readonly currencyHtml = `<label for="price">Budget</label>
<output interop-slider-value for="price"
        [format]="currencyFormatter"></output>

<input type="range" interop-slider id="price"
       [min]="0" [max]="5000" [step]="50"
       [(value)]="price" />`;

	private readonly currencyTs = `price = signal(1200);

// Visual only — the slider keeps announcing the raw number, which
// speech engines pronounce more reliably than "$1,200".
readonly currencyFormatter = (v: number): string =>
  "$" + Math.round(v).toLocaleString();`;

	readonly currencyFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.currencyHtml },
		{ label: "component.ts", language: "ts", code: this.currencyTs },
	];

	private readonly sizesHtml = `<label for="size">Shirt size</label>
<output interop-slider-value for="size"></output>

<input type="range" interop-slider id="size"
       [min]="0" [max]="4" [step]="1"
       [(value)]="sizeIndex"
       [valueText]="sizeFormatter" />`;

	private readonly sizesTs = `const SHIRT_SIZES = ["XS", "S", "M", "L", "XL"] as const;

sizeIndex = signal(2);

// Drives BOTH aria-valuetext and the <output>: the raw index would
// mislead a screen-reader user, so the formatter belongs on the slider.
readonly sizeFormatter = (v: number): string =>
  SHIRT_SIZES[Math.round(v)] ?? "";`;

	readonly sizesFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.sizesHtml },
		{ label: "component.ts", language: "ts", code: this.sizesTs },
	];

	/*
	 * A field, not an inline array literal in the template. A literal is a new
	 * reference on every change-detection pass, which would re-run the marks
	 * directive's normalisation — and the legend's — for no reason.
	 */
	readonly qualityMarks: LabeledMark[] = [
		{ value: 0, label: "Low" },
		{ value: 25, label: "Med" },
		{ value: 50, label: "High" },
		{ value: 75, label: "Best" },
		{ value: 100, label: "Max" },
	];

	/*
	 * The legend is aria-hidden, so the vocabulary it shows has to reach a
	 * screen reader some other way. This is that way — one formatter driving
	 * aria-valuetext, which is exactly the pattern the "Value text" example
	 * above demonstrates.
	 */
	readonly qualityFormatter = (v: number): string => {
		const mark = this.qualityMarks.find((m) => m.value === v);
		return mark ? `${v} (${mark.label})` : String(v);
	};

	private readonly marksHtml = `<input type="range" interop-slider id="quality"
       [min]="0" [max]="100" [step]="5"
       [(value)]="quality"
       [interop-slider-marks]="qualityMarks"
       [interop-slider-marks-subdivisions]="5"
       [valueText]="qualityFormatter"
       aria-label="Quality" />

<interop-slider-legend for="quality" />`;

	private readonly marksTs = `quality = signal(75);

// SliderMark also accepts bare numbers; narrowed here because the
// formatter below reads the label back.
readonly qualityMarks: { value: number; label: string }[] = [
  { value: 0,   label: "Low"  },
  { value: 25,  label: "Med"  },
  { value: 50,  label: "High" },
  { value: 75,  label: "Best" },
  { value: 100, label: "Max"  },
];

// The legend is aria-hidden — it restates visually what this announces.
readonly qualityFormatter = (v: number): string => {
  const mark = this.qualityMarks.find((m) => m.value === v);
  return mark ? \`\${v} (\${mark.label})\` : String(v);
};`;

	readonly marksFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.marksHtml },
		{ label: "component.ts", language: "ts", code: this.marksTs },
	];

	private readonly rangeHtml = `<interop-slider-range
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

	private readonly rangeTs = `priceRange = signal<SliderRangeValue>({ start: 250, end: 1750 });

readonly currencyFormatter = (v: number): string =>
  "$" + Math.round(v).toLocaleString();`;

	readonly rangeFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.rangeHtml },
		{ label: "component.ts", language: "ts", code: this.rangeTs },
	];

	readonly tempMarks: LabeledMark[] = [
		{ value: 0, label: "0°" },
		{ value: 25, label: "25°" },
		{ value: 50, label: "50°" },
		{ value: 75, label: "75°" },
		{ value: 100, label: "100°" },
	];

	private readonly verticalHtml = `<input type="range" interop-slider id="temp"
       [orientation]="'vertical'"
       [(value)]="temperature"
       [interop-slider-marks]="tempMarks"
       [interop-slider-marks-subdivisions]="5"
       style="--itx-slider-length: 12rem"
       aria-label="Temperature" />

<!-- Orientation is read from the slider. The LENGTH is not: the theme
     declares --itx-slider-* on the host elements, so a value on a shared
     ancestor is shadowed, and the legend has to be told the same one. -->
<interop-slider-legend for="temp" style="--itx-slider-length: 12rem" />`;

	private readonly verticalTs = `temperature = signal(72);

readonly tempMarks: SliderMark[] = [
  { value: 0, label: "0°" }, { value: 25, label: "25°" },
  { value: 50, label: "50°" }, { value: 75, label: "75°" },
  { value: 100, label: "100°" },
];`;

	readonly verticalFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.verticalHtml },
		{ label: "component.ts", language: "ts", code: this.verticalTs },
	];

	private readonly formHtml = `<form (submit)="onSubmit($event)">
  <label for="vol-form">Volume</label>
  <output interop-slider-value for="vol-form"></output>

  <input type="range" interop-slider id="vol-form"
         [min]="0" [max]="100" [(value)]="volume"
         name="volume" />

  <button interop-button="primary" type="submit">Submit form</button>
</form>

<!-- FormData on submit:  volume=35  -->`;

	private readonly formTs = `volume = signal(35);

lastSubmittedFormData = signal<string>("(not yet submitted)");

onSubmit(event: SubmitEvent): void {
  event.preventDefault();
  const fd = new FormData(event.target as HTMLFormElement);
  const parts: string[] = [];
  fd.forEach((value, key) => parts.push(\`\${key}=\${value}\`));
  this.lastSubmittedFormData.set(parts.join(", ") || "(empty)");
}`;

	readonly formFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.formHtml },
		{ label: "component.ts", language: "ts", code: this.formTs },
	];

	// ── Form demo ────────────────────────────────────────────────────────

	lastSubmittedFormData = signal<string>("(not yet submitted)");

	onSubmit(event: SubmitEvent): void {
		event.preventDefault();
		const fd = new FormData(event.target as HTMLFormElement);
		const parts: string[] = [];
		fd.forEach((value, key) => parts.push(`${key}=${value}`));
		this.lastSubmittedFormData.set(parts.join(", ") || "(empty)");
	}

	// ── CSS tokens ───────────────────────────────────────────────────────

	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		{
			property: "--itx-slider-track-color",
			default: "var(--itx-role-background-control)",
		},
		{
			property: "--itx-slider-track-thickness",
			default: "var(--itx-spacing-0_5) — 2px",
		},
		{
			property: "--itx-slider-fill-color",
			default: "var(--itx-role-text)",
		},
		{
			property: "--itx-slider-thumb-color",
			default: "var(--itx-role-text)",
		},
		{
			property: "--itx-slider-thumb-size",
			default: "var(--itx-spacing-3_5) — 14px, the painted circle",
		},
		{
			property: "--itx-slider-thumb-size-active",
			default: "var(--itx-spacing-5) — 20px, on hover / focus",
		},
		{
			property: "--itx-slider-thumb-target",
			default:
				"var(--itx-spacing-6) — 24px; also the control's thickness. Never lower it",
		},
		{
			property: "--itx-slider-thumb-radius",
			default: "var(--itx-radius-full)",
		},
		{
			property: "--itx-slider-focus-color",
			default:
				"var(--itx-focus-color) — thumb AND fill when focused; falls through to the global focus colour",
		},
		{
			property: "--itx-slider-disabled-color",
			default: "var(--itx-role-background-control)",
		},
		{
			property: "--itx-slider-length",
			default: "var(--itx-spacing-32) — 8rem, vertical only",
		},
		{
			property: "--itx-slider-max-length",
			default: "40rem — Carbon's 640px cap, both axes",
		},
		{
			property: "--itx-slider-duration",
			default: "var(--itx-duration-fast)",
		},
		{
			property: "--itx-slider-easing",
			default: "var(--itx-easing-standard)",
		},
		{
			property: "--itx-slider-mark-color",
			default: "var(--itx-role-edge)",
		},
		{
			property: "--itx-slider-mark-thickness",
			default: "var(--itx-border-width-thick) — 2px, along the track",
		},
		{
			property: "--itx-slider-mark-length",
			default:
				"var(--itx-spacing-5) — 20px, across the track. Longer than the resting thumb (14px) on purpose: the endpoint tick has to clear the parked circle, or there is nothing for the eye to read the handle's overhang against. Sets BOTH tick ranks — one background-size covers every layer.",
		},
		{
			property: "--itx-slider-legend-color",
			default: "var(--itx-role-text-quieter)",
		},
		{
			property: "--itx-slider-legend-font-size",
			default: "0.75rem — Carbon $label-01, a fixed rem, never a clamp()",
		},
		{
			property: "--itx-slider-legend-line-height",
			default: "1.3333",
		},
		{
			property: "--itx-slider-legend-gap",
			default: "var(--itx-spacing-2) — 8px between track and labels",
		},
		{
			property: "--itx-slider-mark-minor-color",
			default: "var(--itx-role-divider)",
		},
		{
			property: "--itx-slider-mark-minor-thickness",
			default:
				"var(--itx-border-width-hairline) — 1px, thickens under prefers-contrast",
		},
		{
			property: "--itx-slider-fill",
			default: "set by the component — fill fraction 0–1, e.g. 0.6",
		},
		{
			property: "--itx-slider-range-start / -range-end",
			default:
				"set by the component — the two handle positions, as 0–1 fractions",
		},
		{
			property: "--itx-slider-axis",
			default: "set by the component — to right / to left / to bottom",
		},
	];

	// ── API tables ───────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "directive", label: "Directive", sticky: true },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			directive: "input[interop-slider]",
			name: "min",
			type: "number",
			default: "0",
			description: "Minimum value.",
		},
		{
			directive: "input[interop-slider]",
			name: "max",
			type: "number",
			default: "100",
			description: "Maximum value.",
		},
		{
			directive: "input[interop-slider]",
			name: "step",
			type: "number",
			default: "1",
			description: "Step granularity.",
		},
		{
			directive: "input[interop-slider]",
			name: "value",
			type: "number (model)",
			default: "0",
			description:
				"Current value. Two-way bindable as [(value)]. Updated by user drags / keyboard.",
		},
		{
			directive: "input[interop-slider]",
			name: "disabled",
			type: "boolean",
			default: "false",
			description:
				"Native disabled — prevents focus and interaction; the value is omitted from FormData.",
		},
		{
			directive: "input[interop-slider]",
			name: "name",
			type: "string | null",
			default: "null",
			description: "Form-submission name attribute.",
		},
		{
			directive: "input[interop-slider]",
			name: "orientation",
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			description:
				"Layout. Vertical uses writing-mode: vertical-lr with the minimum at the bottom.",
		},
		{
			directive: "input[interop-slider]",
			name: "valueText",
			type: "(v: number) => string | null",
			default: "null",
			description:
				"Drives aria-valuetext. Set ONLY when the raw number would mislead a screen reader (e.g. discrete categories). Leave unset for plain numerics.",
		},
		{
			directive: "interop-slider-range",
			name: "min",
			type: "number",
			default: "0",
			description: "Shared minimum across both thumbs.",
		},
		{
			directive: "interop-slider-range",
			name: "max",
			type: "number",
			default: "100",
			description: "Shared maximum across both thumbs.",
		},
		{
			directive: "interop-slider-range",
			name: "step",
			type: "number",
			default: "1",
			description: "Shared step granularity.",
		},
		{
			directive: "interop-slider-range",
			name: "value",
			type: "{ start, end } (model)",
			default: "{ start: 0, end: 100 }",
			description:
				"Two-way bindable. Thumbs clamp against each other so start ≤ end is always preserved.",
		},
		{
			directive: "interop-slider-range",
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables both thumbs.",
		},
		{
			directive: "interop-slider-range",
			name: "orientation",
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			description:
				"Shared orientation. Both thumbs inherit it, so the group and its handles cannot disagree.",
		},
		{
			directive: "interop-slider-range",
			name: "valueText",
			type: "(v: number) => string | null",
			default: "null",
			description: "Shared aria-valuetext formatter applied to each thumb.",
		},
		{
			directive: "interop-slider-range",
			name: "aria-label",
			type: "string | null",
			default: "null",
			description:
				"Accessible name for the range group. Each thumb still needs its own aria-label or label association.",
		},
		{
			directive: "input[interop-slider-thumb]",
			name: "interop-slider-thumb",
			type: "'start' | 'end'",
			default: "—",
			required: true,
			description:
				"Which handle this is, supplied as the attribute's own value. Must be a child of <interop-slider-range>.",
		},
		{
			directive: "input[interop-slider-marks]",
			name: "interop-slider-marks",
			type: "(number | { value, label? })[]",
			default: "[]",
			description:
				"Major tick positions. Visual only — ticks do not change snapping ([step] does) or ARIA values. Marks outside [min, max] are dropped.",
		},
		{
			directive: "input[interop-slider-marks]",
			name: "interop-slider-marks-subdivisions",
			type: "number",
			default: "0",
			description:
				"N produces N − 1 dimmed minor ticks between each pair of majors. Requires uniformly-spaced majors spanning the full range; 0 or 1 disables them.",
		},
		{
			directive: "interop-slider-legend",
			name: "for",
			type: "string",
			default: "—",
			required: true,
			description:
				"ID of the slider whose marks this legend labels. Renders one label per mark carrying a { value, label }, centred on its own tick; aria-hidden, so give the slider a [valueText] to announce the same vocabulary.",
		},
		{
			directive: "output[interop-slider-value]",
			name: "for",
			type: "string",
			default: "—",
			required: true,
			description: "ID of the slider input this output mirrors.",
		},
		{
			directive: "output[interop-slider-value]",
			name: "format",
			type: "(v: number) => string | null",
			default: "null",
			description:
				"Visual-only formatter. Falls back to the slider's [valueText], then to the raw number.",
		},
	];

	outputColumns: TableColumn<ApiOutputEntry>[] = [
		{ key: "directive", label: "Directive", sticky: true },
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiOutputEntry[] = [
		{
			directive: "input[interop-slider]",
			name: "valueChange",
			type: "number",
			description:
				"Paired with the value model. Fires continuously while dragging or keying.",
		},
		{
			directive: "input[interop-slider]",
			name: "interactionEnd",
			type: "number",
			description:
				"Fires on the native change event — thumb released, or a keyboard adjustment committed. Use for saves and network calls.",
		},
		{
			directive: "interop-slider-range",
			name: "valueChange",
			type: "SliderRangeValue",
			description:
				"Paired with the value model. Fires continuously while either thumb moves.",
		},
		{
			directive: "interop-slider-range",
			name: "interactionEnd",
			type: "SliderRangeValue",
			description: "Fires when either thumb commits a value.",
		},
	];
}
