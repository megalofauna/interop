export interface FieldError {
	message: string;
	key?: string;
}

/**
 * Maps validation error keys to display messages.
 * A message is either a static string or a function
 * that receives the error payload and returns a string.
 */
export type ErrorMessages = Record<
	string,
	string | ((errorValue: unknown) => string)
>;
