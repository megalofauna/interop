# Select — Mental Model Card

A select is a native `<select interop-select>` drawn by the field's rules, in
the segmented control's look: the box is the segmented frame (channel fill, an
edge 3:1 against the page), and the chosen option in the list is the pill. The browser
opens it, handles the keyboard and typeahead, submits its value and opens the
system picker on phones. CSS only. Research:
[prompts/SELECT-RESEARCH.md](../../prompts/SELECT-RESEARCH.md).

```html
<label for="city">City</label>
<select id="city" interop-select name="city">
  <optgroup label="Europe"><option>Lisbon</option><option>Oslo</option></optgroup>
  <hr />
  <optgroup label="Asia"><option>Seoul</option></optgroup>
</select>
```

## Files

```
projects/interop/select/
  interop-select.structure.css   the field, the classic chevron, base-select parts; names list at the top
  interop-select.base.css        token values and size steps
  public-api.ts                  empty: CSS only
```

The demo page is `projects/demo/src/app/components/select/`.

## Two layers

| | Classic: Firefox, Safari before 27 | Base-select: Chrome 135, Safari 27 |
|---|---|---|
| Closed field | Border, radius, size steps, padding | The same |
| Chevron | A triangle of two gradients in `currentColor`, 0.625 of the icon size wide, flipped in right-to-left: a background image cannot take the text color | `::picker-icon`: the disclosure's chevron (Tabler `chevron-down`) as a mask over `currentColor`, turning to point up while `:open` |
| Chevron in forced colors | Gradients are removed, so `appearance: auto` brings back the browser's arrow | The icon opts out with `forced-color-adjust: none` and keeps the text color |
| Chosen option | Drawn by the browser | The segmented pill: a raised fill and an inset edge 3:1 against the list |
| List of options | Drawn by the browser or the OS | `::picker(select)` with the popover's tokens; options with the check, wrapping text, hover and focus fill, group headings, `<hr>` lines |
| `size` > 1, `multiple` | Native rows | House rows, as many as `size` (4 without one), from `attr(size type(<integer>))` |

Rules for base-select parts sit inside `@supports (appearance: base-select)`,
each in its own rule. A browser drops a whole rule when one of its selectors
uses a pseudo-element it does not know.

## Levers

The box's look is the field's tokens, declared on the select in
`interop-select.base.css`, so they change the select and not text fields:
`--itx-field-background-color[-hover]`, `--itx-field-border-color[-hover]`,
`--itx-field-border-width`, `--itx-field-border-radius`, `--itx-field-color`,
`--itx-field-min-inline-size`. The width cap is the select's own,
`--itx-select-max-inline-size` (100%). Because the select declares them on
itself, a wrapper's values do not reach it: target the select. No
`--itx-select-*` aliases for the box. The contrast spec measures the select's
own block, since the shared map keeps only the field's first declarations.

## Rules

| Concern | How |
|---|---|
| Name | A `<label for>`, like any form control. axe checks it |
| Group names | `<optgroup label>`. It is shown and announced in both layers. A `<legend>` first child works in base-select only |
| Option text | Every option needs text, visually hidden if an icon shows instead. Browsers without base-select keep only the text (dev audit `select-option-text`) |
| Rich options | Any markup inside an option in base-select. The option is a two-column grid: the check, then every child stacked. `<button><selectedcontent></selectedcontent></button>` as the first child shows a copy of the chosen option in the field. Avoid `id`s inside options: the copy repeats them |
| Several choices | `multiple` is styled. The dev audit warns (`select-multiple`) and points to `fieldset[interop-checkbox-group]` |
| Width | Base-select sizes the field to its chosen option (`field-sizing: content !important` in the browser's styles), so the field has a minimum width and never exceeds its container |
| Picker motion | Fades in, disappears at once, like every popover |
| Forced colors | The hovered or focused option shows in `Highlight`. The chosen option keeps its check, which is text |
| Angular | Native select: `[value]` and `(change)`, or Angular forms. The compiler knows `<selectedcontent>` |
| Invokers | None. A select opens itself, and no command targets one |

The picker reads `--itx-popover-*` because the popover's token block also
matches `select[interop-select]`. Theming the popover themes the picker.

## Sizes

| Size | Height | Text | Option rows |
|---|---|---|---|
| `sm` | 32px | `p-sm` | 24px |
| default | 40px | `p` | 32px |
| `lg` | 56px | `p-lg` | 40px |

The heights are the button's, so a select and a button line up.

| Token | Default |
|---|---|
| The box: height, padding, text, colors, border, radius, disabled | The field's `--itx-field-*` tokens, shared with text fields: see [field.md](field.md) |
| `--itx-select-gap`, `-icon-size` | `--itx-space-2`; 0.625rem wide, half as tall |
| `--itx-select-cursor` | default |
| `--itx-select-list-padding` | `--itx-space-1` |
| `--itx-select-option-min-block-size`, `-option-padding-inline` | `--itx-space-8`, `--itx-space-2` |
| `--itx-select-option-background-color-hover` | neutral-200/700 |
| `--itx-select-option-border-radius` | nested: the house radius less the list padding |
| `--itx-select-legend-font-size`, `-legend-line-height` | the `p-sm` role |
| `--itx-select-separator-color` | neutral-300/700 |

## Tested

Style guards: target size, contrast (text, border, hovered option), radius,
forced colors, motion. axe on a labeled select with groups and a `size` list.
Audit rules have specs.

In Chrome 155: keyboard (Space opens, arrows move, Enter chooses, typing
chooses closed, Escape closes), the accessibility tree (combobox or listbox,
named groups), forced colors, right-to-left, light and dark, and the classic
layer by turning off its `@supports` rules.

Not tested: Safari 27, Firefox, iOS and Android pickers, screen reader output.

## Not built

A combobox, a filtering list, a multiple select in a popup, `<legend>` styling
beyond padding.
