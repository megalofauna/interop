import { bindTagInput, bindTags, type TagAddDetail } from './bind-tags';

const settle = () => new Promise((resolve) => setTimeout(resolve));
const tag = (text: string) =>
	`<li>${text} <button type="button"><span>Remove ${text}</span></button><input type="hidden" name="tags" value="${text.toLowerCase()}"></li>`;

describe('bindTags', () => {
	let unbind: (() => void) | undefined;
	// Options are built after the page, so they hold this test's elements.
	const setup = (options: () => Parameters<typeof bindTags>[1] = () => ({})) => {
		document.body.innerHTML = `
			<h2 id="heading">Tags</h2>
			<ul interop-tags role="list" aria-label="Tags">${['Football', 'Cricket', 'Rugby'].map(tag).join('')}</ul>
			<p id="status" role="status"></p>`;
		const list = document.querySelector<HTMLElement>('ul')!;
		unbind = bindTags(list, options());
		const button = (text: string) => Array.from(list.querySelectorAll('button')).find((b) => b.textContent === `Remove ${text}`)!;
		const remove = (text: string) => button(text).closest('li')!.remove();
		return { list, button, remove };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
	});

	it('moves focus to the tag now in the removed one’s place', async () => {
		const { button, remove } = setup();
		button('Cricket').focus();
		remove('Cricket');
		await settle();
		expect(document.activeElement).toBe(button('Rugby'));
	});

	it('moves focus to the tag before when the last one goes, then to the fallback', async () => {
		const { button, remove } = setup(() => ({ fallback: document.getElementById('heading') }));
		button('Rugby').focus();
		remove('Rugby');
		await settle();
		expect(document.activeElement).toBe(button('Cricket'));
		remove('Cricket');
		await settle();
		button('Football').focus();
		remove('Football');
		await settle();
		expect(document.activeElement?.id).toBe('heading');
		expect((document.activeElement as HTMLElement).tabIndex).toBe(-1);
	});

	it('leaves focus alone when a tag that did not hold it is removed', async () => {
		const { button, remove } = setup();
		button('Football').focus();
		remove('Rugby');
		await settle();
		expect(document.activeElement).toBe(button('Football'));
	});

	it('announces the same removal twice in the status element without ariaNotify()', async () => {
		const { list, remove } = setup(() => ({ status: document.getElementById('status') }));
		remove('Rugby');
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(document.getElementById('status')!.textContent).toBe('Rugby removed');
		list.insertAdjacentHTML('beforeend', tag('Rugby'));
		remove('Rugby');
		await settle();
		expect(document.getElementById('status')!.textContent).toBe('');
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(document.getElementById('status')!.textContent).toBe('Rugby removed');
	});

	it('announces each removal from the list with ariaNotify(), with no status element', async () => {
		const notify = vi.fn();
		(Element.prototype as { ariaNotify?: unknown }).ariaNotify = notify;
		const { list, remove } = setup(() => ({ removed: (text) => `Removed ${text}` }));
		remove('Cricket');
		await settle();
		expect(notify.mock.calls).toEqual([['Removed Cricket', { priority: 'normal' }]]);
		expect(notify.mock.contexts[0]).toBe(list);
		delete (Element.prototype as { ariaNotify?: unknown }).ariaNotify;
	});
});

describe('bindTagInput', () => {
	let unbind: (() => void) | undefined;
	// Only options that hold no elements: an element passed in would belong to the previous page.
	const setup = (required?: string, extra: Partial<Parameters<typeof bindTagInput>[1]> = {}) => {
		document.body.innerHTML = `
			<form>
				<label for="entry">Tags</label>
				<ul interop-tags role="list" aria-label="Tags">${tag('Football')}</ul>
				<input id="entry" type="text">
				<p id="status" role="status"></p>
			</form>`;
		const list = document.querySelector<HTMLElement>('ul')!;
		const input = document.querySelector<HTMLInputElement>('#entry')!;
		unbind = bindTagInput(input, { list, required, ...extra });
		const press = (key: string, init: KeyboardEventInit = {}) => {
			const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
			input.dispatchEvent(event);
			return event;
		};
		return { list, input, press };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
	});

	it('fires interop-tags-add on Enter, stops the submit, and empties the input', () => {
		const { input, press } = setup();
		const added: string[] = [];
		input.addEventListener('interop-tags-add', (event) => added.push((event as CustomEvent<TagAddDetail>).detail.value));
		input.value = '  Cricket ';
		expect(press('Enter').defaultPrevented).toBe(true);
		expect([added, input.value]).toEqual([['Cricket'], '']);
	});

	it('announces an added tag from the input with ariaNotify()', () => {
		const notify = vi.fn();
		(Element.prototype as { ariaNotify?: unknown }).ariaNotify = notify;
		const { input, press } = setup();
		input.value = 'Cricket';
		press('Enter');
		expect(notify.mock.calls).toEqual([['Cricket added', { priority: 'normal' }]]);
		expect(notify.mock.contexts[0]).toBe(input);
		delete (Element.prototype as { ariaNotify?: unknown }).ariaNotify;
	});

	it('announces an added tag in the status element without ariaNotify()', async () => {
		const { list, input, press } = setup();
		unbind!();
		const status = document.getElementById('status')!;
		unbind = bindTagInput(input, { list, status });
		input.value = 'Cricket';
		press('Enter');
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(status.textContent).toBe('Cricket added');
	});

	it('shows and speaks the rejection message until the user types again', () => {
		const { input, press } = setup(undefined, { rejected: (value) => `${value} is already added` });
		input.addEventListener('interop-tags-add', (event) => event.preventDefault());
		input.value = 'Football';
		press('Enter');
		expect([input.value, input.validationMessage]).toEqual(['Football', 'Football is already added']);
		input.value = 'Footbal';
		input.dispatchEvent(new Event('input'));
		expect(input.validity.valid).toBe(true);
	});

	it('keeps the text when the consumer rejects it', () => {
		const { input, press } = setup();
		input.addEventListener('interop-tags-add', (event) => event.preventDefault());
		input.value = 'Football';
		press('Enter');
		expect(input.value).toBe('Football');
	});

	it('leaves Enter alone when empty, during composition, and commas always', () => {
		const { input, press } = setup();
		expect(press('Enter').defaultPrevented).toBe(false);
		input.value = 'Cri';
		expect(press('Enter', { isComposing: true }).defaultPrevented).toBe(false);
		expect(press(',').defaultPrevented).toBe(false);
	});

	it('moves focus to the last remove button on Backspace in the empty input, deleting nothing', () => {
		const { list, input, press } = setup();
		input.focus();
		press('Backspace');
		expect(document.activeElement).toBe(list.querySelector('button'));
		expect(list.children).toHaveLength(1);
	});

	it('is required and invalid while the list is empty when required', async () => {
		const { list, input } = setup('Add at least one tag.');
		expect(input.getAttribute('aria-required')).toBe('true');
		expect(input.validity.customError).toBe(false);
		list.querySelector('li')!.remove();
		await settle();
		expect(input.validationMessage).toBe('Add at least one tag.');
		// Not announced as invalid before the user has done anything.
		expect(input.getAttribute('aria-invalid')).toBe('false');
	});

	it('returns focus to the input when the last tag is removed', async () => {
		const { list, input } = setup();
		list.querySelector('button')!.focus();
		list.querySelector('li')!.remove();
		await settle();
		expect(document.activeElement).toBe(input);
	});
});
