/*
 * Public API for Interop Iconsets
 *
 * ⚠️  Individual icon symbols (PhCopy, TablerCamera, …) are NOT exported here.
 *
 * Exporting them through a barrel re-export pulls every icon into every
 * consumer's bundle and defeats tree-shaking. Import icons directly instead:
 *
 *   import { PhCopy } from 'interop/lib/iconsets/phosphor/regular/ph-copy';
 *   import { TablerCamera } from 'interop/lib/iconsets/tabler/outline/tabler-camera';
 *
 * Bulk providers (non-tree-shakeable, fine for demos / Storybook):
 *   import { providePhosphorRegularIcons } from 'interop/lib/iconsets/phosphor/regular';
 *   import { provideTablerOutlineIcons } from 'interop/lib/iconsets/tabler/outline';
 */

// Core types, registry, and provider helpers
export * from "./core";
