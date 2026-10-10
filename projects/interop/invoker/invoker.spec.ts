import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InteropInvoker } from './invoker';

@Component({
	imports: [InteropInvoker],
	template: `
		<dialog #dialog></dialog>
		<button id="by-element" command="show-modal" [commandFor]="dialog">Open</button>
		<button id="by-id" command="show-modal" [commandFor]="'confirm'">Open</button>
		<div popover #menu></div>
		<button id="popover" [popoverTarget]="menu">Menu</button>
		<button id="pending" [pendingAction]="action()">Save</button>
		<button id="plain">Plain</button>
	`,
})
class Host {
	readonly action = signal<(() => Promise<unknown>) | null>(null);
}

describe('InteropInvoker', () => {
	const setup = () => {
		const fixture = TestBed.createComponent(Host);
		fixture.detectChanges();
		const el = fixture.nativeElement as HTMLElement;
		const get = (id: string) => el.querySelector(`#${id}`) as HTMLButtonElement & Record<string, unknown>;
		return { fixture, el, get };
	};

	it('targets an element with no ID', () => {
		const { el, get } = setup();
		expect(get('by-element')['commandForElement']).toBe(el.querySelector('dialog'));
		expect(get('by-element').hasAttribute('commandfor')).toBe(false);
	});

	it('targets an ID with the attribute, as plain HTML does', () => {
		const { get } = setup();
		expect(get('by-id').getAttribute('commandfor')).toBe('confirm');
	});

	it('targets a popover', () => {
		const { el, get } = setup();
		expect(get('popover')['popoverTargetElement']).toBe(el.querySelector('[popover]'));
	});

	it('binds a pending action, and rebinds when it changes', async () => {
		const { fixture, get } = setup();
		let release!: () => void;
		fixture.componentInstance.action.set(() => new Promise<void>((r) => (release = r)));
		fixture.detectChanges();
		get('pending').click();
		expect(get('pending').getAttribute('aria-busy')).toBe('true');
		release();
		await new Promise((r) => setTimeout(r));
		expect(get('pending').hasAttribute('aria-busy')).toBe(false);
	});

	it('leaves other buttons alone', () => {
		const { get } = setup();
		expect(get('plain')['commandForElement']).toBeUndefined();
	});
});
