# CodeBlock — Mental Model Card

## Files

```
projects/interop/src/lib/composites/code-block/
  code-block.ts         Component class
  code-block.html       Template (header → tablist / label / actions → renderer panel)
  code-block.scss       Structural styles (Angular emulated encapsulation)
  public-api.ts         Barrel

projects/interop/src/lib/styles/themes/protocol/composites/
  code-block.css        Protocol theme — token values
```

Re-exported from `interop`.

## What it is

A `<figure>`-level tabbed code viewer. Combines `InteropCodeRenderer`, `InteropToolbar`, and `InteropButton` into a single accessible code-display experience: copy button, optional wrap toggle, single-file or multi-file (tabbed) modes, cross-block tab sync, and auto-tokenization via the injected highlighter.

Not to be confused with [`InlineCode`](inline-code.md) — that's the phrasing-level counterpart. CodeBlock is block-level region semantics (figure, optional figcaption / label, optional tablist).

## Two modes, one component

| Mode | Activated by | Header shows |
|---|---|---|
| **Single-file** | `[language]`, `[code]`/`[tokens]`, or projected `<pre><code>` | Optional `displayLabel()` (filename or canonicalized language) |
| **Multi-file** | `[files]: CodeFile[]` non-empty | `role="tablist"` with one `role="tab"` per file |

`isMultiFile = computed(() => this.files().length > 0)` is the only switch — once a non-empty `files` array is set, single-file inputs are ignored.

```typescript
export interface CodeFile {
  key?: string;            // stable tab id; defaults to label
  label: string;           // visible tab text
  language?: string;       // for auto-tokenize + canonicalizeLanguage()
  filename?: string;       // unused in tablist UI; reserved for future per-file metadata
  tokens?: HighlightedCode | null;
  code?: string;           // raw source — auto-tokenized when language + highlighter present
}
```

## Source precedence (per side)

```
Single-file:   [tokens]  →  [code]  →  projected <pre><code>
Multi-file:    file.tokens → file.code   (no projection — files render in tabpanels)
```

Explicit pre-tokenized always wins; auto-tokenize runs only when explicit tokens are absent and `language` (single) or `file.language` (multi) is set. See [../highlighter.md](../highlighter.md) for the contract and async-aware effect pattern shared with `InlineCode`.

Two parallel `effect()`s in the constructor handle single-file and multi-file tokenization. The multi-file effect iterates the files array eagerly — all files tokenize on mount, not lazily on tab switch. Reason: tab switching should never flash; with the highlighter cache, the eager cost is paid once.

## Multi-file storage

```typescript
private readonly multiAutoTokens = signal<Map<string, HighlightedCode>>(new Map());

tokensFor(file: CodeFile): HighlightedCode | null {
  return file.tokens ?? this.multiAutoTokens().get(this.fileKey(file)) ?? null;
}
```

Keyed by `fileKey(file) = file.key ?? file.label`. Updates are immutable (`new Map(map)` then `.set`) so OnPush picks up the change.

Race guard in the multi-file effect handles three cases: file removed entirely, file's code/language changed, or `[files]` reassigned. The async resolution re-checks all three before committing to the map.

## Active tab is a linkedSignal

```typescript
readonly activeKey = linkedSignal<string | null>(() => {
  const files = this.files();
  return files[0] ? this.fileKey(files[0]) : null;
});
```

The "linked" part means swapping the `files` array reseeds the active key to the first file automatically — exactly what you want when navigating between examples that share a `CodeBlock` instance. Writes via `selectTab()` are preserved until the next `files` change.

## Cross-block sync

Optional `syncKey` input registers the block with `InteropActivation`. When any block with the same `syncKey` switches tabs, all peers receive the new key and switch to the matching tab (if they have one). Used to keep "TS / HTML" pairs aligned across a page.

```typescript
constructor() {
  effect(() => {
    const key = this.syncKey();
    if (!key || !this.activationService) return;
    const reg = this.activationService.register(key, (payload) => {
      if (typeof payload !== 'string') return;
      const match = this.files().find(f => this.fileKey(f) === payload);
      if (match) this.activeKey.set(payload);
    });
    this.destroyRef.onDestroy(() => reg.unregister());
  });
}
```

The registration happens inside an `effect()` so changing `syncKey` re-registers. `selectTab()` calls `activationService.trigger(syncKey, key)` to broadcast.

## The tabs are `interop-tabs`

