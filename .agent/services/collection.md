# Collection — Mental Model Card

> Lives in `src/lib/collection/` — the home for collection types, the
> `InteropCollection<T>` runtime container, and the `interopCollection()`
> factory. Loaded as a peer of components/services/rigs/etc. Was an `@Injectable`
> service ("InteropCollectionService") in early commits; rewritten as a
> DI-context factory plus a free-standing class.

## Files

```
src/lib/collection/
  types.ts                          SimpleIterable, Collection, InteropCollectionInput, type guards
  interop-collection.ts             InteropCollection<T> — class with signals + dispatch
  interop-collection.factory.ts     interopCollection() — DI-context factory
  public-api.ts                     barrel
```

Top-level barrel: `src/public-api.ts` re-exports the entire public API of `src/lib/collection/public-api.ts`.

## Headline DX

```typescript
@Component({...})
export class MyList {
  collection = input<InteropCollectionInput<User>>();

  readonly data = interopCollection(this.collection);
  // data.items()  data.loading()  data.error()
  // data.count()  data.isEmpty()  data.hasError()
}
```

One line in. Auto-cleanup via `DestroyRef`. Re-runs as the source signal changes. The factory must be called inside an Angular DI context (component/directive/service constructor or `runInInjectionContext`).

## Accepted source shapes

| Source | Behaviour |
|---|---|
| `T[]` (array) | fast path |
| `Iterable<T>` (Set, generator, NodeList…) | `Array.from()` synchronously |
| `Promise<T[] \| Iterable<T>>` | resolves async; identity-token guards stale settles |
| `Observable<T[] \| Iterable<T>>` | subscribes; cancels on next `setSource()` or `dispose()` |
| `Signal<T[] \| Iterable<T>>` | live mirror via internal effect |
| `Collection<T>` (`{ items, loading? }`) | unwraps `items`, applies `loading` |
| `InteropCollection<T>` | mirrors items/loading/error live |

### Edge cases (dev warnings)

- **`Map<K, V>`** — Maps iterate as `[K, V]` tuples, almost never the intent. Dispatcher logs a warning and falls back to `map.values()`. Consumer should pass `.values()` / `.entries()` / `.keys()` explicitly to silence.
- **`string`** — strings have `Symbol.iterator` and would dispatch as character collections. Refused with a warning. Wrap in an array if you genuinely want a single-item collection.

## `InteropCollection<T>` — class API

```typescript
class InteropCollection<T> {
  // Read signals (always readonly to consumers)
  readonly items: Signal<T[]>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<unknown>;

  // Computed
  readonly count: Signal<number>;
  readonly isEmpty: Signal<boolean>;
  readonly hasError: Signal<boolean>;

  // Mutation API
  setItems(items: readonly T[] | Iterable<T>): void;
  setLoading(loading: boolean): void;
  setError(error: unknown): void;
  clearError(): void;
  setSource(input: InteropCollectionInput<T> | undefined): void;

  // Lifecycle
  dispose(): void;  // cancels subscription/mirror; safe to call repeatedly
}
```

`setSource()` is idempotent. Each call cancels any prior Observable subscription or mirror effect before dispatching the new source — the collection holds at most one live binding at any time.

`dispose()` is called automatically when a `destroyRef` was supplied at construction (the factory always supplies one).

## `interopCollection()` — factory API

```typescript
function interopCollection<T>(
  source: InteropCollectionSource<T>,
  options?: InteropCollectionFactoryOptions,
): InteropCollection<T>;

type InteropCollectionSource<T> =
  | InteropCollectionInput<T>                              // static value
  | Signal<InteropCollectionInput<T> | undefined>          // signal getter
  | (() => InteropCollectionInput<T> | undefined);         // plain getter

interface InteropCollectionFactoryOptions {
  loading?: boolean;
  error?: unknown;
  destroyRef?: DestroyRef;   // overrides inject(DestroyRef)
  injector?: Injector;       // overrides inject(Injector)
}
```

When the source is a Signal or function, the factory wires an internal `effect()` that calls `setSource()` whenever the source value changes. When the source is a plain value, `setSource()` runs once and the factory returns.

## Performance characteristics

- **Single-instance reuse** — one `InteropCollection<T>` per call site; `setSource()` re-dispatches in place. No allocation churn when the bound input flips.
- **Subscription discipline** — every `setSource()` first cancels its prior subscription / mirror effect. Replacing one Observable with another never leaks the first.
- **Component-lifetime cleanup** — `destroyRef` is captured at the call site (not at app root). When the component dies, the subscription dies with it.
- **Untracked internal writes** — signal writes inside dispatch are wrapped in `untracked()` so reactive consumers don't re-tick the source effect.
- **Stale-promise guard** — Promises capture an identity token; late settles after a `setSource()` swap are dropped silently.

## Type guards

```typescript
isCollection<T>(value): value is Collection<T>     // duck-type for { items, ... }
isPromiseLike<T>(value): value is PromiseLike<T>
isObservableLike<T>(value): value is Observable<T>
isSimpleIterable<T>(value): value is Iterable<T>   // excludes string
```

These are exported from the barrel and used internally by the dispatcher. The dispatcher orders its checks so that `instanceof InteropCollection`, `Array.isArray`, `isSignal`, Observable, and Promise all win before the duck-typed `isCollection` check, avoiding false positives.

## What was removed

- `InteropCollectionService` (`@Injectable({providedIn:'root'})`) — replaced by the factory. The service's root-scoped `DestroyRef` was a memory leak for any non-completing Observable.
- `CollectionConfig<T>` — folded into `InteropCollectionOptions`.
- `computedResolve()` — vestigial, removed.
- `CollectionProcessor` (in `interop-toolbar-base.ts`) — duplicated dispatch logic, removed.
- Private `processCollection()` in `interop-list.ts` — duplicated dispatch logic, removed.
- `src/types/collection*.ts`, `interactive-extensions.ts`, `src/examples/*-examples.ts` — aspirational/dead, removed. The interactive-extensions selection/navigation utilities were never consumed; if needed later, they should land as a separate mechanism, not coupled to collections.
