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
} from 'interop';
import { CodeBlock, Terminal, type TerminalEntry } from "@interop/composites";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";

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
		DemoNotes,
	],
	templateUrl: "./chip-page.html",
	styleUrl: "./chip-page.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipPage {
	cargoTags = signal(['plasma-conduit', 'mag-lock', 'hull-epoxy']);
	removeLog = signal<TerminalEntry[]>([]);

	removeTag(tag: string) {
		this.cargoTags.update(tags => tags.filter(t => t !== tag));
		this.removeLog.update(log => [
			...log,
			{ text: `removed "${tag}"`, time: Date.now() },
		]);
	}

	activeFilters = signal<string[]>(['hazmat', 'priority']);
	filterLog = signal<TerminalEntry[]>([]);

	onFiltersChange(next: string[]) {
		const previous = this.activeFilters();
		this.activeFilters.set(next);
		const added = next.find(v => !previous.includes(v));
		const removed = previous.find(v => !next.includes(v));
		const detail = added
			? `+${added}`
			: removed
				? `-${removed}`
				: next.join(', ') || '∅';
		this.filterLog.update(log => [
			...log,
			{ text: `${detail} → [${next.join(', ')}]`, time: Date.now() },
		]);
	}

	recipients = signal<ChipInputItem[]>([
		{ label: 'reyes@ares.dock', value: 'reyes@ares.dock' },
		{ label: 'tanaka@ares.dock', value: 'tanaka@ares.dock' },
	]);
	recipientsLog = signal<TerminalEntry[]>([]);

	onRecipientsChange(next: ChipInputItem[]) {
		const previous = this.recipients();
		this.recipients.set(next);
		const prevValues = previous.map(c => c.value ?? c.label);
		const nextValues = next.map(c => c.value ?? c.label);
		const added = nextValues.find(v => !prevValues.includes(v));
		const removed = prevValues.find(v => !nextValues.includes(v));
		const detail = added
			? `added "${added}"`
			: removed
				? `removed "${removed}"`
				: `count ${next.length}`;
		this.recipientsLog.update(log => [
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
		{ name: "disabled", type: "boolean", default: "false", description: "Whether the entire list is in a disabled presentation state." },

		{ groupLabel: "chip-item" },
		{ name: "label", type: "string", default: "—", description: "Required. Accessible label for this chip. Also used as the base for the remove button's aria-label.", required: true },
		{ name: "removable", type: "boolean", default: "false", description: "When true, renders a remove button inside the chip." },
		{ name: "disabled", type: "boolean", default: "false", description: "Disables the remove button." },

		{ groupLabel: "chip-filter" },
		{ name: "label", type: "string", default: "—", description: "Required. Accessible label rendered as a fieldset legend.", required: true },
		{ name: "labelHidden", type: "boolean", default: "false", description: "When true, the legend is visually hidden but remains accessible." },
		{ name: "value", type: "string[]", default: "[]", description: "Currently selected values in controlled mode." },
		{ name: "disabled", type: "boolean", default: "false", description: "Disables all filter options." },

		{ groupLabel: "chip-option" },
		{ name: "value", type: "string", default: "—", description: "Required. The value this option represents.", required: true },
		{ name: "disabled", type: "boolean", default: "false", description: "Disables this option independently of the group." },
		{ name: "name", type: "string | null", default: "null", description: "Name attribute forwarded to the checkbox input. Required for native form submission." },

		{ groupLabel: "chip-input" },
		{ name: "value", type: "ChipInputItem[]", default: "[]", description: "Controlled chip list. Pair with (valueChange) for two-way binding." },
		{ name: "placeholder", type: "string", default: "''", description: "Placeholder text for the text input." },
		{ name: "disabled", type: "boolean", default: "false", description: "Disables the control." },
		{ name: "separators", type: "string[]", default: "['Enter', ',']", description: "Keys that trigger chip creation from the current input text." },
		{ name: "maxChips", type: "number", default: "0", description: "Maximum number of chips. No limit when 0." },
	];

	outputColumns: TableColumn<ApiOutputEntry>[] = [
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiOutputEntry[] = [
		{ groupLabel: "chip-item" },
		{ name: "removed", type: "void", description: "Emitted when the chip's remove button is clicked." },

		{ groupLabel: "chip-filter" },
		{ name: "valueChange", type: "string[]", description: "Emitted when the selected filter values change." },

		{ groupLabel: "chip-input" },
		{ name: "valueChange", type: "ChipInputItem[]", description: "Emitted when the chip list changes (add, remove, blur-commit)." },
	];

	// ── Token table ──────────────────────────────────────────────────────────
	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		{ groupLabel: "Shared — appearance" },
		{ property: "--itx-chip-background", default: "transparent" },
		{ property: "--itx-chip-color", default: "inherit" },
		{ property: "--itx-chip-border", default: "2px solid transparent" },
		{ property: "--itx-chip-radius", default: "var(--itx-radius-full)" },
		{ property: "--itx-chip-padding", default: "computed: step × mult" },
		{ property: "--itx-chip-font-size", default: "var(--itx-font-size-caption)" },
		{ property: "--itx-chip-font-weight", default: "inherit" },
		{ property: "--itx-chip-gap", default: "var(--itx-spacing-2)" },

		{ groupLabel: "Shared — hover" },
		{ property: "--itx-chip-background-hover", default: "var(--itx-surface-hover)" },
		{ property: "--itx-chip-color-hover", default: "inherit" },

		{ groupLabel: "Shared — selected / checked" },
		{ property: "--itx-chip-accent", default: "var(--itx-colorway)" },
		{ property: "--itx-chip-on-accent", default: "var(--itx-on-colorway)" },
		{ property: "--itx-chip-background-selected", default: "var(--itx-chip-accent)" },
		{ property: "--itx-chip-color-selected", default: "var(--itx-chip-on-accent)" },
		{ property: "--itx-chip-border-selected", default: "var(--itx-chip-border)" },
		{ property: "--itx-chip-font-weight-selected", default: "inherit" },

		{ groupLabel: "Shared — focus (chip-option)" },
		{ property: "--itx-chip-outline-color", default: "var(--itx-chip-accent)" },
		{ property: "--itx-chip-outline-width", default: "2px" },
		{ property: "--itx-chip-outline-style", default: "solid" },
		{ property: "--itx-chip-outline-offset", default: "2px" },

		{ groupLabel: "Shared — disabled & transitions" },
		{ property: "--itx-chip-disabled-opacity", default: "0.4" },
		{ property: "--itx-chip-transition-duration", default: "120ms" },
		{ property: "--itx-chip-transition-timing-function", default: "ease" },

		{ groupLabel: "chip-list" },
		{ property: "--itx-chip-list-gap", default: "0.375rem" },

		{ groupLabel: "chip-item / chip-badge — shared overrides" },
		{ property: "--itx-chip-background", default: "var(--itx-neutral-3)" },
		{ property: "--itx-chip-border", default: "2px solid var(--itx-neutral-7)" },
		{ property: "--itx-chip-item-gap", default: "var(--itx-spacing-3)" },
		{
			property: "--itx-chip-padding-removable",
			default: "computed: step × mult (left: × 2)",
		},

		{ groupLabel: "chip-item — remove button" },
		{ property: "--itx-chip-remove-background", default: "transparent" },
		{ property: "--itx-chip-remove-border", default: "1px solid transparent" },
		{ property: "--itx-chip-remove-border-hover", default: "2px solid var(--itx-chip-accent)" },
		{ property: "--itx-chip-remove-radius", default: "var(--itx-radius-full)" },
		{ property: "--itx-chip-remove-font-size", default: "0.875rem" },
		{ property: "--itx-chip-remove-padding", default: "var(--itx-spacing-1, 0.25rem)" },
		{ property: "--itx-chip-remove-width", default: "var(--itx-spacing-6, 1.5rem)" },
		{ property: "--itx-chip-remove-outline-color", default: "var(--itx-chip-accent)" },
		{ property: "--itx-chip-remove-outline-width", default: "3px" },
		{ property: "--itx-chip-remove-outline-offset", default: "3px" },

		{ groupLabel: "chip-filter" },
		{ property: "--itx-chip-filter-background", default: "transparent" },
		{ property: "--itx-chip-filter-border", default: "none" },
		{ property: "--itx-chip-filter-radius", default: "0" },
		{ property: "--itx-chip-filter-padding", default: "0" },

		{ groupLabel: "chip-badge — own overrides" },
		{ property: "--itx-chip-line-height", default: "1.2 (tight for prose)" },

		{ groupLabel: "chip-input — container" },
		{ property: "--itx-chip-input-background", default: "transparent" },
		{ property: "--itx-chip-input-border", default: "1px solid var(--itx-border)" },
		{ property: "--itx-chip-input-radius", default: "var(--itx-radius-sm, 4px)" },
		{ property: "--itx-chip-input-gap", default: "0.375rem" },
		{ property: "--itx-chip-input-padding", default: "0.375rem 0.5rem" },
		{ property: "--itx-chip-input-min-height", default: "2.5rem" },

		{ groupLabel: "chip-input — focus & chips" },
		{ property: "--itx-chip-input-outline-color", default: "var(--itx-colorway)" },
		{ property: "--itx-chip-input-outline-width", default: "2px" },
		{ property: "--itx-chip-input-outline-style", default: "solid" },
		{ property: "--itx-chip-input-outline-offset", default: "1px" },
		{ property: "--itx-chip-input-chip-gap", default: "0.25rem" },
		{ property: "--itx-chip-input-remove-font-size", default: "0.875rem" },
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Chip components added to manifest',
			body: 'Three chip patterns: InteropChipList (read-only tags), InteropChipFilter (multi-select checkboxes), and InteropChipInput (free-form entry). Each is built on native HTML — no ARIA listbox or grid.',
		},
		{
			type: 'release',
			label: 'v0.1.1',
			title: 'InteropChipBadge — standalone inline chip',
			body: 'A tag-agnostic [interop-chip-badge] selector for single chips that live outside a list — inline status badges, version tags, key/value pairs. Non-interactive by design; use a one-item chip-list when you need a removable single chip.',
		},
		{
			type: 'note',
			label: 'Semantics',
			body: 'Filter chips are checkboxes inside a fieldset, not ARIA listbox/option. This gives correct keyboard behavior and screen reader announcements across all platforms for free.',
		},
		{
			type: 'note',
			label: 'Badge vs list-of-one',
			body: 'A one-item <ul interop-chip-list> announces "list, 1 item" — an overclaim if the chip is really a status label. Use <span interop-chip-badge> for inline single-chip use; the list semantic is reserved for actual collections.',
		},
	];
}
