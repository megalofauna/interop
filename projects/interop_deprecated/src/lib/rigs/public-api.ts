/*
 * Public API for Interop Rigs
 *
 * Rigs are behavioral containers that coordinate child controls
 * without contributing to layout. They manage state, keyboard
 * navigation, accessibility semantics, and form integration.
 */

export * from "./interop-toolbar/interop-toolbar";
export * from "./interop-radio-rig/interop-radio-rig";
export * from "./interop-checkbox-rig/interop-checkbox-rig";

// Types
export type { RadioControl } from "./interop-radio-rig/interop-radio-rig";
export type { CheckboxOption } from "./interop-checkbox-rig/interop-checkbox-rig";
