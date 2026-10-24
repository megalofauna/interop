import { bindFilter } from './bind-filter';

describe('bindFilter', () => {
	let unbind: (() => void) | undefined;
	const setup = () => {
		document.body.innerHTML = `
			<dialog>
				<input type="search" aria-label="Search pages">
				<ul>
					<li><a href="#badge">Badge</a></li>
					<li><a href="#button">Button</a></li>
					<li><a href="#checkbox">Checkbox</a></li>
					<li><a href="#resume">Résumé</a></li>
				</ul>
				<p hidden>No pages match</p>
				<p role="status"></p>
			</dialog>`;
		const dialog = document.querySelector('dialog')!;
		const input = document.querySelector('input')!;
		const list = document.querySelector('ul')!;
		const empty = document.querySelector<HTMLElement>('p[hidden]')!;
		const status = document.querySelector<HTMLElement>('[role="status"]')!;
		unbind = bindFilter(input, list, { empty, status });
		const type = (value: string) => {
			input.value = value;
			input.dispatchEvent(new Event('input', { bubbles: true }));
		};
		const shown = () =>
			Array.from(list.children)
				.filter((item) => !(item as HTMLElement).hidden)
				.map((item) => item.textContent);
		const press = (target: Element, key: string) => {
			const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
			target.dispatchEvent(event);
			return event;
		};
		return { dialog, input, list, empty, status, type, shown, press };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
		vi.useRealTimers();
	});

	it('hides the items that do not match, ignoring case and accents', () => {
		const { type, shown } = setup();
		type('B');
		expect(shown()).toEqual(['Badge', 'Button', 'Checkbox']);
		type('resu');
		expect(shown()).toEqual(['Résumé']);
		type('  ');
		expect(shown()).toHaveLength(4);
	});

	it('shows the empty message when nothing matches', () => {
		const { empty, type } = setup();
		type('zzz');
		expect(empty.hidden).toBe(false);
		type('bad');
		expect(empty.hidden).toBe(true);
	});

	it('takes a match function', () => {
		document.body.innerHTML = `<input><ul><li data-keys="press">Button</li><li>Badge</li></ul>`;
		const list = document.querySelector('ul')!;
		const input = document.querySelector('input')!;
		unbind = bindFilter(input, list, { match: (item, query) => (item.dataset['keys'] ?? '').includes(query) });
		input.value = 'press';
		input.dispatchEvent(new Event('input'));
		expect((list.children[0] as HTMLElement).hidden).toBe(false);
		expect((list.children[1] as HTMLElement).hidden).toBe(true);
	});

	it('announces the count once typing pauses, only when it changes', () => {
		vi.useFakeTimers();
		const { status, type } = setup();
		type('b');
		type('bu');
		vi.advanceTimersByTime(500);
		vi.advanceTimersByTime(50);
		expect(status.textContent).toBe('1 result');
		status.textContent = '';
		type('but');
		vi.advanceTimersByTime(550);
		expect(status.textContent).toBe('');
		type('butz');
		vi.advanceTimersByTime(550);
		expect(status.textContent).toBe('No pages match');
	});

	it('says nothing for an empty query, and counts the next query afresh', () => {
		vi.useFakeTimers();
		const { status, type } = setup();
		type('bu');
		vi.advanceTimersByTime(550);
		type('');
		vi.advanceTimersByTime(550);
		expect(status.textContent).toBe('1 result');
		status.textContent = '';
		type('bu');
		vi.advanceTimersByTime(550);
		expect(status.textContent).toBe('1 result');
	});

	it('moves focus with Arrow Down and Up between the items shown, and back to the field', () => {
		const { input, list, type, press } = setup();
		type('b');
		const links = list.querySelectorAll('a');
		expect(press(input, 'ArrowDown').defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(links[0]);
		press(links[0], 'ArrowDown');
		press(document.activeElement!, 'ArrowDown');
		expect(document.activeElement).toBe(links[2]);
		press(links[2], 'ArrowDown');
		expect(document.activeElement).toBe(links[2]);
		press(links[2], 'ArrowUp');
		press(document.activeElement!, 'ArrowUp');
		press(document.activeElement!, 'ArrowUp');
		expect(document.activeElement).toBe(input);
	});

	it('skips hidden items', () => {
		const { input, list, type, press } = setup();
		type('e');
		const links = list.querySelectorAll('a');
		press(input, 'ArrowDown');
		expect(document.activeElement).toBe(links[0]);
		press(links[0], 'ArrowDown');
		expect(document.activeElement).toBe(links[2]);
	});

	it('leaves Arrow Down in the field alone when nothing is shown', () => {
		const { input, type, press } = setup();
		type('zzz');
		expect(press(input, 'ArrowDown').defaultPrevented).toBe(false);
	});

	it('clears the field when its dialog closes', () => {
		const { dialog, input, type, shown } = setup();
		type('bu');
		dialog.dispatchEvent(new Event('close'));
		expect(input.value).toBe('');
		expect(shown()).toHaveLength(4);
	});

	it('shows every item when unbound', () => {
		const { type, shown } = setup();
		type('bu');
		unbind!();
		unbind = undefined;
		expect(shown()).toHaveLength(4);
	});
});
