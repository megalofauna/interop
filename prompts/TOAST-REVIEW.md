# Toast — Research Review

Review of Prime's `InteropToastService`, `InteropToastViewport`,
`InteropToastItem` and `InteropToastHandle` in
`projects/interop_deprecated/src/lib/components/interop-toast/`, run against
[new-component-research.md](new-component-research.md).

## Decision

Retire Prime's toast code. Rebuild a small toast on the platform:

- The region is one labeled `<section popover="manual">` in the light DOM.
- Messages are announced with the existing `announce()` helper, which calls
  `ariaNotify()`. Toast elements carry no live-region roles.
- Close is a custom `--dismiss` command.
- A toast stays until it is dismissed. A timer is opt-in, and a toast with an
  action never has one.
- Docs and audit rules steer errors and critical messages to inline status.

The rebuild needs about 120 lines of TS and 100 of CSS. Prime has 1,223 and
382.

```html
<section interop-toasts popover="manual" aria-label="Notifications"></section>
```

```ts
toast('Crate jettisoned', { tone: 'success', action: { label: 'Undo', … } });
```

The toast is built as decided: see
[.agent/components/toast.md](../.agent/components/toast.md).

| Prime use | Really | Interop |
|---|---|---|
| "Docking approved" (success or info, with description) | A status message | `toast()`, or inline text near the trigger plus `announce()` |
| "Crate jettisoned · Undo" | An undo action | `toast()` with an action and no timer. The same action also exists in the page |
| "Hull breach" (error) | An error | Inline `role="alert"` near the cause, or a `<dialog>` if it blocks work. `toast({ tone: 'error' })` is allowed but never timed |
| `loading`, `observe()`, `promise()` | A pending state | `bindPendingAction()` (`aria-busy` on the button), then `toast()` or `announce()` when it settles |
| Fill stack, `dismissAll()` | Demo scaffolding | Nothing |

Prime has no production consumer. Outside its own folder, the toast appears
only in its demo and in comments.

| Question | Decision |
|---|---|
| Does Prime's toast do what it claims? | No. The demo says "each toast is its own live region", but each item is inserted already full, so most status toasts are likely not announced. Five config keys, `afterOpened()` and `altText` do nothing. A focused dismissal drops focus to `<body>`. See §1 |
| Is it the thing its name says? | No spec defines a toast. Against ARIA live regions, the APG Alert pattern and WCAG it misses 4.1.3, 2.2.1, 2.4.3, 1.4.1, 2.4.11 and forced colors |
| What is each use, really? | A status message, an undo action, an error and a pending state. See the table above |
| What does the platform do now? | Chrome 155 ships `ariaNotify`, `popover`, `command`, `@starting-style` and `overlay`. A popover outside an open modal dialog is inert. See §3 |
| What has to exist first? | `announce()`, the icon, the button, the dialog and the audit already exist. The rebuild adds only the region CSS, the `toast()` function and focus handoff on dismissal |
| Can an invoker replace script? | Close: yes, with a custom `--dismiss` command. Showing, timing, pausing and announcing: no. See §5 |
| Accessibility | Nine misses, three high. See §1 |
| Complexity | 1,223 lines of TS. About 18 are the rules worth keeping and about 95 are the pause logic. The rest is RxJS, DI config, swipe and a hotkey |
| What carries over | The rule that anything that does not leave on its own gets a close button, the pause triggers, the Carbon visuals and two audit rules. No code. See §6 |

## 0. Names

| Name | Used by |
|---|---|
| toast | Fluent, Carbon ("toast notification"), React Aria / Spectrum, Radix, Base UI, Ark / Zag |
| snackbar | Material, Angular Material (`MatSnackBar`) |
| notification | Carbon (the family), GOV.UK ("notification banner"), the Scottish Government Design System ("notification message") |
| alert, site alert | USWDS, Shoelace (`<sl-alert>` with `.toast()`), APG (Alert pattern) |
| status, alert, log | WAI-ARIA live-region roles; HTML `<output>` (implicit `status`) |

HTML, ARIA and Apple HIG have no toast. The pick is **toast** for the component
and **Notifications** for the region's label. Toast is the most common name
among the libraries listed. "Notification" names the region, and is what users
hear in the landmarks menu.

## 1. Prime

The TS has 1,223 lines in 7 files: service 388, viewport 257, item 254,
handle 132, types 93, config 72, public API 27. The CSS has 382 lines: 205 of
structure and 177 of theme. There are no spec files.

