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

	it('announces a removal only when given a status element', async () => {
		const status = () => document.getElementById('status')!;
		let view = setup();
		view.remove('Rugby');
		await settle();
		expect(status().textContent).toBe('');
		unbind!();
		view = setup(() => ({ status: document.getElementById('status'), removed: (text) => `Removed ${text}` }));
		view.remove('Cricket');
		await settle();
		expect(status().textContent).toBe('Removed Cricket');
	});
});

describe('bindTagInput', () => {
	let unbind: (() => void) | undefined;
	const setup = (required?: string) => {
		document.body.innerHTML = `
			<form>
				<label for="entry">Tags</label>
				<ul interop-tags role="list" aria-label="Tags">${tag('Football')}</ul>
				<input id="entry" type="text">
			</form>`;
		const list = document.querySelector<HTMLElement>('ul')!;
		const input = document.querySelector<HTMLInputElement>('#entry')!;
		unbind = bindTagInput(input, { list, required });
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

	it('is invalid while the list is empty when required', async () => {
		const { list, input } = setup('Add at least one tag.');
		expect(input.validity.customError).toBe(false);
		list.querySelector('li')!.remove();
		await settle();
		expect(input.validationMessage).toBe('Add at least one tag.');
	});

	it('returns focus to the input when the last tag is removed', async () => {
		const { list, input } = setup();
		list.querySelector('button')!.focus();
		list.querySelector('li')!.remove();
		await settle();
		expect(document.activeElement).toBe(input);
	});
});
