import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import { InteropDialog, InteropButton, InteropTable, InteropCellDef, type DialogClosedEvent, type TableColumn } from 'interop';
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
	selector: "dialog-page",
	standalone: true,
	imports: [InteropDialog, InteropButton, InteropTable, InteropCellDef, DemoSection, DemoExample, DemoState, DemoStateItem, DemoNotes],
	templateUrl: "./dialog-page.html",
	styleUrl: "./dialog-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogPage {
	basicOpen = signal(false);
	closeReason = signal<string>('—');

	onClosed(event: DialogClosedEvent) {
		this.basicOpen.set(false);
		this.closeReason.set(event.reason);
	}

	lockedOpen = signal(false);

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ name: "isOpen", type: "boolean", default: "false", description: "Controls whether the dialog is open. Changes trigger showModal() / close() on the native element." },
		{ name: "dismissOnBackdrop", type: "boolean", default: "true", description: "When true, clicking the ::backdrop area closes the dialog." },
		{ name: "disableEscape", type: "boolean", default: "false", description: "When true, pressing Escape does not close the dialog." },
		{ name: "autoFocus", type: "string | null", default: "null", description: "CSS selector for the element to focus when the dialog opens. Falls back to the first focusable element." },
		{ name: "returnFocus", type: "ElementRef | string | null", default: "null", description: "Where to return focus when the dialog closes." },
		{ name: "autoClose", type: "boolean", default: "false", description: "When true, the dialog closes automatically when a form inside it fires a submit event." },
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{ name: "closed", type: "DialogClosedEvent", default: "", description: "Emitted when the dialog closes. The event contains reason: 'backdrop' | 'escape' | 'programmatic' | 'form-submit'." },
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Dialog component added to manifest',
			body: 'InteropDialog is a directive on a native <dialog> element. Uses showModal() for top-layer promotion, correct focus trapping, and backdrop rendering via CSS ::backdrop.',
		},
		{
			type: 'note',
			label: 'Close reasons',
			body: 'The (closed) output emits a reason: "backdrop", "escape", "programmatic", or "form-submit". Always respond by setting [isOpen]="false" to keep signal state in sync.',
		},
	];
}
