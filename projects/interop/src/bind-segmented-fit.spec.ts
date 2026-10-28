import { bindSegmentedFit } from './bind-segmented-fit';

describe('bindSegmentedFit', () => {
	let unbind: (() => void) | undefined;
	afterEach(() => {
		unbind?.();
		unbind = undefined;
	});

	// jsdom has no layout, so the widths are given.
	const setup = (rowWidth: number, containerWidth: number) => {
		document.body.innerHTML = `<div><fieldset interop-radio-group="segmented"><legend>Sort</legend><label><input type="radio" name="s"> Newest</label></fieldset></div>`;
		const group = document.querySelector('fieldset')!;
		Object.defineProperty(group.parentElement, 'clientWidth', { get: () => containerWidth });
		group.getBoundingClientRect = () => ({ width: rowWidth }) as DOMRect;
		unbind = bindSegmentedFit(group);
		return group;
	};

	it('stacks a row that runs past its container', () => {
		expect(setup(400, 320).hasAttribute('data-stacked')).toBe(true);
	});

	it('leaves a row that fits', () => {
		expect(setup(300, 320).hasAttribute('data-stacked')).toBe(false);
	});

	it('stacks a row whose box is capped at the container but whose segments overflow it', () => {
		document.body.innerHTML = `<div><fieldset interop-radio-group="segmented"><legend>Month</legend><label><input type="radio" name="m"> Jan</label></fieldset></div>`;
		const group = document.querySelector('fieldset')!;
		Object.defineProperty(group.parentElement, 'clientWidth', { get: () => 320 });
		Object.defineProperty(group, 'scrollWidth', { get: () => 400 });
		group.getBoundingClientRect = () => ({ width: 320 }) as DOMRect;
		unbind = bindSegmentedFit(group);
		expect(group.hasAttribute('data-stacked')).toBe(true);
	});

	it('measures again when a web font loads and widens the row', async () => {
		const fonts = new EventTarget();
		Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
		try {
			let rowWidth = 300;
			document.body.innerHTML = `<div><fieldset interop-radio-group="segmented"><legend>Sort</legend><label><input type="radio" name="s"> Newest</label></fieldset></div>`;
			const group = document.querySelector('fieldset')!;
			Object.defineProperty(group.parentElement, 'clientWidth', { get: () => 320 });
			group.getBoundingClientRect = () => ({ width: rowWidth }) as DOMRect;
			unbind = bindSegmentedFit(group);
			expect(group.hasAttribute('data-stacked')).toBe(false);

			rowWidth = 400;
			fonts.dispatchEvent(new Event('loadingdone'));
			await new Promise((resolve) => requestAnimationFrame(resolve));
			expect(group.hasAttribute('data-stacked')).toBe(true);
		} finally {
			delete (document as { fonts?: unknown }).fonts;
		}
	});

	it('removes data-stacked when unbound', () => {
		const group = setup(400, 320);
		unbind!();
		unbind = undefined;
		expect(group.hasAttribute('data-stacked')).toBe(false);
	});
});
