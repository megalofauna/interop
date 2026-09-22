# button

Selector `:where(button)`. Themeable.

## Axes

| Axis | Attribute | Values | Base |
| --- | --- | --- | --- |
| variant | `itx-variant` | `primary`, `secondary`, `danger` | `primary` |
| size | `itx-size` | `sm`, `md`, `lg` | `md` |

## Levers

### layout

| Token | Part | Type | Value | States | Description |
| --- | --- | --- | --- | --- | --- |
| `--itx-button-display` | — | `flex` \| `inline-flex` \| `block` \| `inline-block` \| `grid` | `inline-flex` | — | How the box participates in the surrounding flow. |
| `--itx-button-align-items` | — | `center` \| `start` \| `end` \| `stretch` \| `baseline` | `center` | — | Cross-axis placement of the contents. |
| `--itx-button-justify-content` | — | `center` \| `flex-start` \| `flex-end` \| `space-between` | `center` | — | Main-axis distribution of the contents. |
| `--itx-button-gap` | — | length-pair | `var(--itx-size-value)` | — | Space held between the contents. |
| `--itx-button-icon-flex-shrink` | icon | number | `0` | — | How readily the box gives up space when crowded. |

### shape

| Token | Type | Value | States | Description |
| --- | --- | --- | --- | --- |
| `--itx-button-border-radius` | length | `var(--itx-size-value)` | — | Corner rounding. |
| `--itx-button-border-width` | length | `1px` | — | Thickness of the border. Its colour is a paint lever. |
| `--itx-button-padding-block` | length-pair | `var(--itx-size-value)` | — | Inner space above and below the contents. |
| `--itx-button-padding-inline` | length-pair | `var(--itx-size-value)` | — | Inner space to the left and right of the contents. |
| `--itx-button-min-block-size` | length | `var(--itx-size-value)` | — | Smallest height the box will take. Grows past it rather than clipping. |

### type

| Token | Type | Value | States | Description |
| --- | --- | --- | --- | --- |
| `--itx-button-font-family` | string | `system-ui, sans-serif` | — | Typeface. Inherits from the page unless set. |
| `--itx-button-font-size` | length | `var(--itx-size-value)` | — | Text size. |
| `--itx-button-font-weight` | number | `400` | — | Text weight. |
| `--itx-button-line-height` | number | `1.2` | — | Leading, as a multiple of the font size. |

### paint

| Token | Part | Type | Value | States | Description |
| --- | --- | --- | --- | --- | --- |
| `--itx-button-background-color` | — | color | `var(--itx-color-value)` | yes | Fill behind the contents. |
| `--itx-button-border-color` | — | color | `var(--itx-color-value)` | yes | Color of the border drawn at the border width. |
| `--itx-button-text-color` | — | color | `var(--itx-color-value)` | yes | Color of the text, and of anything following currentColor. |
| `--itx-button-icon-text-color` | icon | color | `var(--itx-color-value)` | yes | Color of the text, and of anything following currentColor. |

### effect

| Token | Type | Value | States | Description |
| --- | --- | --- | --- | --- |
| `--itx-button-outline-color` | color | `var(--itx-color-value)` | yes | Color of the outline, normally the focus ring. |
| `--itx-button-outline-width` | length | `0` | yes | Thickness of the outline. Zero hides it without switching anything off. |
| `--itx-button-outline-offset` | length | `2px` | yes | Gap between the border edge and the outline. |

## States

Stateful levers take a suffixed token — `--itx-button-background-color-hover`, and so on. Leave one unset and the state falls through to the base value; there is nothing to restate.
