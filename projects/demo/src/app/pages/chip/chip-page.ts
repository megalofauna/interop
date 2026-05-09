import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import { JsonPipe } from "@angular/common";
import {
	InteropChipList,
	InteropChipItem,
	InteropChipFilter,
	InteropChipOption,
	InteropTable,
	InteropCellDef,
	type TableColumn,
} from 'interop';
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";
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
	selector: "chip-page",
	standalone: true,
	imports: [
		JsonPipe,
		InteropChipList,
		InteropChipItem,
		InteropChipFilter,
		InteropChipOption,
		InteropTable,
		InteropCellDef,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
		DemoNotes,
	],
	templateUrl: "./chip-page.html",
	styleUrl: "./chip-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipPage {
	cargoTags = signal(['plasma-conduit', 'mag-lock', 'hull-epoxy']);

	removeTag(tag: string) {
		this.cargoTags.update(tags => tags.filter(t => t !== tag));
	}

	activeFilters = signal<string[]>(['hazmat', 'priority']);

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component" },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ component: "chip-list", name: "disabled", type: "boolean", default: "false", description: "Whether the entire list is in a disabled presentation state." },
		{ component: "chip-item", name: "label", type: "string", default: "—", description: "Required. Accessible label for this chip.", required: true },
		{ component: "chip-item", name: "removable", type: "boolean", default: "false", description: "When true, renders a remove button inside the chip." },
		{ component: "chip-item", name: "disabled", type: "boolean", default: "false", description: "Disables the remove button." },
		{ component: "chip-filter", name: "label", type: "string", default: "—", description: "Required. Accessible label rendered as a fieldset legend.", required: true },
		{ component: "chip-filter", name: "labelHidden", type: "boolean", default: "false", description: "When true, the legend is visually hidden but remains accessible." },
		{ component: "chip-filter", name: "value", type: "string[]", default: "[]", description: "Currently selected values in controlled mode." },
		{ component: "chip-filter", name: "disabled", type: "boolean", default: "false", description: "Disables all filter options." },
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component" },
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{ component: "chip-item", name: "removed", type: "void", default: "", description: "Emitted when the chip's remove button is clicked." },
		{ component: "chip-filter", name: "valueChange", type: "string[]", default: "", description: "Emitted when the selected filter values change." },
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Chip components added to manifest',
			body: 'Three chip patterns: InteropChipList (read-only tags), InteropChipFilter (multi-select checkboxes), and InteropChipInput (free-form entry). Each is built on native HTML — no ARIA listbox or grid.',
		},
		{
			type: 'note',
			label: 'Semantics',
			body: 'Filter chips are checkboxes inside a fieldset, not ARIA listbox/option. This gives correct keyboard behavior and screen reader announcements across all platforms for free.',
		},
	];
}
