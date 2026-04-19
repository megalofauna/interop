import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import { JsonPipe } from "@angular/common";
import { InteropListbox, InteropTable, InteropCellDef, type SelectControl, type TableColumn } from "src/public-api";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";

interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "listbox-page",
	standalone: true,
	imports: [JsonPipe, InteropListbox, InteropTable, InteropCellDef, DemoSection, DemoExample, DemoState, DemoStateItem, DemoNotes],
	templateUrl: "./listbox-page.html",
	styleUrl: "./listbox-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListboxPage {
	dockingBays: SelectControl[] = [
		{ value: 'bay-1', label: 'Bay 1 — Docking ring A' },
		{ value: 'bay-2', label: 'Bay 2 — Docking ring A' },
		{ value: 'bay-3', label: 'Bay 3 — Docking ring B' },
		{ value: 'bay-4', label: 'Bay 4 — Docking ring B', disabled: true },
		{ value: 'bay-5', label: 'Bay 5 — Cargo lock' },
	];
	selectedBay = signal<string | number | boolean | null>('bay-1');

	crewRoles: SelectControl[] = [
		{ value: 'pilot', label: 'Pilot' },
		{ value: 'navigator', label: 'Navigator' },
		{ value: 'engineer', label: 'Engineer' },
		{ value: 'medic', label: 'Medic' },
		{ value: 'gunner', label: 'Gunner', disabled: true },
	];
	selectedRoles = signal<(string | number | boolean)[]>(['pilot', 'navigator']);

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ name: "controls", type: "SelectControl[]", default: "[]", description: "Declarative option list. Each entry has value, label, and optional disabled." },
		{ name: "value", type: "SelectControlValue | SelectControlValue[] | null", default: "null", description: "Current selected value (single) or values (multi)." },
		{ name: "multiselectable", type: "boolean", default: "false", description: "Enables multi-select. Arrow keys move focus; Space toggles selection." },
		{ name: "disabled", type: "boolean", default: "false", description: "Disables the entire listbox." },
		{ name: "ariaLabel", type: "string | null", default: "null", description: "Accessible label when no visible label element is associated." },
		{ name: "ariaLabelledby", type: "string | null", default: "null", description: "ID of an external element that labels this listbox." },
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{ name: "valueChange", type: "SelectControlValue | SelectControlValue[] | null", default: "", description: "Emitted when the selected value(s) change." },
		{ name: "activeItemChange", type: "SelectControlValue | null", default: "", description: "Emitted when keyboard focus moves to a different option." },
		{ name: "closeRequest", type: "void", default: "", description: "Emitted when the listbox requests to close (e.g. Enter or Escape pressed). Useful when embedded in a dropdown." },
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Listbox added to manifest',
			body: 'InteropListbox is the foundational selection primitive. Single-select by default; set [multiselectable]="true" for multi. Implements ControlValueAccessor for forms integration.',
		},
		{
			type: 'note',
			label: 'Keyboard',
			body: 'Arrow keys move focus and selection in single mode. In multi-select, arrow keys move focus; Space toggles selection of the focused option.',
		},
	];
}
