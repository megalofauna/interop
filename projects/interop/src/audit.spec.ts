import { auditInterop, watchInterop } from './audit';
import { guardActivation } from './guard-activation';

const render = (html: string) => {
	document.body.innerHTML = html;
	return document.body;
};
const rules = (root: ParentNode = document) => auditInterop(root).map((issue) => issue.rule);

describe('auditInterop', () => {
	it('flags a button with no accessible name', () => {
		render('<button interop-button="icon" type="button"><svg interop-icon aria-hidden="true"></svg></button>');
		expect(rules()).toEqual(['button-name']);
	});

	it('accepts a name from text, aria-label, aria-labelledby, a labelled icon, or title', () => {
		render(`
			<button interop-button type="button">Save</button>
			<button interop-button="icon" type="button" aria-label="Search"><svg interop-icon aria-hidden="true"></svg></button>
			<span id="l">Close</span><button interop-button type="button" aria-labelledby="l"></button>
			<button interop-button="icon" type="button"><svg interop-icon aria-label="Copy"></svg></button>
			<button interop-button type="button" title="Delete"></button>
			<button interop-button="icon" type="button"><svg interop-icon aria-hidden="true"></svg><span itx-visually-hidden>Edit</span></button>
		`);
		expect(rules()).toEqual([]);
	});

	it('flags an unnamed summary button, and does not count hidden text as a name', () => {
		render(`
			<details><summary interop-button="icon"><svg interop-icon aria-hidden="true"></svg></summary></details>
			<button interop-button="icon" type="button"><span hidden>Close</span><svg interop-icon aria-hidden="true"></svg></button>
		`);
		expect(rules()).toEqual(['button-name', 'button-name']);
	});

	it('flags a button that shows only an icon unless it is an icon button', () => {
		render(`
			<button interop-button type="button" aria-label="Search"><svg interop-icon></svg></button>
			<button interop-button type="button"><span itx-visually-hidden>Close</span><svg interop-icon></svg></button>
			<button interop-button="icon" type="button" aria-label="Search"><svg interop-icon></svg></button>
			<button interop-button type="button"><svg interop-icon></svg>Copy</button>
		`);
		expect(rules()).toEqual(['button-icon-square', 'button-icon-square']);
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
		expect(rules()).toEqual(['button-activation-guard', 'button-activation-guard']);
		const unguard = guardActivation();
		expect(rules()).toEqual([]);
		unguard();
		expect(rules()).toEqual(['button-activation-guard', 'button-activation-guard']);
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
		expect(rules()).toEqual(['button-pressed-value']);
	});

	it('flags a badge with no text for assistive technology', () => {
		render('<span interop-badge="dot"></span>');
		expect(rules()).toEqual(['badge-text']);
	});

	it('flags a badge whose only text is a number', () => {
		render('<button interop-button type="button">Inbox <span interop-badge>3</span></button>');
		expect(rules()).toEqual(['badge-count-label']);
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
			<button interop-button type="button" itx-audit-ignore="button-pressed-value"></button>
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
		expect(rules()).toEqual(['code-block-scroll-focusable']);
	});

	it('flags a tooltip holding a control', () => {
		render(`
			<span interop-tooltip>Read <a href="/docs">the docs</a></span>
			<span interop-tooltip>Saves a draft</span>
		`);
		expect(rules()).toEqual(['tooltip-interactive']);
	});

	it('flags a disabled control with a tooltip', () => {
		render(`
			<button type="button" disabled aria-describedby="t">Save</button><span interop-tooltip id="t">Saves a draft</span>
			<button type="button" disabled aria-describedby="d">Save</button><span id="d">Saves a draft</span>
			<button type="button" aria-disabled="true" aria-describedby="t">Save</button>
		`);
		expect(rules()).toEqual(['tooltip-trigger-disabled']);
	});

	it('flags a describing tooltip that repeats the name, and accepts one that labels', () => {
		render(`
			<button interop-button type="button" aria-label="Copy code" aria-describedby="a"></button><span interop-tooltip id="a">Copy code</span>
			<button interop-button type="button" aria-labelledby="b"></button><span interop-tooltip="label" id="b">Copy code</span>
			<button interop-button type="button" aria-describedby="c">Save</button><span interop-tooltip id="c">Saves a draft</span>
		`);
		expect(rules()).toEqual(['tooltip-repeats-name']);
	});

	it('flags a label tooltip that replaces visible text, and accepts one that keeps it', () => {
		render(`
			<button interop-button type="button" aria-labelledby="a">Delete</button><span interop-tooltip="label" id="a">Remove this item</span>
			<button interop-button type="button" aria-labelledby="b">Delete</button><span interop-tooltip="label" id="b">Delete this item</span>
			<button interop-button="icon" type="button" aria-labelledby="c"><svg interop-icon aria-hidden="true"></svg></button><span interop-tooltip="label" id="c">Copy code</span>
		`);
		expect(rules()).toEqual(['tooltip-label-in-name']);
	});

	it('flags a control label with no text, and accepts text or a label on the input', () => {
		render(`
			<label interop-switch><input type="checkbox" role="switch"></label>
			<label interop-checkbox><input type="checkbox"> Accept terms</label>
			<fieldset interop-radio-group><legend>Size</legend>
				<label><input type="radio" name="s" aria-label="Small"></label>
				<label><input type="radio" name="s"> Large</label>
			</fieldset>
		`);
		expect(rules()).toEqual(['control-name']);
	});

	it('flags block content inside a control label', () => {
		render(`
			<label interop-checkbox><input type="checkbox"> <div>Accept</div></label>
			<label interop-checkbox><input type="checkbox"> <span>Accept</span> the <a href="/terms">terms</a></label>
		`);
		expect(rules()).toEqual(['control-label-block']);
	});

	it('flags another control inside a control label', () => {
		render(`
			<label interop-switch><input type="checkbox" role="switch"> Alerts <button type="button">Edit</button></label>
			<label interop-switch><input type="checkbox" role="switch"> Sounds</label>
		`);
		expect(rules()).toEqual(['control-label-control']);
	});

	it('flags a card whose whole text is its name, and accepts one with a name and a description', () => {
		const card = (labelled: string) => `
			<label><input type="radio" name="p" ${labelled}><strong id="n">Pro</strong><span id="d">$29 a month</span></label>`;
		render(
			`<fieldset interop-radio-group="cards"><legend>Plan</legend>${card('')}${card('aria-labelledby="n" aria-describedby="d"')}</fieldset>`,
		);
		expect(rules()).toEqual(['cards-name']);
	});

	it('flags aria-checked on a native checkbox or radio', () => {
		render('<label interop-checkbox><input type="checkbox" aria-checked="mixed"> All</label>');
		expect(rules()).toEqual(['control-aria-checked']);
	});

	it('flags a group with no legend, and accepts a legend or a label', () => {
		render(`
			<fieldset interop-checkbox-group><label interop-checkbox><input type="checkbox"> A</label></fieldset>
			<fieldset interop-checkbox-group><legend>Toppings</legend><label interop-checkbox><input type="checkbox"> A</label></fieldset>
			<fieldset interop-checkbox-group aria-label="Toppings"><label interop-checkbox><input type="checkbox"> A</label></fieldset>
		`);
		expect(rules()).toEqual(['group-name']);
	});

	it('flags radios that do not share a name', () => {
		const group = (a: string, b: string) =>
			`<fieldset interop-radio-group><legend>Size</legend><label><input type="radio" ${a}> S</label><label><input type="radio" ${b}> L</label></fieldset>`;
		render(group('name="a"', 'name="b"') + group('', '') + group('name="c"', 'name="c"'));
		expect(rules()).toEqual(['radio-group-shared-name', 'radio-group-shared-name']);
	});

	it('flags a checkbox group where every box is required', () => {
		const group = (a: string, b: string) =>
			`<fieldset interop-checkbox-group><legend>T</legend><label interop-checkbox><input type="checkbox" ${a}> A</label><label interop-checkbox><input type="checkbox" ${b}> B</label></fieldset>`;
		render(group('required', 'required') + group('required', ''));
		expect(rules()).toEqual(['checkbox-group-required']);
	});

	describe('tabs', () => {
		const tabs = ({ name = 'aria-label="Sections"', tabs: tabMarkup = '', panels = '' } = {}) =>
			`<div interop-tabs><div role="tablist" ${name}>${tabMarkup}</div>${panels}</div>`;
		const tab = (key: string, selected: boolean) =>
			`<button type="button" role="tab" aria-controls="p-${key}" aria-selected="${selected}">${key}</button>`;
		const panel = (key: string, hidden: boolean) =>
			`<section role="tabpanel" id="p-${key}" ${hidden ? 'hidden="until-found"' : ''}>${key}</section>`;
		const good = { tabs: tab('a', true) + tab('b', false), panels: panel('a', false) + panel('b', true) };

		it('accepts tabs written as the helper expects', () => {
			render(tabs(good));
			expect(rules()).toEqual([]);
		});

		it('flags a tab list with no name', () => {
			render(tabs({ ...good, name: '' }));
			expect(rules()).toEqual(['tabs-name']);
		});

		it('flags a tab list with no tabs', () => {
			render(tabs({ tabs: '', panels: '' }));
			expect(rules()).toEqual(['tabs-empty']);
		});

		it('flags something other than a tab inside the tab list', () => {
			render(tabs({ ...good, tabs: good.tabs + '<button type="button">More</button>' }));
			expect(rules()).toEqual(['tabs-children']);
		});

		it('flags a tab that controls no panel', () => {
			render(tabs({ ...good, panels: panel('a', false) }));
			expect(rules()).toEqual(['tabs-panel']);
		});

		it('flags a tab list without exactly one selected tab', () => {
			render(tabs({ ...good, tabs: tab('a', true) + tab('b', true), panels: panel('a', false) + panel('b', false) }));
			expect(rules()).toEqual(['tabs-selected']);
		});

		it('flags the shown panel of an unselected tab', () => {
			render(tabs({ ...good, panels: panel('a', false) + panel('b', false) }));
			expect(rules()).toEqual(['tabs-panel-hidden']);
		});
	});

	describe('table', () => {
		const head = '<thead><tr><th scope="col">Name</th><th scope="col">Role</th></tr></thead>';
		const row = (name: string) => `<tr><th scope="row">${name}</th><td>Pilot</td></tr>`;

		it('accepts a captioned table with headers and one tbody per group', () => {
			render(`<table interop-table><caption>Crew</caption>${head}
				<tbody><tr><th scope="rowgroup" colspan="2">Bridge</th></tr>${row('Ada')}</tbody>
				<tbody><tr><th scope="rowgroup" colspan="2">Engine</th></tr>${row('Bo')}</tbody>
			</table>`);
			expect(rules()).toEqual([]);
		});

		it('accepts a name from aria-labelledby', () => {
			render(`<h2 id="h">Crew</h2><table interop-table aria-labelledby="h">${head}<tbody>${row('Ada')}</tbody></table>`);
			expect(rules()).toEqual([]);
		});

		it('flags a table with no name, and one with no header cells', () => {
			render(`<table interop-table>${head}<tbody>${row('Ada')}</tbody></table>`);
			expect(rules()).toEqual(['table-name']);
			render('<table interop-table><caption>Crew</caption><tr><td>Ada</td></tr></table>');
			expect(rules()).toEqual(['table-headers']);
		});

		it('flags group headers sharing one tbody', () => {
			render(`<table interop-table><caption>Crew</caption>${head}<tbody>
				<tr><th scope="rowgroup" colspan="2">Bridge</th></tr>${row('Ada')}
				<tr><th scope="rowgroup" colspan="2">Engine</th></tr>${row('Bo')}
			</tbody></table>`);
			expect(rules()).toEqual(['table-rowgroup', 'table-rowgroup']);
		});

		it('flags a table wider than its container, unless it is in a scroll area', () => {
			const table = `<table interop-table><caption>Crew</caption>${head}<tbody>${row('Ada')}</tbody></table>`;
			render(`<div style="width: 100px">${table}</div><div interop-scroll-area>${table}</div>`);
			const wide = vi.spyOn(HTMLTableElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 400 } as DOMRect);
			const narrow = vi.spyOn(HTMLDivElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
			expect(rules()).toEqual(['table-overflow']);
			wide.mockRestore();
			narrow.mockRestore();
		});
	});

	describe('tags', () => {
		it('accepts remove buttons named for their tag', () => {
			render(`<ul interop-tags role="list" aria-label="Tags">
				<li>Football <button type="button"><span itx-visually-hidden>Remove Football</span></button></li>
				<li>Cricket <button type="button" aria-label="Remove Cricket"></button></li>
			</ul>`);
			expect(rules()).toEqual([]);
		});

		it('flags a remove button with a generic name, and a list without role="list"', () => {
			render('<ul interop-tags aria-label="Tags"><li>Football <button type="button">Remove</button></li></ul>');
			expect(rules().sort()).toEqual(['list-role', 'tags-remove-name']);
		});
	});

	describe('page nav', () => {
		it('accepts a named page nav whose list has role="list"', () => {
			render('<nav interop-page-nav aria-label="On this page"><ul role="list"><li><a href="#a">A</a></li></ul></nav>');
			expect(rules()).toEqual([]);
		});

		it('flags a page nav with no name, and a list without role="list"', () => {
			render('<nav interop-page-nav><ul><li><a href="#a">A</a></li></ul></nav>');
			expect(rules().sort()).toEqual(['list-role', 'page-nav-name']);
		});
	});

	describe('tree', () => {
		const tree = (summary: string, inner = ' role="list"') =>
			`<ul interop-tree role="list"><li><details open><summary>${summary}</summary><ul${inner}><li><a href="/a">A</a></li></ul></details></li></ul>`;

		it('accepts branches labeled with text, and every list with role="list"', () => {
			render(tree('Guides'));
			expect(rules()).toEqual([]);
		});

		it('flags a link inside a summary', () => {
			render(tree('<a href="/guides">Guides</a>'));
			expect(rules()).toEqual(['tree-summary-control']);
		});

		it('flags a nested list without role="list"', () => {
			render(tree('Guides', ''));
			expect(rules()).toEqual(['list-role']);
		});
	});

	describe('dialog', () => {
		it('accepts a dialog named by its heading, with a way to close', () => {
			render(`
				<dialog interop-dialog aria-labelledby="t"><h2 id="t">Rename</h2></dialog>
				<dialog interop-dialog aria-label="Settings" closedby="none"><button command="request-close">Close</button></dialog>
				<dialog interop-dialog aria-label="Delete" closedby="none"><form method="dialog"><button value="ok">OK</button></form></dialog>
				<dialog interop-dialog role="alertdialog" aria-label="Session ending" aria-describedby="m"><p id="m">Two minutes left.</p></dialog>
			`);
			expect(rules()).toEqual([]);
		});

		it('flags a dialog with no name, or a name that points at nothing', () => {
			render('<dialog interop-dialog><p>Hi</p></dialog><dialog interop-dialog aria-labelledby="missing"></dialog>');
			expect(rules()).toEqual(['dialog-name', 'dialog-name']);
		});

		it('flags a closedby="none" dialog with no button that closes it', () => {
			render(
				'<dialog interop-dialog aria-label="Stuck" closedby="none"><button type="button">Help</button><form method="dialog"><button type="button">No</button></form></dialog>',
			);
			expect(rules()).toEqual(['dialog-close']);
		});

		it('flags an alert dialog with no description', () => {
			render('<dialog interop-dialog role="alertdialog" aria-label="Session ending"></dialog>');
			expect(rules()).toEqual(['dialog-alert-description']);
		});
	});

	describe('field', () => {
		it('accepts a labeled field with a hint that exists', () => {
			render(`
				<div interop-field>
					<label for="email">Email</label>
					<p interop-hint id="email-hint">For the receipt</p>
					<input interop-input id="email" type="email" autocomplete="email" aria-describedby="email-hint">
				</div>
				<textarea interop-input aria-label="Notes"></textarea>
				<div interop-error-summary hidden><h2>There is a problem</h2><ul></ul></div>
			`);
			expect(rules()).toEqual([]);
		});

		it('flags a field with only a placeholder, and a description that points at nothing', () => {
			render('<input interop-input placeholder="Email"><label for="b">B</label><input interop-input id="b" aria-describedby="nope">');
			expect(rules().sort()).toEqual(['field-describedby', 'field-label']);
		});

		it('flags type="number", an email field without autocomplete, a link in a hint, and a summary without a list', () => {
			render(`
				<label for="n">N</label><input interop-input id="n" type="number">
				<label for="e">E</label><input interop-input id="e" type="email">
				<p interop-hint>See <a href="/help">help</a></p>
				<div interop-error-summary><h2>There is a problem</h2></div>
			`);
			expect(rules().sort()).toEqual(['error-summary-list', 'field-autocomplete', 'field-hint-link', 'field-number']);
		});
	});

	describe('select', () => {
		it('accepts options with text, a label, or visually hidden text', () => {
			render(`
				<select interop-select aria-label="Fruit">
					<option>Apple</option>
					<option label="Banana"></option>
					<option><svg interop-icon aria-hidden="true"></svg><span itx-visually-hidden>Cherry</span></option>
				</select>
			`);
			expect(rules()).toEqual([]);
		});

		it('flags an option with no text', () => {
			render('<select interop-select aria-label="Fruit"><option><svg interop-icon aria-hidden="true"></svg></option></select>');
			expect(rules()).toEqual(['select-option-text']);
		});

		it('flags a multiple select', () => {
			render('<select interop-select aria-label="Toppings" multiple><option>Basil</option></select>');
			expect(rules()).toEqual(['select-multiple']);
		});
	});

	describe('multi-step form', () => {
		it('accepts steps with a legend, hidden plainly', () => {
			render('<form interop-steps-form><fieldset><legend>A</legend></fieldset><fieldset hidden><legend>B</legend></fieldset></form>');
			expect(rules()).toEqual([]);
		});

		it('flags a step with no legend or heading', () => {
			render('<form interop-steps-form><fieldset><input name="a"></fieldset></form>');
			expect(rules()).toEqual(['steps-form-heading']);
		});

		it('flags a step hidden by disabled or until-found', () => {
			render(
				'<form interop-steps-form><fieldset disabled><legend>A</legend></fieldset><fieldset hidden="until-found"><legend>B</legend></fieldset></form>',
			);
			expect(rules()).toEqual(['steps-form-hidden', 'steps-form-hidden']);
		});
	});

	describe('step indicator', () => {
		const steps = (name: string, items: string) => `<ol interop-steps role="list" ${name}>${items}</ol>`;
		const good = '<li><a href="/a">A</a></li><li aria-current="step">B</li><li>C</li>';

		it('accepts a named indicator with one current step and links back only', () => {
			render(steps('aria-label="Progress"', good));
			expect(rules()).toEqual([]);
		});

		it('flags an indicator with no name', () => {
			render(steps('', good));
			expect(rules()).toEqual(['steps-name']);
		});

		it('flags an indicator without exactly one current step', () => {
			render(
				steps('aria-label="Progress"', '<li>A</li><li>B</li>') +
					steps('aria-label="Other"', '<li aria-current="step">A</li><li aria-current="step">B</li>'),
			);
			expect(rules()).toEqual(['steps-current', 'steps-current']);
		});

		it('flags a button in a step, and a link ahead of the current step', () => {
			render(
				steps(
					'aria-label="Progress"',
					'<li><button type="button">A</button></li><li aria-current="step">B</li><li><a href="/c">C</a></li>',
				),
			);
			expect(rules()).toEqual(['steps-control', 'steps-control']);
		});
	});

	it('flags a radio group with one radio', () => {
		render('<fieldset interop-radio-group><legend>Agree</legend><label><input type="radio" name="a"> Yes</label></fieldset>');
		expect(rules()).toEqual(['radio-group-options']);
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
});
