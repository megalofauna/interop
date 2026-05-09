import { InjectionToken } from "@angular/core";
import type { Signal } from "@angular/core";

/**
 * Describes the sorting API that InteropTable reads from the optional
 * [itxSort] directive via dependency injection.
 *
 * Consumers who want to implement a custom sort state (e.g. integrating with
 * an NgRx selector or a URL-param controller) can provide their own
 * implementation of this interface against INTEROP_TABLE_SORT.
 */
export interface InteropTableSortApi {
	/** Signal: the column key currently sorted, or null if unsorted. */
	readonly activeKey: Signal<string | null>;

	/** Signal: current sort direction. */
	readonly direction: Signal<"asc" | "desc">;

	/**
	 * Toggle sort for a column key. If the column is already active, flips the
	 * direction; otherwise activates it ascending.
	 */
	toggle(key: string): void;

	/**
	 * Return a sorted copy of `items` according to current sort state.
	 * Called inside the table's `items` computed — signal reads inside this
	 * method are automatically tracked, so sort-state changes trigger a
	 * recompute without any explicit effect().
	 *
	 * When sortMode is 'manual' (external), this should return items unchanged.
	 */
	getTransformedItems<T>(items: T[]): T[];
}

/**
 * Injection token for the optional table sort state.
 *
 * InteropTable optionally injects this token. When absent (no [itxSort] on
 * the table), all sort-related template branches are inert and the items
 * pipeline passes data through unchanged — zero bundle cost for tables that
 * don't use sorting.
 *
 * Provided automatically by [itxSort]. Can also be provided by a custom
 * implementation for advanced integration (e.g. NgRx, URL params).
 */
export const INTEROP_TABLE_SORT =
	new InjectionToken<InteropTableSortApi>("INTEROP_TABLE_SORT");
