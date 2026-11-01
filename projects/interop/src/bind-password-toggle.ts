/**
 * Lets the user see the password they type. A button inside `root`, aimed at the input with the
 * custom command `--toggle-password`, shows or hides it. `<interop-password>` calls this:
 *
 *   <interop-password>
 *     <input interop-input id="password" type="password" autocomplete="current-password">
 *     <button interop-button type="button" commandfor="password" command="--toggle-password" aria-pressed="false">
 *       Show password
 *     </button>
 *   </interop-password>
 *
 * - The button keeps its label and reports its state with `aria-pressed`, so a screen reader says
 *   "Show password, toggle button, pressed".
 * - Submitting or resetting the form hides the password again, so the browser does not save it as
 *   plain text.
 * - It finds the input and its buttons when the command arrives, so they can render after `root`.
 *
 * Returns a function that removes the behavior and hides the password.
 */
export function bindPasswordToggle(root: HTMLElement): () => void {
	const buttonsFor = (input: HTMLInputElement) =>
		Array.from(root.querySelectorAll<HTMLButtonElement>('button[command="--toggle-password"]')).filter(
			(button) => input.id && button.getAttribute('commandfor') === input.id,
		);

	const show = (input: HTMLInputElement, visible: boolean) => {
		input.type = visible ? 'text' : 'password';
		for (const button of buttonsFor(input)) button.setAttribute('aria-pressed', String(visible));
	};

	/** Hides every password shown here, or only those in `form`. */
	const hide = (form?: EventTarget | null) => {
		for (const input of root.querySelectorAll('input')) {
			if (form && input.form !== form) continue;
			if (buttonsFor(input).some((button) => button.getAttribute('aria-pressed') === 'true')) show(input, false);
		}
	};

	const onCommand = (event: Event) => {
		const input = event.target;
		if ((event as Event & { command?: string }).command === '--toggle-password' && input instanceof HTMLInputElement)
			show(input, input.type === 'password');
	};

	const listening = new AbortController();
	const { signal } = listening;
	// The command event does not bubble; capture sees it on its way to the input.
	root.addEventListener('command', onCommand, { capture: true, signal });
	// Bubbling, so a submit that bindValidation() stops leaves the password shown while the user fixes
	// the errors. The root node rather than the form, which may render after `root`.
	const tree = root.getRootNode();
	tree.addEventListener('submit', (event) => hide(event.target), { signal });
	tree.addEventListener('reset', (event) => hide(event.target), { signal });

	return () => {
		listening.abort();
		hide();
	};
}
