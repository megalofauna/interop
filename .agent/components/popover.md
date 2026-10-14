# Popover — Mental Model Card

A popover is the platform's `popover` attribute with `interop-popover` styles.
The browser opens it, closes it on Escape or a click outside, and reports
whether it is open. A button opens it with `popovertarget` or
`command="toggle-popover" commandfor="…"`, and is its anchor.

```html
<button interop-button type="button" popovertarget="details">Details</button>
<div id="details" interop-popover popover>…</div>
```

## Files

```
projects/interop/popover/
  interop-popover.structure.css   placement, the last-resort fallback, the drawer
  interop-popover.base.css        token values
  popover.ts                      InteropDrawer directive
  public-api.ts
projects/interop/src/bind-drawer.ts   bindDrawer(), framework-free
```

## Anchored popover

| Concern | How |
|---|---|
| Placement | `position-area` from `--itx-popover-position-area`, below the anchor at its inline start. `position-try-fallbacks` flips it |
| Last resort | `--itx-popover-scroll`: centered on the anchor, capped to the space, so its content scrolls and stays in reach (WCAG 1.4.10) |
| Width | As wide as its content, up to `--itx-popover-max-inline-size` and the window |
| Edge | A border at 3:1 against the page (WCAG 1.4.11) |
| Motion | It fades in and disappears at once. A fade out keeps a closed popover rendered, and Chrome can then lose the name or description of a control that points into it |
| Text only | A popover with only text needs `tabindex="-1"` and `autofocus`, so the keyboard can scroll it |

## Drawer

`interop-popover="drawer"` is a full-height panel at the inline start of the
window, over the page, with a `::backdrop`. It slides in, and disappears at
once. Its corners against the window edge are square; the others take the house
radius.

```html
<button interop-button type="button" commandfor="site-nav" command="toggle-popover">Menu</button>
<nav id="site-nav" interop-popover="drawer" popover aria-label="Pages">…</nav>
```

A popover is not modal. `bindDrawer(popover)`, or `InteropDrawer` on
`[interop-popover="drawer"]` in Angular, adds:

| Concern | Behavior |
|---|---|
| Opening | Focus moves to the link marked `aria-current`, else the first thing that takes focus |
| Focus leaving | It closes, so the keyboard never reaches page content hidden behind it (WCAG 2.4.11). Focus leaving the window does not close it |
| Following a link | It closes, since in an app the page changes under it |

The browser does the rest: Escape and a click outside close it, closing returns
focus to the button that opened it, and the button reports expanded or
collapsed. Tabbing out of it continues from that button.

A drawer can also show in the page as a sidebar at wide sizes: see
[app-shell.md](app-shell.md).

| Token | Default |
|---|---|
| `--itx-popover-position-area`, `-position-try-fallbacks` | below at the inline start; flips, then the scroll fallback |
| `--itx-popover-margin-block`, `-margin-inline` | `--itx-space-1`, 0px |
| `--itx-popover-max-inline-size` | 32rem |
| `--itx-popover-padding-block`, `-padding-inline` | `--itx-space-2`, `--itx-space-3` |
| `--itx-popover-color`, `-background-color` | neutral-900/50, neutral-50/800 |
| `--itx-popover-border-width`, `-border-style`, `-border-color` | 1px, solid, neutral-500 |
| `--itx-popover-border-radius`, `-corner-shape` | the house radius and corner shape |
| `--itx-popover-box-shadow` | a soft shadow |
| `--itx-popover-transition-duration`, `-transition-timing-function` | the shared transition tokens |
| `--itx-popover-drawer-inline-size` | `min(20rem, 100% − --itx-space-12)`: a strip of the page stays in view |
| `--itx-popover-backdrop-color` | black at 50% |
