# Control — Mental Model Card

**Status:** switch built. Checkbox and radio designed, not built. Research and
remediation list:
[prompts/VISIMORPH-RESEARCH.md](../../prompts/VISIMORPH-RESEARCH.md).

Control styles the three binary form controls: checkbox, radio, and switch.
It is CSS only. The native `<input>` draws its own indicator with
`appearance: none` and `::before`/`::after`. The browser holds all state.
There is no TS component.

```html
<label interop-checkbox><input type="checkbox" name="terms"> Accept terms</label>
<label interop-radio><input type="radio" name="size" value="s"> Small</label>
<label interop-switch><input type="checkbox" role="switch" name="dark"> Dark mode</label>
```

## Files

```
projects/interop/switch/
  interop-switch.structure.css    label, track, thumb, states, forced colors; names list at the top
  interop-switch.base.css         token values
  public-api.ts                   export {};  (CSS only, same as popover)
  ng-package.json
```

Each variant is its own flat folder (`switch/`, later `checkbox/` and
`radio/`), imported as `interop/<name>`. All CSS is imported from
`interop.css`. This card covers the approach the three share. Anything they
share in code goes in `styles/`, the way `outline.css` serves several
components.
The switch focus ring is in the shared selector list in `styles/outline.css`.
The demo page is `projects/demo/src/app/components/switch/`.

## Scope

The input styles apply only inside the three label selectors:

```css
:where(label:is([interop-checkbox], [interop-radio], [interop-switch])) > input
```

A bare `<input>` outside those labels keeps its native rendering. There is no
opt-in attribute for bare inputs.

## Variant selection

The input's own semantics select the variant. There is no `type` attribute.

| Variant | Selector |
|---|---|
| radio | `input[type=radio]` |
| checkbox | `input[type=checkbox]:not([role=switch], [switch])` |
| switch | `label[interop-switch] > input:is([role=switch], [switch])` |

`role="switch"` is the supported spelling. `[switch]` is matched because Safari
17.4+ ships it; other engines ignore it. `appearance: none` also turns off
Safari's native switch rendering. A switch input with neither keeps the native
checkbox look, so a missing role is visible.

## State

| State | Selector | Effect |
|---|---|---|
| checked | `:checked` | fill changes; switch thumb moves to inline-end |
| indeterminate | `:indeterminate` | checkbox only, dash replaces check |
| disabled | `:disabled` | the label and its text take reduced opacity |
| focus | `:focus-visible` | outline on the input |
| hover | label `:hover` | track background and border only |

Every state comes from a pseudo-class. Nothing reflects state into attributes.
`form.reset()`, bfcache restore, autofill, and `<fieldset disabled>` update the
visual with no extra code.

Indeterminate is a DOM property. In Angular, bind it directly:

```html
<input type="checkbox" [checked]="all()" [indeterminate]="some()">
```

Do not set `aria-checked` on the input. Browsers map `.indeterminate` to
mixed, and ARIA in HTML disallows `aria-checked` on a native checkbox.

## Label

The label is the hit target: `inline-flex`, a gap, and a minimum block size.
It has no background or border of its own. Markup order sets the side: text
before the input puts the control at the end. There are no layout modifiers.

## Switch geometry

The input is the track and its `::before` is the thumb. The track uses
`box-sizing: content-box` with `block-size` equal to the thumb size, so padding
and border sit outside the content box. The thumb moves by
`margin-inline-start: calc(100% - thumb size)`. That is a logical property,
so right-to-left needs no rule, and the travel needs no border arithmetic.

## Tokens

Names follow `--itx-<component>[-<element>]-<css-property>[-<state>]`. Values
are declared on the label in the base file. Override them on the label or a
class that matches it. The structure file reads tokens with no fallbacks,
except state tokens, which fall back to the rest value.

| Switch token | Default |
|---|---|
| `--itx-switch-gap`, `-min-block-size` | `--itx-space-2`, `--itx-space-10` |
| `--itx-switch-font-size`, `-line-height` | the `label` role |
| `--itx-switch-cursor[-disabled]`, `-opacity-disabled` | default, not-allowed, 0.5 |
| `--itx-switch-track-block-size` | `--itx-space-6` (outer) |
| `--itx-switch-track-inline-size`, `-padding`, `-border-width`, `-border-style`, `-border-radius` | 2 × thumb (content), `--itx-space-0_5`, 1px, solid, full |
| `--itx-switch-track-border-color[-hover\|-checked]` | neutral-500/400, 600/300, transparent |
| `--itx-switch-track-background-color[-hover\|-checked\|-checked-hover]` | neutral-50/900, 100/800, 900/50, 700/200 |
| `--itx-switch-thumb-size`, `-border-radius` | track height − 2 × padding − 2 × border, full |
| `--itx-switch-thumb-background-color[-checked]` | neutral-500/400, 50/900 |
| `--itx-switch-transition-duration`, `-timing-function` | the shared transition tokens |

## Size

| `itx-size` on the label | Track (outer) | Thumb | Label min block size | Text |
|---|---|---|---|---|
| none, `md` | 42 × 24px (`space-6`) | 18px | 40px (`space-10`) | `label` role |
| `lg` | 58 × 32px (`space-8`) | 26px | 48px (`space-12`) | `p` role |

`lg` sets the track's outer height, the label's minimum height, and the text
role. The thumb size is the track height minus padding and border. The track's
content width is two thumbs. There is no `sm`: 24px is the WCAG 2.5.8 minimum
for the track on its own.

`styles/contrast.spec.ts` checks every pair at 3:1 in both schemes:
off and hover track border against the page, off thumb against the off and
hover tracks, on and on-hover track against the page, and on thumb against
the on tracks.

Each variant has its own token family (`--itx-switch-*`). A cross-variant
layer that re-themes all three at once is decided when the checkbox lands,
and only if it removes duplication without adding aliases.

## Media queries

| Query | Behavior |
|---|---|
| `forced-colors: active` | `forced-color-adjust: none` with system colors: track `Canvas`/`CanvasText`, on `Highlight`/`HighlightText`, disabled `GrayText`, focus ring `Highlight` |
| `prefers-reduced-motion: reduce` | The shared transition tokens are 0ms (`styles/transition.css`) |
| `prefers-contrast: more` | 2px track border |

## Constraints

- Firefox creates `::before`/`::after` on checkbox and radio only when
  `appearance: none` is set. The structural file always sets it.
- Focus never changes the control's size.
- A switch has no indeterminate state.

## When a TS component is warranted

None ships until a concrete need exists. Angular forms need none: the built-in
checkbox value accessor and Signal Forms bind the native input. Likely first
needs: a checkbox group, or app-level data passing. A component added then wraps this markup. It does not mirror
input state into another element. See [visimorph.md](visimorph.md) for why.
