import { InteropValidationElement } from './validation';

describe('<interop-validation>', () => {
	const flush = () => Promise.resolve();
	const summary = '<div interop-error-summary hidden><h2>There is a problem</h2><ul></ul></div>';
	const form = `
		<form>
			<div interop-field>
				<label for="name">Full name</label>
				<p interop-error hidden></p>
				<input id="name" name="name" required>
			</div>
		</form>`;
	const make = (children = summary + form) => {
		document.body.innerHTML = `<interop-validation>${children}</interop-validation>`;
		return document.querySelector('interop-validation')!;
	};
	const submit = (element: Element) =>
		element.querySelector('form')!.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
	const parts = (element: Element) => ({
		form: element.querySelector('form')!,
		list: element.querySelector('[interop-error-summary]')!,
		error: element.querySelector<HTMLElement>('[interop-error]')!,
	});

	afterEach(() => (document.body.innerHTML = ''));

	it('is defined by importing interop/field, and adds no role', () => {
		const element = make();
		expect(element).toBeInstanceOf(InteropValidationElement);
		expect(element.hasAttribute('role')).toBe(false);
		expect(parts(element).form.noValidate).toBe(true);
	});

	it('stops a failed submit, fills the summary and shows the field’s error', () => {
		const element = make();
		const { list, error } = parts(element);
		expect(submit(element)).toBe(false);
		expect((list as HTMLElement).hidden).toBe(false);
		expect(list.querySelector('a')!.textContent).toBe('Enter full name');
		expect(document.activeElement).toBe(list);
		expect(error.textContent).toBe('Enter full name');
	});

	it('binds a form a framework inserts after the element, and the summary with it', async () => {
		const element = make('');
		element.innerHTML = summary + form;
		await flush();
		expect(parts(element).form.noValidate).toBe(true);
		submit(element);
		expect((parts(element).list as HTMLElement).hidden).toBe(false);
	});

	it('takes messages, including ones set before it was upgraded', () => {
		const inert = document.implementation.createHTMLDocument('');
		inert.body.innerHTML = `<interop-validation>${summary + form}</interop-validation>`;
		const element = inert.body.firstElementChild as InteropValidationElement;
		element.messages = { valueMissing: 'Tell us your name' };
		document.body.replaceChildren(element);
		expect(element).toBeInstanceOf(InteropValidationElement);
		submit(element);
		expect(parts(element).error.textContent).toBe('Tell us your name');
		element.messages = { valueMissing: 'We need your name' };
		submit(element);
		expect(parts(element).error.textContent).toBe('We need your name');
	});

	it('gives the form back to the browser when it is removed', () => {
		const element = make();
		const { form } = parts(element);
		element.remove();
		expect(form.noValidate).toBe(false);
	});
});
