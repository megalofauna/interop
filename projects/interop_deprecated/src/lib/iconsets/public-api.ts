/*
 * Public API for Interop Iconsets
 *
 * ⚠️  Individual icon symbols (PhCopy, TablerCamera, MsArrowBack, …) are NOT
 *     exported here.
 *
 * Exporting them through a barrel re-export pulls every icon into every
 * consumer's bundle and defeats tree-shaking. Import icons directly instead:
 *
 *   import { TablerCamera } from 'interop/lib/iconsets/tabler/outline/tabler-camera';
 *   import { TablerCamera } from 'interop/lib/iconsets/tabler/outline/tabler-camera';
 *   import { MsArrowBack } from 'interop/lib/iconsets/material-symbols/sharp/ms-arrow-back';
 *
 * Bulk providers (non-tree-shakeable, fine for demos / Storybook):
 *   import { provideTablerOutlineIcons } from 'interop/lib/iconsets/tabler/outline';
 *   import { provideTablerOutlineIcons } from 'interop/lib/iconsets/tabler/outline';
 *
 * ── Sets ───────────────────────────────────────────────────────────────────
 *
 *   tabler            24×24,   outline / filled.         Stroked — [strokeWidth] works.
 *   material-symbols  960×960 (viewBox "0 -960 960 960"), sharp / sharp-fill.
 *                     Filled contours only. [strokeWidth] does nothing; weight is
 *                     fixed at generation time by which @material-symbols/svg-N
 *                     package scripts/generate-icons.mjs points at (currently 400).
 *
 * Coordinate spaces differ per set by design, so defaultStrokeWidth values are
 * not comparable across them.
 */

// Core types, registry, and provider helpers
export * from "./core";
