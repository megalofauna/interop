import { bindTooltip } from './bind-tooltip';

/** jsdom has no popover API. These stand in for it and keep the state the browser would. */
const open = new Set<Element>();
const toggle = (element: Element, newState: string) =>
	element.dispatchEvent(Object.assign(new Event('toggle'), { newState }));

const pointer = (element: Element, type: string, init: { pointerType?: string; relatedTarget?: Element } = {}) =>
	element.dispatchEvent(
		Object.assign(new MouseEvent(type, { relatedTarget: init.relatedTarget ?? null }), {
			pointerType: init.pointerType ?? 'mouse',
		}),
	);

describe('bindTooltip', () => {
	let trigger: HTMLButtonElement;
	let tooltip: HTMLElement;
	let unbind: () => void;
	let focusVisible: boolean;

	beforeEach(() => {
		vi.useFakeTimers();
		open.clear();
		focusVisible = true;
		HTMLElement.prototype.showPopover = function (this: HTMLElement) {
			open.add(this);
			toggle(this, 'open');
		};
		HTMLElement.prototype.hidePopover = function (this: HTMLElement) {
			open.delete(this);
			toggle(this, 'closed');
		};
		document.body.innerHTML = `
			<button type="button">Save</button>
			<span interop-tooltip style="--itx-tooltip-interest-delay-start: 500ms; --itx-tooltip-interest-delay-end: 0.25s">Saves a draft</span>
		`;
		trigger = document.querySelector('button')!;
		tooltip = document.querySelector('[interop-tooltip]')!;
		const matches = trigger.matches.bind(trigger);
		trigger.matches = (selector: string) => (selector === ':focus-visible' ? focusVisible : matches(selector));
		unbind = bindTooltip(trigger, tooltip);
	});

	afterEach(() => {
		unbind();
		vi.useRealTimers();
	});

	it('makes the tooltip a hint popover that describes the trigger', () => {
		expect(tooltip.getAttribute('popover')).toBe('hint');
		expect(tooltip.getAttribute('role')).toBe('tooltip');
		expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
	});

	it('names the trigger when it is a label, and keeps references already there', () => {
		unbind();
		tooltip.setAttribute('interop-tooltip', 'label');
		trigger.setAttribute('aria-labelledby', 'other');
		unbind = bindTooltip(trigger, tooltip);
		expect(trigger.getAttribute('aria-labelledby')).toBe(`other ${tooltip.id}`);
		expect(trigger.hasAttribute('aria-describedby')).toBe(false);
		unbind();
		expect(trigger.getAttribute('aria-labelledby')).toBe('other');
	});

	it('opens after the start delay and closes after the end delay', () => {
		pointer(trigger, 'pointerenter');
		vi.advanceTimersByTime(499);
		expect(open.has(tooltip)).toBe(false);
		vi.advanceTimersByTime(1);
		expect(open.has(tooltip)).toBe(true);
		pointer(trigger, 'pointerleave');
		vi.advanceTimersByTime(249);
		expect(open.has(tooltip)).toBe(true);
		vi.advanceTimersByTime(1);
		expect(open.has(tooltip)).toBe(false);
	});

	it('stays open while the pointer moves onto the tooltip', () => {
		pointer(trigger, 'pointerenter');
		vi.advanceTimersByTime(500);
		pointer(trigger, 'pointerleave', { relatedTarget: tooltip });
		pointer(tooltip, 'pointerenter');
		vi.advanceTimersByTime(1000);
		expect(open.has(tooltip)).toBe(true);
	});

	it('ignores touch', () => {
		pointer(trigger, 'pointerenter', { pointerType: 'touch' });
		vi.advanceTimersByTime(1000);
		expect(open.has(tooltip)).toBe(false);
	});

	it('opens at once on keyboard focus, and not on focus from a click', () => {
		trigger.dispatchEvent(new FocusEvent('focusin'));
		expect(open.has(tooltip)).toBe(true);
		trigger.dispatchEvent(new FocusEvent('focusout'));
		expect(open.has(tooltip)).toBe(false);
		focusVisible = false;
		trigger.dispatchEvent(new FocusEvent('focusin'));
		expect(open.has(tooltip)).toBe(false);
	});

	it('closes on Escape where the browser does not, one layer per press, and lets the key through', () => {
		trigger.dispatchEvent(new FocusEvent('focusin'));
		const outer = vi.fn();
		document.body.addEventListener('keydown', outer);
		const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		trigger.dispatchEvent(escape);
		expect(open.has(tooltip)).toBe(false);
		expect(escape.defaultPrevented).toBe(true);
		expect(outer).toHaveBeenCalledTimes(1);
		const next = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		trigger.dispatchEvent(next);
		expect(next.defaultPrevented).toBe(false);
	});

	it('leaves Escape to the browser where hint is supported, and follows the browser closing it', () => {
		unbind();
		Object.defineProperty(tooltip, 'popover', { value: 'hint', configurable: true });
		unbind = bindTooltip(trigger, tooltip);
		trigger.dispatchEvent(new FocusEvent('focusin'));
		const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		trigger.dispatchEvent(escape);
		expect(escape.defaultPrevented).toBe(false);
		expect(open.has(tooltip)).toBe(true);
		// The browser closes it.
		open.delete(tooltip);
		toggle(tooltip, 'closed');
		trigger.dispatchEvent(new FocusEvent('focusout'));
		trigger.dispatchEvent(new FocusEvent('focusin'));
		expect(open.has(tooltip)).toBe(true);
	});

	it('closes when the trigger is pressed, and waits for the pointer to leave before opening again', () => {
		pointer(trigger, 'pointerenter');
		vi.advanceTimersByTime(500);
		pointer(trigger, 'pointerdown');
		expect(open.has(tooltip)).toBe(false);
		vi.advanceTimersByTime(1000);
		expect(open.has(tooltip)).toBe(false);
		pointer(trigger, 'pointerleave');
		pointer(trigger, 'pointerenter');
		vi.advanceTimersByTime(500);
		expect(open.has(tooltip)).toBe(true);
	});

	it('closes another tooltip when it opens', () => {
		document.body.insertAdjacentHTML('beforeend', '<button type="button">Other</button><span interop-tooltip>Other tip</span>');
		const [otherTrigger, otherTooltip] = [document.body.lastElementChild!.previousElementSibling as HTMLElement, document.body.lastElementChild as HTMLElement];
		const unbindOther = bindTooltip(otherTrigger, otherTooltip);
		trigger.dispatchEvent(new FocusEvent('focusin'));
		pointer(otherTrigger, 'pointerenter');
		vi.advanceTimersByTime(0);
		expect(open.has(otherTooltip)).toBe(true);
		expect(open.has(tooltip)).toBe(false);
		unbindOther();
	});

	it('removes the reference and the behavior', () => {
		unbind();
		expect(trigger.hasAttribute('aria-describedby')).toBe(false);
		trigger.dispatchEvent(new FocusEvent('focusin'));
		expect(open.has(tooltip)).toBe(false);
		unbind = () => {};
	});
});
