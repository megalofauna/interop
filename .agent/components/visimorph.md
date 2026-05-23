# InteropVisimorph — Mental Model Card

## Files

```
src/lib/components/interop-visimorph/
  interop-visimorph.ts       component (empty template, host attribute reflection)
  public-api.ts              barrel
src/lib/styles/components/visimorph.css                  structural rules
src/lib/styles/themes/protocol/components/visimorph.css  token values
projects/demo/src/app/pages/visimorph/                   demo page (state matrix)
```

Live consumers: `interop-radio-control`, `interop-checkbox`, `interop-toggle-control`.

## What it is

A purpose-built **decorative surface** for the three faux-control patterns the
library supports — radio (ring + dot), checkbox (box + check / dash), toggle
(pill track + sliding thumb). It owns no behaviour, exposes only reflective
inputs, and is always rendered alongside a native `<input>` that handles
focus, keyboard, and form submission.

```html
<interop-visimorph
  [type]="'checkbox'"
  [checked]="checked()"
  [indeterminate]="indeterminate()"
  [disabled]="disabled()"
  [focused]="focused()" />
```

The host element is `aria-hidden="true"` + `role="presentation"` and
`pointer-events: none` — clicks travel through to the underlying input.

## Why a component, not a directive

1. **Three visual variants from one DOM node.** The same `<interop-visimorph>`
   morphs between radio/checkbox/toggle via `[itx-visimorph]` attribute. A
   directive would force three element types on consumers; a component lets the
   variant be a typed input.
2. **Forced a11y attributes.** `aria-hidden`, `role="presentation"`, and
   `pointer-events: none` are unconditional. Consumers can't accidentally
   expose the decoration to assistive tech.
3. **Single attachment point for global CSS.** The selector
   `:where(interop-visimorph)` is the natural hook for the structural file.

## Public token surface — `--itx-control-*`

The token namespace is **`--itx-control-*`**, not `--itx-visimorph-*`. This is
intentional: the visimorph is the *rendering* of every faux control, so
"theme all controls" should be one set of overrides at any ancestor scope.
Radio / checkbox / toggle host CSS only ever *reads* these tokens (they
cascade into the visimorph via normal inheritance); they never *set* private
visimorph slots.

```
Sizing
  --itx-control-size                 (the square box; default 1.25rem)
  --itx-control-dot-size             (radio inner dot)
  --itx-control-check-weight         (checkbox stroke width)
  --itx-control-radius               (checkbox corner radius)

Colour
  --itx-control-border-color
  --itx-control-bg
  --itx-control-accent               (selected/checked fill)
  --itx-control-indicator            (dot / check stroke colour)

Toggle-specific
  --itx-control-toggle-width
  --itx-control-toggle-height
  --itx-control-toggle-thumb-size
  --itx-control-toggle-thumb-width
  --itx-control-toggle-thumb-shadow

Focus ring
  --itx-control-focus-ring-color
  --itx-control-focus-ring-width
  --itx-control-focus-ring-offset
  --itx-control-focus-scale          (press-in transform applied on focus)

Motion / a11y
  --itx-control-transition
  --itx-control-disabled-opacity
```

Re-theming all checkboxes/radios/toggles across an app is a single token-set
at any ancestor scope. Per-control overrides (e.g. one tinted checkbox in a
form) work by setting tokens on the control's wrapper.

## Two ways visimorph differs from indicator

Both live under `.agent/components/` and look superficially similar. Don't
confuse them:

|  | InteropIndicator | InteropVisimorph |
|---|---|---|
| Inputs | None | `type`, `checked`, `disabled`, `indeterminate`, `focused` |
| State | Anchor-driven (CSS) | Attribute-driven (Angular host bindings) |
| Geometry | Tracks an external anchor | Fixed-size, sits in flow |
| Pseudo-elements | None | `::after` (dot / check / thumb) |
| Variants | One | Three (`radio` / `checkbox` / `toggle`) via attribute reflection |

## State activation

State lives in **host attributes** populated by `Component.host` bindings:

| Input | Host attribute | Applies to |
|---|---|---|
| `type` | `itx-visimorph="radio|checkbox|toggle"` | Selects the variant |
| `checked` + radio | `data-selected` | Radio dot reveal |
| `checked` + non-radio | `data-checked` | Checkbox check / toggle thumb position |
| `indeterminate` | `data-indeterminate` | Checkbox dash replaces check |
| `disabled` | `data-disabled` | Opacity reduction |
| `focused` | `data-focused` | Outline ring + press-in transform |

