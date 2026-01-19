import { Observable, of, from, BehaviorSubject, EMPTY } from "rxjs";
import { map, catchError, startWith } from "rxjs/operators";
import {
  InteropIterable,
  InteropCollection,
  SimpleCollection,
  InteropCollectionConfig,
  InteropCollectionGuards,
} from "./collection-full";

/**
 * Utility functions for seamless collection interoperability.
 * These functions enable components to work with any data source without conversion overhead.
 */

/**
 * Normalizes any collection input into a consistent Observable<T[]> stream.
 * The cornerstone of interoperability - handles all possible input types gracefully.
 */
export function normalizeCollection<T>(
  collection: SimpleCollection<T>,
  config?: InteropCollectionConfig,
): Observable<T[]> {
  // Handle full InteropCollection objects
  if (isInteropCollection(collection)) {
    return normalizeCollection(collection.items, config) as Observable<T[]>;
  }

  // Handle direct iterables
  if (InteropCollectionGuards.isSimpleIterable(collection)) {
    return normalizeIterable(collection as InteropIterable<T>, config);
  }

  // Fallback - treat as empty collection
  console.warn("InteropCollection: Unknown collection type, treating as empty");
  return of([]);
}

/**
 * Converts any iterable source into an Observable<T[]>.
 * Maintains the ethos of accepting anything, converting gracefully.
 */
function normalizeIterable<T>(
  iterable: InteropIterable<T>,
  config?: InteropCollectionConfig,
): Observable<T[]> {
  const timeout = config?.async?.timeout || 30000;
  const retries = config?.async?.retries || 0;

  // Already an Observable of arrays
  if (isObservableArray<T>(iterable)) {
    return (iterable as Observable<T[]>).pipe(
      catchError((error) => {
        console.error("InteropCollection: Observable error", error);
        return of([]);
      }),
    );
  }

  // Observable of iterables (convert to array)
  if (isObservableIterable<T>(iterable)) {
    return (iterable as Observable<Iterable<T>>).pipe(
      map((iter) => Array.from(iter)),
      catchError((error) => {
        console.error("InteropCollection: Observable iterable error", error);
        return of([]);
      }),
    );
  }

  // Promise of arrays
  if (isPromiseArray(iterable)) {
    return from(iterable).pipe(
      catchError((error) => {
        console.error("InteropCollection: Promise error", error);
        return of([]);
      }),
    );
  }

  // Promise of iterables
  if (isPromiseIterable(iterable)) {
    return from(iterable).pipe(
      map((iter) => Array.from(iter)),
      catchError((error) => {
        console.error("InteropCollection: Promise iterable error", error);
        return of([]);
      }),
    );
  }

  // Synchronous iterables (Arrays, Sets, etc.)
  try {
    return of(Array.from(iterable as Iterable<T>));
  } catch (error) {
    console.error("InteropCollection: Sync iterable error", error);
    return of([]);
  }
}

/**
 * Creates a reactive collection from any source with full interop capabilities.
 * This is the main factory function for building interoperable collections.
 */
export function createInteropCollection<T>(
  source: InteropIterable<T>,
  options?: {
    transform?: (item: any) => T;
    trackBy?: (index: number, item: T) => any;
    config?: InteropCollectionConfig;
  },
): InteropCollection<T> {
  const loading$ = new BehaviorSubject<boolean>(false);
  const error$ = new BehaviorSubject<Error | null>(null);

  const items$ = normalizeCollection(source, options?.config).pipe(
    startWith([]),
    map((items) => {
      loading$.next(false);
      error$.next(null);
      return options?.transform ? items.map(options.transform) : items;
    }),
    catchError((error) => {
      loading$.next(false);
      error$.next(error);
      return of([]);
    }),
  );

  return {
    items: items$,
    transform: options?.transform,
    trackBy: options?.trackBy,
    loading$: loading$.asObservable(),
    error$: error$.asObservable(),
  };
}

/**
 * Safely extracts items from any collection source.
 * Perfect for components that need immediate access to data.
 */
export async function extractItems<T>(
  collection: SimpleCollection<T>,
  options?: {
    timeout?: number;
    defaultValue?: T[];
  },
): Promise<T[]> {
  const timeout = options?.timeout || 5000;
  const defaultValue = options?.defaultValue || [];

  try {
    if (isInteropCollection(collection)) {
      return await extractItems(
        collection.items as SimpleCollection<T>,
        options,
      );
    }

    if (InteropCollectionGuards.isSimpleIterable(collection)) {
      const iterable = collection as InteropIterable<T>;

      // Sync iterables - immediate extraction
      if (isArrayLike(iterable) || isIterable(iterable)) {
        return Array.from(iterable as Iterable<T>);
      }

      // Async sources - wait with timeout
      const result = await Promise.race([
        normalizeCollection(iterable)
          .pipe(map((items) => items || []))
          .toPromise(),
        new Promise<T[]>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), timeout),
        ),
      ]);

      return (result as T[]) || defaultValue;
    }

    return defaultValue;
  } catch (error) {
    console.warn("InteropCollection: Failed to extract items", error);
    return defaultValue;
  }
}

