import {
	Component,
	ChangeDetectionStrategy,
	computed,
	signal,
} from "@angular/core";
import {
	InteropSegmentedControl,
	InteropSegment,
	InteropIcon,
	provideInteropIcons,
	InteropTable,
	InteropTooltipDirective,
	InteropCellDef,
	type TableColumn,
	CodeBlock,
	type CodeFile,
} from "interop";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";
import { TablerAlignCenter } from "interop/lib/iconsets/tabler/outline/tabler-align-center";
import { TablerAlignLeft } from "interop/lib/iconsets/tabler/outline/tabler-align-left";
import { TablerAlignRight } from "interop/lib/iconsets/tabler/outline/tabler-align-right";

type TokenEntry = { property: string; default: string };

interface ApiEntry {
	/** Present because the surface spans two components — see the sticky
	    leading column in apiColumns. */
	component?: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

interface ApiOutputEntry {
	component?: string;
	name: string;
	type: string;
	description: string;
}

@Component({
	selector: "segmented-control-page",
	standalone: true,
	imports: [
		InteropSegmentedControl,
		InteropSegment,
		InteropIcon,
		InteropTable,
		InteropTooltipDirective,
		InteropCellDef,
		CodeBlock,
		DemoMasthead,
		DemoPage,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
	],
	templateUrl: "./segmented-control-page.html",
	styleUrl: "./segmented-control-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		provideInteropIcons(TablerAlignLeft, TablerAlignRight, TablerAlignCenter),
	],
})
export class SegmentedControlPage {
	// ── Interactive state ────────────────────────────────────────────────

	viewMode = signal<string>("list");
	scanMode = signal<string>("passive");
	density = signal<string>("comfortable");
	align = signal<string>("left");
	transport = signal<string>("cruise");
	beacon = signal<string>("off");

	// ── Code snippets ────────────────────────────────────────────────────

	readonly basicHtml = `<fieldset
  interop-segmented-control
  label="View mode"
  [value]="viewMode()"
  (valueChange)="viewMode.set($event)"
>
  <button interop-segment value="list">List</button>
  <button interop-segment value="grid">Grid</button>
  <button interop-segment value="detail">Detail</button>
</fieldset>`;

	readonly basicTs = `viewMode = signal<string>("list");`;

	readonly basicFiles = computed<CodeFile[]>(() => [
		{ label: "template.html", language: "html", code: this.basicHtml },
		{ label: "component.ts", language: "ts", code: this.basicTs },
	]);

	readonly hiddenLabelHtml = `<fieldset
  interop-segmented-control
  label="Scan mode"
  [labelHidden]="true"
  [value]="scanMode()"
  (valueChange)="scanMode.set($event)"
>
  <button interop-segment value="passive">Passive</button>
  <button interop-segment value="active">Active</button>
  <button interop-segment value="deep">Deep scan</button>
</fieldset>`;

	readonly hiddenLabelTs = `scanMode = signal<string>("passive");`;

	readonly hiddenLabelFiles = computed<CodeFile[]>(() => [
		{ label: "template.html", language: "html", code: this.hiddenLabelHtml },
		{ label: "component.ts", language: "ts", code: this.hiddenLabelTs },
	]);

	readonly disabledSegmentHtml = `<fieldset
  interop-segmented-control
  label="Thruster mode"
  [value]="transport()"
  (valueChange)="transport.set($event)"
>
  <button interop-segment value="idle">Idle</button>
  <button interop-segment value="cruise">Cruise</button>
  <button interop-segment value="overdrive" [disabled]="true">Overdrive</button>
</fieldset>`;

	readonly disabledSegmentTs = `transport = signal<string>("cruise");`;

	readonly disabledSegmentFiles = computed<CodeFile[]>(() => [
		{
			label: "template.html",
			language: "html",
			code: this.disabledSegmentHtml,
		},
		{ label: "component.ts", language: "ts", code: this.disabledSegmentTs },
	]);

	readonly disabledGroupCode = `<fieldset
  interop-segmented-control
  label="Nav lock"
  [disabled]="true"
  value="locked"
>
  <button interop-segment value="locked">Locked</button>
  <button interop-segment value="free">Free</button>
</fieldset>`;

	readonly sizeHtml = `<!-- itx-size is a plain attribute, not an Angular input. -->
<fieldset
  interop-segmented-control
  itx-size="sm"
  label="Density"
  [value]="density()"
  (valueChange)="density.set($event)"
>
  <button interop-segment value="compact">Compact</button>
  <button interop-segment value="comfortable">Comfortable</button>
  <button interop-segment value="spacious">Spacious</button>
</fieldset>

<!-- itx-size="md" is also the default; omitting the attribute is identical. -->
<fieldset interop-segmented-control itx-size="md" label="Density" ...>...</fieldset>
<fieldset interop-segmented-control itx-size="lg" label="Density" ...>...</fieldset>`;

