import {
	Component,
	ChangeDetectionStrategy,
	signal,
} from "@angular/core";
import { JsonPipe } from "@angular/common";
import {
	InteropCheckbox,
	InteropCheckboxRig,
	CheckboxOption,
	InteropTable,
	InteropCellDef,
	TableColumn,
	InteropCallout,
} from 'interop';
import { CodeBlock, type CodeFile } from "interop";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
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
	selector: "checkbox-page",
	standalone: true,
	imports: [
		JsonPipe,
		InteropCheckbox,
		InteropCheckboxRig,
		InteropTable,
		InteropCellDef,
		InteropCallout,
		CodeBlock,
		DemoSection,
		DemoExample,
		DemoNotes,
		DemoMasthead,
	],
	templateUrl: "./checkbox-page.html",
	styleUrl: "./checkbox-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxPage {
	// ── Interactive state for demos ──────────────────────────────────────
	barebonesChecked = signal(false);
	basicChecked = signal(false);
	disabledChecked = signal(true);

	// Indeterminate / select-all demo
	requisitionItems: CheckboxOption[] = [
		{ id: "plasma-conduit", value: "plasma-conduit", label: "Plasma conduit" },
		{ id: "mag-lock", value: "mag-lock", label: "Mag-lock coupling" },
		{ id: "hull-epoxy", value: "hull-epoxy", label: "Hull epoxy (Type-7)" },
		{ id: "eva-tether", value: "eva-tether", label: "EVA tether" },
	];
	selectedItems = signal<(string | number | boolean)[]>(["plasma-conduit"]);

	// ── Code snippets for demos ──────────────────────────────────────
	readonly basicCheckboxCode = `<label interop-checkbox id="agree" [(checked)]="accepted">
  Accept terms and conditions
</label>`;

	readonly disabledCheckboxCode = `<label interop-checkbox
       id="locked"
       [checked]="true"
       [disabled]="true">
  This option is locked
</label>`;

	readonly checkboxGroupCode = `<interop-checkbox-rig
  [options]="requisitionItems"
  [legend]="'Requisition order'"
  [selectAll]="true"
  [selectAllLabel]="'All items'"
  [(value)]="selectedItems"
/>`;

	readonly bareboniestCheckbox = `<label interop-checkbox
  id="bareboniest-checkbox"
  [(barebonesChecked)]="false">All you need</label>`;

	readonly toppingsDataCode = `requisitionItems: CheckboxOption[] = [
  { id: 'plasma-conduit', value: 'plasma-conduit', label: 'Plasma conduit' },
  { id: 'mag-lock',       value: 'mag-lock',       label: 'Mag-lock coupling' },
  { id: 'hull-epoxy',     value: 'hull-epoxy',     label: 'Hull epoxy (Type-7)' },
  { id: 'eva-tether',     value: 'eva-tether',     label: 'EVA tether' },
];

selectedItems = signal<string[]>(['plasma-conduit']);`;

	// ── Code files ─────────────────────────
	readonly groupFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.checkboxGroupCode },
		{ label: "component.ts", language: "ts", code: this.toppingsDataCode },
	];

	// ── API table data ──────────────────────────────────────────────────
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
			description: "Unique identifier for the checkbox input.",
			required: true,
		},
		{
			name: "checked",
			type: "boolean",
			default: "false",
			description: "Whether the checkbox is currently checked.",
		},
		{
			name: "indeterminate",
			type: "boolean",
			default: "false",
			description: "Sets the DOM-only indeterminate (mixed) state.",
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Whether the checkbox is disabled.",
		},
		{
			name: "required",
			type: "boolean",
			default: "false",
			description: "Whether the checkbox is required for form validation.",
		},
		{
			name: "name",
			type: "string | null",
			default: "null",
			description: "Optional name attribute for form submission.",
		},
		{
			name: "value",
			type: "string | number | boolean",
			default: "'on'",
			description: "The value this checkbox represents when checked.",
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
			description:
				"Emitted when the checked state changes. Provided automatically by the checked model.",
		},
		{
			name: "valueChange",
			type: "string | number | boolean",
			default: "",
			description: "Emitted with the checkbox value when checked.",
		},
		{
			name: "indeterminateChange",
			type: "boolean",
			default: "",
			description:
				"Emitted when indeterminate state changes (always false on user click).",
		},
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Checkbox components added to manifest',
			body: 'InteropCheckbox and InteropCheckboxRig are now available for cargo manifest operations. Supports bulk selection with automatic indeterminate state on partial loads.',
		},
		{
			type: 'bugfix',
			label: 'v0.1.1',
			body: 'Fixed indeterminate state not syncing correctly when a requisition order was rescanned mid-cycle.',
		},
		{
			type: 'note',
			label: 'Usage',
			body: 'For bulk requisition workflows, prefer InteropCheckboxRig over individual checkboxes — it handles select-all arbitration and ControlValueAccessor wiring automatically.',
		},
		{
			type: 'deprecated',
			label: 'v0.2.0',
			title: 'Legacy checked binding',
			body: 'Direct [checked] binding on the bare label element is deprecated in favor of the rig. Will be removed in v1.0.',
		},
	];
}
