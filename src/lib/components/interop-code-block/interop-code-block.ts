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
  model,
  signal,
} from "@angular/core";
import { InteropActivation } from "../../services/interop-activation.service";
import { type ActivationOptions } from "../../utils/activation";
import { InteropButton } from "../interop-button/interop-button";
import {
  INTEROP_CODE_BLOCK_CONTEXT,
  type InteropCodeBlockContext,
} from "./interop-code-block-context.token";

// ── Syntax highlighting types ──────────────────────────────────────────────────
//
// Plain TypeScript types with no Angular dependency — fully tree-shakeable.
// Consumers can populate these from Shiki, Prism, or any other tokenizer.

/**
 * A single syntax token within a line of highlighted code.
 *
 * `fontStyle` follows the TextMate convention:
 * - `0` = normal
 * - `1` = italic
 * - `2` = bold
 * - `3` = bold + italic
 */
export type HighlightToken = {
  text: string;
  color?: string;
  fontStyle?: 0 | 1 | 2 | 3;
};

/** A single line of highlighted code, represented as an ordered list of tokens. */
export type HighlightedLine = { tokens: HighlightToken[] };

/**
 * Pre-tokenized syntax-highlighted code, ready for rendering.
 * Pass this to the `[tokens]` input to bypass runtime highlighting entirely.
 *
 * @example Using with Shiki (server-side / build-time)
 * ```ts
 * import { codeToTokens } from 'shiki';
 * const { tokens } = await codeToTokens(source, { lang: 'typescript', theme: 'github-dark' });
 * ```
 */
export type HighlightedCode = HighlightedLine[];

// ── Language canonicalization ──────────────────────────────────────────────────
//
// Module-level constant — allocated once, not per instance.

const LANGUAGE_LABELS: Readonly<Record<string, string>> = {
  ts: "TypeScript",
  typescript: "TypeScript",
  js: "JavaScript",
  javascript: "JavaScript",
  tsx: "TSX",
  jsx: "JSX",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  toml: "TOML",
  bash: "Shell",
  sh: "Shell",
  zsh: "Shell",
  shell: "Shell",
  py: "Python",
  python: "Python",
  rs: "Rust",
  rust: "Rust",
  go: "Go",
  java: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  c: "C",
  cpp: "C++",
  cs: "C#",
  csharp: "C#",
  rb: "Ruby",
  ruby: "Ruby",
  php: "PHP",
  md: "Markdown",
  markdown: "Markdown",
  sql: "SQL",
  xml: "XML",
  graphql: "GraphQL",
  gql: "GraphQL",
  dockerfile: "Dockerfile",
  docker: "Dockerfile",
  nginx: "Nginx",
  http: "HTTP",
};

function canonicalizeLanguage(lang: string | null): string | null {
  if (!lang) return null;
  return LANGUAGE_LABELS[lang.toLowerCase()] ?? lang;
}

// ── Component ──────────────────────────────────────────────────────────────────

let _codeBlockIdCounter = 0;

/**
 * InteropCodeBlock — The most accessible, composable code block component for Angular.
 *
 * Must be used on a `<figure>` element. The component generates a `<figcaption>` header
 * bar with a filename/language label and action buttons, then projects the consumer's
 * `<pre><code>` as the code content. Alternatively, pass pre-tokenized syntax-highlighted
 * data via the `[tokens]` input for zero-runtime-cost rendering.
 *
 * Key features:
 * - Accessible copy button with `aria-live` announcement ("Copied to clipboard")
 * - Language canonicalization (e.g. `"ts"` → `"TypeScript"`)
 * - Optional word-wrap toggle with `aria-pressed` state
 * - Pre-tokenized input API — drop in output from Shiki, Prism, or any tokenizer
 * - Optional line numbers (`aria-hidden`, excluded from copy)
 * - Context token for Phase 2 InteropTabs adaptation and cross-block sync
 *
 * @example Simple projection
 * ```html
 * <figure interop-code-block language="typescript" filename="app.ts">
 *   <pre><code>const x: number = 1;</code></pre>
 * </figure>
 * ```
 *
 * @example With pre-tokenized input (server-side / build-time highlighting)
 * ```html
 * <figure interop-code-block language="typescript" [tokens]="highlightedCode">
 * </figure>
 * ```
 *
 * @example With word wrap toggle and line numbers
 * ```html
 * <figure interop-code-block language="json" [lineNumbers]="true" [wrapToggle]="true" [tokens]="tokens">
 * </figure>
 * ```
 */
