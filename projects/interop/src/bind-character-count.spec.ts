import { bindCharacterCount } from './bind-character-count';

describe('bindCharacterCount', () => {
	let unbind: (() => void) | undefined;
	const setup = (threshold = 0) => {
		document.body.innerHTML = `
			<form>
				<label for="message">Message</label>
				<textarea id="message"></textarea>
				<p interop-count></p>
				<p role="status"></p>
			</form>`;
		const control = document.getElementById('message') as HTMLTextAreaElement;
		const count = document.querySelector<HTMLElement>('[interop-count]')!;
		const status = document.querySelector<HTMLElement>('[role="status"]')!;
		unbind = bindCharacterCount(control, { limit: 10, count, status, threshold });
		const type = (value: string) => {
			control.value = value;
			control.dispatchEvent(new Event('input', { bubbles: true }));
		};
		return { control, count, status, type };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
		vi.useRealTimers();
	});

	it('shows how many are left, hidden from screen readers', () => {
		const { count, type } = setup();
		expect(count.textContent).toBe('You have 10 characters remaining');
		expect(count.getAttribute('aria-hidden')).toBe('true');
		type('123456789');
		expect(count.textContent).toBe('You have 1 character remaining');
	});

	it('lets the user type past the limit, and makes the field invalid there', () => {
		const { control, count, type } = setup();
		const changes = vi.fn();
		control.addEventListener('interop-validity-change', changes);
		type('12345678901');
		expect(count.textContent).toBe('You have 1 character too many');
		expect(count.hasAttribute('data-over')).toBe(true);
		expect(control.validationMessage).toBe('Message must be 10 characters or fewer');
		type('1234567890');
		expect(control.validity.valid).toBe(true);
		expect(changes).toHaveBeenCalledTimes(2);
	});

	it('counts an emoji as one character', () => {
		const { count, type } = setup();
		type('👍🏽é');
		expect(count.textContent).toBe('You have 8 characters remaining');
	});

	it('announces the count once typing pauses, in the status element without ariaNotify()', () => {
		vi.useFakeTimers();
		const { status, type } = setup();
		type('a');
		type('ab');
		expect(status.textContent).toBe('');
		vi.advanceTimersByTime(1050);
		expect(status.textContent).toBe('You have 8 characters remaining');
	});

	it('announces from the field with ariaNotify() when the browser has it', () => {
		vi.useFakeTimers();
		const notify = vi.fn();
		(Element.prototype as { ariaNotify?: unknown }).ariaNotify = notify;
		const { control, status, type } = setup();
		type('ab');
		vi.advanceTimersByTime(1050);
		expect(notify.mock.calls).toEqual([['You have 8 characters remaining', { priority: 'normal' }]]);
		expect(notify.mock.contexts[0]).toBe(control);
		expect(status.textContent).toBe('');
		delete (Element.prototype as { ariaNotify?: unknown }).ariaNotify;
	});

	it('says nothing while the count is below the threshold', () => {
		vi.useFakeTimers();
		const { status, type } = setup(0.5);
		type('12');
		vi.advanceTimersByTime(1050);
		expect(status.textContent).toBe('');
		type('123456');
		vi.advanceTimersByTime(1050);
		expect(status.textContent).toBe('You have 4 characters remaining');
	});

	it('shows the count only from the threshold', () => {
		const { count, type } = setup(0.5);
		expect(count.hidden).toBe(true);
		type('12345');
		expect(count.hidden).toBe(false);
	});
});
