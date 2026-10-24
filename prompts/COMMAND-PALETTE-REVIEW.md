# Command Palette — Research Review

Review of Prime's `InteropCommandPalette` in
`projects/interop_deprecated/src/lib/components/interop-command-palette/`, with
its CSS in `styles/components/command-palette.css` and
`styles/themes/protocol/components/command-palette.css`, and its hotkey in
`directives/interop-hotkey.directive.ts`. Run against
[new-component-research.md](new-component-research.md). Background:
[.agent/explorations/command-palette-research.md](../.agent/explorations/command-palette-research.md).

## Decision

Retire Prime's palette. Its one use is the Prime demo's "go to page" search, and
that is a list of links with a filter, not a combobox. Rebuild it from native
parts plus two small helpers:

- The shell is `<dialog interop-dialog closedby="any">`, opened by a button with
  `command="show-modal"`. The browser makes the page inert, focuses the
  `autofocus` field, closes on Escape and returns focus, also when a hotkey
  opened it.
- The field is `<input type="search">` inside `<search>`, with a `<label>`. In
  Chrome 155 the first Escape clears the field and the second closes the dialog,
  with no script.
- The results are `<nav><ul>` of `<a href>`. Each result is a real link: Tab,
  Enter, open in a new tab, copy link, and swipe on a phone all work.
- `bindFilter(input, list)` hides the items that do not match, shows an empty
  message, and says the count with `announce()` when typing pauses.
- `bindHotkey(button, "mod+k")` clicks the button on ⌘K or Ctrl+K. The button
  shows the key and carries `aria-keyshortcuts`.

The rebuild needs about 60 lines of TS and 60 of CSS. Prime has 417 lines of TS
(294 component, 21 types, 102 hotkey), 478 of CSS, and depends on 480 lines of
`InteropCollection`.

```html
<button interop-button type="button" command="show-modal" commandfor="go-to"
        aria-keyshortcuts="Meta+K Control+K">Search <kbd>⌘K</kbd></button>
<dialog id="go-to" interop-dialog closedby="any" aria-label="Go to page">
  <search>
    <label for="go-to-query">Search pages</label>
    <input id="go-to-query" type="search" autofocus>
  </search>
  <nav aria-label="Pages"><ul>…<li><a href="/components/button">Button</a></li>…</ul></nav>
  <p hidden>No pages match.</p>
</dialog>
```

Built as decided: see
[.agent/components/command-palette.md](../.agent/components/command-palette.md).

A palette of actions, where Enter runs something that is not a link, waits for
the filtering combobox that [listbox.md](../.agent/components/listbox.md)
reserves. It is not built now: there is no consumer, and its keyboard depends on
`aria-activedescendant`, which mobile screen readers do not support reliably.

| Prime use | Really | Interop |
|---|---|---|
| Demo ⌘K "Search pages" | Go to one of 39 pages; each runs `router.navigateByUrl` | `<dialog>` + `<input type="search">` + `<nav>` of links + `bindFilter()` + `bindHotkey()` |
| Demo header "Search ⌘K" button | Opens the dialog | `command="show-modal"`, its visible text as its name |
| (none) Commands that are actions | No consumer | The filtering combobox, when one is needed |

| Question | Decision |
|---|---|
| Does Prime's palette do what it claims? | Mostly. The modal, the combobox wiring, the arrows, the two-stage Escape and the count are there. It fails its own "stable identity" claim (the active item is tracked by index), Enter on open runs a hidden command, and the plan's dev warnings, error state and reduced motion are not shipped |
| Is it the thing its name says? | It is an APG list-autocomplete combobox in a modal dialog, with three faults: `aria-expanded` is true while the list is `display: none`, the field's name is its placeholder, and Home and End never move the caret. Its only use is not commands but page links |
| What is each use, really? | Site navigation. See the table above |
| What does the platform do now? | Chrome 155 does the modal, the focus return after a hotkey, the two-stage Escape in a search field, `closedby="any"`, the invokers, `ariaNotify`, and `focusgroup` over links. See §3 |
| What has to exist first? | Dialog, button, `announce()` and the invoker are built. New: `bindFilter()` and `bindHotkey()`. The combobox is not needed for this |
| Can an invoker replace script? | Opening and closing, yes. The hotkey, the filter and the count, no. See §5 |
| Accessibility | Nine misses, two high. See §1 |
| Complexity | About 70 of the component's 294 TS lines are load-bearing; about 110 are comments. The rest is Angular wiring and the collection adapter |
| What carries over | The research note's lessons, reset on open, refocus after the clear button goes, and the hotkey's `mod` resolution. See §6 |

