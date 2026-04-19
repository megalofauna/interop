import { ErrorMessages } from "./field-error.model";

/**
 * Library-level default error messages for standard Angular validators.
 * Consumers can override these app-wide via the INTEROP_ERROR_MESSAGES
 * injection token, or per-field via the [errorMessages] input.
 */
export const INTEROP_DEFAULT_ERROR_MESSAGES: ErrorMessages = {
	required: "This field is required.",
	minlength: (err: any) =>
		`Must be at least ${err.requiredLength} characters.`,
	maxlength: (err: any) =>
		`Cannot exceed ${err.requiredLength} characters.`,
	email: "Please enter a valid email address.",
	min: (err: any) => `Must be at least ${err.min}.`,
	max: (err: any) => `Must be no more than ${err.max}.`,
	pattern: "Invalid format.",
};
