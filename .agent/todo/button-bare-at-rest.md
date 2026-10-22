# Todo — a button setting with no fill or edge at rest

**Status:** todo, name open
**Raised:** 2026-10-19, from the toolbar's planned `channel` look

## What

A button that draws no fill and no edge at rest, and shows its edge on hover.
Pressed keeps the button's doubled edge (WCAG 1.4.1, 1.4.11). It is a value of
the identity attribute, combinable with `icon`:

```html
<button interop-button="icon <name>" type="button" aria-label="Bold">…</button>
```

## Why it waits

The toolbar's `channel` look gets these buttons by setting `--itx-button-*`
tokens on the buttons inside it. A button setting earns its place when a second
context wants the same buttons outside a toolbar: card headers, dialog title
bars, a code block's copy button. Then `channel` uses the setting instead of
scoping the tokens.

## Name

Mechanical, read as a setting rather than a style or a mood. Not "quiet", not
"ghost". Candidates:

| Name | Reads as |
|---|---|
| `flush` | Mounted level with the surface: no raised fill, no rim |
| `recessed` | Set into the surface |
| `bare` | No housing |
| `standby` | Present, not drawing attention until touched |

## Checks when built

- Contrast spec: the hover edge and the pressed edge, 3:1 against the page.
- Forced colors: a transparent edge at rest must still leave the button
  findable; confirm in Chrome with `--media forced-colors`.
- Target size: unchanged, since only paint changes.
