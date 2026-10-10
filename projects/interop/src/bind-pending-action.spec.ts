import { bindPendingAction } from './bind-pending-action';

describe('bindPendingAction', () => {
	let button: HTMLButtonElement;
	let settle: (fail?: boolean) => void;
	let calls: number;

	beforeEach(() => {
		calls = 0;
		button = document.createElement('button');
		document.body.append(button);
		bindPendingAction(button, () => {
			calls++;
			return new Promise((resolve, reject) => {
				settle = (fail) => (fail ? reject(new Error('failed')) : resolve(undefined));
			});
		});
	});
	afterEach(() => button.remove());

	const flush = () => new Promise((resolve) => setTimeout(resolve));

	it('marks the button busy and unavailable while the action is pending', () => {
		button.click();
		expect(button.getAttribute('aria-busy')).toBe('true');
		expect(button.getAttribute('aria-disabled')).toBe('true');
	});

	it('ignores clicks while pending', () => {
		button.click();
		button.click();
		button.click();
		expect(calls).toBe(1);
	});

	it('clears the busy state when the action resolves', async () => {
		button.click();
		settle();
		await flush();
		expect(button.hasAttribute('aria-busy')).toBe(false);
		expect(button.hasAttribute('aria-disabled')).toBe(false);
		button.click();
		expect(calls).toBe(2);
	});

	it('clears the busy state and reports the error when the action rejects', async () => {
		// jsdom has no reportError; browsers do.
		const reported: unknown[] = [];
		const original = globalThis.reportError;
		globalThis.reportError = (error: unknown) => reported.push(error);
		button.click();
		settle(true);
		await flush();
		globalThis.reportError = original;
		expect(button.hasAttribute('aria-busy')).toBe(false);
		expect((reported[0] as Error).message).toBe('failed');
	});

	it('does nothing on a button the consumer marked aria-disabled', () => {
		button.setAttribute('aria-disabled', 'true');
		button.click();
		expect(calls).toBe(0);
		expect(button.getAttribute('aria-disabled')).toBe('true');
	});
});