They were not, for a long time: this composite shipped a bare
`div[role="tablist"]`, its own roving tabindex, its own arrow/Home/End handler,
its own tab/panel id wiring, and a `.itx-cb__tab` stylesheet with its own
border, radius, focus ring and states — a second tab implementation inside a
library that already had one. Nineteen `--itx-cb-tab-*` / `--itx-cb-tablist-*`
tokens existed only to theme it, and a fix to `interop-tabs` reached none of it.

```html
<section interop-tabs [ariaLabel]="filesLabel()"
         [active]="activeKey()" (activeChange)="onTabChange($event)">
  <div interop-tabs-actions class="itx-cb__actions" interop-toolbar …>…</div>
  <section interop-tab-panel [key]="fileKey(file)" [label]="file.label">…</section>
</section>
```

What the swap bought, beyond deleting the duplicate: **the full APG keyboard
model** (the hand-rolled tab handler did Enter/Space only — arrows and Home/End
came from a separate path on the tablist root), **an accessible name on the
tablist** (there was none), and **lazy panel init**, since `interop-tab-panel`
defers content until first visit rather than rendering every file's Shiki
tokens up front.

Three things to know when editing:

- **`(activeChange)`, not `[(active)]`.** Two-way binding would echo the
  cross-block sync: a remote change sets `activeKey`, which would fire the
  trigger, which would set the other blocks. The output only fires on a change
  originating *in* the tab strip, which is exactly the user-driven case
  `selectTab` should broadcast.
- **The actions wrapper is repeated in both branches of the template**, and
  only the buttons are shared through an `<ng-template>`. Content projection
  matches the *declared* element, so the `div` carrying
  `[interop-tabs-actions]` has to be a real child of the tabs section — an
  `<ng-container [ngTemplateOutlet]>` would not match the slot.
- **The theme states no `--itx-tab-*` values.** The code block gets stock tabs
  deliberately. Set them on `itx-code-block` if this strip ever needs to differ
  from every other one.

When there is only one file there is no tab strip at all, so the header row
(`.itx-cb__header`) still exists for the label and the actions.

`tabBtns = viewChildren<ElementRef<HTMLButtonElement>>('tabBtn')` gives the keyboard handler a way to call `.focus()` on the new tab after `selectTab()`.

## Copy

Same shape as `InlineCode`. `executeCopy()` resolves text in this order:

**Multi-file:**
1. `activeFile().code` (raw string, if present)
2. Tokens-to-text for the active file (rebuild string from token text fields)

**Single-file:**
1. `singleSourceText()` — the `[code]` input or captured projection
2. Tokens-to-text from `singleDisplayTokens()`
3. DOM read of `<pre><code>.innerText` as last-resort fallback

`handleCopy` uses `interop-button`'s activation guardrails (`debounceMs: 200`). Two-second copied state, `aria-live="polite"` announcement.

## Wrap toggle (opt-in)

`[wrapToggle]="true"` shows a second toolbar button that flips `isWrapped`. The wrap state is passed to the renderer via `[wrap]` and re-resolves the `white-space` CSS custom property on the renderer. Default off — wrap is opinionated and wrong for most snippets.

## Renderer body background piping

**This pipe does not exist, and the token it named never did.** The declaration below wrote `--itx-cr-body-bg`, its source `--itx-cb-body-background` was declared nowhere, and the renderer hardcoded `background: transparent` and read neither — so nothing on either side of the pipe was live. `--itx-neutral-3` was also deleted with the rest of that ramp in ITX-40.

```scss
/* NOT REAL — kept as the shape a future pipe would take */
:host {
  --itx-cr-body-background: var(--itx-cb-body-background);
}
```

What is now true: `InteropCodeRenderer` reads `--itx-cr-body-background` for real (`styles/components/code-renderer.css`, defaulted to `transparent` by the theme), so building the pipe is one declaration on `itx-code-block` plus a `--itx-cb-body-background` value in the composite's theme. Scoping the renderer's background per code-block is still a feature to design rather than a line to repair.

## CSS strategy

