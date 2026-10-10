// ── High-level field components ─────────────────────────────────────────────
export { InteropFieldInput } from "./interop-field-input/interop-field-input";
export { InteropFieldTextarea } from "./interop-field-textarea/interop-field-textarea";

// ── Shared field base & types ───────────────────────────────────────────────
export {
	FieldBase,
	provideFieldValueAccessor,
	type ShowErrorsOn,
	type ErrorDisplay,
} from "./shared/field-base";

// ── Error message system ────────────────────────────────────────────────────
export * from "./errors/public-api";

// ── Primitives (prefix/suffix directives for content projection) ────────────
export { InteropFieldPrefix } from "./primitives/interop-field-prefix/interop-field-prefix";
export { InteropFieldSuffix } from "./primitives/interop-field-suffix/interop-field-suffix";
