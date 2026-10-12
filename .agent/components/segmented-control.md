# InteropSegmentedControl — Retired

Replaced by the segmented variant of the radio group,
`fieldset[interop-radio-group="segmented"]`. See [control.md](control.md).
The deprecated source is in
`projects/interop_deprecated/src/lib/components/interop-segmented-control/`,
with CSS in `styles/components/segment.css` and
`styles/themes/protocol/components/segmented-control.css`. Full review:
[prompts/SEGMENTED-CONTROL-RESEARCH.md](../../prompts/SEGMENTED-CONTROL-RESEARCH.md).

## What it was

A `<fieldset>` of `<button aria-pressed>` segments with a JS roving tabindex,
where arrow keys moved focus and changed the selection, and an
`<interop-indicator>` pill anchored to the pressed segment.

## Why it is not rebuilt

It described a one-of-many choice as independent toggle buttons:

- Screen readers heard no exclusivity and no "2 of 3", and a pressed segment
  could not be un-pressed.
- No platform exposes an exclusive segmented control as pressed toggles. macOS
  calls the mode "radio button" mode; iOS speaks "n of m"; Android reports
  radio buttons.
- The arrow-key contract was the radio contract on a role that does not
  announce it.
- Its JS reimplemented what a shared radio `name` does natively, with three
  sources of truth that could disagree.

Do not reintroduce `aria-pressed` for an exclusive set. `aria-pressed` belongs
to independent toggles, such as Bold and Italic in a toolbar.
