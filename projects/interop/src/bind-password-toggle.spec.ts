import { bindPasswordToggle } from './bind-password-toggle';

describe('bindPasswordToggle', () => {
	let unbind: (() => void) | undefined;
	const setup = () => {
		document.body.innerHTML = `
			<form>
				<input id="password" type="password" value="secret">
				<button type="button" commandfor="password" command="--toggle-password" aria-pressed="false" hidden>Show password</button>
			</form>`;
		const input = document.getElementById('password') as HTMLInputElement;
		const button = document.querySelector('button')!;
		unbind = bindPasswordToggle(input);
		// jsdom has no invoker commands, so the event is dispatched as the browser would.
		const toggle = () => input.dispatchEvent(Object.assign(new Event('command'), { command: '--toggle-password', source: button }));
		return { input, button, toggle, form: input.form! };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
	});

	it('shows the button, which script is needed for', () => {
		const { button } = setup();
		expect(button.hidden).toBe(false);
		expect(button.getAttribute('aria-pressed')).toBe('false');
	});

	it('shows and hides the password, keeping the label and reporting the state', () => {
		const { input, button, toggle } = setup();
		toggle();
		expect(input.type).toBe('text');
		expect(button.getAttribute('aria-pressed')).toBe('true');
		expect(button.textContent).toBe('Show password');
		toggle();
		expect(input.type).toBe('password');
		expect(button.getAttribute('aria-pressed')).toBe('false');
	});

	it('hides the password again on submit, so it is not saved as text', () => {
		const { input, button, toggle, form } = setup();
		toggle();
		form.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
		expect(input.type).toBe('password');
		expect(button.getAttribute('aria-pressed')).toBe('false');
	});
});