@Component({
  selector: "figure[interop-code-block]",
  standalone: true,
  imports: [InteropButton],
  templateUrl: "./interop-code-block.html",
  styleUrl: "./interop-code-block.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: INTEROP_CODE_BLOCK_CONTEXT,
      useExisting: InteropCodeBlock,
    },
  ],
  host: {
    "[style.--itx-code-block-white-space]": "whiteSpaceValue()",
  },
})
export class InteropCodeBlock implements InteropCodeBlockContext {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly activationService = inject(InteropActivation, {
    optional: true,
  });

  // ── Stable UID ───────────────────────────────────────────────────────────────

  /** Stable UID for this instance. Used by descendant components for ARIA IDs. */
  readonly uid = `itx-code-block-${_codeBlockIdCounter++}`;

  // ── Inputs ───────────────────────────────────────────────────────────────────

  /**
   * Language identifier for the code. Accepts short aliases (e.g. `"ts"`, `"js"`)
   * and full names (e.g. `"typescript"`). Displayed in the header as a canonicalized
   * label unless `filename` is also provided (filename takes precedence).
   */
  readonly language = input<string | null>(null);

  /**
   * Filename to display in the header. Takes precedence over the language label.
   * Use when the file extension already communicates the language.
   *
   * @example `filename="app.component.ts"`
   */
  readonly filename = input<string | null>(null);

  /**
   * Whether to show line numbers in the left gutter.
   * Only applies when the `[tokens]` input is provided.
   * Line numbers are `aria-hidden` and excluded from the clipboard copy.
   */
  readonly lineNumbers = input<boolean>(false);

  /**
   * Initial word-wrap state. When `true`, long lines wrap instead of scrolling.
   * Can be changed at runtime via the wrap toggle button (if `[wrapToggle]` is true).
   */
  readonly wrap = input<boolean>(false);

  /**
   * Whether to show a word-wrap toggle button in the header.
   * The button reflects its state via `aria-pressed`.
   */
  readonly wrapToggle = input<boolean>(false);

  /**
   * Sync key for cross-block language synchronization via InteropActivation.
   * When set, this code block registers as both a publisher and subscriber for
   * the given key. Language selection changes are broadcast and received.
   *
   * All code blocks sharing the same `syncKey` on a page will stay in sync.
   *
   * @example `syncKey="lang-preference"`
   */
  readonly syncKey = input<string | null>(null);

  /**
   * Pre-tokenized, syntax-highlighted code lines.
   * When provided, the component renders the tokens directly — no runtime highlighting
   * library is needed. Use build-time or server-side Shiki/Prism to produce this data.
   *
   * When `null` (default), the component renders projected `<pre><code>` content instead.
   */
  readonly tokens = input<HighlightedCode | null>(null);

  // ── Internal state ───────────────────────────────────────────────────────────

  /**
   * Current word-wrap state. Two-way bindable via `[(isWrapped)]` if the consumer
   * wants to control or observe it externally. Initialized from the `[wrap]` input.
   */
  readonly isWrapped = model<boolean>(false);

  /**
   * Currently active language key. Used by Phase 2 child components (e.g. adapted
   * InteropTabs) to stay in sync with the active panel selection.
   */
  readonly activeLanguage = signal<string | null>(null);