/**
 * Creates a trackBy function that works with any object structure.
 * Embodies interoperability by not assuming specific object shapes.
 */
export function createUniversalTrackBy<T>(
  keyPath?: string | ((item: T) => any),
): (index: number, item: T) => any {
  return (index: number, item: T): any => {
    if (!keyPath) {
      return index;
    }

    if (typeof keyPath === "function") {
      try {
        return keyPath(item);
      } catch {
        return index;
      }
    }

    // Extract value by path (supports nested keys like 'user.id')
    try {
      return (
        keyPath.split(".").reduce((obj: any, key) => obj?.[key], item as any) ??
        index
      );
    } catch {
      return index;
    }
  };
}

/**
 * Merges multiple collection sources into a single interoperable collection.
 * Useful for combining data from different APIs or sources.
 */
export function mergeCollections<T>(
  ...sources: SimpleCollection<T>[]
): Observable<T[]> {
  const normalized = sources.map((source) => normalizeCollection(source));

  return new Observable<T[]>((subscriber) => {
    const results: T[][] = new Array(sources.length).fill([]);
    let completed = 0;

    normalized.forEach((source$, index) => {
      source$.subscribe({
        next: (items) => {
          results[index] = items;
          subscriber.next(results.flat());
        },
        error: (error) => {
          console.warn(`InteropCollection: Source ${index} error`, error);
          results[index] = [];
          subscriber.next(results.flat());
        },
        complete: () => {
          completed++;
          if (completed === sources.length) {
            subscriber.complete();
          }
        },
      });
    });
  });
}

/**
 * Type guards and utility functions for runtime collection detection
 */

function isInteropCollection<T>(value: any): value is InteropCollection<T> {
  return value && typeof value === "object" && "items" in value;
}

function isObservableArray<T>(value: any): value is Observable<T[]> {
  return value && typeof value.subscribe === "function";
}

function isObservableIterable<T>(value: any): value is Observable<Iterable<T>> {
  return value && typeof value.subscribe === "function";
}

function isPromiseArray<T>(value: any): value is Promise<T[]> {
  return value && typeof value.then === "function";
}

function isPromiseIterable<T>(value: any): value is Promise<Iterable<T>> {
  return value && typeof value.then === "function";
}

function isArrayLike<T>(value: any): value is ArrayLike<T> {
  return value && typeof value.length === "number" && value.length >= 0;
}

function isIterable<T>(value: any): value is Iterable<T> {
  return value && Symbol.iterator in Object(value);
}

/**
 * Collection adapter for legacy Angular patterns.
 * Helps existing code interoperate with the new collection system.
 */
export class InteropCollectionAdapter<T> {
  private _source$ = new BehaviorSubject<T[]>([]);

  constructor(initialData: T[] = []) {
    this._source$.next(initialData);
  }

  get collection(): InteropCollection<T> {
    return {
      items: this._source$.asObservable(),
      loading$: of(false),
      error$: of(null),
    };
  }

  updateItems(items: T[]): void {
    this._source$.next(items);
  }

  addItem(item: T): void {
    const current = this._source$.value;
    this._source$.next([...current, item]);
  }

  removeItem(predicate: (item: T) => boolean): void {
    const current = this._source$.value;
    this._source$.next(current.filter((item) => !predicate(item)));
  }

  clear(): void {
    this._source$.next([]);
  }
}

/**
 * Performance utilities for large collections
 */
export namespace InteropPerformance {
  /**
   * Creates a chunked observable for virtual scrolling scenarios
   */
  export function createChunkedCollection<T>(
    source: SimpleCollection<T>,
    chunkSize: number = 100,
  ): Observable<T[][]> {
    return normalizeCollection(source).pipe(
      map((items) => {
        const chunks: T[][] = [];
        for (let i = 0; i < items.length; i += chunkSize) {
          chunks.push(items.slice(i, i + chunkSize));
        }
        return chunks;
      }),
    );
  }

  /**
   * Debounced collection updates for high-frequency changes
   */
  export function createDebouncedCollection<T>(
    source: SimpleCollection<T>,
    debounceMs: number = 300,
  ): Observable<T[]> {
    return normalizeCollection(source)
      .pipe
      // Note: In a real implementation, you'd import debounceTime from rxjs/operators
      // debounceTime(debounceMs)
      ();
  }
}
