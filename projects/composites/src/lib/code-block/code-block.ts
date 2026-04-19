import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	computed,
	effect,
	inject,
	input,
	linkedSignal,
	signal,
	viewChildren,
} from "@angular/core";
import {
	InteropButton,
	InteropIcon,
	InteropActivation,
	InteropCodeRenderer,
	canonicalizeLanguage,
	type HighlightedCode,
	type ActivationOptions,
	provideInteropIcons,
} from "interop";
import { InteropToolbar } from "interop/lib/rigs/interop-toolbar/interop-toolbar";
import { PhArrowUDownLeft } from "interop/lib/iconsets/phosphor/regular/ph-arrow-u-down-left";
import { TablerCheck } from "interop/lib/iconsets/tabler/outline/tabler-check";
import { TablerCopy } from "interop/lib/iconsets/tabler/outline/tabler-copy";

export interface CodeFile {
	/** Stable key for this tab. Defaults to `label` if omitted. */
	key?: string;
	/** Tab label shown in the tablist. */
	label: string;
	language?: string;
	filename?: string;
	tokens: HighlightedCode | null;
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
 * @example Single file
 * ```html
 * <itx-code-block language="ts" filename="app.ts" [tokens]="tokens" />
 * ```
 *
 * @example Multi-file (tabbed)
 * ```html
 * <itx-code-block [files]="[
 *   { label: 'app.ts', language: 'ts', tokens: tsTokens },
 *   { label: 'app.html', language: 'html', tokens: htmlTokens },
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
	imports: [InteropCodeRenderer, InteropButton, InteropIcon, InteropToolbar],
	templateUrl: "./code-block.html",
	styleUrl: "./code-block.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		provideInteropIcons(PhArrowUDownLeft, TablerCheck, TablerCopy),
	],
})
export class CodeBlock {
	private readonly elementRef = inject(ElementRef<HTMLElement>);
	private readonly destroyRef = inject(DestroyRef);
	private readonly activationService = inject(InteropActivation, {
		optional: true,
	});

	readonly uid = `itx-cb-${_cbIdCounter++}`;

	// ── Single-file mode ─────────────────────────────────────────────────────────

	readonly language = input<string | null>(null);
	readonly filename = input<string | null>(null);
	readonly tokens = input<HighlightedCode | null>(null);

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

	private readonly copyState = signal<"idle" | "copied">("idle");
	private copyTimer: ReturnType<typeof setTimeout> | null = null;

	readonly isCopied = computed(() => this.copyState() === "copied");

	readonly displayLabel = computed(
		() =>
			this.filename() ??
			canonicalizeLanguage(this.language()),
	);

	// ── Tab button refs for keyboard focus management ─────────────────────────────

	readonly tabBtns =
		viewChildren<ElementRef<HTMLButtonElement>>("tabBtn");

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
		effect(() => {
			const key = this.syncKey();
			if (!key || !this.activationService) return;

			const reg = this.activationService.register(
				key,
				(payload: unknown) => {
					if (typeof payload !== "string") return;
					const match = this.files().find(
						(f) => this.fileKey(f) === payload,
					);
					if (match) this.activeKey.set(payload);
				},
			);

			this.destroyRef.onDestroy(() => reg.unregister());
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

		if (event.key === "ArrowRight")
			targetIdx = (currentIdx + 1) % keys.length;
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
			if (!file?.tokens) return "";
			return file.tokens
				.map((l) => l.tokens.map((t) => t.text).join(""))
				.join("\n");
		}

		const tokenLines = this.tokens();
		if (tokenLines) {
			return tokenLines
				.map((l) => l.tokens.map((t) => t.text).join(""))
				.join("\n");
		}

		const code = this.elementRef.nativeElement.querySelector("pre > code");
		return (code as HTMLElement | null)?.innerText ?? "";
	}
}
