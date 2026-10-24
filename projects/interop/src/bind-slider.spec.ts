import { bindSlider, paintSlider } from './bind-slider';

describe('bindSlider', () => {
	let input: HTMLInputElement;
	let unbind: () => void;
	const fill = () => input.style.getPropertyValue('--itx-slider-value');

	beforeEach(() => {
		document.body.innerHTML = `
			<form><input type="range" interop-slider aria-label="Budget" min="100" max="500" value="200"></form>
			<span id="readout"></span>`;
		input = document.querySelector('input')!;
	});

	afterEach(() => unbind?.());

	it('sets the fill from the value, from 0 at min to 1 at max', () => {
		unbind = bindSlider(input);
		expect(fill()).toBe('0.25');
		input.value = '500';
		input.dispatchEvent(new Event('input'));
		expect(fill()).toBe('1');
	});

	it('sets no aria-valuetext without format, and the value as words with it', () => {
		unbind = bindSlider(input);
		expect(input.hasAttribute('aria-valuetext')).toBe(false);
		unbind();
		unbind = bindSlider(input, { format: (value) => `$${value}` });
		expect(input.getAttribute('aria-valuetext')).toBe('$200');
	});

	it('writes the readout and hides it from assistive technology', () => {
		const readout = document.getElementById('readout')!;
		unbind = bindSlider(input, { readout, format: (value) => `$${value}` });
		expect(readout.textContent).toBe('$200');
		expect(readout.getAttribute('aria-hidden')).toBe('true');
	});

	it('repaints after the form resets, which fires no input event', async () => {
		unbind = bindSlider(input);
		input.value = '500';
		input.dispatchEvent(new Event('input'));
		input.form!.reset();
		await new Promise((resolve) => setTimeout(resolve));
		expect(input.value).toBe('200');
		expect(fill()).toBe('0.25');
	});

	it('repaints a value set by script when paintSlider() is called', () => {
		unbind = bindSlider(input);
		input.value = '300';
		expect(fill()).toBe('0.25');
		paintSlider(input);
		expect(fill()).toBe('0.5');
	});

	it('stops following the value once unbound', () => {
		unbind = bindSlider(input);
		unbind();
		input.value = '500';
		input.dispatchEvent(new Event('input'));
		expect(fill()).toBe('0.25');
	});
});
