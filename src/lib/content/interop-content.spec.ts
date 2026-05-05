import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { parse } from '@djot/djot';
import { InteropContent } from './interop-content';
import {
	provideContentDivRenderers,
	provideContentSymbolRenderer,
} from './content-renderers';
import type { ContentNode, Div, Symb } from './content-node';

const firstDiv = (src: string): Div => {
	const ast = parse(src);
	const div = ast.children.find((c) => c.tag === 'div');
	if (!div || div.tag !== 'div') {
		throw new Error('Sample source must contain a top-level :::-div');
	}
	return div;
};

@Component({
	standalone: true,
	imports: [InteropContent],
	template: `<interop-content [node]="node()" />`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
	readonly node = signal<ContentNode | null>(null);
}

@Component({
	standalone: true,
	template: `<aside data-testid="callout">callout: {{ node().attributes?.id }}</aside>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class CalloutRenderer {
	readonly node = input.required<Div>();
}

@Component({
	standalone: true,
	template: `<i data-testid="icon" [attr.data-name]="node().alias"></i>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class IconSymbolRenderer {
	readonly node = input.required<Symb>();
}

const setup = async (
	source: string,
	providers: unknown[] = [],
): Promise<ComponentFixture<Host>> => {
	await TestBed.configureTestingModule({
		imports: [Host],
		providers: providers as never,
	}).compileComponents();

	const fixture = TestBed.createComponent(Host);
	fixture.componentInstance.node.set(firstDiv(source));
	fixture.detectChanges();
	return fixture;
};

describe('InteropContent', () => {
	it('renders headings, paragraphs, emphasis, and strong', async () => {
		const fixture = await setup(`{#x}
:::
# Hello

A *strong* and an _italic_ word.
:::`);
		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector('h1')?.textContent).toContain('Hello');
		expect(el.querySelector('strong')?.textContent).toBe('strong');
		expect(el.querySelector('em')?.textContent).toBe('italic');
	});

	it('renders bullet lists, ordered lists, and inline code', async () => {
		const fixture = await setup(`{#x}
:::
- one
- two

1. first
2. second

A \`verbatim\` chunk.
:::`);
		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelectorAll('ul li').length).toBe(2);
		expect(el.querySelectorAll('ol li').length).toBe(2);
		expect(el.querySelector('code')?.textContent).toBe('verbatim');
	});

	it('renders code blocks with language data attribute', async () => {
		const fixture = await setup(`{#x}
:::
\`\`\` ts
const x = 1;
\`\`\`
:::`);
		const code = fixture.nativeElement.querySelector('pre code');
		expect(code).toBeTruthy();
		expect(code.getAttribute('data-lang')).toBe('ts');
		expect(code.textContent).toContain('const x = 1;');
	});

	it('renders block quotes', async () => {
		const fixture = await setup(`{#x}
:::
> a citation
:::`);
		expect(fixture.nativeElement.querySelector('blockquote')).toBeTruthy();
	});

	it('renders links with destination', async () => {
		const fixture = await setup(`{#x}
:::
[home](https://example.com)
:::`);
		const a = fixture.nativeElement.querySelector('a');
		expect(a?.getAttribute('href')).toBe('https://example.com');
		expect(a?.textContent).toContain('home');
	});

	it('renders symbols as ":alias:" text by default', async () => {
		const fixture = await setup(`{#x}
:::
:icon-shield:
:::`);
		expect(fixture.nativeElement.textContent).toContain(':icon-shield:');
	});

	it('routes class-tagged divs through provideContentDivRenderers', async () => {
		const fixture = await setup(
			`{#outer}
:::
::: callout
inner content
:::
:::`,
			[provideContentDivRenderers({ callout: CalloutRenderer })],
		);
		const aside = fixture.nativeElement.querySelector('[data-testid="callout"]');
		expect(aside).toBeTruthy();
	});

	it('routes symbols through provideContentSymbolRenderer', async () => {
		const fixture = await setup(
			`{#x}
:::
:bolt:
:::`,
			[provideContentSymbolRenderer(IconSymbolRenderer)],
		);
		const icon = fixture.nativeElement.querySelector('[data-testid="icon"]');
		expect(icon).toBeTruthy();
		expect(icon.getAttribute('data-name')).toBe('bolt');
	});

	it('applies id and class attributes from block attributes', async () => {
		const fixture = await setup(`{#hero .lead}
:::
hello
:::`);
		const div = fixture.nativeElement.querySelector('div');
		expect(div?.getAttribute('id')).toBe('hero');
		expect(div?.getAttribute('class')).toBe('lead');
	});

	it('renders tables with header rows and alignments', async () => {
		const fixture = await setup(`{#x}
:::
| L  | C  | R  |
|:---|:--:|---:|
| a  | b  | c  |
:::`);
		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector('table')).toBeTruthy();
		expect(el.querySelectorAll('th').length).toBe(3);
		expect(el.querySelectorAll('td').length).toBe(3);
	});
});
