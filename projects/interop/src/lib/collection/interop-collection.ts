import {
	DestroyRef,
	EffectRef,
	Injector,
	Signal,
	WritableSignal,
	computed,
	effect,
	isDevMode,
	isSignal,
	signal,
	untracked,
} from "@angular/core";
import { Subscription, isObservable } from "rxjs";
import {
	type Collection,
	type InteropCollectionInput,
	isCollection,
	isPromiseLike,
} from "./types";

export interface InteropCollectionOptions {
	/** Initial loading flag, applied before any source is dispatched. */
	loading?: boolean;
	/** Initial error, applied before any source is dispatched. */
	error?: unknown;
	/** When provided, `dispose()` is called automatically on destroy. */
	destroyRef?: DestroyRef;
	/**
	 * Required to mirror an `InteropCollection<T>` source live (rather than
	 * snapshotting it once). The factory always supplies this; manual
	 * callers can omit it if they don't need live mirroring.
	 */
	injector?: Injector;
}

/**
 * The runtime container for an Interop collection. Signal-based reactive
 * state with a single `setSource()` entry point that swallows any of the
 * shapes in `InteropCollectionInput<T>` and resolves them down to a
 * normalized `(items, loading, error)` triple.
 *
 * Instantiate directly for non-component usage, or use the
 * {@link interopCollection} factory inside a component (preferred — it
 * captures `DestroyRef` and re-runs as the source signal changes).
 */
export class InteropCollection<T = unknown> {
	// ── Internal writable state ───────────────────────────────────────────
	private readonly _items: WritableSignal<T[]> = signal<T[]>([]);
	private readonly _loading: WritableSignal<boolean> = signal(false);
	private readonly _error: WritableSignal<unknown> = signal<unknown>(null);

	// ── Public read API ───────────────────────────────────────────────────
	readonly items: Signal<T[]> = this._items.asReadonly();
	readonly loading: Signal<boolean> = this._loading.asReadonly();
	readonly error: Signal<unknown> = this._error.asReadonly();

	readonly count = computed(() => this._items().length);
	readonly isEmpty = computed(() => this._items().length === 0);
	readonly hasError = computed(() => this._error() !== null);

	// ── Lifecycle wiring ──────────────────────────────────────────────────
	private subscription?: Subscription;
	private mirror?: EffectRef;
	private disposed = false;
	private readonly injector?: Injector;

	constructor(
		source?: InteropCollectionInput<T>,
		options: InteropCollectionOptions = {},
	) {
		this.injector = options.injector;
		if (options.loading !== undefined) this._loading.set(options.loading);
		if (options.error !== undefined) this._error.set(options.error);
		options.destroyRef?.onDestroy(() => this.dispose());
		if (source !== undefined) this.setSource(source);
	}

	// ── Public mutation API ───────────────────────────────────────────────

	setItems(items: readonly T[] | Iterable<T>): void {
		if (this.disposed) return;
		const next = Array.isArray(items)
			? (items as T[])
			: Array.from(items as Iterable<T>);
		this._items.set(next);
		this._loading.set(false);
	}

	setLoading(loading: boolean): void {
		if (this.disposed) return;
		this._loading.set(loading);
	}

	setError(error: unknown): void {
		if (this.disposed) return;
		this._error.set(error);
		this._loading.set(false);
	}

	clearError(): void {
		if (this.disposed) return;
		this._error.set(null);
	}