- Two-file split: structural rules in `styles/composites/code-block.css`, token values in `protocol/composites/code-block.css`. Both global and layered; no `styleUrl` since 2026-08-17.
- `:where()` on every child selector inside structural CSS for zero added specificity. `:host` stays unwrapped (Angular emulates it).
- Every theme-relevant property reads `var(--itx-cb-*, <fallback>)`. The fallback chain keeps the component rendering even when the Protocol theme isn't imported.
- Border-radius participates in `--itx-context-radius` (managed-radius opt-in) before falling back to a fixed value:
  ```scss
  border-radius: var(--itx-cb-radius, var(--itx-context-radius, var(--itx-radius-2)));
  ```

See [../highlighter.md](../highlighter.md) for the highlighter contract and [../css-strategy.md](../css-strategy.md) for the overall CSS conventions.

## Token surface (summary)

Full list with descriptions lives in the protocol theme file's header comment. Parts: **host**, **header**, **label**, **actions**. There is no tab or tablist surface — those are `interop-tabs`, themed through `--itx-tab-*` / `--itx-tabs-*`.

| Part | Tokens |
|---|---|
| Host | `radius`, `body-background` |
| Header | `header-background`, `header-background-image`, `header-padding-block`, `header-padding-inline`, `header-gap` |
| Label | `label-padding-inline`, `label-foreground`, `label-font-size`, `label-font-weight`, `label-letter-spacing` |
| Actions | `actions-radius`, `actions-gap`, `button-size` |

All prefixed `--itx-cb-`. State variants follow the button pattern (`-active` suffix for the resolved active state).

## Inputs

| Input | Type | Default | Effect |
|---|---|---|---|
| `language` | `string \| null` | `null` | Auto-tokenize hint + header label (single-file) |
| `filename` | `string \| null` | `null` | Overrides language label in the header |
| `tokens` | `HighlightedCode \| null` | `null` | Explicit pre-tokenized (single-file) |
| `code` | `string \| null` | `null` | Raw source for auto-tokenize (single-file) |
| `files` | `CodeFile[]` | `[]` | Multi-file mode when non-empty |
| `lineNumbers` | `boolean` | `false` | Passed through to the renderer |
| `wrapToggle` | `boolean` | `false` | Show the wrap-toggle button |
| `syncKey` | `string \| null` | `null` | Cross-block tab sync via `InteropActivation` |

## Things to know when editing

- **The tablist's `min-inline-size: 0`** now lives in `components/tabs.css`, on the tablist inside `.itx-tabs__bar`. Same reason as ever — a flex item with text defaults to `min-width: auto`, refuses to shrink, and shoves the actions out of the box.
- **Body background pipe.** When adding more theme-relevant renderer properties (line numbers color, etc.), follow the same pipe pattern: expose a `--itx-cb-*` token on the composite, set the renderer's `--itx-cr-*` inside `:host`.
- **Multi-file file ordering.** The tabs render in array order. Reordering the `files()` input reorders the tabs. The active key tries to survive reordering by matching keys, not indices.
- **CodeFile.filename is currently unused.** It's reserved for per-file metadata (e.g. showing the filename above the active panel). If you wire it up, decide what happens in single-file vs multi-file — single-file's header already shows `displayLabel = filename ?? canonicalizeLanguage(language)`.
- **No per-file copy.** The copy button copies the active file's text. If multi-file UX ever needs per-file copy buttons, that's a real change — current toolbar is global to the block.
- **Eager multi-file tokenization** trades upfront cost for tab-switch smoothness. If multi-file blocks ever get huge file counts (>10ish), revisit — but realistic usage is 2–4 files.
- **The actions toolbar uses `interop-toolbar` (the rig).** Don't replace with raw divs — the rig handles roving-tabindex for the action buttons.

## Known gaps

- **`filename` does nothing.** Defined on `CodeFile` and as an input, but never rendered. Likely intent: show filename above the active panel in multi-file, or as the header label in single-file when both filename and language are set. Pick one.
- **No filename per-tab UI.** Tablist shows `label` only. Filenames could appear as `<small>` next to the label, but no design exists.
- **No async loading state.** When the highlighter is cold and tokenization is in-flight, the renderer shows null tokens / empty body. Could show a subtle skeleton or projected fallback. Not built.
- **Theme tokens for the wrap-toggle button** aren't separated from the copy button — both use `--itx-cb-button-size`. Fine for now; split into `--itx-cb-copy-button-*` / `--itx-cb-wrap-button-*` if they need to diverge.
- **Cross-block sync key collision.** Two unrelated `syncKey="lang"` blocks on the same page silently link. Document-level scope is the only scope. Acceptable for docs sites; problematic for arbitrary embedding.
