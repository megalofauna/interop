# Listbox — Research Review

Review of Prime's `InteropListbox` in `projects/interop_deprecated`, run against
[new-component-research.md](new-component-research.md).

## Decision

Do not rebuild the listbox now. Each of Prime's uses is a native element or an
existing Interop control:

| Prime use | Really | Interop |
|---|---|---|
| Stepper "jump to step" menu | Navigation between steps | The step list in `ol[interop-steps]`, already built. No popup and no listbox |
| Theme toggle, three options in a popover | One choice from a short list | `fieldset[interop-radio-group]`, or a `<select>` |
| Demo single select, always visible | One choice | `fieldset[interop-radio-group]`, or `<select size>` |
| Demo multi select | Several choices | `fieldset[interop-checkbox-group]` + `bindSelectAll()` |

What the platform cannot do, and a listbox is for, is the popup of a filtering
combobox: the command palette, or suggestions in the tag input. Build the
listbox behavior then, as the combobox's part, framework-free.

| Question | Decision |
|---|---|
| Is Prime's listbox doing what it intends? | For click, arrows and Enter in a single select, yes. Its stated purpose, the base of `InteropSelect` and `InteropMultiSelect`, was never built: neither exists |
| Is it a listbox? | Its roles and states are a listbox's. Its keyboard is a partial listbox: no multi-select keys, disabled options unreachable, Escape swallowed. Its uses are not listboxes: one is navigation, the others are radio and checkbox groups |
| Prerequisites | Styled `<select>` (customizable select), a typeahead helper, a combobox. Popover anchoring, radio and checkbox groups, select all and Home/End already exist |
| Can an invoker replace script? | Opening and closing the popup, and "Select all" or "Clear" buttons outside the list. Choosing an option cannot: an option is not a button and cannot hold one |

## 0. Names

| Name | Used by |
|---|---|
| listbox, option, group | WAI-ARIA, APG, Angular Aria (`ngListbox`), Ark and Zag, Fluent web components |
| ListBox | React Aria |
| Listbox | PrimeNG; Headless UI (a button and a popup, so a select-only combobox) |
| list box | Older platform docs; HTML calls `<select size>` and `<select multiple>` its "listbox" rendering |
| selection list | Angular Material (`mat-selection-list`) |
| list view | Spectrum |
| select, picker, dropdown | Radix, Base UI, Web Awesome, Carbon, Spectrum, Apple HIG (pop-up button) |
| multi-select | Carbon, Ant, GOV.UK (which declines it) |

Headless libraries built on ARIA ship a standalone listbox. Design systems that
publish usability findings (GOV.UK, Carbon, Base UI, Radix) ship a select and
no standalone listbox. "Listbox" is the ARIA role and wins the tie if one is
built.

## 1. Prime

528 lines of TypeScript, about 180 of them comments, plus a 98-line option
directive, 300 lines of CSS and 22 tests. It has two modes: options from a
`controls` array, or projected `li[interop-option]`. Focus stays on the list,
with `aria-activedescendant` pointing at the active option.

Git history gives no rationale: it arrived in a bulk import. The one later fix
(ITX-30) repaired `[(value)]`, which never showed a selection, and multi-select,
which dropped existing values on the first click.

About half the code serves Angular: the injection token and interface, the
content query, the two-mode template, the `ControlValueAccessor` and the
`value` input kept in sync with it. Both ITX-30 bugs were in that half.

### What held

- `role="listbox"`, `role="option"`, `aria-selected` and `aria-multiselectable`.
- Stable option ids, and the active option scrolled into view.
- Typeahead.
- Separate cues for the two states: a 4px inset bar marks the selected option,
  a fill marks the active one, and the bar flips sides in right-to-left.
- 40px rows.

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | Escape is always `preventDefault()`ed, and no consumer handles the `closeRequest` it emits. Escape cannot close the theme toggle's popover or the stepper's | 2.1.2, 2.1.1 | High |
| 2 | In forced colors the selection bar (a `box-shadow`) and the active fill disappear. Nothing shows which option is selected or active | 1.4.1, 1.4.11, 2.4.7 | High |
| 3 | The active option shows as a fill one step from the rest color. The focus outline is on the list, not the option | 2.4.7, 2.4.13 | High |
| 4 | No accessible name is required, and the theme toggle ships an unnamed listbox | 4.1.2 | High |
| 5 | The stepper's trigger says `aria-haspopup="menu"` and opens a listbox | 4.1.2 | Medium |
| 6 | Disabled options are skipped by every key, so keyboard and screen reader users cannot find them | 1.3.1 | Medium |
| 7 | No multi-select keys: Shift+arrows, Shift+Space, Ctrl+A. Only Space toggles | 2.1.1 | Medium |
| 8 | Focusing the list does not scroll the selected option into view | 2.4.7 | Medium |
| 9 | A disabled listbox stays a tab stop, and `formControl.disable()` does nothing: `setDisabledState` is empty | 4.1.2 | Medium |
| 10 | Option labels truncate with an ellipsis and no way to read the rest | 1.4.10 | Medium |
| 11 | Typeahead: Space always selects, so "New York" cannot be typed; a repeated letter does not cycle; Ctrl+A types "a" | 2.1.1 | Low |
| 12 | `pointer-events: none` on disabled options also stops their tooltips | — | Low |

### Bugs

1. An icon in the data mode renders as text: `icon: "tabler-sun"` shows
   "tabler-sun".
2. A tap focuses the list, which makes the selected option active, then selects
   the tapped one without making it active. The next arrow key starts from the
   old option.
3. Hovering before focus moves the active option, and focus keeps it, so Tab
   lands on the hovered option instead of the selected one.
4. Duplicate values throw in `@for … track control.value`, and every duplicate
   shows as selected.
