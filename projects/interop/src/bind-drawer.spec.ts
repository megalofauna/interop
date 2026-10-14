import { bindDrawer } from './bind-drawer';

describe('bindDrawer', () => {
	let unbind: (() => void) | undefined;
	const setup = () => {
		document.body.innerHTML = `
			<button id="toggle" type="button">Menu</button>
			<nav id="drawer" interop-popover="drawer" popover aria-label="Pages">
				<a href="#one">One</a>
				<a href="#two" aria-current="page">Two</a>
			</nav>
			<a id="outside" href="#out">Outside</a>`;
		const drawer = document.getElementById('drawer')!;
		let hidden = 0;
		// jsdom has no popover API.
		drawer.hidePopover = () => {
			hidden++;
			drawer.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'closed' }));
		};
		const toggle = (newState: 'open' | 'closed') => drawer.dispatchEvent(Object.assign(new Event('toggle'), { newState }));
		unbind = bindDrawer(drawer);
		return { drawer, toggle, hides: () => hidden };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
	});

	it('moves focus to the current link when it opens', () => {
		const { toggle } = setup();
		toggle('open');
		expect(document.activeElement?.textContent).toBe('Two');
	});

	it('closes when focus leaves it, and not when focus leaves the window', () => {
		const { drawer, toggle, hides } = setup();
		toggle('open');
		drawer.querySelector('a')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
		expect(hides()).toBe(0);
		drawer
			.querySelector('a')!
			.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.getElementById('outside') }));
		expect(hides()).toBe(1);
	});

	it('closes when a link in it is followed, and does nothing while closed', () => {
		const { drawer, toggle, hides } = setup();
		drawer.querySelector('a')!.click();
		expect(hides()).toBe(0);
		toggle('open');
		drawer.querySelector('a')!.click();
		expect(hides()).toBe(1);
	});

	it('stops once unbound', () => {
		const { toggle } = setup();
		unbind!();
		toggle('open');
		expect(document.activeElement).toBe(document.body);
	});
});
