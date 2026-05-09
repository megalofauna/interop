import { Component, ChangeDetectionStrategy } from "@angular/core";
import {
	InteropButton,
	InteropExpansionPanel,
	InteropExpansionTrigger,
	InteropExpansionBody,
	InteropAccordion,
	InteropTable,
	InteropCellDef,
	type TableColumn,
} from 'interop';
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import {
	DemoNotes,
	type DemoNote,
} from "../../components/demo-notes/demo-notes";

interface ApiEntry {
	component?: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "expansion-panel-page",
	standalone: true,
	imports: [
		InteropButton,
		InteropExpansionPanel,
		InteropExpansionTrigger,
		InteropExpansionBody,
		InteropAccordion,
		InteropTable,
		InteropCellDef,
		DemoSection,
		DemoExample,
		DemoNotes,
	],
	templateUrl: "./expansion-panel-page.html",
	styleUrl: "./expansion-panel-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpansionPanelPage {
	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component" },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			component: "interop-expansion-panel",
			name: "expanded",
			type: "boolean",
			default: "false",
			description: "Two-way bindable expanded state.",
		},
		{
			component: "interop-expansion-panel",
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Prevents the panel from being opened or closed.",
		},
		{
			component: "interop-accordion",
			name: "exclusive",
			type: "boolean",
			default: "true",
			description:
				"When true, opening one panel automatically closes all others. Set false to allow multiple open simultaneously.",
		},
	];

	notes: DemoNote[] = [
		{
			type: "release",
			label: "v0.1.0",
			title: "Expansion panel added to manifest",
			body: "InteropExpansionPanel works standalone or inside InteropAccordion for group coordination. The trigger button must be wrapped in a heading element to satisfy the APG accordion pattern.",
		},
		{
			type: "note",
			label: "Heading requirement",
			body: "The APG accordion pattern requires the trigger to live inside a heading element so the panel title is part of the document outline. A dev-mode warning fires on the trigger if no heading ancestor is found.",
		},
	];
}
