import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { registerIcons } from 'interop';
import { InteropIcon } from './icon';

registerIcons({
	name: 'test-icon',
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	paths: [{ d: 'M1 1' }, { d: 'M2 2', fill: 'currentColor' }],
});

@Component({
	imports: [InteropIcon],
	template: `
		<svg id="named" interop-icon [name]="name()"></svg>
		<svg id="sized" interop-icon name="test-icon" size="20"></svg>
		<svg id="labelled" interop-icon name="test-icon" aria-label="Done"></svg>
		<svg id="own" interop-icon viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" /></svg>
		<svg id="bound" interop-icon name="test-icon" [attr.aria-label]="label()"></svg>
	`,
})
class Host {
	readonly name = signal('test-icon');
	readonly label = signal<string | null>(null);
}

describe('InteropIcon', () => {
	const setup = () => {
		const fixture = TestBed.createComponent(Host);
		fixture.detectChanges();
		const get = (id: string) => (fixture.nativeElement as HTMLElement).querySelector(`#${id}`) as SVGSVGElement;
		return { fixture, get };
	};

	it('draws the named icon as SVG paths', () => {
		const { get } = setup();
		const paths = get('named').querySelectorAll('path');
		expect(paths.length).toBe(2);
		expect(paths[0]!.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(paths[0]!.getAttribute('d')).toBe('M1 1');
		expect(paths[1]!.getAttribute('fill')).toBe('currentColor');
		expect(paths[0]!.hasAttribute('fill')).toBe(false);
		expect(get('named').getAttribute('viewBox')).toBe('0 0 24 24');
	});

	it('is hidden from assistive technology by default', () => {
		const { get } = setup();
		expect(get('named').getAttribute('aria-hidden')).toBe('true');
		expect(get('named').hasAttribute('role')).toBe(false);
	});

	it('is an image when it has a label', () => {
		const { get } = setup();
		expect(get('labelled').getAttribute('role')).toBe('img');
		expect(get('labelled').hasAttribute('aria-hidden')).toBe(false);
	});

	it('follows a label added or removed through a binding', async () => {
		const { fixture, get } = setup();
		expect(get('bound').getAttribute('aria-hidden')).toBe('true');
		fixture.componentInstance.label.set('Done');
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
		expect(get('bound').getAttribute('role')).toBe('img');
		expect(get('bound').hasAttribute('aria-hidden')).toBe(false);
		fixture.componentInstance.label.set(null);
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
		expect(get('bound').getAttribute('aria-hidden')).toBe('true');
	});

	it('fixes its size in pixels when size is set, and leaves the default otherwise', () => {
		const { get } = setup();
		expect(get('sized').style.getPropertyValue('--itx-icon-inline-size')).toBe('20px');
		expect(get('sized').style.getPropertyValue('--itx-icon-block-size')).toBe('20px');
		expect(get('named').style.getPropertyValue('--itx-icon-inline-size')).toBe('');
	});

	it('leaves the consumer’s own SVG alone when there is no name', () => {
		const { get } = setup();
		expect(get('own').querySelector('circle')).not.toBeNull();
		expect(get('own').getAttribute('viewBox')).toBe('0 0 10 10');
	});

	it('draws nothing and warns for an unregistered name', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { fixture, get } = setup();
		fixture.componentInstance.name.set('test-unknown');
		fixture.detectChanges();
		TestBed.tick();
		expect(get('named').querySelector('path')).toBeNull();
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('"test-unknown" is not registered'));
		warn.mockRestore();
	});
});
