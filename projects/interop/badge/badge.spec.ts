import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InteropBadge, type BadgeLabel } from './badge';

@Component({
	imports: [InteropBadge],
	template: `
		<span interop-badge id="status">Beta</span>
		<span interop-badge id="count" [count]="count()" [label]="label"></span>
		<span interop-badge id="announced" announce [count]="count()" [label]="label"></span>
		<span interop-badge id="capped" [count]="120" [label]="label"></span>
		<span interop-badge="dot" id="dot" [count]="3" [label]="label"></span>
		<span interop-badge="dot" id="status-dot">New activity</span>
		<span interop-badge id="role" itx-color="danger">Failed</span>
		<span interop-badge id="custom" itx-color="rebeccapurple">Custom</span>
		<span id="attribute" interop-badge [count]="2" label="items"></span>
	`,
})
class Host {
	readonly count = signal(1);
	readonly label: BadgeLabel = { one: 'unread message', other: 'unread messages' };
}

describe('InteropBadge', () => {
	const setup = () => {
		const fixture = TestBed.createComponent(Host);
		fixture.detectChanges();
		const get = (id: string) => (fixture.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLElement;
		const shown = (id: string) => get(id).querySelector('[aria-hidden="true"]')?.textContent?.trim() ?? null;
		const spoken = (id: string) => get(id).querySelector('[itx-visually-hidden]')?.textContent?.trim() ?? null;
		return { fixture, get, shown, spoken };
	};

	it('shows its own content when there is no count', () => {
		const { get } = setup();
		expect(get('status').textContent?.trim()).toBe('Beta');
		expect(get('status').querySelector('[aria-hidden]')).toBeNull();
	});

	it('shows the number and speaks it with the plural form that fits', () => {
		const { fixture, shown, spoken } = setup();
		expect(shown('count')).toBe('1');
		expect(spoken('count')).toBe('1 unread message');
		fixture.componentInstance.count.set(3);
		fixture.detectChanges();
		expect(spoken('count')).toBe('3 unread messages');
	});

	it('announces through a separate live region only when asked', () => {
		const { fixture, get } = setup();
		expect(get('count').querySelector('[role="status"]')).toBeNull();
		const live = () => get('announced').querySelector('[role="status"]');
		expect(live()?.textContent?.trim()).toBe('1 unread message');
		expect(get('announced').hasAttribute('role')).toBe(false);
		fixture.componentInstance.count.set(4);
		fixture.detectChanges();
		expect(live()?.textContent?.trim()).toBe('4 unread messages');
	});

	it('caps the visible number at max and speaks the real count', () => {
		const { shown, spoken } = setup();
		expect(shown('capped')).toBe('99+');
		expect(spoken('capped')).toBe('120 unread messages');
	});

	it('shows nothing at zero', () => {
		const { fixture, get } = setup();
		fixture.componentInstance.count.set(0);
		fixture.detectChanges();
		expect(get('count').hasAttribute('hidden')).toBe(true);
		expect(get('count').textContent?.trim()).toBe('');
	});

	it('draws a dot that keeps its spoken text', () => {
		const { get, shown, spoken } = setup();
		expect(get('dot').getAttribute('interop-badge')).toBe('dot');
		expect(shown('dot')).toBeNull();
		expect(spoken('dot')).toBe('3 unread messages');
		expect(spoken('status-dot')).toBe('New activity');
	});

	it('leaves a role color to the CSS and applies any other color directly', () => {
		const { get } = setup();
		expect(get('role').style.getPropertyValue('--itx-badge-background-color')).toBe('');
		expect(get('custom').style.getPropertyValue('--itx-badge-background-color')).toBe('rebeccapurple');
	});

	it('works as an attribute on any element, with a plain label', () => {
		const { spoken } = setup();
		expect(spoken('attribute')).toBe('2 items');
	});
});
