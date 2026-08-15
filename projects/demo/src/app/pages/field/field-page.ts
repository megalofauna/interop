import { ChangeDetectionStrategy, Component } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import {
	InteropFieldInput,
	InteropFieldTextarea,
	InteropFieldPrefix,
	InteropFieldSuffix,
	InteropButton,
	InteropTable,
	InteropCellDef,
	type TableColumn,
	CodeBlock,
	type CodeFile,
} from "interop";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";

type TokenEntry = { property: string; default: string };

interface ApiEntry {
	/** The surface spans two components plus two addon directives — hence the
	    sticky leading column in apiColumns. */
	component: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

interface AttrEntry {
	component: string;
	name: string;
	type: string;
	default: string;
	description: string;
}

@Component({
	selector: "field-page",
	standalone: true,
	imports: [
		ReactiveFormsModule,
		InteropFieldInput,
		InteropFieldTextarea,
		InteropFieldPrefix,
		InteropFieldSuffix,
		InteropButton,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoMasthead,
		DemoPage,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
	],
	templateUrl: "./field-page.html",
	styleUrl: "./field-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldPage {
	// ── Live state ───────────────────────────────────────────────────────

	/** Reactive-forms example. Validators drive the error list; the field
	    resolves each error key to a message on its own. */
	readonly email = new FormControl("not-an-address", {
		nonNullable: true,
		validators: [Validators.required, Validators.email],
	});

	readonly manifest = new FormControl("", {
		nonNullable: true,
		validators: [Validators.required, Validators.minLength(20)],
	});

	submit(): void {
		this.email.markAsTouched();
		this.manifest.markAsTouched();
	}

	reset(): void {
		this.email.reset();
		this.manifest.reset();
	}

	// ── Code — Input ─────────────────────────────────────────────────────

	readonly basicCode = `<interop-field-input
  id="callsign"
  label="Callsign"
  placeholder="e.g. Viper-7" />`;

	readonly requiredCode = `<interop-field-input
  id="destination"
  label="Destination"
  placeholder="Sector coordinates"
  [required]="true"
  [fieldNotes]="'Enter target sector in format A1-C3'" />`;

	readonly addonCode = `<interop-field-input
  id="fuel-cost"
  label="Fuel cost"
  type="number"
  placeholder="0">
  <span interop-field-prefix>⬡</span>
  <span interop-field-suffix>credits</span>
</interop-field-input>`;

	readonly disabledCode = `<interop-field-input
  id="vessel-id"
  label="Vessel ID"
  placeholder="Auto-assigned"
  [disabled]="true" />`;

	readonly readonlyCode = `<interop-field-input
  id="registry"
  label="Registry"
  [readonly]="true"
  [fieldNotes]="'Assigned at commissioning. Contact fleet command to amend.'" />`;

	// ── Code — Textarea ──────────────────────────────────────────────────

	readonly textareaCode = `<interop-field-textarea
  id="mission-brief"
  label="Mission briefing"
  [rows]="4"
  placeholder="Describe the mission objectives…" />`;

	readonly autoResizeCode = `<interop-field-textarea
  id="incident-log"
  label="Incident log"
  [required]="true"
  [autoResize]="true"
  [rows]="2"
  [fieldNotes]="'Grows as you type. All logs are transmitted to fleet command.'" />`;

	// ── Code — Validation ────────────────────────────────────────────────

	readonly formsHtml = `<form>
  <interop-field-input
    id="pilot-email"
    type="email"
    label="Pilot email"
    [required]="true"
    [formControl]="email"
    [errorMessages]="{ email: 'That is not a routable address.' }" />

  <interop-field-textarea
    id="cargo-manifest"
    label="Cargo manifest"
    [required]="true"
    [rows]="3"
    [formControl]="manifest"
    errorDisplay="all" />

  <button interop-button="primary" type="button" (click)="submit()">Submit</button>
  <button interop-button="secondary" type="button" (click)="reset()">Reset</button>
</form>`;

	readonly formsTs = `email = new FormControl("not-an-address", {
  nonNullable: true,
  validators: [Validators.required, Validators.email],
});

manifest = new FormControl("", {
  nonNullable: true,
  validators: [Validators.required, Validators.minLength(20)],
});

/** Errors default to showErrorsOn="touched", so a submit that has not
 *  visited every field still has to mark them. */
submit() {
  this.email.markAsTouched();
  this.manifest.markAsTouched();
}

reset() {
  this.email.reset();
  this.manifest.reset();
}`;

	readonly formsFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.formsHtml },
		{ label: "component.ts", language: "typescript", code: this.formsTs },
	];

