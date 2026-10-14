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

	it('removes data-stacked when unbound', () => {
		const group = setup(400, 320);
		unbind!();
		unbind = undefined;
		expect(group.hasAttribute('data-stacked')).toBe(false);
	});
});
