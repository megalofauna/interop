# Dialog — Research Review

Review of Prime's `InteropDialog` in `projects/interop_deprecated`, run against
[new-component-research.md](new-component-research.md) with the
[prime-review workflow](../.agent/workflows/prime-review.md).

## Decision

Rebuild the dialog as CSS on the native `<dialog>`, with no directive. Prime's
six inputs each have a platform equivalent now, and two of them were broken.
Opening, closing, Escape, light dismiss, focus in and out, inert background and
the return value are all native. Interop adds the look, a scroll lock, motion,
naming rules in the dev audit, and documented patterns.

| Prime use | Really | Interop |
|---|---|---|
| Confirmation and form dialogs (demo) | A modal dialog | `dialog[interop-dialog]`, opened with `command="show-modal"` |
| "Escape locked" dialog (demo) | A dialog that only a button closes | `closedby="none"` |
| Stepper "finished" confirmation | A modal opened by an event, not a button | `dialog.showModal()` from the event handler |
| Command palette | A modal dialog holding a combobox | `<dialog closedby="any">` + the future combobox |

| Prime input | Now |
|---|---|
| `isOpen` | `command="show-modal"` / `command="close"`, or `showModal()` / `close()`. No mirrored state |
| `dismissOnBackdrop` | `closedby="any"` |
| `disableEscape` | `closedby="none"` |
| `autoFocus` | `autofocus` on the element |
| `returnFocus` | Native: focus returns to the button that opened it |
| `autoClose` + `(closed){reason}` | `<form method="dialog">`; the submitting button's `value` becomes `returnValue` |

| Question | Decision |
|---|---|
| Is Prime's dialog doing what it intends? | Opening and closing, yes. Its close reasons are wrong in three cases, its Escape lock fails on the third press, and its `autoFocus` threw on every open until August without anyone noticing, because native focus covered for it |
| Is it a dialog? | Yes: it drives a native `<dialog>` with `showModal()`. Modal only. Its demo dialogs are all unnamed |
| Prerequisites | Button and `InteropInvoker`: built. Scroll lock, dialog tokens and audit rules: part of this build. Combobox: only for the command palette |
| Can an invoker replace script? | Opening, closing, a cancel that runs the Escape path (`request-close`), and the return value. Opening from a hotkey or an event, and acting on the return value, stay script |

## 0. Names

| Name | Used by |
|---|---|
| dialog | HTML, ARIA, APG, Fluent, Spectrum, React Aria, Radix, Base UI, Ark, Angular CDK and Material, Web Awesome |
| modal, modal dialog | Carbon, USWDS, MoJ; HTML's `showModal()` and `:modal` |
| alert dialog | ARIA `alertdialog`, APG, Radix, Base UI, Spectrum |
| sheet, bottom sheet, side sheet | Apple HIG, Material |
| drawer | Fluent, Base UI, Web Awesome, Material (navigation) |
| panel, flyout | Fluent (WinUI) |
| lightbox, overlay | Informal |

`dialog` is the element and the role. "Modal" is how it opens.

## 1. Prime

293 lines of TypeScript, about 120 of them code, a 534-line spec and 231 lines
of CSS. Git history: it arrived in a bulk import. A May rework made the native
`close` event the single point that emits `(closed)`. An August fix found that
`autoFocus` had "never worked".

About 30 lines exist only to drive the dialog from an Angular signal. The rest
redo things the browser does: focus on open (43 lines with focus return),
backdrop dismissal and the Escape lock.

### What held

- A native `<dialog>` with `showModal()`: top layer, inert page, Escape.
- One `(closed)` emission per close, from the native `close` event.
- Focus return with `preventScroll`.
- A dev warning for a dialog with no name.
- The CSS shape: an entry transition from `@starting-style`, and a backdrop
  that fades with it.

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | Every demo dialog is unnamed, and the name check only tests that an attribute exists, once, at mount. The new library's button demo also has an unnamed dialog | 4.1.2 | High |
| 2 | A click on the dialog's own padding closes it, and so does a text selection dragged out to the backdrop. Typed input is lost | 3.2.2, 3.3.4 | High |
| 3 | Backdrop dismissal is on by default, including for forms | 3.3.4 | Medium |
| 4 | No scroll lock: the page scrolls behind an open modal (checked: a 400px wheel scrolls it 400px) | 2.4.3 | Medium |
| 5 | `autoFocus` moves focus a second time after the browser has placed it, so screen readers can announce twice | 2.4.3 | Medium |
| 6 | No guidance for initial focus: APG asks for the least destructive button in a destructive dialog, and a static element for long content | 2.4.3 | Medium |
| 7 | In dark mode the backdrop separates the dialog from the page at 1.27:1; only the shadow carries it | 1.4.11 | Medium |
| 8 | A dialog that focuses itself has only the browser's focus ring | 2.4.7 | Low |
| 9 | No `alertdialog` guidance | 4.1.2 | Low |

