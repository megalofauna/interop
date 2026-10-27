# Slider — Mental Model Card

A slider sets one value from a range when the range matters more than the exact
number: volume, brightness, zoom. Research:
[prompts/SLIDER-REVIEW.md](../../prompts/SLIDER-REVIEW.md).

For an exact number, use a text field with `inputmode="numeric"`. For a few named
choices, use a radio group. For a minimum and a maximum, use two text fields in a
fieldset. There is no two-thumb slider.

## Files

```
projects/interop/slider/
  interop-slider.structure.css   track, fill, thumb, vertical, forced colors; names list at the top
  interop-slider.base.css        token values and size steps
  slider.ts                      InteropSlider directive
  public-api.ts
projects/interop/src/bind-slider.ts   bindSlider(), paintSlider(), framework-free
```

The demo page is `projects/demo/src/app/components/slider/`.

## Markup

```html
<div interop-field>
  <label for="volume">Volume</label>
  <input type="range" interop-slider id="volume" min="0" max="100" value="40">
</div>
```

`itx-orientation="vertical"` stands it upright, minimum at the bottom.

```ts
bindSlider(input, { format: (v) => `$${v}`, readout: span });
```

In Angular, `InteropSlider` binds it, with `[format]` and `[readout]` inputs.

## Behavior

- **Native.** The browser handles the keyboard (arrows, Page Up/Down ±10%,
  Home, End), dragging, a click on the track (WCAG 2.5.7), form submission and
  RTL. Its role is `slider` with min, max and value.
- **Fill.** `bindSlider()` sets `--itx-slider-value`, 0 at `min` to 1 at `max`,
  on `input`, at bind, and after the form's `reset` event has run (a reset fires
  no `input`). A value set by script fires no event: call `paintSlider()`. The
  directive calls it after every render, so Angular bindings and form controls
  need nothing. Without the helper the track draws unfilled. Firefox fills it
  natively with `::-moz-range-progress`.
- **`format`** sets `aria-valuetext` and the readout's text. Use it only when the
  number alone misleads: "$200", "21 degrees".
- **`readout`** is an element the page leaves empty. The helper writes the value
  into it and sets `aria-hidden="true"`, because the slider speaks its own value.
  Do not use a live `<output>`: it is `role="status"` and repeats every step.
- **Vertical** is `writing-mode: vertical-lr` plus `direction: rtl`. Chrome then
  exposes `orientation=vertical`, and Arrow Up raises the value. No transform, no
  `aria-orientation`.

## Look

The track and thumb were chosen in the track lab (`/lab/track`), which stays in
the demo for comparing looks. The [progress bar](progress.md) draws the same
track at every size step; `styles/contrast.spec.ts` fails if their track tokens
differ.

| `itx-size` | Input height (target) | Thumb | Track |
|---|---|---|---|
| `sm` | 24px | 16px | 4px |
| none, `md` | 32px | 20px | 6px |
| `lg` | 40px | 28px | 8px |

- The input is up to 24rem wide (10rem tall when vertical).
- **Track.** The input's own track part: a recess (`neutral-100`/`950`) with a
  1px edge (`neutral-500`/`400`, 3:1 against the page), round ends, and an inset
  shade along its top (`0 1px 2px`). The edge reads `--itx-border-width`, so
  `prefers-contrast` thickens it.
- **Fill.** A background layer on the track part, in the text color, drawn to
  the border's outer edge so it covers the edge where it reaches. It ends under
  the thumb's center: `thumb / 2 + (100% - thumb) * value`. A plain percentage
  drifts by half a thumb. `:dir(rtl)` anchors it right; vertical anchors it at
  the bottom and swaps its axes. `--itx-slider-value` is registered with
  `inherits: true`, because the track part reads it from the input.
- **Thumb.** The thumb's box is the drawn disc (`neutral-50`/`200`), so it
  meets both ends of the track. Its 1px edge (`neutral-500`/`950`) is a border;
  in dark it is darker than the fill, so the disc stays apart from it. The lift
  is `filter: drop-shadow(0 1px 2px …)`. `margin-block-start` centers it on the
  track in Chrome and WebKit; Firefox centers it itself.
