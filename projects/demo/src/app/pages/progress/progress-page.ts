import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	resource,
	signal,
} from "@angular/core";
import {
	InteropProgress,
	InteropProgressLabel,
	InteropProgressStatus,
	InteropTable,
	InteropCellDef,
	type TableColumn,
} from "src/public-api";
import { CodeBlock, type CodeFile } from "@interop/composites";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";
import {
	DemoNotes,
	type DemoNote,
} from "../../components/demo-notes/demo-notes";
import { HighlightService } from "../../services/highlight.service";

interface ApiEntry {
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
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
		DemoNotes,
	],
	templateUrl: "./progress-page.html",
	styleUrl: "./progress-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressPage {
	private readonly hl = inject(HighlightService);

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

	// ── Highlighted tokens ───────────────────────────────────────────────

	readonly determinateTokens = resource({
		loader: () => this.hl.highlight(this.determinateCode, "html"),
	});

	readonly indeterminateTokens = resource({
		loader: () => this.hl.highlight(this.indeterminateCode, "html"),
	});

	readonly stepBasedTemplateTokens = resource({
		loader: () => this.hl.highlight(this.stepBasedTemplateCode, "html"),
	});

	readonly stepBasedComponentTokens = resource({
		loader: () => this.hl.highlight(this.stepBasedComponentCode, "typescript"),
	});

	readonly stepBasedFiles = computed<CodeFile[]>(() => [
		{
			label: "template.html",
			language: "html",
			tokens: this.stepBasedTemplateTokens.value() ?? null,
		},
		{
			label: "component.ts",
			language: "ts",
			tokens: this.stepBasedComponentTokens.value() ?? null,
		},
	]);

	readonly verticalTokens = resource({
		loader: () => this.hl.highlight(this.verticalCode, "html"),
	});

	readonly statusTokens = resource({
		loader: () => this.hl.highlight(this.statusTemplateCode, "html"),
	});

	// ── API tables ───────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			name: "value",
			type: "number",
			default: "0",
			description: "Current progress value. Must be between [min] and [max].",
		},
		{
			name: "min",
			type: "number",
			default: "0",
			description:
				"Minimum value. Affects ARIA and fill normalization. The native progress element always starts at 0 visually.",
		},
		{
			name: "max",
			type: "number",
			default: "100",
			description: "Maximum value.",
		},
		{
			name: "indeterminate",
			type: "boolean",
			default: "false",
			description:
				"When true, omits aria-valuenow entirely so assistive technology announces in-progress rather than a percentage. Takes precedence over [value].",
		},
		{
			name: "valueText",
			type: "string | null",
			default: "null",
			description:
				"Human-readable description of the current value, announced by screen readers instead of the raw number. Use for step-based or labelled-quantity progress.",
		},
		{
			name: "orientation",
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			description:
				"Track orientation. Vertical mode uses writing-mode: vertical-lr.",
		},
	];

	notes: DemoNote[] = [
		{
			type: "release",
			label: "v0.1.0",
			title: "Progress component added",
			body: "InteropProgress, InteropProgressLabel, and InteropProgressStatus are now available. Built on the native <progress> element for correct semantics and AT support.",
		},
		{
			type: "note",
			label: "Labelling",
			body: "Use <span interop-progress-label> adjacent to the progress element for auto-wired aria-labelledby. The <progress> element is not a labelable element — native <label for> is unreliable across AT. The directive handles the correct ARIA association.",
		},
		{
			type: "note",
			label: "Indeterminate ARIA",
			body: 'When [indeterminate]="true", aria-valuenow is omitted entirely — not set to 0 or 50. This is the spec-correct signal for an in-progress state with no known completion percentage.',
		},
		{
			type: "note",
			label: "Live regions",
			body: "The progress bar itself is intentionally silent to avoid spamming assistive technology on every value tick. Add <interop-progress-status> to announce at meaningful milestones such as completion or error.",
		},
	];
}
