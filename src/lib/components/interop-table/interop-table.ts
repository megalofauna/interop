import {
	Component,
	ChangeDetectionStrategy,
	ElementRef,
	OnDestroy,
	TemplateRef,
	computed,
	contentChildren,
	input,
	inject,
	signal,
	effect,
	viewChild,
	TrackByFunction,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
	type InteropCollectionInput,
	interopCollection,
} from "../../collection/public-api";
import {
	InteropAttribute,
	SetAttrsConfig,
	PresetKey,
} from "../../services/interop-attribute.service";
import { createComponentTrackByFn } from "../../utils/track-by";
import { InteropCellDef, InteropCellContext } from "./interop-cell-def";
import type { InteropTableSortApi } from "./interop-table-sort.token";

/**
 * A sentinel item that renders as a group header row spanning all columns.
 * Include inline in the collection alongside data rows to create visual groups.
 *
 * @example
 * ```ts
 * entries = [
 *   { groupLabel: 'Layout' },
 *   { property: '--itx-button-display', default: 'inline-flex' },
 *   { groupLabel: 'Typography' },
 *   { property: '--itx-button-font-size', default: 'var(--itx-fs-label)' },
 * ];
 * ```
 */
export interface TableGroupRow {
	groupLabel: string;
}

export function isTableGroupRow(item: unknown): item is TableGroupRow {
	return typeof item === "object" && item !== null && "groupLabel" in item;
}

/**
 * Column definition for InteropTable.
 */
export interface TableColumn<T = any> {
	/** Property key from the data object to display. */
	key: keyof T | string;

	/** Display label for the column header. Defaults to the key name. */
	label?: string;

	/** Whether this column is hidden. */
	hidden?: boolean;

	/**
	 * Whether this column sticks to the left edge during horizontal scroll.
	 * Apply to the leftmost column(s) only.
	 */
	sticky?: boolean;

	/**
	 * Explicit left offset in pixels for sticky columns.
	 * Required only when multiple consecutive columns are sticky.
	 * The first sticky column is always `left: 0`; subsequent sticky columns
	 * must declare their offset manually (sum of all preceding sticky column widths).
	 */
	stickyLeft?: number;

	/**
	 * Whether this column participates in sorting when [itxSort] is applied to
	 * the table. Has no effect without [itxSort] — no bundle cost for tables
	 * that don't import the sort directive.
	 */
	sortable?: boolean;

	/**
	 * Custom comparator for 'auto' mode sorting. When provided, replaces the
	 * default locale-aware comparator for this column only. Receives two row
	 * items; return negative / zero / positive for sort order.
	 */
	comparator?: (a: T, b: T) => number;
}

/**
 * InteropTable — Semantic, signal-based table component.
 *
 * @example Basic
 * ```html
 * <interop-table [collection]="users" />
 * ```
 *
 * @example Wide table with sticky first column, exposed as a landmark
 * ```html
 * <interop-table
 *   [collection]="rows"
 *   [columns]="cols"
 *   scrollRegionLabel="Cargo manifest"
 * />
 * ```
 * Where `cols[0]` has `sticky: true`. `scrollable` defaults to true; naming
 * the region promotes the scroll wrapper to an ARIA landmark.
 */
