/** Elements a person activates: native controls, links, anything focusable by script, and widget roles. */
const ACTIVATABLE = [
	'a',
	'area',
	'button',
	'input',
	'select',
	'textarea',
	'summary',
	'[tabindex]',
	'[contenteditable]:not([contenteditable="false"])',
	...[
		'button',
		'link',
		'checkbox',
		'switch',
		'radio',
		'option',
		'menuitem',
		'menuitemcheckbox',
		'menuitemradio',
		'tab',
		'treeitem',
		'combobox',
		'gridcell',
		'slider',
		'spinbutton',
	].map((role) => `[role="${role}"]`),
].join(', ');

let installed = 0;

/** How many guards are installed. The dev audit reads it; the guard never imports the audit. */
export function activationGuardCount(): number {
	return installed;
}

/** Whether a person activates `element`, as opposed to a region that holds things they activate. */
function activatable(element: Element): boolean {
	return element.matches(ACTIVATABLE) || element.localName.includes('-');
}

/**
 * Cancels clicks on, or inside, an element marked `aria-disabled="true"`, and clicks on, or inside,
 * an activatable element marked `aria-busy="true"`: a native control, a link, an element with
 * `tabindex`, a widget role or a custom element. `aria-busy` on a region marks content that is
 * updating, so the controls inside it stay usable. Cancelling stops the click handlers, the form
 * submit and the invoker command, which native `disabled` does on its own. Returns a function that
 * removes the guard.
 */
export function guardActivation(root: Document | ShadowRoot = document): () => void {
	const onClick = (event: Event) => {
		if (!(event.target instanceof Element)) return;
		const disabled = event.target.closest('[aria-disabled="true"]');
		const busy = event.target.closest('[aria-busy="true"]');
		if (disabled || (busy && activatable(busy))) {
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
