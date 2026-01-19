import { Observable } from "rxjs";

/**
 * Minimal interoperable collection types - starting small and building up.
 * Full implementation available in collection-full.ts when ready.
 */

/**
 * Simple iterable type that accepts the most common data sources.
 * Start here and expand as needed.
 */
export type SimpleIterable<T> =
  | T[]
  | Iterable<T>
  | Promise<T[]>
  | Observable<T[]>;

/**
 * Collection interface - the foundation of interoperability.
 * Clean, simple, and powerful enough to handle most use cases.
 */
export interface Collection<T = any> {
  /**
   * The data source - accepts any iterable format
   */
  items: SimpleIterable<T>;

  /**
   * Optional loading state for async sources
   */
  loading?: boolean;
}

// Forward declare InteropCollection for type system
declare class InteropCollection<T = any> {
  readonly items: { (): T[] };
  readonly loading: { (): boolean };
  readonly error: { (): any };
}

/**
 * Main collection input type for components.
 * Accept either raw data, a collection object, or an InteropCollection instance.
 */
export type InteropCollectionInput<T> =
  | SimpleIterable<T>
  | Collection<T>
  | InteropCollection<T>;

/**
 * Simple type guard to check if we have a collection object
 */
export function isCollection<T>(value: any): value is Collection<T> {
  return value && typeof value === "object" && "items" in value;
}

/**
 * Type guard for simple iterables
 */
export function isSimpleIterable<T>(value: any): value is SimpleIterable<T> {
  return (
    Array.isArray(value) ||
    (value && Symbol.iterator in Object(value)) ||
    (value && typeof value.then === "function") ||
    (value && typeof value.subscribe === "function")
  );
}

// TODO: Gradually migrate features from collection-full.ts as needed:
// - Pagination (InteropPaginatedCollection)
// - Filtering (InteropFilterableCollection)
// - Sorting (InteropSortableCollection)
// - Advanced features (InteropAdvancedCollection)
// - Configuration (InteropCollectionConfig)
