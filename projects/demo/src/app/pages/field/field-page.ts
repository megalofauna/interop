import { Component, ChangeDetectionStrategy } from "@angular/core";
import {
	InteropFieldInput,
	InteropFieldTextarea,
	InteropFieldPrefix,
	InteropFieldSuffix,
	InteropTable,
	InteropCellDef,
	type TableColumn,
} from 'interop';
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
	selector: "field-page",
	standalone: true,
	imports: [
		InteropFieldInput,
		InteropFieldTextarea,
		InteropFieldPrefix,
		InteropFieldSuffix,
		InteropTable,
		InteropCellDef,
		DemoSection,
		DemoExample,
		DemoNotes,
	],
	templateUrl: "./field-page.html",
	styleUrl: "./field-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldPage {
	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ name: "id", type: "string", default: "—", description: "Required. Unique ID wired to the label's for attribute and the native element's id.", required: true },
		{ name: "label", type: "string", default: "—", description: "Required. Label text rendered above the field.", required: true },
		{ name: "type", type: "string", default: "'text'", description: "The type attribute forwarded to the native input element. (interop-field-input only)" },
		{ name: "required", type: "boolean", default: "false", description: "Whether the field is required." },
		{ name: "placeholder", type: "string", default: "''", description: "Placeholder text forwarded to the native element." },
		{ name: "disabled", type: "boolean", default: "false", description: "Whether the field is disabled." },
		{ name: "readonly", type: "boolean", default: "false", description: "Whether the field is read-only." },
		{ name: "control", type: "AbstractControl | null", default: "null", description: "Explicit AbstractControl reference for reading Angular Forms validation errors." },
		{ name: "fieldErrors", type: "FieldError | FieldError[] | null", default: "null", description: "Manual error input for consumers not using Angular Forms." },
		{ name: "fieldNotes", type: "string | string[] | null", default: "null", description: "Hint or helper text displayed below the field." },
		{ name: "errorMessages", type: "ErrorMessages", default: "{}", description: "Per-key error message overrides (e.g. { required: 'This field is required.' })." },
		{ name: "showErrorsOn", type: "'touched' | 'dirty' | 'always'", default: "'touched'", description: "When to display validation errors relative to user interaction." },
		{ name: "errorDisplay", type: "'single' | 'all'", default: "'single'", description: "Whether to show a single error at a time or all errors simultaneously." },
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Field components added to manifest',
			body: 'InteropFieldInput and InteropFieldTextarea render complete accessible form fields — label, input, notes, and validation errors — with automatic ARIA wiring.',
		},
		{
			type: 'note',
			label: 'Angular Forms',
			body: 'Both components implement ControlValueAccessor. Use formControl, formControlName, or ngModel and validation errors are resolved and displayed automatically.',
		},
		{
			type: 'note',
			label: 'Without forms',
			body: 'Pass [fieldErrors] directly to show errors without Angular Forms. Useful for server-side validation or custom validation logic.',
		},
	];
}
