import { registerIcons } from './icon-registry';
import { bindToasts, toast } from './toast';

/** MutationObserver callbacks run as microtasks. */
const settle = () => Promise.resolve();
const command = (source: Element, name = '--dismiss') =>
	document.getElementById(source.getAttribute('commandfor')!)!.dispatchEvent(Object.assign(new Event('command'), { command: name, source }));

describe('toast', () => {
	let region: HTMLElement;
	let unbind: () => void;
	let open: boolean;
	let spoken: { message: string; priority?: string }[];

	beforeEach(() => {
		document.body.innerHTML = `
			<button type="button" id="trigger">Save</button>
			<section interop-toasts popover="manual" aria-label="Notifications"></section>`;
		region = document.querySelector('[interop-toasts]')!;
		// jsdom has no popover API or ariaNotify(). These stand in for them.
		open = false;
		region.togglePopover = (force?: boolean) => (open = force ?? !open);
		spoken = [];
		(Element.prototype as unknown as { ariaNotify: unknown }).ariaNotify = (message: string, options: { priority?: string }) =>
			spoken.push({ message, priority: options.priority });
		unbind = bindToasts(region);
	});

	afterEach(() => {
		unbind();
		vi.useRealTimers();
		delete (Element.prototype as unknown as { ariaNotify?: unknown }).ariaNotify;
	});

	it('shows the message in the region and announces it', () => {
		const item = toast('Message sent', { description: 'To Ada' });
		expect(item.parentElement).toBe(region);
		expect(open).toBe(true);
		expect(Array.from(item.querySelectorAll('p'), (p) => p.textContent)).toEqual(['Message sent', 'To Ada']);
		expect(spoken).toEqual([{ message: 'Message sent. To Ada', priority: 'normal' }]);
		expect(item.hasAttribute('role')).toBe(false);
	});

	it('announces danger at high priority, with its color and icon', () => {
		registerIcons({ name: 'tabler-alert-circle', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', paths: [{ d: 'M0 0' }] });
		const item = toast('Upload failed', { color: 'danger' });
		expect(item.getAttribute('itx-color')).toBe('danger');
		expect(item.querySelector(':scope > svg[interop-icon]')?.getAttribute('aria-hidden')).toBe('true');
		expect(spoken[0].priority).toBe('high');
	});

	it('gives every toast a named dismiss button that targets the region', () => {
		const close = toast('Saved').querySelector('button')!;
		expect(close.getAttribute('aria-label')).toBe('Dismiss');
		expect(close.getAttribute('command')).toBe('--dismiss');
		expect(close.getAttribute('commandfor')).toBe(region.id);
		expect(region.id).not.toBe('');
	});

	it('throws when the page has no region', () => {
		region.remove();
		expect(() => toast('Saved')).toThrow(/no \[interop-toasts\] region/);
	});

	it('removes a toast by its dismiss command, and hides the region when the last one goes', async () => {
		const item = toast('Saved');
		command(item.querySelector('button')!);
		expect(item.isConnected).toBe(false);
		await settle();
		expect(open).toBe(false);
	});

	it('runs the action, then dismisses the toast', () => {
		const run = vi.fn();
		const item = toast('Crate jettisoned', { action: { label: 'Undo', run } });
		const undo = item.querySelector('button')!;
		expect(undo.textContent).toBe('Undo');
		undo.click();
		command(undo);
		expect(run).toHaveBeenCalledOnce();
		expect(item.isConnected).toBe(false);
	});

	it('dismisses the toast that holds focus on Escape, and nothing outside', () => {
		const item = toast('Saved');
		const escape = () => new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		const outside = escape();
		document.getElementById('trigger')!.dispatchEvent(outside);
		expect(item.isConnected).toBe(true);
		const inside = escape();
		item.querySelector('button')!.dispatchEvent(inside);
		expect(item.isConnected).toBe(false);
		expect(inside.defaultPrevented).toBe(true);
	});

	it('stays until dismissed without a timeout', async () => {
		vi.useFakeTimers();
		const item = toast('Saved');
		await settle();
		vi.advanceTimersByTime(60_000);
		expect(item.isConnected).toBe(true);
	});

	it('leaves after its timeout, never sooner than 5 seconds', async () => {
		vi.useFakeTimers();
		const item = toast('Saved', { timeout: 1000 });
		expect(item.dataset['timeout']).toBe('5000');
		await settle();
		vi.advanceTimersByTime(4999);
		expect(item.isConnected).toBe(true);
		vi.advanceTimersByTime(1);
		expect(item.isConnected).toBe(false);
	});

	it('ignores the timeout of a danger toast and of a toast with an action', async () => {
		vi.useFakeTimers();
		const danger = toast('Upload failed', { color: 'danger', timeout: 5000 });
		const undo = toast('Deleted', { timeout: 5000, action: { label: 'Undo', run: () => {} } });
		await settle();
		vi.advanceTimersByTime(60_000);
		expect(danger.isConnected).toBe(true);
		expect(undo.isConnected).toBe(true);
	});

	it('stops the time while focus is in the region, and resumes with what was left', async () => {
		vi.useFakeTimers();
		const item = toast('Saved', { timeout: 5000 });
		await settle();
		vi.advanceTimersByTime(3000);
		item.querySelector('button')!.focus();
		vi.advanceTimersByTime(10_000);
		expect(item.isConnected).toBe(true);
		document.getElementById('trigger')!.focus();
		vi.advanceTimersByTime(1999);
		expect(item.isConnected).toBe(true);
		vi.advanceTimersByTime(2);
		expect(item.isConnected).toBe(false);
	});

	it('moves focus to the toast in the dismissed one’s place, then back to where it came from', async () => {
		const trigger = document.getElementById('trigger')!;
		const first = toast('One');
		const second = toast('Two');
		trigger.focus();
		first.querySelector('button')!.focus();
		first.remove();
		await settle();
		expect(document.activeElement).toBe(second.querySelector('button'));
		second.remove();
		await settle();
		expect(document.activeElement).toBe(trigger);
	});

	it('leaves focus alone when a toast that did not hold it goes', async () => {
		const trigger = document.getElementById('trigger')!;
		const item = toast('Saved');
		trigger.focus();
		item.remove();
		await settle();
		expect(document.activeElement).toBe(trigger);
	});
});
