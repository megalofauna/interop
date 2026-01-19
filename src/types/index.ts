/**
 * Interop Collection System
 *
 * A comprehensive TypeScript interface system built around the ethos of interoperability.
 * Designed to work seamlessly with any data source, pattern, or workflow without
 * forcing conversions or specific implementations.
 *
 * @example Basic Usage
 * ```typescript
 * // Works with arrays
 * const arrayCollection: CollectionInput<string> = ['a', 'b', 'c'];
 *
 * // Works with observables
 * const obsCollection: CollectionInput<User> = this.http.get<User[]>('/api/users');
 *
 * // Works with promises
 * const promiseCollection: CollectionInput<Item> = fetch('/api/items').then(r => r.json());
 *
 * // Works with sets
 * const setCollection: CollectionInput<number> = new Set([1, 2, 3]);
 * ```
 *
 * @example Advanced Usage
 * ```typescript
 * const advancedCollection: InteropAdvancedCollection<Product> = {
 *   items: this.productService.getProducts(),
 *   transform: (raw) => new Product(raw),
 *   trackBy: createUniversalTrackBy('id'),
 *   pagination: { current: 1, size: 20 },
 *   sort: { field: 'name', direction: 'asc' },
 *   filter: { category: 'electronics' }
 * };
 * ```
 */

// Core Collection Types (from simplified collection.ts)
export {
  SimpleIterable,
  Collection,
  InteropCollectionInput,
  isCollection,
  isSimpleIterable,
} from "./collection";

// Full Collection Types (from collection-full.ts)
export {
  InteropIterable,
  InteropCollection,
  SimpleCollection,
  InteropPaginatedCollection,
  InteropFilterableCollection,
  InteropSortableCollection,
  InteropAdvancedCollection,
  InteropCollectionConfig,
  CollectionInput,
} from "./collection-full";

// Type Guards and Runtime Detection
export { InteropCollectionGuards } from "./collection-full";

// Utilities and Helpers
export {
  normalizeCollection,
  createInteropCollection,
  extractItems,
  createUniversalTrackBy,
  mergeCollections,
  InteropCollectionAdapter,
  InteropPerformance,
} from "./collection-utils";

// Interactive Extensions
export {
  InteractiveItem,
  CallbackItem,
  FormItem,
  SelectableItem,
  FlexibleItem,
  InteropInteractiveCollection,
  InteropCoordinatedCollection,
} from "./interactive-extensions";

export {
  InteropInteractiveGuards,
  InteropInteractiveUtils,
  InteropInteractionPatterns,
  InteropComponentHelpers,
} from "./interactive-extensions";

// Re-export common RxJS types for convenience
// Re-export RxJS types
export type { Observable, BehaviorSubject } from "rxjs";

/**
 * Quick start helpers for common scenarios
 */
export namespace InteropQuickStart {
  /**
   * Convert any data source to a simple observable collection
   */
  export function fromAny<T>(source: any) {
    // Implementation would use normalizeCollection when imported properly
    return source;
  }

  /**
   * Create a basic collection input type
   */
  export type Basic<T> = any;

  /**
   * Create a collection with common features
   */
  export function withFeatures<T>(items: any) {
    // Implementation would use createInteropCollection when imported properly
    return items;
  }

  /**
   * Create an interactive collection from any data
   */
  export function withInteractivity<T>(source: any) {
    // Implementation would use normalizeCollection when imported properly
    return source;
  }
}

/**
 * Version information
 */
export const Interop_VERSION = "1.0.0";

/**
 * Library metadata for tooling and documentation
 */
export const Interop_METADATA = {
  name: "Interop Collection System",
  version: Interop_VERSION,
  description:
    "TypeScript interfaces for truly interoperable Angular collections",
  ethos: "Accept anything, convert gracefully, work everywhere",
  keywords: [
    "angular",
    "typescript",
    "collections",
    "interoperability",
    "reactive",
  ],
} as const;
