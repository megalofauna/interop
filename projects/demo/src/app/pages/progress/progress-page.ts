import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import {
	InteropProgress,
	InteropProgressLabel,
	InteropProgressStatus,
	InteropTable,
	InteropCellDef,
	type TableColumn,
} from "interop";
import { CodeBlock, type CodeFile } from "interop";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";

type TokenEntry = { property: string; default: string };

interface ApiEntry {
	/** Present because the surface spans three directives — see the sticky
	    leading column in apiColumns. */
	component?: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "progress-page",
	standalone: true,
	imports: [
		InteropProgress,
		InteropProgressLabel,
		InteropProgressStatus,
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
	templateUrl: "./progress-page.html",
	styleUrl: "./progress-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressPage {
	// ── Interactive state ────────────────────────────────────────────────
	uploadProgress = signal(40);
	readonly totalSteps = 7;
	currentStep = signal(3);
	syncProgress = signal(60);

	increment() {
		this.uploadProgress.update((v) => Math.min(v + 10, 100));
	}
	reset() {
		this.uploadProgress.set(0);
	}

	prevStep() {
		this.currentStep.update((s) => Math.max(s - 1, 1));
	}
	nextStep() {
		this.currentStep.update((s) => Math.min(s + 1, this.totalSteps));
	}

	syncIncrement() {
		this.syncProgress.update((v) => Math.min(v + 20, 100));
	}
	syncReset() {
		this.syncProgress.set(0);
	}

	// ── Code snippets ────────────────────────────────────────────────────

	readonly determinateCode = `<span interop-progress-label>Uploading firmware</span>
<progress interop-progress [value]="progress()" [max]="100"></progress>`;

	readonly indeterminateCode = `<span interop-progress-label>Connecting to relay</span>
<progress interop-progress [indeterminate]="true"></progress>`;

	readonly stepBasedTemplateCode = `<span interop-progress-label>Account setup</span>
<progress interop-progress
          [value]="currentStep()"
          [min]="1"
          [max]="totalSteps"
          [valueText]="currentStep() + ' of ' + totalSteps + ' steps complete'">
</progress>`;

	readonly stepBasedComponentCode = `readonly totalSteps = 7;
currentStep = signal(1);`;

	readonly sizeCode = `<progress interop-progress [value]="60" [max]="100"></progress>
<progress interop-progress itx-size="sm" [value]="60" [max]="100"></progress>`;

	readonly targetCode = `<!-- target wins when label and bar are not siblings -->
<span interop-progress-label target="cooling-bar">Coolant flow</span>
<p>Any amount of markup can sit between the label and its bar.</p>
<progress interop-progress id="cooling-bar" [value]="82" [max]="100"></progress>`;

	readonly verticalCode = `<progress interop-progress
          [value]="75"
          [orientation]="'vertical'"
          style="--itx-progress-length: 10rem"
          aria-label="Fuel reserve">
</progress>`;

	readonly statusTemplateCode = `<span interop-progress-label>Syncing data</span>
<progress interop-progress [value]="progress()" [max]="100"></progress>
<interop-progress-status>
  @if (progress() === 100) { Sync complete — all systems nominal. }
</interop-progress-status>`;

	// ── Code files ───────────────────────────────────────────────────────

	readonly stepBasedFiles: CodeFile[] = [
		{
			label: "template.html",
			language: "html",
			code: this.stepBasedTemplateCode,
		},
		{
			label: "component.ts",
			language: "ts",
			code: this.stepBasedComponentCode,
		},
	];

	// ── API tables ───────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Directive", sticky: true },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			component: "progress[interop-progress]",
			name: "value",
			type: "number",
			default: "0",
			description: "Current progress value. Must be between [min] and [max].",
		},
		{
			component: "progress[interop-progress]",
			name: "min",
			type: "number",
			default: "0",
			description:
				"Minimum value. Affects ARIA and fill normalization. The native progress element always starts at 0 visually.",
		},
		{
			component: "progress[interop-progress]",
			name: "max",
			type: "number",
			default: "100",
			description: "Maximum value.",
		},
		{
			component: "progress[interop-progress]",
			name: "indeterminate",
			type: "boolean",
			default: "false",
			description:
				"When true, omits aria-valuenow entirely so assistive technology announces in-progress rather than a percentage. Takes precedence over [value].",
		},
		{
			component: "progress[interop-progress]",
			name: "valueText",
			type: "string | null",
			default: "null",
			description:
				"Human-readable description of the current value, announced by screen readers instead of the raw number. Use for step-based or labelled-quantity progress.",
		},
		{
			component: "progress[interop-progress]",
			name: "orientation",
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			description:
				"Track orientation. Vertical mode uses writing-mode: vertical-lr.",
		},
	];

	// ── Attributes (not Angular inputs) ──────────────────────────────────

	attrColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Directive", sticky: true },
		{ key: "name", label: "Attribute" },
		{ key: "type", label: "Values" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	attrEntries: ApiEntry[] = [
		{
			component: "progress[interop-progress]",
			name: "itx-size",
			type: '"sm" | "md"',
			default: '"md"',
			description:
				"Track thickness. md is 8px, sm is 4px. A plain attribute rather than an input — it selects theme tokens and needs no component state.",
		},
		{
			component: "[interop-progress-label]",
			name: "target",
			type: "string (element id)",
			default: "next <progress>",
			description:
				"Id of the progress element to label. Omit it and the directive labels the next <progress> in document order, which covers the sibling case.",
		},
	];

	// ── CSS tokens ───────────────────────────────────────────────────────

	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		{
			property: "--itx-progress-track",
			default: "var(--itx-role-background-control)",
		},
		{
			property: "--itx-progress-fill",
			default: "var(--itx-role-background-colorway)",
		},
		{
			property: "--itx-progress-thickness",
			default: "var(--itx-spacing-2) — 8px (was --itx-progress-height)",
		},
		{
			property: "--itx-progress-length",
			default: "var(--itx-spacing-32) — 8rem, vertical only",
		},
		{ property: "--itx-progress-radius", default: "var(--itx-radius-none)" },
		{
			property: "--itx-progress-duration",
			default: "var(--itx-duration-fast)",
		},
		{
			property: "--itx-progress-easing",
			default: "var(--itx-easing-standard)",
		},
		{ property: "--itx-progress-indeterminate-duration", default: "1000ms" },
		{
			property: "--itx-progress-indeterminate-band",
			default: "30 (percent of track, unitless)",
		},
	];
}
