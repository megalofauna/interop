# Icon — Mental Model Card

An icon is an `<svg interop-icon>`. With `name`, `InteropIcon` draws a
registered icon's paths into it; without one, the SVG's own children render
unchanged. It is 1em square in the text color, and hidden from assistive
technology unless it has `aria-label` or `aria-labelledby`. Icons are
registered by the app, one module per icon.

```ts
import { registerIcons } from 'interop';
import { TablerCheck } from 'interop/tabler';
registerIcons(TablerCheck);
```

```html
<svg interop-icon name="tabler-check"></svg>
<svg interop-icon name="tabler-check" size="24" aria-label="Done"></svg>
<svg interop-icon viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l9 18H3z" /></svg>
```

## Files

```
projects/interop/icon/
  interop-icon.structure.css   size, alignment, color, stroke width
  interop-icon.base.css        token values
  icon.ts                      InteropIcon component
  public-api.ts
projects/interop/src/icon-registry.ts   registerIcons(), getIcon(), IconDefinition, IconPath
projects/interop/tabler/
  icons.json                   the Tabler names to generate
  <name>.ts                    one IconDefinition per icon, generated
  public-api.ts                generated
projects/interop/tools/generate-tabler.mjs   writes tabler/ from @tabler/icons
```

The demo page is `projects/demo/src/app/components/icon/`.

## Registry

| API | Behavior |
|---|---|
| `registerIcons(...definitions)` | Makes icons available by `name`. A later definition with the same name replaces the earlier one |
| `getIcon(name)` | The definition, or `undefined` |
| `IconDefinition` | `name`, `viewBox`, `fill` (`none` for outline, `currentColor` for filled), `stroke`, `paths` |
| `IconPath` | `d`, and optional `fill`, `stroke`, `opacity` |

`interop/tabler` ships 10 outline icons, named `tabler-<name>`: check, x,
plus, minus, chevron-down, chevron-up, chevron-left, chevron-right, copy,
search. Each is its own module in `tabler/`; the entry point re-exports all
of them.
To add one, add its name to `icons.json` and run `node
projects/interop/tools/generate-tabler.mjs`. A name ending in `-filled` reads
Tabler's filled style. The generator drops Tabler's bounding-box path.

The code block registers `tabler-copy` and `tabler-check` itself.

## InteropIcon

Selector `svg[interop-icon]`.

| Input or attribute | Effect |
|---|---|
| `name` | Draws the registered icon: a `<g>` with its fill and stroke, round caps and joins, and one `<path>` per path. Sets `viewBox` from the definition |
| No `name` | Renders the SVG's own children and keeps its own `viewBox` |
| `size` | Pixels. Fixes the inline and block size at that value through the size tokens, over everything else |
| `itx-size` | A step of the icon scale: `xs` 12, `sm` 16, `md` 20, `lg` 24, `xl` 32px (`--itx-icon-size-<step>` on `:root`) |
| `--itx-icon-size` | Set on any ancestor, sizes every icon inside it. A button sets it to its own step. Without it, and without `itx-size` or `size`, an icon is 1em, the size of its text. That is the one size-step exception: no attribute is the text's size, not `md`, because an icon in a line of text should match the text |
| `aria-label` or `aria-labelledby` | `role="img"`, no `aria-hidden`. A `MutationObserver` follows a label added or removed later |
| No label | `aria-hidden="true"`, no role |

An unregistered `name` draws nothing and, in development, warns once per
change: `InteropIcon: "<name>" is not registered. Pass it to registerIcons().`

The first render reads `aria-label` and `aria-labelledby` from the template's
attributes, so server-rendered HTML has the right role.

## Naming

| Context | Markup |
|---|---|
| Beside text, in a button or a sentence | No label. The icon is hidden |
| Icon-only button | `aria-label` on the button, or a label tooltip. The icon stays unlabeled |
| An icon that means something on its own | `aria-label` on the icon: it becomes an image with that name |

## Look

Inline block, `flex-shrink: 0`, aligned 0.125em below the baseline, so it sits
on the text line and keeps its size in a flex row.

| Token | Default |
|---|---|
| `--itx-icon-inline-size`, `-block-size` | `var(--itx-icon-size, 1em)` |
| `--itx-icon-vertical-align` | -0.125em |
| `--itx-icon-color` | currentColor |
| `--itx-icon-stroke-width` | 2 |

## Dev audit rules

| Rule | Flags |
|---|---|
| `icon-label-hidden` | An icon with `aria-label` or `aria-labelledby` and `aria-hidden="true"` |
| `icon-label-repeated` | A labeled icon inside a button that already has text: "Copy Copy" |
| `button-name` | Any button holding an icon, with no accessible name. A labeled icon counts as a name |

## Tested

Style guard: motion. axe on icons in text, a labeled icon, icon-only buttons
with `aria-label` and with a label tooltip, and icon radios and tabs with
visually hidden text. `InteropIcon` has 7 specs, the registry 3. Audit rules
have specs.

Not recorded: browser runs, screen reader output.

## Not built

Icon sets besides Tabler, sprite sheets, filled Tabler icons in
`icons.json`.
