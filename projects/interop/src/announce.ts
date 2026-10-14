/**
 * Writes a message to a live region, a visually hidden `role="status"` element. It empties the region
 * first and writes after a moment, so the same message twice in a row is announced twice.
 */
export function announce(status: HTMLElement, message: string): void {
	status.textContent = '';
	setTimeout(() => (status.textContent = message), 50);
}
