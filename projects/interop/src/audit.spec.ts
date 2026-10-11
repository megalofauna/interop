import { auditInterop, watchInterop } from './audit';
import { guardActivation } from './guard-activation';

const render = (html: string) => {
	document.body.innerHTML = html;
	return document.body;
};
const rules = (root: ParentNode = document) => auditInterop(root).map((issue) => issue.rule);

describe('auditInterop', () => {
	it('flags a button with no accessible name', () => {
		render('<button interop-button type="button"><svg interop-icon aria-hidden="true"></svg></button>');
		expect(rules()).toEqual(['button-name']);
	});

	it('accepts a name from text, aria-label, aria-labelledby, a labelled icon, or title', () => {
		render(`
			<button interop-button type="button">Save</button>
			<button interop-button type="button" aria-label="Search"><svg interop-icon aria-hidden="true"></svg></button>
			<span id="l">Close</span><button interop-button type="button" aria-labelledby="l"></button>
			<button interop-button type="button"><svg interop-icon aria-label="Copy"></svg></button>
			<button interop-button type="button" title="Delete"></button>
			<button interop-button type="button"><svg interop-icon aria-hidden="true"></svg><span itx-visually-hidden>Edit</span></button>
		`);
		expect(rules()).toEqual([]);
	});

	it('flags an icon-only plain button too', () => {
		render('<button type="button"><svg interop-icon aria-hidden="true"></svg></button>');
		expect(rules()).toEqual(['button-name']);
	});

	it('flags aria-disabled and aria-busy when no guard is installed, and stops once one is', () => {
		render(`
			<button interop-button type="button" aria-disabled="true">Save</button>
			<button interop-button type="button" aria-busy="true">Save</button>
		`);
		expect(rules()).toEqual(['activation-guard', 'activation-guard']);
		const unguard = guardActivation();
		expect(rules()).toEqual([]);
		unguard();
		expect(rules()).toEqual(['activation-guard', 'activation-guard']);
	});

	it('flags a button in a form with no type', () => {
		render('<form><button interop-button>Save</button></form><button interop-button>Outside</button>');
		expect(rules()).toEqual(['button-type']);
	});

	it('flags a labelled icon that is hidden', () => {
		render('<svg interop-icon aria-label="Done" aria-hidden="true"></svg>');
		expect(rules()).toEqual(['icon-label-hidden']);
	});

	it('flags a labelled icon inside a button that has text', () => {
		render('<button interop-button type="button"><svg interop-icon aria-label="Copy"></svg>Copy</button>');
		expect(rules()).toEqual(['icon-label-repeated']);
	});

	it('flags an aria-pressed value assistive technology does not understand', () => {
		render(`
			<button interop-button type="button" aria-pressed="yes">Bold</button>
			<button interop-button type="button" aria-pressed="true">Bold</button>
		`);
		expect(rules()).toEqual(['pressed-value']);
	});

	it('flags a badge with no text for assistive technology', () => {
		render('<span interop-badge="dot"></span>');
		expect(rules()).toEqual(['badge-text']);
	});

	it('flags a badge whose only text is a number', () => {
		render('<button interop-button type="button">Inbox <span interop-badge>3</span></button>');
		expect(rules()).toEqual(['badge-count-label']);
	});

	it('reminds that a count badge does not announce changes, unless it has a live region', () => {
		render(`
			<span interop-badge><span aria-hidden="true">3</span><span itx-visually-hidden>3 unread messages</span></span>
			<span interop-badge><span aria-hidden="true">3</span><span itx-visually-hidden>3 unread messages</span><span itx-visually-hidden role="status">3 unread messages</span></span>
		`);
		expect(rules()).toEqual(['badge-announcement']);
	});

	it('flags a live-region badge inside a button, which drops the count from its name', () => {
		render(`
			<button interop-button type="button">Inbox
				<span interop-badge role="status"><span aria-hidden="true">3</span><span itx-visually-hidden>3 unread messages</span></span>
			</button>
			<p>Standalone <span interop-badge role="status"><span aria-hidden="true">3</span><span itx-visually-hidden>3 alerts</span></span></p>
		`);
		expect(rules()).toEqual(['badge-live-region-name']);
	});

	it('accepts a status badge, a labelled count, and a hidden badge', () => {
		render(`
			<span interop-badge>Beta</span>
			<span interop-badge>v0.1.0</span>
			<span interop-badge="dot"><span itx-visually-hidden>New activity</span></span>
			<span interop-badge hidden></span>
		`);
		expect(rules()).toEqual([]);
	});

	it('skips the rules named by itx-audit-ignore, or every rule when it is empty', () => {
		render(`
			<button interop-button type="button" itx-audit-ignore="button-name"></button>
			<button interop-button type="button" itx-audit-ignore="pressed-value"></button>
			<form><button interop-button itx-audit-ignore></button></form>
		`);
		expect(rules()).toEqual(['button-name']);
	});

	it('says what is wrong, why it matters, and what to do', () => {
		render('<button interop-button type="button"></button>');
		const [issue] = auditInterop();
		expect(issue).toMatchObject({
			rule: 'button-name',
			problem: 'This button has no accessible name.',
		});
		expect(issue!.reason).toContain('screen reader');
		expect(issue!.advice).toContain('aria-label');
	});
});

