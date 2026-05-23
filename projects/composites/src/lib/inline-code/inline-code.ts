import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	computed,
	effect,
	inject,
	input,
	isDevMode,
	signal,
} from "@angular/core";
import {
	InteropButton,
	InteropButtonActivation,
	InteropIcon,
	INTEROP_HIGHLIGHTER,
	type ActivationOptions,
	type HighlightedLine,
	provideInteropIcons,
} from "interop";
import { TablerCheck } from "interop/lib/iconsets/tabler/outline/tabler-check";
import { TablerCopy } from "interop/lib/iconsets/tabler/outline/tabler-copy";

/**
 * InlineCode — Single-line inline code with copy button.
 *
 * Phrasing-level companion to `CodeBlock`. Renders a `<code>` element
 * containing syntax-highlighted code followed by a small copy button. Sits
 * inline next to other content.
 *
 * Resolves its source text in this order:
 *   1. `[line]` — explicit pre-tokenized input (escape hatch, no highlighter call)
 *   2. `[code]` — explicit string input, auto-highlighted when `language` is set
 *   3. Projected `<ng-content>` — text content read after first render
 *
 * When `language` is set and a highlighter is registered via
 * `provideHighlighter()`, the component auto-tokenizes. With a warm
 * highlighter (post-`preload()`), this is synchronous — no flash. With a cold
 * highlighter, the projected text renders unstyled until tokens resolve.
 *
 * @example Magical
 * ```html
 * <itx-inline-code language="html">&lt;button&gt;Save&lt;/button&gt;</itx-inline-code>
 * ```
 *
 * @example Explicit string
 * ```html
 * <itx-inline-code language="ts" code="const x = 1;" />
 * ```
 *
 * @example Pre-tokenized escape hatch
 * ```html
 * <itx-inline-code [line]="tokens" />
 * ```
 *
 * @example Plain (no highlighter, no language)
 * ```html
 * <itx-inline-code>npm install interop</itx-inline-code>
 * ```
 */
@Component({
	selector: "itx-inline-code",
	standalone: true,
	imports: [InteropButton, InteropButtonActivation, InteropIcon],
	templateUrl: "./inline-code.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [provideInteropIcons(TablerCheck, TablerCopy)],
})
export class InlineCode {
	private readonly elementRef = inject(ElementRef<HTMLElement>);
	private readonly highlighter = inject(INTEROP_HIGHLIGHTER, {
		optional: true,
	});
	private warnedNoHighlighter = false;

	readonly line = input<HighlightedLine | null>(null);
	readonly language = input<string | null>(null);
	readonly code = input<string | null>(null);
	/** Override the copyable text. Defaults to the rendered text content. */
	readonly copyText = input<string | null>(null);

	private readonly projectedText = signal<string | null>(null);
	private readonly autoTokens = signal<HighlightedLine | null>(null);

	readonly sourceText = computed(() => this.code() ?? this.projectedText());

	/** Resolved tokens to render: explicit `[line]` wins, else auto-tokenized. */
	readonly displayLine = computed(() => this.line() ?? this.autoTokens());

	private readonly copyState = signal<"idle" | "copied">("idle");
	private copyTimer: ReturnType<typeof setTimeout> | null = null;

	readonly isCopied = computed(() => this.copyState() === "copied");

	readonly handleCopy = (): void => {
		void this.executeCopy();
	};

	readonly copyOptions: ActivationOptions = { debounceMs: 200 };

	constructor() {
		afterNextRender(() => {
			if (this.code() != null) return;
			const codeEl = this.elementRef.nativeElement.querySelector("code");
			const text = codeEl?.textContent?.trim();
			if (text) this.projectedText.set(text);
		});

		effect(() => {
			if (this.line()) {
				this.autoTokens.set(null);
				return;
			}

			const lang = this.language();
			const text = this.sourceText();
			if (!lang || !text) {
				this.autoTokens.set(null);
				return;
			}

			if (!this.highlighter) {
				if (isDevMode() && !this.warnedNoHighlighter) {
					console.warn(
						`[itx-inline-code] language="${lang}" set but no highlighter is registered. ` +
							`Call provideHighlighter() at app bootstrap to enable syntax highlighting.`,
					);
					this.warnedNoHighlighter = true;
				}
				this.autoTokens.set(null);
				return;
			}

			const result = this.highlighter.highlight(text, lang);
			if (result instanceof Promise) {
				result.then((highlighted) => {
					if (
						this.line() === null &&
						this.language() === lang &&
						this.sourceText() === text
					) {
						this.autoTokens.set(highlighted[0] ?? null);
					}
				});
			} else {
				this.autoTokens.set(result[0] ?? null);
			}
		});
	}

	private async executeCopy(): Promise<void> {
		const text = this.resolveText();
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			this.copyState.set("copied");
			if (this.copyTimer) clearTimeout(this.copyTimer);
			this.copyTimer = setTimeout(() => {
				this.copyState.set("idle");
				this.copyTimer = null;
			}, 2000);
		} catch {
			// clipboard write failed — fail silently
		}
	}

	private resolveText(): string {
		const override = this.copyText();
		if (override) return override;

		const display = this.displayLine();
		if (display) return display.tokens.map((t) => t.text).join("");

		const src = this.sourceText();
		if (src) return src;

		const code = this.elementRef.nativeElement.querySelector("code");
		return code?.textContent?.trim() ?? "";
	}
}
