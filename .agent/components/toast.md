# Toast — Mental Model Card

A toast is a short message about something the user just did, shown in a corner
of the window. It moves no focus. Research:
[prompts/TOAST-REVIEW.md](../../prompts/TOAST-REVIEW.md).

Show the result in the page where you can. A saved form says so next to its
button. An error goes next to its cause, as `role="alert"` or in the field's
error message. A toast is for a message with nowhere in the page to go.

## Files

```
projects/interop/toast/
  interop-toast.structure.css   the region, the toast, the icon; names list at the top
  interop-toast.base.css        token values and the four itx-color edges
  toast.ts                      InteropToasts directive
  public-api.ts
projects/interop/src/toast.ts   toast(), bindToasts(), framework-free
```

The demo page is `projects/demo/src/app/components/toast/`. The demo's region is
in `app.html`.

## Markup

The author writes the region once, in the app shell after the main content:

```html
<section interop-toasts popover="manual" aria-label="Notifications"></section>
```

`toast()` writes each toast into it:

```html
<div interop-toast itx-color="success" data-timeout="6000">
  <svg interop-icon aria-hidden="true">…</svg>
  <div><p>Crate jettisoned</p><p>Bay 4 is empty</p></div>
  <button interop-button itx-size="sm" type="button" command="--dismiss" commandfor="interop-toasts-1">Undo</button>
  <button interop-button="icon" itx-size="sm" type="button" command="--dismiss" commandfor="interop-toasts-1" aria-label="Dismiss">…</button>
</div>
```

```ts
toast('Message sent', { description: 'To the harbor master' });
toast('Hull breach in bay 2', { color: 'danger' });
toast('Crate jettisoned', { color: 'success', action: { label: 'Undo', run: restore } });
toast('Link copied', { timeout: 6000 });
```

`toast()` returns the toast element. Remove it to dismiss the toast. Options:
`color`, `description`, `action`, `timeout`, `region`, `dismissLabel` and `status`
(the `announce()` fallback).

## Behavior

- **Announcing.** `toast()` calls `announce()` from the toast element: the message
  and description, at `high` priority for `danger`, else `normal`. No toast and
  no region is a live region. `ariaNotify()` needs none, which removes the
  live-region-before-content problem.
- **Staying.** A toast stays until it is dismissed. `timeout` is opt-in and at
  least 5000 ms. `bindToasts()` ignores it for `danger` and for a toast with an
  action, and the audit says so.
- **Pausing.** A timer stops while the pointer is over the region, while focus is
  in it, and while `document.hidden`. It resumes with the time left. Pausing
  reads `:hover`, `contains(activeElement)` and `document.hidden` on each event,
  so no flag can stick.
- **Dismissing.** Every toast has a Dismiss button. It and the action are
  `command="--dismiss"` aimed at the region. The region's `command` listener
  removes the toast; the action's `click` listener runs first. Escape in a toast
  removes it and stops the event, so a dialog around the region stays open.
- **Focus.** When a toast that held focus goes, focus moves to the first control
  of the toast now in its place, else the one before it, else to where focus was
  before it entered the region. The handoff runs from a MutationObserver,
  because Chrome fires no `focusout` when a focused element is removed. Any
  removal is handled: a command, Escape, a timer, or the app's own `remove()`.
- **The region** shows (`togglePopover(true)`) when `toast()` adds to it and hides
  when the last toast goes. Hidden, it is not a landmark. A region inside a
  dialog empties when the dialog closes.
- **Modal dialogs.** A popover outside an open modal dialog is inert: it paints
  above the dialog, but clicks, focus and the accessibility tree miss it. A
  dialog that raises toasts holds its own region. `toast()` picks the region in
  the modal dialog that holds focus, else the page's region outside any dialog.
- **Keyboard reach.** No hotkey. The region follows the main content in the DOM,
  so Tab reaches it after the page, and screen reader users reach it from the
  landmarks list. Offer every toast action somewhere in the page too.

