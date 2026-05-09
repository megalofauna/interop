import { Component, ChangeDetectionStrategy, computed, inject, resource } from "@angular/core";
import {
	InteropStepper,
	InteropStepList,
	InteropStep,
	InteropStepPanel,
	InteropTable,
	InteropCellDef,
	type TableColumn,
} from 'interop';
import { CodeBlock, type CodeFile } from "@interop/composites";
import { HighlightService } from "../../services/highlight.service";
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
	selector: "stepper-page",
	standalone: true,
	imports: [
		InteropStepper,
		InteropStepList,
		InteropStep,
		InteropStepPanel,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoSection,
		DemoExample,
		DemoNotes,
	],
	templateUrl: "./stepper-page.html",
	styleUrl: "./stepper-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperPage {
	private readonly hl = inject(HighlightService);

	onFinish(id: string): void {
		console.log(`[stepper] finish — ${id}`);
	}

	// ── Code snippets ────────────────────────────────────────────────────────

	readonly linearHtml = `\
<interop-stepper
  #dockingStepper
  aria-label="Docking procedure"
  [cancellable]="true"
  [responsiveActions]="'md'"
  (cancel)="dockingStepper.reset()"
  (finish)="onFinish()">
  <ol interop-step-list>
    <li interop-step label="Approach"></li>
    <li interop-step label="Align"></li>
    <li interop-step label="Secure"></li>
  </ol>

  <section interop-step-panel>
    <h2>Approach</h2>
    <p>Reduce speed to 10 m/s and align approach vector with docking axis.</p>
  </section>
  <section interop-step-panel>
    <h2>Align</h2>
    <p>Extend mag-lock clamps. Match rotation with station ring.</p>
  </section>
  <section interop-step-panel>
    <h2>Secure</h2>
    <p>Engage hard dock. Verify pressure seal before opening airlock.</p>
  </section>
</interop-stepper>`;

	readonly linearTs = `\
onFinish(): void {
  // navigate away, show a success banner, etc.
  console.log('docking complete');
}`;

	readonly nonLinearHtml = `\
<interop-stepper
  aria-label="Vessel checklist"
  [linear]="false"
  [menu]="'always'"
  (finish)="onFinish()">
  <ol interop-step-list>
    <li interop-step label="Hull"></li>
    <li interop-step label="Engines"></li>
    <li interop-step label="Life support"></li>
    <li interop-step label="Comms"></li>
  </ol>

  <section interop-step-panel>
    <h2>Hull</h2>
    <p>Inspect hull plating for micro-fractures. Log any anomalies.</p>
  </section>
  <section interop-step-panel>
    <h2>Engines</h2>
    <p>Run engine diagnostics. Check thruster alignment and fuel lines.</p>
  </section>
  <section interop-step-panel>
    <h2>Life support</h2>
    <p>Verify O2 scrubbers, CO2 sensors, and pressure regulators.</p>
  </section>
  <section interop-step-panel>
    <h2>Comms</h2>
    <p>Test all comms channels. Confirm encryption keys are current.</p>
  </section>
</interop-stepper>`;

	readonly verticalHtml = `\
<interop-stepper aria-label="Setup wizard" orientation="vertical">
  <ol interop-step-list>
    <li interop-step label="Account"></li>
    <li interop-step label="Profile"></li>
    <li interop-step label="Confirm"></li>
  </ol>

  <section interop-step-panel>
    <h2>Account</h2>
    <p>Create your account credentials.</p>
  </section>
  <section interop-step-panel>
    <h2>Profile</h2>
    <p>Tell us a bit about yourself.</p>
  </section>
  <section interop-step-panel>
    <h2>Confirm</h2>
    <p>Review and confirm your selections.</p>
  </section>
</interop-stepper>`;

	// ── Highlighted tokens ───────────────────────────────────────────────────

	readonly linearHtmlTokens = resource({
		loader: () => this.hl.highlight(this.linearHtml, "html"),
	});

	readonly linearTsTokens = resource({
		loader: () => this.hl.highlight(this.linearTs, "typescript"),
	});

	readonly linearFiles = computed<CodeFile[]>(() => [
		{ label: "HTML", tokens: this.linearHtmlTokens.value() ?? null, lang: "html" },
		{ label: "TS", tokens: this.linearTsTokens.value() ?? null, lang: "typescript" },
	]);

	readonly nonLinearTokens = resource({
		loader: () => this.hl.highlight(this.nonLinearHtml, "html"),
	});

	readonly verticalTokens = resource({
		loader: () => this.hl.highlight(this.verticalHtml, "html"),
	});

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component", sticky: true },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			component: "interop-stepper",
			name: "activeStep",
			type: "number",
			default: "0",
			description: "Currently active step index (0-based). Two-way bindable.",
		},
		{
			component: "interop-stepper",
			name: "linear",
			type: "boolean",
			default: "true",
			description:
				"When true, steps must be completed in order. Future steps are locked until the user advances.",
		},
		{
			component: "interop-stepper",
			name: "orientation",
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			description:
				"Layout direction of the step indicator strip and the eventual scroll-snap viewport axis.",
		},
		{
			component: "interop-stepper",
			name: "ariaLabel",
			type: "string",
			default: "'Progress'",
			description:
				"Accessible label for the step indicator navigation landmark.",
		},
		{
			component: "interop-stepper",
			name: "icons",
			type: "Partial<Record<StepStatus, string>>",
			default: "{}",
			description: "Default icon name overrides applied to all steps.",
		},
		{
			component: "interop-stepper",
			name: "indicatorTemplate",
			type: "TemplateRef | null",
			default: "null",
			description: "Custom template for the step indicator circle content.",
		},
		{
			component: "interop-stepper",
			name: "actions",
			type: "boolean",
			default: "true",
			description:
				"Render the built-in action bar (menu | cancel ↔ back | next).",
		},
		{
			component: "interop-stepper",
			name: "cancellable",
			type: "boolean",
			default: "false",
			description: "Show the Cancel button on the left side of the action bar.",
		},
		{
			component: "interop-stepper",
			name: "cancelLabel",
			type: "string",
			default: "'Cancel'",
			description: "Label for the Cancel button.",
		},
		{
			component: "interop-stepper",
			name: "backLabel",
			type: "string",
			default: "'Back'",
			description: "Label for the Back button.",
		},
		{
			component: "interop-stepper",
			name: "nextLabel",
			type: "string",
			default: "'Next'",
			description: "Label for the Next button (when not on the last step).",
		},
		{
			component: "interop-stepper",
			name: "finishLabel",
			type: "string",
			default: "'Finish'",
			description:
				"Label for the Next button when on the last step. Activating it fires (finish).",
		},
		{
			component: "interop-stepper",
			name: "menu",
			type: "'auto' | 'always' | 'never'",
			default: "'auto'",
			description:
				"Menu trigger visibility. 'auto' = container query (≥600px hides it).",
		},
		{
			component: "interop-stepper",
			name: "menuLabel",
			type: "string",
			default: "'Steps'",
			description: "Accessible label for the menu trigger and the menu list.",
		},
		{
			component: "interop-stepper",
			name: "responsiveActions",
			type: "false | 'sm' | 'md' | 'lg'",
			default: "false",
			description:
				"Opt-in stacked action bar. Stacks full-width below 320 / 480 / 640px container width.",
		},
		{
			component: "li[interop-step]",
			name: "label",
			type: "string",
			default: "—",
			description: "Required. The step's visible label text.",
			required: true,
		},
		{
			component: "li[interop-step]",
			name: "status",
			type: "StepStatus | null",
			default: "null",
			description: "Overrides the auto-calculated step status.",
		},
		{
			component: "li[interop-step]",
			name: "optional",
			type: "boolean",
			default: "false",
			description: "Marks the step as optional.",
		},
		{
			component: "li[interop-step]",
			name: "icons",
			type: "Partial<Record<StepStatus, string>>",
			default: "{}",
			description:
				"Overrides default icon names for specific statuses on this step only.",
		},
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component" },
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{
			component: "interop-stepper",
			name: "activeStepChange",
			type: "number",
			default: "",
			description: "Emitted when the active step index changes.",
		},
		{
			component: "interop-stepper",
			name: "stepAttempt",
			type: "{ index: number; reason: 'locked' | 'bounds' }",
			default: "",
			description:
				"Emitted when a navigation attempt is blocked by linear lock or step bounds.",
		},
		{
			component: "interop-stepper",
			name: "cancel",
			type: "void",
			default: "",
			description: "Emitted when the Cancel button is activated.",
		},
		{
			component: "interop-stepper",
			name: "finish",
			type: "void",
			default: "",
			description: "Emitted when Next is activated on the last step.",
		},
	];

	notes: DemoNote[] = [
		{
			type: "release",
			label: "v0.1.x",
			title: "Built-in action bar + responsive menu",
			body: "InteropStepper now ships with an action bar (Back / Next, optional Cancel) and a popover-driven step menu. The menu is shown by default on narrow viewports (container query, ≥600px hides it) and can be forced on or off via [menu]. Project [interop-stepper-actions] to fully replace the bar.",
		},
		{
			type: "note",
			label: "Completion semantics",
			body: "Completion is irreversible by navigation alone — once you advance past a step, going back does not un-complete it. A dev-friendly cancellation API is on the roadmap.",
		},
	];
}
