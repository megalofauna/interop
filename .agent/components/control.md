# Control — Mental Model Card

**Status: designed, not built.** Research and remediation list:
[prompts/VISIMORPH-RESEARCH.md](../../prompts/VISIMORPH-RESEARCH.md).

Control styles the three binary form controls: checkbox, radio, and switch.
It is CSS only. The native `<input>` draws its own indicator with
`appearance: none` and `::before`/`::after`. The browser holds all state.
There is no TS component.

```html
<label interop-checkbox><input type="checkbox" name="terms"> Accept terms</label>
<label interop-radio><input type="radio" name="size" value="s"> Small</label>
<label interop-toggle><input type="checkbox" role="switch" name="dark"> Dark mode</label>
```

## Files

```
projects/interop/control/
  interop-control.structure.css   geometry, pseudo-elements, state selectors, media queries
  interop-control.base.css        token values
  public-api.ts                   export {};  (CSS only, same as popover)
  ng-package.json
```

Both CSS files are imported from `interop.css`.

## Scope

The input styles apply only inside the three label selectors:

```css
:where(label:is([interop-checkbox], [interop-radio], [interop-toggle])) > input
```

A bare `<input>` outside those labels keeps its native rendering. There is no
opt-in attribute for bare inputs.

## Variant selection

The input's own semantics select the variant. There is no `type` attribute.

| Variant | Selector |
|---|---|
| radio | `input[type=radio]` |
| checkbox | `input[type=checkbox]:not([role=switch], [switch])` |
| switch | `input[type=checkbox]:is([role=switch], [switch])` |

`role="switch"` is the supported spelling. `[switch]` is matched because Safari
17.4+ ships it; other engines ignore it. `appearance: none` also turns off
Safari's native switch rendering.

## State

| State | Selector | Effect |
|---|---|---|
| checked | `:checked` | fill to accent, indicator scales in |
| indeterminate | `:indeterminate` | checkbox only, dash replaces check |
| disabled | `:disabled` | reduced opacity on input and label |
| focus | `:focus-visible` | outline on the input |
| hover / active | label `:hover`, `:active` | label surface background and border |

Every state comes from a pseudo-class. Nothing reflects state into attributes.
`form.reset()`, bfcache restore, autofill, and `<fieldset disabled>` update the
visual with no extra code.

Indeterminate is a DOM property. In Angular, bind it directly:

```html
<input type="checkbox" [checked]="all()" [indeterminate]="some()">
```

Do not set `aria-checked` on the input. Browsers map `.indeterminate` to
mixed, and ARIA in HTML disallows `aria-checked` on a native checkbox.

## Label shell

The label is the hit target. Its interaction surface is a `::before` inset
behind the label content. Hover, active and focus read the input through
`:has(input:…)`. The label carries no focus ring. The input does.

On coarse pointers the label extends its hit area by
`--itx-control-touch-inset`. On fine pointers the inset is `0`.

## Tokens

One family, `--itx-control-*`. One override at any ancestor re-themes all
three variants. Names follow `--itx-<component>-<css-property>[-<state>]`.
The structural file reads tokens with no fallbacks. The base file owns every
value.

| Group | Tokens |
|---|---|
| Box | `size`, `border-width`, `border-color`, `background-color`, `border-radius`, `corner-shape` |
| Checked | `accent`, `indicator` (dot/check ink), `check-width` |
| Radio | `dot-size` |
| Switch | `switch-inline-size`, `switch-block-size`, `switch-thumb-size`, `switch-thumb-color[-checked]` |
| Focus | `outline-width`, `outline-offset`, `outline-color` |
| Motion | `transition-duration`, `transition-timing-function` |
| Disabled | `disabled-opacity` |
| Label shell | `label-gap`, `label-padding-block`, `label-padding-inline`, `label-background-color[-hover\|-active\|-focus]`, `label-border-color[-hover\|-active\|-focus]`, `label-border-radius` |

## Media queries

| Query | Behavior |
|---|---|
| `forced-colors: active` | Indicator pseudo-elements use system colors with `forced-color-adjust: none`. Without it the radio dot and switch thumb disappear |
| `prefers-reduced-motion: reduce` | `transition: none` on the input and its pseudo-elements |
| `prefers-contrast: more` | Wider border |
| `pointer: fine` | `--itx-control-touch-inset: 0` |

## Constraints

- Firefox creates `::before`/`::after` on checkbox and radio only when
  `appearance: none` is set. The structural file always sets it.
- Focus never changes the control's size.
- Every color pair needs 3:1 (WCAG 1.4.11): unchecked border on surface,
  indicator on accent, switch thumb on track. Measure when writing the base
  file.
- A switch has no indeterminate state.

## When a TS component is warranted

None ships until a concrete need exists. Likely first needs: a
ControlValueAccessor for template-driven forms, a checkbox group, or app-level
data passing. A component added then wraps this markup. It does not mirror
input state into another element. See [visimorph.md](visimorph.md) for why.
