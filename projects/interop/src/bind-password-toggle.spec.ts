import { bindPasswordToggle } from './bind-password-toggle';

describe('bindPasswordToggle', () => {
	let unbind: (() => void) | undefined;
	const setup = () => {
		document.body.innerHTML = `
			<form>
				<div id="row">
					<input id="password" type="password" value="secret">
					<button type="button" commandfor="password" command="--toggle-password" aria-pressed="false">Show password</button>
				</div>
			</form>`;
		const root = document.getElementById('row')!;
		const input = document.getElementById('password') as HTMLInputElement;
		const button = document.querySelector('button')!;
		unbind = bindPasswordToggle(root);
		// jsdom has no invoker commands, so the event is dispatched as the browser would.
		const toggle = () => input.dispatchEvent(Object.assign(new Event('command'), { command: '--toggle-password', source: button }));
		return { root, input, button, toggle, form: input.form! };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
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

	it('ignores other commands', () => {
		const { input } = setup();
		input.dispatchEvent(Object.assign(new Event('command'), { command: '--other' }));
		expect(input.type).toBe('password');
	});

	it('hides the password again on submit and reset, so it is not saved as text', () => {
		const { input, button, toggle, form } = setup();
		toggle();
		form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
		expect(input.type).toBe('password');
		expect(button.getAttribute('aria-pressed')).toBe('false');
		toggle();
		form.dispatchEvent(new Event('reset', { bubbles: true }));
		expect(input.type).toBe('password');
	});

	it('leaves the password shown when a submit is stopped, as a failed validation does', () => {
		const { input, toggle, form } = setup();
		form.addEventListener('submit', (event) => event.stopImmediatePropagation(), { capture: true });
		toggle();
		form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
		expect(input.type).toBe('text');
	});

	it('works with an input and button that render after it binds', () => {
		document.body.innerHTML = '<form><div id="row"></div></form>';
		const root = document.getElementById('row')!;
		unbind = bindPasswordToggle(root);
		root.innerHTML = `
			<input id="late" type="password">
			<button type="button" commandfor="late" command="--toggle-password" aria-pressed="false">Show password</button>`;
		const input = document.getElementById('late') as HTMLInputElement;
		input.dispatchEvent(Object.assign(new Event('command'), { command: '--toggle-password' }));
		expect(input.type).toBe('text');
		expect(root.querySelector('button')!.getAttribute('aria-pressed')).toBe('true');
	});

	it('hides the password when it unbinds', () => {
		const { input, toggle } = setup();
		toggle();
		unbind!();
		unbind = undefined;
		expect(input.type).toBe('password');
	});
});
