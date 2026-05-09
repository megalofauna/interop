/*
 * Public API for InteropRadio Feature
 */

// Components
export * from "./interop-radio-control/interop-radio-control";

// Rigs (re-exported from rigs directory for convenience)
export { InteropRadioRig } from "../../rigs/interop-radio-rig/interop-radio-rig";
export type { RadioControl } from "../../rigs/interop-radio-rig/interop-radio-rig";

// Re-export for backward compatibility
export { InteropRadioControl as InteropRadio } from "./interop-radio-control/interop-radio-control";
