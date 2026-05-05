import { Component, ChangeDetectionStrategy, computed, inject, resource, signal } from "@angular/core";
import { JsonPipe } from "@angular/common";
import {
	InteropListbox,
	InteropOption,
	InteropTable,
	InteropCellDef,
	type SelectControl,
	type TableColumn,
} from "src/public-api";
import { CodeBlock, type CodeFile } from "@interop/composites";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";
import { HighlightService } from "../../services/highlight.service";

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
	imports: [
		JsonPipe,
		InteropListbox,
		InteropOption,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
		DemoNotes,
	],
	templateUrl: "./listbox-page.html",
	styleUrl: "./listbox-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListboxPage {
	private readonly hl = inject(HighlightService);

	// ── Single-select demo ────────────────────────────────────────────────
	dockingBays: SelectControl[] = [
		{ value: 'bay-1', label: 'Bay 1 — Docking ring A' },
		{ value: 'bay-2', label: 'Bay 2 — Docking ring A' },
		{ value: 'bay-3', label: 'Bay 3 — Docking ring B' },
		{ value: 'bay-4', label: 'Bay 4 — Docking ring B', disabled: true },
		{ value: 'bay-5', label: 'Bay 5 — Cargo lock' },
	];
	selectedBay = signal<string | number | boolean | null>('bay-1');

	// ── Multi-select demo ─────────────────────────────────────────────────
	crewRoles: SelectControl[] = [
		{ value: 'pilot', label: 'Pilot' },
		{ value: 'navigator', label: 'Navigator' },
		{ value: 'engineer', label: 'Engineer' },
		{ value: 'medic', label: 'Medic' },
		{ value: 'gunner', label: 'Gunner', disabled: true },
	];
	selectedRoles = signal<(string | number | boolean)[]>(['pilot', 'navigator']);

	// ── Content projection demo ───────────────────────────────────────────
	selectedSector = signal<string | number | boolean | null>('alpha');

	// ── Code snippets ─────────────────────────────────────────────────────
	readonly singleSelectTemplate = `<ul interop-listbox
    aria-label="Docking bay"
    [controls]="dockingBays"
    [(value)]="selectedBay">
</ul>`;

	readonly singleSelectData = `dockingBays: SelectControl[] = [
  { value: 'bay-1', label: 'Bay 1 — Docking ring A' },
  { value: 'bay-2', label: 'Bay 2 — Docking ring A' },
  { value: 'bay-3', label: 'Bay 3 — Docking ring B' },
  { value: 'bay-4', label: 'Bay 4 — Docking ring B', disabled: true },
  { value: 'bay-5', label: 'Bay 5 — Cargo lock' },
];

selectedBay = signal<string | null>('bay-1');`;

	readonly multiSelectTemplate = `<ul interop-listbox
    aria-label="Crew manifest"
    [controls]="crewRoles"
    [multiselectable]="true"
    [(value)]="selectedRoles">
</ul>`;

	readonly multiSelectData = `crewRoles: SelectControl[] = [
  { value: 'pilot',     label: 'Pilot' },
  { value: 'navigator', label: 'Navigator' },
  { value: 'engineer',  label: 'Engineer' },
  { value: 'medic',     label: 'Medic' },
  { value: 'gunner',    label: 'Gunner', disabled: true },
];

selectedRoles = signal<string[]>(['pilot', 'navigator']);`;

	readonly projectionTemplate = `<ul interop-listbox aria-label="Sector" [(value)]="selectedSector">
  <li interop-option value="alpha" label="Sector Alpha">
    <span aria-hidden="true">▲</span>
    <span class="interop-option__label">Sector Alpha</span>
    <span class="interop-option__description">Operational</span>
  </li>
  <li interop-option value="bravo" label="Sector Bravo">
    <span aria-hidden="true">▼</span>
    <span class="interop-option__label">Sector Bravo</span>
    <span class="interop-option__description">Standby</span>
  </li>
  <li interop-option value="charlie" label="Sector Charlie" [disabled]="true">
    <span aria-hidden="true">●</span>
    <span class="interop-option__label">Sector Charlie</span>
    <span class="interop-option__description">Locked</span>
  </li>
</ul>`;

	// ── Highlighted tokens ────────────────────────────────────────────────
	readonly singleSelectTemplateTokens = resource({
		loader: () => this.hl.highlight(this.singleSelectTemplate, "html"),
	});
	readonly singleSelectDataTokens = resource({
		loader: () => this.hl.highlight(this.singleSelectData, "typescript"),
	});
	readonly multiSelectTemplateTokens = resource({
		loader: () => this.hl.highlight(this.multiSelectTemplate, "html"),
	});
	readonly multiSelectDataTokens = resource({
		loader: () => this.hl.highlight(this.multiSelectData, "typescript"),
	});
	readonly projectionTokens = resource({
		loader: () => this.hl.highlight(this.projectionTemplate, "html"),
	});

	readonly singleSelectFiles = computed<CodeFile[]>(() => [
		{ label: "template.html", language: "html", tokens: this.singleSelectTemplateTokens.value() ?? null },
		{ label: "component.ts", language: "ts", tokens: this.singleSelectDataTokens.value() ?? null },
	]);

	readonly multiSelectFiles = computed<CodeFile[]>(() => [
		{ label: "template.html", language: "html", tokens: this.multiSelectTemplateTokens.value() ?? null },
		{ label: "component.ts", language: "ts", tokens: this.multiSelectDataTokens.value() ?? null },
	]);

	// ── API tables ────────────────────────────────────────────────────────
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
		{
			type: 'note',
			label: 'Projection',
			body: 'For custom option markup beyond what SelectControl supports (icons, badges, multi-line content), project <li interop-option> children instead of using [controls].',
		},
	];
}
