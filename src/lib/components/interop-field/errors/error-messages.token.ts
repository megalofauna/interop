import { InjectionToken } from "@angular/core";
import { ErrorMessages } from "./field-error.model";
import { INTEROP_DEFAULT_ERROR_MESSAGES } from "./default-error-messages";

/**
 * Injection token for app-wide error message overrides.
 *
 * Provide this token at the root level to customize error messages
 * across all Interop field components (e.g., for i18n or branding).
 *
 * Per-field overrides via [errorMessages] take precedence over this token.
 *
 * @example
 * ```ts
 * providers: [
 *   {
 *     provide: INTEROP_ERROR_MESSAGES,
 *     useValue: {
 *       required: 'Ce champ est obligatoire.',
 *       email: 'Veuillez entrer une adresse e-mail valide.',
 *     }
 *   }
 * ]
 * ```
 */
export const INTEROP_ERROR_MESSAGES = new InjectionToken<ErrorMessages>(
	"INTEROP_ERROR_MESSAGES",
	{ factory: () => INTEROP_DEFAULT_ERROR_MESSAGES },
);
