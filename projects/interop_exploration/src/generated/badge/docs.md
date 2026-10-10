# badge

Selector `:where([interop-badge])`. Themeable.

## Modifiers

Each applies while its selector matches the component.

| Modifier | Selector |
| --- | --- |
| dot | `:where([interop-badge])[interop-badge=""]` |
| top-left | `:where([interop-badge])[itx-badge-position="top-left"]` |
| bottom-right | `:where([interop-badge])[itx-badge-position="bottom-right"]` |
| bottom-left | `:where([interop-badge])[itx-badge-position="bottom-left"]` |

## Levers

### layout

| Token | Element | Type | Value | States | Description |
| --- | --- | --- | --- | --- | --- |
| `--itx-badge-indicator-display` | indicator | `flex` \| `inline-flex` \| `block` \| `inline-block` \| `grid` | `inline-flex` | — | How the box participates in the surrounding flow. |
| `--itx-badge-indicator-align-items` | indicator | `center` \| `start` \| `end` \| `stretch` \| `baseline` | `center` | — | Cross-axis placement of the contents. |
| `--itx-badge-indicator-justify-content` | indicator | `center` \| `flex-start` \| `flex-end` \| `space-between` | `center` | — | Main-axis distribution of the contents. |
| `--itx-badge-indicator-min-inline-size` | indicator | length | `var(--itx-size-value)` | — | Smallest width the box will take. |
| `--itx-badge-indicator-min-block-size` | indicator | length | `var(--itx-size-value)` | — | Smallest height the box will take. Grows past it rather than clipping. |
| `--itx-badge-indicator-margin` | indicator | length | `0px` | — | Outer space on every side. On an anchored box, the distance from the anchor. |
| `--itx-badge-indicator-z-index` | indicator | integer-or-auto | `1` | — | Stacking order among positioned boxes. `auto` for none of its own. |

### shape

| Token | Element | Type | Value | States | Description |
| --- | --- | --- | --- | --- | --- |
| `--itx-badge-indicator-border-radius` | indicator | length | `999px` | — | Corner rounding. |
| `--itx-badge-indicator-padding-inline` | indicator | length-pair | `var(--itx-size-value)` | — | Inner space to the left and right of the contents. |

### type

| Token | Element | Type | Value | States | Description |
| --- | --- | --- | --- | --- | --- |
| `--itx-badge-indicator-font-size` | indicator | length | `var(--itx-size-value)` | — | Text size. |
| `--itx-badge-indicator-font-weight` | indicator | number | `400` | — | Text weight. |
| `--itx-badge-indicator-line-height` | indicator | number | `1.3333` | — | Leading, as a multiple of the font size. |

### paint

| Token | Element | Type | Value | States | Description |
| --- | --- | --- | --- | --- | --- |
| `--itx-badge-indicator-background-color` | indicator | color | `var(--itx-color-value)` | — | Fill behind the contents. |
| `--itx-badge-indicator-text-color` | indicator | color | `var(--itx-color-value)` | — | Color of the text, and of anything following currentColor. |
