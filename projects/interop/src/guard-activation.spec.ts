import { guardActivation } from './guard-activation';

describe('guardActivation', () => {
	let unguard: () => void;
	let clicks: number;
	const button = (attributes: Record<string, string> = {}) => {
		const el = document.createElement('button');
		for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
		el.innerHTML = '<span>label</span>';
		el.addEventListener('click', () => clicks++);
		document.body.append(el);
		return el;
	};

	beforeEach(() => {
		clicks = 0;
		document.body.innerHTML = '';
		unguard = guardActivation();
	});
	afterEach(() => unguard());

	it('cancels a click on aria-disabled', () => {
		const event = new MouseEvent('click', { bubbles: true, cancelable: true });
		button({ 'aria-disabled': 'true' }).dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		expect(clicks).toBe(0);
	});

	it('cancels a click on aria-busy', () => {
		button({ 'aria-busy': 'true' }).click();
		expect(clicks).toBe(0);
	});

	it('cancels a click that lands on a child of the button', () => {
		button({ 'aria-disabled': 'true' }).querySelector('span')!.click();
		expect(clicks).toBe(0);
	});

	it('leaves an available button alone', () => {
		button().click();
		button({ 'aria-disabled': 'false' }).click();
		expect(clicks).toBe(2);
	});

	it('stops guarding once removed', () => {
		unguard();
		button({ 'aria-disabled': 'true' }).click();
		expect(clicks).toBe(1);
		unguard = () => {};
	});
});
