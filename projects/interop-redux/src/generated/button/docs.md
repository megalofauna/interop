# button

Selector `:where(button[interop-button])`. Themeable.

## Axes

An element carrying none of these attributes takes the base values. So does one carrying a value marked default. Every other value is an exception.

| Axis | Attribute | Values |
| --- | --- | --- |
| variant | `itx-variant` | `secondary`, `danger` |
| size | `itx-size` | `sm`, `base` (default), `lg` |

## Levers

### layout

| Token | Element | Type | Value | States | Description |
| --- | --- | --- | --- | --- | --- |
| `--itx-button-align-items` | — | `center` \| `start` \| `end` \| `stretch` \| `baseline` | `center` | — | Cross-axis placement of the contents. |
| `--itx-button-display` | — | `flex` \| `inline-flex` \| `block` \| `inline-block` \| `grid` | `inline-flex` | — | How the box participates in the surrounding flow. |
| `--itx-button-gap` | — | length-pair | `var(--itx-size-value)` | — | Space held between the contents. |
| `--itx-button-justify-content` | — | `center` \| `flex-start` \| `flex-end` \| `space-between` | `center` | — | Main-axis distribution of the contents. |
| `--itx-button-max-block-size` | — | length-or-none | `none` | — | Largest height the box will take. `none` for no limit. |
| `--itx-button-max-inline-size` | — | length-or-none | `none` | — | Largest width the box will take. `none` for no limit. |
| `--itx-button-min-block-size` | — | length | `var(--itx-size-value)` | — | Smallest height the box will take. Grows past it rather than clipping. |
| `--itx-button-min-inline-size` | — | length | `0` | — | Smallest width the box will take. |
| `--itx-button-icon-flex-shrink` | icon | number | `0` | — | How readily the box gives up space when crowded. |

### shape

| Token | Type | Value | States | Description |
| --- | --- | --- | --- | --- |
| `--itx-button-border-radius` | length | `var(--itx-size-value)` | — | Corner rounding. |
| `--itx-button-padding-block` | length-pair | `var(--itx-size-value)` | — | Inner space above and below the contents. |
| `--itx-button-padding-inline` | length-pair | `var(--itx-size-value)` | — | Inner space to the left and right of the contents. |

### border

| Token | Type | Value | States | Description |
| --- | --- | --- | --- | --- |
| `--itx-button-border-color` | color | `var(--itx-color-value)` | yes | Color of the border drawn at the border width. |
| `--itx-button-border-style` | `solid` \| `dashed` \| `dotted` \| `double` \| `none` | `solid` | — | How the border line is drawn. |
| `--itx-button-border-width` | length | `1px` | — | Thickness of the border. |

### outline

| Token | Type | Value | States | Description |
| --- | --- | --- | --- | --- |
| `--itx-button-outline-color` | color | `var(--itx-color-value)` | yes | Color of the outline, normally the focus ring. |
| `--itx-button-outline-offset` | length | `2px` | yes | Gap between the border edge and the outline. |
| `--itx-button-outline-width` | length | `0` | yes | Thickness of the outline. Zero hides it without switching anything off. |

### type

| Token | Type | Value | States | Description |
| --- | --- | --- | --- | --- |
| `--itx-button-font-family` | string | `system-ui, sans-serif` | — | Typeface. Inherits from the page unless set. |
| `--itx-button-font-size` | length | `var(--itx-size-value)` | — | Text size. |
| `--itx-button-font-weight` | number | `400` | — | Text weight. |
| `--itx-button-line-height` | number | `1.2` | — | Leading, as a multiple of the font size. |
| `--itx-button-text-align` | `start` \| `end` \| `center` \| `justify` | `center` | — | Alignment of the text within the box. |

### paint

| Token | Element | Type | Value | States | Description |
| --- | --- | --- | --- | --- | --- |
| `--itx-button-background-color` | — | color | `var(--itx-color-value)` | yes | Fill behind the contents. |
| `--itx-button-text-color` | — | color | `var(--itx-color-value)` | yes | Color of the text, and of anything following currentColor. |
| `--itx-button-icon-text-color` | icon | color | `var(--itx-color-value)` | yes | Color of the text, and of anything following currentColor. |

### cursor

| Token | Type | Value | States | Description |
| --- | --- | --- | --- | --- |
| `--itx-button-cursor` | string | `pointer` | yes | Pointer shown over the box. |

## States

Stateful levers take a suffixed token — `--itx-button-border-color-hover`, and so on. Leave one unset and the state falls through to the base value; there is nothing to restate.
