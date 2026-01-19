import { Provider } from "@angular/core";
import { PhIconDefinition } from "./phosphor-icon.types";
import {
  PhosphorIconRegistry,
  providePhosphorIcons,
  provideScopedPhosphorIcons,
} from "./phosphor-icon.registry";

/**
 * Registers a set of Phosphor icons to the application.
 * Icons will be registered with the global PhosphorIconRegistry.
 *
 * @example Basic usage
 * ```typescript
 * import { PhUser, PhHome, PhSettings } from '@your-org/interop';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     registerPhosphorIcons(PhUser, PhHome, PhSettings),
 *     // other providers...
 *   ]
 * });
 * ```
 *
 * @example With tree-shaking (recommended for large apps)
 * ```typescript
 * import { PhUser } from '@your-org/interop/phosphor/user';
 * import { PhHome } from '@your-org/interop/phosphor/home';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     registerPhosphorIcons(PhUser, PhHome),
 *     // other providers...
 *   ]
 * });
 * ```
 *
 * @param icons - Icon definitions to register
 * @returns Array of providers for Angular DI
 */
export function registerPhosphorIcons(
  ...icons: PhIconDefinition[]
): Provider[] {
  return providePhosphorIcons(...icons);
}

/**
 * Registers icons at component/module scope.
 * Icons registered this way are only available within that scope and its children.
 * They will override parent-scoped icons with the same names.
 *
 * @example Component-level registration
 * ```typescript
 * @Component({
 *   providers: [registerScopedPhosphorIcons(PhUser, PhHome)],
 *   template: `<interop-icon name="user" />` // Uses scoped icon
 * })
 * export class MyComponent {}
 * ```
 *
 * @example Module-level registration
 * ```typescript
 * @NgModule({
 *   providers: [registerScopedPhosphorIcons(PhUser, PhHome)],
 * })
 * export class FeatureModule {}
 * ```
 *
 * @param icons - Icon definitions to register in this scope
 * @returns Array of providers for Angular DI
 */
export function registerScopedPhosphorIcons(
  ...icons: PhIconDefinition[]
): Provider[] {
  return provideScopedPhosphorIcons(...icons);
}

/**
 * Registers icons at application root level (global scope).
 * These icons are available throughout the entire application.
 *
 * @example
 * ```typescript
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     registerGlobalPhosphorIcons(PhUser, PhHome, PhSettings),
 *   ]
 * });
 * ```
 *
 * @param icons - Icon definitions to register globally
 * @returns Array of providers for Angular DI
 */
export function registerGlobalPhosphorIcons(
  ...icons: PhIconDefinition[]
): Provider[] {
  return registerPhosphorIcons(...icons);
}

/**
 * Registers all Phosphor Regular icons globally.
 * This loads all icons and should be used carefully to avoid bundle bloat.
 *
 * NOTE: This is an async function and cannot be used directly in providers array.
 * Use in main.ts with async bootstrapping or use registerGlobalPhosphorIcons with specific icons instead.
 *
 * @example Async bootstrapping (recommended):
 * ```typescript
 * import { registerAllPhosphorIcons } from 'interop';
 *
 * async function bootstrap() {
 *   const iconProviders = await registerAllPhosphorIcons();
 *   bootstrapApplication(AppComponent, {
 *     providers: [
 *       ...iconProviders,
 *       // other providers...
 *     ]
 *   });
 * }
 * bootstrap();
 * ```
 *
 * @example Alternative - use specific icons instead:
 * ```typescript
 * import { registerGlobalPhosphorIcons, PhUser, PhHome, PhSettings } from 'interop';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     registerGlobalPhosphorIcons(PhUser, PhHome, PhSettings),
 *     // other providers...
 *   ]
 * });
 * ```
 *
 * @returns Promise resolving to array of providers for Angular DI
 */
export async function registerAllPhosphorIcons(): Promise<Provider[]> {
  // Dynamic import to avoid bundling all icons unless explicitly requested
  const { PHOSPHOR_ALL_REGULAR_ICONS } = await import("../all");
  return registerGlobalPhosphorIcons(...PHOSPHOR_ALL_REGULAR_ICONS);
}

/**
 * Registers a curated set of commonly used icons.
 * This is a good balance between functionality and bundle size.
 *
 * NOTE: This is an async function and cannot be used directly in providers array.
 * Use with async bootstrapping or use registerGlobalPhosphorIcons with specific icons.
 *
 * @example Async bootstrapping:
 * ```typescript
 * import { registerCommonPhosphorIcons } from 'interop';
 *
 * async function bootstrap() {
 *   const iconProviders = await registerCommonPhosphorIcons();
 *   bootstrapApplication(AppComponent, {
 *     providers: [
 *       ...iconProviders,
 *       // other providers...
 *     ]
 *   });
 * }
 * bootstrap();
 * ```
 *
 * @returns Promise resolving to array of providers for Angular DI
 */
