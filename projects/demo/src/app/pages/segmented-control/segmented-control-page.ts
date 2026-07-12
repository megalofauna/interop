import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import {
	InteropSegmentedControl,
	InteropIcon,
	provideInteropIcons,
	InteropSegment,
	InteropTable,
	InteropTooltipDirective,
	InteropCellDef,
	type TableColumn,
} from "interop";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";
import {
	DemoNotes,
	type DemoNote,
} from "../../components/demo-notes/demo-notes";
import {
	TablerAlignCenter,
	TablerAlignLeft,
	TablerAlignRight,
} from "interop/lib/iconsets/tabler";

interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "segmented-control-page",
	standalone: true,
	imports: [
		InteropIcon,
		InteropSegmentedControl,
		InteropSegment,
		InteropTable,
		InteropTooltipDirective,
		InteropCellDef,
		DemoMasthead,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
		DemoNotes,
	],
	templateUrl: "./segmented-control-page.html",
	styleUrl: "./segmented-control-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		provideInteropIcons(TablerAlignLeft, TablerAlignRight, TablerAlignCenter),
	],
})
export class SegmentedControlPage {
	viewMode = signal<string>("list");
	align = signal<string>("left");
	scanMode = signal<string>("passive");

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			name: "label",
			type: "string",
			default: "—",
			description:
				"Required. Accessible label for the group, rendered as a visually-hidden fieldset legend.",
			required: true,
		},
		{
			name: "labelHidden",
			type: "boolean",
			default: "false",
			description:
				"When true, the legend is visually hidden but remains accessible.",
		},
		{
			name: "value",
			type: "string | null",
			default: "null",
			description: "Currently selected segment value in controlled mode.",
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables all segments in the control.",
		},
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{
			name: "valueChange",
			type: "string",
			default: "",
			description:
				"Emitted with the selected segment's value when selection changes.",
		},
	];

	notes: DemoNote[] = [
		{
			type: "release",
			label: "v0.1.0",
			title: "Segmented control added to manifest",
			body: "InteropSegmentedControl is a fieldset-based group with roving tabindex keyboard navigation. An animated selection pill tracks the active segment via CSS anchor positioning — no JavaScript layout.",
		},
		{
			type: "note",
			label: "Keyboard",
			body: "The control is a single Tab stop. Arrow keys move focus and change selection. Home/End jump to first/last segment.",
		},
	];
}
