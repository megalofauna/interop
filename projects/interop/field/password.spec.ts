import { InteropPasswordElement } from './password';

describe('<interop-password>', () => {
	const make = () => {
		document.body.innerHTML = `
			<form>
				<interop-password>
					<input id="password" type="password">
					<button type="button" commandfor="password" command="--toggle-password" aria-pressed="false">Show password</button>
				</interop-password>
			</form>`;
		const element = document.querySelector('interop-password')!;
		const input = document.getElementById('password') as HTMLInputElement;
		const toggle = () => input.dispatchEvent(Object.assign(new Event('command'), { command: '--toggle-password' }));
		return { element, input, toggle };
	};

	afterEach(() => (document.body.innerHTML = ''));

	it('is defined by importing interop/field, upgrades markup inserted as HTML, and adds no role', () => {
		const { element, input, toggle } = make();
		expect(element).toBeInstanceOf(InteropPasswordElement);
		expect(element.hasAttribute('role')).toBe(false);
		toggle();
		expect(input.type).toBe('text');
	});

	it('hides the password and stops when it is removed', () => {
		const { element, input, toggle } = make();
		toggle();
		element.remove();
		expect(input.type).toBe('password');
		toggle();
		expect(input.type).toBe('password');
	});
});
