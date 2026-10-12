import { bindScrollArea } from './bind-scroll-area';

/** jsdom does no layout, so each test sets the sizes it needs. */
const size = (element: HTMLElement, scroll: number, client: number) => {
	Object.defineProperty(element, 'scrollHeight', { value: scroll, configurable: true });
	Object.defineProperty(element, 'clientHeight', { value: client, configurable: true });
};
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('bindScrollArea', () => {
	let area: HTMLElement;
	let unbind: () => void;

	beforeEach(() => {
		document.body.innerHTML = '<div interop-scroll-area><p>Text</p></div>';
		area = document.querySelector('div')!;
	});
	afterEach(() => unbind());

	it('is focusable while it overflows with nothing focusable inside', async () => {
		size(area, 900, 300);
		unbind = bindScrollArea(area);
		expect(area.getAttribute('tabindex')).toBe('0');
		size(area, 300, 300);
		area.append(document.createElement('p'));
		await settle();
		expect(area.hasAttribute('tabindex')).toBe(false);
	});

	it('leaves the tab stop to a control inside', () => {
		size(area, 900, 300);
		area.innerHTML = '<p>Text <a href="/more">more</a></p>';
		unbind = bindScrollArea(area);
		expect(area.hasAttribute('tabindex')).toBe(false);
	});

	it('ignores controls that cannot take focus', () => {
		size(area, 900, 300);
		area.innerHTML = '<button disabled>Off</button><div inert><a href="/x">x</a></div><input type="hidden">';
		unbind = bindScrollArea(area);
		expect(area.getAttribute('tabindex')).toBe('0');
	});

	it('keeps its tab stop while focused, and drops it after', async () => {
		size(area, 900, 300);
		unbind = bindScrollArea(area);
		area.focus();
		size(area, 300, 300);
		area.append(document.createElement('p'));
		await settle();
		expect(area.getAttribute('tabindex')).toBe('0');
		area.blur();
		await settle();
		expect(area.hasAttribute('tabindex')).toBe(false);
	});

	it('leaves a tabindex the author set', async () => {
		area.setAttribute('tabindex', '-1');
		size(area, 900, 300);
		unbind = bindScrollArea(area);
		expect(area.getAttribute('tabindex')).toBe('-1');
		unbind();
		expect(area.getAttribute('tabindex')).toBe('-1');
		unbind = () => {};
	});

	it('is a group when named, and has no role when not', async () => {
		unbind = bindScrollArea(area);
		expect(area.hasAttribute('role')).toBe(false);
		area.setAttribute('aria-label', 'Results');
		await settle();
		expect(area.getAttribute('role')).toBe('group');
		area.removeAttribute('aria-label');
		await settle();
		expect(area.hasAttribute('role')).toBe(false);
	});

	it('removes what it added', () => {
		size(area, 900, 300);
		area.setAttribute('aria-labelledby', 'h');
		unbind = bindScrollArea(area);
		unbind();
		expect(area.hasAttribute('tabindex')).toBe(false);
		expect(area.hasAttribute('role')).toBe(false);
		unbind = () => {};
	});
});
