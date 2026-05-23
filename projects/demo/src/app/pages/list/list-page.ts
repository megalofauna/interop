import { Component, ChangeDetectionStrategy } from "@angular/core";
import { InteropList, InteropTable, InteropCellDef, type TableColumn } from 'interop';
import { CodeBlock } from "@interop/composites";
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
	selector: "list-page",
	standalone: true,
	imports: [InteropList, InteropTable, InteropCellDef, CodeBlock, DemoSection, DemoExample, DemoNotes],
	templateUrl: "./list-page.html",
	styleUrl: "./list-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPage {
	crewMembers = [
		'Commander Reyes',
		'Pilot Tanaka',
		'Navigator Osei',
		'Chief Engineer Voskov',
		'Dr. Mbeki',
	];

	cargoItems = [
		{ id: 1, label: 'Plasma conduit (×4)' },
		{ id: 2, label: 'Mag-lock coupling (×8)' },
		{ id: 3, label: 'Hull epoxy Type-7 (×2)' },
		{ id: 4, label: 'EVA tether (×6)' },
	];

	// ── Code snippets ────────────────────────────────────────────────────────
	readonly unorderedCode = `<ul interop-list [collection]="crewMembers"></ul>`;

	readonly orderedCode = `<ol interop-list [collection]="crewMembers"></ol>`;

	readonly templateCode = `<ng-template #itemTpl let-item>
  <li>{{ item.label }}</li>
</ng-template>

<ul interop-list [collection]="cargoItems" [listItemTemplate]="itemTpl"></ul>`;

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
		{ name: "collection", type: "InteropCollectionInput<T>", default: "—", description: "Required. Array, Observable, or Promise of items to render.", required: true },
		{ name: "trackBy", type: "'auto' | 'index' | TrackByFunction<T>", default: "'auto'", description: "Determines how list items are tracked for change detection." },
		{ name: "trackByField", type: "keyof T | null", default: "null", description: "Field name to use for identity tracking when trackBy is 'auto'." },
		{ name: "listItemTemplate", type: "TemplateRef<any>", default: "—", description: "Custom template for rendering each list item. Receives $implicit (item) and index." },
		{ name: "attrsPreset", type: "PresetKey | null", default: "null", description: "Optional preset key to apply semantic conformity attributes to the list." },
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'List component added to manifest',
			body: 'InteropList supports ul, ol, dl, and a standalone selector. Accepts a [collection] input (array, observable, or promise) or static projected content.',
		},
		{
			type: 'note',
			label: 'Templates',
			body: 'Provide a [listItemTemplate] ng-template for custom item rendering, receiving $implicit (item) and index.',
		},
	];
}
