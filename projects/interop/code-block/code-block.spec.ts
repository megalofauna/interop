import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { registerLanguages } from 'interop/highlight';
import { InteropCodeBlock } from './code-block';

registerLanguages({ json: { label: 'JSON', load: () => import('shiki/langs/json.mjs') } });

@Component({
	imports: [InteropCodeBlock],
	template: `
		<figure interop-code-block id="captioned" language="json" caption="package.json" [code]="source()"></figure>
		<figure interop-code-block id="labelled" language="json" [code]="source()"></figure>
		<figure interop-code-block id="numbered" itx-line-numbers [code]="source()"></figure>
	`,
})
class Host {
	readonly source = signal('{\n\t"name": "interop"\n}\n');
}

describe('InteropCodeBlock', () => {
	const setup = () => {
		const fixture = TestBed.createComponent(Host);
		fixture.detectChanges();
		const get = (id: string) => (fixture.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLElement;
		return { fixture, get };
	};
	afterEach(() => Reflect.deleteProperty(navigator, 'clipboard'));

	it('shows the code as its exact text', () => {
		const { get, fixture } = setup();
		const code = get('captioned').querySelector('pre > code')!;
		expect(code.textContent).toBe(fixture.componentInstance.source());
		expect(code.className).toBe('language-json');
	});

	it('is named by its caption, or by the label of its language', () => {
		const { get } = setup();
		for (const [id, name] of [['captioned', 'package.json'], ['labelled', 'JSON']]) {
			const figure = get(id);
			const caption = figure.querySelector('figcaption')!;
			expect(caption.textContent).toBe(name);
			expect(figure.getAttribute('aria-labelledby')).toBe(caption.id);
		}
	});

	it('numbers lines and keeps the exact text', () => {
		const { get, fixture } = setup();
		const code = get('numbered').querySelector('code')!;
		expect(code.querySelectorAll('[itx-code-line]').length).toBe(3);
		expect(code.textContent).toBe(fixture.componentInstance.source());
		fixture.componentInstance.source.set('a\nb\n');
		fixture.detectChanges();
		expect(code.querySelectorAll('[itx-code-line]').length).toBe(2);
		expect(code.textContent).toBe('a\nb\n');
	});

	it('copies the code and says so once, outside the button', async () => {
		const writeText = vi.fn(() => Promise.resolve());
		Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
		const { get, fixture } = setup();
		const figure = get('captioned');
		const button = figure.querySelector('button')!;
		const name = () => document.getElementById(button.getAttribute('aria-labelledby')!)!.textContent;
		expect(name()).toBe('Copy code');
		button.click();
		await fixture.whenStable();
		fixture.detectChanges();
		expect(writeText).toHaveBeenCalledWith(fixture.componentInstance.source());
		expect(figure.querySelector('[role="status"]')!.textContent).toBe('Copied');
		expect(name()).toBe('Copy code');
		expect(button.querySelector('[role="status"]')).toBeNull();
	});

	it('has no copy button without a clipboard', () => {
		const { get } = setup();
		expect(get('captioned').querySelector('button')).toBeNull();
	});

	it('is focusable only while the code overflows', () => {
		const { get, fixture } = setup();
		const pre = get('captioned').querySelector('pre')!;
		expect(pre.hasAttribute('tabindex')).toBe(false);
		Object.defineProperty(pre, 'scrollHeight', { value: 900, configurable: true });
		Object.defineProperty(pre, 'clientHeight', { value: 300, configurable: true });
		fixture.componentInstance.source.set('{}\n');
		fixture.detectChanges();
		fixture.detectChanges();
		expect(pre.getAttribute('tabindex')).toBe('0');
	});
});
