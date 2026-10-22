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
  interop-slider.structure.css   layers, thumb, vertical, forced colors; names list at the top
  interop-slider.base.css        token values
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

- The input is 24px tall, and up to 24rem wide (10rem tall when vertical).
- It draws the track and fill as two background layers: front to back, the fill,
  then the track, 4px thick. The fill ends under the thumb's center:
  `target / 2 + (100% - target) * value`. A plain percentage drifts up to 12px.
- The layers are physical, so `:dir(rtl)` moves them right, and the vertical
  rule swaps their axes and anchors them at the bottom.
- The thumb's box is the 24px target. A transparent border with
  `background-clip: content-box` draws a 16px circle inside it.
- Track `neutral-500`/`400`, fill and thumb in the text color. All three are 3:1
  against the page in both schemes; `styles/contrast.spec.ts` measures them.
- Focus is the house ring from `outline.css`, around the input's box.
- The input sets `background-color: transparent`, because Chrome fills a vertical
  range in the dark scheme.
- Forced colors keep the layers (`forced-color-adjust: none`) in system colors:
  track and thumb `CanvasText`, fill `Highlight`, `GrayText` when disabled.
- One size: a smaller step would put the target under 24px (WCAG 2.5.8).

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
- Not yet tested: speech output, including whether `aria-valuetext` on a native
  range is read (the DevTools protocol does not show it), and Firefox and Safari.

## Not built

- Two thumbs. Revisit when Open UI's `<rangegroup>` ships.
- Ticks and stop labels. `<datalist>` ticks draw only with the native look.
- − and + buttons. When asked for, they are a custom `--step-up` / `--step-down`
  command aimed at the input; a `command` listener with `stepUp()` worked in
  Chrome 155.
- Size steps.
- The standard `::slider-track`, `::slider-fill`, `::slider-thumb` and
  `appearance: base`, which no browser ships. They would replace the vendor rules
  and the background layers.

## Prime

Prime's `InteropSliderRange` gave each thumb the full range, so a screen reader
heard "Minimum price, 300, 0 to 2000". It snapped crossed values back after the
browser moved them, and ignored clicks on the track. It had no forced-colors
styles, replaced the focus ring with a thumb that only changed color from hover,
and announced every step twice through a live `<output>`. Do not reintroduce the
range, the marks engine, the legend, or the registry.
