import {
	DestroyRef,
	Injector,
	Signal,
	effect,
	inject,
	isSignal,
	untracked,
} from "@angular/core";
import {
	InteropCollection,
	type InteropCollectionOptions,
} from "./interop-collection";
import type { InteropCollectionInput } from "./types";

/** Source forms accepted by {@link interopCollection}. */
export type InteropCollectionSource<T> =
	| InteropCollectionInput<T>
	| Signal<InteropCollectionInput<T> | undefined>
	| (() => InteropCollectionInput<T> | undefined);

export interface InteropCollectionFactoryOptions
	extends Omit<InteropCollectionOptions, "destroyRef" | "injector"> {
	/** Override the captured `DestroyRef`. Rare — defaults to `inject(DestroyRef)`. */
	destroyRef?: DestroyRef;
	/** Override the captured `Injector`. Rare — defaults to `inject(Injector)`. */
	injector?: Injector;
}

/**
 * The headline collection primitive. Drop in any source — array, Signal,
 * Observable, Promise, Iterable, Collection wrapper, or another
 * `InteropCollection` — and get back a single `InteropCollection<T>` whose
 * signals stay in sync as the source changes. Cleanup is automatic.
 *
 * Must be called inside an Angular DI context (component / directive
 * constructor, service constructor, or via `runInInjectionContext`).
 *
 * @example Component input
 * ```ts
 * collection = input<InteropCollectionInput<User>>();
 * readonly data = interopCollection(this.collection);
 * // data.items()  data.loading()  data.error()  data.count()  data.isEmpty()
 * ```
 *
 * @example Static array
 * ```ts
 * readonly data = interopCollection([1, 2, 3]);
 * ```
 *
 * @example Plain getter
 * ```ts
 * readonly data = interopCollection(() => this.computeSource());
 * ```
 */
export function interopCollection<T>(
	source: InteropCollectionSource<T>,
	options: InteropCollectionFactoryOptions = {},
): InteropCollection<T> {
	const destroyRef = options.destroyRef ?? inject(DestroyRef);
	const injector = options.injector ?? inject(Injector);

	const collection = new InteropCollection<T>(undefined, {
		loading: options.loading,
		error: options.error,
		destroyRef,
		injector,
	});

	if (isSignal(source) || typeof source === "function") {
		// Reactive: re-dispatch whenever the source getter changes.
		const getter = source as
			| Signal<InteropCollectionInput<T> | undefined>
			| (() => InteropCollectionInput<T> | undefined);
		effect(
			() => {
				const value = getter();
				untracked(() => collection.setSource(value));
			},
			{ injector, allowSignalWrites: true },
		);
	} else {
		collection.setSource(source as InteropCollectionInput<T>);
	}

	return collection;
}
