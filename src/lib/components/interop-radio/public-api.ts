/*
 * Public API for InteropRadio Feature
 */

// Components
export * from "./interop-radio-control/interop-radio-control";
export * from "./interop-radio-group/interop-radio-group";

// Types
export type { RadioControl } from "./interop-radio-group/interop-radio-group";

// Re-export for backward compatibility
export { InteropRadioControl as InteropRadio } from "./interop-radio-control/interop-radio-control";
