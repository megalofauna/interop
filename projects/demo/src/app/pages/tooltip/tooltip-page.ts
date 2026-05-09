import { Component, ChangeDetectionStrategy } from "@angular/core";
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
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";

interface ApiEntry {
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
		DemoSection,
		DemoExample,
		DemoNotes,
	],
	templateUrl: "./tooltip-page.html",
	styleUrl: "./tooltip-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipPage {
	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ name: "label", type: "string", default: "''", description: "Tooltip text for simple string-only content. Use interopTooltipContent for rich HTML." },
		{ name: "placement", type: "Placement | undefined", default: "undefined", description: "Preferred placement relative to the trigger (e.g. 'top', 'bottom-start'). Falls back to auto-placement." },
		{ name: "showDelay", type: "number | undefined", default: "undefined", description: "Delay in milliseconds before the tooltip appears on hover." },
		{ name: "offset", type: "number | undefined", default: "undefined", description: "Gap in pixels between the trigger edge and the tooltip panel." },
		{ name: "semantic", type: "'description' | 'label' | undefined", default: "undefined", description: "ARIA wiring mode. 'description' adds aria-describedby; 'label' adds aria-labelledby on the trigger." },
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{ name: "visibilityChange", type: "boolean", default: "", description: "Emitted when the tooltip shows (true) or hides (false)." },
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