export async function registerCommonPhosphorIcons(): Promise<Provider[]> {
  // Dynamically import common icons to support tree-shaking
  try {
    const [
      { PhUser },
      { PhHouse },
      { PhGear },
      { PhMagnifyingGlass },
      { PhPlus },
      { PhMinus },
      { PhX },
      { PhCheck },
      { PhArrowLeft },
      { PhArrowRight },
      { PhArrowUp },
      { PhArrowDown },
      { PhCaretLeft },
      { PhCaretRight },
      { PhCaretUp },
      { PhCaretDown },
      { PhHeart },
      { PhStar },
      { PhBell },
      { PhEnvelope },
      { PhCalendar },
      { PhClock },
      { PhPencil },
      { PhTrash },
      { PhCopy },
      { PhDownload },
      { PhUpload },
      { PhEye },
      { PhEyeSlash },
      { PhLock },
      { PhLockOpen },
      { PhInfo },
      { PhWarning },
      { PhQuestion },
    ] = await Promise.all([
      import("../user"),
      import("../house"),
      import("../gear"),
      import("../magnifying-glass"),
      import("../plus"),
      import("../minus"),
      import("../x"),
      import("../check"),
      import("../arrow-left"),
      import("../arrow-right"),
      import("../arrow-up"),
      import("../arrow-down"),
      import("../caret-left"),
      import("../caret-right"),
      import("../caret-up"),
      import("../caret-down"),
      import("../heart"),
      import("../star"),
      import("../bell"),
      import("../envelope"),
      import("../calendar"),
      import("../clock"),
      import("../pencil"),
      import("../trash"),
      import("../copy"),
      import("../download"),
      import("../upload"),
      import("../eye"),
      import("../eye-slash"),
      import("../lock"),
      import("../lock-open"),
      import("../info"),
      import("../warning"),
      import("../question"),
    ]);

    const icons = [
      PhUser,
      PhHouse,
      PhGear,
      PhMagnifyingGlass,
      PhPlus,
      PhMinus,
      PhX,
      PhCheck,
      PhArrowLeft,
      PhArrowRight,
      PhArrowUp,
      PhArrowDown,
      PhCaretLeft,
      PhCaretRight,
      PhCaretUp,
      PhCaretDown,
      PhHeart,
      PhStar,
      PhBell,
      PhEnvelope,
      PhCalendar,
      PhClock,
      PhPencil,
      PhTrash,
      PhCopy,
      PhDownload,
      PhUpload,
      PhEye,
      PhEyeSlash,
      PhLock,
      PhLockOpen,
      PhInfo,
      PhWarning,
      PhQuestion,
    ];

    return registerGlobalPhosphorIcons(...icons);
  } catch (error) {
    console.warn("Failed to load some common icons:", error);
    return [];
  }
}

/**
 * Registers common icons at component/module scope.
 * Same icons as registerCommonPhosphorIcons but scoped locally.
 *
 * @example
 * ```typescript
 * @Component({
 *   providers: [...await registerScopedCommonPhosphorIcons()],
 *   template: `<interop-icon name="user" />`
 * })
 * export class MyComponent {}
 * ```
 *
 * @returns Array of providers for Angular DI
 */
export async function registerScopedCommonPhosphorIcons(): Promise<Provider[]> {
  try {
    const [
      { PhUser },
      { PhHouse },
      { PhGear },
      { PhMagnifyingGlass },
      { PhPlus },
      { PhMinus },
      { PhX },
      { PhCheck },
      { PhArrowLeft },
      { PhArrowRight },
      { PhArrowUp },
      { PhArrowDown },
      { PhCaretLeft },
      { PhCaretRight },
      { PhCaretUp },
      { PhCaretDown },
      { PhHeart },
      { PhStar },
      { PhBell },
      { PhEnvelope },
      { PhCalendar },
      { PhClock },
      { PhPencil },
      { PhTrash },
      { PhCopy },
      { PhDownload },
      { PhUpload },
      { PhEye },
      { PhEyeSlash },
      { PhLock },
      { PhLockOpen },
      { PhInfo },
      { PhWarning },
      { PhQuestion },
    ] = await Promise.all([
      import("../user"),
      import("../house"),
      import("../gear"),
      import("../magnifying-glass"),
      import("../plus"),
      import("../minus"),
      import("../x"),
      import("../check"),
      import("../arrow-left"),
      import("../arrow-right"),
      import("../arrow-up"),
      import("../arrow-down"),
      import("../caret-left"),
      import("../caret-right"),
      import("../caret-up"),
      import("../caret-down"),
      import("../heart"),
      import("../star"),
      import("../bell"),
      import("../envelope"),
      import("../calendar"),
      import("../clock"),
      import("../pencil"),
      import("../trash"),
      import("../copy"),
      import("../download"),
      import("../upload"),
      import("../eye"),
      import("../eye-slash"),
      import("../lock"),
      import("../lock-open"),
      import("../info"),
      import("../warning"),
      import("../question"),
    ]);

    const icons = [
      PhUser,
      PhHouse,
      PhGear,
      PhMagnifyingGlass,
      PhPlus,
      PhMinus,
      PhX,
      PhCheck,
      PhArrowLeft,
      PhArrowRight,
      PhArrowUp,
      PhArrowDown,
      PhCaretLeft,
      PhCaretRight,
      PhCaretUp,
      PhCaretDown,
      PhHeart,
      PhStar,
      PhBell,
      PhEnvelope,
      PhCalendar,
      PhClock,
      PhPencil,
      PhTrash,
      PhCopy,
      PhDownload,
      PhUpload,
      PhEye,
      PhEyeSlash,
      PhLock,
      PhLockOpen,
      PhInfo,
      PhWarning,
      PhQuestion,
    ];

    return registerScopedPhosphorIcons(...icons);
  } catch (error) {
    console.warn("Failed to load some common scoped icons:", error);
    return [];
  }
}

/**
 * Registers all available Phosphor icons at component/module scope.
 * WARNING: This imports all icons and increases bundle size significantly.
 * Only use this for development or when you need all icons in a specific scope.
 *
 * @returns Array of providers for Angular DI
 */
export async function registerScopedAllPhosphorIcons(): Promise<Provider[]> {
  const { PHOSPHOR_ALL_REGULAR_ICONS } = await import("../all");
  return registerScopedPhosphorIcons(...PHOSPHOR_ALL_REGULAR_ICONS);
}