	readonly sizeTs = `density = signal<string>("comfortable");`;

	readonly sizeFiles = computed<CodeFile[]>(() => [
		{ label: "template.html", language: "html", code: this.sizeHtml },
		{ label: "component.ts", language: "ts", code: this.sizeTs },
	]);

	readonly iconHtml = `<fieldset
  interop-segmented-control
  label="Text alignment"
  [value]="align()"
  (valueChange)="align.set($event)"
>
  <button
    interop-segment="icon"
    value="left"
    [interopTooltip]="'Align left'"
    [interopTooltipSemantic]="'label'"
  >
    <interop-icon [size]="16" name="tabler-align-left" />
  </button>
  <button
    interop-segment="icon"
    value="center"
    [interopTooltip]="'Align center'"
    [interopTooltipSemantic]="'label'"
  >
    <interop-icon [size]="16" name="tabler-align-center" />
  </button>
  <button
    interop-segment="icon"
    value="right"
    [interopTooltip]="'Align right'"
    [interopTooltipSemantic]="'label'"
  >
    <interop-icon [size]="16" name="tabler-align-right" />
  </button>
</fieldset>`;

	readonly iconTs = `align = signal<string>("left");`;

	readonly iconFiles = computed<CodeFile[]>(() => [
		{ label: "template.html", language: "html", code: this.iconHtml },
		{ label: "component.ts", language: "ts", code: this.iconTs },
	]);

	// ── Keyboard ─────────────────────────────────────────────────────────

	readonly keyboardHtml = `<fieldset
  interop-segmented-control
  label="Beacon"
  [value]="beacon()"
  (valueChange)="beacon.set($event)"
>
  <button interop-segment value="off">Off</button>
  <button interop-segment value="standby" [disabled]="true">Standby</button>
  <button interop-segment value="pulse">Pulse</button>
  <button interop-segment value="steady">Steady</button>
</fieldset>`;

	readonly keyboardTs = `beacon = signal<string>("off");`;

	readonly keyboardFiles = computed<CodeFile[]>(() => [
		{ label: "template.html", language: "html", code: this.keyboardHtml },
		{ label: "component.ts", language: "ts", code: this.keyboardTs },
	]);

	// ── CSS tokens ───────────────────────────────────────────────────────

	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		// Track
		{ property: "--itx-segmented-control-track-display", default: "flex" },
		{
			property: "--itx-segmented-control-track-flex-direction",
			default: "row",
		},
		{
			property: "--itx-segmented-control-track-align-items",
			default: "initial",
		},
		{
			property: "--itx-segmented-control-track-justify-content",
			default: "flex-start",
		},
		{ property: "--itx-segmented-control-track-row-gap", default: "0" },
		{ property: "--itx-segmented-control-track-column-gap", default: "0" },
		{
			property: "--itx-segmented-control-track-background-color",
			default: "transparent — the frame alone carries the group",
		},
		{
			property: "--itx-segmented-control-track-background-image",
			default: "none",
		},
		{
			property: "--itx-segmented-control-track-border-color",
			default: "transparent",
		},
		{ property: "--itx-segmented-control-track-border-width", default: "0" },
		{
			property: "--itx-segmented-control-track-border-style",
			default: "solid",
		},
		{
			property: "--itx-segmented-control-track-box-shadow",
			default:
				"inset 0 0 0 1px var(--itx-contrast-6) — the 1px frame, drawn inset so it costs no layout",
		},
		{
			property: "--itx-segmented-control-track-border-radius",
			default: "var(--itx-radius-1) — 4px",
		},
		{ property: "--itx-segmented-control-track-padding", default: "0" },
		{ property: "--itx-segmented-control-track-max-width", default: "none" },

		// Segment — layout
		{ property: "--itx-segment-display", default: "flex" },
		{
			property: "--itx-segment-flex",
			default: "1 1 0 — every segment equal width",
		},
		{ property: "--itx-segment-min-width", default: "0" },
		{
			property: "--itx-segment-padding-inline",
			default: "var(--itx-spacing-4) — 16px",
		},
		{
			property: "--itx-segment-padding-block",
			default: "0.6875rem — 11px (md). sm 0.4375rem / 7px, lg 0.9375rem / 15px",
		},

		// Segment — typography
		{
			property: "--itx-segment-font-family",
			default: "var(--itx-font-family-sans)",
		},
		{ property: "--itx-segment-font-size", default: "0.875rem — 14px" },
		{
			property: "--itx-segment-line-height",
			default: "1.2857 — 18px at 14px, fixed so the height steps stay exact",
		},
		{ property: "--itx-segment-font-weight", default: "400" },
		{
			property: "--itx-segment-font-weight-selected",
			default: "400 — held constant so selection never reflows widths",
		},