### Bugs

1. With `disableEscape`, Escape closes the dialog on the third press. Chrome
   lets a page cancel a close request only once per user activation (checked in
   Chrome 155). The close is then reported as `"programmatic"`.
2. If the consumer does not set `isOpen` to `false` in `(closed)`, the dialog
   cannot be opened again: `set(true)` on a signal that is already `true`
   changes nothing.
3. `autoClose` with a plain `<form>` closes the dialog without cancelling the
   submit, so the page navigates. The demo section is commented out.
4. A close from `method="dialog"`, or the command palette running a command,
   is reported as `"programmatic"`.
5. A dialog destroyed while open, for example by a route change, emits nothing
   and returns no focus.
6. A `returnFocus` element that no longer exists sends focus to the body.
7. The dev warning about a `transform` on an ancestor is false. The top layer
   ignores ancestor transforms, and the spec file tests the false claim.

The spec file never presses a real Escape: it dispatches `cancel` and then
calls `close()`. The `autoFocus` test passes only because its target is the
first control. One test asserts nothing.

## 2. Evidence

- **NN/g** ([Modal & Nonmodal Dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/)):
  - Modals interrupt and hide the context the user may need.
  - Use them for critical warnings, information that blocks a process, and short steps.
  - Don't use them for form errors or decisions that need the hidden page.
