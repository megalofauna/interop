import { Observable } from "rxjs";

/**
 * Core interoperable collection types that work seamlessly across different data sources,
 * patterns, and workflows. The ethos is maximum compatibility without forced conversions.
 */

/**
 * Base type representing any iterable data source.
 * Embraces the principle that data can come from anywhere in any format.
 */
export type InteropIterable<T> =
  | Iterable<T>
  | ArrayLike<T>
  | Observable<T[]>
  | Observable<Iterable<T>>
  | Promise<T[]>
  | Promise<Iterable<T>>;

/**
 * Primary collection interface - the heart of interoperability.
 * Accepts any reasonable data source without forcing specific implementations.
 */
export interface InteropCollection<T = any> {
  /**
   * The data source - can be sync, async, reactive, or any iterable format.
   * Components should handle all variations gracefully.
   */
  items: InteropIterable<T>;

  /**
   * Optional transformation function to normalize items.
   * Enables interop between different data shapes without requiring pre-processing.
   */
  transform?: (item: any) => T;

  /**
   * Optional key extraction for tracking and performance.
   * Works with any object structure - no forced conventions.
   */
  trackBy?: (index: number, item: T) => any;

  /**
   * Loading state management for async sources.
   * Components can opt into this behavior when needed.
   */
  loading$?: Observable<boolean>;

  /**
   * Error handling for async sources.
   * Graceful degradation without breaking the interface.
   */
  error$?: Observable<Error | null>;
}

/**
 * Simplified collection type for when you just need the items.
 * Maintains interop while reducing boilerplate for simple cases.
 */
export type SimpleCollection<T> = InteropIterable<T> | InteropCollection<T>;

/**
 * Paginated collection for large datasets.
 * Interoperates with any pagination strategy without imposing one.
 */
export interface InteropPaginatedCollection<T> extends InteropCollection<T> {
  /**
   * Current page information - flexible structure
   */
  pagination?: {
    current?: number;
    total?: number;
    size?: number;
    hasMore?: boolean;
    [key: string]: any; // Allow custom pagination metadata
  };

  /**
   * Load more function - components can implement any loading strategy
   */
  loadMore?: () => void | Promise<void> | Observable<any>;
}

/**
 * Filtered/Searchable collection.
 * Interoperates with any filtering approach - client-side, server-side, or hybrid.
 */
export interface InteropFilterableCollection<T> extends InteropCollection<T> {
  /**
   * Current filter state - intentionally flexible
   */
  filter?: any;

  /**
   * Filter function - can be sync or async, local or remote
   */
  onFilter?: (filter: any) => void | Promise<void> | Observable<any>;

  /**
   * Search term for text-based filtering
   */
  searchTerm?: string;

  /**
   * Search function - flexible implementation
   */
  onSearch?: (term: string) => void | Promise<void> | Observable<any>;
}

/**
 * Sortable collection.
 * Works with any sorting mechanism without forcing a specific approach.
 */
export interface InteropSortableCollection<T> extends InteropCollection<T> {
  /**
   * Current sort state - flexible structure
   */
  sort?: {
    field?: string | keyof T;
    direction?: "asc" | "desc" | string;
    [key: string]: any; // Custom sort metadata
  };

  /**
   * Sort function - can handle any sorting strategy
   */
  onSort?: (sort: any) => void | Promise<void> | Observable<any>;
}

/**
 * Full-featured collection combining all interop capabilities.
 * Components can use any subset of features they need.
 */
export interface InteropAdvancedCollection<T>
  extends
    InteropPaginatedCollection<T>,
    InteropFilterableCollection<T>,
    InteropSortableCollection<T> {
  /**
   * Selection state for interactive collections
   */
  selection?: {
    selected?: Set<any> | any[];
    mode?: "single" | "multiple" | "none" | string;
    onSelect?: (item: T, selected: boolean) => void;
  };

  /**
   * Grouping for hierarchical data display
   */
  grouping?: {
    groupBy?: string | keyof T | ((item: T) => any);
    groups?: Map<any, T[]> | { [key: string]: T[] };
  };
}

/**
 * Type guards for runtime detection of collection capabilities.
 * Enables components to adapt behavior based on available features.
 */
export namespace InteropCollectionGuards {
  export function isPaginated<T>(
    collection: any,
  ): collection is InteropPaginatedCollection<T> {
    return (
      collection && typeof collection === "object" && "pagination" in collection
    );
  }

  export function isFilterable<T>(
    collection: any,
  ): collection is InteropFilterableCollection<T> {
    return (
      collection &&
      typeof collection === "object" &&
      ("filter" in collection || "onFilter" in collection)
    );
  }

  export function isSortable<T>(
    collection: any,
  ): collection is InteropSortableCollection<T> {
    return (
      collection &&
      typeof collection === "object" &&
      ("sort" in collection || "onSort" in collection)
    );
  }

  export function isAdvanced<T>(
    collection: any,
  ): collection is InteropAdvancedCollection<T> {
    return (
      isPaginated(collection) ||
      isFilterable(collection) ||
      isSortable(collection)
    );
  }

  export function isSimpleIterable<T>(
    collection: any,
  ): collection is InteropIterable<T> {
    return (
      collection &&
      (Symbol.iterator in Object(collection) ||
        "length" in collection ||
        collection.subscribe || // Observable
        collection.then) // Promise
    );
  }
}

/**
 * Utility type for component inputs - accepts the most flexible collection format.
 * This is what components should use in their @Input() declarations.
 */
export type CollectionInput<T> = SimpleCollection<T>;

/**
 * Configuration interface for collection behavior.
 * Allows components to specify their interop preferences.
 */
export interface InteropCollectionConfig {
  /**
   * How to handle async sources
   */
  async?: {
    strategy?: "immediate" | "lazy" | "manual";
    retries?: number;
    timeout?: number;
  };

  /**
   * Performance optimizations
   */
  performance?: {
    virtualScroll?: boolean;
    trackByFunction?: boolean;
    lazy?: boolean;
  };

  /**
   * Accessibility features
   */
  a11y?: {
    announceChanges?: boolean;
    keyboardNavigation?: boolean;
    screenReaderOptimizations?: boolean;
  };
}
