/** Controls a click can activate. A busy one of these is the only busy element the guard stops. */
const CONTROL = 'button, summary, a[href], input, select, textarea, [role="button"], [role="link"], [role="menuitem"], [role="tab"]';

let installed = 0;

/** How many guards are installed. The dev audit reads it; the guard never imports the audit. */
export function activationGuardCount(): number {
	return installed;
}

/**
 * Cancels clicks on, or inside, an element marked `aria-disabled="true"`, and clicks on a control
 * marked `aria-busy="true"`. That stops its click handlers, its form submit and its invoker command,
 * which native `disabled` does on its own. `aria-busy` on a region marks content that is updating,
 * so the controls inside it stay usable. Returns a function that removes the guard.
 */
export function guardActivation(root: Document | ShadowRoot = document): () => void {
	const onClick = (event: Event) => {
		if (!(event.target instanceof Element)) return;
		const disabled = event.target.closest('[aria-disabled="true"]');
		const busy = event.target.closest(CONTROL)?.matches('[aria-busy="true"]');
		if (disabled || busy) {
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	};
	const listening = new AbortController();
	root.addEventListener('click', onClick, { capture: true, signal: listening.signal });
	installed++;
	return () => {
		listening.abort();
		installed--;
	};
}
