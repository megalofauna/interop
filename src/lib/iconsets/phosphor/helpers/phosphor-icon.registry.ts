// phosphor-icon.registry.ts
import {
  Injectable,
  InjectionToken,
  Provider,
  inject,
  Optional,
  SkipSelf,
  Injector,
} from "@angular/core";
import { PhIconDefinition } from "./phosphor-icon.types";

export const PHOSPHOR_ICONS = new InjectionToken<readonly PhIconDefinition[]>(
  "PHOSPHOR_ICONS",
  { factory: () => [] },
);

export const PHOSPHOR_SCOPED_ICONS = new InjectionToken<
  readonly PhIconDefinition[]
>("PHOSPHOR_SCOPED_ICONS", { factory: () => [] });

@Injectable({
  providedIn: "root",
})
export class PhosphorIconRegistry {
  private localMap = new Map<string, PhIconDefinition>();
  private parent?: PhosphorIconRegistry;

  /**
   * Constructor handles automatic registration of icons provided through DI.
   *
   * This approach ensures that icons registered via provider functions
   * (registerPhosphorIcons, registerScopedPhosphorIcons) are automatically
   * available when the registry instance is created for that DI scope.
   *
   * The auto-registration happens immediately upon construction to guarantee
   * that any icons provided for this scope are ready before the first
   * component attempts to use them.
   *
   * @param parent - Parent registry for hierarchical lookup (injected with SkipSelf)
   * @param injector - Used to read icon provider tokens for this DI scope
   */
  constructor(
    @Optional() @SkipSelf() parent?: PhosphorIconRegistry,
    private injector?: Injector,
  ) {
    this.parent = parent;

    // Auto-register icons from providers when registry is instantiated
    // This ensures icons are immediately available for the DI scope
    if (this.injector) {
      try {
        // Register global icons (from PHOSPHOR_ICONS token)
        const iconBatches = this.injector.get(PHOSPHOR_ICONS, []);
        this.register(iconBatches.flat());
      } catch {
        // Token not provided - no global icons to register
      }

      try {
        // Register scoped icons (from PHOSPHOR_SCOPED_ICONS token)
        const scopedIconBatches = this.injector.get(PHOSPHOR_SCOPED_ICONS, []);
        this.register(scopedIconBatches.flat());
      } catch {
        // Token not provided - no scoped icons to register
      }
    }
  }

  /**
   * Registers icons into this registry instance.
   * Icons registered here are available for this DI scope and its children.
   *
   * @param icons - Array of icon definitions to register
   */
  register(icons: readonly PhIconDefinition[]) {
    for (const icon of icons) this.localMap.set(icon.name, icon);
  }

  /**
   * Retrieves an icon definition by name using hierarchical lookup.
   *
   * Search order:
   * 1. Local scope (this registry instance)
   * 2. Parent scopes (walking up the DI hierarchy)
   *
   * This allows child scopes to override parent icons with the same name.
   *
   * @param name - Icon name to lookup
   * @returns Icon definition if found, undefined otherwise
   */
  get(name: string): PhIconDefinition | undefined {
    // Check local scope first
    const local = this.localMap.get(name);
    if (local) return local;

    // Check parent scopes (hierarchical lookup)
    if (this.parent) {
      return this.parent.get(name);
    }

    return undefined;
  }

  /**
   * Retrieves an icon definition from only the local scope.
   * Does not check parent registries.
   *
   * @param name - Icon name to lookup locally
   * @returns Icon definition if found in local scope, undefined otherwise
   */
  getLocal(name: string): PhIconDefinition | undefined {
    return this.localMap.get(name);
  }

  /**
   * Gets all registered icon names from this registry and all parent registries.
   *
   * @returns Array of unique icon names across all scopes
   */
  getAllRegistered(): string[] {
    const localKeys = Array.from(this.localMap.keys());
    const parentKeys = this.parent ? this.parent.getAllRegistered() : [];
    return [...new Set([...localKeys, ...parentKeys])];
  }
}

/**
 * Internal function to create providers for global icon registration.
 * Used by the public registerPhosphorIcons function.
 *
 * @param icons - Icon definitions to register globally
 * @returns Array of providers for Angular DI
 */
export function providePhosphorIcons(...icons: PhIconDefinition[]): Provider[] {
  return [
    { provide: PHOSPHOR_ICONS, useValue: icons, multi: true },
    PhosphorIconRegistry,
  ];
}

/**
 * Internal function to create providers for scoped icon registration.
 * Used by the public registerScopedPhosphorIcons function.
 *
 * @param icons - Icon definitions to register in local scope
 * @returns Array of providers for Angular DI
 */
export function provideScopedPhosphorIcons(
  ...icons: PhIconDefinition[]
): Provider[] {
  return [
    { provide: PHOSPHOR_SCOPED_ICONS, useValue: icons, multi: true },
    PhosphorIconRegistry,
  ];
}
