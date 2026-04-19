import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import { InteropRadioControl, InteropRadioRig, InteropTable, InteropCellDef, type RadioControl, type TableColumn } from "src/public-api";
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
	selector: "radio-page",
	standalone: true,
	imports: [
		InteropRadioControl,
		InteropRadioRig,
		InteropTable,
		InteropCellDef,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
		DemoNotes,
	],
	templateUrl: "./radio-page.html",
	styleUrl: "./radio-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioPage {
	dockingMode = signal<string | number | boolean>('auto');

	thrusterOptions: RadioControl[] = [
		{ id: 'thrust-low',  value: 'low',  label: 'Low burn (0.1g)', name: 'thruster' },
		{ id: 'thrust-mid',  value: 'mid',  label: 'Cruise (0.5g)',   name: 'thruster' },
		{ id: 'thrust-high', value: 'high', label: 'Full burn (1g)',   name: 'thruster' },
		{ id: 'thrust-off',  value: 'off',  label: 'Cut engines',      name: 'thruster', disabled: true },
	];
	selectedThruster = signal<string | number | boolean>('mid');

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component" },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ component: "interop-radio", name: "id", type: "string", default: "—", description: "Required. Unique identifier for the native radio input.", required: true },
		{ component: "interop-radio", name: "name", type: "string", default: "—", description: "Required. Radio group name — all controls sharing a name are mutually exclusive.", required: true },
		{ component: "interop-radio", name: "value", type: "string | number | boolean", default: "—", description: "Required. The value this radio represents when selected.", required: true },
		{ component: "interop-radio", name: "checked", type: "boolean", default: "false", description: "Whether this radio is currently selected." },
		{ component: "interop-radio", name: "disabled", type: "boolean", default: "false", description: "Whether the radio input is disabled." },
		{ component: "interop-radio", name: "required", type: "boolean", default: "false", description: "Whether the radio is required for form validation." },
		{ component: "interop-radio", name: "onActivate", type: "ActivationHandler | null", default: "null", description: "Local activation handler for this radio instance." },
		{ component: "interop-radio", name: "activationId", type: "string | null", default: "null", description: "Global activation ID for cross-component coordination." },
		{ component: "interop-radio-rig", name: "controls", type: "RadioControl[]", default: "—", description: "Required. Array of radio option definitions.", required: true },
		{ component: "interop-radio-rig", name: "value", type: "string | number | boolean | null", default: "null", description: "Currently selected value." },
		{ component: "interop-radio-rig", name: "name", type: "string", default: "—", description: "Shared name attribute applied to all generated radio inputs.", required: true },
		{ component: "interop-radio-rig", name: "legend", type: "string | null", default: "null", description: "Accessible group label rendered as a fieldset legend." },
		{ component: "interop-radio-rig", name: "disabled", type: "boolean", default: "false", description: "Disables all radio inputs in the group." },
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component" },
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{ component: "interop-radio", name: "checkedChange", type: "boolean", default: "", description: "Emitted when the radio's checked state changes." },
		{ component: "interop-radio", name: "valueChange", type: "string | number | boolean", default: "", description: "Emitted with the radio value when selected." },
		{ component: "interop-radio-rig", name: "valueChange", type: "string | number | boolean | null", default: "", description: "Emitted when the selected option changes." },
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Radio components added to manifest',
			body: 'InteropRadioControl and InteropRadioRig are available. The rig handles mutually exclusive selection and ControlValueAccessor wiring automatically.',
		},
		{
			type: 'note',
			label: 'Semantic usage',
			body: 'InteropRadioControl must be placed on a <label> element. The radio input is generated inside the label — no separate <input> is needed.',
		},
	];
}