- **GOV.UK** has no modal component. Its backlog says to avoid modals "in most
  cases", with session timeout as one of the few exceptions
  ([backlog #30](https://github.com/alphagov/govuk-design-system-backlog/issues/30)).
  - Its research found that VoiceOver on iOS and TalkBack ignore `aria-modal`.
    `showModal()` makes the page inert, which fixes this.
- **APG** ([dialog modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)):
  - Focus the first control by default.
  - Focus a static element at the top for long content.
  - Focus the least destructive action for an irreversible step.
  - Return focus to the invoker, or to a logical place if it is gone.
- **HTML** now focuses the dialog itself when it has nothing focusable
  (checked in Chrome 155).
- **WebKit** has reported VoiceOver bugs with `showModal()` and shadow DOM
  ([245549](https://bugs.webkit.org/show_bug.cgi?id=245549)). Interop's light
  DOM avoids that one.
- **Light dismiss** is off by default for modals in HTML and Web Awesome, and
  Base UI forbids it for alert dialogs. A form loses its input to a stray click.

## 3. The platform, checked in Chrome 155

| Feature | Result |
|---|---|
| `command="show-modal"` | Opens; focus goes to the first control |
| Escape | Fires `cancel` then `close`; focus returns to the opening button |
| `closedby="any"` | A click on the backdrop closes; a click on the dialog's padding does not |
| `closedby="none"` | Escape and the backdrop do nothing |
| `cancel` cancelled | The first two presses are blocked; the third closes |
| `command="request-close"` | Fires `cancel`, then closes |
| `<form method="dialog">` | The pressed button's `value` becomes `returnValue` |
| No focusable content | The dialog itself takes focus |
| An open auto popover | `showModal()` closes it |
| Page scroll | Not locked. `html:has(dialog:modal) { overflow: hidden }` locks it |
| `aria-labelledby` to the heading | Named "Delete file?" in the accessibility tree |
| `closedby`, `requestClose`, `:open`, `transition-behavior`, `overlay` | All supported |

Elsewhere, from caniuse and MDN:

| Feature | Firefox | Safari |
|---|---|---|
| `closedby` | 141 | Not shipped (Technology Preview); an Interop 2026 target |
| `requestClose()` | 139 | 18.4 |
| Invoker commands | 144 | 26.2 |
| `:open` | 136 | 26.5 |
| `overlay` (exit animation in the top layer) | No | No |

In Safari, `closedby="any"` falls back to Escape only, and `closedby="none"`
still lets Escape close the dialog.

## 4. Prerequisites in Interop

| Piece | Status |
|---|---|
| `button[interop-button]`, `InteropInvoker` for `commandfor` in Angular | Built |
| Popover, drawer | Built. The drawer stays non-modal; a modal side sheet would be a `<dialog>` |
| Transition and radius tokens | Built |
| Scroll lock | Part of this build: one CSS rule |
| Dialog tokens, look and motion | Part of this build |
| Audit rules: name, `aria-labelledby` resolves, a way to close | Part of this build |
| Combobox | Not built. Needed only for the command palette |

## 5. Invokers

| Job | Invoker? |
|---|---|
| Open as a modal | Yes: `command="show-modal"` |
| Close | Yes: `command="close"`, or a button in `<form method="dialog">` |
| A Cancel or X button that behaves like Escape | Yes: `command="request-close"`; a `cancel` guard runs on every click |
| Return which button closed it | Yes: the button's `value` becomes `returnValue` |
| Open non-modally | No built-in command. `popover` covers non-modal panels |
| Open from a hotkey or an event | No: script calls `showModal()` |
| Act on the result, guard a dirty form, submit asynchronously | No: `close` and `cancel` listeners, or the form's `submit` |

## 6. What carries over

1. The CSS shape: entry from `@starting-style`, the backdrop fading with the
   dialog. Use logical properties, and drop the `@supports not` copies, since
   `transition-behavior` is Baseline.
2. Position with `inset`, not `margin`, so a consumer's margin reset cannot
   move the dialog.
3. The name check, moved to `audit.ts` and run on every audit: a name exists,
   and an `aria-labelledby` target exists.
4. `preventScroll` when focus returns.
5. Lessons:
   - Never mirror the dialog's open state in a signal.
   - Never cancel `cancel` to lock Escape.
   - Never test for a backdrop click with `event.target === dialog`.

## Questions for you

1. **CSS only, no directive.** `dialog[interop-dialog]`, opened and closed by
   invokers or by `showModal()`. Recommended.
2. **Close reasons.** Use `returnValue` from button values, with no reason
   enum. Escape and a backdrop click both come back as an empty
   `returnValue`. Recommended.
3. **Safari `closedby`.** No polyfill: a dialog still closes with Escape and
   its buttons, and Safari has the feature in Technology Preview. A
   `closedby="none"` dialog in Safari closes on Escape. Recommended; the
   alternative is a small `bindDialog()` with a corrected backdrop test.
4. **Exit motion.** Fade in and disappear at once, like the popover. Recommended:
   one motion rule for every top-layer surface, and `overlay` exists only in
   Chrome. The alternative is a fade out in Chrome only.
5. **Variants.** None now. `role="alertdialog"` is markup plus an audit rule
   that requires a description. A modal side sheet waits for a use.
   Recommended.
6. **Close button.** The consumer writes it; Interop inserts no nodes. Recommended
   pattern, checked in Chrome 155:

   ```html
   <dialog id="edit" interop-dialog aria-labelledby="edit-title">
     <header>
       <h2 id="edit-title">Edit name</h2>
       <button interop-button type="button" commandfor="edit" command="request-close">
         <span itx-visually-hidden>Close</span><svg interop-icon name="tabler-x"></svg>
       </button>
     </header>
     …
   </dialog>
   ```

   - `request-close` takes the Escape path: it fires `cancel`, so a guard for
     unsaved input runs for the X as well. A click counts as user activation,
     so the guard holds on every click (three of three blocked). `close`
     skips `cancel`; use it where nothing needs guarding.
   - It works with `closedby="none"`, which blocks only Escape and the backdrop.
   - The CSS lays out `header` as the heading with the button at the inline end.
   - Put `autofocus` on the first field. Otherwise the X, as the first control,
     takes focus on opening.
   - Audit rule: a `closedby="none"` dialog with no control inside that closes it.

7. **Scroll lock scope.** `html:has(dialog[interop-dialog]:modal)`, Interop
   dialogs only. Recommended over every `dialog:modal` on the page.

## Unverified

- Safari support for the `request-close` command (Safari has `requestClose()` from 18.4 and invoker commands from 26.2).
- Safari and Firefox behavior; iOS scroll lock with `overflow: hidden` on the root.
- Screen reader output with real assistive technology.
- Windows forced colors for the backdrop.
- Apple HIG, Material, Radix and Angular names, which come from memory.
