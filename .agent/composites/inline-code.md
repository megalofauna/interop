# InlineCode — Mental Model Card

## Files

```
projects/composites/src/lib/inline-code/
  inline-code.ts        Component class
  inline-code.html      Template (code element + copy button + sr live region)
  inline-code.scss      Structural CSS (em-relative sizing, inline-flex host)
  public-api.ts         Barrel

projects/interop/src/lib/styles/themes/protocol/composites/
  inline-code.css       Protocol theme — token values
```

Re-exported from `@interop/composites` (`projects/composites/src/public-api.ts`).

## What it is

A phrasing-level companion to `CodeBlock`. Renders a `<code>` element + a small copy button as an `inline-flex` chip that sits next to other text. Designed for tiny, repetitive snippets — `<itx-inline-code language="ts">const x = 1</itx-inline-code>` next to a paragraph or a button.

This is **not** a small `CodeBlock`. `CodeBlock` is a `<figure>` with header, tablist, and actions toolbar — block-level region semantics. `InlineCode` is `<code>` — phrasing content. Trying to unify them would have either added dead branches to `CodeBlock` for the inline case or broken figure semantics for the block case. They diverged on purpose.

## Source precedence

```
[line]  →  [code]  →  projected <ng-content>
```

1. **`[line]: HighlightedLine | null`** — explicit pre-tokenized output (a single line, not the multi-line `HighlightedCode`). Escape hatch when the caller already has tokens. When set, no highlighter call is made.
2. **`[code]: string | null`** — raw source. Combined with `language` and a registered highlighter → auto-tokenized.
3. **Projected `<ng-content>`** — `textContent` is read once after first render via `afterNextRender`, captured in `projectedText` signal, then auto-tokenized like `[code]`.

The "magical" path is #3 — `<itx-inline-code language="html">&lt;button&gt;</itx-inline-code>` Just Works without any TS wiring on the consumer side. Requires `provideHighlighter()` at app root (see [../highlighter.md](../highlighter.md)).

When no highlighter is registered but `language` is set, dev mode emits a one-shot `console.warn`. Production silently falls back to projected text.

## Inputs

| Input | Type | Default | Effect |
|---|---|---|---|
| `line` | `HighlightedLine \| null` | `null` | Explicit pre-tokenized output (single line) |
| `language` | `string \| null` | `null` | Triggers auto-tokenize when paired with `[code]` or projection |
| `code` | `string \| null` | `null` | Explicit source string |
| `copyText` | `string \| null` | `null` | Override the copyable text; defaults to rendered text |

## Internal signals

| Signal | Type | Purpose |
|---|---|---|
| `projectedText` | `WritableSignal<string \| null>` | Captured from `<ng-content>` via `afterNextRender` |
| `autoTokens` | `WritableSignal<HighlightedLine \| null>` | Result of the highlighter call |
| `sourceText` | `Computed<string \| null>` | `code() ?? projectedText()` |
| `displayLine` | `Computed<HighlightedLine \| null>` | `line() ?? autoTokens()` — what the template renders |
| `copyState` | `WritableSignal<'idle' \| 'copied'>` | Two-second feedback window |

## Auto-tokenize effect

```typescript
effect(() => {
  if (this.line()) { this.autoTokens.set(null); return; }     // explicit wins

  const lang = this.language();
  const text = this.sourceText();
  if (!lang || !text) { this.autoTokens.set(null); return; }

  if (!this.highlighter) { /* warn once in dev mode, fall back */ return; }

  const result = this.highlighter.highlight(text, lang);
  if (result instanceof Promise) {
    result.then((highlighted) => {
      // Race guard
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
```

The highlighter returns `HighlightedCode` (an array of lines). InlineCode takes `[0]` — by definition this component is one line. If the caller passes multi-line content via projection or `[code]`, the second-and-beyond lines are dropped. Use `CodeBlock` for multi-line.

The race guard inside the promise handler is required — see [../highlighter.md](../highlighter.md) for the rationale.

## Copy resolution

`resolveText()` priority:

1. `[copyText]` override
2. Token text from `displayLine()` joined back to a string
3. `sourceText()` (the captured projection or `[code]`)
4. Last-resort DOM read of `<code>.textContent`

