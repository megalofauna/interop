import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import {
	InteropChipList,
	InteropChipItem,
	InteropChipBadge,
	InteropChipFilter,
	InteropChipOption,
	InteropChipInput,
	type ChipInputItem,
	InteropTable,
	InteropCellDef,
	type TableColumn,
	type TableGroupRow,
} from "interop";
import { CodeBlock, Terminal, type TerminalEntry } from "interop";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

interface ApiInputRow {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

interface ApiOutputRow {
	name: string;
	type: string;
	description: string;
}

type ApiInputEntry = TableGroupRow | ApiInputRow;
type ApiOutputEntry = TableGroupRow | ApiOutputRow;

type TokenEntry = TableGroupRow | { property: string; default: string };

@Component({
	selector: "chip-page",
	standalone: true,
	imports: [
		InteropChipList,
		InteropChipItem,
		InteropChipBadge,
		InteropChipFilter,
		InteropChipOption,
		InteropChipInput,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		Terminal,
		DemoSection,
		DemoExample,
		DemoMasthead,
	],
	templateUrl: "./chip-page.html",
	styleUrl: "./chip-page.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipPage {
	cargoTags = signal(["plasma-conduit", "mag-lock", "hull-epoxy"]);
	removeLog = signal<TerminalEntry[]>([]);

	removeTag(tag: string) {
		this.cargoTags.update((tags) => tags.filter((t) => t !== tag));
		this.removeLog.update((log) => [
			...log,
			{ text: `removed "${tag}"`, time: Date.now() },
		]);
	}

	activeFilters = signal<string[]>(["hazmat", "priority"]);
	filterLog = signal<TerminalEntry[]>([]);

	onFiltersChange(next: string[]) {
		const previous = this.activeFilters();
		this.activeFilters.set(next);
		const added = next.find((v) => !previous.includes(v));
		const removed = previous.find((v) => !next.includes(v));
		const detail = added
			? `+${added}`
			: removed
				? `-${removed}`
				: next.join(", ") || "∅";
		this.filterLog.update((log) => [
			...log,
			{ text: `${detail} → [${next.join(", ")}]`, time: Date.now() },
		]);
	}

	recipients = signal<ChipInputItem[]>([
		{ label: "reyes@ares.dock", value: "reyes@ares.dock" },
		{ label: "tanaka@ares.dock", value: "tanaka@ares.dock" },
	]);
	recipientsLog = signal<TerminalEntry[]>([]);

	onRecipientsChange(next: ChipInputItem[]) {
		const previous = this.recipients();
		this.recipients.set(next);
		const prevValues = previous.map((c) => c.value ?? c.label);
		const nextValues = next.map((c) => c.value ?? c.label);
		const added = nextValues.find((v) => !prevValues.includes(v));
		const removed = prevValues.find((v) => !nextValues.includes(v));
		const detail = added
			? `added "${added}"`
			: removed
				? `removed "${removed}"`
				: `count ${next.length}`;
		this.recipientsLog.update((log) => [
			...log,
			{ text: detail, time: Date.now() },
		]);
	}

	readonly badgeInlineCode = `<p>Mission status: <span interop-chip-badge>Operational</span></p>
<p>Build <span interop-chip-badge>v0.1.0</span> deployed to <span interop-chip-badge>prod</span>.</p>`;

	readonly badgeDefsCode = `<dl>
  <dt>Reactor</dt>
  <dd><span interop-chip-badge>online</span></dd>
  <dt>Atmosphere</dt>
  <dd><span interop-chip-badge>nominal</span></dd>
  <dt>Crew</dt>
  <dd><span interop-chip-badge>5 / 7</span></dd>
</dl>`;

	readonly readOnlyCode = `<ul interop-chip-list aria-label="Cargo manifest tags">
  <li interop-chip-item label="Plasma conduit">Plasma conduit</li>
  <li interop-chip-item label="Mag-lock">Mag-lock</li>
  <li interop-chip-item label="Hull epoxy">Hull epoxy</li>
</ul>`;

	readonly removableCode = `<ul interop-chip-list aria-label="Active cargo tags">
  @for (tag of cargoTags(); track tag) {
    <li interop-chip-item [label]="tag" [removable]="true" (removed)="removeTag(tag)">
      {{ tag }}
    </li>
  }
</ul>`;

	readonly filterCode = `<fieldset interop-chip-filter label="Cargo flags"
  [value]="activeFilters()" (valueChange)="activeFilters.set($event)">
  <label interop-chip-option value="hazmat">Hazmat</label>
  <label interop-chip-option value="priority">Priority</label>
  <label interop-chip-option value="fragile">Fragile</label>
  <label interop-chip-option value="oversized" [disabled]="true">Oversized</label>
</fieldset>`;

	readonly sizeCode = `<!-- itx-size sits on the chip, or on any chip container -->
<ul interop-chip-list itx-size="sm" aria-label="Compact tags">
  <li interop-chip-item label="Plasma conduit">Plasma conduit</li>
</ul>

<span interop-chip-badge itx-size="md">Full-size badge</span>`;

	readonly inputCode = `<div interop-chip-input
  aria-label="Recipients"
  placeholder="Add a recipient…"
  [value]="recipients()"
  (valueChange)="recipients.set($event)">
</div>`;

	apiColumns: TableColumn<ApiInputEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiInputEntry[] = [
		{ groupLabel: "chip-list" },
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description:
				"Whether the entire list is in a disabled presentation state.",
		},

		{ groupLabel: "chip-item" },
		{
			name: "label",
			type: "string",
			default: "—",
			description:
				"Required. Accessible label for this chip. Also used as the base for the remove button's aria-label.",
			required: true,
		},
		{
			name: "removable",
			type: "boolean",
			default: "false",
			description: "When true, renders a remove button inside the chip.",
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables the remove button.",
		},

		{ groupLabel: "chip-filter" },
		{
			name: "label",
			type: "string",
			default: "—",
			description: "Required. Accessible label rendered as a fieldset legend.",
			required: true,
		},
		{
			name: "labelHidden",
			type: "boolean",
			default: "false",
			description:
				"When true, the legend is visually hidden but remains accessible.",
		},
		{
			name: "value",
			type: "string[]",
			default: "[]",
			description: "Currently selected values in controlled mode.",
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables all filter options.",
		},

		{ groupLabel: "chip-option" },
		{
			name: "value",
			type: "string",
			default: "—",
			description: "Required. The value this option represents.",
			required: true,
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables this option independently of the group.",
		},
		{
			name: "name",
			type: "string | null",
			default: "null",
			description:
				"Name attribute forwarded to the checkbox input. Required for native form submission.",
		},

		{ groupLabel: "chip-input" },
		{
			name: "value",
			type: "ChipInputItem[]",
			default: "[]",
			description:
				"Controlled chip list. Pair with (valueChange) for two-way binding.",
		},
		{
			name: "placeholder",
			type: "string",
			default: "''",
			description: "Placeholder text for the text input.",
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables the control.",
		},
		{
			name: "separators",
			type: "string[]",
			default: "['Enter', ',']",
			description:
				"Keys that trigger chip creation from the current input text.",
		},
		{
			name: "maxChips",
			type: "number",
			default: "0",
			description: "Maximum number of chips. No limit when 0.",
		},
	];

	outputColumns: TableColumn<ApiOutputEntry>[] = [
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiOutputEntry[] = [
		{ groupLabel: "chip-item" },
		{
			name: "removed",
			type: "void",
			description: "Emitted when the chip's remove button is clicked.",
		},

		{ groupLabel: "chip-filter" },
		{
			name: "valueChange",
			type: "string[]",
			description: "Emitted when the selected filter values change.",
		},

		{ groupLabel: "chip-input" },
		{
			name: "valueChange",
			type: "ChipInputItem[]",
			description:
				"Emitted when the chip list changes (add, remove, blur-commit).",
		},
	];

	// ── Token table ──────────────────────────────────────────────────────────
	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		{ groupLabel: "Size steps — the retuning seam" },
		{
			property: "--itx-chip-md-height",
			default: "var(--itx-spacing-8) — 32px",
		},
		{
			property: "--itx-chip-md-padding-inline",
			default: "var(--itx-spacing-3) — 12px",
		},
		{
			property: "--itx-chip-sm-height",
			default: "var(--itx-spacing-6) — 24px",
		},
		{
			property: "--itx-chip-sm-padding-inline",
			default: "var(--itx-spacing-2) — 8px",
		},

		{ groupLabel: "Shared — size (assigned from the step above)" },
		{ property: "--itx-chip-height", default: "var(--itx-chip-md-height)" },
		{
			property: "--itx-chip-padding-inline",
			default: "var(--itx-chip-md-padding-inline)",
		},
		{
			property: "--itx-chip-min-width",
			default: "var(--itx-spacing-8) — 32px",
		},
		{ property: "--itx-chip-max-width", default: "none" },
		{ property: "--itx-chip-gap", default: "var(--itx-spacing-4) — 16px" },
		{
			property: "--itx-chip-radius",
			default: "var(--itx-radius-full) — a pill",
		},

		{ groupLabel: "Shared — type" },
		{ property: "--itx-chip-font-size", default: "0.75rem" },
		{ property: "--itx-chip-font-weight", default: "400" },
		{ property: "--itx-chip-line-height", default: "1.3333" },

		{ groupLabel: "Paint — presentational & dismissible" },
		{ property: "--itx-chip-background", default: "var(--itx-colorway-solid)" },
		{ property: "--itx-chip-color", default: "var(--itx-colorway-on-solid)" },
		{ property: "--itx-chip-border", default: "none" },
		{
			property: "--itx-chip-background-hover",
			default: "var(--itx-neutral-3)",
		},
		{ property: "--itx-chip-color-hover", default: "var(--itx-neutral-14)" },

		{ groupLabel: "Paint — selectable (chip-option)" },
		{
			property: "--itx-chip-selectable-background",
			default: "var(--itx-neutral-3)",
		},
		{
			property: "--itx-chip-selectable-color",
			default: "var(--itx-neutral-14)",
		},
		{
			property: "--itx-chip-selectable-border",
			default: "2px solid transparent",
		},
		{
			property: "--itx-chip-selectable-background-hover",
			default: "var(--itx-neutral-8)",
		},
		{
			property: "--itx-chip-selectable-color-hover",
			default: "var(--itx-neutral-14)",
		},

		{ groupLabel: "Paint — selected / checked" },
		{
			property: "--itx-chip-background-selected",
			default: "var(--itx-colorway-solid)",
		},
		{
			property: "--itx-chip-color-selected",
			default: "var(--itx-colorway-on-solid)",
		},
		{
			property: "--itx-chip-border-selected",
			default: "2px solid var(--itx-colorway-border)",
		},
		{ property: "--itx-chip-font-weight-selected", default: "400" },

		{ groupLabel: "Focus ring (chip-option)" },
		{
			property: "--itx-chip-outline-color",
			default: "var(--itx-colorway-solid)",
		},
		{ property: "--itx-chip-outline-width", default: "2px" },
		{ property: "--itx-chip-outline-style", default: "solid" },
		{ property: "--itx-chip-outline-offset", default: "2px" },

		{ groupLabel: "Remove button (chip-item + chip-input)" },
		{
			property: "--itx-chip-remove-background",
			default: "var(--itx-colorway-solid)",
		},
		{
			property: "--itx-chip-remove-background-hover",
			default: "var(--itx-neutral-3)",
		},
		{ property: "--itx-chip-remove-border", default: "none" },
		{
			property: "--itx-chip-remove-radius",
			default: "var(--itx-chip-radius) — tracks the chip",
		},
		{
			property: "--itx-chip-remove-margin",
			default: "0 0 0 var(--itx-spacing-2)",
		},
		{
			property: "--itx-chip-remove-font-size",
			default: "var(--itx-spacing-4) — 16px",
		},
		{
			property: "--itx-chip-remove-outline-color",
			default: "var(--itx-colorway-solid)",
		},
		{ property: "--itx-chip-remove-outline-width", default: "2px" },
		{ property: "--itx-chip-remove-outline-offset", default: "-2px (inset)" },

		{ groupLabel: "Disabled & transitions" },
		{ property: "--itx-chip-disabled-opacity", default: "0.4" },
		{ property: "--itx-chip-transition-duration", default: "120ms" },
		{ property: "--itx-chip-transition-timing-function", default: "ease" },

		{ groupLabel: "chip-list" },
		{ property: "--itx-chip-list-gap", default: "var(--itx-spacing-2) — 8px" },

		{ groupLabel: "Dismissible hosts (chip-item + chip-input)" },
		{
			property: "--itx-chip-gap",
			default: "0 — the remove button owns its margin",
		},

		{ groupLabel: "chip-filter" },
		{ property: "--itx-chip-filter-background", default: "transparent" },
		{ property: "--itx-chip-filter-border", default: "none" },
		{ property: "--itx-chip-filter-radius", default: "0" },
		{ property: "--itx-chip-filter-padding", default: "0" },
		{
			property: "--itx-chip-filter-gap",
			default: "var(--itx-spacing-2) — 8px",
		},

		{ groupLabel: "chip-input — container" },
		{ property: "--itx-chip-input-background", default: "transparent" },
		{
			property: "--itx-chip-input-border",
			default: "1px solid var(--itx-neutral-8)",
		},
		{
			property: "--itx-chip-input-radius",
			default: "var(--itx-chip-radius) — tracks its chips",
		},
		{ property: "--itx-chip-input-gap", default: "var(--itx-spacing-1)" },
		{
			property: "--itx-chip-input-padding",
			default: "var(--itx-spacing-1) var(--itx-spacing-2)",
		},
		{
			property: "--itx-chip-input-min-height",
			default: "var(--itx-spacing-10) — 40px",
		},

		{ groupLabel: "chip-input — focus" },
		{
			property: "--itx-chip-input-outline-color",
			default: "var(--itx-colorway-solid)",
		},
		{ property: "--itx-chip-input-outline-width", default: "2px" },
		{ property: "--itx-chip-input-outline-style", default: "solid" },
		{ property: "--itx-chip-input-outline-offset", default: "1px" },
	];
}
