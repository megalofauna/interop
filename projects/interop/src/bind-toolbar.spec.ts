import { bindToolbar } from './bind-toolbar';

const markup = ({ tokens = '', dir = '', inner = '' } = {}) => `
	<button type="button" id="before">Before</button>
	<div interop-toolbar role="toolbar" focusgroup="toolbar ${tokens}" aria-label="Formatting" ${dir ? `dir="${dir}"` : ''}>
		<div role="group" aria-label="Text">
			<button type="button" id="a">A</button>
			<button type="button" id="b">B</button>
		</div>
		<button type="button" id="c" disabled>C</button>
		<button type="button" id="d" aria-disabled="true">D</button>
		${inner}
	</div>
	<button type="button" id="after">After</button>`;

describe('bindToolbar', () => {
	let unbind: (() => void) | undefined;
	const setup = (options: Parameters<typeof markup>[0] = {}) => {
		document.body.innerHTML = markup(options);
		const root = document.querySelector<HTMLElement>('[interop-toolbar]')!;
		unbind = bindToolbar(root);
		const el = (id: string) => document.getElementById(id)!;
		const press = (key: string, init: KeyboardEventInit = {}) => {
			const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
			(document.activeElement as HTMLElement).dispatchEvent(event);
			return event;
		};
		const focused = () => document.activeElement?.id;
		const stops = () =>
			Array.from(root.querySelectorAll<HTMLElement>('button, input, textarea, [tabindex]'))
				.filter((item) => item.tabIndex === 0 && !(item as HTMLButtonElement).disabled)
				.map((item) => item.id);
		return { root, el, press, focused, stops };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
	});

	it('gives the first item the only tab stop', () => {
		const { stops } = setup();
		expect(stops()).toEqual(['a']);
	});

	it('moves with the arrow keys, skips disabled items, keeps aria-disabled ones, and stops at the ends', () => {
		const { el, press, focused } = setup();
		el('a').focus();
		press('ArrowRight');
		expect(focused()).toBe('b');
		press('ArrowRight');
		expect(focused()).toBe('d');
		press('ArrowRight');
		expect(focused()).toBe('d');
		press('ArrowLeft');
		press('ArrowLeft');
		press('ArrowLeft');
		expect(focused()).toBe('a');
	});

	it('wraps with the wrap token', () => {
		const { el, press, focused } = setup({ tokens: 'wrap' });
		el('a').focus();
		press('ArrowLeft');
		expect(focused()).toBe('d');
		press('ArrowRight');
		expect(focused()).toBe('a');
	});

	it('goes to the first and last item with Home and End', () => {
		const { el, press, focused } = setup();
		el('b').focus();
		press('End');
		expect(focused()).toBe('d');
		press('Home');
		expect(focused()).toBe('a');
	});

	it('flips Left and Right in right-to-left text', () => {
		const { el, press, focused } = setup({ dir: 'rtl' });
		el('a').focus();
		press('ArrowLeft');
		expect(focused()).toBe('b');
	});

	it('uses Up and Down with the block token, and ignores Left and Right', () => {
		const { el, press, focused } = setup({ tokens: 'block' });
		el('a').focus();
		press('ArrowRight');
		expect(focused()).toBe('a');
		press('ArrowDown');
		expect(focused()).toBe('b');
	});

	it('moves the tab stop with focus, so Tab returns to the last item focused', () => {
		const { el, press, stops } = setup();
		el('a').focus();
		press('ArrowRight');
		el('after').focus();
		expect(stops()).toEqual(['b']);
	});

	it('returns the tab stop to the first item on leaving, with nomemory', () => {
		const { el, press, stops } = setup({ tokens: 'nomemory' });
		el('a').focus();
		press('ArrowRight');
		el('after').focus();
		expect(stops()).toEqual(['a']);
	});

	it('leaves the arrow keys to a text field, and to a radio button', () => {
		const { el, press, focused } = setup({
			inner: '<input id="field" aria-label="Find"><input type="radio" id="radio" name="r" aria-label="R">',
		});
		el('field').focus();
		expect(press('ArrowLeft').defaultPrevented).toBe(false);
		expect(focused()).toBe('field');
		el('radio').focus();
		expect(press('ArrowLeft').defaultPrevented).toBe(false);
	});

	it('leaves keys held with a modifier alone', () => {
		const { el, press, focused } = setup();
		el('a').focus();
		expect(press('ArrowRight', { shiftKey: true }).defaultPrevented).toBe(false);
		expect(focused()).toBe('a');
	});

	it('leaves out items in a nested focusgroup or a popover', () => {
		const { el, press, focused } = setup({
			inner:
				'<div focusgroup="none"><button type="button" id="nested">N</button></div><div popover><button type="button" id="pop">P</button></div><button type="button" id="e">E</button>',
		});
		el('d').focus();
		press('ArrowRight');
		expect(focused()).toBe('e');
	});

	it('takes an item added later out of the tab order', async () => {
		const { root, stops } = setup();
		const added = document.createElement('button');
		added.id = 'added';
		root.append(added);
		await Promise.resolve();
		expect(stops()).toEqual(['a']);
	});

	it('keeps an element made focusable by tabindex as an item', () => {
		const { el, press, focused } = setup({ inner: '<span role="button" tabindex="0" id="span">S</span>' });
		el('d').focus();
		press('ArrowRight');
		expect(focused()).toBe('span');
		el('after').focus();
		el('a').focus();
		press('End');
		expect(focused()).toBe('span');
	});

	it('restores each tabindex when unbound', () => {
		const { el } = setup({ inner: '<span role="button" tabindex="0" id="span">S</span>' });
		unbind?.();
		unbind = undefined;
		expect(el('b').hasAttribute('tabindex')).toBe(false);
		expect(el('span').getAttribute('tabindex')).toBe('0');
	});
});