describe('watchInterop', () => {
	let info: ReturnType<typeof vi.spyOn>;
	let warn: ReturnType<typeof vi.spyOn>;
	const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

	beforeEach(() => {
		document.documentElement.removeAttribute('itx-audit');
		info = vi.spyOn(console, 'info').mockImplementation(() => {});
		warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});
	afterEach(() => {
		document.documentElement.setAttribute('itx-audit', 'off');
		info.mockRestore();
		warn.mockRestore();
	});

	it('announces itself with how to turn it off, then warns once per issue', async () => {
		render('<button interop-button type="button"></button>');
		const stop = watchInterop();
		await tick();
		expect(info).toHaveBeenCalledWith(expect.stringContaining('add itx-audit="off" to the <html> element'));
		expect(warn).toHaveBeenCalledTimes(1);
		const [message, element] = warn.mock.calls[0]!;
		expect(message).toBe(
			'Interop · button-name\nThis button has no accessible name.\n' +
				'A screen reader announces it only as "button", with nothing to say what it does.\n' +
				'Give it visible text, or aria-label="…" if it shows only an icon.',
		);
		expect(element).toBe(document.querySelector('button'));

		document.body.append(document.createElement('p'));
		await tick();
		expect(warn).toHaveBeenCalledTimes(1);
		stop();
	});

	it('checks elements added later', async () => {
		render('');
		const stop = watchInterop();
		await tick();
		document.body.insertAdjacentHTML('beforeend', '<button interop-button type="button"></button>');
		// The observer schedules its own check after this wait starts, so wait a second turn.
		await tick();
		await tick();
		expect(warn).toHaveBeenCalledTimes(1);
		stop();
	});

	it('does nothing when the page turns it off', async () => {
		document.documentElement.setAttribute('itx-audit', 'off');
		render('<button interop-button type="button"></button>');
		const stop = watchInterop();
		await tick();
		expect(info).not.toHaveBeenCalled();
		expect(warn).not.toHaveBeenCalled();
		stop();
	});
	it('flags a code block with no name, and accepts a caption or a label', () => {
		render(`
			<figure interop-code-block><pre><code>a</code></pre></figure>
			<figure interop-code-block><figcaption>a.ts</figcaption><pre><code>a</code></pre></figure>
			<figure interop-code-block aria-label="Example"><pre><code>a</code></pre></figure>
		`);
		expect(rules()).toEqual(['code-block-name']);
	});

	it('flags code that scrolls without a tabindex', () => {
		render('<pre><code class="language-ts">a</code></pre><pre tabindex="0"><code class="language-ts">b</code></pre>');
		const [scrolling, focusable] = Array.from(document.querySelectorAll('pre'));
		for (const pre of [scrolling, focusable]) Object.defineProperty(pre, 'scrollWidth', { value: 900 });
		expect(rules()).toEqual(['code-scroll-focusable']);
	});
});
