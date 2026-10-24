# Dialog — Mental Model Card

A dialog is a native `<dialog interop-dialog>` with the house look. CSS only.
The browser opens it, keeps focus inside a modal, makes the page inert, closes
it on Escape and returns focus. Research:
[prompts/DIALOG-REVIEW.md](../../prompts/DIALOG-REVIEW.md).

```html
<button interop-button type="button" commandfor="rename" command="show-modal">Rename…</button>
<dialog id="rename" interop-dialog aria-labelledby="rename-title">
  <header>
    <h2 id="rename-title">Rename file</h2>
    <button interop-button="icon" itx-size="sm" type="button" commandfor="rename" command="request-close">
      <span itx-visually-hidden>Close</span><svg interop-icon name="tabler-x"></svg>
    </button>
  </header>
  <form method="dialog">
    <label for="file-name">Name</label> <input id="file-name" autofocus>
    <footer><button interop-button type="submit" value="save">Save</button></footer>
  </form>
</dialog>
```

## Files

```
projects/interop/dialog/
  interop-dialog.structure.css   layout, header and footer, motion, backdrop, scroll lock; names list at the top
  interop-dialog.base.css        token values
  public-api.ts                  empty: CSS only
```

The demo page is `projects/demo/src/app/components/dialog/`.

## Behavior, all native

| Job | Markup |
|---|---|
| Open as a modal | `command="show-modal"`, or `dialog.showModal()` from code when no button opens it |
| Close | `command="close"`, or a submit button in `<form method="dialog">` |
| Close the way Escape does | `command="request-close"`: fires `cancel` first, so a guard runs |
| Report the choice | The submit button's `value` becomes `dialog.returnValue`; Escape leaves it empty. Read it on `close` |
| Close on a click outside | `closedby="any"`. Never for a form or an alert. Not in Safari yet: there it closes with Escape and its buttons |
| Only buttons close it | `closedby="none"`. Safari still closes it on Escape |
| Guard unsaved input | A `cancel` listener that calls `preventDefault()`. A browser allows this once per user action: Escape pressed repeatedly closes the dialog anyway; a click on a `request-close` button is refused every time |
| Initial focus | The first control, or the element with `autofocus`. A destructive confirmation focuses the least destructive button. Long content: `tabindex="-1" autofocus` on the heading. Chrome 155 ignores `autofocus` on the dialog itself |
| Focus return | To the button that opened it, or to what had focus before `showModal()` |
| An open popover | `showModal()` closes it |

Never mirror the open state in a signal, cancel `cancel` to lock Escape, or
test for a click outside with `event.target === dialog`: a click on the
dialog's own padding has that target.

## Look

| Concern | How |
|---|---|
| Placement | `position: fixed; inset: 0; place-self: center; margin: 0`, so a page's margin reset cannot move it |
| Size | Up to `--itx-dialog-inline-size`, and the window less `--itx-dialog-inset` on each side. Taller content scrolls inside the dialog; `overscroll-behavior: contain` stops the page moving |
| Layout | A flex column with `--itx-dialog-gap`. `> header` puts the heading and a close button in a row, the button at the inline end of the first line. `> footer` and `> form > footer` put the actions at the inline end and wrap them |
| Scroll lock | `:root:has(dialog[interop-dialog]:modal) { overflow: hidden; scrollbar-gutter: stable }` |
| Motion | Fades and rises in; the backdrop fades in. It disappears at once, like the popover |
| Edge | In light, the dialog's fill against the dimmed page: 3.81:1. In dark, its border: 4.11:1 (WCAG 1.4.11, tested) |
| Focus | The shared ring, when the dialog itself has focus |
| Forced colors | The border and the focus ring remain; the backdrop still dims |

| Token | Default |
|---|---|
| `--itx-dialog-inline-size`, `-inset` | 32rem, `--itx-space-4` |
| `--itx-dialog-padding-block`, `-padding-inline`, `-gap` | `--itx-space-6`, `--itx-space-6`, `--itx-space-4` |
| `--itx-dialog-color`, `-background-color` | neutral-900/50, neutral-50/800 |
| `--itx-dialog-border-width`, `-border-style`, `-border-color` | 1px (2px with more contrast), solid, neutral-500 |
| `--itx-dialog-border-radius`, `-corner-shape` | the house radius and corner shape |
| `--itx-dialog-box-shadow` | a soft shadow |
| `--itx-dialog-backdrop-color` | black at 50%, the same as the drawer's |
| `--itx-dialog-transition-duration`, `-transition-timing-function` | the slower shared duration, the shared easing |

## Alert dialog

`role="alertdialog"` with `aria-describedby` on the message, usually
`closedby="none"`, and `autofocus` on the safe answer.

## Dev audit rules

| Rule | Flags |
|---|---|
| `dialog-name` | No name, or `aria-labelledby` pointing at nothing with text |
| `dialog-close` | `closedby="none"` with no button inside that closes it |
| `dialog-alert-description` | An alert dialog with no `aria-describedby` |

## Tested

Style guards: contrast, radius, motion. axe on an open dialog with a header,
close button and form. Audit rules have specs.

In Chrome 155 with real keys: opening, focus on the first control or
`autofocus`, Escape, focus return, the `cancel` guard with Escape and with the
close button, `closedby` both ways, the alert dialog's role and description,
scroll lock, a long dialog at 320px, light, dark and forced colors.

Not tested: Safari, Firefox, iOS scroll lock, screen reader output.

## Not built

A non-modal dialog (use a popover), a modal side sheet, a `closedby`
polyfill, exit motion, a close button inserted by Interop.

## Go to page

A search field over a list of links in a dialog, the pattern called a command
palette: see [command-palette.md](command-palette.md).