The mainline history is the migration `a28fb0db`, then focus and token
refactors (`bf75191d`, `65317a81`, `54b1f32c`), then `4ad279e5` moved the
toast to `interop_deprecated`. The following work exists only on the unmerged
branch `origin/ITX-7-toast-chi` (2026-07-12):

- universal dismiss (`7044254b`);
- the viewport drawn as a panel (`9999d4c8`, `bf28cc07`);
- clear-all with undo (`15e5c485`, +119 lines).

None of it is in HEAD.

`prompts/TOAST-RESEARCH.md` asked for live regions rendered empty in advance.
The viewport renders two of them (`interop-toast-viewport.ts:57-71`), and
nothing writes to them.

### What held

- **Duration and dismissal rules** (`interop-toast.service.ts:370-387`). Error,
  warning and loading never time out. Anything that does not leave on its own
  gets a close button.
- **Pause** on hover, focus-within and `document.hidden`
  (`interop-toast-viewport.ts:157-193,241-256`).
- **Errors only are assertive.** `role="alert"` is limited to `error`, so other
  toasts do not interrupt.
- **No toast expires unseen.** A toast that is not rendered has no timer.
- **Carbon visuals.**
  - A 3px `border-inline-start` status bar, which flips in RTL.
  - A 288px panel.
  - A 32px close button that passes 2.5.8.
  - Message and description separated by weight, not by dimming.
- **Specificity.** The structural CSS is all `:where()`, specificity 0.

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | Each item is inserted with its `role="status"` and text already in place. Most screen readers announce changes inside an existing region, not new regions. Success and info toasts are likely silent; the two pre-rendered regions are never written | 4.1.3 | High |
| 2 | Dismissing a focused toast (close, action, Escape) drops focus to `<body>`. The viewport restores focus only when its hotkey brought focus in. Seen on Prime's demo in Chrome 155 | 2.4.3 | High |
| 3 | Toasts with an action still time out after 6 s (`resolveDuration` ignores `action`). The only control is developer config | 2.2.1 | High |
| 4 | `aria-atomic="true"` on an item that contains buttons, so "Undo" and "Close notification" are read as part of the message | 1.3.1 | Medium |
| 5 | Every item has `tabindex="0"`: a focusable `status` with an empty name, one extra Tab stop per toast | 2.4.3, 4.1.2 | Medium |
| 6 | The type is shown only by tint and bar color. No icon, no text | 1.4.1 | Medium |
| 7 | `position: fixed` with `z-index: 9999`. Persistent toasts can cover focused content. Under an open modal dialog they are visible and inert | 2.4.11 | Medium |
| 8 | No `forced-colors` block. The border width is 0, so a toast has no edge except the 3px bar, which is the same color for every type | 1.4.11 | Medium |
| 9 | The `role` and `aria-live` attributes repeat the implicit values. The `role` attribute is set twice, as a static attribute and as a binding. Repeated alert roles are reported to read twice in some pairs | 4.1.2 | Low |

### Bugs

1. **The hotkey blocks typing.** The hotkey handler calls `preventDefault()`
   before it checks for toasts (`:202-204`). Option+T stops typing "†" on every
   page on macOS. It matches `event.code`, so the key is in a different place on
   Dvorak.
2. **The hotkey restore overrides Tab.** A user enters with the hotkey and Tabs
   out. `focusout` moves focus back to the stored element (`:188-192`) and
   ignores the Tab.
3. **The focus ring is always on.** The item's rest rule sets `outline`, not
   `:focus-visible` (`toast.css:86-89`), and `--itx-focus-style: solid` is set
   globally. Every toast draws a 2px ring at all times.
4. **The wide width never applies.** The 99rem breakpoint rebinds
   `--itx-toast-width` on `[interop-root]` (theme `:121-125`). The viewport
   declares its own value (theme `:43`), and that one wins. The 352px width
   never happens.
5. **Selecting text dismisses.** Swipe listens on the whole item in every
   direction. Dragging 50px to select an error's text dismisses it.
6. **A refused swipe leaves the toast where it was dropped.** For a
   `cancelBehavior: 'prevent'` loading toast, the service refuses the dismissal,
   but the item never clears `--_swipe-x/y`. There is also no `pointercancel`
   handler.
7. **`update()` restarts the timer.** The timer effect re-runs on every `toast()`
   change (`interop-toast-item.ts:140-169`).
8. **`observe()` has no `complete` handler** (`service.ts:129-156`).
   - A source that completes without emitting leaves a loading toast forever.
   - After the first `next`, `'unsubscribe'` no longer cancels.
