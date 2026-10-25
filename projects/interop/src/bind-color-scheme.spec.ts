import { bindColorScheme } from './bind-color-scheme';

/** Node's own localStorage global has no methods in tests, so each test gets an in-memory one. */
const memoryStorage = (): Storage => {
	const items = new Map<string, string>();
	return {
		get length() {
			return items.size;
		},
		clear: () => items.clear(),
		getItem: (key) => items.get(key) ?? null,
		key: (index) => Array.from(items.keys())[index] ?? null,
		removeItem: (key) => void items.delete(key),
		setItem: (key, value) => void items.set(key, String(value)),
	};
};

describe('bindColorScheme', () => {
	let unbind: (() => void) | undefined;
	beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()));
	const root = document.documentElement;
	const setup = () => {
		document.body.innerHTML = `
			<fieldset>
				<legend>Theme</legend>
				<label><input type="radio" name="theme" value="light"> Light</label>
				<label><input type="radio" name="theme" value="dark"> Dark</label>
				<label><input type="radio" name="theme" value="system"> System</label>
			</fieldset>`;
		const fieldset = document.querySelector('fieldset')!;
		unbind = bindColorScheme(fieldset);
		const radio = (value: string) => fieldset.querySelector<HTMLInputElement>(`input[value="${value}"]`)!;
		const choose = (value: string) => {
			radio(value).checked = true;
			radio(value).dispatchEvent(new Event('change', { bubbles: true }));
		};
		return { radio, choose };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
		vi.unstubAllGlobals();
		root.removeAttribute('itx-color-scheme');
	});

	it('follows the system until a scheme is chosen', () => {
		const { radio } = setup();
		expect(radio('system').checked).toBe(true);
		expect(root.hasAttribute('itx-color-scheme')).toBe(false);
	});

	it('sets and remembers a chosen scheme', () => {
		const { choose } = setup();
		choose('dark');
		expect(root.getAttribute('itx-color-scheme')).toBe('dark');
		expect(localStorage.getItem('itx-color-scheme')).toBe('dark');
	});

	it('goes back to the system and forgets the choice', () => {
		const { choose } = setup();
		choose('light');
		choose('system');
		expect(root.hasAttribute('itx-color-scheme')).toBe(false);
		expect(localStorage.getItem('itx-color-scheme')).toBeNull();
	});

	it('checks the remembered scheme when it binds', () => {
		localStorage.setItem('itx-color-scheme', 'dark');
		const { radio } = setup();
		expect(radio('dark').checked).toBe(true);
		expect(root.getAttribute('itx-color-scheme')).toBe('dark');
	});

	it('ignores a remembered value it does not know', () => {
		localStorage.setItem('itx-color-scheme', 'sepia');
		const { radio } = setup();
		expect(radio('system').checked).toBe(true);
		expect(root.hasAttribute('itx-color-scheme')).toBe(false);
	});

	it('follows a choice made in another tab', () => {
		const { radio } = setup();
		localStorage.setItem('itx-color-scheme', 'light');
		window.dispatchEvent(new StorageEvent('storage', { key: 'itx-color-scheme', newValue: 'light' }));
		expect(radio('light').checked).toBe(true);
		expect(root.getAttribute('itx-color-scheme')).toBe('light');
	});

	it('follows a change to the root made by another switcher or a script', async () => {
		const { radio } = setup();
		root.setAttribute('itx-color-scheme', 'dark');
		await Promise.resolve();
		expect(radio('dark').checked).toBe(true);
		root.removeAttribute('itx-color-scheme');
		await Promise.resolve();
		expect(radio('system').checked).toBe(true);
	});

	it('stops listening when unbound, and leaves the scheme as chosen', () => {
		const { choose } = setup();
		choose('dark');
		unbind!();
		unbind = undefined;
		choose('light');
		expect(root.getAttribute('itx-color-scheme')).toBe('dark');
	});
});