## Look

- The region is fixed at the block-end, inline-end corner, `--itx-toasts-inset`
  (16px) from the edges. Toasts stack in a column, newest last. The column is
  `min(22rem, 100vw - 32px)` wide and scrolls when it is taller than the window.
- A toast has a 1px `neutral-500` edge (3:1 against the page) and a shadow. Its
  inline-start edge is `--itx-border-width-strong` (2px) in the status color. It
  flips sides in RTL. The house radius applies.
- `itx-color` sets the status edge and a Tabler icon: `circle-check`,
  `info-circle`, `alert-triangle`, `alert-circle`. The icon shows the status in
  its shape, so it is never color alone. Each status color is 3:1 against the
  toast and the page in both schemes; `styles/contrast.spec.ts` measures them.
- The message is weight 600 and the description 400, both 14/20px.
- A toast slides in over `--itx-transition-duration-slower` and disappears at
  once. Reduced motion zeroes the slide.
- Forced colors map the borders. The status edge takes the text color there,
  and the icon still shows the status.

Carbon's 3px edge became 2px, because every border width reads a shared token
for the contrast preference. Carbon's 288px width became 352px (22rem), because
an action and the Dismiss button left about 120px of text at 288.

## Dev audit rules

| Rule | Flags |
|---|---|
| `toasts-name` | A region with no accessible name |
| `toasts-popover` | A region that is not `popover="manual"` |
| `toasts-stack` | More than three toasts at once |
| `toast-timeout-ignored` | `data-timeout` on a `danger` toast or one with an action |
| `toast-under-modal` | A toast outside the open modal dialog |

## Tests

- `src/toast.spec.ts`: markup, announcement and priority, the dismiss command,
  the action, Escape, timeouts and their minimum, ignored timeouts, the pause,
  focus handoff and return, a dialog's region emptying on close.
- `src/audit.spec.ts`: each rule except `toast-under-modal`, which needs `:modal`
  (jsdom has none).
- `a11y/a11y.spec.ts`: axe on three toasts as `toast()` writes them.
- `styles/contrast.spec.ts`: text, edge, and every status color.
- Chrome 155, on the demo:
  - Enter on a trigger shows the toast. The accessibility tree is
    `region "Notifications"` with the text and `button "Dismiss"`.
  - Tab from the page reaches the toast. Enter on Dismiss moves to the next
    toast, then back to the page element, and the region hides.
  - In a modal dialog, the toast goes to the dialog's region and can be hit.
    Escape removes it and the dialog stays open; a second Escape closes the
    dialog.
  - A 6 s toast leaves after 6 s, and is still there after 8 s with the pointer
    on it.
  - axe in a real browser, with contrast, finds nothing on the shown toasts.
  - Dark, forced colors, RTL and 320px all hold.
- Not yet tested: speech output from any screen reader, and Firefox and Safari.

## Not built

- A hotkey (F6 or F8). Add one when a consumer needs it, intercepting only while
  the region holds toasts.
- Undo for any dismissal, clear-all, and a history of dismissed toasts. The
  unmerged branch `origin/ITX-7-toast-chi` holds a Prime version of clear-all
  with undo.
- Coalescing repeated messages ("Docking failed ×3"). The `toasts-stack` rule
  flags the flood instead.
- An exit animation. A fade keeps a dismissed toast rendered after focus has
  moved on.

## Prime

Prime's `InteropToastService` and `InteropToastViewport` made each toast a
`role="status"` inserted already full, which most screen readers skip, and
left two pre-rendered live regions empty. A focused dismissal dropped focus to
`<body>` and froze every timer. Toasts with actions timed out, and a global
Alt+T hotkey swallowed typing. Do not reintroduce the handle and its Subjects,
`observe()`/`promise()`, swipe, the hotkey, the injected config, or named
positions.
