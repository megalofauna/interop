export interface AnnounceOptions {
	/** The element the message is about. The screen reader reads the message in its language. Default: the document. */
	from?: Element | Document;
	/** `high` interrupts what the screen reader is saying. Keep it for errors the user must hear now. */
	priority?: 'normal' | 'high';
	/**
	 * A visually hidden `role="status"` element, for browsers without `ariaNotify()`: Chrome before
	 * 141, Firefox before 150, Safari before 27. Without one, those browsers say nothing.
	 */
	status?: HTMLElement | null;
}

type Notifier = { ariaNotify?: (message: string, options?: { priority?: 'normal' | 'high' }) => void };

/**
 * Says a message to screen reader users, for a change that moves no focus: "Copied", "Football
 * removed", "You have 8 characters remaining". It calls `ariaNotify()`, which needs no live region.
 *
 *   announce('Saved', { from: form });
 *
 * Without `ariaNotify()`, it writes to `status` if given. It empties the element first and writes
 * after a moment, so the same message twice in a row is announced twice.
 */
export function announce(message: string, options: AnnounceOptions = {}): void {
	const from = (options.from ?? document) as Notifier;
	if (from.ariaNotify) {
		from.ariaNotify(message, { priority: options.priority ?? 'normal' });
		return;
	}
	const status = options.status;
	if (!status) return;
	status.textContent = '';
	setTimeout(() => (status.textContent = message), 50);
}
