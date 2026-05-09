import type { Signal } from "@angular/core";
import type { Observable } from "rxjs";
import type { InteropCollection } from "./interop-collection";

/**
 * The "throw it at us" union — every shape an Interop collection consumer
 * can hand in as a data source.
 *
 * Edge cases:
 *  - `string` is technically `Iterable<string>`. The dispatcher rejects it
 *    explicitly with a dev warning; a string is virtually never the
 *    intended source.
 *  - `Map<K, V>` is iterable as `[K, V]` tuples. The dispatcher logs a
 *    dev warning and falls back to `map.values()` so the most common
 *    intent works without surprise.
 */
export type SimpleIterable<T> =
	| readonly T[]
	| Iterable<T>
	| Promise<readonly T[] | Iterable<T>>
	| Observable<readonly T[] | Iterable<T>>
	| Signal<readonly T[] | Iterable<T>>;

/**
 * Wrapper shape for sources that need to declare an initial loading flag
 * alongside the data source itself.
 */
export interface Collection<T = unknown> {
	items: SimpleIterable<T>;
	loading?: boolean;
}

/**
 * Component-input union — the headline DX type. Use this anywhere a
 * component accepts data from "wherever the consumer has it".
 *
 * @example
 * ```ts
 * collection = input<InteropCollectionInput<User>>();
 * readonly data = interopCollection(this.collection);
 * ```
 */
export type InteropCollectionInput<T> =
	| SimpleIterable<T>
	| Collection<T>
	| InteropCollection<T>;

// ── Type guards ───────────────────────────────────────────────────────────

export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
	return (
		!!value &&
		(typeof value === "object" || typeof value === "function") &&
		typeof (value as { then?: unknown }).then === "function"
	);
}

export function isObservableLike<T>(value: unknown): value is Observable<T> {
	return (
		!!value &&
		typeof value === "object" &&
		typeof (value as { subscribe?: unknown }).subscribe === "function"
	);
}

/**
 * Plain-object Collection<T> shape — `{ items, loading? }`. Excludes other
 * forms by elimination at the call site. The dispatcher orders checks so
 * this is reached only after class instances, arrays, signals, observables,
 * and promises have been ruled out.
 */
export function isCollection<T>(value: unknown): value is Collection<T> {
	return (
		!!value &&
		typeof value === "object" &&
		!Array.isArray(value) &&
		"items" in value
	);
}

export function isSimpleIterable<T>(value: unknown): value is Iterable<T> {
	return (
		!!value &&
		typeof value !== "string" &&
		typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator] ===
			"function"
	);
}
