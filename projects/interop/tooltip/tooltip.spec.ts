import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InteropTooltip } from './tooltip';

@Component({
	imports: [InteropTooltip],
	template: `
		<button id="label" type="button" [interopTooltip]="close">×</button>
		<span interop-tooltip="label" #close>Close</span>
		<button id="by-id" type="button" [interopTooltip]="target()">Save</button>
		<span interop-tooltip id="draft">Saves a draft</span>
		<span interop-tooltip id="publish">Publishes the page</span>
	`,
})
class Host {
	readonly target = signal<string | null>('draft');
}

describe('InteropTooltip', () => {
	const setup = () => {
		const fixture = TestBed.createComponent(Host);
		fixture.detectChanges();
		TestBed.tick();
		const el = fixture.nativeElement as HTMLElement;
		return { fixture, get: (id: string) => el.querySelector(`#${id}`) as HTMLElement };
	};

	it('names the trigger with a label tooltip', () => {
		const { get } = setup();
		const tooltip = document.querySelector('[interop-tooltip="label"]')!;
		expect(get('label').getAttribute('aria-labelledby')).toBe(tooltip.id);
		expect(tooltip.getAttribute('role')).toBe('tooltip');
		expect(tooltip.getAttribute('popover')).toBe('hint');
	});

	it('describes the trigger by ID, and follows a change of tooltip', () => {
		const { fixture, get } = setup();
		expect(get('by-id').getAttribute('aria-describedby')).toBe('draft');
		fixture.componentInstance.target.set('publish');
		TestBed.tick();
		expect(get('by-id').getAttribute('aria-describedby')).toBe('publish');
		fixture.componentInstance.target.set(null);
		TestBed.tick();
		expect(get('by-id').hasAttribute('aria-describedby')).toBe(false);
	});
});