9. **Overflow mounts a toast again.** `slice(-max)` pushes a persistent error
    out of view. When it returns, it is a new item with a fresh timer, and it may
    be announced again.
10. **Two viewports.** Both render every toast. Either one unregistering sets the
    service's `_viewportRegistered` to `false`.

**Test coverage.** No `*toast*.spec.ts` exists in `projects/`. Coverage is zero.

## 2. Evidence

**Toasts are discouraged by several systems.**

- GitHub Primer: "Toasts pose significant accessibility concerns and are not
  recommended for use" (https://primer.style/accessibility/toasts/). Primer
  lists the alternatives:
  - no message for a simple success;
  - a banner for a complex one;
  - a banner or a dialog for errors.
- Adam Silver reports that GitHub tested with NVDA, JAWS, VoiceOver and Dragon
  and found problems "that cannot be addressed with ARIA"
  (https://adamsilver.io/blog/can-you-make-toast-messages-accessible/).
- The Scottish Government Design System: "We advise against using toasts"
  (https://designsystem.gov.scot/components/notification-message/modals-toasts).
- GOV.UK has a notification banner and no toast.

**Toasts and interactive content.**

- Roselli: "accept toasts will be missed by users". Interactive content means
  focus and persistence, which makes it a dialog
  (https://adrianroselli.com/2020/01/defining-toast-messages.html).
- O'Hara: "a toast component should not contain interactive controls". If a
  toast does contain one, put the same action somewhere else in the page too
  (https://www.scottohara.me/blog/2019/07/08/a-toast-to-a11y-toasts.html).
- Radix's `altText` exists for that reason.

**Toasts and errors.**

- NN/g: a toast is "appropriate for passive notifications" and "a bad way to
  implement an error message"
  (https://www.nngroup.com/articles/indicators-validations-notifications/).
- Material allows one snackbar at a time and one action. Angular Material gives
  an action no duration.

**How the main libraries build it.**

- React Aria:
  - a minimum timeout of 5 s;
  - pause on hover and focus;
  - auto-dismiss only for information that "isn't critical or is available
    elsewhere";
  - on close, focus moves to the next toast, then back to where the user was.
- Region shortcuts:
  - F6 (React Aria, Base UI);
  - F8 (Radix, "Notifications (F8)");
  - Alt+T (Ark).
- No standard shortcut exists.

**Screen readers.**

- React Aria needed a fix to announce in NVDA (PR 7859).
- Salesforce moved toasts from `alert` to `status` because assertive alerts
  cancel each other (secondary source).

**A native element.** `std-toast` (Google, 2019) was abandoned. No successor
proposal exists (https://github.com/jackbsteinberg/std-toast).

## 3. The platform, checked in Chrome 155

| Feature | Result |
|---|---|
| `document.ariaNotify`, `Element.prototype.ariaNotify` | Present |
| `command` / `commandfor` | Present. `command="hide-popover"` closed a manual popover on click; focus fell to `<body>` |
| Custom `command="--dismiss"` aimed at the region | The `command` event fires on the region with `event.source` = the button. With real Enter presses, the listener removed the toast and moved focus to the next toast, then back to the saved element. On the last toast it hid the region |
| `popover="manual"` outside an open modal `<dialog>` | It paints above the dialog and is **inert**. `elementFromPoint` returns the dialog, a real click does nothing, `focus()` is refused and the accessibility tree is empty |
| `popover="manual"` inside the open modal `<dialog>` | Interactive: hit-tested, focusable, exposed as `region "Notifications"` |
| Removing a focused element | In a page that has focus, `focusout` fires with no `relatedTarget`. `activeElement` becomes `<body>` |
| A `status` with `aria-atomic` that contains a close button | The accessibility tree has the button inside the atomic region. `status` has an empty name |
| `popover="hint"`, `@starting-style`, `transition-behavior: allow-discrete`, `overlay`, anchor positioning | All present |

Support in other browsers (sources, not checked here):

- **`ariaNotify`:** Chrome 141, Firefox 150, Safari 27. Baseline since September
  2026 (https://developer.mozilla.org/en-US/docs/Web/API/Document/ariaNotify).
  MDN notes that queuing is not guaranteed and usually only the latest message
  is spoken.
- **Invoker commands:** Chrome 135, Firefox 144, Safari 26.2.
- **`overlay`:** Chromium only, so top-layer exit animations cut off in other
  browsers.
- **Inert popovers above a modal:** spec behavior, still open in
  https://github.com/whatwg/html/issues/9936.

## 4. Prerequisites in Interop

| Piece | Status |
|---|---|
| `announce()` (`ariaNotify`, `status` fallback) | Exists, `projects/interop/src/announce.ts` |
| Icon for the type (1.4.1) | Exists, `interop/icon` |
| Button for action and close | Exists |
| Dialog (native `<dialog>`) | Exists |
| Pending state for async work | Exists, `bindPendingAction()` |
| Dev audit | Exists, `src/audit.ts`; needs toast rules |
| Region CSS: top layer, stack, tones, forced colors, motion | New |
| `toast()`: build the item, show the region, announce, run an optional timer, focus handoff on dismissal | New, about 120 lines |

## 5. Invokers

| Job | Invoker? |
|---|---|
| Close one toast | Yes. `command="--dismiss" commandfor="<region>"` and one listener. The built-in `hide-popover` only fits if each toast is its own popover, which breaks the stack |
| Run an action (Undo) | A custom command (`--undo`) can name it in markup. The app still handles it. Under an open modal, the invoker must be inside the dialog's region |
| Clear all | A custom command on the region if it is wanted. No built-in command hides several popovers |
| Show a toast | No. An app event raises it, not a button |
| Timer, pause, announce, focus handoff | No |
| Escape | No. A manual popover ignores close requests; `hint` and `auto` would light-dismiss |

## 6. What carries over

1. **The dismissal rule.** Anything that does not leave on its own gets a close
   button. Extend it so that any toast with an action never times out.
2. **The pause triggers:** hover, focus-within, `visibilitychange`. They apply
   only to opt-in timers.
3. **The visual language:**
   - the Carbon status bar on `border-inline-start`;
   - the 288px width;
   - the 32px close button;
   - the 14/18 weight-separated type.
   Add an icon per tone and a `forced-colors` border.
4. **Two audit rules:**
   - a timed toast that contains a button;
   - an error with a timer.
   Add a third: an open modal dialog with no toast region inside it.
5. **The background in `prompts/TOAST-RESEARCH.md`.** Its advice on live regions
   was right. `ariaNotify()` makes that advice unnecessary.
6. **Lessons:**
   - a removal's `focusout` has no `relatedTarget`, so the handoff has to remember which toast held focus;
   - a hotkey must not `preventDefault()` unless it acts;
   - a gesture on the whole item steals text selection.

Dropped:

- the handle and its three Subjects;
- `observe()` and `promise()`;
- `cancelBehavior`;
- swipe;
- the hotkey;
- the DI config cascade;
- six named positions (one logical inset replaces them);
- the dead live regions and dead keys;
- the unmerged clear-all and undo branch.

## Questions for you

1. **Ship a toast at all?** The alternative is inline status plus `announce()`
   only, as Primer, GOV.UK and the Scottish Government do. Recommendation: ship
   the small toast. Its docs page leads with when to use inline status instead.
2. **Default timing.** Recommendation: toasts persist until dismissed, and
   `timeout` is opt-in per call, minimum 5 s. The opt-in is refused, with an
   audit warning, when the toast has an action or `tone: 'error'`. This is the
   only default that meets 2.2.1 without a user setting.
3. **Keyboard entry.** Recommendation: no hotkey in v1.
   - The region is a labeled landmark that appears only while it holds toasts.
   - Every toast action also exists in the page (O'Hara's rule, Radix `altText`).
   - F6 can come later if a consumer needs it.
4. **Modal dialogs.** Recommendation: a modal `<dialog>` that can raise toasts
   contains its own `section[interop-toasts]`. `toast()` targets the region in
   the top-most open modal, else the page's. An audit rule warns when a toast is
   raised under a modal with no region inside it.
5. **Errors.** Recommendation: allow `tone: 'error'`, announced with
   `priority: 'high'` and never timed. The docs page steers errors to inline
   `role="alert"` near the cause.
6. **Stack size.** Recommendation: no cap and no hidden backlog. The audit warns
   above three toasts at once. A flood of toasts is an upstream bug; Prime's
   `slice(-max)` hid it and mounted toasts again.

## Unverified

- Real screen reader output: NVDA, JAWS, VoiceOver for `ariaNotify` and for
  Prime's inserted `role="status"` items. Headless Chrome shows the accessibility
  tree, not speech.
- Bugs 1 and 2 are read from source. Prime's demo runs again
  (`npm run demo:prime`, port 1338); miss 2 was driven there.
- Whether a live region outside an open modal still announces. `ariaNotify` from
  an element inside the dialog avoids the question.
- Fluent's toast details, Byrne-Haber's article (paywalled), and whether React
  Aria uses `popover`.
- Firefox and Safari behavior for every row in §3.
