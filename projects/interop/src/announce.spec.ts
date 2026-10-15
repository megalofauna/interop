import { announce } from './announce';

describe('announce', () => {
	afterEach(() => {
		delete (Element.prototype as { ariaNotify?: unknown }).ariaNotify;
		delete (Document.prototype as { ariaNotify?: unknown }).ariaNotify;
		document.body.innerHTML = '';
	});

	it('calls ariaNotify() on the element it is about, at normal priority', () => {
		const calls: unknown[][] = [];
		(Element.prototype as { ariaNotify?: unknown }).ariaNotify = function (this: Element, ...args: unknown[]) {
			calls.push([this, ...args]);
		};
		const button = document.body.appendChild(document.createElement('button'));
		announce('Copied', { from: button });
		expect(calls).toEqual([[button, 'Copied', { priority: 'normal' }]]);
	});

	it('calls it on the document when given no element, and passes a high priority', () => {
		const calls: unknown[][] = [];
		(Document.prototype as { ariaNotify?: unknown }).ariaNotify = function (this: Document, ...args: unknown[]) {
			calls.push([this, ...args]);
		};
		announce('Failed', { priority: 'high' });
		expect(calls).toEqual([[document, 'Failed', { priority: 'high' }]]);
	});

	it('leaves the status element alone when ariaNotify() exists', async () => {
		(Document.prototype as { ariaNotify?: unknown }).ariaNotify = () => {};
		const status = document.body.appendChild(document.createElement('p'));
		announce('Saved', { status });
		await new Promise((resolve) => setTimeout(resolve, 60));
		expect(status.textContent).toBe('');
	});

	it('writes to the status element without ariaNotify(), emptying it first', async () => {
		const status = document.body.appendChild(document.createElement('p'));
		status.textContent = 'Saved';
		announce('Saved', { status });
		expect(status.textContent).toBe('');
		await new Promise((resolve) => setTimeout(resolve, 60));
		expect(status.textContent).toBe('Saved');
	});

	it('says nothing without ariaNotify() or a status element', () => {
		expect(() => announce('Saved')).not.toThrow();
	});
});