Copy uses `navigator.clipboard.writeText` with `interop-button`'s activation guardrails (`debounceMs: 200`). The button shows a check icon for 2 seconds on success; failure is silent. An `aria-live="polite"` span announces "Copied to clipboard" for screen readers.

## CSS strategy

```scss
:host {
  display: inline-flex;
  align-items: center;
  gap: var(--itx-spacing-1);
  padding-inline: var(--itx-spacing-2);
  font-size: var(--itx-ic-font-size, 0.875em);
  vertical-align: baseline;
}
```

**Em-relative sizing.** Padding, button size, font-size all derived from `em`. The chip scales with surrounding text — drop it next to a `xs` button and it shrinks; drop it next to `lg` text and it grows. No `itx-size` axis; the parent's font-size *is* the size axis.

**Baseline alignment.** `vertical-align: baseline` keeps the chip's text baseline aligned with sibling text in flowing prose. `align-items: center` inside the host centers the copy button vertically against the code text.

**Copy button.** `1.25em` square with `corner-shape: round` + `border-radius: 9999px` to render a circle that scales with the host font-size. Bypasses `interop-button`'s normal sizing (which uses `itx-size`) by overriding `--itx-button-border-radius` directly.

| Token | Default (Protocol) | Purpose |
|---|---|---|
| `--itx-ic-background` | `var(--itx-neutral-3)` | Chip background |
| `--itx-ic-foreground` | `var(--itx-on-surface)` | Code text color (token spans set their own `color` inline) |
| `--itx-ic-radius` | `var(--itx-radius-1)` | Chip border-radius (also participates in `--itx-context-radius`) |
| `--itx-ic-font-family` | `var(--itx-font-family-mono)` | Code font family |
| `--itx-ic-font-size` | `0.875em` | Code font-size (em-relative on purpose) |
| `--itx-ic-line-height` | `1.4` | Code line-height |
| `--itx-ic-padding-block` | `0` | Chip block padding |
| `--itx-ic-padding-inline` | `var(--itx-spacing-2)` | Chip inline padding |
| `--itx-ic-gap` | `var(--itx-spacing-1)` | Gap between code and copy button |

The copy button has **no `--itx-ic-button-*` size tokens** — it intrinsically sizes from `interop-button`'s padding system (`itx-size` + optional `interop-button="icon"` variant for square shape). Fixed width/height on the chip's button rule would clamp the box smaller than the padding can fill, collapsing the visible whitespace.

Theme color tokens (the actual highlighting colors) come from the highlighter — Shiki sets inline `color` styles on each token span based on the active theme. The `--itx-ic-foreground` token controls untokenized fallback text only.

## Things to know when editing

- **Single line only.** This is enforced by `[0]` in the effect, not by the type system (we accept `HighlightedLine`, not `HighlightedCode`, on `[line]`). The constraint is semantic — `<code>` in `inline-flex` with `white-space: pre` can't wrap meaningfully. For multi-line, use `CodeBlock`.
- **Don't add a header/label.** That would be a `<figure>` with `<figcaption>` and breaks phrasing semantics. If you need a labeled inline snippet, it probably wants to become a block.
- **Don't add a wrap toggle.** Inline content can't wrap usefully. The lack of `wrap` is a feature.
- **The copy logic is duplicated with CodeBlock.** Two callers; not worth lifting into a `useCopyState()` helper yet. If a third appears, extract.
- **Projected text capture happens once.** It's not reactive — `<ng-content>` content changing after first render won't re-trigger auto-tokenize. Use `[code]` if you need reactive source.

## Known gaps

- **No SSR.** Async highlighter path doesn't work server-side; sync adapters or pre-tokenized `[line]` only.
- **Cold-start width jiggle.** First render of a new language shows plain text, then tokens swap in. Char width is stable (same monospace font), but the chip's `padding-inline` doesn't reserve token-space ahead of time. In practice the jiggle is sub-perceptible. Pre-warming the highlighter at bootstrap eliminates it entirely.
- **`copyText` doesn't roundtrip.** If a caller sets `copyText`, it's used only for the clipboard, not for the highlighter input. (You'd expect that — `copyText` overrides what gets copied, not what gets shown.) Just noting in case a future refactor confuses the two.
- **No multi-language inline.** A snippet with mixed inline languages (e.g. a Markdown line containing `code spans`) would need multiple `<itx-inline-code>` instances. There's no plan to support a single chip rendering mixed-language tokens.
