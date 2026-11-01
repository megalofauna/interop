import { InteropTabsElement } from './tabs';

const markup = `
	<div role="tablist" aria-label="Sections">
		<button type="button" role="tab" aria-controls="a" aria-selected="true">A</button>
		<button type="button" role="tab" aria-controls="b" aria-selected="false" tabindex="-1">B</button>
	</div>
	<section role="tabpanel" id="a">A</section>
	<section role="tabpanel" id="b" hidden="until-found">B</section>
`;

describe('<interop-tabs>', () => {
	const make = (attributes = '') => {
		document.body.innerHTML = `<interop-tabs ${attributes}>${markup}</interop-tabs>`;
		const tabs = document.querySelector('interop-tabs')!;
		const tab = (key: string) => tabs.querySelector<HTMLElement>(`[aria-controls="${key}"]`)!;
		const panel = (key: string) => tabs.querySelector<HTMLElement>(`#${key}`)!;
		const key = (from: string, name: string) =>
			tab(from).dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
		return { tabs, tab, panel, key };
	};

	afterEach(() => (document.body.innerHTML = ''));

	it('is defined by importing interop/tabs, upgrades markup inserted as HTML, and adds no role', () => {
		const { tabs, tab, panel } = make();
		expect(tabs).toBeInstanceOf(InteropTabsElement);
		expect(tabs.hasAttribute('role')).toBe(false);
		expect(tab('a').id).toMatch(/^itx-tab-/);
		expect(panel('a').getAttribute('aria-labelledby')).toBe(tab('a').id);
	});

	it('selects with the arrow keys and reports the change', () => {
		const { tabs, tab, key } = make();
		const changes: string[] = [];
		tabs.addEventListener('interop-tabs-change', (event) => changes.push((event as CustomEvent).detail.panel.id));
		tab('a').focus();
		key('a', 'ArrowRight');
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
		expect(changes).toEqual(['b']);
	});

	it('selects the tab of a panel that find-in-page reveals', () => {
		const { tab, panel } = make();
		panel('b').dispatchEvent(new Event('beforematch', { bubbles: true }));
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
	});

	it('moves focus without selecting under itx-activation="manual", and rebinds when it changes', () => {
		const { tabs, tab, key } = make('itx-activation="manual"');
		tab('a').focus();
		key('a', 'ArrowRight');
		expect([document.activeElement, tab('b').getAttribute('aria-selected')]).toEqual([tab('b'), 'false']);
		tabs.removeAttribute('itx-activation');
		tab('a').focus();
		key('a', 'ArrowRight');
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
	});

	it('binds children added after the element is in the page', async () => {
		document.body.innerHTML = '<interop-tabs></interop-tabs>';
		const tabs = document.querySelector('interop-tabs')!;
		tabs.innerHTML = markup;
		await Promise.resolve();
		expect(tabs.querySelector('#b')!.getAttribute('hidden')).toBe('until-found');
		expect(tabs.querySelector<HTMLElement>('[aria-controls="b"]')!.tabIndex).toBe(-1);
	});

	it('unbinds when removed, and keeps its selection when put back', () => {
		const { tabs, tab, panel, key } = make();
		tab('a').focus();
		key('a', 'ArrowRight');
		tabs.remove();
		key('b', 'ArrowLeft');
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
		document.body.append(tabs);
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
		expect(panel('a').getAttribute('hidden')).toBe('until-found');
	});
});
