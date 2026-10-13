# Select — Mental Model Card

A select is a native `<select interop-select>` with a field's look. The browser
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
  interop-select.structure.css   the field, the classic arrow, base-select parts; names list at the top
  interop-select.base.css        token values and size steps
  public-api.ts                  empty: CSS only
```

The demo page is `projects/demo/src/app/components/select/`.

## Two layers

| | Classic: Firefox, Safari before 27 | Base-select: Chrome 135, Safari 27 |
|---|---|---|
| Closed field | Border, radius, size steps, padding | The same |
| Arrow | Two gradient triangles in `currentColor` on the field's background, flipped in right-to-left | `::picker-icon`, a clip-path triangle |
| Arrow in forced colors | Gradients are removed, so `appearance: auto` brings back the browser's arrow | The icon opts out with `forced-color-adjust: none` and keeps the text color |
| List of options | Drawn by the browser or the OS | `::picker(select)` with the popover's tokens; options with the check, wrapping text, hover and focus fill, group headings, `<hr>` lines |
| `size` > 1, `multiple` | Native rows | House rows, as many as `size` (4 without one), from `attr(size type(<integer>))` |

Rules for base-select parts sit inside `@supports (appearance: base-select)`,
each in its own rule. A browser drops a whole rule when one of its selectors
uses a pseudo-element it does not know.

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
| `--itx-select-min-block-size`, `-min-inline-size` | `--itx-space-10`, 12rem |
| `--itx-select-padding-inline`, `-gap` | `--itx-space-3`, `--itx-space-2` |
| `--itx-select-font-size`, `-line-height` | the `p` role |
| `--itx-select-color`, `-background-color[-hover]` | neutral-900/50, neutral-50/900, neutral-100/800 |
| `--itx-select-border-width`, `-border-style`, `-border-color[-hover]` | 1px (2px with more contrast), solid, neutral-500/400, neutral-600/300 |
| `--itx-select-border-radius`, `-corner-shape` | the house radius and corner shape |
| `--itx-select-icon-size` | 0.625rem wide, half as tall |
| `--itx-select-cursor[-disabled]`, `-opacity-disabled` | default, not-allowed, 0.5 |
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
