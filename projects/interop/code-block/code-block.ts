import {
	Component,
	DestroyRef,
	ElementRef,
	HostAttributeToken,
	afterRenderEffect,
	computed,
	inject,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { registerIcons, scopeSelectAll, splitLines, watchInteropInDevMode } from 'interop';
import { getLanguage, highlightCode } from 'interop/highlight';
import { InteropIcon } from 'interop/icon';
import { TablerCheck, TablerCopy } from 'interop/tabler';
import { InteropTooltip } from 'interop/tooltip';

let nextId = 0;

/**
 * A block of code with a caption, a copy button and syntax colors:
 *
 * ```html
 * <figure interop-code-block language="ts" caption="badge.ts" [code]="source"></figure>
 * ```
 *
 * `itx-line-numbers` numbers the lines and `itx-wrap` wraps long ones. Colors need the language
 * registered with `registerLanguages()` from `interop/highlight`; without it the code shows plain.
 */
@Component({
	selector: 'figure[interop-code-block]',
	imports: [InteropIcon, InteropTooltip],
	template: `
		@if (caption()) {
			<figcaption [id]="captionId">{{ caption() }}</figcaption>
		}
		@if (canCopy) {
			<button interop-button type="button" itx-size="sm" [interopTooltip]="copyLabel" (click)="copy()">
				<svg interop-icon [name]="copied() ? 'tabler-check' : 'tabler-copy'"></svg>
			</button>
			<span interop-tooltip="label" #copyLabel>Copy code</span>
		}
		<!--
			TODO: An overflowing block is focusable but has no name. Look deeper at naming it.
			role="region" with aria-labelledby gives it one, but makes every scrolling block a landmark.
		-->
		<pre #pre [attr.tabindex]="overflowing() ? 0 : null"><code
			#codeElement
			[class]="language() ? 'language-' + language() : ''"
			[textContent]="code()"
		></code></pre>
		<span itx-visually-hidden role="status">{{ status() }}</span>
	`,
	host: {
		'[attr.aria-labelledby]': 'caption() ? captionId : null',
		'[style.--itx-code-block-gutter-inline-size]': 'gutter()',
	},
})
export class InteropCodeBlock {
	readonly code = input.required<string>();
	/** A language registered with `registerLanguages()`, e.g. `ts`. */
	readonly language = input<string>();
	/** Names the block. Defaults to the registered label of its language. */
	readonly captionText = input<string | undefined>(undefined, { alias: 'caption' });

	protected readonly captionId = `itx-code-block-${nextId++}`;
	protected readonly caption = computed(() => {
		const language = this.language();
		return this.captionText() ?? (language ? getLanguage(language)?.label : undefined);
	});

	private readonly numbered = inject(new HostAttributeToken('itx-line-numbers'), { optional: true }) !== null;
	protected readonly gutter = computed(() =>
		this.numbered ? `${Math.max(2, String(this.code().split('\n').length).length)}ch` : null,
	);

	protected readonly canCopy = typeof navigator !== 'undefined' && !!navigator.clipboard?.writeText;
	protected readonly copied = signal(false);
	protected readonly status = signal('');
	protected readonly overflowing = signal(false);

	private readonly pre = viewChild.required<ElementRef<HTMLPreElement>>('pre');
	private readonly codeElement = viewChild.required<ElementRef<HTMLElement>>('codeElement');
	private resetCopied?: ReturnType<typeof setTimeout>;

	constructor() {
		watchInteropInDevMode();
		registerIcons(TablerCopy, TablerCheck);
		const destroyRef = inject(DestroyRef);
		if (typeof document !== 'undefined') scopeSelectAll();

		let removeColors = () => {};
		let run = 0;
		afterRenderEffect(() => {
			this.code();
			this.language();
			const code = this.codeElement().nativeElement;
			const current = ++run;
			removeColors();
			removeColors = () => {};
			if (this.numbered) splitLines(code);
			this.measure();
			highlightCode(code).then((remove) => {
				if (current === run) removeColors = remove;
				else remove();
			});
		});

		if (typeof ResizeObserver !== 'undefined') {
			const observer = new ResizeObserver(() => this.measure());
			afterRenderEffect(() => {
				observer.disconnect();
				observer.observe(this.pre().nativeElement);
				observer.observe(this.codeElement().nativeElement);
			});
			destroyRef.onDestroy(() => observer.disconnect());
		}

		destroyRef.onDestroy(() => {
			run++;
			removeColors();
			clearTimeout(this.resetCopied);
		});
	}

	protected async copy(): Promise<void> {
		clearTimeout(this.resetCopied);
		try {
			await navigator.clipboard.writeText(this.code());
			this.copied.set(true);
			this.status.set('Copied');
		} catch (error) {
			this.status.set('Couldn’t copy');
			(globalThis.reportError ?? console.error)(error);
		}
		this.resetCopied = setTimeout(() => {
			this.copied.set(false);
			this.status.set('');
		}, 2000);
	}

	private measure(): void {
		const pre = this.pre().nativeElement;
		this.overflowing.set(pre.scrollWidth > pre.clientWidth || pre.scrollHeight > pre.clientHeight);
	}
}
