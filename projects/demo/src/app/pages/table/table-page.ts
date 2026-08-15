import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import {
	InteropTable,
	InteropCellDef,
	InteropTableSort,
	type TableColumn,
	type TableGroupRow,
	type TableSortEvent,
} from "interop";
import { CodeBlock, type CodeFile } from "interop";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

interface CargoEntry {
	id: string;
	description: string;
	qty: number;
	bay: string;
	status: "loaded" | "pending" | "quarantine";
}

type TableSize = "sm" | "md" | "lg" | "xl";

type TokenEntry = { property: string; default: string };
type TokenRow = TokenEntry | TableGroupRow;

interface ApiEntry {
	component: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

interface ApiOutputEntry {
	component: string;
	name: string;
	type: string;
	description: string;
}

@Component({
	selector: "table-page",
	standalone: true,
	imports: [
		InteropTable,
		InteropCellDef,
		InteropTableSort,
		CodeBlock,
		DemoPage,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
		DemoMasthead,
	],
	templateUrl: "./table-page.html",
	styleUrl: "./table-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePage {
	// ── Code strings ──────────────────────────────────────────────────────────

	readonly basicHtml = `<interop-table [collection]="cargoManifest" [columns]="columns" />`;

	readonly basicTs = `interface CargoEntry {
  id: string;
  description: string;
  qty: number;
  bay: string;
  status: 'loaded' | 'pending' | 'quarantine';
}

columns: TableColumn<CargoEntry>[] = [
  { key: 'id',          label: 'Item ID' },
  { key: 'description', label: 'Description' },
  { key: 'qty',         label: 'Qty' },
  { key: 'bay',         label: 'Bay' },
  { key: 'status',      label: 'Status' },
];

cargoManifest: CargoEntry[] = [
  { id: 'PLX-001', description: 'Plasma conduit',      qty: 4, bay: 'A1', status: 'loaded' },
  { id: 'MAG-008', description: 'Mag-lock coupling',   qty: 8, bay: 'A2', status: 'loaded' },
  { id: 'HUL-002', description: 'Hull epoxy Type-7',   qty: 2, bay: 'B1', status: 'pending' },
  { id: 'EVA-006', description: 'EVA tether',           qty: 6, bay: 'B2', status: 'loaded' },
  { id: 'RAD-009', description: 'Rad shielding panel', qty: 9, bay: 'C1', status: 'quarantine' },
];`;

	readonly customCellsHtml = `<interop-table [collection]="cargoManifest" [columns]="columns">
  <ng-template itxCell="id" let-entry>
    <code>{{ entry.id }}</code>
  </ng-template>
  <ng-template itxCell="status" let-entry>
    <span [class]="'badge--' + entry.status">{{ entry.status }}</span>
  </ng-template>
</interop-table>`;

	readonly customCellsTs = `columns: TableColumn<CargoEntry>[] = [
  { key: 'id',          label: 'Item ID' },
  { key: 'description', label: 'Description' },
  { key: 'qty',         label: 'Qty' },
  { key: 'bay',         label: 'Bay' },
  { key: 'status',      label: 'Status' },
];`;

	readonly sortHtml = `<interop-table
  [collection]="cargoManifest"
  [columns]="sortableColumns"
  itxSort
  (sortChange)="onSortChange($event)"
>
  <ng-template itxCell="status" let-entry>
    <span [class]="'badge--' + entry.status">{{ entry.status }}</span>
  </ng-template>
</interop-table>`;

	readonly sortTs = `sortableColumns: TableColumn<CargoEntry>[] = [
  { key: 'id',          label: 'Item ID',     sortable: true },
  { key: 'description', label: 'Description', sortable: true },
  { key: 'qty',         label: 'Qty',         sortable: true },
  { key: 'bay',         label: 'Bay',         sortable: true },
  { key: 'status',      label: 'Status' },   // not sortable
];

lastSortEvent = signal<TableSortEvent | null>(null);

onSortChange(event: TableSortEvent): void {
  this.lastSortEvent.set(event);
}`;

	readonly densityHtml = `<!-- Normally a static attribute — itx-size is not an Angular input: -->
<interop-table [collection]="cargoManifest" [columns]="columns" itx-size="sm" />

<!-- This example binds it through [attr.] so the step can be switched live: -->
<interop-table
  [collection]="cargoManifest"
  [columns]="columns"
  [attr.itx-size]="density()"
/>`;

	readonly densityTs = `type TableSize = 'sm' | 'md' | 'lg' | 'xl';

readonly sizes: TableSize[] = ['sm', 'md', 'lg', 'xl'];
density = signal<TableSize>('lg');`;

	readonly stickyHtml = `<!-- The wrapper scrolls whenever the table is wider than its container.
     Naming the region is what promotes it to an ARIA landmark. -->
<interop-table
  [collection]="cargoManifest"
  [columns]="stickyColumns"
  scrollRegionLabel="Cargo manifest"
/>`;

	readonly stickyTs = `stickyColumns: TableColumn<CargoEntry>[] = [
  { key: 'id',          label: 'Item ID', sticky: true },
  { key: 'description', label: 'Description' },
  { key: 'qty',         label: 'Qty' },
  { key: 'bay',         label: 'Bay' },
  { key: 'status',      label: 'Status' },
];`;

	// ── Code files ────────────────────────────────────────────────────────────

	readonly basicFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.basicHtml },
		{ label: "component.ts", language: "ts", code: this.basicTs },
	];

