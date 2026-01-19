/**
 * Shared TrackBy utilities for Interop components.
 *
 * These helpers provide consistent, well-tested identity tracking for Angular lists
 * and collection-rendering components. Centralizing this logic improves performance
 * (by minimizing DOM churn), developer experience, and consistency across the library.
 *
 * Usage guidance:
 * - For dynamic lists with stable identities, prefer tracking by a unique field (e.g., "id").
 * - For simple static lists where identities don't matter, index-based tracking is acceptable.
 * - `trackByAuto` tries common keys (`id`, `_id`) before falling back to index.
 * - `trackByFieldThenAutoThenIndex` composes a pragmatic precedence:
 *    field value -> auto id -> index.
 */

import type { TrackByFunction } from "@angular/core";

/**
 * The key type for tracking list items.
 */
export type TrackKey = string | number;

/**
 * Track items by their index.
 *
 * Best for static lists or when items do not have a stable unique identifier.
 *
 * @example
 * ```ts
 * const trackBy = trackByIndex<any>();
 * // template:
 * // <ul interop-list [collection]="items" [trackBy]="trackBy"></ul>
 * ```
 */
export function trackByIndex<T = unknown>(): TrackByFunction<T> {
  return (index) => index;
}

/**
 * Track items by a specific field on the item object.
 *
 * The value of the provided field (e.g., "id" or "sku") is used as the identity.
 * If the field is missing or undefined for a given item, the index is used as a fallback.
 *
 * @example Track by "id"
 * ```ts
 * const trackBy = trackByField<{ id: number }>("id");
 * // template:
 * // <ul interop-list [collection]="users" [trackBy]="trackBy"></ul>
 * ```
 *
 * @example Track by custom field "sku"
 * ```ts
 * const trackBy = trackByField<{ sku: string }>("sku");
 * ```
 */
export function trackByField<T = any>(
  field: keyof T | string,
): TrackByFunction<T> {
  const key = String(field);
  return (index, item: T | any) => {
    const value = item?.[key];
    return value !== undefined ? (value as TrackKey) : index;
  };
}

/**
 * Automatically track items by common identity keys when present, else fall back to index.
 *
 * Common keys checked (in order):
 * - "id"
 * - "_id"
 *
 * If no common keys exist, returns the index.
 *
 * @example
 * ```ts
 * const trackBy = trackByAuto<any>();
 * // Works well for typical domain objects with { id } or { _id } properties
 * ```
 */
export function trackByAuto<T = any>(): TrackByFunction<T> {
  return (index, item) => {
    if (item && typeof item === "object") {
      const obj = item as any;
      if ("id" in obj) return obj.id as TrackKey;
      if ("_id" in obj) return obj._id as TrackKey;
    }
    return index;
  };
}

/**
 * Compose a pragmatic trackBy strategy:
 * 1) If the specified field exists and is defined, use its value
 * 2) Else, attempt auto keys ("id", "_id")
 * 3) Else, fall back to index
 *
 * This balanced approach minimizes DOM churn while staying robust
 * across heterogeneous item shapes.
 *
 * @example
 * ```ts
 * const trackBy = trackByFieldThenAutoThenIndex<{ id: number }>("id");
 * // Field wins when available; otherwise auto keys; otherwise index.
 * ```
 */
export function trackByFieldThenAutoThenIndex<T = any>(
  field?: keyof T | string | null,
): TrackByFunction<T> {
  const fieldFn = field ? trackByField<T>(field) : null;
  const autoFn = trackByAuto<T>();
  const indexFn = trackByIndex<T>();

  return (index, item) => {
    if (fieldFn) {
      const k = fieldFn(index, item);
      if (k !== index) return k;
    }
    const a = autoFn(index, item);
    if (a !== index) return a;
    return indexFn(index, item);
  };
}

/**
 * Create a component trackBy function that handles the common pattern used by
 * InteropList and InteropTable components.
 *
 * This factory function encapsulates the logic for:
 * 1. Explicit index tracking when mode is "index"
 * 2. Custom function delegation when mode is a function
 * 3. Field-then-auto-then-index fallback for "auto" mode
 *
 * @param trackByMode Signal or function returning the tracking mode
 * @param trackByField Signal or function returning the field to track by
 * @returns A TrackByFunction that can be used directly in Angular templates
 *
 * @example
 * ```ts
 * // In a component:
 * trackByFn = createComponentTrackByFn(
 *   () => this.trackBy(),
 *   () => this.trackByField()
 * );
 * ```
 */
export function createComponentTrackByFn<T>(
  trackByMode: () => TrackByFunction<T> | "auto" | "index",
  trackByField: () => keyof T | null,
): TrackByFunction<T> {
  return (index: number, item: T): any => {
    const mode = trackByMode();
    const field = trackByField();

    // Explicit index tracking
    if (mode === "index") return index;

    // Custom function provided
    if (typeof mode === "function") return mode(index, item);

    // Auto or unspecified: use shared precedence (field -> auto id -> index)
    return trackByFieldThenAutoThenIndex<T>(field ?? null)(index, item);
  };
}
