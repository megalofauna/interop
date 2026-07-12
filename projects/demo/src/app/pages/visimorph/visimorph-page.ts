import { Component, ChangeDetectionStrategy } from "@angular/core";
import { InteropVisimorph, InteropTable, InteropCellDef, type TableColumn } from 'interop';
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
	selector: "visimorph-page",
	standalone: true,
	imports: [InteropVisimorph, InteropTable, InteropCellDef, DemoSection, DemoExample, DemoNotes, DemoMasthead],
	templateUrl: "./visimorph-page.html",
	styleUrl: "./visimorph-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisiMorphPage {
	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ name: "type", type: "'radio' | 'checkbox' | 'toggle'", default: "—", description: "Required. Control type reflected to the itx-visimorph host attribute for CSS styling.", required: true },
		{ name: "checked", type: "boolean", default: "false", description: "Checked/selected state. Reflects to data-checked (checkbox/toggle) or data-selected (radio)." },
		{ name: "disabled", type: "boolean", default: "false", description: "Disabled state. Reflects to data-disabled." },
		{ name: "indeterminate", type: "boolean", default: "false", description: "Indeterminate state (checkbox only). Reflects to data-indeterminate." },
		{ name: "focused", type: "boolean", default: "false", description: "Focus ring state. The parent control tracks and passes this in." },
	];

	notes: DemoNote[] = [
		{
			type: "note",
			label: "Internal use",
			body: "InteropVisimorph is an internal visual layer used by InteropCheckbox, InteropRadioControl, and InteropToggle. Consumers do not instantiate it directly — it is wired by the parent control.",
		},
		{
			type: "note",
			label: "Theming",
			body: "All visual properties (size, accent color, border, check icon) are driven by --itx-control-* tokens. Override at any ancestor to retheme all control types simultaneously.",
		},
	];
}
