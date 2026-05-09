import { Directive, OnDestroy, Signal, effect, inject, input, output, signal } from "@angular/core";
import { InteropTable, type TableColumn } from "./interop-table";
import type { InteropTableSortApi } from "./interop-table-sort.token";

/**
 * Emitted by [itxSort] on every sort change, regardless of sortMode.
 *
 * In 'manual' mode this is the signal to re-fetch or re-sort externally.
 * In 'auto' mode it can be observed for side effects (URL persistence,
 * analytics) — the directive handles item ordering itself.
 */
export interface TableSortEvent {
	key: string;
	direction: "asc" | "desc";
}

/**
 * InteropTableSort — opt-in column sorting for InteropTable.
 *
 * Apply to any `<interop-table>` to activate sorting. Import this directive
 * only where sorting is needed — tables without it pay zero bundle cost.
 *
 * ## Modes
 *
 * - `'auto'` (default) — the directive sorts items in the table directly.
 *   No data-fetching needed; correct for fully in-memory datasets.
 *
 * - `'manual'` — the directive emits `(sortChange)` and steps back.
 *   Items pass through unchanged. The consumer re-fetches or reorders the
 *   collection externally. Correct for server-side or paginated datasets.
 *
 * ## Columns
 *
 * Declare sortable columns by adding `sortable: true` to the column
 * definition. Unsortable columns render plain headers with no interaction.
 *
 * Provide a custom `comparator` function on the column definition to override
 * the default locale-aware sort for that column.
 *
 * ## Initial / controlled sort state
 *
 * - `[sortActive]` — seed (or control) the active column key.
 * - `[sortDirection]` — seed (or control) the direction.
 *
 * Binding these inputs and listening to `(sortChange)` gives full controlled
 * behaviour (e.g. persisting sort in URL params or localStorage).
 * Leaving them unbound gives fully uncontrolled behaviour — the directive
 * manages all sort state internally.
 *
 * @example Auto mode (internal sort)
 * ```html
 * <interop-table [collection]="rows" [columns]="cols" itxSort />
 * ```
 *
 * @example Manual mode (server-side sort)
 * ```html
 * <interop-table
 *   [collection]="rows"
 *   [columns]="cols"
 *   itxSort
 *   sortMode="manual"
 *   (sortChange)="reload($event)"
 * />
 * ```
 *
 * @example Initial sort state
 * ```html
 * <interop-table
 *   [collection]="rows"
 *   [columns]="cols"
 *   itxSort
 *   sortActive="name"
 *   sortDirection="desc"
 * />
 * ```
 */
@Directive({
	selector: "[itxSort]",
	standalone: true,
})
export class InteropTableSort implements InteropTableSortApi, OnDestroy {
	private readonly table = inject(InteropTable);

	// ── Inputs ─────────────────────────────────────────────────────────────────

	/**
	 * Whether the directive sorts items internally ('auto') or only emits sort
	 * events for the consumer to handle ('manual').
	 */
	sortMode = input<"auto" | "manual">("auto");

	/**
	 * Seed or control the active sort column. Leave unbound for uncontrolled
	 * mode. When bound, syncs the internal state on every change — pair with
	 * `(sortChange)` to build a fully controlled sort.
	 */
	sortActive = input<string | null | undefined>(undefined);

	/**
	 * Seed or control the sort direction. Leave unbound for uncontrolled mode.
	 * Ignored when `sortActive` is not set.
	 */
	sortDirection = input<"asc" | "desc" | undefined>(undefined);

	// ── Outputs ────────────────────────────────────────────────────────────────

	/** Fires on every sort toggle, in both 'auto' and 'manual' modes. */
	sortChange = output<TableSortEvent>();

	// ── Internal state ─────────────────────────────────────────────────────────

	private readonly _activeKey = signal<string | null>(null);
	private readonly _direction = signal<"asc" | "desc">("asc");

	// ── InteropTableSortApi ────────────────────────────────────────────────────

	readonly activeKey: Signal<string | null> = this._activeKey.asReadonly();
	readonly direction: Signal<"asc" | "desc"> = this._direction.asReadonly();

	constructor() {
		// Register with the host table immediately — before the first render so
		// sort buttons appear on the initial paint rather than after a tick.
		this.table.registerSort(this);

		// Sync controlled inputs → internal state whenever they change.
		// The `!== undefined` guard means unbound inputs (which stay `undefined`)
		// never overwrite internally-driven state.
		effect(() => {
			const key = this.sortActive();
			if (key !== undefined) this._activeKey.set(key);
		});
		effect(() => {
			const dir = this.sortDirection();
			if (dir !== undefined) this._direction.set(dir);
		});
	}

	ngOnDestroy(): void {
		this.table.registerSort(null);
	}

	toggle(key: string): void {
		const current = this._activeKey();
		const newDir: "asc" | "desc" =
			current === key
				? this._direction() === "asc"
					? "desc"
					: "asc"
				: "asc";

		this._activeKey.set(key);
		this._direction.set(newDir);
		this.sortChange.emit({ key, direction: newDir });
	}

	getTransformedItems<T>(items: T[]): T[] {
		if (this.sortMode() !== "auto") return items;

		const key = this._activeKey();
		if (!key) return items;

		const dir = this._direction();
		const col = this.table
			.resolvedColumns()
			.find((c) => String(c.key) === key) as TableColumn<T> | undefined;

		const sorted = [...items].sort(
			col?.comparator ?? buildDefaultComparator<T>(key),
		);

		return dir === "asc" ? sorted : sorted.reverse();
	}
}

/**
 * Default comparator for a given column key:
 * - null/undefined values sink to the bottom
 * - numbers compared numerically
 * - everything else compared as locale-aware strings
 */
function buildDefaultComparator<T>(key: string): (a: T, b: T) => number {
	return (a, b) => {
		const av = (a as Record<string, unknown>)[key];
		const bv = (b as Record<string, unknown>)[key];
		if (av == null && bv == null) return 0;
		if (av == null) return 1;
		if (bv == null) return -1;
		if (typeof av === "number" && typeof bv === "number") return av - bv;
		return String(av).localeCompare(String(bv));
	};
}
