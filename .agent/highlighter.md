# Highlighter — Mental Model Card

## Files

```
projects/interop/src/lib/highlighter/
  highlighter.ts        Highlighter interface, INTEROP_HIGHLIGHTER token, provideHighlighter()
  public-api.ts         Barrel — re-exported from interop's main public-api

projects/interop/highlighters/shiki/
  ng-package.json       Secondary entry point declaration
  src/
    shiki-highlighter.ts  ShikiHighlighter class (cached, sync-after-warm, preload())
    public-api.ts         Barrel

projects/interop/src/lib/components/interop-code-renderer/adapters/
  shiki-adapter.ts      fromShikiTokens() — type-shape helper (no runtime shiki dep,
                        stays in main bundle, called by the ShikiHighlighter adapter)
```

## The contract

```typescript
export interface Highlighter {
  highlight(code: string, language: string): HighlightedCode | Promise<HighlightedCode>;
}

export const INTEROP_HIGHLIGHTER = new InjectionToken<Highlighter>('INTEROP_HIGHLIGHTER');

export function provideHighlighter(impl: Highlighter | Type<Highlighter>): Provider { … }
```

Components consume the token with `inject(INTEROP_HIGHLIGHTER, { optional: true })`. When the token is unbound, components fall back to plain-text rendering and (in dev mode) emit a one-shot console warning.

The return type is `HighlightedCode | Promise<HighlightedCode>`. **Implementations choose**, callers handle both. Sync returns skip a microtask and avoid flash-of-plain-text; async returns let cold-start adapters lazy-load grammars without blocking bootstrap.

## Why this layer exists

Syntax highlighting is heavy (Shiki is ~100 KB gzipped engine + 5–30 KB per grammar). Burning that into every consumer of `<itx-code-block>` or `<itx-inline-code>` would make the components untenable as a library. The contract layer solves three things at once:

1. **Bundle isolation.** `interop` declares the interface and the token. The Shiki implementation lives in a separately-importable subpath (`interop/highlighters/shiki`). Consumers who never import that subpath get zero Shiki bytes — verified by inspecting `dist/interop/fesm2022/interop.mjs` for `from 'shiki'` (only matches are JSDoc).
2. **Pluggability.** Swap Shiki for Prism, a fixture-based highlighter for tests, or a no-op adapter for SSR. The components don't change.
3. **"It just works" DX for opt-in consumers.** Once `provideHighlighter()` is registered, `<itx-inline-code language="html">…</itx-inline-code>` auto-tokenizes from projected text. No per-snippet `xxxTokens` resource wiring.

## Layering rules

| Layer | Allowed to know about |
|---|---|
| `InteropCodeRenderer` (primitive) | Tokens only. Never injects the highlighter. Stays pure and sync. |
| `InlineCode` / `CodeBlock` (composites) | Inject the token. Implement the auto-tokenize behavior. |
| Adapter packages (`highlighters/shiki`) | Import the concrete library (`shiki`). Implement `Highlighter`. |
| Consumer app | Constructs an adapter, calls `provideHighlighter()` at bootstrap. |

The primitive stays dumb because predictability matters more than ergonomics at that layer — anything calling `InteropCodeRenderer` directly is doing custom token generation and wants the simple input/output. The magic belongs in composites.

## Async-aware effect pattern

Both `InlineCode` and `CodeBlock` use the same shape inside their `effect()`:

```typescript
const result = highlighter.highlight(text, lang);
if (result instanceof Promise) {
  result.then((highlighted) => {
    // Race guard: bail if any of the inputs changed while we waited
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
```

The race guard is load-bearing. Without it, two rapid input changes can land out of order — the second call resolves first, the first overwrites it. The guard checks that the captured `(lang, text)` matches current state before committing.

`CodeBlock` does the same for each file in multi-file mode, keyed by file key, with a slightly fancier race guard (the file may have been removed entirely).

## ShikiHighlighter — cold vs warm paths

```typescript
highlight(code, language) {
  const cached = this.cache.get(`${language}\0${code}`);
  if (cached) return cached;                          // cache hit: sync

  if (this.instance && this.loadedLangs.has(language)) {
    return this.tokenizeSync(...);                    // warm: sync
  }

  return this.tokenizeAsync(code, language, key);     // cold: promise
}
```

**Cold path** — first ever call OR first call for a language. Returns a promise. The component renders projected text (or null tokens) until it resolves. User sees a brief flash.

**Warm path** — Shiki engine is created and the language grammar is loaded. Returns sync. Zero flash, no microtask.

