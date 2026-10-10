import { ValidationErrors } from "@angular/forms";
import { ErrorMessages, FieldError } from "./field-error.model";

/**
 * Resolves Angular validation errors into displayable FieldError objects.
 *
 * Iterates error keys in insertion order — the first key is the
 * highest-priority error. Falls back to a generic message if no
 * mapping exists for a given key.
 *
 * @param validationErrors - The errors object from an AbstractControl, or null.
 * @param messages - Merged message map (library defaults + app-wide + per-field overrides).
 * @returns Ordered array of FieldError objects.
 */
export function resolveErrors(
	validationErrors: ValidationErrors | null,
	messages: ErrorMessages,
): FieldError[] {
	if (!validationErrors) return [];

	return Object.keys(validationErrors).map((key) => {
		const msgOrFn = messages[key];
		const message =
			typeof msgOrFn === "function"
				? msgOrFn(validationErrors[key])
				: typeof msgOrFn === "string"
					? msgOrFn
					: `Validation error: ${key}`;
		return { key, message };
	});
}
