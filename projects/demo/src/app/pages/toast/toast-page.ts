import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { InteropToastViewport, InteropToastService, InteropButton, InteropTable, InteropCellDef, type TableColumn } from 'interop';
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";

interface ApiEntry {
	component?: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "toast-page",
	standalone: true,
	imports: [InteropToastViewport, InteropButton, InteropTable, InteropCellDef, DemoSection, DemoExample, DemoNotes],
	templateUrl: "./toast-page.html",
	styleUrl: "./toast-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastPage {
	private readonly toast = inject(InteropToastService);

	showSuccess() {
		this.toast.success('Docking request approved. Bay 3 is yours.');
	}

	showError() {
		this.toast.error('Hull breach detected. Emergency bulkhead engaged.');
	}

	showInfo() {
		this.toast.show('Cargo manifest updated. 47 items verified.', { type: 'info' });
	}

	showWarning() {
		this.toast.show('Fuel reserves below 20%. Plot course to refuelling depot.', { type: 'warning' });
	}

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component" },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ component: "interop-toast-viewport", name: "position", type: "ToastPosition | undefined", default: "undefined", description: "Viewport position for the toast stack (e.g. 'top-right', 'bottom-center')." },
		{ component: "interop-toast-viewport", name: "maxVisible", type: "number | undefined", default: "undefined", description: "Maximum number of toasts visible simultaneously." },
		{ component: "interop-toast-viewport", name: "hotkey", type: "string | undefined", default: "undefined", description: "Keyboard shortcut to move focus to the toast region for screen reader navigation." },
		{ component: "InteropToastService", name: "show()", type: "ToastOptions", default: "—", description: "Show a toast with arbitrary type and content." },
		{ component: "InteropToastService", name: "success()", type: "string", default: "—", description: "Show a success toast." },
		{ component: "InteropToastService", name: "error()", type: "string", default: "—", description: "Show an error toast." },
		{ component: "InteropToastService", name: "observe()", type: "Observable<T>", default: "—", description: "Show a loading toast that transitions to success or error based on the observable outcome." },
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Toast component added to manifest',
			body: 'InteropToastService provides an imperative API (success, error, info, warning). Place one <interop-toast-viewport /> in your app shell to render queued toasts.',
		},
		{
			type: 'note',
			label: 'Async toasts',
			body: 'Use toast.observe(observable$, { loading, success, error }) to show a loading toast that transitions to success or error based on the observable\'s outcome.',
		},
	];
}
