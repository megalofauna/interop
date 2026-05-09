/*
 * Public API Surface of interop
 *
 * ⚠️  Icons are NOT re-exported here.
 *
 * Importing individual icons from this barrel pulled every Phosphor icon file
 * into every consumer's bundle — 1,500+ modules that the bundler could not
 * tree-shake out of the re-export chain.  This blocked the main thread for
 * ~10 seconds on page load and caused multi-second hangs after every click
 * (zone.js change-detection cycling through thousands of tracked modules).
 *
 * Instead, import icons through their dedicated paths:
 *
 *   // Individual icons (tree-shakeable)
 *   import { PhUser } from 'interop/lib/iconsets/phosphor/user';
 *   import { PhHouse } from 'interop/lib/iconsets/phosphor/house';
 *
 *   // Registration helpers (still exported here)
 *   import { registerPhosphorIcons } from 'interop';
 *
 *   // All icons at once (dynamic import, opt-in only)
 *   import { registerAllPhosphorIcons } from 'interop';
 */

// Core collection mechanism (types + class + factory)
export * from "./lib/collection/public-api";

// Library module
export * from "./lib/interop.module";

// Components
export * from "./lib/components/public-api";

// Content (djot-driven prose rendering)
export * from "./lib/content/public-api";

// Rigs
export * from "./lib/rigs/public-api";

// Services
export * from "./lib/services/public-api";

// Directives
export * from "./lib/directives/public-api";

// Pipes
export * from "./lib/pipes/public-api";

// Utilities
export * from "./lib/utils/public-api";

// Iconsets — types, registry, and provider helpers only.
// Individual icon symbols (PhCopy, TablerCamera, …) are intentionally excluded;
// import them from their direct paths instead:
//   import { PhCopy } from 'interop/lib/iconsets/phosphor/regular/ph-copy';
//   import { TablerCamera } from 'interop/lib/iconsets/tabler/outline/tabler-camera';
export {
  InteropIconRegistry,
  provideInteropIcons,
  provideScopedInteropIcons,
  fromSvg,
} from "./lib/iconsets/core";
export type { InteropIconDefinition } from "./lib/iconsets/core";
