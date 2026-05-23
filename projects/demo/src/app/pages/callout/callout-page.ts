import { Component, ChangeDetectionStrategy } from "@angular/core";
import { InteropCallout, InteropTable, InteropCellDef, type TableColumn } from 'interop';
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
	selector: "callout-page",
	standalone: true,
	imports: [InteropCallout, InteropTable, InteropCellDef, CodeBlock, DemoSection, DemoExample, DemoNotes],
	templateUrl: "./callout-page.html",
	styleUrl: "./callout-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalloutPage {
	// ── Code strings ─────────────────────────────────────────────────────────

	readonly infoCode = `<interop-callout>
  Hull integrity check scheduled for 0600. All non-essential crew to standby.
</interop-callout>`;

	readonly headingCode = `<interop-callout type="info" heading="Docking protocol">
  Extend mag-lock clamps before engaging the docking collar.
  Verify pressure seal before releasing airlock.
</interop-callout>`;

	readonly warningCode = `<interop-callout type="warning" heading="Radiation zone">
  Sector 7-G is currently above safe exposure limits.
  EVA suits required beyond this point.
</interop-callout>`;

	readonly successCode = `<interop-callout type="success" heading="Cargo secured">
  All requisition items verified and locked in bay 4.
  Transit clearance granted.
</interop-callout>`;

	readonly dangerCode = `<interop-callout type="danger" heading="Hull breach detected">
  Emergency bulkhead engaged on deck 3.
  Evacuate immediately and await decompression protocol.
</interop-callout>`;

	// ── API table ────────────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			name: "type",
			type: "'info' | 'warning' | 'success' | 'danger'",
			default: "'info'",
			description: "Visual variant — determines the status color scheme applied to the callout.",
		},
		{
			name: "heading",
			type: "string | null",
			default: "null",
			description: "Optional heading text displayed above the body content.",
		},
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Callout component added to manifest',
			body: 'InteropCallout provides semantic status admonitions with full dark-mode support via status color tokens.',
		},
		{
			type: 'note',
			label: 'Accessibility',
			body: 'The host element carries role="note" by default. For critical alerts that should interrupt screen readers, swap in role="alert" via the host binding or a wrapper.',
		},
	];
}
