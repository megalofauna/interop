import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InteropTabs } from './tabs';

@Component({
	imports: [InteropTabs],
	template: `
		<div interop-tabs [activation]="activation()" (interop-tabs-change)="changes.push($any($event).detail.panel.id)">
			<div role="tablist" aria-label="Sections">
				<button type="button" role="tab" aria-controls="a" aria-selected="true">A</button>
				<button type="button" role="tab" aria-controls="b" aria-selected="false" tabindex="-1">B</button>
			</div>
			<section role="tabpanel" id="a">A</section>
			<section role="tabpanel" id="b" hidden="until-found">B</section>
		</div>
	`,
})
class Host {
	readonly activation = signal<'automatic' | 'manual'>('automatic');
	readonly changes: string[] = [];
}

describe('InteropTabs', () => {
	const setup = () => {
		const fixture = TestBed.createComponent(Host);
		fixture.detectChanges();
		TestBed.tick();
		const el = fixture.nativeElement as HTMLElement;
		const tab = (key: string) => el.querySelector<HTMLElement>(`[aria-controls="${key}"]`)!;
		const arrow = () => {
			tab('a').focus();
			tab('a').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		};
		return { fixture, tab, arrow };
	};

	it('binds the tabs, and reports a change through the event', () => {
		const { fixture, tab, arrow } = setup();
		expect(tab('a').id).toMatch(/^itx-tab-/);
		arrow();
		expect(tab('b').getAttribute('aria-selected')).toBe('true');
		expect(fixture.componentInstance.changes).toEqual(['b']);
	});

	it('rebinds when the activation changes', () => {
		const { fixture, tab, arrow } = setup();
		fixture.componentInstance.activation.set('manual');
		TestBed.tick();
		arrow();
		expect([document.activeElement, tab('b').getAttribute('aria-selected')]).toEqual([tab('b'), 'false']);
	});
});