Note: `focused` is **passed in by the parent control**, not auto-derived from
`:focus-visible` on the visimorph itself — the visimorph is not focusable
(`pointer-events: none`). The parent control listens to `(focus)` /
`(blur)` on its native `<input>` and forwards `el.matches(':focus-visible')`.
See `feedback_focus_visible.md`.

## Three variants — render rules

### radio

- Outer: `border-radius: 50%`, transparent fill at rest.
- `::after`: inner dot, `transform: scale(0)` at rest.
- `[data-selected]` → border/bg flip to `--_accent`, dot scales to 1.

### checkbox

- Outer: `border-radius: var(--_radius)`, transparent fill at rest.
- `::after`: rotated L-shape drawn with `border-left`/`border-bottom`,
  `transform: rotate(-45deg) scale(0)` at rest.
- `[data-checked]` → border/bg flip to `--_accent`, check scales to 1.
- `[data-indeterminate]` → border/bg flip to `--_accent`, `::after`
  switches to a horizontal dash (no border-left, scaled to 1). Uses a
  private slot `--_check-weight` so consumers overriding
  `--itx-control-check-weight` still take effect.

### toggle

- Outer: pill (`border-radius: half of height`), wider than tall.
- `::after`: absolutely-positioned thumb, slides horizontally on
  `[data-checked]` via `translateX(track - thumb - 2 * border)`.
- Thumb colour resolves through a private slot per state so the public
  token can be overridden cleanly.

## Shared states

`[data-focused]` lands on the host:

- Outline drawn via `outline: var(--_focus-ring-width) solid
  var(--_focus-ring-color)` with `outline-offset` for breathing room.
- `transform: scale(var(--_focus-scale, 0.875))` — slight press-in. Reduced
  to `1` under `prefers-reduced-motion`.

`[data-disabled]` lands on the host:

- `opacity: var(--_disabled-opacity)` — no other state changes; the
  underlying input still drives the `pointer-events: none` story.

## Accessibility overrides

```css
@media (prefers-contrast: high) {
  :where(interop-visimorph) {
    --itx-control-border-width: 3px;
    --itx-control-focus-ring-width: 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  :where(interop-visimorph),
  :where(interop-visimorph)::after { transition: none; }
}
```

The high-contrast rule sets *public* tokens (not private slots) on purpose:
it documents the override surface — anything an ancestor can do, the
component itself does for accessibility presets.

## CSS strategy

Two-file split per `css-strategy.md`:

| File | Purpose |
|---|---|
| `src/lib/styles/components/visimorph.css` | Structural — variant geometry, pseudo-element positioning, state activation of private slots, `@media` accessibility overrides |
| `src/lib/styles/themes/protocol/components/visimorph.css` | Values — colours, radii, sizes, transition |

Both files are imported globally via `interop.css` / `protocol.css`. All
selectors wrapped in `:where()` for zero specificity. Pseudo-elements sit
outside `:where()` (the strategy's documented exception).

The component itself drops `styleUrl` — there are no per-instance styles to
encapsulate.

## Inputs / Outputs

| Input | Type | Default | Notes |
|---|---|---|---|
| `type` | `'radio' \| 'checkbox' \| 'toggle'` | required | Variant selector |
| `checked` | `boolean` | `false` | Selected (radio) / checked (others) |
| `disabled` | `boolean` | `false` | Visual only — input owns interactivity |
| `indeterminate` | `boolean` | `false` | Checkbox only; ignored otherwise |
| `focused` | `boolean` | `false` | Parent forwards `matches(':focus-visible')` |

No outputs. No methods.

## Known gaps

- **No "data-checked" on toggle indeterminate** — the toggle does not honour
  `indeterminate`. This is by design (`role="switch"` is binary), but consumers
  passing `[indeterminate]="true"` to a toggle visimorph will see no change.
- **`focused` is a manual contract** — the parent must remember to wire it.
  Forgetting it produces a working control with no focus ring.
- **No keyboard / hover affordances of its own** — the visimorph is decorative.
  Hover and active visuals belong to the surrounding label, not the morph.
