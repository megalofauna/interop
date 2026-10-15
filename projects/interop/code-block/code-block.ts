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
import { announce, registerIcons, scopeSelectAll, splitLines } from 'interop';
import { getLanguage, highlightCode } from 'interop/highlight';
import { InteropIcon } from 'interop/icon';
import { InteropScrollArea } from 'interop/scroll-area';
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
	imports: [InteropIcon, InteropScrollArea, InteropTooltip],
	template: `
		@if (caption()) {
			<figcaption [id]="captionId">{{ caption() }}</figcaption>
		}
		@if (canCopy) {
			<!-- The caption joins the name, so each block's button says which code it copies. -->
			<button
				interop-button
				type="button"
				itx-size="sm"
				[interopTooltip]="copyLabel"
				[attr.aria-labelledby]="caption() ? copyLabelId + ' ' + captionId : copyLabelId"
				(click)="copy()"
			>
				<svg interop-icon [name]="copied() ? 'tabler-check' : 'tabler-copy'"></svg>
			</button>
			<span interop-tooltip="label" [id]="copyLabelId" #copyLabel>Copy code</span>
		}
		<!--
			TODO: An overflowing block is focusable but has no name of its own. The figure around it has
			one, which screen readers usually announce as focus enters it. Confirm that with VoiceOver and NVDA.
		-->
		<pre interop-scroll-area><code
			#codeElement
			[class]="language() ? 'language-' + language() : ''"
			[textContent]="code()"
		></code></pre>
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
	protected readonly copyLabelId = `${this.captionId}-copy`;
	protected readonly caption = computed(() => {
		const language = this.language();
		return this.captionText() ?? (language ? getLanguage(language)?.label : undefined);
	});

	private readonly numbered = inject(new HostAttributeToken('itx-line-numbers'), { optional: true }) !== null;
	protected readonly gutter = computed(() => (this.numbered ? `${Math.max(2, String(this.code().split('\n').length).length)}ch` : null));

	protected readonly canCopy = typeof navigator !== 'undefined' && !!navigator.clipboard?.writeText;
	protected readonly copied = signal(false);
	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

	private readonly codeElement = viewChild.required<ElementRef<HTMLElement>>('codeElement');
	private resetCopied?: ReturnType<typeof setTimeout>;

	constructor() {
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
			highlightCode(code).then((remove) => {
				if (current === run) removeColors = remove;
				else remove();
			});
		});

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
			announce('Copied', { from: this.host });
		} catch (error) {
			announce('Couldn’t copy', { from: this.host });
			(globalThis.reportError ?? console.error)(error);
		}
		this.resetCopied = setTimeout(() => {
			this.copied.set(false);
		}, 2000);
	}
}
