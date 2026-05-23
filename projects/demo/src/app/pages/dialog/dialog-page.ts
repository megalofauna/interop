import {
	Component,
	ChangeDetectionStrategy,
	signal,
} from "@angular/core";
import {
	InteropDialog,
	InteropButton,
	InteropTable,
	InteropCellDef,
	type DialogClosedEvent,
	type TableColumn,
} from "interop";
import { CodeBlock, type CodeFile } from "@interop/composites";
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
	imports: [
		InteropDialog,
		InteropButton,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
		DemoNotes,
	],
	templateUrl: "./dialog-page.html",
	styleUrl: "./dialog-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogPage {
	basicOpen = signal(false);
	closeReason = signal<string>("—");

	onClosed(event: DialogClosedEvent) {
		this.basicOpen.set(false);
		this.closeReason.set(event.reason);
	}

	lockedOpen = signal(false);
	formOpen = signal(false);

	// ── Code snippets ────────────────────────────────────────────────────────

	readonly basicHtml = `\
<button interop-button="action-minus" (click)="basicOpen.set(true)">
  Open docking request
</button>

<dialog interop-dialog [isOpen]="basicOpen()" (closed)="onClosed($event)">
  <h2>Docking request</h2>
  <p>Vessel ID: UCS-7741 requests permission to dock at Bay 3.</p>
  <p>ETA: 14 minutes. Cargo: general supply run.</p>
  <div class="actions">
    <button interop-button="action" itx-size="md" (click)="basicOpen.set(false)">Deny</button>
    <button interop-button="action-plus" itx-size="md" (click)="basicOpen.set(false)">Approve</button>
  </div>
</dialog>`;

	readonly basicTs = `\
basicOpen = signal(false);
closeReason = signal<string>('—');

onClosed(event: DialogClosedEvent) {
  this.basicOpen.set(false);
  this.closeReason.set(event.reason);
}`;

	readonly lockedHtml = `\
<button interop-button (click)="lockedOpen.set(true)">
  Open locked dialog
</button>

<dialog
  interop-dialog
  [isOpen]="lockedOpen()"
  [disableEscape]="true"
  [dismissOnBackdrop]="false"
  (closed)="lockedOpen.set(false)"
>
  <h2>Emergency protocol</h2>
  <p>Hull breach detected on deck 3. Confirm evacuation order before proceeding.</p>
  <div class="actions">
    <button interop-button="action-plus" (click)="lockedOpen.set(false)">
      Confirm evacuation
    </button>
  </div>
</dialog>`;

	readonly lockedTs = `\
lockedOpen = signal(false);`;

	readonly autoCloseHtml = `\
<button interop-button (click)="formOpen.set(true)">
  File mission report
</button>

<dialog
  interop-dialog
  [isOpen]="formOpen()"
  [autoClose]="true"
  (closed)="formOpen.set(false)"
>
  <h2>Mission report</h2>
  <p>Submitting the form closes the dialog automatically.</p>
  <form>
    <label class="dialog-page__field">
      Summary
      <input type="text" name="summary" />
    </label>
    <div class="actions">
      <button interop-button="action-plus" type="submit">Submit report</button>
    </div>
  </form>
</dialog>`;

	readonly autoCloseTs = `\
formOpen = signal(false);`;

	// ── Code files ───────────────────────────────────────────────────────────

	readonly basicFiles: CodeFile[] = [
		{ label: "HTML", language: "html", code: this.basicHtml },
		{ label: "TS", language: "typescript", code: this.basicTs },
	];

	readonly lockedFiles: CodeFile[] = [
		{ label: "HTML", language: "html", code: this.lockedHtml },
		{ label: "TS", language: "typescript", code: this.lockedTs },
	];

	readonly autoCloseFiles: CodeFile[] = [
		{ label: "HTML", language: "html", code: this.autoCloseHtml },
		{ label: "TS", language: "typescript", code: this.autoCloseTs },
	];

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			name: "isOpen",
			type: "boolean",
			default: "false",
			description:
				"Controls whether the dialog is open. Changes trigger showModal() / close() on the native element.",
		},
		{
			name: "dismissOnBackdrop",
			type: "boolean",
			default: "true",
			description: "When true, clicking the ::backdrop area closes the dialog.",
		},
		{
			name: "disableEscape",
			type: "boolean",
			default: "false",
			description: "When true, pressing Escape does not close the dialog.",
		},
		{
			name: "autoFocus",
			type: "string | null",
			default: "null",
			description:
				"CSS selector for the element to focus when the dialog opens. Falls back to the first focusable element.",
		},
		{
			name: "returnFocus",
			type: "ElementRef | string | null",
			default: "null",
			description: "Where to return focus when the dialog closes.",
		},
		{
			name: "autoClose",
			type: "boolean",
			default: "false",
			description:
				"When true, the dialog closes automatically when a form inside it fires a submit event.",
		},
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{
			name: "closed",
			type: "DialogClosedEvent",
			default: "",
			description:
				"Emitted when the dialog closes. The event contains reason: 'backdrop' | 'escape' | 'programmatic' | 'form-submit'.",
		},
	];

	notes: DemoNote[] = [
		{
			type: "release",
			label: "v0.1.0",
			title: "Dialog component added to manifest",
			body: "InteropDialog is a directive on a native <dialog> element. Uses showModal() for top-layer promotion, correct focus trapping, and backdrop rendering via CSS ::backdrop.",
		},
		{
			type: "note",
			label: "Close reasons",
			body: 'The (closed) output emits a reason: "backdrop", "escape", "programmatic", or "form-submit". Always respond by setting [isOpen]="false" to keep signal state in sync.',
		},
		{
			type: "note",
			label: "autoClose + forms",
			body: 'Do not use <form method="dialog"> when [autoClose]="true". The browser closes the dialog before the directive\'s submit listener fires. Use a plain <form> with no method attribute.',
		},
	];
}
