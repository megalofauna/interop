import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import { InteropBadge, InteropButton, InteropTable, InteropCellDef, type TableColumn } from 'interop';
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";

interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "badge-page",
	standalone: true,
	imports: [
		InteropBadge,
		InteropButton,
		InteropTable,
		InteropCellDef,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
		DemoNotes,
	],
	templateUrl: "./badge-page.html",
	styleUrl: "./badge-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgePage {
	alertCount = signal(3);
	positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const;

	increment() { this.alertCount.update(n => n + 1); }
	reset() { this.alertCount.set(0); }

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			name: "count",
			type: "number | null",
			default: "null",
			description: "Numeric count to display. null hides the badge indicator entirely.",
		},
		{
			name: "max",
			type: "number",
			default: "99",
			description: "Display cap. When count exceeds this value, the indicator shows \"{max}+\".",
		},
		{
			name: "dot",
			type: "boolean",
			default: "false",
			description: "Render the indicator as a plain dot with no count text.",
		},
		{
			name: "hidden",
			type: "boolean",
			default: "false",
			description: "Hide the indicator visually and remove it from the accessibility tree.",
		},
		{
			name: "position",
			type: "'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'",
			default: "'top-right'",
			description: "Position of the indicator relative to the decorated element.",
		},
		{
			name: "accessibleLabel",
			type: "BadgeAccessibleLabel | null",
			default: "null",
			description: "Accessible label providing context for the badge count to screen readers.",
		},
		{
			name: "announce",
			type: "boolean",
			default: "false",
			description: "When true, count changes are announced through InteropAnnouncer as a live region update.",
		},
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Badge component added to manifest',
			body: 'InteropBadge wraps any element in a positioning context and overlays an absolutely-positioned counter. Supports count, dot, and hidden modes.',
		},
		{
			type: 'note',
			label: 'Accessibility',
			body: 'The visible indicator is aria-hidden. A visually-hidden sibling carries the accessible text and is wired to the first interactive child via aria-describedby. Always provide [accessibleLabel].',
		},
		{
			type: 'note',
			label: 'Position anchoring',
			body: 'Badge uses CSS anchor positioning internally. The host element receives anchor-name and the indicator uses position-anchor — no JavaScript positioning required.',
		},
	];
}
