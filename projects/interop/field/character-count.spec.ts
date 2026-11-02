import { InteropCharacterCountElement } from './character-count';

describe('<interop-character-count>', () => {
	const flush = () => Promise.resolve();
	const parts = `
		<textarea id="summary"></textarea>
		<p interop-count></p>`;
	const make = (attributes = 'itx-limit="5"', children = parts) => {
		document.body.innerHTML = `
			<form>
				<label for="summary">Summary</label>
				<interop-character-count ${attributes}>${children}</interop-character-count>
			</form>`;
		const element = document.querySelector('interop-character-count')!;
		return { element, ...found(element) };
	};
	const found = (element: Element) => ({
		control: element.querySelector('textarea')!,
		count: element.querySelector<HTMLElement>('[interop-count]')!,
	});
	const type = (control: HTMLTextAreaElement, value: string) => {
		control.value = value;
		control.dispatchEvent(new Event('input', { bubbles: true }));
	};

	afterEach(() => (document.body.innerHTML = ''));

	it('is defined by importing interop/field, counts from the start, and adds no role', () => {
		const { element, count } = make();
		expect(element).toBeInstanceOf(InteropCharacterCountElement);
		expect(element.hasAttribute('role')).toBe(false);
		expect(count.textContent).toBe('You have 5 characters remaining');
		expect(count.getAttribute('aria-hidden')).toBe('true');
	});

	it('makes a prefilled value over the limit invalid, and counts as the user types', () => {
		const { control, count } = make('itx-limit="5"', '<textarea id="summary">Too long</textarea><p interop-count></p>');
		expect(control.validationMessage).toBe('Summary must be 5 characters or fewer');
		type(control, 'Fine');
		expect(count.textContent).toBe('You have 1 character remaining');
		expect(control.validity.valid).toBe(true);
	});

	it('binds children a framework inserts after the element', async () => {
		const { element } = make('itx-limit="5"', '');
		element.innerHTML = parts;
		await flush();
		expect(found(element).count.textContent).toBe('You have 5 characters remaining');
	});

	it('follows a change to itx-limit and itx-threshold', () => {
		const { element, control, count } = make();
		element.setAttribute('itx-limit', '10');
		type(control, 'abc');
		expect(count.textContent).toBe('You have 7 characters remaining');
		element.setAttribute('itx-threshold', '0.5');
		expect(count.hidden).toBe(true);
	});

	it('takes message and tooLong', () => {
		const { element, control, count } = make();
		element.message = (left) => `${left} left`;
		element.tooLong = (limit) => `At most ${limit}`;
		expect(count.textContent).toBe('5 left');
		type(control, 'Too long');
		expect(count.textContent).toBe('-3 left');
		expect(control.validationMessage).toBe('At most 5');
	});

	it('takes a message set before the element was upgraded, as a framework can', () => {
		// A document without a browsing context upgrades nothing, so the element starts as a plain one.
		const inert = document.implementation.createHTMLDocument('');
		inert.body.innerHTML = `<interop-character-count itx-limit="5">${parts}</interop-character-count>`;
		const element = inert.body.firstElementChild as InteropCharacterCountElement;
		expect(element).not.toBeInstanceOf(InteropCharacterCountElement);
		element.message = (left) => `${left} left`;
		document.body.innerHTML = '<label for="summary">Summary</label>';
		document.body.append(element);
		expect(element).toBeInstanceOf(InteropCharacterCountElement);
		expect(found(element).count.textContent).toBe('5 left');
	});

	it('does nothing without a limit', () => {
		const { count } = make('');
		expect(count.textContent).toBe('');
	});

	it('clears the validity it set when it is removed', () => {
		const { element, control } = make();
		type(control, 'Too long');
		expect(control.validity.valid).toBe(false);
		element.remove();
		expect(control.validity.customError).toBe(false);
	});
});
