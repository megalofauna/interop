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

	it('leaves no tab stop on a hidden panel after a rebind', () => {
		document.body.innerHTML = `<interop-tabs>
			<div role="tablist" aria-label="Sections">
				<button type="button" role="tab" aria-controls="a" aria-selected="true">A</button>
				<button type="button" role="tab" aria-controls="b">B</button>
			</div>
			<section role="tabpanel" id="a">Text only</section>
			<section role="tabpanel" id="b">Text only</section>
		</interop-tabs>`;
		const tabs = document.querySelector('interop-tabs')!;
		const panel = (key: string) => document.getElementById(key)!;
		expect(panel('a').tabIndex).toBe(0);
		tabs.setAttribute('itx-activation', 'manual');
		tabs.querySelector<HTMLElement>('[aria-controls="b"]')!.click();
		expect(panel('b').tabIndex).toBe(0);
		expect([panel('a').getAttribute('hidden'), panel('a').hasAttribute('tabindex')]).toEqual(['until-found', false]);
	});

	it("sets a consumer's panel tabindex aside while the panel is hidden, and puts it back when shown", () => {
		document.body.innerHTML = `<interop-tabs>
			<div role="tablist" aria-label="Sections">
				<button type="button" role="tab" aria-controls="a" aria-selected="true">A</button>
				<button type="button" role="tab" aria-controls="b">B</button>
			</div>
			<section role="tabpanel" id="a" tabindex="0">Text only</section>
			<section role="tabpanel" id="b" tabindex="0">Text only</section>
		</interop-tabs>`;
		const tabs = document.querySelector('interop-tabs')!;
		const tab = (key: string) => tabs.querySelector<HTMLElement>(`[aria-controls="${key}"]`)!;
		const panel = (key: string) => document.getElementById(key)!;
		expect([panel('a').getAttribute('tabindex'), panel('b').hasAttribute('tabindex')]).toEqual(['0', false]);
		tab('b').click();
		expect([panel('a').hasAttribute('tabindex'), panel('b').getAttribute('tabindex')]).toEqual([false, '0']);
		tabs.setAttribute('itx-activation', 'manual');
		tab('a').click();
		expect([panel('a').getAttribute('tabindex'), panel('b').hasAttribute('tabindex')]).toEqual(['0', false]);
		expect(panel('b').hasAttribute('data-tabs-reachable')).toBe(false);
	});

	it('ignores a malformed URL fragment under itx-hash, and binds once', () => {
		const url = location.href;
		history.replaceState(null, '', '#%E0%A4%A');
		const { tabs, tab } = make('itx-hash');
		const changes: string[] = [];
		tabs.addEventListener('interop-tabs-change', () => changes.push('change'));
		tabs.remove();
		document.body.append(tabs);
		tab('b').click();
		expect(changes).toEqual(['change']);
		history.replaceState(null, '', url);
	});

	it('binds its own tab list, not one nested in a panel', () => {
		document.body.innerHTML = `<interop-tabs>
			<section role="tabpanel" id="o1">
				<interop-tabs>
					<div role="tablist" aria-label="Inner"><button type="button" role="tab" aria-controls="i1">I</button></div>
					<section role="tabpanel" id="i1">Inner</section>
				</interop-tabs>
			</section>
			<section role="tabpanel" id="o2">Outer two</section>
			<div role="tablist" aria-label="Outer">
				<button type="button" role="tab" aria-controls="o1">O1</button>
				<button type="button" role="tab" aria-controls="o2">O2</button>
			</div>
		</interop-tabs>`;
		expect(document.getElementById('o2')!.getAttribute('hidden')).toBe('until-found');
		expect(document.querySelector<HTMLElement>('[aria-controls="o1"]')!.tabIndex).toBe(0);
	});

	it('drops the shown panel from the tab order once its content gains something focusable', async () => {
		const { panel } = make();
		panel('a').textContent = 'Text only';
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(panel('a').tabIndex).toBe(0);
		panel('a').innerHTML = '<a href="#next">A link</a>';
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(panel('a').hasAttribute('tabindex')).toBe(false);
	});

	it('gives the selection to a tab inserted already marked selected', async () => {
		const { tabs, tab, panel } = make();
		const changes: string[] = [];
		tabs.addEventListener('interop-tabs-change', (event) => changes.push((event as CustomEvent).detail.panel.id));
		tabs.insertAdjacentHTML('beforeend', '<section role="tabpanel" id="c">C</section>');
		tabs
			.querySelector('[role="tablist"]')!
			.insertAdjacentHTML('beforeend', '<button type="button" role="tab" aria-controls="c" aria-selected="true">C</button>');
		await Promise.resolve();
		expect(tab('c').getAttribute('aria-selected')).toBe('true');
		expect([tab('a').getAttribute('aria-selected'), panel('a').getAttribute('hidden'), panel('c').hasAttribute('hidden')]).toEqual([
			'false',
			'until-found',
			false,
		]);
		expect(changes).toEqual(['c']);
	});

	it('keeps the selection when an unselected tab is inserted', async () => {
		const { tabs, tab } = make();
		tabs.insertAdjacentHTML('beforeend', '<section role="tabpanel" id="c" hidden="until-found">C</section>');
		tabs
			.querySelector('[role="tablist"]')!
			.insertAdjacentHTML('beforeend', '<button type="button" role="tab" aria-controls="c">C</button>');
		await Promise.resolve();
		expect(tab('a').getAttribute('aria-selected')).toBe('true');
	});

	describe('the element owns its outputs and follows its inputs', () => {
		const three = `
			<div role="tablist" aria-label="Sections">
				<button type="button" role="tab" aria-controls="a" aria-selected="true">A</button>
				<button type="button" role="tab" aria-controls="b">B</button>
				<button type="button" role="tab" aria-controls="c">C</button>
			</div>
			<section role="tabpanel" id="a">A</section>
			<section role="tabpanel" id="b" hidden="until-found">B</section>
			<section role="tabpanel" id="c" hidden="until-found">C</section>
			<section role="tabpanel" id="d" hidden="until-found">D</section>`;
		const setup = () => {
			document.body.innerHTML = `<interop-tabs>${three}</interop-tabs>`;
			const tabs = document.querySelector('interop-tabs')!;
			const tab = (key: string) => tabs.querySelector<HTMLElement>(`[aria-controls="${key}"]`)!;
			const panel = (key: string) => document.getElementById(key)!;
			const settle = () => Promise.resolve().then(() => Promise.resolve());
			return { tabs, tab, panel, settle };
		};

		it('moves the selection off a selected tab that becomes disabled', async () => {
			const { tab, panel, settle } = setup();
			(tab('a') as HTMLButtonElement).disabled = true;
			await settle();
			expect([tab('b').getAttribute('aria-selected'), tab('b').tabIndex, panel('a').getAttribute('hidden')]).toEqual([
				'true',
				0,
				'until-found',
			]);
		});

		it("follows the selected tab's aria-controls to another panel", async () => {
			const { tab, panel, settle } = setup();
			tab('a').setAttribute('aria-controls', 'd');
			await settle();
			expect([panel('d').hasAttribute('hidden'), panel('a').hasAttribute('hidden')]).toEqual([false, false]);
			expect(tab('d').getAttribute('aria-selected')).toBe('true');
		});

		it('hides again a panel someone else shows, and ignores aria-selected written onto a tab in place', async () => {
			const { tab, panel, settle } = setup();
			panel('c').removeAttribute('hidden');
			tab('c').setAttribute('aria-selected', 'true');
			await settle();
			expect([panel('c').getAttribute('hidden'), tab('c').getAttribute('aria-selected'), tab('a').getAttribute('aria-selected')]).toEqual([
				'until-found',
				'false',
				'true',
			]);
		});

		it('keeps the manual tab stop on the focused tab when outputs are rewritten', async () => {
			const { tabs, tab, settle } = setup();
			tabs.setAttribute('itx-activation', 'manual');
			tab('a').focus();
			tab('a').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
			tab('a').setAttribute('tabindex', '0');
			await settle();
			expect([tab('a').tabIndex, tab('b').tabIndex, tab('a').getAttribute('aria-selected')]).toEqual([-1, 0, 'true']);
		});

		it('parks a tabindex written onto a hidden panel, and gives it back on unbind', async () => {
			const { tabs, panel, settle } = setup();
			panel('b').setAttribute('tabindex', '0');
			await settle();
			expect([panel('b').hasAttribute('tabindex'), panel('b').getAttribute('data-tabs-tabindex')]).toEqual([false, '0']);
			panel('b').setAttribute('tabindex', '-1');
			await settle();
			expect(panel('b').getAttribute('data-tabs-tabindex')).toBe('-1');
			const b = panel('b');
			tabs.remove();
			expect([b.getAttribute('tabindex'), b.hasAttribute('data-tabs-tabindex')]).toEqual(['-1', false]);
		});

		it('selects from code with select(), by the tab or by its panel id, and reports it', () => {
			const { tabs, tab } = setup();
			const changes: string[] = [];
			tabs.addEventListener('interop-tabs-change', (event) => changes.push((event as CustomEvent).detail.panel.id));
			tabs.select('c');
			expect(tab('c').getAttribute('aria-selected')).toBe('true');
			tabs.select(tab('b'));
			expect(changes).toEqual(['c', 'b']);
		});
	});
});
