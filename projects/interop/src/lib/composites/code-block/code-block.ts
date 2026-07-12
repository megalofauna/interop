import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	afterNextRender,
	computed,
	effect,
	inject,
	input,
	isDevMode,
	linkedSignal,
	signal,
	viewChildren,
} from "@angular/core";
import {
	InteropButton,
	InteropButtonActivation,
	InteropIcon,
	InteropCodeRenderer,
	InteropTooltip,
	canonicalizeLanguage,
	type HighlightedCode,
} from "../../components/public-api";
import { InteropActivation } from "../../services/public-api";
import { INTEROP_HIGHLIGHTER } from "../../highlighter/public-api";
import { type ActivationOptions } from "../../utils/public-api";
import { provideInteropIcons } from "../../iconsets/core";
import { InteropToolbar } from "../../rigs/public-api";
import { PhArrowUDownLeft } from "../../iconsets/phosphor/regular/ph-arrow-u-down-left";
import { TablerCheckFilled } from "../../iconsets/tabler/filled/tabler-check-filled";
import { TablerCopyFilled } from "../../iconsets/tabler/filled/tabler-copy-filled";
import { TablerTextWrap } from "../../iconsets/tabler/outline/tabler-text-wrap";
import { TablerTextWrapDisabled } from "../../iconsets/tabler/outline/tabler-text-wrap-disabled";

export interface CodeFile {
	/** Stable key for this tab. Defaults to `label` if omitted. */
	key?: string;
	/** Tab label shown in the tablist. */
	label: string;
	language?: string;
	filename?: string;
	/** Pre-tokenized output. Wins over `code` if both are set. */
	tokens?: HighlightedCode | null;
	/** Raw source string. Auto-tokenized when `language` is set and a highlighter is registered. */
	code?: string;
}

let _cbIdCounter = 0;

/**
 * CodeBlock — Full-featured tabbed code viewer composite.
 *
 * Assembles `InteropCodeRenderer`, `InteropToolbar`, and `InteropButton` into
 * a single, accessible code display experience. Supports single-file and
 * multi-file (tabbed) modes, copy-to-clipboard, word-wrap toggle, and
 * cross-block language sync via `InteropActivation`.
 *
 * Resolves its source in this order:
 *   1. `[tokens]` (single) or `file.tokens` (multi) — explicit pre-tokenized
 *   2. `[code]` (single) or `file.code` (multi) — string, auto-highlighted when `language` set + highlighter provided
 *   3. Projected `<pre><code>` content — single-file fallback
 *
 * Register a highlighter via `provideHighlighter()` (see `interop/highlighters/shiki`).
 *
 * @example Magical single-file
 * ```html
 * <itx-code-block language="ts" code="const x = 1;" />
 * ```
 *
 * @example Multi-file with auto-tokenization
 * ```html
 * <itx-code-block [files]="[
 *   { label: 'app.ts', language: 'ts', code: tsSource },
 *   { label: 'app.html', language: 'html', code: htmlSource },
 * ]" />
 * ```
 *
 * @example Cross-block sync (all blocks with the same syncKey stay in lockstep)
 * ```html
 * <itx-code-block syncKey="lang" [files]="filesA" />
 * <itx-code-block syncKey="lang" [files]="filesB" />
 * ```
 */
@Component({
	selector: "itx-code-block",
	standalone: true,
	imports: [
		InteropCodeRenderer,
		InteropButton,
		InteropButtonActivation,
		InteropIcon,
		InteropToolbar,
		InteropTooltip,
	],
	templateUrl: "./code-block.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		provideInteropIcons(
			PhArrowUDownLeft,
			TablerCheckFilled,
			TablerCopyFilled,
			TablerTextWrap,
			TablerTextWrapDisabled,
		),
	],
})
export class CodeBlock {
	private readonly elementRef = inject(ElementRef<HTMLElement>);
	private readonly destroyRef = inject(DestroyRef);
	private readonly activationService = inject(InteropActivation, {
		optional: true,
	});
	private readonly highlighter = inject(INTEROP_HIGHLIGHTER, {
		optional: true,
	});
	private warnedNoHighlighter = false;

	readonly uid = `itx-cb-${_cbIdCounter++}`;

	// ── Single-file mode ─────────────────────────────────────────────────────────

