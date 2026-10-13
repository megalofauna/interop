# InteropListbox — Retired

Not rebuilt. Research:
[prompts/LISTBOX-REVIEW.md](../../prompts/LISTBOX-REVIEW.md). The deprecated
source is in `projects/interop_deprecated/src/lib/components/interop-listbox/`,
with CSS in `styles/components/listbox.css` and
`styles/themes/protocol/components/listbox.css`.

| Prime use | Now |
|---|---|
| Stepper "jump to step" menu | The step list in `ol[interop-steps]`; `--show-step` for "Change" links |
| One choice from a short list | `fieldset[interop-radio-group]` |
| One choice from a long list | `select[interop-select]`: see [select.md](select.md) |
| Several choices | `fieldset[interop-checkbox-group]` + `bindSelectAll()` |

## Why it is not rebuilt

- Its uses were a navigation menu and radio and checkbox groups. Native
  controls do those with the browser's keyboard, form submission and forced
  colors.
- Multi-select listboxes test poorly: 25.3% task success for native
  `<select multiple>` against 100% for a single `<select>` (Higley).
- It missed the APG keyboard for multi-select, swallowed Escape inside
  popovers, hid disabled options from the keyboard, and lost both its selected
  and active cues in forced colors.

The listbox returns as the popup of a filtering combobox, built framework-free
with a typeahead helper. Do not add a standalone listbox for a choice that a
radio group, a checkbox group or a `<select>` can make.
