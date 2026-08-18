import {
	ChangeDetectionStrategy,
	Component,
	computed,
	signal,
} from "@angular/core";
import {
	CodeBlock,
	InteropCallout,
	InteropCellDef,
	InteropSegment,
	InteropSegmentedControl,
	InteropTable,
	type CodeFile,
	type TableColumn,
} from "interop";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";

interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

interface TokenEntry {
	property: string;
	default: string;
}

type StatusPalette = "seventies" | "eighties";

@Component({
	selector: "callout-page",
	standalone: true,
	imports: [
		InteropCallout,
		InteropSegmentedControl,
		InteropSegment,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoPage,
		DemoSection,
		DemoExample,
		DemoMasthead,
		DemoState,
		DemoStateItem,
	],
	templateUrl: "./callout-page.html",
	styleUrl: "./callout-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalloutPage {
	/**
	 * Live status-palette preview — drives `itx-status-palette` on the page root.
	 *
	 * The switcher is a real `interop-segmented-control`. It used to be a
	 * hand-rolled row of `<button aria-pressed>` with page-local styles, which is
	 * both the wrong semantics (a set of toggles, not one exclusive choice) and
	 * the wrong thing for a demo app to be showing: the library ships the control
	 * this needs.
	 */
	readonly palette = signal<StatusPalette>("seventies");

	readonly palettes: readonly { id: StatusPalette; label: string }[] = [
		{ id: "seventies", label: "70s — earthy" },
		{ id: "eighties", label: "80s — OS" },
	];

	/** `valueChange` emits a bare string; narrow it before it reaches the signal. */
	protected onPaletteChange(value: string): void {
		if (value === "seventies" || value === "eighties") this.palette.set(value);
	}

	// ── Code strings ─────────────────────────────────────────────────────────

	readonly infoCode = `<interop-callout>
  Hull integrity check scheduled for 0600. All non-essential crew to standby.
</interop-callout>`;

	readonly headingCode = `<interop-callout type="info" heading="Docking protocol">
  Extend mag-lock clamps before engaging the docking collar.
  Verify pressure seal before releasing airlock.
</interop-callout>`;

	readonly warningCode = `<interop-callout type="warning" heading="Radiation zone">
  Sector 7-G is currently above safe exposure limits.
  EVA suits required beyond this point.
</interop-callout>`;

	readonly successCode = `<interop-callout type="success" heading="Cargo secured">
  All requisition items verified and locked in bay 4.
  Transit clearance granted.
</interop-callout>`;

	readonly dangerCode = `<interop-callout type="danger" heading="Hull breach detected">
  Emergency bulkhead engaged on deck 3.
  Evacuate immediately and await decompression protocol.
</interop-callout>`;

	private readonly paletteHtml = `<!-- itx-status-palette on any ancestor re-skins everything below it -->
<article [attr.itx-status-palette]="palette()">
  <fieldset
    interop-segmented-control
    label="Status palette"
    [value]="palette()"
    (valueChange)="onPaletteChange($event)"
  >
    @for (p of palettes; track p.id) {
      <button interop-segment [value]="p.id">{{ p.label }}</button>
    }
  </fieldset>

  <interop-callout type="warning">Re-skins with the palette.</interop-callout>
</article>`;

	private readonly paletteTs = `type StatusPalette = "seventies" | "eighties";

readonly palette = signal<StatusPalette>("seventies");

readonly palettes: readonly { id: StatusPalette; label: string }[] = [
  { id: "seventies", label: "70s — earthy" },
  { id: "eighties", label: "80s — OS" },
];

// valueChange emits a bare string; narrow before it reaches the signal.
protected onPaletteChange(value: string): void {
  if (value === "seventies" || value === "eighties") this.palette.set(value);
}`;

	readonly paletteFiles = computed<CodeFile[]>(() => [
		{ label: "template.html", language: "html", code: this.paletteHtml },
		{ label: "component.ts", language: "ts", code: this.paletteTs },
	]);

	// ── CSS tokens ───────────────────────────────────────────────────────────

	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		{
			property: "--itx-callout-background",
			default: "var(--itx-<type>-tint) — the palette wash",
		},
		{
			property: "--itx-callout-accent",
			default: "var(--itx-<type>-border) — the palette's accent-bar rung",
		},
		{
			property: "--itx-callout-color",
			default: "var(--itx-<type>-on-tint)",
		},
		{
			property: "--itx-callout-accent-width",
			default: "var(--itx-border-width-heavy) — 3px, the toast status bar",
		},
		{
			property: "--itx-callout-padding-block",
			default: "var(--itx-spacing-4) — 16px",
		},
		{
			property: "--itx-callout-padding-inline",
			default: "var(--itx-spacing-6) — 24px",
		},
		{
			property: "--itx-callout-radius",
			default: "unset — follows var(--itx-radius), which is 0",
		},
		{
			property: "--itx-callout-font-size",
			default: "var(--itx-font-size-body) — fluid, this is prose",
		},
		{
			property: "--itx-callout-line-height",
			default: "var(--itx-line-height) — 1.6 at body size",
		},
		{
			property: "--itx-callout-heading-font-size",
			default: "var(--itx-font-size-label)",
		},
		{ property: "--itx-callout-heading-font-weight", default: "500" },
		{
			property: "--itx-callout-heading-margin-block-end",
			default: "var(--itx-spacing-2) — 8px",
		},
	];

	// ── API ──────────────────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			name: "type",
			type: "'info' | 'warning' | 'success' | 'danger'",
			default: "'info'",
			description:
				"Status variant. Selects which set of semantic status tokens the callout reads — it does not hardcode any colour.",
		},
		{
			name: "heading",
			type: "string | null",
			default: "null",
			description: "Optional heading rendered above the projected body.",
		},
	];
}
