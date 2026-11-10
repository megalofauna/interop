import { bindTooltips } from './bind-tooltips';

/** jsdom has no popover API and no :focus-visible. These stand in for them, and are restored after each test. */
const open = new Map<Element, Element | undefined>();
let focusVisible = true;
const original = {
	matches: Element.prototype.matches,
	showPopover: HTMLElement.prototype.showPopover,
	hidePopover: HTMLElement.prototype.hidePopover,
};

const pointer = (
	element: Element | null,
	type: 'pointerover' | 'pointerout' | 'pointerdown',
	init: { relatedTarget?: Element | null; pointerType?: string } = {},
) =>
	element!.dispatchEvent(
		Object.assign(new MouseEvent(type, { bubbles: true, relatedTarget: init.relatedTarget ?? null }), {
			pointerType: init.pointerType ?? 'mouse',
		}),
	);
const focus = (element: Element | null, type: 'focusin' | 'focusout', relatedTarget: Element | null = null) =>
	element!.dispatchEvent(new FocusEvent(type, { bubbles: true, relatedTarget }));
const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const DELAYS = 'style="--itx-tooltip-interest-delay-start: 500ms; --itx-tooltip-interest-delay-end: 0.25s"';

describe('bindTooltips', () => {
	let unbind: () => void;

	beforeEach(() => {
		vi.useFakeTimers();
		open.clear();
		focusVisible = true;
		Element.prototype.matches = function (this: Element, selector: string) {
			if (selector === ':popover-open') return open.has(this);
			if (selector === ':focus-visible') return focusVisible;
			return original.matches.call(this, selector);
		};
		HTMLElement.prototype.showPopover = function (this: HTMLElement, options?: { source?: HTMLElement }) {
			open.set(this, options?.source);
		} as HTMLElement['showPopover'];
		HTMLElement.prototype.hidePopover = function (this: HTMLElement) {
			open.delete(this);
			this.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'closed' }));
		};
		document.body.innerHTML = `
			<button type="button" aria-describedby="hint tip-save">Save</button>
			<span id="hint">Ctrl+S</span>
			<span interop-tooltip id="tip-save" popover="hint" role="tooltip" ${DELAYS}>Saves without publishing</span>
		`;
		unbind = bindTooltips();
	});

	afterEach(() => {
		unbind();
		vi.useRealTimers();
		Object.assign(Element.prototype, { matches: original.matches });
		Object.assign(HTMLElement.prototype, { showPopover: original.showPopover, hidePopover: original.hidePopover });
	});

	const tooltip = () => $('#tip-save');

	it('opens on hover after the start delay, past an ID that names something else', () => {
		pointer($('button'), 'pointerover');
		vi.advanceTimersByTime(499);
		expect(open.has(tooltip())).toBe(false);
		vi.advanceTimersByTime(1);
		expect(open.get(tooltip())).toBe($('button'));
	});

	it('closes after the end delay once the pointer leaves the trigger and the tooltip', () => {
		pointer($('button'), 'pointerover');
		vi.advanceTimersByTime(500);
		pointer($('button'), 'pointerout', { relatedTarget: tooltip() });
		pointer(tooltip(), 'pointerover', { relatedTarget: $('button') });
		vi.advanceTimersByTime(1000);
		expect(open.has(tooltip())).toBe(true);
		pointer(tooltip(), 'pointerout', { relatedTarget: document.body });
		vi.advanceTimersByTime(249);
		expect(open.has(tooltip())).toBe(true);
		vi.advanceTimersByTime(1);
		expect(open.has(tooltip())).toBe(false);
	});

	it('stays open while the pointer moves between the trigger’s own children', () => {
		document.body.insertAdjacentHTML(
			'beforeend',
			`<button type="button" id="b" aria-describedby="tip-save"><svg></svg><span>Save</span></button>`,
		);
		pointer($('#b svg'), 'pointerover');
		vi.advanceTimersByTime(500);
		pointer($('#b svg'), 'pointerout', { relatedTarget: $('#b span') });
		pointer($('#b span'), 'pointerover', { relatedTarget: $('#b svg') });
		vi.advanceTimersByTime(1000);
		expect(open.get(tooltip())).toBe($('#b'));
	});

	it('ignores touch', () => {
		pointer($('button'), 'pointerover', { pointerType: 'touch' });
		vi.advanceTimersByTime(1000);
		expect(open.has(tooltip())).toBe(false);
	});

	it('opens at once on keyboard focus, not on focus from a click, and closes on blur', () => {
		focusVisible = false;
		focus($('button'), 'focusin');
		expect(open.has(tooltip())).toBe(false);
		focusVisible = true;
		focus($('button'), 'focusin');
		expect(open.has(tooltip())).toBe(true);
		focus($('button'), 'focusout', document.body);
		expect(open.has(tooltip())).toBe(false);
	});

	it('closes when the trigger is pressed, until the pointer leaves', () => {
		pointer($('button'), 'pointerover');
		vi.advanceTimersByTime(500);
		pointer($('button'), 'pointerdown');
		expect(open.has(tooltip())).toBe(false);
		pointer($('button'), 'pointerover');
		vi.advanceTimersByTime(1000);
		expect(open.has(tooltip())).toBe(false);
		pointer($('button'), 'pointerout', { relatedTarget: document.body });
		pointer($('button'), 'pointerover');
		vi.advanceTimersByTime(500);
		expect(open.has(tooltip())).toBe(true);
	});

	it('closes on Escape where the browser does not close a hint popover itself', () => {
		focus($('button'), 'focusin');
		const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
		document.dispatchEvent(escape);
		expect(open.has(tooltip())).toBe(false);
		expect(escape.defaultPrevented).toBe(true);
	});

	it('names a label tooltip with aria-labelledby, and opens for a label’s control', () => {
		document.body.innerHTML = `
			<label><input type="radio" name="view" aria-labelledby="tip-grid" /><svg></svg></label>
			<span interop-tooltip="label" id="tip-grid" popover="hint" role="tooltip" ${DELAYS}>Grid</span>
		`;
		pointer($('label svg'), 'pointerover');
		vi.advanceTimersByTime(500);
		expect(open.get($('#tip-grid'))).toBe($('input'));
	});

	it('shows the describing tooltip of a trigger that has both kinds', () => {
		document.body.innerHTML = `
			<button type="button" aria-labelledby="name" aria-describedby="more"><svg></svg></button>
			<span interop-tooltip="label" id="name" popover="hint">Save</span>
			<span interop-tooltip id="more" popover="hint">Saves without publishing</span>
		`;
		focus($('button'), 'focusin');
		expect(open.has($('#more'))).toBe(true);
		expect(open.has($('#name'))).toBe(false);
	});

	it('keeps one tooltip on screen, anchored to the trigger in use', () => {
		document.body.insertAdjacentHTML(
			'beforeend',
			`<button type="button" id="other" aria-describedby="tip-save">Save all</button>
			<button type="button" id="third" aria-describedby="tip-third">Discard</button>
			<span interop-tooltip id="tip-third" popover="hint">Discards the draft</span>`,
		);
		focus($('#other'), 'focusin');
		expect(open.get(tooltip())).toBe($('#other'));
		focus($('#third'), 'focusin', $('#other'));
		expect(open.has(tooltip())).toBe(false);
		expect(open.has($('#tip-third'))).toBe(true);
	});

	it('works for triggers added or replaced after it is bound', () => {
		document.body.innerHTML = `
			<button type="button" aria-describedby="tip-new">New</button>
			<span interop-tooltip id="tip-new" popover="hint">Starts a draft</span>
		`;
		focus($('button'), 'focusin');
		expect(open.has($('#tip-new'))).toBe(true);
	});

	it('does not open for a trigger that was removed', () => {
		pointer($('button'), 'pointerover');
		$('button').remove();
		vi.advanceTimersByTime(1000);
		expect(open.has(tooltip())).toBe(false);
	});

	it('writes no attributes', () => {
		const before = document.body.innerHTML;
		focus($('button'), 'focusin');
		focus($('button'), 'focusout', document.body);
		expect(document.body.innerHTML).toBe(before);
	});

	it('listens once however often it is called, until the last remover', () => {
		const second = bindTooltips();
		second();
		focus($('button'), 'focusin');
		expect(open.has(tooltip())).toBe(true);
		focus($('button'), 'focusout', document.body);
		unbind();
		unbind = () => {};
		focus($('button'), 'focusin');
		expect(open.has(tooltip())).toBe(false);
	});

	it('closes an open tooltip when the last remover runs', () => {
		focus($('button'), 'focusin');
		unbind();
		unbind = () => {};
		expect(open.has(tooltip())).toBe(false);
	});

	it('leaves a trigger with interestfor to a browser that supports it', () => {
		$('button').setAttribute('interestfor', 'tip-save');
		focus($('button'), 'focusin');
		expect(open.has(tooltip())).toBe(true);
		focus($('button'), 'focusout', document.body);
		Object.defineProperty(HTMLButtonElement.prototype, 'interestForElement', { configurable: true, get: () => null });
		try {
			focus($('button'), 'focusin');
			expect(open.has(tooltip())).toBe(false);
		} finally {
			Reflect.deleteProperty(HTMLButtonElement.prototype, 'interestForElement');
		}
	});
});
