import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import { InteropToggle, InteropTable, InteropCellDef, type TableColumn } from 'interop';
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "toggle-page",
	standalone: true,
	imports: [InteropToggle, InteropTable, InteropCellDef, DemoSection, DemoExample, DemoState, DemoStateItem, DemoNotes, DemoMasthead],
	templateUrl: "./toggle-page.html",
	styleUrl: "./toggle-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TogglePage {
	gravityOn = signal(false);
	shieldsOn = signal(true);
	lifeSupportOn = signal(true);

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			name: "id",
			type: "string",
			default: "—",
			description: "Required. Unique identifier wired to the native checkbox input.",
			required: true,
		},
		{
			name: "checked",
			type: "boolean",
			default: "false",
			description: "Whether the toggle is currently on.",
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Whether the toggle is disabled.",
		},
		{
			name: "required",
			type: "boolean",
			default: "false",
			description: "Whether the toggle is required for form validation.",
		},
		{
			name: "name",
			type: "string | null",
			default: "null",
			description: "Name attribute forwarded to the native input for form submission.",
		},
		{
			name: "value",
			type: "string | number | boolean",
			default: "'on'",
			description: "The value submitted with the form when the toggle is on.",
		},
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{
			name: "checkedChange",
			type: "boolean",
			default: "",
			description: "Emitted when the toggle's on/off state changes.",
		},
		{
			name: "valueChange",
			type: "string | number | boolean",
			default: "",
			description: "Emitted with the toggle value when switched on.",
		},
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Toggle component added to manifest',
			body: 'InteropToggle renders as a native checkbox with role="switch". Screen readers announce "on" / "off" rather than "checked" / "unchecked" — matching the physical switch affordance.',
		},
		{
			type: 'note',
			label: 'Binary only',
			body: 'A switch is binary by definition. For three-state controls, use interop-checkbox with the indeterminate input instead.',
		},
	];
}