5. Three tokens are read and never declared.
6. An empty `controls` array falls through to projected content, so nothing
   says the list is empty.

The tests cover the happy path only. Every host starts with no value, so the
ITX-30 fix has no test, and the typeahead "accumulates characters" test passes
without accumulating.

## 2. Evidence

- **Higley, 12 participants, 8 blind or with very low vision**
  ([part 2](https://www.24a11y.com/2019/select-your-poison-part-2/)):
  - A native single `<select>` reached 100% task success and scored 97.5 on usability.
  - Native `<select multiple>` reached 25.3% success and scored 22.7. No
    keyboard or desktop screen reader user selected options that were not next
    to each other.
  - Checkboxes worked best for a few options; for many, a combobox with the
    chosen values as buttons above it.
- **Roselli**: multi-selects "have tested poorly with users for more than two
  decades". Use a fieldset of checkboxes, in a scrolling container or a
  disclosure when long
  ([Under-Engineered Multi-Selects](https://adrianroselli.com/2022/05/under-engineered-multi-selects.html)).
- **GOV.UK** treats select as a last resort and does not support `multiple`:
  users confused focused with selected options, missed that the list scrolls,
  and pinch-zoomed options
  ([select](https://design-system.service.gov.uk/components/select/)).
- **Screen reader support for `aria-selected`** is 23 of 54 expectations: JAWS,
  NVDA and VoiceOver on macOS do not announce a change of selection
  ([a11ysupport](https://a11ysupport.io/tech/aria/aria-selected_attribute)).
  Multi-select depends on that announcement.
- **APG** ([listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)):
  - Avoid long option names: each option is read as one unit.
  - A listbox cannot hold interactive elements; use a grid for that.
  - Option children are presentational: rich markup is read as text.

A listbox fits two cases: the popup of a combobox, and a persistent selection
in an app that submits no form, such as a master–detail list or a transfer
list. Neither is in Interop's backlog except the combobox.

## 3. The platform, checked in Chrome 155

| Feature | Result |
|---|---|
| `appearance: base-select` on `<select>`, `<select size=3>` and `<select multiple>` | Applies to all three |
| Base-select `multiple`, mouse | A plain click toggles: clicking Apple, then Cherry, selects both. No Ctrl-click |
| Base-select `multiple`, keyboard | Arrows move focus without selecting; Space toggles. This is APG's recommended model. Each option takes real focus |
| Accessibility tree | `listbox "Fruit"` with three `option`s |
| `focusgroup="listbox"` | ArrowDown moves focus between children; ArrowRight does not. `'focusgroup' in HTMLElement.prototype` is false, so feature detection needs another test |
| Invoker commands, interest invokers | Both present |

Elsewhere, from sources:
- Customizable select in its popup form shipped in Chrome 135 and Safari 27. It is behind a flag in Firefox.
- The in-page `size` and `multiple` forms are Chrome only; Gecko is positive and WebKit has given no signal.
- `focusgroup` is Chrome 150 and later, with no other engine committed.
- Customizable select is not an Interop 2026 focus area.

A styled `<select>` falls back to the native one, which is the best-tested
select there is. That makes it the cheapest listbox Interop can offer:
semantics, keyboard, typeahead, form submission, validation, forced colors and
the mobile picker come from the browser.

## 4. Prerequisites in Interop

| Piece | Status |
|---|---|
| Popover anchored to its button | Built: `[interop-popover]` |
| Radio and checkbox groups, select all, Home/End for radios | Built |
| Arrow keys with Home/End, skipping disabled items, right-to-left | Built inside `bindTabs()`; not yet shared |
| `<select>` styles, including base-select | Built: `select[interop-select]`, see [SELECT-RESEARCH.md](SELECT-RESEARCH.md) |
| Typeahead | Not built. Needed by a combobox, and by a menu |
| Combobox (editable, filtering) | Not built. Deferred from the tag input. The listbox is its popup |
| Roving focus helper over `focusgroup` | Not needed until a second composite widget needs arrow keys; `bindTabs()` handles tabs |

## 5. Invokers

| Job | Invoker? |
|---|---|
| Open and close a popup listbox | Yes: `command="toggle-popover"`. A customizable select opens itself |
| "Select all", "Clear" next to a list | Yes: custom `--select-all` and `--clear`, handled by the helper the way `bindSteps()` handles `--next` |
| Choose an option | No. An option cannot be or contain a button, and one delegated listener does the job |
| Arrow keys, typeahead, the active option | No. Commands have no keyboard model; `focusgroup` covers arrows only |
| Choose a step and close the menu | No: a button carries one command. `popover="auto"` closes on a click outside, not on a click inside |

## 6. What carries over, for the combobox

1. The typeahead, fixed:
   - A repeated letter cycles through matches.
   - Modifier keys are ignored.
   - Space adds to the search while the search has text.
2. The active option kept by id, with `scrollIntoView({ block: "nearest" })` on
   every change, including focus.
3. Separate cues for selected and active, with a forced-colors rule for each:
   `Highlight` for the active option and a border for the selected one.
4. The 22 tests, plus the missing ones: a starting value, Escape in a popover,
   scroll into view, naming, disabled options.
5. Rules:
   - Value state stays with the consumer.
   - Escape is never cancelled unless it is handled.
   - The dev audit requires a name.
   - Disabled options stay reachable.
   - Option text wraps.

## Unverified

- Screen reader output for base-select `multiple`.
- Current VoiceOver support for `aria-activedescendant`.
- Safari 27's release (a secondary report).
- Several library names from memory: Headless UI, Radix, Spectrum, Material, Apple HIG, Ant, Carbon's internal `ListBox`.
- Positions from Nielsen Norman, O'Hara and Watson.
