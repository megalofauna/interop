import { bindTabs, type TabsChangeDetail } from './bind-tabs';

const markup = ({ orientation = '', dir = '', selected = 'b', disabled = '' } = {}) => `
	<div interop-tabs ${dir ? `dir="${dir}"` : ''}>
		<div role="tablist" aria-label="Sections" ${orientation ? `aria-orientation="${orientation}"` : ''}>
			${['a', 'b', 'c', 'd']
				.map(
					(key) =>
						`<button type="button" role="tab" aria-controls="p-${key}" ${key === selected ? 'aria-selected="true"' : ''} ${key === disabled ? 'disabled' : ''}>${key}</button>`,
				)
				.join('')}
		</div>
		<section role="tabpanel" id="p-a"><p>A</p></section>
		<section role="tabpanel" id="p-b"><p>B</p></section>
		<section role="tabpanel" id="p-c"><a href="/c">C</a></section>
		<section role="tabpanel" id="p-d" tabindex="-1"><p>D</p></section>
	</div>`;

describe('bindTabs', () => {
	let unbind: (() => void) | undefined;
	const setup = (options: Parameters<typeof markup>[0] = {}, bindOptions: Parameters<typeof bindTabs>[1] = {}) => {
		document.body.innerHTML = markup(options);
		const root = document.querySelector<HTMLElement>('[interop-tabs]')!;
		unbind = bindTabs(root, bindOptions);
		const tab = (key: string) => document.querySelector<HTMLElement>(`[aria-controls="p-${key}"]`)!;
		const panel = (key: string) => document.getElementById(`p-${key}`)!;
		const press = (key: string, init: KeyboardEventInit = {}) => {
			const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
			(document.activeElement as HTMLElement).dispatchEvent(event);
			return event;
		};
		const state = () =>
			['a', 'b', 'c', 'd'].map(
				(key) => `${key}:${tab(key).getAttribute('aria-selected')}/${tab(key).tabIndex}/${panel(key).getAttribute('hidden') ?? 'shown'}`,
			);
		return { root, tab, panel, press, state };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
		history.replaceState(null, '', location.pathname);
	});

	it('selects the marked tab, gives it the only tab stop, and hides the other panels until found', () => {
		const { state } = setup();
		expect(state()).toEqual(['a:false/-1/until-found', 'b:true/0/shown', 'c:false/-1/until-found', 'd:false/-1/until-found']);
	});

	it('selects the first enabled tab when none is marked', () => {
		const { tab } = setup({ selected: '', disabled: 'a' });
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
	});

	it('gives tabs an id and panels aria-labelledby', () => {
		const { tab, panel } = setup();
		expect(tab('a').id).toMatch(/^itx-tab-/);
		expect(panel('a').getAttribute('aria-labelledby')).toBe(tab('a').id);
	});

	it('makes the shown panel reachable when nothing in it is focusable, and leaves a consumer tabindex alone', () => {
		const { tab, panel } = setup();
		expect(panel('b').tabIndex).toBe(0);
		tab('c').click();
		expect([panel('b').hasAttribute('tabindex'), panel('c').hasAttribute('tabindex'), panel('d').tabIndex]).toEqual([false, false, -1]);
	});

	it('never makes a hidden panel a tab stop', () => {
		const { panel } = setup();
		expect(['a', 'c'].map((key) => panel(key).hasAttribute('tabindex'))).toEqual([false, false]);
	});

	it('selects with the arrow keys, wrapping, and with Home and End', () => {
		const { tab, press } = setup();
		tab('b').focus();
		press('ArrowRight');
		expect([document.activeElement, tab('c').getAttribute('aria-selected')]).toEqual([tab('c'), 'true']);
		press('End');
		press('ArrowRight');
		expect(document.activeElement).toBe(tab('a'));
		press('ArrowLeft');
		expect(document.activeElement).toBe(tab('d'));
		press('Home');
		expect(tab('a').getAttribute('aria-selected')).toBe('true');
	});

	it('marks a tab selected before it takes focus, so it is announced as selected', () => {
		const { tab, press } = setup();
		let selectedAtFocus: string | null = null;
		tab('c').addEventListener('focus', () => (selectedAtFocus = tab('c').getAttribute('aria-selected')));
		tab('b').focus();
		press('ArrowRight');
		expect(selectedAtFocus).toBe('true');
	});

	it('skips disabled tabs', () => {
		const { tab, press } = setup({ disabled: 'c' });
		tab('b').focus();
		press('ArrowRight');
		expect(document.activeElement).toBe(tab('d'));
	});

	it('follows a vertical orientation and a right-to-left direction', () => {
		let view = setup({ orientation: 'vertical' });
		view.tab('b').focus();
		view.press('ArrowRight');
		expect(document.activeElement).toBe(view.tab('b'));
		view.press('ArrowDown');
		expect(document.activeElement).toBe(view.tab('c'));
		unbind!();
		view = setup({ dir: 'rtl' });
		view.tab('b').focus();
		view.press('ArrowLeft');
		expect(document.activeElement).toBe(view.tab('c'));
	});

	it('moves focus only with manual activation, selects on click, and returns the tab stop on leaving', () => {
		const { tab, press } = setup({}, { activation: 'manual' });
		tab('b').focus();
		press('ArrowRight');
		expect([document.activeElement, tab('c').tabIndex, tab('c').getAttribute('aria-selected')]).toEqual([tab('c'), 0, 'false']);
		tab('c').dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
		expect([tab('b').tabIndex, tab('c').tabIndex]).toEqual([0, -1]);
		tab('d').click();
		expect(tab('d').getAttribute('aria-selected')).toBe('true');
	});

	it('leaves keys held with a modifier alone', () => {
		const { tab, press } = setup();
		tab('b').focus();
		expect(press('ArrowRight', { altKey: true }).defaultPrevented).toBe(false);
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
	});

	it('fires interop-tabs-change when the selection changes, and not on bind', () => {
		document.body.innerHTML = markup();
		const changes: string[] = [];
		document.body.addEventListener('interop-tabs-change', (event) =>
			changes.push((event as CustomEvent<TabsChangeDetail>).detail.panel!.id),
		);
		unbind = bindTabs(document.querySelector('[interop-tabs]')!);
		expect(changes).toEqual([]);
		document.querySelector<HTMLElement>('[aria-controls="p-c"]')!.click();
		document.querySelector<HTMLElement>('[aria-controls="p-c"]')!.click();
		expect(changes).toEqual(['p-c']);
	});

	it('selects the tab of a panel that find-in-page is about to reveal', () => {
		const { tab, panel } = setup();
		panel('d').dispatchEvent(new Event('beforematch', { bubbles: true }));
		expect(tab('d').getAttribute('aria-selected')).toBe('true');
	});

	it('selects a neighbor when the selected tab is removed', async () => {
		const { tab } = setup();
		tab('b').remove();
		await new Promise((resolve) => setTimeout(resolve));
		expect(tab('c').getAttribute('aria-selected')).toBe('true');
	});

	it('wires a tab added later', async () => {
		const { root } = setup();
		root
			.querySelector('[role="tablist"]')!
			.insertAdjacentHTML('beforeend', '<button type="button" role="tab" aria-controls="p-e">e</button>');
		root.insertAdjacentHTML('beforeend', '<section role="tabpanel" id="p-e">E</section>');
		await new Promise((resolve) => setTimeout(resolve));
		expect([document.getElementById('p-e')!.getAttribute('hidden'), document.querySelector('[aria-controls="p-e"]')!.id]).toEqual([
			'until-found',
			expect.stringMatching(/^itx-tab-/),
		]);
	});

	it('follows the URL fragment when asked', () => {
		history.replaceState(null, '', '#p-c');
		const { tab } = setup({}, { hash: true });
		expect(tab('c').getAttribute('aria-selected')).toBe('true');
		history.replaceState(null, '', '#p-a');
		window.dispatchEvent(new HashChangeEvent('hashchange'));
		expect(tab('a').getAttribute('aria-selected')).toBe('true');
	});

	it('stops once unbound', () => {
		const { tab, press } = setup();
		unbind!();
		tab('b').focus();
		press('ArrowRight');
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
	});
});
