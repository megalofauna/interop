import { bindRadioHomeEnd } from './bind-radio-home-end';

describe('bindRadioHomeEnd', () => {
	let unbind: () => void;
	const setup = () => {
		document.body.innerHTML = `
			<fieldset interop-radio-group>
				<legend>Size</legend>
				<label><input type="radio" name="s" value="xs" disabled> XS</label>
				<label><input type="radio" name="s" value="s"> S</label>
				<label><input type="radio" name="s" value="m" checked> M</label>
				<label><input type="radio" name="s" value="l"> L</label>
				<label><input type="radio" name="s" value="xl" disabled> XL</label>
			</fieldset>`;
		const group = document.querySelector('fieldset') as HTMLElement;
		unbind = bindRadioHomeEnd(group);
		const radio = (value: string) => group.querySelector<HTMLInputElement>(`[value="${value}"]`)!;
		const press = (key: string, init: KeyboardEventInit = {}) => {
			const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
			(document.activeElement ?? radio('m')).dispatchEvent(event);
			return event;
		};
		radio('m').focus();
		return { radio, press };
	};
	afterEach(() => unbind?.());

	it('checks and focuses the first and last enabled radio', () => {
		const { radio, press } = setup();
		press('Home');
		expect([radio('s').checked, document.activeElement]).toEqual([true, radio('s')]);
		press('End');
		expect([radio('l').checked, document.activeElement]).toEqual([true, radio('l')]);
	});

	it('fires change, as a click does', () => {
		const { radio, press } = setup();
		const changes: string[] = [];
		document.querySelector('fieldset')!.addEventListener('change', (event) => changes.push((event.target as HTMLInputElement).value));
		press('End');
		expect(changes).toEqual(['l']);
		expect(radio('l').checked).toBe(true);
	});

	it('leaves the keys alone with a modifier, and once unbound', () => {
		const { radio, press } = setup();
		expect(press('Home', { shiftKey: true }).defaultPrevented).toBe(false);
		unbind();
		press('End');
		expect(radio('m').checked).toBe(true);
	});
});