	/**
	 * Re-dispatch from a new source. Cancels any prior subscription or mirror
	 * effect first so the collection holds a single live binding at a time.
	 */
	setSource(input: InteropCollectionInput<T> | undefined): void {
		if (this.disposed) return;
		this.cancelPrior();

		if (input === undefined || input === null) {
			this.setItems([]);
			return;
		}

		// 1. Existing InteropCollection — mirror live if we have an injector,
		//    otherwise snapshot the current values.
		if (input instanceof InteropCollection) {
			this.mirrorFrom(input as InteropCollection<T>);
			return;
		}

		// 2. Array — fast path.
		if (Array.isArray(input)) {
			this.setItems(input as T[]);
			return;
		}

		// 3. Angular Signal — track via mirror effect.
		if (isSignal(input)) {
			this.mirrorSignal(input as Signal<readonly T[] | Iterable<T>>);
			return;
		}

		// 4. Observable — subscribe.
		if (isObservable(input)) {
			this.handleObservable(input);
			return;
		}

		// 5. Promise — resolve.
		if (isPromiseLike<readonly T[] | Iterable<T>>(input)) {
			this.handlePromise(input as Promise<readonly T[] | Iterable<T>>);
			return;
		}

		// 6. Map — flag and use values() as the friendly default.
		if (input instanceof Map) {
			if (isDevMode()) {
				console.warn(
					"InteropCollection: Map source treated as map.values(). " +
						"Pass `.values()`, `.entries()`, or `.keys()` explicitly to silence this.",
				);
			}
			this.setItems(Array.from(input.values()) as T[]);
			return;
		}

		// 7. String — refuse. Strings are iterable as characters; that's almost
		//    never the intent.
		if (typeof input === "string") {
			if (isDevMode()) {
				console.warn(
					"InteropCollection: string source ignored. Wrap in an array if you " +
						"genuinely want a single-item collection.",
				);
			}
			this.setItems([]);
			return;
		}

		// 8. Plain Collection<T> shape — recurse on inner items.
		if (isCollection<T>(input)) {
			const wrapper = input as Collection<T>;
			if (wrapper.loading !== undefined) this._loading.set(wrapper.loading);
			this.setSource(wrapper.items as InteropCollectionInput<T>);
			return;
		}

		// 9. Generic Iterable (Set, generator, NodeList, …).
		if (
			input != null &&
			typeof (input as { [Symbol.iterator]?: unknown })[Symbol.iterator] ===
				"function"
		) {
			this.setItems(Array.from(input as Iterable<T>));
			return;
		}

		// 10. Fallback.
		if (isDevMode()) {
			console.warn(
				"InteropCollection: unrecognized source shape, defaulting to empty.",
				input,
			);
		}
		this.setItems([]);
	}

	/**
	 * Manual cleanup. Cancels any pending Observable subscription or mirror
	 * effect. Safe to call multiple times. After dispose, all setters are
	 * no-ops; signals retain their last value.
	 */
	dispose(): void {
		if (this.disposed) return;
		this.disposed = true;
		this.cancelPrior();
	}

	// ── Internals ─────────────────────────────────────────────────────────

	private cancelPrior(): void {
		this.subscription?.unsubscribe();
		this.subscription = undefined;
		this.mirror?.destroy();
		this.mirror = undefined;
	}

	private handleObservable(source: { subscribe: (...args: any[]) => any }): void {
		this._loading.set(true);
		this._error.set(null);
		this.subscription = (source as any).subscribe({
			next: (value: readonly T[] | Iterable<T>) => this.setItems(value),
			error: (err: unknown) => this.setError(err),
		});
	}

	private handlePromise(source: Promise<readonly T[] | Iterable<T>>): void {
		this._loading.set(true);
		this._error.set(null);
		// Capture identity to ignore late resolutions after a setSource swap.
		const token = (this.token = {});
		source
			.then((value) => {
				if (token === this.token) this.setItems(value);
			})
			.catch((err) => {
				if (token === this.token) this.setError(err);
			});
	}

	/** Identity token used to discard stale Promise resolutions. */
	private token: object = {};

	private mirrorSignal(src: Signal<readonly T[] | Iterable<T>>): void {
		if (!this.injector) {
			// Snapshot once — no live tracking available.
			this.setItems(src());
			return;
		}
		this.mirror = effect(
			() => {
				const value = src();
				untracked(() => this.setItems(value));
			},
			{ injector: this.injector, allowSignalWrites: true },
		);
	}

	private mirrorFrom(other: InteropCollection<T>): void {
		if (!this.injector) {
			this._items.set(other.items());
			this._loading.set(other.loading());
			this._error.set(other.error());
			return;
		}
		this.mirror = effect(
			() => {
				const items = other.items();
				const loading = other.loading();
				const error = other.error();
				untracked(() => {
					this._items.set(items);
					this._loading.set(loading);
					this._error.set(error);
				});
			},
			{ injector: this.injector, allowSignalWrites: true },
		);
	}
}
