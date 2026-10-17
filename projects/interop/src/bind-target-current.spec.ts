import { bindTargetCurrent } from './bind-target-current';

// jsdom has no layout and no :target-current, so these run the fallback with section tops stubbed.
const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

describe('bindTargetCurrent', () => {
	let unbind: (() => void) | undefined;
	const tops: Record<string, number> = {};
	const setup = (links = '<li><a href="#a">A</a></li><li><a href="#b">B</a></li><li><a href="#c">C</a></li>') => {
		document.body.innerHTML = `
			<nav aria-label="On this page"><ul role="list">${links}</ul></nav>
			<section id="a"></section><section id="b"></section><section id="c"></section>`;
		for (const id of ['a', 'b', 'c']) {
			tops[id] = 1000;
			document.getElementById(id)!.getBoundingClientRect = () => ({ top: tops[id] }) as DOMRect;
		}
		const list = document.querySelector<HTMLElement>('ul')!;
		unbind = bindTargetCurrent(list);
		const current = () =>
			Array.from(list.querySelectorAll('a'))
				.filter((link) => link.getAttribute('aria-current') === 'true')
				.map((link) => link.textContent);
		return { list, current };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
	});

	it('marks the first link while no section has reached the top half of the window', async () => {
		const { current } = setup();
		await frame();
		expect(current()).toEqual(['A']);
	});

	it('marks the last link whose section starts in the top half, and follows scrolling', async () => {
		const { current } = setup();
		tops['a'] = -800;
		tops['b'] = 100;
		document.dispatchEvent(new Event('scroll'));
		await frame();
		expect(current()).toEqual(['B']);
		tops['b'] = -500;
		tops['c'] = 200;
		document.dispatchEvent(new Event('scroll'));
		await frame();
		expect(current()).toEqual(['C']);
	});

	it('leaves links to other pages alone, and an aria-current the page set', async () => {
		const { list } = setup('<li><a href="/elsewhere#a">Elsewhere</a></li><li><a href="#a" aria-current="page">A</a></li>');
		await frame();
		expect(list.querySelector('a[href="/elsewhere#a"]')!.hasAttribute('aria-current')).toBe(false);
		expect(list.querySelector('a[href="#a"]')!.getAttribute('aria-current')).toBe('page');
	});

	it('removes the aria-current it set when unbound', async () => {
		const { current } = setup();
		await frame();
		unbind!();
		unbind = undefined;
		expect(current()).toEqual([]);
	});
});
