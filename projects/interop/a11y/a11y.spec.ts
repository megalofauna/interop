import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { registerIcons } from 'interop';
import { InteropBadge } from 'interop/badge';
import { InteropIcon } from 'interop/icon';
import { InteropInvoker } from 'interop/invoker';
import { TablerCheck, TablerCopy, TablerSearch } from 'interop/tabler';

registerIcons(TablerCheck, TablerCopy, TablerSearch);

// jsdom computes no colors, so contrast is checked in a browser instead.
const OPTIONS: axe.RunOptions = { rules: { 'color-contrast': { enabled: false } } };

const violations = async (element: Element) =>
	(await axe.run(element, OPTIONS)).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(', ')}`);

@Component({
	imports: [InteropBadge, InteropIcon, InteropInvoker],
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
		</main>
	`,
})
class Components {
	readonly pressed = signal(true);
	readonly save = () => Promise.resolve();
	readonly unread = { one: 'unread message', other: 'unread messages' };
}

describe('accessibility (axe-core)', () => {
	it('finds no violations in the components as a consumer writes them', async () => {
		const fixture = TestBed.createComponent(Components);
		fixture.detectChanges();
		await fixture.whenStable();
		expect(await violations(fixture.nativeElement)).toEqual([]);
	});

	it('catches an icon button with no label, so the gate is real', async () => {
		document.body.innerHTML = '<main><button type="button"><svg aria-hidden="true"></svg></button></main>';
		expect(await violations(document.body)).toContainEqual(expect.stringMatching(/^button-name:/));
	});
});
