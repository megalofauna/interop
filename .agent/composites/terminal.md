# Terminal — Mental Model Card

## Files

```
projects/interop/src/lib/composites/terminal/
  terminal.ts           Component class
  terminal.html         Template (reset button + scroll wrapper + log + cursor)
  terminal.css          Structural CSS (styleUrl, `:where()` on all children)
  public-api.ts         Barrel

src/lib/styles/themes/protocol/composites/terminal.css
                        Protocol theme token values for both variants
```

## Variants

### `terminal` (default)
Retro phosphor look. Dark surface (`oklch(8%)`), bright green text with CSS glow (`text-shadow`), blinking block cursor, optional CRT scan-line overlay. Fun and atmospheric.

### `plain`
Minimal log view. Transparent background, inherits surrounding text color, no glow, no theatrics. Use wherever you want structured output without the retro aesthetic — dev panels, event logs, output panes.

```html
<!-- retro default -->
<itx-terminal [entries]="log" />

<!-- no-frills log view -->
<itx-terminal variant="plain" [entries]="log" />
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `variant` | `'terminal' \| 'plain'` | `'terminal'` | Visual variant |
| `entries` | `TerminalEntry[]` | `[]` | Log entries to display |
| `maxEntries` | `number` | `200` | Cap before oldest entries are dropped |
| `prompt` | `string` | `'›'` | Glyph shown before each line and the cursor |
| `scanLines` | `boolean` | `false` | Overlay CRT scan-line pattern (terminal variant) |

## Outputs

| Output | Type | Description |
|---|---|---|
| `reset` | `void` | Emitted when the clear button is clicked |

## TerminalEntry interface

```typescript
interface TerminalEntry {
  text: string;
  time?: number;  // Epoch ms. When present, shows a relative delta prefix [+0.0s]
}
```

## Auto-scroll

An `effect()` watches `entries.length`. On every push it schedules `el.scrollTop = el.scrollHeight` via `queueMicrotask()` — deferred one tick so Angular has flushed the new DOM node before measuring.

## Reset button

Appears only when `entries().length > 0`. Positioned absolutely at `top/inset-inline-end: var(--itx-spacing-2)` within the `:host` (`position: relative`). Emits `reset` — the consumer is responsible for clearing the entries array.

## Token API

All tokens are public custom properties. Set them on `:host` or any ancestor.

| Token | Default fallback | Applies to |
|---|---|---|
| `--itx-term-max-height` | `18rem` | Scroll area max-height |
| `--itx-term-padding` | `1rem` | Log body inner padding |
| `--itx-term-radius` | `0` | Scroll wrapper border-radius |
| `--itx-term-font-family` | `ui-monospace, …` | All log text |
| `--itx-term-font-size` | `0.8125rem` | All log text |
| `--itx-term-line-height` | `1.65` | All log text |
| `--itx-term-background` | `transparent` | Scroll wrapper background |
| `--itx-term-color` | `inherit` | All log text |
| `--itx-term-glow` | `none` | `text-shadow` on log body |
| `--itx-term-prompt-color` | falls back to `--itx-term-color` | Prompt glyph |
| `--itx-term-delta-color` | falls back to `--itx-term-color` | Timestamp delta |
| `--itx-term-caret-color` | falls back to `--itx-term-color` | Blinking cursor |
| `--itx-term-scrollbar-color` | `transparent` | Scrollbar thumb |
| `--itx-term-scan-line-color` | `oklch(0% 0 0 / 0.2)` | Scan-line overlay |

The Protocol theme sets all tokens for both variants in `protocol/composites/terminal.css`. The structural CSS carries no hardcoded color values — only layout defaults.

## CSS strategy notes

- Structural CSS lives in `terminal.css` (component `styleUrl`, emulated encapsulation).
- All child selectors wrapped in `:where()` for near-zero library-added specificity. `:host` and `:host(.class)` selectors use Angular's emulated encapsulation directly — no `:where()` wrapper there.
- Private resolved slots use `--_` prefix; public API uses `--itx-term-*`.
- State classes on `:host`: `itx-term--terminal`, `itx-term--plain`, `itx-term--scan-lines`, `itx-term--active` (set when entries array is non-empty — drives the cursor blink).
- Theme values live entirely in the Protocol theme file; the structural CSS sets only structural fallbacks (sizes, layout) never colors.
