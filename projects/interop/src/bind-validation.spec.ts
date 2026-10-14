import { bindValidation, type ValidationOptions } from './bind-validation';

describe('bindValidation', () => {
	let unbind: (() => void) | undefined;
	const setup = ({ messages, summary = false }: { messages?: ValidationOptions['messages']; summary?: boolean } = {}) => {
		document.body.innerHTML = `
			<div interop-error-summary hidden><h2>There is a problem</h2><ul></ul></div>
			<form id="f">
				<div interop-field>
					<label for="email">Email address</label>
					<p interop-hint id="email-hint">We send the receipt here</p>
					<p interop-error hidden></p>
					<input interop-input id="email" type="email" name="email" required aria-describedby="email-hint">
				</div>
				<fieldset>
					<legend>Delivery</legend>
					<p interop-error hidden></p>
					<label><input type="radio" id="post" name="delivery" value="post" required> Post</label>
					<label><input type="radio" name="delivery" value="collect"> Collect</label>
				</fieldset>
				<button id="send">Send</button>
			</form>`;
		const form = document.getElementById('f') as HTMLFormElement;
		const summaryElement = document.querySelector<HTMLElement>('[interop-error-summary]')!;
		unbind = bindValidation(form, { messages, summary: summary ? summaryElement : null });
		const email = document.getElementById('email') as HTMLInputElement;
		const errorOf = (element: Element) => element.closest('[interop-field], fieldset')!.querySelector<HTMLElement>(':scope > [interop-error]')!;
		const submit = () => form.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
		const type = (value: string) => {
			email.value = value;
			email.dispatchEvent(new Event('input', { bubbles: true }));
		};
		const leave = () => email.dispatchEvent(new Event('change', { bubbles: true }));
		return { form, email, errorOf, submit, type, leave, summaryElement };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
	});

	it('turns off the browser bubbles and marks untouched fields valid', () => {
		const { form, email } = setup();
		expect(form.noValidate).toBe(true);
		expect(email.getAttribute('aria-invalid')).toBe('false');
	});

	it('shows nothing for an empty required field until submit', () => {
		const { email, errorOf, leave } = setup();
		leave();
		expect(errorOf(email).hidden).toBe(true);
	});

	it('shows a format error when the user leaves a field they changed, and clears it as they fix it', () => {
		const { email, errorOf, type, leave } = setup();
		type('abc');
		expect(errorOf(email).hidden).toBe(true);
		leave();
		expect(errorOf(email).textContent).toBe('Enter an email address like name@example.com');
		expect(email.getAttribute('aria-invalid')).toBe('true');
		expect(email.getAttribute('aria-describedby')).toBe(`email-hint ${errorOf(email).id}`);
		type('a@example.com');
		expect(errorOf(email).hidden).toBe(true);
		expect(email.getAttribute('aria-invalid')).toBe('false');
		expect(email.getAttribute('aria-describedby')).toBe('email-hint');
	});

	it('stops a failed submit, shows every error, and focuses the first invalid field', () => {
		const { email, errorOf, submit } = setup();
		const later = vi.fn();
		document.getElementById('f')!.addEventListener('submit', later);
		expect(submit()).toBe(false);
		expect(later).not.toHaveBeenCalled();
		expect(errorOf(email).textContent).toBe('Enter email address');
		const radio = document.getElementById('post')!;
		expect(errorOf(radio).textContent).toBe('Select delivery');
		expect(radio.closest('fieldset')!.getAttribute('aria-describedby')).toBe(errorOf(radio).id);
		expect(document.activeElement).toBe(email);
	});

	it('lets a valid form submit', () => {
		const { email, submit, type } = setup();
		type('a@example.com');
		(document.getElementById('post') as HTMLInputElement).checked = true;
		expect(submit()).toBe(true);
		expect(email.getAttribute('aria-invalid')).toBe('false');
	});

	it('lists the errors in the summary and focuses it', () => {
		const { submit, summaryElement } = setup({ summary: true });
		submit();
		expect(summaryElement.hidden).toBe(false);
		expect(Array.from(summaryElement.querySelectorAll('a')).map((a) => `${a.hash} ${a.textContent}`)).toEqual([
			'#email Enter email address',
			'#post Select delivery',
		]);
		expect(document.activeElement).toBe(summaryElement);
	});

	it('merges messages over the defaults, as strings or functions', () => {
		const { email, errorOf, submit } = setup({ messages: { valueMissing: (control, label) => (control.name === 'email' ? 'Enter your email address' : `Choose ${label}`) } });
		submit();
		expect(errorOf(email).textContent).toBe('Enter your email address');
		expect(errorOf(document.getElementById('post')!).textContent).toBe('Choose Delivery');
	});

	it('shows a custom validity message, and updates on interop-validity-change', () => {
		const { email, errorOf, submit, type } = setup();
		type('taken@example.com');
		email.setCustomValidity('That address is already registered');
		submit();
		expect(errorOf(email).textContent).toBe('That address is already registered');
		email.setCustomValidity('');
		email.dispatchEvent(new Event('interop-validity-change', { bubbles: true }));
		expect(errorOf(email).hidden).toBe(true);
	});

	it('shows the message for reportValidity() instead of a bubble', () => {
		const { email, errorOf } = setup();
		expect(email.reportValidity()).toBe(false);
		expect(errorOf(email).textContent).toBe('Enter email address');
	});

	it('clears everything on reset', async () => {
		const { form, email, errorOf, submit } = setup();
		submit();
		form.reset();
		await new Promise((resolve) => setTimeout(resolve));
		expect(errorOf(email).hidden).toBe(true);
		expect(email.getAttribute('aria-invalid')).toBe('false');
	});

	it('removes what it added on unbind', () => {
		const { form, email } = setup();
		unbind!();
		unbind = undefined;
		expect(form.noValidate).toBe(false);
		expect(email.hasAttribute('aria-invalid')).toBe(false);
	});

	it('shares one error across a fieldset of fields, and flags only the fields the user reached', () => {
		document.body.innerHTML = `
			<form id="d">
				<fieldset>
					<legend>Date of birth</legend>
					<p interop-error hidden></p>
					<div interop-field><label for="day">Day</label><input interop-input id="day" inputmode="numeric" pattern="[0-9]{1,2}" required></div>
					<div interop-field><label for="month">Month</label><input interop-input id="month" inputmode="numeric" required></div>
				</fieldset>
			</form>`;
		unbind = bindValidation(document.getElementById('d') as HTMLFormElement);
		const day = document.getElementById('day') as HTMLInputElement;
		const month = document.getElementById('month') as HTMLInputElement;
		const error = document.querySelector<HTMLElement>('[interop-error]')!;
		day.value = 'x';
		day.dispatchEvent(new Event('change', { bubbles: true }));
		expect(error.textContent).toBe('Enter day in the right format');
		expect(day.getAttribute('aria-invalid')).toBe('true');
		expect(month.getAttribute('aria-invalid')).toBe('false');
		expect(document.querySelector('fieldset')!.getAttribute('aria-describedby')).toBe(error.id);
		document.getElementById('d')!.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
		expect(month.getAttribute('aria-invalid')).toBe('true');
	});
});
