import {
	Component,
	ChangeDetectionStrategy,
	inject,
	resource,
} from "@angular/core";
import {
	InteropTooltip,
	InteropTooltipTriggerDirective,
	InteropTooltipContentDirective,
	InteropButton,
	InteropKbd,
	InteropTable,
	InteropCellDef,
	type TableColumn,
} from 'interop';
import { CodeBlock } from "@interop/composites";
import { HighlightService } from "../../services/highlight.service";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";

interface ApiEntry {
	component?: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "tooltip-page",
	standalone: true,
	imports: [
		InteropTooltip,
		InteropTooltipTriggerDirective,
		InteropTooltipContentDirective,
		InteropButton,
		InteropKbd,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoSection,
		DemoExample,
		DemoNotes,
	],
	templateUrl: "./tooltip-page.html",
	styleUrl: "./tooltip-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipPage {
	private readonly hl = inject(HighlightService);

	// ── Code snippets ──────────────────────────────────────────────────────────

	readonly stringLabelHtml = `\
<interop-tooltip label="Initiate emergency burn sequence">
  <button interop-button>Emergency burn</button>
</interop-tooltip>`;

	readonly richContentHtml = `\
<interop-tooltip>
  <button interop-button>Save manifest</button>
  <ng-template interopTooltipContent>
    Save manifest &nbsp;<kbd interop-kbd>Ctrl</kbd>+<kbd interop-kbd>S</kbd>
  </ng-template>
</interop-tooltip>`;

	readonly placementsHtml = `\
<interop-tooltip label="Top" placement="top">
  <button interop-button>Top</button>
</interop-tooltip>

<interop-tooltip label="Bottom" placement="bottom">
  <button interop-button>Bottom</button>
</interop-tooltip>

<interop-tooltip label="Left" placement="left">
  <button interop-button>Left</button>
</interop-tooltip>

<interop-tooltip label="Right" placement="right">
  <button interop-button>Right</button>
</interop-tooltip>`;

	// ── Highlight tokens ───────────────────────────────────────────────────────

	readonly stringLabelTokens = resource({
		loader: () => this.hl.highlight(this.stringLabelHtml, "html"),
	});

	readonly richContentTokens = resource({
		loader: () => this.hl.highlight(this.richContentHtml, "html"),
	});

	readonly placementsTokens = resource({
		loader: () => this.hl.highlight(this.placementsHtml, "html"),
	});

	// ── API table ──────────────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component", sticky: true },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			component: "InteropTooltip",
			name: "label",
			type: "string",
			default: "''",
			description: "Tooltip text for simple string-only content. Use <ng-template interopTooltipContent> for rich HTML.",
		},
		{
			component: "InteropTooltip",
			name: "placement",
			type: "Placement | undefined",
			default: "undefined",
			description: "Preferred placement relative to the trigger (e.g. 'top', 'bottom-start'). Falls back to auto-placement.",
		},
		{
			component: "InteropTooltip",
			name: "showDelay",
			type: "number | undefined",
			default: "undefined",
			description: "Delay in milliseconds before the tooltip appears on hover. Focus always shows immediately.",
		},
		{
			component: "InteropTooltip",
			name: "offset",
			type: "number | undefined",
			default: "undefined",
			description: "Gap in pixels between the trigger edge and the tooltip panel.",
		},
		{
			component: "InteropTooltip",
			name: "semantic",
			type: "'description' | 'label' | undefined",
			default: "undefined",
			description: "ARIA wiring mode. 'description' adds aria-describedby (default); 'label' adds aria-labelledby. Reserve 'label' for icon-only controls.",
		},
		{
			component: "[interopTooltipTrigger]",
			name: "—",
			type: "marker",
			default: "—",
			description: "Marks a child element as the explicit trigger. Use when auto-detection (first button/a/input/[tabindex]) would pick the wrong element.",
		},
		{
			component: "ng-template[interopTooltipContent]",
			name: "—",
			type: "marker",
			default: "—",
			description: "Rich-content projection slot. When present, the template is rendered inside the panel instead of the [label] string.",
		},
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component", sticky: true },
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{
			component: "InteropTooltip",
			name: "visibilityChange",
			type: "boolean",
			default: "",
			description: "Emitted when the tooltip shows (true) or hides (false).",
		},
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Tooltip component added to manifest',
			body: 'InteropTooltip uses popover="manual" for top-layer promotion — no z-index fights, no overflow:hidden clipping. Compliant with WCAG 1.4.13 (hoverable, dismissible, persistent).',
		},
		{
			type: 'note',
			label: 'Rich content',
			body: 'Use <ng-template interopTooltipContent> for tooltips with formatted text, keyboard shortcut indicators, or any HTML structure the [label] string cannot express.',
		},
	];
}
