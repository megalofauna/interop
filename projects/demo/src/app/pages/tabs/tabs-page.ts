import { Component, ChangeDetectionStrategy } from "@angular/core";
import { InteropTabs, InteropTabPanel, InteropTable, InteropCellDef, type TableColumn } from 'interop';
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

interface ApiEntry {
	component?: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "tabs-page",
	standalone: true,
	imports: [InteropTabs, InteropTabPanel, InteropTable, InteropCellDef, DemoSection, DemoExample, DemoNotes, DemoMasthead],
	templateUrl: "./tabs-page.html",
	styleUrl: "./tabs-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsPage {
	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component" },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ component: "interop-tabs", name: "active", type: "string | null", default: "null", description: "Two-way bindable key of the currently active panel." },
		{ component: "interop-tabs", name: "ariaLabel", type: "string | null", default: "null", description: "aria-label for the generated tablist element." },
		{ component: "interop-tabs", name: "ariaLabelledBy", type: "string | null", default: "null", description: "aria-labelledby for the generated tablist element." },
		{ component: "interop-tabs", name: "orientation", type: "'horizontal' | 'vertical'", default: "'horizontal'", description: "Tab strip orientation." },
		{ component: "interop-tabs", name: "activationMode", type: "'auto' | 'manual'", default: "'auto'", description: "Auto: focus follows selection. Manual: arrow keys move focus; Enter/Space activates." },
		{ component: "interop-tabs", name: "activationId", type: "string | null", default: "null", description: "Optional ID to register with InteropActivation for external/programmatic tab switching." },
		{ component: "interop-tab-panel", name: "key", type: "string", default: "auto", description: "Unique key for this panel. Auto-generated when not provided." },
		{ component: "interop-tab-panel", name: "label", type: "string | null", default: "null", description: "Plain-text label for the tab button." },
		{ component: "interop-tab-panel", name: "destroyOnHide", type: "boolean", default: "false", description: "When true, panel content is destroyed when the panel becomes inactive." },
		{ component: "interop-tab-panel", name: "preRender", type: "boolean", default: "false", description: "When true, panel content renders immediately on init rather than on first activation." },
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Tabs component added to manifest',
			body: 'InteropTabs implements the ARIA tabs pattern with roving tabindex, auto/manual activation modes, and state-preserving panels (inactive tabs stay in the DOM with [hidden]).',
		},
		{
			type: 'note',
			label: 'Labels',
			body: 'Each tab-panel provides its own label via the [label] input or an <ng-template interop-tab-label> for rich content (icons, badges).',
		},
	];
}