## 0. Names

| Name | Used by |
|---|---|
| Command palette | GitHub (the product feature), VS Code, React Aria (a docs example only), Prime |
| Command, CommandDialog | cmdk, shadcn/ui, coss UI |
| Autocomplete | React Aria (field + filtered Menu or ListBox), Base UI, GOV.UK `accessible-autocomplete` |
| Combobox | APG, ARIA, Angular Aria (`alwaysExpanded`), Base UI, Carbon, Ark, USWDS, Web Awesome Pro |
| Search bar / search view | Material 3 |
| Search field | Apple HIG |

No spec, and none of Carbon, Fluent 2, Material 3, Spectrum 2, Radix, Ark,
GOV.UK or USWDS, ships a command palette as a component. "Command palette" names
a composition of a dialog and a filtered list.

Pick: no component carries the name. The helper is `bindFilter()`, named for
what it does. The demo example is "Go to page" on the dialog page, with "Also
known as: command palette, ⌘K search, quick open".

## 1. Prime

Three TS files (294, 104 HTML, 21 types), the hotkey directive (102), two CSS
files (333 structure, 145 theme with about 35 `--itx-cmdp-*` tokens), no spec.
One commit added it (616c5f8d), from the research note's plan. 65317a81 later
removed the reduced-motion block. One consumer: the Prime demo shell
(`projects/demo_deprecated/src/app/app.html:69-80`).

### What held

- A native `<dialog>` shell, so the page is inert and Escape closes it.
- `aria-activedescendant` with DOM focus kept in the field, and `aria-selected`
  on the active option, which VoiceOver needs.
- The status region is inside the dialog, so the modal's inertness cannot mute it.
- Two-stage Escape on the dialog's `cancel` event (ts:219-224), where
  `preventDefault()` keeps it open.
- Reset on open, not on close, and the reset tells the consumer (ts:155-159).
  The comment records the stale-results bug this fixed.
- After the clear button removes itself, focus goes back to the field
  (ts:253-256). Otherwise focus would drop to `<body>`.
- Controlled filtering: the palette never ranks, and the consumer owns the data.
- The hotkey resolves `mod` to ⌘ on Apple platforms and Ctrl elsewhere.

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | The active option's only cue is a fill about 1.1:1 against the panel (`oklch(0.235 …)` on `oklch(0.26 …)`, measured in Chrome). A sighted keyboard user cannot see what Enter runs | 1.4.11, 2.4.7 | High |
| 2 | Open and press Enter: the list is `display: none`, but its first option is active, so Enter runs it. The demo navigates to `/components` | 3.2.2 | High |
| 3 | `aria-expanded="true"` while the list is hidden, and `aria-activedescendant` points into it | 4.1.2 | Medium |
| 4 | The field has no `<label>`; its name is the placeholder, "Search pages…" | 3.3.2, 4.1.2 | Medium |
| 5 | The demo's trigger shows "Search ⌘K" but is named "Command palette" by `aria-label` | 2.5.3 | Medium |
| 6 | The trigger shows ⌘K on Windows and Linux, where the key is Ctrl+K | 3.3.2 | Low |
| 7 | Long labels and descriptions are cut with an ellipsis and cannot be read whole | 1.4.10 | Low |
| 8 | In forced colors the active row sets `forced-color-adjust: none`, which its description and `<kbd>` inherit with their authored colors on `Highlight`. Not seen in the demo, which has no descriptions | 1.4.3 | Low, unverified |
| 9 | Disabled options are dimmed by opacity only, with no `GrayText` in forced colors | 1.4.11 | Low |

### Bugs

1. Enter on open runs a hidden command (miss 2). Arrow keys also move through
   the hidden list.
2. `onKeydown` never checks `event.isComposing`, so the Enter that confirms a
   Japanese or Chinese candidate runs the active command. From source.
3. A clearing Escape leaves `pendingCloseReason = "escape"` set in
   `InteropDialog` (interop-dialog.ts:196), because the palette cancels the
   close after the dialog records it. The next close, a click on a command,
   reports `{reason: "escape"}`. From source.
