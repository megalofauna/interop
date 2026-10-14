/**
 * Runs `action` on click and marks the button busy until its promise settles:
 * `aria-busy` and `aria-disabled` are set, and further clicks are ignored.
 * A rejected action still clears the busy state, and its error goes to `reportError()`.
 * Returns a function that unbinds.
 */
export function bindPendingAction(button: HTMLButtonElement, action: (event: MouseEvent) => Promise<unknown>): () => void {
	const onClick = async (event: MouseEvent) => {
		if (button.matches('[aria-disabled="true"], [aria-busy="true"]')) return;
		button.setAttribute('aria-busy', 'true');
		button.setAttribute('aria-disabled', 'true');
		try {
			await action(event);
		} catch (error) {
			reportError(error);
		} finally {
			button.removeAttribute('aria-busy');
			button.removeAttribute('aria-disabled');
		}
	};
	const listening = new AbortController();
	button.addEventListener('click', onClick, { signal: listening.signal });
	return () => listening.abort();
}
