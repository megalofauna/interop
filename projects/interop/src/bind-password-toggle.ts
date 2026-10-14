import { watchInteropInDevMode } from './audit';

/**
 * Lets the user see the password they type. A button aimed at the input with the custom command
 * `--toggle-password` shows or hides it:
 *
 *   <input interop-input id="password" type="password" autocomplete="current-password">
 *   <button interop-button type="button" commandfor="password" command="--toggle-password" aria-pressed="false" hidden>
 *     Show password
 *   </button>
 *
 * - The button keeps its label and reports its state with `aria-pressed`, so a screen reader says
 *   "Show password, toggle button, pressed". It is `hidden` in the markup, so it never shows where
 *   script does not run, and this unhides it.
 * - Submitting or resetting the form hides the password again, so the browser does not offer to
 *   save it as plain text.
 *
 * Returns a function that removes the behavior and hides the password.
 */
export function bindPasswordToggle(input: HTMLInputElement): () => void {
	const buttons = () =>
		Array.from(input.ownerDocument.querySelectorAll<HTMLButtonElement>('button[command="--toggle-password"][commandfor]')).filter(
			(button) => input.id && button.getAttribute('commandfor') === input.id,
		);

	const show = (visible: boolean, source?: Element | null) => {
		input.type = visible ? 'text' : 'password';
		for (const button of new Set([...buttons(), ...(source ? [source] : [])])) button.setAttribute('aria-pressed', String(visible));
	};

	const onCommand = (event: Event) => {
		const { command, source } = event as Event & { command: string; source: Element | null };
		if (command === '--toggle-password') show(input.type === 'password', source);
	};

	const listening = new AbortController();
	const { signal } = listening;
	input.addEventListener('command', onCommand, { signal });
	input.form?.addEventListener('submit', () => show(false), { capture: true, signal });
	input.form?.addEventListener('reset', () => show(false), { signal });
	for (const button of buttons()) {
		button.setAttribute('aria-pressed', 'false');
		button.hidden = false;
	}
	watchInteropInDevMode();

	return () => {
		listening.abort();
		show(false);
	};
}