**Cache** — keyed by `${language}\0${code}`, unbounded Map. Tab switching in `CodeBlock` is free; re-rendering the same snippet is free. Memory cost is the highlighted token arrays themselves (small) — capped only by how many unique snippets a session sees. Acceptable for docs sites; consider LRU if used in a long-lived app rendering arbitrary user code.

**Preload** — `await highlighter.preload(['ts', 'html', 'css', ...])` during app bootstrap eagerly loads the engine + named grammars, so every subsequent call is sync. Three deployment modes:

| Mode | Pattern | Trade-off |
|---|---|---|
| Awaited (production) | `provideAppInitializer(() => highlighter.preload([...]))` | Zero flash. Slower bootstrap. |
| Fire-and-forget (demo default) | `void highlighter.preload([...])` at module load | First snippet per language may flash once. Bootstrap unblocked. |
| Lazy | No preload | Every new language flashes on first use. Smallest perceived footprint. |

The demo uses fire-and-forget. Production consumers should prefer awaited.

## How `InlineCode` and `CodeBlock` resolve their source

Both follow the same precedence:

1. **Explicit pre-tokenized** — `[line]` (InlineCode) or `[tokens]` (CodeBlock) wins. Skip highlighter call entirely. Escape hatch for callers that already have tokens (e.g. server-rendered, hand-crafted, etc.).
2. **Explicit string** — `[code]` input. Combined with `language` → auto-tokenize.
3. **Projected `<ng-content>`** — read `textContent` (or `<pre><code>.innerText` for CodeBlock) once via `afterNextRender`, store in a `projectedText` signal. Combined with `language` → auto-tokenize.

`CodeBlock`'s multi-file mode follows the same precedence per-file: `file.tokens` → `file.code` → no projection (multi-file doesn't support it).

## Bundle topology (verified)

```
dist/interop/
  fesm2022/
    interop.mjs                                  ← no `from 'shiki'` (only JSDoc mentions)
    interop-highlighters-shiki.mjs               ← `import { createHighlighter } from 'shiki'`
  highlighters/shiki/
    package.json                                 ← module/typings pointers
  package.json                                   ← exports map declares `./highlighters/shiki`
```

`shiki` is declared in `interop`'s `peerDependencies` as `optional`. A consumer that doesn't use the adapter never resolves the dependency.

## Workspace path mapping gotcha

The workspace dev experience uses TypeScript `paths` to short-circuit module resolution to source files. Both:

```
tsconfig.json (root)
projects/demo/tsconfig.app.json
```

…declare paths. **The demo's tsconfig overrides root paths and points at sources directly.** When adding a new secondary entry point, you must add it to **both** files, plus the demo's `include` array if the source lives outside `projects/interop/src/`.

Failing to do this manifests as `TS2307: Cannot find module 'interop/highlighters/shiki'` during `ng build demo`.

## Things to know when editing

- **Adding another adapter (e.g. Prism).** Same pattern as shiki: new folder under `projects/interop/highlighters/<name>/`, own `ng-package.json`, implement `Highlighter`. Add `<name>` to peer deps as optional. Update tsconfig paths.
- **Changing the contract.** Anything load-bearing (return type shape, sync/async behavior) is breaking for both consumers and adapters. The current shape was chosen because `HighlightedCode | Promise<HighlightedCode>` lets adapters be honest about cold-start cost without forcing every caller into async. Don't widen this without a strong reason.
- **Adding a new consumer.** Inject the token optionally. Inside an `effect()`, watch `(language, sourceText)`, call `highlight()`, store the result. Always include the race guard. Always emit the dev-mode warning when language is set but no highlighter exists (silently failing is hostile to debugging).
- **Themes.** The current `ShikiHighlighter` takes one theme via constructor option. Per-block theme switching would require either multiple adapter instances or an enhanced contract (`highlight(code, language, theme?)`). Treat as out of scope until a real use case lands.

## Known gaps

- **Cache is unbounded.** Per-instance Map grows for the session. Cap with LRU when this matters.
- **First-paint flash on cold path.** `InlineCode`'s width can shift slightly when tokens replace plain text. Sync-by-default (pre-warmed) is the mitigation; no DOM-level skeleton.
- **No SSR story.** Async adapters can't render during server-side rendering. A sync-only fallback adapter (e.g. read pre-computed tokens from a fixture JSON keyed by hash) would be needed for SSR. Not built.
- **`fromShikiTokens` location.** Lives in `interop-code-renderer/adapters/shiki-adapter.ts`, exported from the main `interop` barrel. It's a type-shape helper with no runtime shiki dep, but the file name and barrel placement are misleading. Could move to `lib/highlighter/`. Cosmetic.
