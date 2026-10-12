# InteropChip — Retired

Replaced by native elements with a pill look. Research:
[prompts/CHIPS-REVIEW.md](../../prompts/CHIPS-REVIEW.md). The deprecated source
is in `projects/interop_deprecated/src/lib/components/interop-chip/`, with CSS
in `styles/components/chip.css` and `styles/themes/protocol/components/chip.css`.

| Prime | Now |
|---|---|
| `fieldset[interop-chip-filter]` + `label[interop-chip-option]` | `fieldset[interop-checkbox-group="chips"]` |
| (declined) choice chips | `fieldset[interop-radio-group="chips"]` |
| `[interop-chip-badge]`, `ul[interop-chip-list]` of display chips | `<span interop-badge>` |
| `li[interop-chip-item][removable]` | `ul[interop-tags]` + `bindTags()` |
| `div[interop-chip-input]` | The tags list, then an `<input>`, + `bindTagInput()` |
| (deferred) assist chips | `button[interop-button]` |

## Why it is not rebuilt

- A chip is a look, not a kind of thing. Prime grouped six components by shape,
  so a non-interactive label became a chip component and a checkbox group grew
  its own state.
- Its accessibility assessment did not hold in the code: every filter group's
  legend was `display: none`, option ids collided across groups, removing a
  chip dropped focus to the body, and the selected state disappeared in forced
  colors.
- About 1,500 lines delivered what native checkboxes, radios, buttons and text
  already do, plus two small jobs the platform cannot: tags and tag entry.

Do not reintroduce listbox or grid roles for chips, a chip component that
mirrors a checkbox's state, or a remove button inside a badge.
