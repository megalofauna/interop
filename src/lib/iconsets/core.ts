import {
  Injectable,
  InjectionToken,
  Injector,
  Optional,
  Provider,
  SkipSelf,
  inject,
} from "@angular/core";

// ── Icon definition ────────────────────────────────────────────────────────────

/**
 * A single icon definition usable with InteropIcon.
 *
 * `svgContent` is the inner markup of the SVG element — everything that would
 * appear between `<svg ...>` and `</svg>`. The outer `<svg>` wrapper is
 * rendered by InteropIcon itself, which owns the sizing, accessibility
 * attributes, and stroke-width.
 *
 * Use `fromSvg()` to create definitions from raw SVG strings, or import
 * pre-built definitions from the Phosphor or Tabler icon packages.
 */
export interface InteropIconDefinition {
  /** Registry key. Used in templates: `<interop-icon name="ph-copy" />` */
  readonly name: string;

  /** SVG viewBox string, e.g. `"0 0 256 256"` or `"0 0 24 24"`. */
  readonly viewBox: string;

  /**
   * Inner SVG markup — the children of `<svg>`, without the wrapper element.
   *
   * Security note: this content is rendered via `innerHTML` inside an SVG
   * element. It is safe because:
   * - Icons come exclusively from developer-provided static imports.
   * - No user-generated content can enter the registry.
   * - Angular's DomSanitizer removes any genuinely dangerous elements.
   */
  readonly svgContent: string;

  /**
   * Natural stroke width in viewBox coordinate units.
   * `undefined` for fill-only icons (no stroke).
   *
   * Used as the default when no `[strokeWidth]` is passed to InteropIcon.
   * Consumers can override this to achieve lighter or bolder weights.
   *
   * Note: units are relative to the viewBox — Phosphor uses 256×256
   * (default 16), Tabler uses 24×24 (default 2). These are not directly
   * comparable, by design.
   */
  readonly defaultStrokeWidth?: number;
}

// ── fromSvg helper ─────────────────────────────────────────────────────────────

/**
 * Create an `InteropIconDefinition` from raw SVG inner content.
 *
 * This is the universal adapter. Any icon library that can produce SVG
 * strings can be registered with Interop's icon system via this function —
 * no set-specific adapter needed.
 *
 * @param name          Registry key (e.g. `"my-icon"`).
 * @param viewBox       SVG viewBox (e.g. `"0 0 24 24"`).
 * @param svgContent    Inner SVG markup (children of `<svg>`, not the wrapper).
 * @param defaultStrokeWidth  Natural stroke width in viewBox units, if any.
 *
 * @example Adapt a one-off SVG
 * ```ts
 * const myIcon = fromSvg(
 *   'custom-arrow',
 *   '0 0 24 24',
 *   '<path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" fill="none"/>',
 *   2,
 * );
 * providers: [provideInteropIcons(myIcon)]
 * ```
 */
export function fromSvg(
  name: string,
  viewBox: string,
  svgContent: string,
  defaultStrokeWidth?: number,
): InteropIconDefinition {
  return { name, viewBox, svgContent, defaultStrokeWidth };
}

// ── Registry ───────────────────────────────────────────────────────────────────

export const INTEROP_ICONS = new InjectionToken<
  readonly InteropIconDefinition[][]
>("INTEROP_ICONS", { factory: () => [] });

export const INTEROP_SCOPED_ICONS = new InjectionToken<
  readonly InteropIconDefinition[][]
>("INTEROP_SCOPED_ICONS", { factory: () => [] });

/**
 * Hierarchical icon registry. Each DI scope (root, lazy module, component)
 * can register its own icons. Lookups walk up the scope chain — child scopes
 * can override parent icons by registering an icon with the same name.
 */
@Injectable({ providedIn: "root" })
export class InteropIconRegistry {
  private readonly _icons = new Map<string, InteropIconDefinition>();
  private readonly _parent: InteropIconRegistry | undefined;

  constructor(
    @Optional() @SkipSelf() parent?: InteropIconRegistry,
    private readonly _injector?: Injector,
  ) {
    this._parent = parent ?? undefined;

    if (this._injector) {
      try {
        for (const batch of this._injector.get(INTEROP_ICONS, [])) {
          this._register(batch);
        }
      } catch {
        /* token not provided */
      }
      try {
        for (const batch of this._injector.get(INTEROP_SCOPED_ICONS, [])) {
          this._register(batch);
        }
      } catch {
        /* token not provided */
      }
    }
  }

  /** Register icon definitions into this scope. */
  register(icons: readonly InteropIconDefinition[]): void {
    this._register(icons);
  }

  /** Look up an icon by name, walking up to parent scopes if not found locally. */
  get(name: string): InteropIconDefinition | undefined {
    return this._icons.get(name) ?? this._parent?.get(name);
  }

  /** All registered icon names in this scope (does not include parent scopes). */
  localNames(): string[] {
    return Array.from(this._icons.keys());
  }

  private _register(icons: readonly InteropIconDefinition[]): void {
    for (const icon of icons) this._icons.set(icon.name, icon);
  }
}

// ── Provider helpers ───────────────────────────────────────────────────────────

/**
 * Register icon definitions with Angular's DI system.
 *
 * Works at any DI scope: `bootstrapApplication`, `NgModule`, or individual
 * `@Component` providers. Icons registered in a component scope are only
 * available within that component's subtree.
 *
 * This is the generic provider. Set-specific convenience re-exports
 * (`providePhosphorIcons`, `provideTablerIcons`) point here — they are
 * identical in behaviour and exist only for discoverability.
 *
 * @example Cherry-pick (tree-shakeable — recommended for production)
 * ```ts
 * providers: [provideInteropIcons(PhCopy, PhCheck, TablerCamera)]
 * ```
 *
 * @example Bulk (not tree-shakeable — use in demos / Storybook)
 * ```ts
 * providers: [providePhosphorRegularIcons()]
 * ```
 */
export function provideInteropIcons(
  ...icons: InteropIconDefinition[]
): Provider[] {
  return [
    { provide: INTEROP_ICONS, useValue: icons, multi: true },
    InteropIconRegistry,
  ];
}

/**
 * Register scoped icon definitions.
 * Scoped icons override parent-scope icons of the same name within the
 * component subtree where they are provided.
 */
export function provideScopedInteropIcons(
  ...icons: InteropIconDefinition[]
): Provider[] {
  return [
    { provide: INTEROP_SCOPED_ICONS, useValue: icons, multi: true },
    InteropIconRegistry,
  ];
}
