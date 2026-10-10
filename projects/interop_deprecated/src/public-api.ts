/*
 * Public API Surface of interop
 *
 * ⚠️  Icons are NOT re-exported here.
 *
 * Importing individual icons from this barrel once pulled every icon file in a
 * set into every consumer's bundle — 1,500+ modules the bundler could not
 * tree-shake out of the re-export chain. That blocked the main thread for ~10
 * seconds on page load and caused multi-second hangs after every click (zone.js
 * cycling change detection through thousands of tracked modules).
 *
 * Import icons through their dedicated paths instead, one file per icon:
 *
 *   import { TablerCamera } from 'interop/lib/iconsets/tabler/outline/tabler-camera';
 *   import { MsCheck } from 'interop/lib/iconsets/material-symbols/sharp/ms-check';
 *
 * then register them with provideInteropIcons(...) from 'interop'.
 */

// Core collection mechanism (types + class + factory)
export * from "./lib/collection/public-api";

// Components
export * from "./lib/components/public-api";

// Composites — higher-order assemblies of Interop components
export * from "./lib/composites/public-api";

// Highlighter contract (no implementation — see interop/highlighters/shiki)
export * from "./lib/highlighter/public-api";

// Content (djot-driven prose rendering)
export * from "./lib/content/public-api";

// Rigs
export * from "./lib/rigs/public-api";

// Services
export * from "./lib/services/public-api";

// Directives
export * from "./lib/directives/public-api";

// Utilities
export * from "./lib/utils/public-api";

// Iconsets — types, registry, and provider helpers only.
// Individual icon symbols (PhCopy, TablerCamera, …) are intentionally excluded;
// import them from their direct paths instead:
//   import { MsContentCopy } from 'interop/lib/iconsets/material-symbols/sharp/ms-content-copy';
//   import { TablerCamera } from 'interop/lib/iconsets/tabler/outline/tabler-camera';
export {
	InteropIconRegistry,
	provideInteropIcons,
	provideScopedInteropIcons,
	fromSvg,
} from "./lib/iconsets/core";
export type { InteropIconDefinition } from "./lib/iconsets/core";
