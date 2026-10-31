import { InteropTablistElement } from './tabs';

const tabMarkup = `
	<button type="button" role="tab" aria-controls="a" aria-selected="true">A</button>
	<button type="button" role="tab" aria-controls="b" aria-selected="false" tabindex="-1">B</button>
`;
const panels = `
	<section role="tabpanel" id="a">A</section>
	<section role="tabpanel" id="b" hidden="until-found">B</section>
`;

describe('<interop-tablist>', () => {
	const make = (attributes = '') => {
		document.body.innerHTML = `<interop-tablist aria-label="Sections" ${attributes}>${tabMarkup}</interop-tablist>${panels}`;
		const tabs = document.querySelector('interop-tablist')!;
		const tab = (key: string) => tabs.querySelector<HTMLElement>(`[aria-controls="${key}"]`)!;
		const arrow = () => {
			tab('a').focus();
			tab('a').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		};
		return { tabs, tab, arrow };
	};

	afterEach(() => (document.body.innerHTML = ''));

	it('is defined by importing interop/tabs, upgrades markup inserted as HTML, and is the tab list', () => {
		const { tabs, tab } = make();
		expect(tabs).toBeInstanceOf(InteropTablistElement);
		expect(tabs.getAttribute('role')).toBe('tablist');
		expect(tab('a').id).toMatch(/^itx-tab-/);
		expect(document.querySelector('#a')!.getAttribute('aria-labelledby')).toBe(tab('a').id);
	});

	it('selects the tab of a panel that find-in-page reveals, with the panel outside the tab list', () => {
		const { tab } = make();
		document.querySelector('#b')!.dispatchEvent(new Event('beforematch', { bubbles: true }));
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
	});

	it('selects with the arrow keys and reports the change', () => {
		const { tabs, tab, arrow } = make();
		const changes: string[] = [];
		tabs.addEventListener('interop-tabs-change', (event) => changes.push((event as CustomEvent).detail.panel.id));
		arrow();
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
		expect(changes).toEqual(['b']);
	});

	it('moves focus without selecting under itx-activation="manual", and rebinds when it changes', () => {
		const { tabs, tab, arrow } = make('itx-activation="manual"');
		arrow();
		expect([document.activeElement, tab('b').getAttribute('aria-selected')]).toEqual([tab('b'), 'false']);
		tabs.removeAttribute('itx-activation');
		arrow();
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
	});

	it('binds tabs added after the element is in the page', async () => {
		document.body.innerHTML = `<interop-tablist aria-label="Sections"></interop-tablist>${panels}`;
		const tabs = document.querySelector('interop-tablist')!;
		tabs.innerHTML = tabMarkup;
		await Promise.resolve();
		expect(document.querySelector('#b')!.getAttribute('hidden')).toBe('until-found');
		expect(tabs.querySelector<HTMLElement>('[aria-controls="b"]')!.tabIndex).toBe(-1);
	});

	it('unbinds when removed, and keeps its selection when put back', () => {
		const { tabs, tab, arrow } = make();
		arrow();
		tabs.remove();
		tab('b').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
		document.body.prepend(tabs);
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
		expect(document.querySelector('#a')!.getAttribute('hidden')).toBe('until-found');
	});
});
