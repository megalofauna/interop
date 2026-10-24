/** Whether the keyboard's command key is ⌘: macOS, iPadOS and iOS. */
const isApple = () => {
	const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
	return /mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform || nav.platform || nav.userAgent || '');
};

interface Shortcut {
	key: string;
	meta: boolean;
	ctrl: boolean;
	alt: boolean;
	shift: boolean;
}

/** `"mod+shift+p"` → its key and modifiers. `mod` is ⌘ on Apple platforms and Ctrl elsewhere. */
const parse = (keys: string, apple: boolean): Shortcut => {
	const parts = keys.toLowerCase().split('+');
	const key = parts.pop() ?? '';
	const has = (...names: string[]) => parts.some((part) => names.includes(part));
	return {
		key,
		meta: has('meta', 'cmd') || (apple && has('mod')),
		ctrl: has('ctrl', 'control') || (!apple && has('mod')),
		alt: has('alt', 'option'),
		shift: has('shift'),
	};
};

/** The `aria-keyshortcuts` value, in the spec's order and names: `Control+Shift+P`. */
const ariaValue = ({ key, meta, ctrl, alt, shift }: Shortcut) =>
	[ctrl && 'Control', alt && 'Alt', shift && 'Shift', meta && 'Meta', key.length === 1 ? key.toUpperCase() : key].filter(Boolean).join('+');

/** The text people know: `⇧⌘P` on Apple platforms, `Ctrl Shift P` elsewhere. */
const hint = ({ key, meta, ctrl, alt, shift }: Shortcut, apple: boolean) => {
	const name = key.length === 1 ? key.toUpperCase() : key;
	return apple
		? [ctrl && '⌃', alt && '⌥', shift && '⇧', meta && '⌘', name].filter(Boolean).join('')
		: [ctrl && 'Ctrl', alt && 'Alt', shift && 'Shift', meta && 'Win', name].filter(Boolean).join(' ');
};

/** Alt changes the character a letter types (⌥K is ˚ on a Mac), so with Alt the physical key counts too. */
const matchesKey = (event: KeyboardEvent, { key, alt }: Shortcut) =>
	event.key.toLowerCase() === key || (alt && key.length === 1 && event.code === `Key${key.toUpperCase()}`);

/** Whether a person could press the button now: enabled, rendered, and not behind a modal dialog. */
const pressable = (button: HTMLButtonElement) =>
	!button.disabled &&
	button.checkVisibility?.() !== false &&
	!button.closest('[inert]') &&
	Array.from(button.ownerDocument.querySelectorAll('dialog[open]')).every((dialog) => dialog.contains(button) || !dialog.matches(':modal'));

/**
 * Gives a button a keyboard shortcut. The key clicks the button, so the button's `command`, its
 * click handler and its `disabled` state stay the one way in.
 *
 *   <button interop-button type="button" command="show-modal" commandfor="go-to">Search <kbd></kbd></button>
 *   bindShortcut(button, 'mod+k');
 *
 * - `mod` is ⌘ on Apple platforms and Ctrl elsewhere. Also `ctrl`, `alt`, `shift` and `meta`.
 * - The key does nothing while the button is disabled, hidden or behind a modal dialog, while the
 *   user is composing text with an input method, and while the key repeats.
 * - It sets `aria-keyshortcuts` to the platform's form, and writes the hint into an empty `<kbd>`
 *   inside the button: `⌘K` or `Ctrl K`.
 * - Use a modifier. A single character needs a way to turn it off (WCAG 2.1.4).
 *
 * Returns a function that removes the shortcut and the attribute.
 */
export function bindShortcut(button: HTMLButtonElement, keys: string): () => void {
	const apple = isApple();
	const shortcut = parse(keys, apple);
	const kbd = button.querySelector('kbd');
	const fill = kbd && !kbd.textContent?.trim();
	button.setAttribute('aria-keyshortcuts', ariaValue(shortcut));
	if (fill) kbd.textContent = hint(shortcut, apple);

	const listening = new AbortController();
	button.ownerDocument.addEventListener(
		'keydown',
		(event) => {
			if (
				event.defaultPrevented ||
				event.isComposing ||
				event.repeat ||
				!matchesKey(event, shortcut) ||
				event.metaKey !== shortcut.meta ||
				event.ctrlKey !== shortcut.ctrl ||
				event.altKey !== shortcut.alt ||
				event.shiftKey !== shortcut.shift ||
				!pressable(button)
			)
				return;
			event.preventDefault();
			button.click();
		},
		{ signal: listening.signal },
	);

	return () => {
		listening.abort();
		button.removeAttribute('aria-keyshortcuts');
		if (fill) kbd.textContent = '';
	};
}
