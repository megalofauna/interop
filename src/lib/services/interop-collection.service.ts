import {
  DestroyRef,
  Injectable,
  computed,
  inject,
  signal,
} from "@angular/core";
import { EMPTY, Observable, catchError, isObservable } from "rxjs";
import {
  Collection,
  InteropCollectionInput,
  SimpleIterable,
} from "../../types/collection";

/**
 * Configuration for creating a collection
 */
export interface CollectionConfig<T> {
  source: SimpleIterable<T>;
  loading?: boolean;
  error?: any;
}

/**
 * Signal-based collection class that manages reactive data state
 * Uses effect() to handle async operations outside of computed functions
 */
export class InteropCollection<T = any> {
  // Core signals
  readonly items = signal<T[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<any>(null);

  // Computed properties
  readonly isEmpty = computed(() => this.items().length === 0);
  readonly count = computed(() => this.items().length);
  readonly hasError = computed(() => this.error() !== null);

  private destroyRef?: DestroyRef;

  constructor(config: CollectionConfig<T>, destroyRef?: DestroyRef) {
    this.destroyRef = destroyRef;
    // Initialize synchronous state
    this.loading.set(config.loading ?? false);
    this.error.set(config.error ?? null);

    // Process the source data
    this.processSource(config.source);
  }

  /**
   * Update the collection with new items
   */
  setItems(items: T[]): void {
    this.items.set(items);
    this.loading.set(false);
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.loading.set(loading);
  }

  /**
   * Set error state
   */
  setError(error: any): void {
    this.error.set(error);
    this.loading.set(false);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Process different types of data sources
   */
  private processSource(source: SimpleIterable<T>): void {
    if (Array.isArray(source)) {
      // Simple array - set immediately
      this.setItems(source);
    } else if (isObservable(source)) {
      // Observable - handle async
      this.handleObservable(source);
    } else if (source && typeof (source as any).then === "function") {
      // Promise - handle async
      this.handlePromise(source as Promise<T[]>);
    } else if (
      source &&
      typeof (source as any)[Symbol.iterator] === "function"
    ) {
      // Iterable (Set, Map.values(), etc.)
      this.setItems(Array.from(source as Iterable<T>));
    } else {
      // Fallback - empty array
      this.setItems([]);
    }
  }

  /**
   * Handle Observable source
   */
  private handleObservable(source: Observable<T[]>): void {
    this.setLoading(true);
    this.clearError();

    const subscription = source
      .pipe(
        catchError((error) => {
          this.setError(error);
          return EMPTY;
        }),
      )
      .subscribe((items) => {
        this.setItems(items);
      });

    // Clean up subscription when component is destroyed
    this.destroyRef?.onDestroy(() => subscription.unsubscribe());
  }

  /**
   * Handle Promise source
   */
  private handlePromise(source: Promise<T[]>): void {
    this.setLoading(true);
    this.clearError();

    source
      .then((items) => this.setItems(items))
      .catch((error) => this.setError(error));
  }
}

/**
 * Service for creating and managing collections
 */
@Injectable({
  providedIn: "root",
})
export class InteropCollectionService {
  private destroyRef = inject(DestroyRef);

  /**
   * Create a new collection from a configuration
   */
  create<T>(config: CollectionConfig<T>): InteropCollection<T> {
    return new InteropCollection(config, this.destroyRef);
  }

  /**
   * Resolve a CollectionInput into a standardized InteropCollection
   * This method creates new collections and should not be used in computed functions
   */
  resolve<T>(input: InteropCollectionInput<T>): InteropCollection<T> {
    // If it's already a collection, return it
    if (input instanceof InteropCollection) {
      return input;
    }

    // If it's a Collection object
    if (this.isCollection(input)) {
      return new InteropCollection(
        {
          source: input.items,
          loading: input.loading,
        },
        this.destroyRef,
      );
    }

    // Otherwise treat it as a SimpleIterable
    return new InteropCollection<T>(
      {
        source: input as SimpleIterable<T>,
      },
      this.destroyRef,
    );
  }

  /**
   * Create a computed collection resolver that's safe to use in computed functions
   * Returns null for non-collection inputs to avoid creating collections in computed
   */
  computedResolve<T>(
    input: InteropCollectionInput<T> | undefined,
  ): InteropCollection<T> | null {
    if (!input) {
      return null;
    }

    // Only return existing collections, don't create new ones
    if (input instanceof InteropCollection) {
      return input;
    }

    // For other types, return null - they should be resolved outside computed
    return null;
  }

  /**
   * Type guard for Collection
   */
  private isCollection<T>(value: any): value is Collection<T> {
    return (
      value &&
      typeof value === "object" &&
      "items" in value &&
      value.items !== undefined
    );
  }
}