	readonly language = input<string | null>(null);
	readonly filename = input<string | null>(null);
	readonly tokens = input<HighlightedCode | null>(null);
	readonly code = input<string | null>(null);

	// ── Multi-file mode ──────────────────────────────────────────────────────────

	readonly files = input<CodeFile[]>([]);

	// ── Options ──────────────────────────────────────────────────────────────────

	readonly lineNumbers = input<boolean>(false);
	readonly wrapToggle = input<boolean>(false);

	/**
	 * When set, all `CodeBlock` instances sharing this key stay in sync.
	 * Switching tabs in one block broadcasts the active key to all others.
	 */
	readonly syncKey = input<string | null>(null);

	// ── Internal state ───────────────────────────────────────────────────────────

	readonly isMultiFile = computed(() => this.files().length > 0);

	/** Active tab key. Resets to the first file whenever `files` changes. */
	readonly activeKey = linkedSignal<string | null>(() => {
		const files = this.files();
		return files[0] ? this.fileKey(files[0]) : null;
	});

	readonly isWrapped = signal(false);

	// Auto-tokenization storage
	private readonly projectedText = signal<string | null>(null);
	private readonly singleAutoTokens = signal<HighlightedCode | null>(null);
	private readonly multiAutoTokens = signal<Map<string, HighlightedCode>>(
		new Map(),
	);

	readonly singleSourceText = computed(
		() => this.code() ?? this.projectedText(),
	);

	/** Resolved tokens for single-file mode. */
	readonly singleDisplayTokens = computed(
		() => this.tokens() ?? this.singleAutoTokens(),
	);

	/** Resolved tokens for the given file in multi-file mode. */
	tokensFor(file: CodeFile): HighlightedCode | null {
		return (
			file.tokens ?? this.multiAutoTokens().get(this.fileKey(file)) ?? null
		);
	}

	private readonly copyState = signal<"idle" | "copied">("idle");
	private copyTimer: ReturnType<typeof setTimeout> | null = null;

	readonly isCopied = computed(() => this.copyState() === "copied");

	readonly displayLabel = computed(
		() => this.filename() ?? canonicalizeLanguage(this.language()),
	);

	// ── Tab button refs for keyboard focus management ─────────────────────────────

	readonly tabBtns = viewChildren<ElementRef<HTMLButtonElement>>("tabBtn");

	// ── Stable handler refs ───────────────────────────────────────────────────────

	readonly handleCopy = (): void => {
		void this.executeCopy();
	};

	readonly copyOptions: ActivationOptions = { debounceMs: 200 };

	readonly handleWrapToggle = (): void => {
		this.isWrapped.update((v) => !v);
	};

	// ── ARIA label helpers ───────────────────────────────────────────────────────

	actionsLabel(): string {
		const label = this.isMultiFile()
			? (this.activeFile()?.label ?? "code")
			: (this.displayLabel() ?? "code");
		return `${label} — actions`;
	}

	// ── Constructor ──────────────────────────────────────────────────────────────

