import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InteropStepsForm } from './steps';

@Component({
	imports: [InteropStepsForm],
	template: `
		<form id="spec-steps" interop-steps-form [history]="history()" (interop-steps-change)="changes.push($any($event).detail.step.id)">
			<fieldset id="one">
				<legend>One</legend>
				<input name="a" />
			</fieldset>
			<fieldset id="two" hidden><legend>Two</legend></fieldset>
		</form>
	`,
})
class Host {
	readonly history = signal(false);
	readonly changes: string[] = [];
}

describe('InteropStepsForm', () => {
	it('binds the form, and reports a step change through the event', () => {
		const fixture = TestBed.createComponent(Host);
		fixture.detectChanges();
		TestBed.tick();
		const form = (fixture.nativeElement as HTMLElement).querySelector('form')!;
		form.dispatchEvent(Object.assign(new Event('command'), { command: '--next', source: null }));
		expect(form.querySelector<HTMLFieldSetElement>('#two')!.hidden).toBe(false);
		expect(fixture.componentInstance.changes).toEqual(['two']);
	});
});
