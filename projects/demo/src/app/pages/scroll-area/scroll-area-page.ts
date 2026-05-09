import { Component, ChangeDetectionStrategy } from "@angular/core";
import { InteropScrollArea, InteropTable, InteropCellDef, type TableColumn } from 'interop';
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
	selector: "scroll-area-page",
	standalone: true,
	imports: [InteropScrollArea, InteropTable, InteropCellDef, DemoSection, DemoExample, DemoNotes],
	templateUrl: "./scroll-area-page.html",
	styleUrl: "./scroll-area-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollAreaPage {
	logEntries = Array.from({ length: 30 }, (_, i) => ({
		time: `0${String(Math.floor(i * 8 / 60)).padStart(2, '0')}:${String((i * 8) % 60).padStart(2, '0')}`,
		message: [
			'Reactor output nominal',
			'Hull integrity 100%',
			'Course correction applied',
			'Comms relay synced',
			'Fuel reserves at 68%',
		][i % 5],
	}));

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ name: "orientation", type: "'vertical' | 'horizontal' | 'both' | undefined", default: "undefined", description: "Scroll direction(s) to enable. Defaults to vertical." },
		{ name: "ariaLabel", type: "string", default: "''", description: "Accessible label for the scrollable region." },
		{ name: "tabIndex", type: "number | null | undefined", default: "undefined", description: "Tab index for the scrollable container." },
		{ name: "showShadows", type: "boolean | undefined", default: "undefined", description: "When true, inset shadows indicate overflowing content beyond the visible edges." },
		{ name: "shadowThreshold", type: "number | undefined", default: "undefined", description: "Scroll distance in pixels before shadow indicators appear." },
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{ name: "scrollState", type: "ScrollStateEvent", default: "", description: "Emitted on scroll with state flags: atTop, atBottom, atStart, atEnd." },
		{ name: "overflowChange", type: "boolean", default: "", description: "Emitted when the overflow state changes — useful for conditional UI updates." },
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Scroll area added to manifest',
			body: 'InteropScrollArea wraps overflowing content in a constrained scrollable region. Supports vertical, horizontal, and both orientations with optional scroll-shadow indicators.',
		},
	];
}
