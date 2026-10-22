import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import {
	bindCharacterCount,
	bindPasswordToggle,
	bindSelectAll,
	bindTagInput,
	bindValidation,
	guardActivation,
	registerIcons,
} from 'interop';
import { InteropBadge } from 'interop/badge';
import { InteropCodeBlock } from 'interop/code-block';
import { InteropIcon } from 'interop/icon';
import { InteropInvoker } from 'interop/invoker';
import { InteropScrollArea } from 'interop/scroll-area';
import { InteropStepsForm } from 'interop/steps';
import { InteropTabs } from 'interop/tabs';
import { InteropToolbar } from 'interop/toolbar';
import { InteropTooltip } from 'interop/tooltip';
import { TablerCheck, TablerCopy, TablerSearch, TablerX } from 'interop/tabler';

registerIcons(TablerCheck, TablerCopy, TablerSearch, TablerX);

// jsdom computes no colors, so styles/contrast.spec.ts checks contrast from the declared values instead.
const OPTIONS: axe.RunOptions = { rules: { 'color-contrast': { enabled: false } } };

const violations = async (element: Element) =>
	(await axe.run(element, OPTIONS)).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(', ')}`);

// jsdom has no popover API, so a popover never opens and axe skips everything inside it. It also
// treats hidden="until-found" as hidden, so axe skips every unselected tab panel. Removing the
// attributes shows the content, which is what opening the popover or selecting the tab does.
const reveal = (element: Element) => {
	element.querySelectorAll('[popover]').forEach((popover) => popover.removeAttribute('popover'));
	element.querySelectorAll('[hidden="until-found"]').forEach((panel) => panel.removeAttribute('hidden'));
};

@Component({
	imports: [InteropBadge, InteropCodeBlock, InteropIcon, InteropInvoker, InteropScrollArea, InteropTooltip],
	template: `
		<main>
			<button interop-button type="button">Save</button>
			<button interop-button type="button" itx-size="sm"><svg interop-icon name="tabler-copy"></svg>Copy</button>
			<button interop-button="icon" type="button" aria-label="Search"><svg interop-icon name="tabler-search"></svg></button>
			<button interop-button="icon" type="button"><svg interop-icon name="tabler-check" aria-label="Done"></svg></button>
			<button interop-button type="button" [attr.aria-pressed]="pressed()">Bold</button>
			<button interop-button type="button" aria-busy="true">Saving</button>
			<button interop-button type="button" disabled>Disabled</button>
			<button interop-button type="button" aria-disabled="true">Unavailable</button>
			<button interop-button type="button" [pendingAction]="save">Pending</button>
			<p>Text with an icon <svg interop-icon name="tabler-check"></svg></p>
			<svg interop-icon name="tabler-check" size="24" aria-label="Complete"></svg>
			<button interop-button type="button">
				Inbox
				<span interop-badge itx-badge-position="top-end" itx-color="danger" announce [count]="120" [label]="unread"></span>
			</button>
			<p>Status <span interop-badge itx-color="success">Operational</span></p>
			<button interop-button type="button">
				Activity
				<span interop-badge="dot" itx-badge-position="top-end">New activity</span>
			</button>
			<button interop-button="icon" type="button" [interopTooltip]="close"><svg interop-icon name="tabler-x"></svg></button>
			<span interop-tooltip="label" #close>Close</span>
			<button interop-button type="button" [interopTooltip]="draft">Save draft</button>
			<span interop-tooltip #draft>Saves without publishing</span>
			<button interop-button type="button" [popoverTarget]="menu">Options</button>
			<button interop-button type="button" commandfor="axe-drawer" command="toggle-popover">Menu</button>
			<nav id="axe-drawer" interop-popover="drawer" popover aria-label="Pages">
				<ul>
					<li><a href="/a" aria-current="page">A</a></li>
					<li><a href="/b">B</a></li>
				</ul>
			</nav>
			<details>
				<summary interop-button>More pages</summary>
				<nav aria-label="More pages">
					<ul>
						<li><a href="/c">C</a></li>
					</ul>
				</nav>
			</details>
			<div interop-popover popover #menu>
				<p>Popover content</p>
				<button interop-button="icon" type="button" aria-label="Remove"><svg interop-icon name="tabler-x"></svg></button>
			</div>
			<h2 id="notes">Notes</h2>
			<div interop-scroll-area aria-labelledby="notes">
				<p>Note one.</p>
				<p>Note two.</p>
			</div>
			<label interop-switch><input type="checkbox" role="switch" /> Notifications</label>
			<label interop-switch><input type="checkbox" role="switch" checked /> Dark mode</label>
			<label interop-switch><input type="checkbox" role="switch" disabled /> Autosave</label>
			<label interop-switch itx-size="lg"><input type="checkbox" switch /> Bluetooth</label>
			<fieldset interop-radio-group>
				<legend>Shipping</legend>
				<label><input type="radio" name="shipping" value="standard" checked /> Standard</label>
				<label><input type="radio" name="shipping" value="express" /> Express</label>
				<label><input type="radio" name="shipping" value="pickup" disabled /> Pickup</label>
			</fieldset>
			<label interop-checkbox><input type="checkbox" name="terms" required /> I accept the <a href="/terms">terms</a></label>
			<label interop-checkbox itx-size="lg"><input type="checkbox" checked disabled /> Saved</label>
			<fieldset interop-checkbox-group>
				<legend>Toppings</legend>
				<label interop-checkbox><input type="checkbox" [indeterminate]="true" /> All toppings</label>
				<label interop-checkbox><input type="checkbox" name="topping" value="cheese" checked /> Cheese</label>
				<label interop-checkbox><input type="checkbox" name="topping" value="olives" /> Olives</label>
			</fieldset>
			<fieldset interop-radio-group="segmented">
				<legend>View</legend>
				<label><input type="radio" name="view" value="list" checked /> List</label>
				<label><input type="radio" name="view" value="grid" /> Grid</label>
			</fieldset>
			<fieldset interop-radio-group="segmented icon" itx-size="sm">
				<legend>Alignment</legend>
				<label
					><input type="radio" name="align" value="start" checked /><svg interop-icon name="tabler-check"></svg
					><span itx-visually-hidden>Start</span></label
				>
				<label
					><input type="radio" name="align" value="end" /><svg interop-icon name="tabler-x"></svg
					><span itx-visually-hidden>End</span></label
				>
			</fieldset>
			<div interop-tabs>
				<div role="tablist" aria-label="Station systems">
					<button type="button" role="tab" id="t-nav" aria-controls="p-nav" aria-selected="true">Navigation</button>
					<button type="button" role="tab" id="t-eng" aria-controls="p-eng" aria-selected="false" tabindex="-1">
						Engineering <span interop-badge [count]="3" [label]="unread"></span>
					</button>
					<button type="button" role="tab" id="t-life" aria-controls="p-life" aria-selected="false" tabindex="-1" disabled>
						Life support
					</button>
				</div>
				<section role="tabpanel" id="p-nav" aria-labelledby="t-nav" tabindex="0"><p>Course plotted.</p></section>
				<section role="tabpanel" id="p-eng" aria-labelledby="t-eng" hidden="until-found">
					<p>Reactor steady.</p>
					<button interop-button="icon" type="button" aria-label="Refresh"><svg interop-icon name="tabler-search"></svg></button>
					<label interop-switch><input type="checkbox" role="switch" /> Auto-throttle</label>
				</section>
				<section role="tabpanel" id="p-life" aria-labelledby="t-life" hidden="until-found"><p>Nominal.</p></section>
			</div>
			<div interop-tabs="segmented icon">
				<div role="tablist" aria-label="Layout">
					<button type="button" role="tab" id="t-list" aria-controls="p-list" aria-selected="true">
						<svg interop-icon name="tabler-check"></svg><span itx-visually-hidden>List</span>
					</button>
					<button type="button" role="tab" id="t-grid" aria-controls="p-grid" aria-selected="false" tabindex="-1">
						<svg interop-icon name="tabler-x"></svg><span itx-visually-hidden>Grid</span>
					</button>
				</div>
				<section role="tabpanel" id="p-list" aria-labelledby="t-list" tabindex="0"><p>List.</p></section>
				<section role="tabpanel" id="p-grid" aria-labelledby="t-grid" hidden="until-found"><p>Grid.</p></section>
			</div>
			<div interop-tabs itx-size="sm">
				<div role="tablist" aria-label="Account" aria-orientation="vertical">
					<button type="button" role="tab" id="t-profile" aria-controls="p-profile" aria-selected="true">Profile</button>
					<button type="button" role="tab" id="t-billing" aria-controls="p-billing" aria-selected="false" tabindex="-1">Billing</button>
				</div>
				<section role="tabpanel" id="p-profile" aria-labelledby="t-profile"><a href="/profile">Edit profile</a></section>
				<section role="tabpanel" id="p-billing" aria-labelledby="t-billing" hidden="until-found"><a href="/billing">Invoices</a></section>
			</div>
			<fieldset interop-radio-group="cards">
				<legend>Plan</legend>
				<label>
					<input type="radio" name="plan" value="free" aria-labelledby="plan-free" aria-describedby="plan-free-details" checked />
					<strong id="plan-free">Free</strong>
					<span id="plan-free-details">Three projects</span>
				</label>
				<label>
					<input type="radio" name="plan" value="pro" aria-labelledby="plan-pro" aria-describedby="plan-pro-details" />
					<strong id="plan-pro">Pro</strong>
					<span id="plan-pro-details">$29 a month <span interop-badge>Most popular</span></span>
				</label>
			</fieldset>
			<fieldset interop-checkbox-group="cards">
				<legend>Add-ons</legend>
				<label interop-checkbox><input type="checkbox" name="addon" value="backup" checked /> <strong>Backups</strong></label>
				<label interop-checkbox><input type="checkbox" name="addon" value="sso" disabled /> <strong>Single sign-on</strong></label>
			</fieldset>
			<ol interop-steps role="list" aria-label="Application progress">
				<li><a href="/details">Your details</a> <span itx-visually-hidden>completed</span></li>
				<li aria-current="step">Documents</li>
				<li>Sign <span itx-visually-hidden>not completed</span></li>
			</ol>
			<nav aria-label="Docs">
				<ul interop-tree role="list">
					<li>
						<details open>
							<summary>Guides</summary>
							<ul role="list">
								<li><a href="/guides">Overview</a></li>
								<li><a href="/guides/install" aria-current="page">Install</a></li>
								<li>
									<details>
										<summary>Deploy</summary>
										<ul role="list">
											<li><a href="/guides/deploy/netlify">Netlify</a></li>
										</ul>
									</details>
								</li>
							</ul>
						</details>
					</li>
					<li><a href="/changelog">Changelog</a></li>
				</ul>
			</nav>
			<nav interop-page-nav aria-label="On this page">
				<ul role="list">
					<li><a href="#install" aria-current="true">Install</a></li>
					<li><a href="#usage">Usage</a></li>
				</ul>
			</nav>
			<nav interop-page-nav itx-orientation="vertical" aria-label="Sections">
				<ul interop-tree role="list">
					<li><a href="#install">Install</a></li>
					<li>
						<a href="#usage" aria-current="true">Usage</a>
						<ul role="list">
							<li><a href="#options">Options</a></li>
						</ul>
					</li>
				</ul>
			</nav>
			<fieldset interop-checkbox-group="chips">
				<legend>Topics</legend>
				<label interop-checkbox><input type="checkbox" name="topic" value="design" checked /> Design</label>
				<label interop-checkbox><input type="checkbox" name="topic" value="code" /> Code</label>
				<label interop-checkbox><input type="checkbox" name="topic" value="ops" disabled /> Operations</label>
			</fieldset>
			<fieldset interop-radio-group="chips" itx-size="sm">
				<legend>Shirt size</legend>
				<label><input type="radio" name="shirt" value="s" checked /> S</label>
				<label><input type="radio" name="shirt" value="m" /> M</label>
			</fieldset>
			<label for="tag-entry">Tags</label>
			<ul interop-tags role="list" aria-label="Selected tags">
				<li>
					Football <button type="button"><span itx-visually-hidden>Remove Football</span><svg interop-icon name="tabler-x"></svg></button
					><input type="hidden" name="tags" value="football" />
				</li>
				<li>
					Cricket
					<button type="button" disabled><span itx-visually-hidden>Remove Cricket</span><svg interop-icon name="tabler-x"></svg></button>
				</li>
			</ul>
			<input id="tag-entry" type="text" />
			<dialog interop-dialog open aria-labelledby="rename-title">
				<header>
					<h2 id="rename-title">Rename file</h2>
					<button interop-button="icon" itx-size="sm" type="button" command="request-close">
						<span itx-visually-hidden>Close</span><svg interop-icon name="tabler-x"></svg>
					</button>
				</header>
				<form method="dialog">
					<label for="file-name">Name</label>
					<input id="file-name" name="file" />
					<footer>
						<button interop-button type="submit" value="cancel" formnovalidate>Cancel</button
						><button interop-button type="submit" value="save">Save</button>
					</footer>
				</form>
			</dialog>
			<div interop-error-summary tabindex="-1">
				<h2>There is a problem</h2>
				<ul>
					<li><a href="#field-email">Enter an email address like name@example.com</a></li>
				</ul>
			</div>
			<form novalidate>
				<div interop-field>
					<label for="field-email">Email address</label>
					<p interop-hint id="field-email-hint">We send the receipt here</p>
					<p interop-error id="field-email-error">Enter an email address like name@example.com</p>
					<input
						interop-input
						id="field-email"
						type="email"
						name="email"
						autocomplete="email"
						aria-invalid="true"
						aria-describedby="field-email-hint field-email-error"
					/>
				</div>
				<div interop-field itx-size="sm">
					<label for="field-cost">Cost, in pounds (optional)</label>
					<div>
						<span interop-unit aria-hidden="true">£</span><input interop-input id="field-cost" name="cost" inputmode="decimal" size="8" />
					</div>
				</div>
				<div interop-field>
					<label for="field-notes">Notes</label>
					<textarea interop-input id="field-notes" name="notes" readonly>Leave at the door</textarea>
				</div>
			</form>
			<label for="city">City</label>
			<select id="city" interop-select name="city">
				<optgroup label="Europe">
					<option>Lisbon</option>
					<option disabled>Oslo</option>
				</optgroup>
				<hr />
				<optgroup label="Asia"><option>Seoul</option></optgroup>
			</select>
			<label for="team">Team</label>
			<select id="team" interop-select size="3" itx-size="sm">
				<option>Design</option>
				<option selected>Engineering</option>
				<option>Research</option>
			</select>
			<fieldset interop-radio-group itx-size="lg" disabled>
				<legend>Size</legend>
				<label><input type="radio" name="size" value="s" /> Small</label>
				<label><input type="radio" name="size" value="l" /> Large</label>
			</fieldset>
			<figure interop-code-block itx-line-numbers language="ts" caption="example.ts" [code]="example"></figure>
		</main>
	`,
})
class Components {
	readonly pressed = signal(true);
	readonly save = () => Promise.resolve();
	readonly unread = { one: 'unread message', other: 'unread messages' };
	readonly example = 'const a = 1;\n\nconst b = 2;\n';
}

// Only what a consumer must write: the helper fills in ids, aria-labelledby, tabindex and hidden.
@Component({
	imports: [InteropTabs],
	template: `
		<div>
			<div interop-tabs>
				<div role="tablist" aria-label="Bound">
					<button type="button" role="tab" aria-controls="bound-a" aria-selected="true">First</button>
					<button type="button" role="tab" aria-controls="bound-b">Second</button>
				</div>
				<section role="tabpanel" id="bound-a"><p>First panel.</p></section>
				<section role="tabpanel" id="bound-b"><a href="/second">Second panel</a></section>
			</div>
		</div>
	`,
})
class BoundTabs {}

// A comment box: a formatting toolbar in named groups, acting on the text area after it.
@Component({
	imports: [InteropToolbar],
	template: `
		<div>
			<div interop-toolbar role="toolbar" focusgroup="toolbar" aria-label="Formatting" aria-controls="bound-comment">
				<div role="group" aria-label="Text">
					<button interop-button="icon" type="button" aria-label="Bold"><svg aria-hidden="true"></svg></button>
					<button interop-button="icon" type="button" aria-label="Italic"><svg aria-hidden="true"></svg></button>
				</div>
				<div role="group" aria-label="Insert">
					<button interop-button="icon" type="button" aria-label="Code"><svg aria-hidden="true"></svg></button>
					<button interop-button="icon" type="button" aria-label="Link" aria-disabled="true"><svg aria-hidden="true"></svg></button>
				</div>
			</div>
			<label for="bound-comment">Comment</label>
			<textarea id="bound-comment"></textarea>
		</div>
	`,
})
class BoundToolbar {}

@Component({
	imports: [InteropStepsForm],
	template: `
		<div>
			<form id="axe-steps" interop-steps-form>
				<ol interop-steps role="list" aria-label="Application progress">
					<li>Details <span itx-visually-hidden data-step-status></span></li>
					<li>Address <span itx-visually-hidden data-step-status></span></li>
				</ol>
				<fieldset id="axe-details">
					<legend><h2>Your details (step 1 of 2)</h2></legend>
					<label>Full name <input name="name" required /></label>
					<button type="button" command="--next" commandfor="axe-steps">Next</button>
				</fieldset>
				<fieldset id="axe-address" hidden>
					<legend><h2>Address (step 2 of 2)</h2></legend>
					<label>Street <input name="street" required /></label>
					<button type="button" command="--back" commandfor="axe-steps">Back</button>
					<button type="submit">Send</button>
				</fieldset>
			</form>
		</div>
	`,
})
class BoundSteps {}

describe('accessibility (axe-core)', () => {
	// A consumer who marks buttons aria-disabled or aria-busy installs the guard, so the fixture does too.
	let unguard: () => void;
	beforeAll(() => (unguard = guardActivation()));
	afterAll(() => unguard());

	// jsdom has no clipboard, and the code block shows its copy button only when there is one.
	beforeEach(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.resolve() }, configurable: true }));
	afterEach(() => Reflect.deleteProperty(navigator, 'clipboard'));

	const render = async () => {
		const fixture = TestBed.createComponent(Components);
		fixture.detectChanges();
		await fixture.whenStable();
		return fixture.nativeElement as HTMLElement;
	};

	it('finds no violations in the components as a consumer writes them', async () => {
		const element = await render();
		expect(element.querySelector('figure[interop-code-block] button')).not.toBeNull();
		expect(await violations(element)).toEqual([]);
	});

	it('finds no violations inside open popovers, tooltips and unselected tab panels', async () => {
		const element = await render();
		reveal(element);
		expect(await violations(element)).toEqual([]);
	});

	it('checks inside an unselected tab panel only once it is shown, so the second pass is needed', async () => {
		document.body.innerHTML = '<main><section role="tabpanel" hidden="until-found"><button type="button"></button></section></main>';
		expect(await violations(document.body)).toEqual([]);
		reveal(document.body);
		expect(await violations(document.body)).toContainEqual(expect.stringMatching(/^button-name:/));
	});

	it('finds no violations in tabs as bindTabs leaves them, from the minimal markup', async () => {
		const fixture = TestBed.createComponent(BoundTabs);
		fixture.detectChanges();
		TestBed.tick();
		const element = fixture.nativeElement as HTMLElement;
		const panel = element.querySelector('#bound-b')!;
		expect(panel.getAttribute('aria-labelledby')).toBe(element.querySelector('[aria-controls="bound-b"]')!.id);
		expect(panel.getAttribute('hidden')).toBe('until-found');
		expect(await violations(element)).toEqual([]);
		reveal(element);
		expect(await violations(element)).toEqual([]);
	});

	it('finds no violations in a toolbar as bindToolbar leaves it', async () => {
		const fixture = TestBed.createComponent(BoundToolbar);
		fixture.detectChanges();
		TestBed.tick();
		const element = fixture.nativeElement as HTMLElement;
		const buttons = Array.from(element.querySelectorAll('button'), (button) => button.tabIndex);
		expect(buttons).toEqual([0, -1, -1, -1]);
		expect(await violations(element)).toEqual([]);
	});

	it('finds no violations in a multi-step form as bindSteps leaves it, with every step shown', async () => {
		const fixture = TestBed.createComponent(BoundSteps);
		fixture.detectChanges();
		TestBed.tick();
		const element = fixture.nativeElement as HTMLElement;
		expect(element.querySelector('li[aria-current="step"]')?.textContent).toContain('current');
		expect(await violations(element)).toEqual([]);
		element.querySelectorAll('fieldset[hidden]').forEach((step) => step.removeAttribute('hidden'));
		expect(await violations(element)).toEqual([]);
	});

	it('finds no violations in forms as the field helpers leave them, after a failed submit', async () => {
		document.body.innerHTML = `
			<main>
				<div interop-error-summary hidden><h2>There is a problem</h2><ul></ul></div>
				<form>
					<div interop-field>
						<label for="h-email">Email address</label>
						<p interop-hint id="h-email-hint">For the receipt</p>
						<p interop-error hidden></p>
						<input interop-input id="h-email" type="email" name="email" autocomplete="email" required aria-describedby="h-email-hint" />
					</div>
					<fieldset interop-radio-group>
						<legend>Delivery</legend>
						<p interop-error hidden></p>
						<label><input type="radio" name="delivery" value="post" required /> Post</label>
						<label><input type="radio" name="delivery" value="collect" /> Collect</label>
					</fieldset>
					<div interop-field>
						<label for="h-summary">Summary</label>
						<p interop-error hidden></p>
						<textarea interop-input id="h-summary" name="summary"></textarea>
						<p interop-count></p>
					</div>
					<div interop-field>
						<label for="h-password">Password</label>
						<div>
							<input interop-input id="h-password" type="password" name="password" autocomplete="current-password" />
							<button interop-button type="button" commandfor="h-password" command="--toggle-password" aria-pressed="false" hidden>Show password</button>
						</div>
					</div>
					<div interop-field>
						<label for="h-tag">Skills</label>
						<p interop-error hidden></p>
						<ul interop-tags role="list" aria-label="Skills">
							<li>CSS <button type="button"><span itx-visually-hidden>Remove CSS</span></button></li>
							<li>HTML <button type="button"><span itx-visually-hidden>Remove HTML</span></button></li>
						</ul>
						<input interop-input id="h-tag" type="text" />
					</div>
					<fieldset interop-checkbox-group>
						<legend>Notifications</legend>
						<label interop-checkbox><input type="checkbox" id="h-all" /> All</label>
						<label interop-checkbox><input type="checkbox" name="n" value="email" checked /> Email</label>
						<label interop-checkbox><input type="checkbox" name="n" value="sms" /> Text</label>
					</fieldset>
					<button interop-button type="submit">Send</button>
				</form>
			</main>`;
		const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;
		const form = $<HTMLFormElement>('form');
		const summary = $<HTMLElement>('[interop-error-summary]');
		const textarea = $<HTMLTextAreaElement>('#h-summary');
		const password = $<HTMLInputElement>('#h-password');
		const unbind = [
			bindValidation(form, { summary }),
			bindCharacterCount(textarea, {
				limit: 5,
				count: textarea.nextElementSibling as HTMLElement,
			}),
			bindPasswordToggle(password),
			bindTagInput($<HTMLInputElement>('#h-tag'), {
				list: $<HTMLElement>('ul[interop-tags]'),
				required: 'Add a skill',
			}),
			bindSelectAll($<HTMLInputElement>('#h-all')),
		];
		textarea.value = 'Too long';
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
		password.dispatchEvent(
			Object.assign(new Event('command'), { command: '--toggle-password', source: $('[command="--toggle-password"]') }),
		);
		$('ul[interop-tags] > li')!.remove();
		await new Promise((resolve) => setTimeout(resolve));
		form.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));

		// The states these fixtures are for.
		expect(summary.hidden).toBe(false);
		expect($('#h-email').getAttribute('aria-invalid')).toBe('true');
		expect($('[command="--toggle-password"]').getAttribute('aria-pressed')).toBe('true');
		expect($<HTMLInputElement>('#h-all').indeterminate).toBe(true);
		expect(await violations(document.body)).toEqual([]);
		unbind.forEach((off) => off());
	});

	it('checks inside a popover only once it is open, so the second pass is needed', async () => {
		document.body.innerHTML = '<main><div popover><button type="button"></button></div></main>';
		expect(await violations(document.body)).toEqual([]);
		reveal(document.body);
		expect(await violations(document.body)).toContainEqual(expect.stringMatching(/^button-name:/));
	});

	it('catches an icon button with no label, so the gate is real', async () => {
		document.body.innerHTML = '<main><button type="button"><svg aria-hidden="true"></svg></button></main>';
		expect(await violations(document.body)).toContainEqual(expect.stringMatching(/^button-name:/));
	});

	it('leaves the mixed state to the browser, with no aria-checked', async () => {
		const element = await render();
		const mixed = element.querySelector<HTMLInputElement>('[interop-checkbox-group] input')!;
		expect(mixed.indeterminate).toBe(true);
		expect(element.querySelector('input[aria-checked]')).toBeNull();
	});

	it('catches a checkbox with no label', async () => {
		document.body.innerHTML = '<main><input type="checkbox"></main>';
		expect(await violations(document.body)).toContainEqual(expect.stringMatching(/^label:/));
	});

	it('catches a radio with no label', async () => {
		document.body.innerHTML = '<main><fieldset><legend>Size</legend><input type="radio" name="s"></fieldset></main>';
		expect(await violations(document.body)).toContainEqual(expect.stringMatching(/^label:/));
	});

	it('catches a switch with no label', async () => {
		document.body.innerHTML = '<main><input type="checkbox" role="switch"></main>';
		expect(await violations(document.body)).toContainEqual(expect.stringMatching(/^aria-toggle-field-name:|^label:/));
	});
});
