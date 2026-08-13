import {
	ChangeDetectionStrategy,
	Component,
	inject,
	signal,
} from "@angular/core";
import {
	InteropTabs,
	InteropTabPanel,
	InteropTabLabel,
	InteropButton,
	InteropIcon,
	InteropTable,
	InteropCellDef,
	InteropActivation,
	provideInteropIcons,
	CodeBlock,
	type CodeFile,
	type TableColumn,
} from "interop";
import { TablerRoute } from "interop/lib/iconsets/tabler/outline/tabler-route";
import { TablerBolt } from "interop/lib/iconsets/tabler/outline/tabler-bolt";
import { TablerPackage } from "interop/lib/iconsets/tabler/outline/tabler-package";
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

interface OutputEntry {
	component?: string;
	name: string;
	type: string;
	description: string;
}

interface MethodEntry {
	component?: string;
	name: string;
	type: string;
	description: string;
}

interface DirectiveEntry {
	name: string;
	element: string;
	description: string;
}

@Component({
	selector: "tabs-page",
	standalone: true,
	imports: [
		InteropTabs,
		InteropTabPanel,
		InteropTabLabel,
		InteropButton,
		InteropIcon,
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
	providers: [provideInteropIcons(TablerRoute, TablerBolt, TablerPackage)],
	templateUrl: "./tabs-page.html",
	styleUrl: "./tabs-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsPage {
	private readonly activation = inject(InteropActivation);

	// ── Interactive state ────────────────────────────────────────────────────

	/** Drives the controlled example's `[(active)]` binding. */
	readonly activeSystem = signal<string>("engineering");

	select(key: string): void {
		this.activeSystem.set(key);
	}

	/** Drives the tabs registered under `activationId="ops-console"` from
	    outside the component tree — no template reference, no ViewChild. */
	jumpTo(key: string): void {
		this.activation.trigger("ops-console", key);
	}

	// ── Code snippets ────────────────────────────────────────────────────────
	// Literal strings on the class. Never assembled from live state: a snippet
	// that can drift from what it documents is worse than no snippet.

	readonly basicCode = `\
<section interop-tabs aria-label="Station systems">
  <section interop-tab-panel label="Navigation">
    <p>Heading 042 degrees, 0.4c, ETA 6h 14m.</p>
  </section>
  <section interop-tab-panel label="Engineering">
    <p>Reactor output 94%. Shields nominal.</p>
  </section>
  <section interop-tab-panel label="Cargo">
    <p>Bay utilisation 62%. Manifest 47 items.</p>
  </section>
</section>`;

	readonly controlledHtml = `\
<section interop-tabs [(active)]="activeSystem" aria-label="Station systems">
  <section interop-tab-panel key="navigation" label="Navigation">…</section>
  <section interop-tab-panel key="engineering" label="Engineering">…</section>
  <section interop-tab-panel key="cargo" label="Cargo">…</section>
</section>

<button interop-button="primary" (click)="select('cargo')">Show cargo</button>
<button interop-button="secondary" (click)="select('navigation')">Reset</button>`;

	readonly controlledTs = `\
readonly activeSystem = signal<string>("engineering");

select(key: string): void {
  this.activeSystem.set(key);
}`;

	readonly controlledFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.controlledHtml },
		{ label: "component.ts", language: "ts", code: this.controlledTs },
	];

	readonly activationHtml = `\
<section interop-tabs activationId="ops-console" aria-label="Ops console">
  <section interop-tab-panel key="navigation" label="Navigation">…</section>
  <section interop-tab-panel key="engineering" label="Engineering">…</section>
</section>

<!-- Anywhere in the app — no template reference, no ViewChild. -->
<button interop-button="primary" (click)="jumpTo('engineering')">
  Open engineering
</button>
<button interop-button="secondary" (click)="jumpTo('navigation')">
  Back to navigation
</button>`;

	readonly activationTs = `\
private readonly activation = inject(InteropActivation);

jumpTo(key: string): void {
  // The payload IS the panel key.
  this.activation.trigger("ops-console", key);
}`;

	readonly activationFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.activationHtml },
		{ label: "component.ts", language: "ts", code: this.activationTs },
	];

	readonly labelHtml = `\
<section interop-tabs aria-label="Station systems">
  <section interop-tab-panel key="navigation">
    <ng-template interop-tab-label>
      <interop-icon [size]="16" name="tabler-route" />
      Navigation
    </ng-template>
    <p>Heading 042 degrees, 0.4c, ETA 6h 14m.</p>
  </section>

  <section interop-tab-panel key="cargo">
    <ng-template interop-tab-label>
      <interop-icon [size]="16" name="tabler-package" />
      Cargo
      <span class="tabs-page__count">47</span>
    </ng-template>
    <p>Bay utilisation 62%.</p>
  </section>
</section>`;

	readonly labelTs = `\
// Register only the icons this page uses — never the whole set barrel.
providers: [provideInteropIcons(TablerRoute, TablerPackage)]`;

	readonly labelFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.labelHtml },
		{ label: "component.ts", language: "ts", code: this.labelTs },
	];

	readonly verticalCode = `\
<h3 id="crew-heading">Crew roster</h3>

<section interop-tabs orientation="vertical" ariaLabelledBy="crew-heading">
  <section interop-tab-panel label="Bridge">…</section>
  <section interop-tab-panel label="Engineering">…</section>
  <section interop-tab-panel label="Medical">…</section>
</section>`;

	readonly stateHtml = `\
<section interop-tabs aria-label="Panel lifecycle">
  <!-- Default: rendered on first activation, then kept forever. -->
  <section interop-tab-panel key="preserved" label="Preserved">
    <input type="text" placeholder="Type here, switch away, come back" />
  </section>

  <!-- Torn down every time you leave it. -->
  <section interop-tab-panel key="volatile" label="Destroy on hide"
           [destroyOnHide]="true">
    <input type="text" placeholder="This clears on every switch" />
  </section>

  <!-- Rendered at init, before it is ever selected. -->
  <section interop-tab-panel key="warm" label="Pre-rendered"
           [preRender]="true">
    <p>Already in the DOM before you clicked.</p>
  </section>
</section>`;

	readonly stateTs = `\
// Nothing to wire. destroyOnHide and preRender are the two escape hatches
// from the default, which is: lazy on first activation, preserved after.`;

	readonly stateFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.stateHtml },
		{ label: "component.ts", language: "ts", code: this.stateTs },
	];

	readonly manualCode = `\
<!-- auto (default): arrows move focus AND switch the panel -->
<section interop-tabs aria-label="Light panels">…</section>

<!-- manual: arrows move focus only; Enter or Space commits -->
<section interop-tabs activationMode="manual" aria-label="Heavy panels">
  <section interop-tab-panel label="Telemetry">…</section>
  <section interop-tab-panel label="Diagnostics">…</section>
  <section interop-tab-panel label="Archive">…</section>
</section>`;

	// ── In-section notes ─────────────────────────────────────────────────────


	// ── CSS tokens ───────────────────────────────────────────────────────────

	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		// Tablist
		{ property: "--itx-tabs-tablist-display", default: "flex" },
		{ property: "--itx-tabs-tablist-flex-wrap", default: "nowrap" },
		{ property: "--itx-tabs-gap", default: "0" },
		{ property: "--itx-tabs-rule-width", default: "1px" },
		{ property: "--itx-tabs-rule-color", default: "var(--itx-neutral-7)" },
		// Tab — box
		{
			property: "--itx-tab-min-block-size",
			default: "var(--itx-spacing-10) — 40px",
		},
		{ property: "--itx-tab-gap", default: "var(--itx-spacing-1) — 4px" },
		{
			property: "--itx-tab-padding-block",
			default: "var(--itx-spacing-2) — 8px",
		},
		{
			property: "--itx-tab-padding-inline",
			default: "var(--itx-spacing-4) — 16px",
		},
		{ property: "--itx-tab-border-width", default: "0" },
		{ property: "--itx-tab-border-color", default: "transparent" },
		{
			property: "--itx-tab-border-radius",
			default: "var(--itx-radius-none) — 0, squared",
		},
		// Tab — type
		{ property: "--itx-tab-font-family", default: "inherit" },
		{
			property: "--itx-tab-font-size",
			default: "0.875rem — 14px, fixed (never a fluid --itx-font-size-*)",
		},
		{ property: "--itx-tab-font-weight", default: "400" },
		{ property: "--itx-tab-line-height", default: "1.2857 — 18px at 14px" },
		{ property: "--itx-tab-letter-spacing", default: "normal" },
		// Tab — states
		{ property: "--itx-tab-background", default: "transparent" },
		{ property: "--itx-tab-foreground", default: "var(--itx-neutral-9)" },
		{
			property: "--itx-tab-background-hover",
			default: "transparent — set var(--itx-surface-above) for a hover fill",
		},
		{
			property: "--itx-tab-foreground-hover",
			default: "var(--itx-neutral-12)",
		},
		{ property: "--itx-tab-active-background", default: "transparent" },
		{
			property: "--itx-tab-active-foreground",
			default: "var(--itx-neutral-12)",
		},
		{
			property: "--itx-tab-font-weight-selected",
			default: "400 — Carbon uses 600; see the note below the table",
		},
		// Tab — indicator
		{ property: "--itx-tab-indicator-size", default: "2px" },
		{
			property: "--itx-tab-indicator-color-hover",
			default: "var(--itx-neutral-10)",
		},
		{
			property: "--itx-tab-active-indicator-color",
			default: "var(--itx-colorway)",
		},
		// Tab — focus + motion
		{ property: "--itx-tab-focus-outline-width", default: "2px" },
		{ property: "--itx-tab-focus-outline-style", default: "solid" },
		{
			property: "--itx-tab-focus-outline-color",
			default: "var(--itx-colorway)",
		},
		{ property: "--itx-tab-focus-outline-offset", default: "-2px — inset" },
		{
			property: "--itx-tab-transition-duration",
			default: "var(--itx-duration-fast) — 100ms",
		},
		// Panel
		{
			property: "--itx-tab-panel-padding-block",
			default: "var(--itx-spacing-4) — 16px",
		},
		{
			property: "--itx-tab-panel-padding-inline",
			default: "var(--itx-spacing-4) — 16px",
		},
		{ property: "--itx-tab-panel-focus-outline-width", default: "2px" },
		{ property: "--itx-tab-panel-focus-outline-style", default: "solid" },
		{
			property: "--itx-tab-panel-focus-outline-color",
			default: "var(--itx-colorway)",
		},
		{
			property: "--itx-tab-panel-focus-outline-offset",
			default: "-2px — inset",
		},
	];

	// ── API ──────────────────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Directive", sticky: true },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			component: "interop-tabs",
			name: "active",
			type: "string | null",
			default: "null",
			description:
				"Two-way bindable key of the active panel. A model() input — see activeChange under Outputs. Null resolves to the first panel; a key that no longer matches any panel falls back to the first.",
		},
		{
			component: "interop-tabs",
			name: "ariaLabel",
			type: "string | null",
			default: "null",
			description:
				"aria-label for the generated tablist. Use when nothing visible names the group.",
		},
		{
			component: "interop-tabs",
			name: "ariaLabelledBy",
			type: "string | null",
			default: "null",
			description:
				"aria-labelledby for the generated tablist. Prefer this when a visible heading already names the group.",
		},
		{
			component: "interop-tabs",
			name: "orientation",
			type: '"horizontal" | "vertical"',
			default: '"horizontal"',
			description:
				"Swaps the arrow keys, sets aria-orientation, and reflects itx-orientation on the host so the stylesheet lays the tablist out beside its panels.",
		},
		{
			component: "interop-tabs",
			name: "activationMode",
			type: '"auto" | "manual"',
			default: '"auto"',
			description:
				"auto: arrows move focus and switch the panel. manual: arrows move focus only, Enter or Space commits. Prefer manual when panels are expensive to initialise.",
		},
		{
			component: "interop-tabs",
			name: "activationId",
			type: "string | null",
			default: "null",
			description:
				"Registers with InteropActivation so any consumer can call trigger(id, panelKey) to switch tabs from outside the component tree.",
		},
		{
			component: "interop-tab-panel",
			name: "key",
			type: "string",
			default: "auto-generated",
			description:
				"Identity of the panel. Also the value active takes, and the seed for both ARIA ids. Set it explicitly whenever anything else refers to the panel.",
		},
		{
			component: "interop-tab-panel",
			name: "label",
			type: "string | null",
			default: "null",
			description:
				"Plain-text label for the generated tab button. Ignored when an ng-template[interop-tab-label] is present in the panel's content.",
		},
		{
			component: "interop-tab-panel",
			name: "destroyOnHide",
			type: "boolean",
			default: "false",
			description:
				"Opt back into destroy-on-switch. The default preserves panel content in the DOM under [hidden]; set this where memory pressure outweighs re-initialisation cost.",
		},
		{
			component: "interop-tab-panel",
			name: "preRender",
			type: "boolean",
			default: "false",
			description:
				"Render the panel's content at init instead of on first activation. Warms an expensive panel before it is ever selected.",
		},
	];

	outputColumns: TableColumn<OutputEntry>[] = [
		{ key: "component", label: "Directive", sticky: true },
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: OutputEntry[] = [
		{
			component: "interop-tabs",
			name: "activeChange",
			type: "OutputEmitterRef<string | null>",
			description:
				"The other half of the active model() input. Emits the key of the newly selected panel. Bind both with [(active)], or listen alone for an uncontrolled group.",
		},
	];

	methodColumns: TableColumn<MethodEntry>[] = [
		{ key: "component", label: "Directive", sticky: true },
		{ key: "name", label: "Method" },
		{ key: "type", label: "Signature" },
		{ key: "description", label: "Description" },
	];

	methodEntries: MethodEntry[] = [
		{
			component: "interop-tabs",
			name: "selectPanel",
			type: "(key: string) => void",
			description:
				"Activate a panel by key. Sets the active model, so a bound parent is notified. Reachable from a template reference variable.",
		},
	];

	directiveColumns: TableColumn<DirectiveEntry>[] = [
		{ key: "name", label: "Selector", sticky: true },
		{ key: "element", label: "Element" },
		{ key: "description", label: "Description" },
	];

	directiveEntries: DirectiveEntry[] = [
		{
			name: "[interop-tabs]",
			element: "<section>",
			description:
				"The group. Generates the tablist, the tab buttons, and all ARIA wiring from its child panels. Warns in dev mode if used on anything but a <section>.",
		},
		{
			name: "[interop-tab-panel]",
			element: "<section>",
			description:
				"One panel. Contributes its label to the tablist and owns its own render lifecycle. Must be a direct content child of interop-tabs.",
		},
		{
			name: "[interop-tab-label]",
			element: "<ng-template>",
			description:
				"Marker directive for a rich tab label — icons, counts, badges. Place it on an ng-template inside the panel; the parent renders it into the tab button in place of the label string. No inputs.",
		},
	];

	attrColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Attribute" },
		{ key: "type", label: "Values" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	attrEntries: ApiEntry[] = [
		{
			name: "itx-orientation",
			type: '"horizontal" | "vertical"',
			default: '"horizontal"',
			description:
				"Written by the component, not by you — it reflects the orientation input onto the host so CSS can key off it. Listed because it is part of the rendered surface a consumer stylesheet may target.",
		},
	];
}
