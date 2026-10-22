# Toolbar — Mental Model Card

A toolbar holds three or more controls acting on one object. It is one Tab
stop, and the arrow keys move between its items. The consumer writes the
markup. The browser's `focusgroup` attribute moves focus where it exists
(Chromium 150+). `bindToolbar()` does it elsewhere and does nothing where
`'focusGroup' in HTMLElement.prototype`. In Angular, the `InteropToolbar`
directive calls the helper. Research:
[prompts/TOOLBAR-REVIEW.md](../../prompts/TOOLBAR-REVIEW.md).

```html
<div interop-toolbar role="toolbar" focusgroup="toolbar" aria-label="Formatting" aria-controls="comment">
  <div role="group" aria-label="Text">
    <button interop-button="icon" type="button" aria-label="Bold">…</button>
    <button interop-button="icon" type="button" aria-label="Italic">…</button>
  </div>
  <div role="group" aria-label="Insert">…</div>
</div>
<textarea interop-input id="comment"></textarea>
```

One or two buttons, or a page's or form's actions, are not a toolbar. They stay
plain buttons, where Tab reaches each one.

## Files

```
projects/interop/toolbar/
  interop-toolbar.structure.css   layout: wrapping row, groups, vertical
  interop-toolbar.base.css        --itx-toolbar-gap, --itx-toolbar-group-gap
  toolbar.ts                      InteropToolbar directive
projects/interop/src/
  bind-toolbar.ts                 fallback roving focus
  direction.ts                    isRtl(), shared with bindTabs()
  focusable.ts                    OWNS_ARROW_KEYS, shared with the audit
projects/demo/src/app/components/toolbar/   Markdown comment box: default, channel, a consumer look.
  toolbar-actions.ts: Bold, Italic, Strikethrough and Code are toggles pressed while the cursor
  is inside their markers on its line; Heading, Quote and the lists are toggles pressed while
  every selected line has the prefix; Link is a command, with no aria-pressed
```

## Markup

- `role="toolbar"` is written by the author. `focusgroup="toolbar"` implies it
  only in browsers that support `focusgroup`.
- `focusgroup` tokens: `wrap` wraps at the ends; `block` uses Up and Down;
  `nomemory` returns Tab to the first item. Memory is on by default.
- `block` does not set the orientation in the accessibility tree. A vertical
  toolbar also needs `aria-orientation="vertical"`, which the CSS reads to stack it.
- Named `role="group"` elements inside cluster related buttons. The arrows cross
  them. Screen readers announce the group name on entry.

## Size

`itx-size` on the toolbar sizes every button in it. The button's own `sm` and
`lg` rules match a button inside a sized toolbar and skip its own `itx-size`
there (`:not([interop-toolbar][itx-size] *)`), so the values have one home in
`interop-button.base.css`. The `toolbar-button-size` audit rule names the
ignored attribute. A toolbar without `itx-size` leaves each button its own.

This is a rule, not a default: the toolbar wins. A density scope, where a
container sets a default its children may override, is a separate design in
`.agent/todo/control-sizing-api.md`.

## Looks

Three levels, one set of hooks:

| Level | Tool | Example |
|---|---|---|
| Pick | A word in the attribute | `interop-toolbar="channel"` |
| Tune | Tokens | `--itx-toolbar-*` on the toolbar, `--itx-button-*` on its buttons |
| Own | The consumer's CSS with a class | `.floating-toolbar [interop-button] { … }` |

- A shipped look uses only the hooks a consumer has: `[interop-toolbar]`,
  `> [role="group"]`, `[interop-button]` inside, ARIA states. If a look needs
  something else, the hook is missing.
- Button tokens are set on the buttons (`:where([interop-toolbar~="…"])
  :where([interop-button])`). A button declares its own tokens, so setting them
  on the toolbar does not reach it. No `--itx-toolbar-button-*` aliases.
- The attribute's values belong to Interop. A consumer names a look with a class.
- `channel`: the segmented control's channel fill, buttons with no fill or edge
  until hovered, a 1px bar (a border on `::before`) between groups, nested corners.
  Pressed raises the button on the segmented pill's fill and keeps the button's
  doubled edge, so it reads apart from hover's single edge.
  Forced colors draw the transparent edges and the bars in the system text color.
  The contrast spec measures button text on the channel and on the pressed fill.
  A button setting for the bare-at-rest buttons waits in
  `.agent/todo/button-bare-at-rest.md`.

## Behavior

Native `focusgroup` and the fallback do the same things, checked in Chrome 155:

- One Tab stop. Shift+Tab back in lands on the last item focused.
- Left and Right move, flipped in right-to-left text. Home and End go to the ends.
- Natively disabled and hidden items are skipped. `aria-disabled` items stay
  reachable.
- A text field, select or radio keeps its arrow keys, and the arrows cannot
  leave it. Native radios check each one in turn as the arrows move.
- The fallback leaves out items in a popover or a nested `[focusgroup]`, and
  keeps the Tab stop rules as items are added or removed.

Differs: in Chrome, Tab from a text field inside moves to the next toolbar item.
In the fallback it leaves the toolbar. The audit keeps a text field last, where
both leave.

## Dev audit rules

| Rule | Flags |
|---|---|
| `toolbar-role` | `[interop-toolbar]` without `role="toolbar"` |
| `toolbar-focusgroup` | `[interop-toolbar]` without `focusgroup="toolbar"`; Chromium would get no arrow keys, since the helper steps aside |
| `toolbar-name` | Any toolbar with no accessible name |
| `toolbar-size` | Fewer than three controls |
| `toolbar-button-size` | A button's own `itx-size` inside a toolbar that sets one |
| `toolbar-orientation` | `focusgroup` with `block` and no `aria-orientation="vertical"` |
| `toolbar-arrow-keys` | More than one arrow-key control, or one that is not last |

## Tests

- `src/bind-toolbar.spec.ts`: the fallback in jsdom, which has no `focusgroup`.
- Chrome 155, native and with `--disable-blink-features=Focusgroup`, on the
  demo's comment box: arrows, Home and End, stopping at the ends, Tab out and
  Shift+Tab back to the last button give the same focus in both.
- Not yet tested: Firefox and Safari, and any screen reader.
- `src/audit.spec.ts`: each rule.
- `a11y/a11y.spec.ts`: axe on a bound toolbar with groups and an `aria-disabled` item.
- `styles/forced-colors.spec.ts`: exempt, layout only.

## Not built

- An overflow menu for a toolbar too long for its row. It wraps instead
  (WCAG 1.4.10). An overflow menu would be a popover opened by `commandfor`.
- Keyboard shortcuts (Ctrl+B) in the demo. A real comment box adds them on the
  text area, with `aria-keyshortcuts` on the button.

## Prime

Prime's `InteropToolbar` announced a toolbar but never managed `tabIndex`, so
every item was a Tab stop. It took the caret keys from text fields and ignored
RTL. Its group added arrow keys to `role="group"` and re-implemented native
radios. Do not reintroduce any of it.
