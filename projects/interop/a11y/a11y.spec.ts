import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { guardActivation, registerIcons } from 'interop';
import { InteropBadge } from 'interop/badge';
import { InteropCodeBlock } from 'interop/code-block';
import { InteropIcon } from 'interop/icon';
import { InteropInvoker } from 'interop/invoker';
import { InteropScrollArea } from 'interop/scroll-area';
import { InteropTooltip } from 'interop/tooltip';
import { TablerCheck, TablerCopy, TablerSearch, TablerX } from 'interop/tabler';

registerIcons(TablerCheck, TablerCopy, TablerSearch, TablerX);

// jsdom computes no colors, so styles/contrast.spec.ts checks contrast from the declared values instead.
const OPTIONS: axe.RunOptions = { rules: { 'color-contrast': { enabled: false } } };

const violations = async (element: Element) =>
	(await axe.run(element, OPTIONS)).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(', ')}`);

// jsdom has no popover API, so a popover never opens and axe skips everything inside it.
// Removing the attribute shows the content, which is what opening it does.
const openPopovers = (element: Element) => element.querySelectorAll('[popover]').forEach((popover) => popover.removeAttribute('popover'));

@Component({
	imports: [InteropBadge, InteropCodeBlock, InteropIcon, InteropInvoker, InteropScrollArea, InteropTooltip],
	template: `
		<main>
			<button interop-button type="button">Save</button>
			<button interop-button type="button" itx-size="sm"><svg interop-icon name="tabler-copy"></svg>Copy</button>
			<button interop-button type="button" aria-label="Search"><svg interop-icon name="tabler-search"></svg></button>
			<button interop-button type="button"><svg interop-icon name="tabler-check" aria-label="Done"></svg></button>
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
			<button interop-button type="button" [interopTooltip]="close"><svg interop-icon name="tabler-x"></svg></button>
			<span interop-tooltip="label" #close>Close</span>
			<button interop-button type="button" [interopTooltip]="draft">Save draft</button>
			<span interop-tooltip #draft>Saves without publishing</span>
			<button interop-button type="button" [popoverTarget]="menu">Options</button>
			<div interop-popover popover #menu>
				<p>Popover content</p>
				<button interop-button type="button" aria-label="Remove"><svg interop-icon name="tabler-x"></svg></button>
			</div>
			<h2 id="notes">Notes</h2>
			<div interop-scroll-area aria-labelledby="notes"><p>Note one.</p><p>Note two.</p></div>
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
				<label><input type="radio" name="align" value="start" checked /><svg interop-icon name="tabler-check"></svg><span itx-visually-hidden>Start</span></label>
				<label><input type="radio" name="align" value="end" /><svg interop-icon name="tabler-x"></svg><span itx-visually-hidden>End</span></label>
			</fieldset>
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

	it('finds no violations inside open popovers and tooltips', async () => {
		const element = await render();
		openPopovers(element);
		expect(await violations(element)).toEqual([]);
	});

	it('checks inside a popover only once it is open, so the second pass is needed', async () => {
		document.body.innerHTML = '<main><div popover><button type="button"></button></div></main>';
		expect(await violations(document.body)).toEqual([]);
		openPopovers(document.body);
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