4. A rejected or errored source shows "No results found". `collection.error`
   is never read.
5. The active item is an index (ts:121). When results change without a keystroke
   and keep their count, the highlight moves to a different item.
6. `optionId` puts `item.id` into an id unescaped (ts:174-176): an id with a
   space breaks `aria-activedescendant`; two equal ids mark two rows active.
7. Home and End always move the highlight; Shift+Home cannot select text.

No spec file exists, so none of this is tested, including the reset-on-open fix.

## 2. Evidence

- `aria-activedescendant` is the weak point. WebKit bug 167671 (VoiceOver not
  reading active-descendant changes in a combobox) lasted through Safari 17.5;
  an engineer says macOS 15 fixes it, with nothing for iOS
  (https://bugs.webkit.org/show_bug.cgi?id=167671). a11ysupport.io rates the
  attribute and the APG list-autocomplete example "partial"
  (https://a11ysupport.io/tests/apg__aria-1-2-combobox-with-list-autocomplete-example).
  No 2025–2026 test matrix was found.
- React Aria's `useAutocomplete` turns virtual focus off for mobile screen
  readers ("For mobile screen readers, we don't want virtual focus"), keeps the
  field a search field with no combobox role, and delays the active-descendant
  update so NVDA's announcement is not cut off
  (https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/autocomplete/useAutocomplete.ts).
- cmdk sets `aria-expanded="true"` always, and has no live region or count
  (https://raw.githubusercontent.com/pacocoursey/cmdk/main/cmdk/src/index.tsx).
  Angular Aria's `alwaysExpanded` and Base UI's `inline` + `open` take the same
  always-open line.
- A result count helps. In Orange's comparison, NVDA users preferred GOV.UK's
  autocomplete because it says the number of results
  (https://a11y-guidelines.orange.com/en/articles/autocomplete-component/).
- Ctrl+K is taken: Chrome's address-bar search
  (https://support.google.com/a/answer/3001847), Firefox's web search
  (https://bugzilla.mozilla.org/show_bug.cgi?id=1055487), kill-to-end-of-line in
  GTK text fields, and insert-link in rich-text editors. A page wins only while it
  has focus. So the visible button is the way in; the key is a shortcut to it.
- WCAG 2.1.4 covers single printable keys only. Ctrl/⌘+K passes; a bare `/`
  would need an off switch.
- GitHub planned to remove its command palette in 2025, then paused because
  "feedback highlighted how integral this feature is"
  (https://github.blog/changelog/2025-07-16-upcoming-deprecation-of-github-command-palette-feature-preview).
- No article from Roselli, Higley, O'Hara, Watson, Pickering or NN/g on command
  palettes was found.

## 3. The platform, checked in Chrome 155

| Feature | Result |
|---|---|
| `command="show-modal"` | Opens the dialog; focus goes to the `autofocus` field |
| Focus return after a hotkey | A keydown handler calls `showModal()` from a focused link; Escape returns focus to the link. No script needed. The research note's claim that a hotkey open needs a saved `activeElement` is wrong |
| `<input type="search">` in a modal, Escape | First Escape clears the field and fires `search`, with no `cancel`; second fires `cancel` and `close` |
| `closedby="any"`, `requestClose()`, `command` | Present |
| Accessibility tree, native version | `dialog "Go to" modal=true` > `searchbox "Search pages"` > `list` > `link "Alpha"`… |
| Accessibility tree, a combobox input | `combobox hasPopup=listbox expanded=true controls=lb` |
| `ariaNotify` | Present on `Element.prototype` |
| `focusgroup="toolbar block wrap"` on a `<ul>` of links | Arrow Down and Up move real focus, skip a `hidden` item, wrap; Tab leaves the list and Shift+Tab returns to the last link. The list stays `list`. No `focusgroup` IDL property |
| `CSS.highlights` | Present, for marking the matched text |
| `appearance: base-select` | Supported. It does not filter |
| Prime demo, ⌘K then Enter | Navigates from `/components/button` to `/components` |
| Prime demo, active option | `oklch(0.235 0.006 250)` on `oklch(0.26 0.006 250)`, no outline. In forced colors it is `Highlight` and reads |

Other browsers, from sources:

- `closedby`: Chrome 134, Firefox 141, not in Safari through 27.2. Escape still
  closes there; a backdrop click does not
  (https://caniuse.com/mdn-api_htmldialogelement_closedby).
- Invokers: Chrome 135, Firefox 144, Safari 26.2; Baseline since December 2025
  (https://caniuse.com/wf-invoker-commands).
- `ariaNotify`: Chrome 141, Firefox 150, Safari 27 (https://caniuse.com/wf-arianotify).
- `focusgroup`: Chrome 150; others unknown.
- Search-field Escape in Firefox and Safari: unknown.
- Open UI's Filterable Select explainer, Option A (`<input filter>` beside an
  in-page `<select size>`), is close to a palette with no ARIA. It is behind a
  Chromium flag (https://open-ui.org/components/filterable-select.explainer).

## 4. Prerequisites in Interop

| Piece | Status |
|---|---|
| `dialog[interop-dialog]`, `closedby`, invokers | Built |
| `button[interop-button]` | Built |
| `announce()` | Built |
| The focus ring | Built |
| `bindFilter()` | New: hide non-matching items, the empty message, the count |
| `bindHotkey()` | New: `mod` resolution, `isComposing` guard, clicks a button |
| Arrow keys over the links | Optional. `focusgroup` in Chrome; a few lines elsewhere |
| A filtering combobox | Not built, and not needed for this |

## 5. Invokers

| Job | Invoker? |
|---|---|
| Open from the header button | Yes, `command="show-modal"` |
| Close on Escape or the backdrop | Native with `closedby="any"` |
| Close from a button | Yes, `command="request-close"` |
| Two-stage Escape | Native in a search field in Chrome. No script |
| Go to a result | A link. Native |
| Close after following a link in an SPA | Script: close on navigation, or the link's click |
| ⌘K / Ctrl+K | No. There is no keyboard invoker. `bindHotkey()` clicks the invoker button, so the open path stays one |
| Filter and count | No. Script |

## 6. What carries over

1. The research note's lessons: decline the ranking engine, keep the count
   region inside the modal, key identity off an id or `href`, never off text.
2. Reset on open, and tell the consumer.
3. Refocus the field after a control that held focus removes itself.
4. `mod` → ⌘ on Apple platforms, Ctrl elsewhere, from `interop-hotkey`.
5. Inset positioning near the top of the viewport, not centered, so the dialog
   does not jump as the list shrinks.
6. For a future combobox: `aria-selected` on the active option, a visible active
   cue that is an outline, not a fill, `isComposing` and modifier guards, and
   active tracking by id.

Not to reintroduce: the Angular component, the `InteropCollection` adapter, the
aside slot, the 35 tokens, the fill-only active cue, index tracking, the
`aria-expanded` rule, and the focus restore that duplicates the browser's.

## Questions for you

1. **Build the "Go to page" search for the canonical docs site?** Prime's demo had
   it; the canonical demo has none. Recommendation: yes, as the first and only
   consumer, on the dialog page as an example and in the site header.
2. **Links, or a combobox?** Recommendation: links. They work on phones, with
   every screen reader, and as links. The combobox comes only with a consumer
   whose results are actions.
3. **Arrow keys from the field into the results?** Recommendation: Arrow Down from
   the field focuses the first visible link, and arrows move between links with
   real focus. Enter follows the link. No `aria-activedescendant`.
4. **Who filters?** Recommendation: `bindFilter()` matches the item's text,
   case-insensitive substring, with an optional `match(item, query)` for anything
   smarter. No fuzzy ranking.
5. **Escape?** Recommendation: the browser's: clear, then close. No script.
6. **`bindHotkey()` in the library?** Recommendation: yes, small, and it only
   clicks a button. It skips while composing, and the button names the key with
   `aria-keyshortcuts` and a visible `<kbd>` that reads ⌘K or Ctrl K per platform.
7. **The count?** Recommendation: `announce("12 pages")` after typing pauses, only
   when the count changes, and the visible empty message when it is zero.

## Unverified

- Screen reader speech for any of this, including `announce()` inside a modal
  dialog.
- Search-field Escape behavior in Firefox and Safari.
- `focusgroup` outside Chrome.
- The IME and close-reason bugs (source reading only) and the forced-colors
  description contrast (miss 8).
- VoiceOver iOS and TalkBack with `aria-activedescendant` today.
- Primer's implementation of GitHub's palette.
