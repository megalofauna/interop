# Code Block — Mental Model Card

A code block is a `<figure interop-code-block>` with a caption, a copy button
and a `<pre><code>` that scrolls. `InteropCodeBlock` renders the parts from
`code`, `language` and `caption`. Syntax colors come from `interop/highlight`,
which paints them with the CSS Custom Highlight API and leaves the text nodes
as they are. Grammars load on first use.

```ts
import { registerLanguages } from 'interop/highlight';
registerLanguages({
  ts: { label: 'TypeScript', load: () => import('shiki/langs/typescript.mjs') },
});
```

```html
<figure interop-code-block language="ts" caption="badge.ts" [code]="source"></figure>
<figure interop-code-block itx-line-numbers itx-wrap language="ts" [code]="source"></figure>
```

## Files

```
projects/interop/code-block/
  interop-code-block.structure.css   grid, caption, copy button, pre, line numbers, wrapping
  interop-code-block.base.css        token values
  code-block.ts                      InteropCodeBlock component
  public-api.ts
projects/interop/highlight/highlight.ts   registerLanguages(), getLanguage(), highlightCode()
projects/interop/src/split-lines.ts       splitLines()
projects/interop/src/scope-select-all.ts  scopeSelectAll()
projects/interop/styles/code.css          the syntax colors and ::highlight() rules
```

The demo page is `projects/demo/src/app/components/code-block/`.

## Parts

| Part | Rule |
|---|---|
| `<figure interop-code-block>` | A two-column grid: caption and copy button in the first row, the code across the second. `aria-labelledby` the caption when there is one |
| `<figcaption>` | `caption`, else the `label` its language was registered with. No caption and no registered label: no figcaption and no name |
| Copy button | `interop-button`, `itx-size="sm"`, a copy icon. Named by a label tooltip, "Copy code", plus the caption: "Copy code badge.ts". Absent when `navigator.clipboard.writeText` is missing |
| `<pre interop-scroll-area>` | Scrolls past `--itx-code-block-max-block-size` (32rem) and sideways. `bindScrollArea()` gives it `tabindex="0"` while it overflows. Focus shows the shared ring |
| `<code class="language-…">` | The code as its exact text, through `textContent` |
| Status | A visually hidden `role="status"` after the code, outside the button |

## Behavior

| Job | Behavior |
|---|---|
| Copy | Writes `code` to the clipboard. The icon turns to a check and the status says "Copied". On failure the status says "Couldn’t copy" and the error goes to `reportError()`. Both reset after 2s |
| Line numbers | `itx-line-numbers`, read once at creation. `splitLines()` wraps each line in `[itx-code-line]`; a CSS counter numbers them in `::before` with empty alternative text, so screen readers leave them out. The gutter is as wide as the longest number, at least 2ch |
| Wrapping | `itx-wrap`: `pre-wrap`, `overflow-wrap: anywhere`. A numbered line's continuation is set in by `--itx-code-block-wrap-indent` |
| Select all | `scopeSelectAll()`, installed once per page by the component. Cmd or Ctrl+A with the selection in a `pre > code` selects that code. A second press on fully selected code selects the page |
| Colors | Rerun after each change of `code` or `language`. A run that a newer one overtakes drops its colors |

### splitLines(code)

Replaces a `<code>`'s children with one `<span itx-code-line>` per line. Each
line keeps its newline, so the text joins into the exact source. A last line
with no newline is kept. Running it again gives the same lines.

## interop/highlight

| API | Behavior |
|---|---|
| `registerLanguages({ key: { label, load } })` | A key is the name in `class="language-…"`; two keys with one definition are aliases. A later key replaces the earlier one. `load` imports a Shiki grammar |
| `getLanguage(key)` | The definition, or `undefined` |
| `highlightCode(code)` | Colors a `<code class="language-…">` with ranges in `CSS.highlights` named `itx-code-<role>`. Returns a promise of a function that removes them |

`highlightCode()` works on any `<code>` with a language class, including
inline code. It loads Shiki's core and its JavaScript regex engine the first
time it runs, then each grammar the first time a language is used. The theme is
Shiki's CSS variables theme with the prefix `--itx-code-`; a token's
`--itx-code-token-<role>` becomes the highlight `itx-code-<role>`.

| Case | Result |
|---|---|
| No `CSS.highlights` | Plain text |
| Language not registered | Plain text. In development, one `code-language` warning per name |
| The grammar fails to load | Plain text, the error to `reportError()`. The next call tries again |
| The text changed while the grammar loaded | No colors from that run |

## Colors

`styles/code.css` declares the colors on `:root`. Each measures at least
4.5:1 against the code block's background under the strongest scroll shadow,
light and dark (tested).

| Token | Highlights |
|---|---|
| `--itx-code-color-keyword` | keyword |
| `--itx-code-color-string` | string, string-expression |
| `--itx-code-color-comment` | comment |
| `--itx-code-color-function` | function; link, underlined |
| `--itx-code-color-constant` | constant |
| `--itx-code-color-parameter` | parameter |
| `--itx-code-color-punctuation` | punctuation |

## Tokens

| Token | Default |
|---|---|
| `--itx-code-block-color`, `-background-color` | neutral-900/100, neutral-50/900 |
| `--itx-code-block-border-width`, `-border-style`, `-border-color` | 1px, solid, neutral-200/700 |
| `--itx-code-block-border-radius`, `-corner-shape` | `var(--itx-radius, var(--itx-radius-base))`, `--itx-corner-shape` |
| `--itx-code-block-padding-block`, `-padding-inline`, `-gap` | `--itx-space-3`, `--itx-space-4`, `--itx-space-2` |
| `--itx-code-block-font-family` | `--itx-font-family-mono` |
| `--itx-code-block-font-size`, `-line-height` | the `p-sm` role |
| `--itx-code-block-tab-size` | 2 |
| `--itx-code-block-max-block-size` | 32rem |
| `--itx-code-block-caption-font-size`, `-caption-line-height` | the `caption` role |
| `--itx-code-block-caption-color` | neutral-600/400 |
| `--itx-code-block-gutter-inline-size` | 2ch; set by the component from the line count |
| `--itx-code-block-gutter-gap` | 2ch |
| `--itx-code-block-line-number-color` | neutral-500/400 |
| `--itx-code-block-wrap-indent` | 2ch |

## Dev audit rules

| Rule | Flags |
|---|---|
| `code-block-name` | A code block with no `aria-labelledby` or `aria-label` name and no caption |
| `code-block-scroll-focusable` | A code block's `<pre>`, or any `<pre>` holding `code[class*="language-"]`, that overflows with no `tabindex` |

`highlightCode()` warns `code-language` on its own, outside the audit.

## Tested

Style guards: code colors at 4.5:1 under the scroll shadow, light and dark;
radius; motion. axe on a numbered, captioned block. `InteropCodeBlock` has 6
specs, `highlightCode()` 5, `splitLines()` 3, `scopeSelectAll()` 2. Audit
rules have specs.

Not recorded: browser runs, screen reader output.

## Not built

- A name for the scroll container. An overflowing `<pre>` takes focus with no
  name of its own; the figure around it has one, which screen readers usually
  announce as focus enters it. The TODO in `code-block.ts` asks for this to be
  confirmed with VoiceOver and NVDA.
- Several files in tabs, a wrap toggle, highlighted lines.
