import { bindShortcut } from './bind-shortcut';

describe('bindShortcut', () => {
	let unbind: (() => void) | undefined;
	const setup = (keys = 'mod+k', platform = 'Win32') => {
		vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
		document.body.innerHTML = `<button type="button">Search <kbd></kbd></button><input>`;
		const button = document.querySelector('button')!;
		const clicks = vi.fn();
		button.addEventListener('click', clicks);
		unbind = bindShortcut(button, keys);
		const press = (init: KeyboardEventInit, target: Element = document.body) => {
			const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
			target.dispatchEvent(event);
			return event;
		};
		return { button, clicks, press };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
		vi.restoreAllMocks();
	});

	it('clicks the button on Ctrl+K outside Apple platforms, and stops the browser using the key', () => {
		const { clicks, press } = setup();
		expect(press({ key: 'k', metaKey: true }).defaultPrevented).toBe(false);
		const event = press({ key: 'k', ctrlKey: true });
		expect(clicks).toHaveBeenCalledTimes(1);
		expect(event.defaultPrevented).toBe(true);
	});

	it('uses ⌘ on Apple platforms, and leaves Ctrl+K to the text field', () => {
		const { clicks, press } = setup('mod+k', 'MacIntel');
		press({ key: 'k', ctrlKey: true });
		expect(clicks).not.toHaveBeenCalled();
		press({ key: 'k', metaKey: true });
		expect(clicks).toHaveBeenCalledTimes(1);
	});

	it('works from inside a text field', () => {
		const { clicks, press } = setup();
		press({ key: 'k', ctrlKey: true }, document.querySelector('input')!);
		expect(clicks).toHaveBeenCalledTimes(1);
	});

	it('needs the exact modifiers', () => {
		const { clicks, press } = setup('mod+shift+p');
		press({ key: 'p', ctrlKey: true });
		press({ key: 'P', ctrlKey: true, shiftKey: true, altKey: true });
		expect(clicks).not.toHaveBeenCalled();
		press({ key: 'P', ctrlKey: true, shiftKey: true });
		expect(clicks).toHaveBeenCalledTimes(1);
	});

	it('matches the physical key with Alt, which changes the character', () => {
		const { clicks, press } = setup('alt+k', 'MacIntel');
		press({ key: '˚', code: 'KeyK', altKey: true });
		expect(clicks).toHaveBeenCalledTimes(1);
	});

	it('ignores a held key, an input method composing, and a key the page already handled', () => {
		const { clicks, press } = setup();
		press({ key: 'k', ctrlKey: true, repeat: true });
		press({ key: 'k', ctrlKey: true, isComposing: true });
		const handled = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true });
		handled.preventDefault();
		document.body.dispatchEvent(handled);
		expect(clicks).not.toHaveBeenCalled();
	});

	it('does nothing while the button is disabled or inert, and leaves the key to the browser', () => {
		const { button, clicks, press } = setup();
		button.disabled = true;
		expect(press({ key: 'k', ctrlKey: true }).defaultPrevented).toBe(false);
		button.disabled = false;
		document.body.setAttribute('inert', '');
		press({ key: 'k', ctrlKey: true });
		expect(clicks).not.toHaveBeenCalled();
		document.body.removeAttribute('inert');
	});

	it('names the shortcut for assistive technology and fills the empty hint', () => {
		const { button } = setup('mod+shift+p');
		expect(button.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+P');
		expect(button.querySelector('kbd')!.textContent).toBe('Ctrl Shift P');
	});

	it('leaves a hint the page wrote', () => {
		vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
		document.body.innerHTML = `<button type="button">Search <kbd>Ctrl+K</kbd></button>`;
		const button = document.querySelector('button')!;
		unbind = bindShortcut(button, 'mod+k');
		unbind();
		unbind = undefined;
		expect(button.querySelector('kbd')!.textContent).toBe('Ctrl+K');
	});

	it('writes the Apple hint with symbols', () => {
		const { button } = setup('mod+k', 'MacIntel');
		expect(button.getAttribute('aria-keyshortcuts')).toBe('Meta+K');
		expect(button.querySelector('kbd')!.textContent).toBe('⌘K');
	});

	it('removes the shortcut, the attribute and the hint', () => {
		const { button, clicks, press } = setup();
		unbind!();
		unbind = undefined;
		press({ key: 'k', ctrlKey: true });
		expect(clicks).not.toHaveBeenCalled();
		expect(button.hasAttribute('aria-keyshortcuts')).toBe(false);
		expect(button.querySelector('kbd')!.textContent).toBe('');
	});
});