@Component({
	selector: "interop-table",
	standalone: true,
	imports: [CommonModule],
	templateUrl: "./interop-table.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropTable<T = any> implements OnDestroy {
	private readonly attrsManager = inject(InteropAttribute);
	private readonly scrollContainerEl =
		viewChild<ElementRef<HTMLDivElement>>("scrollContainerEl");

	// ── Inputs ────────────────────────────────────────────────────────────────

	/** Data collection. Accepts arrays, Observables, Promises, or InteropCollection. */
	collection = input<InteropCollectionInput<T>>();

	/** Column definitions. Auto-generated from first data item when omitted. */
	columns = input<TableColumn<T>[] | null>(null);

	/** Row tracking strategy: 'auto', 'index', or a custom TrackByFunction. */
	trackBy = input<TrackByFunction<T> | "auto" | "index">("auto");

	/** Field to use for identity tracking when trackBy is 'auto'. */
	trackByField = input<keyof T | null>(null);

	/** Whether to show column header row. */
	showHeaders = input<boolean>(true);

	/** Text shown when no data is available. */
	emptyText = input<string>("No data available");

	/** Text shown while loading. */
	loadingText = input<string>("Loading...");

	/** Auto-generate columns from the first data item when no columns are provided. */
	autoColumns = input<boolean>(true);

	/** Maximum number of rows to display. null = no limit. */
	maxRows = input<number | null>(null);

	/**
	 * Whether to wrap the table in a horizontal-scroll container. Default is
	 * `true` — wide tables overflow gracefully out of the box and the page
	 * remains layout-stable on narrow viewports. Set to `false` to render the
	 * table without an overflow wrapper (e.g. when a parent already manages
	 * overflow, or when the table is guaranteed to fit).
	 */
	scrollable = input<boolean>(true);

	/**
	 * Accessible label for the scroll region. **Providing a label is what
	 * promotes the wrapper to an ARIA landmark** (`role="region"`,
	 * `tabindex="0"`, focus ring). Without a label, the wrapper still scrolls
	 * but is not exposed as a landmark — keeping it out of the screen-reader
	 * landmark list unless the author has named it.
	 *
	 * Naming a region is the AT contract: a region without a name is not a
	 * useful landmark. Pair `scrollable` (mechanism) with this input
	 * (semantics) consciously.
	 *
	 * @example Promote to landmark
	 * ```html
	 * <interop-table scrollRegionLabel="Cargo manifest" [collection]="rows" />
	 * ```
	 */
	scrollRegionLabel = input<string | null>(null);

	// ── Optional sort integration ─────────────────────────────────────────────

	private readonly _sortRef = signal<InteropTableSortApi | null>(null);

	/**
	 * Signal: the [itxSort] directive registers itself here on construction and
	 * clears on destroy. Null when no sort directive is present — all sort
	 * template branches and the items transform are inert in that case.
	 */
	protected readonly sort = this._sortRef.asReadonly();

	/** Called by [itxSort] on construction/destroy. Not part of the public API. */
	registerSort(api: InteropTableSortApi | null): void {
		this._sortRef.set(api);
	}

	// ── Content children ──────────────────────────────────────────────────────

	private readonly cellDefs = contentChildren(InteropCellDef);

	readonly cellTemplateMap = computed(() => {
		const map = new Map<string, TemplateRef<InteropCellContext<T>>>();
		for (const def of this.cellDefs()) {
			map.set(def.itxCell(), def.templateRef);
		}
		return map;
	});

	// ── Internal state ────────────────────────────────────────────────────────

	private readonly resolved = interopCollection<T>(this.collection);
	private readonly autoGeneratedColumns = signal<TableColumn<T>[]>([]);
	private rafId: number | null = null;

	/** True once the scroll container has been scrolled past its left origin. */
	readonly isScrolled = signal(false);

	// ── Computed ──────────────────────────────────────────────────────────────

	readonly items = computed(() => {
		const raw = this.resolved.items();
		// When [itxSort] is present, getTransformedItems() reads its own
		// activeKey/direction signals — those reads are tracked here, so the
		// computed re-runs automatically on every sort change.
		const sort = this.sort();
		const items = sort ? sort.getTransformedItems(raw) : raw;
		const max = this.maxRows();
		return max == null ? items : items.slice(0, max);
	});

	readonly isLoading = this.resolved.loading;
	readonly hasError = this.resolved.hasError;
	readonly isEmpty = this.resolved.isEmpty;

	readonly resolvedColumns = computed(() => {
		const custom = this.columns();
		if (custom && custom.length > 0) return custom.filter((c) => !c.hidden);
		if (this.autoColumns()) return this.autoGeneratedColumns().filter((c) => !c.hidden);
		return [];
	});

	readonly hasStickyColumns = computed(() =>
		this.resolvedColumns().some((c) => c.sticky),
	);

	/**
	 * True when the scroll wrapper should be exposed as an ARIA landmark
	 * (`role="region"` + accessible name + focusable). Requires both
	 * `scrollable` and a non-empty `scrollRegionLabel` — naming the region
	 * is what makes it a landmark; an unnamed region is not announced.
	 */
	readonly hasScrollRegion = computed(() => {
		if (!this.scrollable()) return false;
		const label = this.scrollRegionLabel();
		return label != null && label !== "";
	});

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	constructor() {
		effect(() => {
			const items = this.items();
			const custom = this.columns();
			if (
				this.autoColumns() &&
				(!custom || custom.length === 0) &&
				items.length > 0
			) {
				this.autoGeneratedColumns.set(this.generateColumnsFromData(items[0]));
			} else if (!this.autoColumns() || (custom && custom.length > 0)) {
				this.autoGeneratedColumns.set([]);
			}
		});
	}

	ngOnDestroy(): void {
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}

	// ── Scroll handling ───────────────────────────────────────────────────────

	onScroll(): void {
		if (this.rafId !== null) return;
		this.rafId = requestAnimationFrame(() => {
			this.rafId = null;
			const el = this.scrollContainerEl()?.nativeElement;
			this.isScrolled.set((el?.scrollLeft ?? 0) > 1);
		});
	}

	// ── Template helpers ──────────────────────────────────────────────────────

	getCellTemplate(column: TableColumn<T>): TemplateRef<InteropCellContext<T>> | null {
		return this.cellTemplateMap().get(String(column.key)) ?? null;
	}

	getCellText(item: T, column: TableColumn<T>): string {
		const value = (item as any)?.[column.key as string];
		if (value == null) return "";
		return String(value);
	}

	getColumnLabel(column: TableColumn<T>): string {
		return column.label ?? String(column.key);
	}

	getStickyLeft(column: TableColumn<T>): string {
		return `${column.stickyLeft ?? 0}px`;
	}

	readonly isGroupRow = isTableGroupRow;

	trackByFn = createComponentTrackByFn<T>(
		() => this.trackBy(),
		() => this.trackByField(),
	);

	trackByColumnIndex = (_index: number, column: TableColumn<T>): any => column.key;

	getAriaSort(column: TableColumn<T>): "ascending" | "descending" | "none" {
		const sort = this.sort();
		if (!sort) return "none";
		const key = String(column.key);
		if (sort.activeKey() !== key) return "none";
		return sort.direction() === "asc" ? "ascending" : "descending";
	}

	// ── Private ───────────────────────────────────────────────────────────────

	private generateColumnsFromData(firstItem: T): TableColumn<T>[] {
		if (!firstItem || typeof firstItem !== "object") return [];
		return (Object.keys(firstItem) as (keyof T)[]).map((key) => ({
			key,
			label: this.formatKeyAsLabel(String(key)),
		}));
	}

	private formatKeyAsLabel(key: string): string {
		return key
			.replace(/([a-z])([A-Z])/g, "$1 $2")
			.replace(/[_-]/g, " ")
			.toLowerCase()
			.replace(/^\w/, (c) => c.toUpperCase());
	}
}