	readonly customCellsFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.customCellsHtml },
		{ label: "component.ts", language: "ts", code: this.customCellsTs },
	];

	readonly sortFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.sortHtml },
		{ label: "component.ts", language: "ts", code: this.sortTs },
	];

	readonly densityFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.densityHtml },
		{ label: "component.ts", language: "ts", code: this.densityTs },
	];

	readonly stickyFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.stickyHtml },
		{ label: "component.ts", language: "ts", code: this.stickyTs },
	];

	// ── Data ──────────────────────────────────────────────────────────────────

	columns: TableColumn<CargoEntry>[] = [
		{ key: "id", label: "Item ID" },
		{ key: "description", label: "Description" },
		{ key: "qty", label: "Qty" },
		{ key: "bay", label: "Bay" },
		{ key: "status", label: "Status" },
	];

	sortableColumns: TableColumn<CargoEntry>[] = [
		{ key: "id", label: "Item ID", sortable: true },
		{ key: "description", label: "Description", sortable: true },
		{ key: "qty", label: "Qty", sortable: true },
		{ key: "bay", label: "Bay", sortable: true },
		{ key: "status", label: "Status" },
	];

	stickyColumns: TableColumn<CargoEntry>[] = [
		{ key: "id", label: "Item ID", sticky: true },
		{ key: "description", label: "Description" },
		{ key: "qty", label: "Qty" },
		{ key: "bay", label: "Bay" },
		{ key: "status", label: "Status" },
	];

	lastSortEvent = signal<TableSortEvent | null>(null);

	onSortChange(event: TableSortEvent): void {
		this.lastSortEvent.set(event);
	}

	// ── Density ───────────────────────────────────────────────────────────────

	readonly sizes: TableSize[] = ["sm", "md", "lg", "xl"];
	readonly sizeHeights: Record<TableSize, string> = {
		sm: "32px",
		md: "40px",
		lg: "48px",
		xl: "64px",
	};

	density = signal<TableSize>("lg");

	setDensity(size: TableSize): void {
		this.density.set(size);
	}

	cargoManifest: CargoEntry[] = [
		{
			id: "PLX-001",
			description: "Plasma conduit",
			qty: 4,
			bay: "A1",
			status: "loaded",
		},
		{
			id: "MAG-008",
			description: "Mag-lock coupling",
			qty: 8,
			bay: "A2",
			status: "loaded",
		},
		{
			id: "HUL-002",
			description: "Hull epoxy Type-7",
			qty: 2,
			bay: "B1",
			status: "pending",
		},
		{
			id: "EVA-006",
			description: "EVA tether",
			qty: 6,
			bay: "B2",
			status: "loaded",
		},
		{
			id: "RAD-009",
			description: "Rad shielding panel",
			qty: 9,
			bay: "C1",
			status: "quarantine",
		},
	];

	// ── CSS tokens ────────────────────────────────────────────────────────────
	//
	// Mirrors `styles/themes/protocol/components/table.css`. Keep in sync — a
	// token table that lies is worse than no token table.

	tokenColumns: TableColumn<TokenRow>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenRow[] = [
		{ groupLabel: "Typography" },
		{ property: "--itx-table-font-size", default: "0.875rem — 14px" },
		{ property: "--itx-table-font-weight", default: "400" },
		{
			property: "--itx-table-line-height",
			default: "1.2857 — an 18px line box at 14px",
		},
		{
			property: "--itx-table-cell-padding",
			default: "var(--itx-spacing-3) var(--itx-spacing-4) — 12px 16px",
		},
		{ property: "--itx-table-cell-vertical-align", default: "middle" },

		{ groupLabel: "Body" },
		{ property: "--itx-table-body-color", default: "var(--itx-contrast-6)" },
		{
			property: "--itx-table-row-block-size",
			default: "var(--itx-spacing-12) — 48px",
		},
		{ property: "--itx-table-stripe-bg", default: "transparent" },
		{
			property: "--itx-table-row-hover-bg",
			default: "var(--itx-contrast-1)",
		},
		{ property: "--itx-table-row-border-width", default: "1px" },
		{
			property: "--itx-table-row-transition-duration",
			default: "var(--itx-duration-fast) — 100ms",
		},
		{
			property: "--itx-table-row-transition-easing",
			default: "var(--itx-easing-standard) — cubic-bezier(0.4, 0, 0.2, 1)",
		},

		{ groupLabel: "Header" },
		{ property: "--itx-table-header-bg", default: "var(--itx-surface-above)" },
		{ property: "--itx-table-header-color", default: "var(--itx-contrast-6)" },
		{ property: "--itx-table-header-font-weight", default: "600" },
		{ property: "--itx-table-header-border-width", default: "1px" },

		{ groupLabel: "Sort indicator" },
		{
			property: "--itx-table-sort-gap",
			default: "var(--itx-spacing-2) — 8px",
		},
		{ property: "--itx-table-sort-indicator-idle-opacity", default: "0.4" },

		{ groupLabel: "Borders" },
		{ property: "--itx-table-border", default: "var(--itx-contrast-3)" },

		{ groupLabel: "Sticky columns" },
		{ property: "--itx-table-sticky-bg", default: "var(--itx-surface)" },
		{
			property: "--itx-table-sticky-shadow",
			default:
				"inset -1px 0 0 var(--itx-table-border), 4px 0 8px -2px oklch(0 0 0 / 0.1)",
		},

		{ groupLabel: "State rows (loading / error / empty)" },
		{ property: "--itx-table-state-color", default: "var(--itx-contrast-4)" },
		{
			property: "--itx-table-state-padding",
			default: "var(--itx-spacing-8) var(--itx-spacing-4) — 32px 16px",
		},

		{ groupLabel: "Scroll-region focus ring" },
		{
			property: "--itx-table-focus-outline-color",
			default: "var(--itx-colorway-solid)",
		},

		{ groupLabel: "Group rows" },
		{
			property: "--itx-table-group-label-padding-block-start",
			default: "var(--itx-spacing-6) — 24px",
		},
		{ property: "--itx-table-group-label-color", default: "var(--itx-contrast-4)" },
		{
			property: "--itx-table-group-label-font-size",
			default: "0.75rem — 12px",
		},
		{ property: "--itx-table-group-label-font-weight", default: "500" },
		{ property: "--itx-table-group-label-letter-spacing", default: "0.06em" },
		{
			property: "--itx-table-group-label-text-transform",
			default: "uppercase",
		},
	];

	// ── API ───────────────────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Host", sticky: true },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			component: "<interop-table>",
			name: "collection",
			type: "InteropCollectionInput<T>",
			default: "—",
			description:
				"Data source. Accepts arrays, Signals, Observables, Promises, Iterables, or an InteropCollection.",
		},
		{
			component: "<interop-table>",
			name: "columns",
			type: "TableColumn<T>[] | null",
			default: "null",
			description:
				"Explicit column definitions. Auto-generated from the first item's keys when omitted.",
		},
		{
			component: "<interop-table>",
			name: "autoColumns",
			type: "boolean",
			default: "true",
			description:
				"Master switch for auto-generation. Set false to force 'no columns until provided'.",
		},
		{
			component: "<interop-table>",
			name: "trackBy",
			type: "'auto' | 'index' | TrackByFunction<T>",
			default: "'auto'",
			description: "Row identity tracking strategy for change detection.",
		},
		{
			component: "<interop-table>",
			name: "trackByField",
			type: "keyof T | null",
			default: "null",
			description: "Field to use for identity when trackBy is 'auto'.",
		},
		{
			component: "<interop-table>",
			name: "showHeaders",
			type: "boolean",
			default: "true",
			description: "Whether to render the <thead> row.",
		},
		{
			component: "<interop-table>",
			name: "emptyText",
			type: "string",
			default: "'No data available'",
			description: "Text displayed when the collection is empty.",
		},
		{
			component: "<interop-table>",
			name: "loadingText",
			type: "string",
			default: "'Loading...'",
			description: "Text displayed while the collection is loading.",
		},
		{
			component: "<interop-table>",
			name: "maxRows",
			type: "number | null",
			default: "null",
			description: "Hard cap on rendered rows. No limit when null.",
		},
		{
			component: "<interop-table>",
			name: "scrollable",
			type: "boolean",
			default: "true",
			description:
				"Wraps the table in a horizontal-scroll container (overflow-x + touch-action: pan-x). Set false to opt out entirely.",
		},
		{
			component: "<interop-table>",
			name: "scrollRegionLabel",
			type: "string | null",
			default: "null",
			description:
				'Accessible name for the scroll region. Providing one promotes the wrapper to an ARIA landmark (role="region", tabindex="0", focus ring); without it the wrapper still scrolls but is not announced.',
		},
		{
			component: "[itxSort]",
			name: "sortMode",
			type: "'auto' | 'manual'",
			default: "'auto'",
			description:
				"'auto' reorders items in the table directly. 'manual' emits (sortChange) and passes items through untouched — for server-side or paginated data.",
		},
		{
			component: "[itxSort]",
			name: "sortActive",
			type: "string | null | undefined",
			default: "undefined",
			description:
				"Seed or control the active sort column key. Leave unbound for fully uncontrolled sorting.",
		},
		{
			component: "[itxSort]",
			name: "sortDirection",
			type: "'asc' | 'desc' | undefined",
			default: "undefined",
			description:
				"Seed or control the sort direction. Ignored when sortActive is not set.",
		},
	];

	// `itx-size` is a plain attribute matched by the theme
	// (`:where(interop-table[itx-size="…"])`) — there is no input() for it, so it
	// belongs here rather than in the Inputs table.
	attrColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Host", sticky: true },
		{ key: "name", label: "Attribute" },
		{ key: "type", label: "Values" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	attrEntries: ApiEntry[] = [
		{
			component: "<interop-table>",
			name: "itx-size",
			type: '"sm" | "md" | "lg" | "xl"',
			default: '"lg"',
			description:
				"Row density. Sets the row block-size to 32 / 40 / 48 / 64px and the matching cell padding. xl also top-aligns cells, since a 64px row is expected to hold two lines.",
		},
	];

	outputColumns: TableColumn<ApiOutputEntry>[] = [
		{ key: "component", label: "Host", sticky: true },
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiOutputEntry[] = [
		{
			component: "[itxSort]",
			name: "sortChange",
			type: "TableSortEvent",
			description:
				"Fires on every sort toggle, in both 'auto' and 'manual' modes. Emits { key, direction }.",
		},
	];
}
