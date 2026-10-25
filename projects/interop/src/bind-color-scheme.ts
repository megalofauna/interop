/** Where the choice is kept, and the root attribute the stylesheet reads. */
const KEY = 'itx-color-scheme';

type Scheme = 'light' | 'dark';

const isScheme = (value: unknown): value is Scheme => value === 'light' || value === 'dark';

const read = (): Scheme | null => {
	try {
		const value = localStorage.getItem(KEY);
		return isScheme(value) ? value : null;
	} catch {
		// Storage throws in some private modes; the choice then lasts until the page reloads.
		return null;
	}
};

const write = (scheme: Scheme | null) => {
	try {
		if (scheme) localStorage.setItem(KEY, scheme);
		else localStorage.removeItem(KEY);
	} catch {
		// As above.
	}
};

/**
 * Lets a radio group choose the page's color scheme: a theme switcher.
 *
 *   <fieldset interop-radio-group="segmented" itx-size="sm">
 *     <legend itx-visually-hidden>Theme</legend>
 *     <label><input type="radio" name="theme" value="light"> Light</label>
 *     <label><input type="radio" name="theme" value="dark"> Dark</label>
 *     <label><input type="radio" name="theme" value="system"> System</label>
 *   </fieldset>
 *   bindColorScheme(fieldset);
 *
 * - "light" and "dark" set `itx-color-scheme` on the root and remember it; any other value, such as
 *   "system", removes both, and the page follows the system again.
 * - It checks the radio for the scheme in use, and follows a change made by another switcher, a
 *   script, or another tab of the site.
 * - To show the remembered scheme on first paint, put this in the page's `<head>`, before the
 *   stylesheets:
 *
 *     <script>try{var s=localStorage.getItem('itx-color-scheme');if(s==='light'||s==='dark')document.documentElement.setAttribute('itx-color-scheme',s)}catch(e){}</script>
 *
 * Returns a function that removes the behavior. The scheme stays as chosen.
 */
export function bindColorScheme(fieldset: HTMLFieldSetElement): () => void {
	const root = fieldset.ownerDocument.documentElement;
	const radios = () => Array.from(fieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]'));

	/** Checks the radio for the scheme on the root: its own value, or the one that is not a scheme. */
	const reflect = () => {
		const scheme = root.getAttribute(KEY);
		const options = radios();
		const match = options.find((radio) => radio.value === scheme) ?? options.find((radio) => !isScheme(radio.value));
		if (match) match.checked = true;
	};

	const apply = (scheme: Scheme | null) => {
		if (scheme) root.setAttribute(KEY, scheme);
		else root.removeAttribute(KEY);
		reflect();
	};

	const onChange = (event: Event) => {
		const radio = event.target as HTMLInputElement;
		if (!radio.matches('input[type="radio"]') || !radio.checked) return;
		const scheme = isScheme(radio.value) ? radio.value : null;
		write(scheme);
		apply(scheme);
	};

	const onStorage = (event: StorageEvent) => {
		if (event.key === KEY || event.key === null) apply(read());
	};

	// Another switcher on the page, or a script, changes the root: follow it.
	const observer = new MutationObserver(reflect);
	observer.observe(root, { attributes: true, attributeFilter: [KEY] });
	const listening = new AbortController();
	const { signal } = listening;
	fieldset.addEventListener('change', onChange, { signal });
	fieldset.ownerDocument.defaultView?.addEventListener('storage', onStorage, { signal });
	// The head script may have set the attribute already; storage wins, since it is the choice itself.
	const initial = read() ?? root.getAttribute(KEY);
	apply(isScheme(initial) ? initial : null);

	return () => {
		observer.disconnect();
		listening.abort();
	};
}
