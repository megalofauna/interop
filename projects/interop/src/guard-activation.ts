const UNAVAILABLE = '[aria-disabled="true"], [aria-busy="true"]';

/**
 * Cancels clicks on any element marked `aria-disabled="true"` or `aria-busy="true"`.
 * That stops its click handlers, its form submit and its invoker command, which native
 * `disabled` does on its own. Returns a function that removes the guard.
 */
export function guardActivation(root: Document | ShadowRoot = document): () => void {
	const onClick = (event: Event) => {
		const target = event.target instanceof Element ? event.target.closest(UNAVAILABLE) : null;
		if (target) {
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	};
	root.addEventListener('click', onClick, { capture: true });
	return () => root.removeEventListener('click', onClick, { capture: true });
}