		// Segment — visual structure
		{ property: "--itx-segment-border-width", default: "0" },
		{
			property: "--itx-segment-border-radius",
			default: "var(--itx-radius-1) — 4px",
		},

		// Segment — rest
		{ property: "--itx-segment-background", default: "transparent" },
		{
			property: "--itx-segment-foreground",
			default: "var(--itx-contrast-4) — secondary grey",
		},
		{ property: "--itx-segment-border-color", default: "transparent" },

		// Segment — hover
		{
			property: "--itx-segment-background-hover",
			default: "transparent — no wash, deliberately",
		},
		{
			property: "--itx-segment-foreground-hover",
			default: "var(--itx-contrast-6) — label comes up to full strength",
		},

		// Segment — selected
		{
			property: "--itx-segment-foreground-selected",
			default: "var(--itx-contrast-1) — inverse label on the dark pill",
		},

		// Segment — focus ring
		{ property: "--itx-segment-outline-width", default: "2px" },
		{ property: "--itx-segment-outline-style", default: "solid" },
		{
			property: "--itx-segment-outline-color",
			default: "var(--itx-colorway-solid)",
		},
		{
			property: "--itx-segment-outline-offset",
			default: "-2px — inset, so the ring stays inside the frame",
		},

		// Segment — transition
		{ property: "--itx-segment-transition-duration", default: "48ms" },
		{
			property: "--itx-segment-transition-timing-function",
			default: "ease-in-out",
		},

		// Segment — disabled
		{ property: "--itx-segment-disabled-opacity", default: "0.4" },

		// Divider — scoped to the fieldset
		{
			property: "--itx-rule-color",
			default: "var(--itx-contrast-2) — set on the fieldset, not at root",
		},
		{ property: "--itx-rule-width", default: "1px" },

		// Selection pill — scoped to the fieldset
		{
			property: "--itx-indicator-background-color",
			default: "var(--itx-contrast-6) — near-black fill",
		},
		{ property: "--itx-indicator-border-width", default: "0" },
		{
			property: "--itx-indicator-border-radius",
			default: "var(--itx-radius-1) — 4px",
		},
	];

	// ── API — Inputs ─────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component", sticky: true },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			component: "InteropSegmentedControl",
			name: "label",
			type: "string",
			default: "—",
			description:
				"Required. Accessible name for the group, rendered as the fieldset's <legend>.",
			required: true,
		},
		{
			component: "InteropSegmentedControl",
			name: "labelHidden",
			type: "boolean",
			default: "false",
			description:
				"Visually hides the legend while leaving it readable by assistive tech.",
		},
		{
			component: "InteropSegmentedControl",
			name: "value",
			type: "string | null",
			default: "null",
			description:
				"Controlled selection. When set it wins over the component's internal state, so thread (valueChange) back in or the control will appear frozen.",
		},
		{
			component: "InteropSegmentedControl",
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables every segment in the group.",
		},
		{
			component: "InteropSegment",
			name: "value",
			type: "string",
			default: "—",
			description:
				"Required. Identity of this option; emitted by the container on selection.",
			required: true,
		},
		{
			component: "InteropSegment",
			name: "disabled",
			type: "boolean",
			default: "false",
			description:
				"Disables this segment only. Skipped by arrow-key navigation and Home/End.",
		},
	];

	// ── API — Outputs ────────────────────────────────────────────────────

	outputColumns: TableColumn<ApiOutputEntry>[] = [
		{ key: "component", label: "Component", sticky: true },
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiOutputEntry[] = [
		{
			component: "InteropSegmentedControl",
			name: "valueChange",
			type: "string",
			description:
				"Emitted with the newly selected segment's value, on click and on arrow-key movement.",
		},
	];

	// ── API — Attributes (not Angular inputs) ────────────────────────────

	attrColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Element", sticky: true },
		{ key: "name", label: "Attribute" },
		{ key: "type", label: "Values" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	attrEntries: ApiEntry[] = [
		{
			component: "fieldset[interop-segmented-control]",
			name: "itx-size",
			type: '"sm" | "md" | "lg"',
			default: "md",
			description:
				"Height step — 32 / 40 / 48px. Read only by CSS, so it takes a literal string; there is no size input() to bind.",
		},
		{
			component: "button[interop-segment]",
			name: "itx-size",
			type: '"sm" | "md" | "lg"',
			default: "inherited from the fieldset",
			description: "Sizes a single segment rather than the whole control.",
		},
		{
			component: "button[interop-segment]",
			name: "interop-segment",
			type: "space-separated tokens",
			default: '""',
			description:
				'The selector attribute doubles as a modifier list. interop-segment="icon" matches the icon-only rules, which square the segment around a 16px glyph.',
		},
	];
}
