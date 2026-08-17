import { Component, ChangeDetectionStrategy } from "@angular/core";
import {
	InteropList,
	InteropTable,
	InteropCellDef,
	InteropChipBadge,
	type TableColumn,
	type CodeFile,
} from "interop";
import { CodeBlock } from "interop";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "list-page",
	standalone: true,
	imports: [
		InteropList,
		InteropTable,
		InteropCellDef,
		InteropChipBadge,
		CodeBlock,
		DemoSection,
		DemoExample,
		DemoMasthead,
	],
	templateUrl: "./list-page.html",
	styleUrl: "./list-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPage {
	crewMembers = [
		"Commander Reyes",
		"Pilot Tanaka",
		"Navigator Osei",
		"Chief Engineer Voskov",
		"Dr. Mbeki",
	];

	launchSteps = [
		"Pressurise the docking collar",
		"Run pre-flight diagnostics",
		"Confirm trajectory with navigation",
		"Release the mag-lock couplings",
		"Initiate primary burn",
	];

	cargoItems = [
		{
			id: 1,
			label: "Plasma conduit (×4)",
			bay: "A2",
			mass: 96,
			status: "stowed",
		},
		{
			id: 2,
			label: "Mag-lock coupling (×8)",
			bay: "A2",
			mass: 44,
			status: "stowed",
		},
		{
			id: 3,
			label: "Hull epoxy Type-7 (×2)",
			bay: "B1",
			mass: 12,
			status: "hazmat",
		},
		{ id: 4, label: "EVA tether (×6)", bay: "B4", mass: 8, status: "loading" },
	];

	// ── Code snippets ────────────────────────────────────────────────────────
	readonly unorderedCode = `<ul interop-list [collection]="crewMembers"></ul>`;

	readonly orderedCode = `<ol interop-list [collection]="crewMembers"></ol>`;

	readonly filledCode = `<!-- tokens are space-separated: "filled" layers onto "enclosed" -->
<ol interop-list itx-marker="enclosed filled" [collection]="launchSteps"></ol>`;

	readonly containedCode = `<ul interop-list itx-variant="contained" [collection]="cargoItems"></ul>`;

	readonly enclosedCode = `<ol interop-list itx-marker="enclosed" [collection]="launchSteps"></ol>`;

	// The template supplies the item's CONTENTS. interop-list renders the <li>
	// around them — a template that provides its own nests a list item inside a
	// list item, which is what this example used to do.
	readonly templateHtml = `<ng-template #itemTpl let-item let-i="index" let-last="last">
  <div class="cargo">
    <span class="cargo__ord">{{ i + 1 }}</span>
    <div class="cargo__body">
      <span class="cargo__name">{{ item.label }}</span>
      <span class="cargo__meta">
        Bay {{ item.bay }} · {{ item.mass }} kg
        @if (last) { · last aboard }
      </span>
    </div>
    <span interop-chip-badge itx-size="sm" [attr.data-status]="item.status"
      >{{ item.status }}</span
    >
  </div>
</ng-template>

<ul interop-list [collection]="cargoItems" [listItemTemplate]="itemTpl"></ul>`;

	readonly templateTs = `cargoItems = [
  { id: 1, label: "Plasma conduit (×4)", bay: "A2", mass: 96, status: "stowed" },
  // …
];`;

	readonly templateFiles: CodeFile[] = [
		{ label: "markup.html", language: "html", code: this.templateHtml },
		{ label: "component.ts", language: "ts", code: this.templateTs },
	];

	readonly staticCode = `<ul interop-list>
  <li>Bay 1 — Docking ring A</li>
  <li>Bay 2 — Docking ring A</li>
  <li>Bay 3 — Docking ring B (reserved)</li>
  <li>Bay 4 — Offline for maintenance</li>
</ul>`;

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			name: "collection",
			type: "InteropCollectionInput<T>",
			default: "—",
			description:
				"Required. Array, Observable, or Promise of items to render.",
			required: true,
		},
		{
			name: "trackBy",
			type: "'auto' | 'index' | TrackByFunction<T>",
			default: "'auto'",
			description:
				"Determines how list items are tracked for change detection.",
		},
		{
			name: "trackByField",
			type: "keyof T | null",
			default: "null",
			description:
				"Field name to use for identity tracking when trackBy is 'auto'.",
		},
		{
			name: "listItemTemplate",
			type: "TemplateRef<any>",
			default: "—",
			description:
				"Custom template for rendering each list item. Receives $implicit (item) and index.",
		},
		{
			name: "attrsPreset",
			type: "PresetKey | null",
			default: "null",
			description:
				"Optional preset key to apply semantic conformity attributes to the list.",
		},
	];
}