  private readonly copyState = signal<"idle" | "copied" | "error">("idle");
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Computed ─────────────────────────────────────────────────────────────────

  /** Canonicalized display label for the language (e.g. `"ts"` → `"TypeScript"`). */
  readonly languageLabel = computed(() => canonicalizeLanguage(this.language()));

  /**
   * The label shown in the header. Filename takes precedence over language label.
   * Null when neither is provided — header label area is hidden.
   */
  readonly headerLabel = computed(() => this.filename() ?? this.languageLabel());

  readonly isCopied = computed(() => this.copyState() === "copied");

  readonly copyAriaLabel = computed(() =>
    this.isCopied() ? "Copied to clipboard" : "Copy code",
  );

  /** CSS custom property value for white-space, bound to the host via [style.*]. */
  readonly whiteSpaceValue = computed(() =>
    this.isWrapped() ? "pre-wrap" : "pre",
  );

  // ── Stable handler and options refs ──────────────────────────────────────────
  //
  // Defined as class properties (not computed signals or methods) so that their
  // references are stable across renders. InteropButton's onActivate effect only
  // fires when the handler reference changes — these should never change.

  /** Copy handler. Arrow property for stable reference. */
  readonly handleCopy = (): void => {
    void this.executeCopy();
  };

  /** Activation options for the copy button. Static — debounce only. */
  readonly copyActivationOptions: ActivationOptions = { debounceMs: 200 };

  /** Wrap toggle handler. Arrow property for stable reference. */
  readonly handleWrapToggle = (): void => {
    this.isWrapped.update((v) => !v);
  };

  // ── InteropCodeBlockContext impl ─────────────────────────────────────────────

  setActiveLanguage(key: string): void {
    this.activeLanguage.set(key);
  }

  // ── Constructor ──────────────────────────────────────────────────────────────

  constructor() {
    if (isDevMode()) {
      afterNextRender(() => {
        const el = this.elementRef.nativeElement;
        if (el.tagName !== "FIGURE") {
          console.warn(
            `InteropCodeBlock must be used on <figure> elements for semantic correctness. ` +
              `Found on: ${el.tagName.toLowerCase()}`,
          );
        }
      });
    }

    // Sync isWrapped model from wrap input on first evaluation.
    // { allowSignalWrites: true } is required when writing a signal inside an effect.
    effect(
      () => {
        this.isWrapped.set(this.wrap());
      },
      { allowSignalWrites: true },
    );

    // Cross-block language sync via InteropActivation (Phase 2 foundation).
    // When syncKey is set, this block listens for language selection from other
    // blocks sharing the same key.
    effect(() => {
      const key = this.syncKey();
      if (!key || !this.activationService) return;

      const registration = this.activationService.register(
        key,
        (payload: unknown) => {
          if (typeof payload === "string") {
            this.setActiveLanguage(payload);
          }
        },
      );

      this.destroyRef.onDestroy(() => registration.unregister());
    });
  }

  // ── Private methods ──────────────────────────────────────────────────────────

  private async executeCopy(): Promise<void> {
    const text = this.resolveCodeText();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      this.copyState.set("copied");

      if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
      this.copyResetTimer = setTimeout(() => {
        this.copyState.set("idle");
        this.copyResetTimer = null;
      }, 2000);
    } catch {
      this.copyState.set("error");
    }
  }

  /**
   * Resolves the plain text to copy.
   * - When tokens are provided: reconstructs from the token text values.
   * - When content is projected: reads innerText from the projected `<pre><code>`.
   *   innerText strips HTML tags and resolves CSS-hidden content correctly.
   */
  private resolveCodeText(): string {
    const tokenLines = this.tokens();
    if (tokenLines) {
      return tokenLines
        .map((line) => line.tokens.map((t) => t.text).join(""))
        .join("\n");
    }
    const codeEl = this.elementRef.nativeElement.querySelector("pre > code");
    return codeEl?.innerText ?? "";
  }
}