	constructor() {
		// Cross-block tab sync
		effect(() => {
			const key = this.syncKey();
			if (!key || !this.activationService) return;

			const reg = this.activationService.register(key, (payload: unknown) => {
				if (typeof payload !== "string") return;
				const match = this.files().find((f) => this.fileKey(f) === payload);
				if (match) this.activeKey.set(payload);
			});

			this.destroyRef.onDestroy(() => reg.unregister());
		});

		// Capture projected text after first render (single-file only)
		afterNextRender(() => {
			if (this.isMultiFile() || this.code() != null) return;
			const codeEl = this.elementRef.nativeElement.querySelector("pre > code");
			const text = (codeEl as HTMLElement | null)?.innerText;
			if (text) this.projectedText.set(text);
		});

		// Single-file auto-tokenization
		effect(() => {
			if (this.isMultiFile() || this.tokens()) {
				this.singleAutoTokens.set(null);
				return;
			}

			const lang = this.language();
			const text = this.singleSourceText();
			if (!lang || !text) {
				this.singleAutoTokens.set(null);
				return;
			}

			const highlighter = this.highlighter;
			if (!highlighter) {
				this.warnNoHighlighter(lang);
				this.singleAutoTokens.set(null);
				return;
			}

			const result = highlighter.highlight(text, lang);
			if (result instanceof Promise) {
				result.then((highlighted) => {
					if (
						!this.tokens() &&
						this.language() === lang &&
						this.singleSourceText() === text
					) {
						this.singleAutoTokens.set(highlighted);
					}
				});
			} else {
				this.singleAutoTokens.set(result);
			}
		});

		// Multi-file auto-tokenization (eager across all files)
		effect(() => {
			if (!this.isMultiFile()) {
				this.multiAutoTokens.set(new Map());
				return;
			}

			const highlighter = this.highlighter;
			const files = this.files();

			for (const file of files) {
				if (file.tokens) continue;
				const lang = file.language;
				const code = file.code;
				if (!lang || !code) continue;

				if (!highlighter) {
					this.warnNoHighlighter(lang);
					continue;
				}

				const key = this.fileKey(file);
				const existing = this.multiAutoTokens().get(key);
				if (existing) continue;

				const result = highlighter.highlight(code, lang);
				if (result instanceof Promise) {
					result.then((highlighted) => {
						const currentFile = this.files().find(
							(f) => this.fileKey(f) === key,
						);
						if (
							currentFile &&
							!currentFile.tokens &&
							currentFile.language === lang &&
							currentFile.code === code
						) {
							this.multiAutoTokens.update((map) => {
								const next = new Map(map);
								next.set(key, highlighted);
								return next;
							});
						}
					});
				} else {
					this.multiAutoTokens.update((map) => {
						const next = new Map(map);
						next.set(key, result);
						return next;
					});
				}
			}
		});
	}

	// ── Public methods ───────────────────────────────────────────────────────────

	fileKey(file: CodeFile): string {
		return file.key ?? file.label;
	}

	activeFile(): CodeFile | undefined {
		return this.files().find((f) => this.fileKey(f) === this.activeKey());
	}

	tabId(key: string): string {
		return `${this.uid}-tab-${key}`;
	}

	panelId(key: string): string {
		return `${this.uid}-panel-${key}`;
	}

	selectTab(key: string): void {
		this.activeKey.set(key);
		const syncKey = this.syncKey();
		if (syncKey) this.activationService?.trigger(syncKey, key);
	}

	onTablistKeydown(event: KeyboardEvent): void {
		const files = this.files();
		if (!files.length) return;

		const keys = files.map((f) => this.fileKey(f));
		const currentIdx = keys.indexOf(this.activeKey() ?? "");
		let targetIdx: number | null = null;

		if (event.key === "ArrowRight") targetIdx = (currentIdx + 1) % keys.length;
		else if (event.key === "ArrowLeft")
			targetIdx = (currentIdx - 1 + keys.length) % keys.length;
		else if (event.key === "Home") targetIdx = 0;
		else if (event.key === "End") targetIdx = keys.length - 1;
		else return;

		event.preventDefault();
		this.selectTab(keys[targetIdx]);
		this.tabBtns()[targetIdx]?.nativeElement.focus();
	}

	onTabKeydown(event: KeyboardEvent, key: string): void {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			this.selectTab(key);
		}
	}

	// ── Private ──────────────────────────────────────────────────────────────────

	private warnNoHighlighter(lang: string): void {
		if (!isDevMode() || this.warnedNoHighlighter) return;
		console.warn(
			`[itx-code-block] language="${lang}" set but no highlighter is registered. ` +
				`Call provideHighlighter() at app bootstrap to enable syntax highlighting.`,
		);
		this.warnedNoHighlighter = true;
	}

	private async executeCopy(): Promise<void> {
		const text = this.resolveActiveText();
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

	private resolveActiveText(): string {
		if (this.isMultiFile()) {
			const file = this.activeFile();
			if (!file) return "";
			if (file.code) return file.code;
			const fileTokens = this.tokensFor(file);
			if (fileTokens) {
				return fileTokens
					.map((l) => l.tokens.map((t) => t.text).join(""))
					.join("\n");
			}
			return "";
		}

		const src = this.singleSourceText();
		if (src) return src;

		const tokenLines = this.singleDisplayTokens();
		if (tokenLines) {
			return tokenLines
				.map((l) => l.tokens.map((t) => t.text).join(""))
				.join("\n");
		}

		const code = this.elementRef.nativeElement.querySelector("pre > code");
		return (code as HTMLElement | null)?.innerText ?? "";
	}
}
