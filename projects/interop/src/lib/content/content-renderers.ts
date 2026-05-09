import { InjectionToken, Type, Provider } from '@angular/core';

/**
 * Component that knows how to render a class-tagged `:::`-div from a compiled
 * `.djot` slot. Renderers must declare a single Angular input named `node`
 * typed `Div`:
 *
 * ```ts
 * @Component({ ... })
 * class CalloutRenderer {
 *   readonly node = input.required<Div>();
 * }
 * ```
 *
 * The contract is enforced dynamically via `NgComponentOutlet`'s input map
 * rather than statically — Angular's signal-input components have an
 * `InputSignal<Div>` field shape that no compile-time `Type<...>` constraint
 * can usefully describe across versions.
 *
 * The renderer is dispatched by matching any class on the div against the
 * registry. The first match wins, so authors can compose classes and the
 * registry can be ordered by specificity at provide time.
 */
export type DivRenderer = Type<any>;

export const CONTENT_DIV_RENDERERS = new InjectionToken<
	ReadonlyMap<string, DivRenderer>
>('interop.content.div-renderers', {
	factory: () => new Map<string, DivRenderer>(),
});

export const provideContentDivRenderers = (
	renderers: Readonly<Record<string, DivRenderer>>,
): Provider => ({
	provide: CONTENT_DIV_RENDERERS,
	useValue: new Map(Object.entries(renderers)),
});

/**
 * Component that renders a djot symbol (`:alias:`) inline. Default behaviour
 * (when no renderer is provided): render the raw `:alias:` text in a span.
 *
 * Override to wire symbols to your icon system, e.g.:
 *
 * ```ts
 * @Component({ template: `<interop-icon [name]="node().alias" />`, ... })
 * class IconSymbolRenderer { readonly node = input.required<Symb>(); }
 *
 * provideContentSymbolRenderer(IconSymbolRenderer)
 * ```
 *
 * Like `DivRenderer`, the contract is enforced dynamically via
 * `NgComponentOutlet`.
 */
export type SymbolRenderer = Type<any>;

export const CONTENT_SYMBOL_RENDERER = new InjectionToken<SymbolRenderer | null>(
	'interop.content.symbol-renderer',
	{ factory: () => null },
);

export const provideContentSymbolRenderer = (
	renderer: SymbolRenderer,
): Provider => ({
	provide: CONTENT_SYMBOL_RENDERER,
	useValue: renderer,
});
