import { Component, ChangeDetectionStrategy } from "@angular/core";
import { InteropTable, InteropCellDef, type TableColumn } from "src/public-api";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";

interface CargoEntry {
	id: string;
	description: string;
	qty: number;
	bay: string;
	status: 'loaded' | 'pending' | 'quarantine';
}

interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "table-page",
	standalone: true,
	imports: [InteropTable, InteropCellDef, DemoSection, DemoExample, DemoNotes],
	templateUrl: "./table-page.html",
	styleUrl: "./table-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePage {
	columns: TableColumn<CargoEntry>[] = [
		{ key: 'id', label: 'Item ID' },
		{ key: 'description', label: 'Description' },
		{ key: 'qty', label: 'Qty' },
		{ key: 'bay', label: 'Bay' },
		{ key: 'status', label: 'Status' },
	];

	cargoManifest: CargoEntry[] = [
		{ id: 'PLX-001', description: 'Plasma conduit', qty: 4, bay: 'A1', status: 'loaded' },
		{ id: 'MAG-008', description: 'Mag-lock coupling', qty: 8, bay: 'A2', status: 'loaded' },
		{ id: 'HUL-002', description: 'Hull epoxy Type-7', qty: 2, bay: 'B1', status: 'pending' },
		{ id: 'EVA-006', description: 'EVA tether', qty: 6, bay: 'B2', status: 'loaded' },
		{ id: 'RAD-009', description: 'Rad shielding panel', qty: 9, bay: 'C1', status: 'quarantine' },
	];

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ name: "collection", type: "InteropCollectionInput<T>", default: "—", description: "Data collection to render. Accepts an array, Observable, or Promise." },
		{ name: "columns", type: "TableColumn<T>[] | null", default: "null", description: "Column definitions. Each entry has key (field name) and label (header text)." },
		{ name: "trackBy", type: "'auto' | 'index' | TrackByFunction<T>", default: "'auto'", description: "Row identity tracking strategy for change detection." },
		{ name: "trackByField", type: "keyof T | null", default: "null", description: "Field name to use for identity tracking when trackBy is 'auto'." },
		{ name: "showHeaders", type: "boolean", default: "true", description: "Whether to render the table header row." },
		{ name: "emptyText", type: "string", default: "'No data available'", description: "Text displayed when the collection is empty." },
		{ name: "loadingText", type: "string", default: "'Loading...'", description: "Text displayed while the collection is loading." },
		{ name: "autoColumns", type: "boolean", default: "true", description: "When true and no [columns] are provided, columns are auto-generated from the data keys." },
		{ name: "maxRows", type: "number | null", default: "null", description: "Maximum number of rows to render. No limit when null." },
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Table component added to manifest',
			body: 'InteropTable renders structured data with auto-generated columns from [columns] definitions. Custom cell templates can be provided via itxCell.',
		},
		{
			type: 'note',
			label: 'Custom cells',
			body: 'Use <ng-template itxCell="key" let-entry> to override any column\'s cell rendering with custom markup.',
		},
	];
}