	readonly manualHtml = `<interop-field-input
  id="cargo-mass"
  label="Cargo mass (kg)"
  type="number"
  [required]="true"
  [fieldErrors]="massErrors" />`;

	readonly manualTs = `/** No Angular Forms involved. Manual errors bypass the visibility
 *  gate entirely — they show the moment they are set, which is what
 *  you want for server-returned validation. */
massErrors = [
  { key: "max", message: "Exceeds bay capacity of 8,500 kg" },
];`;

	readonly manualFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.manualHtml },
		{ label: "component.ts", language: "typescript", code: this.manualTs },
	];

	readonly massErrors = [
		{ key: "max", message: "Exceeds bay capacity of 8,500 kg" },
	];

	// ── Code — Sizes ─────────────────────────────────────────────────────

	readonly sizesHtml = `<interop-field-input itx-size="sm" id="s" label="Small (32px)" />
<interop-field-input itx-size="md" id="m" label="Medium (40px)" />
<interop-field-input itx-size="lg" id="l" label="Large (48px)" />

<!-- A textarea reads the same token as its MINIMUM height, so it
     starts flush with an input beside it. -->
<interop-field-textarea itx-size="lg" id="t" label="Large textarea" />`;

	// ── In-section notes ─────────────────────────────────────────────────



	// ── CSS tokens ───────────────────────────────────────────────────────

	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		// Container
		{
			property: "--itx-field-gap",
			default: "var(--itx-spacing-1) — 4px",
		},
		// Label
		{ property: "--itx-field-label-color", default: "var(--itx-contrast-4)" },
		{ property: "--itx-field-label-font-size", default: "0.75rem" },
		{ property: "--itx-field-label-font-weight", default: "400" },
		{ property: "--itx-field-label-line-height", default: "1.3333" },
		{
			property: "--itx-field-label-gap",
			default: "var(--itx-spacing-1) — 4px, on top of --itx-field-gap",
		},
		{ property: "--itx-field-required-indicator", default: '" *"' },
		{
			property: "--itx-field-required-indicator-color",
			default: "var(--itx-danger-solid)",
		},
		// Control row
		{
			property: "--itx-field-height",
			default: "var(--itx-spacing-10) — 40px (minimum height on textarea)",
		},
		{
			property: "--itx-field-padding-inline",
			default: "var(--itx-spacing-4) — 16px",
		},
		{ property: "--itx-field-background", default: "var(--itx-surface-above)" },
		{
			property: "--itx-field-background-hover",
			default: "var(--itx-contrast-1)",
		},
		{ property: "--itx-field-underline-width", default: "1px" },
		{
			property: "--itx-field-underline-color",
			default: "var(--itx-contrast-4)",
		},
		{
			property: "--itx-field-border-radius",
			default: "var(--itx-radius-none) — 0",
		},
		{ property: "--itx-field-focus-color", default: "var(--itx-colorway-solid)" },
		{ property: "--itx-field-focus-width", default: "2px" },
		{ property: "--itx-field-invalid-color", default: "var(--itx-danger-solid)" },
		{ property: "--itx-field-invalid-icon-size", default: "1rem — 16px" },
		{
			property: "--itx-field-readonly-underline-color",
			default: "var(--itx-contrast-2)",
		},
		{ property: "--itx-field-disabled-color", default: "var(--itx-contrast-3)" },
		{
			property: "--itx-field-transition-duration",
			default: "var(--itx-duration-fast) — 100ms",
		},
		{
			property: "--itx-field-addon-gap",
			default: "var(--itx-spacing-2) — 8px",
		},
		{ property: "--itx-field-addon-color", default: "var(--itx-contrast-4)" },
		// Value text
		{
			property: "--itx-field-font-family",
			default: "var(--itx-font-family-sans)",
		},
		{ property: "--itx-field-font-size", default: "0.875rem — 14px" },
		{
			property: "--itx-field-line-height",
			default: "1.2857 on input, 1.4286 on textarea",
		},
		{ property: "--itx-field-color", default: "var(--itx-contrast-6)" },
		{
			property: "--itx-field-placeholder-color",
			default: "var(--itx-contrast-4)",
		},
		// Textarea only
		{
			property: "--itx-field-textarea-padding-block",
			default: "0.6875rem — 11px",
		},
		{
			property: "--itx-field-textarea-min-inline-size",
			default: "10rem — 160px",
		},
		{ property: "--itx-field-textarea-resize", default: "vertical" },
		// Notes / errors
		{ property: "--itx-field-note-color", default: "var(--itx-contrast-4)" },
		{ property: "--itx-field-note-font-size", default: "0.75rem — 12px" },
		{ property: "--itx-field-note-line-height", default: "1.3333" },
		{
			property: "--itx-field-notes-gap",
			default: "var(--itx-spacing-1) — 4px",
		},
		{ property: "--itx-field-error-color", default: "var(--itx-danger-solid)" },
		{ property: "--itx-field-error-font-size", default: "0.75rem — 12px" },
		{ property: "--itx-field-error-line-height", default: "1.3333" },
		{
			property: "--itx-field-errors-gap",
			default: "var(--itx-spacing-1) — 4px",
		},
	];

	// ── API ──────────────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component", sticky: true },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			component: "both",
			name: "id",
			type: "string",
			default: "—",
			description:
				"Required. Wired to the label's for attribute, the native element's id, and the generated note/error ids. Must be unique on the page — this is not validated.",
			required: true,
		},
		{
			component: "both",
			name: "label",
			type: "string",
			default: "—",
			description: "Required. Label text rendered above the control.",
			required: true,
		},
		{
			component: "both",
			name: "required",
			type: "boolean",
			default: "false",
			description:
				"Sets aria-required on the control and renders the required indicator after the label.",
		},
		{
			component: "both",
			name: "placeholder",
			type: "string",
			default: "''",
			description: "Forwarded to the native element.",
		},
		{
			component: "both",
			name: "disabled",
			type: "boolean",
			default: "false",
			description:
				"Forwarded to the native element. Note that programmatic control.disable() does not update this — the input is the source of truth.",
		},
		{
			component: "both",
			name: "readonly",
			type: "boolean",
			default: "false",
			description:
				"Forwarded to the native element. Drops the fill and softens the underline.",
		},
		{
			component: "both",
			name: "control",
			type: "AbstractControl | null",
			default: "null",
			description:
				"Explicit control reference for reading validation errors. Unnecessary with formControl / formControlName / ngModel, which are detected automatically.",
		},
		{
			component: "both",
			name: "fieldErrors",
			type: "FieldError | FieldError[] | null",
			default: "null",
			description:
				"Manual errors for consumers not using Angular Forms. Takes precedence over control-derived errors and bypasses the visibility gate entirely.",
		},
		{
			component: "both",
			name: "fieldNotes",
			type: "string | string[] | null",
			default: "null",
			description: "Helper text rendered below the control.",
		},
		{
			component: "both",
			name: "errorMessages",
			type: "ErrorMessages",
			default: "{}",
			description:
				"Per-field message overrides, keyed by validator name. Merged over INTEROP_ERROR_MESSAGES and the library defaults.",
		},
		{
			component: "both",
			name: "showErrorsOn",
			type: "'touched' | 'dirty' | 'immediate'",
			default: "'touched'",
			description:
				"When control-derived errors become visible. Manual fieldErrors ignore this.",
		},
		{
			component: "both",
			name: "errorDisplay",
			type: "'single' | 'all'",
			default: "'single'",
			description:
				"Show only the highest-priority error, or every active one stacked.",
		},
		{
			component: "interop-field-input",
			name: "type",
			type: "string",
			default: "'text'",
			description:
				'The type attribute on the native input. type="textarea" warns in dev mode — use interop-field-textarea.',
		},
		{
			component: "interop-field-textarea",
			name: "autoResize",
			type: "boolean",
			default: "false",
			description:
				"Grow the textarea to fit its content on every input event. Overrides rows once the user types.",
		},
		{
			component: "interop-field-textarea",
			name: "rows",
			type: "number | null",
			default: "null",
			description: "Visible text rows, forwarded to the native element.",
		},
	];

	attrColumns: TableColumn<AttrEntry>[] = [
		{ key: "component", label: "Component", sticky: true },
		{ key: "name", label: "Attribute" },
		{ key: "type", label: "Values" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	attrEntries: AttrEntry[] = [
		{
			component: "both",
			name: "itx-size",
			type: '"sm" | "md" | "lg"',
			default: '"md"',
			description:
				"Control height — 32 / 40 / 48px. On a textarea it sets the minimum height, since content decides the rest.",
		},
		{
			component: "[interop-field-prefix]",
			name: "—",
			type: "element or attribute",
			default: "—",
			description:
				"Static addon rendered inside the fill, before the control. aria-hidden — never put a button or link here.",
		},
		{
			component: "[interop-field-suffix]",
			name: "—",
			type: "element or attribute",
			default: "—",
			description:
				"Static addon rendered inside the fill, after the control. aria-hidden — never put a button or link here.",
		},
	];
}
