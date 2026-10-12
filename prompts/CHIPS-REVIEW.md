# Chips — Research Review

Review of Prime's `interop-chip` family in `projects/interop_deprecated`, run
against [new-component-research.md](new-component-research.md). Supersedes
[chips-planning.md](chips-planning.md).

## Decision

"Chip" is a look, not a component. Each kind of chip is a native element with a
pill shape:

| Kind | Really | Interop |
|---|---|---|
| Filter | A checkbox in a fieldset | `fieldset[interop-checkbox-group="chips"]`, a template, CSS only |
| Choice | A radio in a fieldset | `fieldset[interop-radio-group="chips"]`, the same template |
| Display tag | Text | `<span interop-badge>` |
| Action, assist, suggestion | A button | `button[interop-button] itx-size="sm" itx-radius="full"` |
| Single toggle | A toggle button | `button[interop-button][aria-pressed]` |
| Removable tag | Text and a "Remove X" button | `ul[interop-tags]` + `bindTags()` |
| Tag input | A text input whose values become removable tags | The tags list, then an `<input>`, + `bindTagInput()` |

| Question | Decision |
|---|---|
| Badge and chip | A badge is non-interactive text: count, status or category. It never holds a remove button |
| Chip sizes | `sm` 24px (`caption`), default 32px (`p-sm`), `lg` 40px (`p`) |
| Announcing removals | Opt-in |
| Suggestions | `<datalist>` now; a combobox is its own component, later |
| Names | "chip" is retired as a component name; `chips` is a template name; "tags" is the removable list and tag entry |

Do not build: listbox, grid or toolbar chip roles; arrow keys between tags;
Delete or Backspace shortcuts on tags; editable tags; tags inside the text
field; a form value accessor; `<select multiple>`; a combobox in the tag input.

## 0. Names

Chip (Material, Angular Material, MUI), tag (Carbon, Spectrum, Fluent, Polaris,
GOV.UK, USWDS), token (Primer, Apple's NSTokenField), pill (Bootstrap, the APG
"pill list"), lozenge (Atlassian, for status), label (Primer). No HTML element
or ARIA role exists for any of them. Each maps to a badge when it is
non-interactive and to its control when it is not.

## 1. Prime

About 1,500 source lines (847 TS, 668 CSS) and 775 spec lines: six components,
an injection token, 89 tokens. It covered display, dismissible, filter and
input chips; choice chips were declined and assist chips deferred.

### What held

Filter chip as a native checkbox; a `ul`/`li` list with real buttons, not a
grid; remove buttons named "Remove X"; Backspace in an empty input focuses the
last chip without deleting; a 24px target floor.

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | The filter group's `<legend>` is `display: none`: every group unnamed, and `labelHidden` meaningless. jsdom specs could not see it | 1.3.1, 3.3.2 | High |
| 2 | Option ids `itx-chip-option-{value}` collide across groups; the unneeded `label for` names and toggles the wrong group's checkbox | 4.1.2 | High |
| 3 | Removing a chip-item drops focus to the body | 2.4.3 | High |
| 4 | The tag input focuses the button it is about to destroy (reasoned) | 2.4.3 | High |
| 5 | The tag input's label: `aria-labelledby` not forwarded, `aria-label` on a generic `div` (prohibited), no visible label possible | 4.1.2 | High |
| 6 | Selected is a fill only, and the border tokens are never read: invisible in forced colors | 1.4.11, 1.4.1 | High |
| 7 | A disabled tag input still removes tags from the keyboard | 4.1.2 | Medium |
| 8 | No announcements of add, remove or the limit | 4.1.3 | Medium |
| 9 | The tag limit fails silently | 3.3.1 | Medium |
| 10 | No IME guard on Enter; comma unreliable on Android | 2.1.1 | Medium |
| 11 | Controlled empty value ignored; DOM and state desync | — | Medium |
| 12 | Tag input values never submit with a form | — | Medium |
| 13 | Paste not split; duplicates allowed and break `track` | — | Low |
| 14 | Physical remove margin; arrows not flipped in right-to-left | 1.3.2 | Low |

## 2. Evidence

- **Grids and listboxes for chips test poorly.** Roselli's test of the APG pill
  list grid: slow to learn, fear of deleting by accident, inconsistent
  positions ([ARIA Grid as an Anti-Pattern](https://adrianroselli.com/2020/07/aria-grid-as-an-anti-pattern.html)).
  Higley: items with no real rows and columns "are not grids"
  ([Grids part 1](https://sarahmhigley.com/writing/grids-part1/)). Angular
  Material moved its input out of `mat-chip-grid` after a Voice Control failure
  ([#30452](https://github.com/angular/components/pull/30452)).
- **Multi-select is a checkbox fieldset** ([Roselli](https://adrianroselli.com/2022/05/under-engineered-multi-selects.html),
  [Higley](https://www.24a11y.com/2019/select-your-poison-part-2/)).
- **Tag entry layout**, Higley's test data: removable buttons before the field
  98% success; comma-separated text 91.8%; buttons inside the field 75.1%;
  `<select multiple>` 25.3%.
- **Generic remove names are a recurring bug**: Carbon "Dismiss", Shoelace
  "Remove", Polaris "Remove chip". The value belongs in the name.
- **Commas are unreliable** as a separator (eBay; Android keyboards). Enter adds.
- **Display tags are not interactive** ([GOV.UK](https://design-system.service.gov.uk/components/tag/));
  users mistake tags for buttons ([USWDS](https://designsystem.digital.gov/components/tag/)).
- **Lists need `role="list"`** while iOS VoiceOver drops list semantics when
  `list-style` is none ([WebKit 304137](https://bugs.webkit.org/show_bug.cgi?id=304137)).

## 3. What the platform cannot do

1. Turn typed text into separate tags.
2. Keep focus when the focused element is removed.
3. Announce additions and removals without a live region.
4. Split pasted text, or respect IME composition on Enter.

Selection, keyboard, grouping, naming, submission, reset and disabling are
native for filter and choice chips.

## Unverified

The Material 2 taxonomy; Atlassian's current guidance; the Chrome 145
`base-select` listbox; Prime's tag-input focus failure (reasoned from code).