- **Target.** The whole input, 24, 32 or 40px tall (WCAG 2.5.8). A press
  anywhere on it moves the thumb there and drags it: in Chrome 155 a press 2px
  below the input's top edge, 14px off the track, set the value. Do not inset
  the disc in a larger thumb box to make a target: the browser moves the box
  end to end, so the disc stops short of each end by the inset (6px at the
  default size, in Chrome and WebKit).
- **Press.** While held (`:active`), the thumb scales to 1.15 over the shared
  transition duration, which reduced motion sets to 0. Not while disabled.
- Contrast, measured in `styles/contrast.spec.ts`: track edge and fill 3:1
  against the page, fill 3:1 against the recess, and the thumb's face or edge
  3:1 against the page, the recess and the fill.
- Focus is the house ring from `outline.css`, around the input's box.
- The input sets `background-color: transparent`, because Chrome fills a vertical
  range in the dark scheme.
- Forced colors (`forced-color-adjust: none`): recess `Canvas`, edge and thumb
  `CanvasText`, fill `Highlight`, no shade, no lift; `GrayText` when disabled.

Vendor pseudo-elements never share a selector list: one unknown pseudo-element
drops the whole rule. The pseudo-element goes outside `:where()`.

## Dev audit rules

| Rule | Flags |
|---|---|
| `slider-name` | No `<label for>`, `aria-label` or `aria-labelledby` |
| `slider-range` | `min` not below `max`; a step that is not positive; a `value` outside the range; a step that does not divide `max − min` |

## Tests

- `src/bind-slider.spec.ts`: fill from the value, `aria-valuetext` with and
  without `format`, the readout, form reset, `paintSlider()` after a script set,
  unbinding.
- `src/audit.spec.ts`: each rule.
- `a11y/a11y.spec.ts`: axe on three sliders, one bound, one vertical, one disabled.
- `styles/contrast.spec.ts`, `target-size.spec.ts`, `forced-colors.spec.ts`.
- Chrome 155, on the demo:
  - Arrow Right, Page Up, End and Home move the value and the fill.
  - A click on the track jumps to 23, and Reset restores 70 and its fill.
  - Vertical is `orientation=vertical`, and Arrow Up raises it.
  - RTL: Arrow Right lowers the value, and the fill starts at the right.
  - The readout is `aria-hidden`.
  - Dark, forced colors and 320px all hold, and the page checks pass.
  - After the track-lab restyle: a click on the track, Arrow Right, End and Home
    move the value and the fill; the ring shows after a key; vertical draws the
    fill from the bottom with the thumb centered on the track.
- Playwright WebKit 27.2 (not Safari): the three sizes, track, fill and thumb draw
  as in Chrome.
- Firefox: the user checked the track lab in Firefox; the library slider itself
  is not yet checked there.
- Not yet tested: speech output, including whether `aria-valuetext` on a native
  range is read (the DevTools protocol does not show it); `:active` on touch in
  iOS Safari, which may need a touch listener for the press to show.

## Not built

- Two thumbs. Revisit when Open UI's `<rangegroup>` ships.
- Ticks and stop labels. `<datalist>` ticks draw only with the native look.
- − and + buttons. When asked for, they are a custom `--step-up` / `--step-down`
  command aimed at the input; a `command` listener with `stepUp()` worked in
  Chrome 155.
- The standard `::slider-track`, `::slider-fill`, `::slider-thumb` and
  `appearance: base`, which no browser ships. They would replace the vendor rules
  and the fill layer.

## Prime

Prime's `InteropSliderRange` gave each thumb the full range, so a screen reader
heard "Minimum price, 300, 0 to 2000". It snapped crossed values back after the
browser moved them, and ignored clicks on the track. It had no forced-colors
styles, replaced the focus ring with a thumb that only changed color from hover,
and announced every step twice through a live `<output>`. Do not reintroduce the
range, the marks engine, the legend, or the registry.
