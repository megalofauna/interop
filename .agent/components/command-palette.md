# Go to page (command palette) — Mental Model Card

A search field over a list of links, in a modal dialog, opened by a button and
a keyboard shortcut. Native parts plus two helpers: `bindFilter()` and
`bindShortcut()`. Research:
[prompts/COMMAND-PALETTE-REVIEW.md](../../prompts/COMMAND-PALETTE-REVIEW.md).

## Files

```
projects/interop/src/bind-filter.ts     bindFilter(): hide, empty message, count, arrows, clear on close
projects/interop/src/bind-shortcut.ts   bindShortcut(): a key clicks a button
projects/interop/filter/filter.ts       InteropFilter, input[interopFilter]
projects/interop/shortcut/shortcut.ts   InteropShortcut, button[interopShortcut]
```

No CSS of its own: the dialog, field, input and tree styles do it. The demo is
the dialog page's `#go-to-page` section and the Search button in the site
header (`projects/demo/src/app/app.html`).

## Markup

```html
<button interop-button type="button" commandfor="go-to" command="show-modal" interopShortcut="mod+k">
  Search <kbd></kbd>
</button>
<dialog id="go-to" class="go-to" interop-dialog closedby="any" aria-labelledby="go-to-label">
  <search interop-field>
    <label id="go-to-label" for="go-to-query">Go to page</label>
    <input interop-input id="go-to-query" type="search" autofocus autocomplete="off" spellcheck="false"
           [interopFilter]="pages" [filterEmpty]="noPages">
  </search>
  <nav aria-label="Pages">
    <ul #pages interop-tree role="list" (click)="goTo.close()">…<li><a href="…">Button</a></li>…</ul>
  </nav>
  <p #noPages hidden>No pages match.</p>
</dialog>
```

The page places the dialog near the top (`place-self: start center`), so the
field stays put while the list shortens. In a single-page app a link does not
unload the page, so a click in the list closes the dialog.

## Behavior

| Job | Who |
|---|---|
| Open | `command="show-modal"` on the button |
| ⌘K / Ctrl+K | `bindShortcut()` clicks the button |
| Focus the field | `autofocus` |
| Page behind inert, Escape closes, focus returns (also after the shortcut) | The browser |
| First Escape clears the field | The browser, for `type="search"` (Chrome 155) |
| Hide what does not match | `bindFilter()`: `hidden` on the list's children; text match ignoring case and accents, or `match` |
| No match | `bindFilter()` shows `empty` |
| Count | `bindFilter()`: `announce()` from the field after a 500 ms pause, only when the count changed; `empty`'s text at zero |
| Arrow Down from the field, Up and Down between items, Up from the first back to the field | `bindFilter()`, real focus |
| Clear when the dialog closes | `bindFilter()`, on the dialog's `close` |
| Follow a result | The link |

`bindShortcut()`:

- `mod` is ⌘ on Apple platforms and Ctrl elsewhere, so a Mac's Ctrl+K
  (delete to end of line) stays with the text field.
- It ignores the key while the button is disabled, hidden, inert, or outside an
  open modal dialog. A script `click()` on an inert button still runs its
  command: Chrome 155 opened a second modal over the first. While ignored, the
  key goes to the browser.
- It ignores a held key and a key pressed while an input method is composing.
  With Alt it also matches the physical key, because ⌥K types ˚ on a Mac.
- It sets `aria-keyshortcuts` (`Meta+K`, `Control+K`) and writes `⌘K` or
  `Ctrl K` into an empty `<kbd>` in the button. The visible text stays in the
  button's name (WCAG 2.5.3).

## Accessibility rules

- The results are links, or buttons for actions. No combobox, no
  `aria-activedescendant`: focus is real, so every screen reader and a phone's
  swipe reach each result.
- Label the field visibly. The dialog takes the same label.
- Keep the visible button. The shortcut is a second way in: browsers take
  Ctrl+K while their own UI has focus.
- Use a modifier. A single-character shortcut needs an off switch (WCAG 2.1.4).

## Growing into a command palette

What stays, and where each step goes, when results become actions:

- **Actions:** `<button>`s in the same list already work with `bindFilter()`;
  each one closes the dialog with `command="close"` or in its click handler.
- **Groups:** `bindFilter()` filters the list's direct children. Headed groups
  need it to hide a group whose items are all hidden.
- **Type, then Enter:** this is where a combobox comes in. A `bindCombobox()`
  layer adds `role="combobox"`, `aria-activedescendant`, `aria-selected` and a
  visible active row with an outline, and keeps `bindFilter()` for hiding and
  the count. Keep real focus on mobile screen readers, as React Aria does.
- **Async results:** the page renders the list and `bindFilter()` gets a
  `match` that always passes, so it shows the empty message and the count only.

## Tests

- `src/bind-filter.spec.ts`: matching, accents, `match`, empty message, the
  count once and only on change, arrows, skipping hidden items, clear on close,
  unbinding.
- `src/bind-shortcut.spec.ts`: Ctrl and ⌘, Mac Ctrl+K left alone, exact
  modifiers, Alt by physical key, held keys, composing, handled keys, disabled
  and inert, the attribute and hint, unbinding.
- Chrome 155, on the demo:
  - ⌘K opens it, typing filters, Arrow Down and Up move, the first Escape
    clears and the second closes, focus returns to Search.
  - Typing "tool", Arrow Down, Enter goes to `/components/toolbar` and closes.
  - With another modal dialog open, ⌘K does nothing.
  - `ariaNotify` is called from the field with "7 results", "1 result" and
    "No pages match."
  - Forced colors and 400px wide hold; the page checks pass.
- Not yet tested: speech output, Firefox and Safari (including Escape in a
  search field, and `closedby`, which Safari lacks: a click outside does not
  close it there).

## Prime

Prime's `InteropCommandPalette` was a combobox in a dialog for the same page
list. Its active row was a fill at about 1.1:1, Enter on open ran a hidden
command, and `aria-expanded` was true over a hidden list. Do not reintroduce
the `InteropCollection` adapter, the aside slot, the `--itx-cmdp-*` tokens,
active tracking by index, or a focus restore that repeats the browser's.
