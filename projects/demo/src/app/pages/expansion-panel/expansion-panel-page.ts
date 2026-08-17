import {
	Component,
	ChangeDetectionStrategy,
	computed,
	signal,
} from "@angular/core";
import {
	InteropExpansionPanel,
	InteropExpansionTrigger,
	InteropExpansionBody,
	InteropAccordion,
	InteropTable,
	InteropCellDef,
	type TableColumn,
	type TableGroupRow,
	CodeBlock,
	type CodeFile,
	Terminal,
	type TerminalEntry,
} from "interop";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

interface ApiInputRow {
	component: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

interface ApiOutputRow {
	component: string;
	name: string;
	type: string;
	description: string;
}

type ApiInputEntry = TableGroupRow | ApiInputRow;
type ApiOutputEntry = TableGroupRow | ApiOutputRow;

@Component({
	selector: "expansion-panel-page",
	standalone: true,
	imports: [
		InteropExpansionPanel,
		InteropExpansionTrigger,
		InteropExpansionBody,
		InteropAccordion,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		Terminal,
		DemoSection,
		DemoExample,
		DemoMasthead,
	],
	templateUrl: "./expansion-panel-page.html",
	styleUrl: "./expansion-panel-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpansionPanelPage {
	// ── Controlled example state ─────────────────────────────────────────────

	readonly reactorOpen = signal(false);
	readonly reactorLog = signal<TerminalEntry[]>([]);

	onReactorExpandedChange(next: boolean) {
		this.reactorOpen.set(next);
		this.reactorLog.update((log) => [
			...log,
			{ text: next ? "expanded" : "collapsed", time: Date.now() },
		]);
	}

	// ── Code snippets ────────────────────────────────────────────────────────

	readonly singleCode = `<interop-expansion-panel>
  <h3><button interop-expansion-trigger>Docking procedure</button></h3>
  <div interop-expansion-body>
    <p>Reduce speed to 10 m/s, extend mag-lock clamps…</p>
  </div>
</interop-expansion-panel>`;

	readonly defaultOpenCode = `<interop-expansion-panel [expanded]="true">
  <h3><button interop-expansion-trigger>Emergency protocols</button></h3>
  <div interop-expansion-body>
    <p>In the event of hull breach: seal bulkheads…</p>
  </div>
</interop-expansion-panel>`;

	readonly disabledCode = `<interop-expansion-panel [disabled]="true">
  <h3><button interop-expansion-trigger>Reactor core (locked)</button></h3>
  <div interop-expansion-body>
    <p>Requires level 4 clearance.</p>
  </div>
</interop-expansion-panel>`;

	readonly peekCode = `<!-- peek keeps a slice of the body visible while collapsed,
     fading it out at the bottom edge -->
<interop-expansion-panel>
  <h3><button interop-expansion-trigger>Flight log</button></h3>
  <div interop-expansion-body [peek]="true">
    <p>Cycle 4471 — departed Ceres Station at 0600…</p>
  </div>
</interop-expansion-panel>`;

	readonly exclusiveCode = `<!-- exclusive is the default: opening one panel closes the others -->
<interop-accordion>
  <interop-expansion-panel>
    <h3><button interop-expansion-trigger>Navigation systems</button></h3>
    <div interop-expansion-body><p>Inertial nav array…</p></div>
  </interop-expansion-panel>

  <interop-expansion-panel>
    <h3><button interop-expansion-trigger>Life support</button></h3>
    <div interop-expansion-body><p>O2 at 21%…</p></div>
  </interop-expansion-panel>
</interop-accordion>`;

	readonly multipleCode = `<interop-accordion [exclusive]="false">
  <interop-expansion-panel>
    <h3><button interop-expansion-trigger>Cargo manifest</button></h3>
    <div interop-expansion-body><p>47 items on manifest…</p></div>
  </interop-expansion-panel>

  <interop-expansion-panel>
    <h3><button interop-expansion-trigger>Crew roster</button></h3>
    <div interop-expansion-body><p>Commander Reyes…</p></div>
  </interop-expansion-panel>
</interop-accordion>`;

	private readonly controlledHtml = `<interop-expansion-panel
  [expanded]="reactorOpen()"
  (expandedChange)="onReactorExpandedChange($event)">
  <h3><button interop-expansion-trigger>Reactor telemetry</button></h3>
  <div interop-expansion-body>
    <p>Core temperature 3,200 K…</p>
  </div>
</interop-expansion-panel>`;

	private readonly controlledTs = `readonly reactorOpen = signal(false);

onReactorExpandedChange(next: boolean) {
  this.reactorOpen.set(next);
  // …persist, log, or veto the change here
}`;

	readonly controlledFiles = computed<CodeFile[]>(() => [
		{ label: "template.html", language: "html", code: this.controlledHtml },
		{ label: "component.ts", language: "ts", code: this.controlledTs },
	]);

	// ── API — inputs ─────────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiInputEntry>[] = [
		{ key: "component", label: "Component", sticky: true },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiInputEntry[] = [
		{
			component: "interop-expansion-panel",
			name: "expanded",
			type: "boolean",
			default: "false",
			description:
				"Two-way bindable expanded state. Use [(expanded)] to drive the panel from the parent, or leave it unbound to let the panel manage its own state.",
		},
		{
			component: "interop-expansion-panel",
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Prevents the panel from being opened or closed.",
		},
		{
			component: "[interop-expansion-body]",
			name: "peek",
			type: "boolean",
			default: "false",
			description:
				"Keeps a fixed slice of the body visible while collapsed, faded out at the bottom edge. Height and fade are set by --itx-expansion-panel-body-peek-height and -peek-fade-height.",
		},
		{
			component: "interop-accordion",
			name: "exclusive",
			type: "boolean",
			default: "true",
			description:
				"When true, opening one panel automatically closes all others. Set false to allow multiple open simultaneously.",
		},
	];

	// ── API — outputs ────────────────────────────────────────────────────────

	outputColumns: TableColumn<ApiOutputEntry>[] = [
		{ key: "component", label: "Component", sticky: true },
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiOutputEntry[] = [
		{
			component: "interop-expansion-panel",
			name: "expandedChange",
			type: "boolean",
			description:
				"Emitted whenever the panel opens or closes, including when an accordion closes it. Paired with [expanded] as the model() two-way binding.",
		},
	];
}
