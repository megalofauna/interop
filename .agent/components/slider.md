# InteropSlider — Mental Model Card

## Files

```
src/lib/components/interop-slider/
  interop-slider.ts            input[type=range][interop-slider] — single-thumb
  interop-slider-range.ts      <interop-slider-range> — two-handle group
  interop-slider-thumb.ts      input[type=range][interop-slider-thumb="start"|"end"]
  interop-slider-value.ts      output[interop-slider-value] — <output> companion
  interop-slider-marks.ts      input[type=range][interop-slider-marks] — tick gradients
  interop-slider-registry.ts   id → slider lookup, so <output for> can find its input
  interop-slider.token.ts      InteropSliderApi / InteropSliderRangeApi + DI tokens
  public-api.ts                barrel
projects/demo/src/app/pages/slider/     demo page

src/lib/styles/components/slider.css                  structure — all three hosts
src/lib/styles/themes/protocol/components/slider.css  values — one token surface
```

> **All three hosts share ONE pair of files.** The single slider, the range
> thumbs and the range parent are one visual object — a range slider is a
> single slider's track with two handles on it — so a second set of values
> would be a second source of truth for the same shape. Both files are imported
> globally (`interop.css` / `protocol.css`), so a CSS-only consumer gets the
> full slider.

## DOM structure

Nothing is wrapped. Every visible part is either the native `<input>` itself or
one of its UA pseudo-elements:

```html
<!-- single thumb -->
<label for="brightness">Brightness</label>
<input type="range" interop-slider id="brightness" [(value)]="brightness" />
<output interop-slider-value for="brightness"></output>

<!-- two handles -->
<interop-slider-range [(value)]="range" aria-label="Price range">
	<input type="range" interop-slider-thumb="start" id="p-min" aria-label="Minimum" />
	<input type="range" interop-slider-thumb="end"   id="p-max" aria-label="Maximum" />
</interop-slider-range>
```

The directive decorates; it never replaces. Keyboard (full APG model), drag,
touch, RTL and form participation all come from the browser. `<output for>` is a
real native association, not an ARIA imitation.

**`<input>` generates no `::before` / `::after`.** That is the single most
important structural fact about this component: any part that is not the host,
the UA track pseudo, or the UA thumb pseudo does not exist and cannot be made to
exist without adding a wrapper element. It is why the track cannot be rounded,
why marks are painted as background layers, and why the range parent — a real
element — is the only shape here that gets pseudo-elements.

## Painting model

| Surface | Drawn by |
|---|---|
| Tick marks | the host `<input>`'s own `background-image` |
| Track + fill (single) | `::-webkit-slider-runnable-track` / `::-moz-range-track`, one gradient |
| Thumb | `::-webkit-slider-thumb` / `::-moz-range-thumb` |
| Track + fill (range) | `::before` / `::after` on `<interop-slider-range>` |
| Track (range thumbs) | nothing — the thumb inputs paint no background at all |

Marks and track deliberately live on **different elements**. `[interop-slider-marks]`
emits a background layer *list* whose length varies with the data (three layers
for uniform marks, one per tick for non-uniform), and `background-size` cycles
its values across layers — so any list mixing marks with the track gradient
would start assigning the track's thickness to a tick the moment the count
changed. One element per fixed layer-count is the fix.

Side-effect, and a good one: the host's background paints *behind* the track
pseudo, so a tick reads above and below the 2px track rather than through it —
which is where Carbon puts its own notch.

## The axis rule

**Everything cross-axis is a logical property.** `block-size` for track
thickness, `inline-size` for length, `margin-block` to re-centre the thumb.
`writing-mode: vertical-lr` then re-maps all of it for free, and vertical
orientation collapses to three declarations plus a `background-size` flip:

```css
:host([data-orientation="vertical"]) {
	writing-mode: vertical-lr;
	transform: scaleY(-1);          /* minimum at the BOTTOM */
	inline-size: var(--itx-slider-length, 8rem);
	--itx-slider-axis: to bottom;   /* pre-flip; renders bottom-up */
	--_mark-size: var(--itx-slider-mark-length, 0.5rem) 100%;
}
```

`--itx-slider-axis` is published rather than private because
`[interop-slider-marks]` builds its gradients from it too — one token, so a tick
can never disagree with the fill about which way "along the track" is.

This is the round-5 progress lesson applied a second time. The pre-borrow file
sized the track with `height` — a physical property — on a pseudo-element that
inherits `writing-mode: vertical-lr`, where `height` is the track's *length*.
A vertical slider therefore drew a 6px-long stub, and Firefox never got the
gradient-direction patch that WebKit had. **When a visual pass keeps needing
per-case rules to stay correct, the mechanism is wrong, not the values.**

`background-size` is the one property with no logical form. It is the entire
remaining physical-axis surface in the file.

## The thumb: 14px visual, 24px target

Carbon's handle is 14px, growing to 20px on hover / focus / active. 14px is
**below** WCAG 2.2 SC 2.5.8's 24×24 CSS px floor, so the painted circle and the
hit target are separated:

```css
box-sizing: border-box;
inline-size: var(--_target);                                   /* always 24px */
block-size: var(--_target);
border: calc((var(--_target) - var(--_thumb-size)) / 2) solid transparent;
border-radius: var(--_thumb-radius);
background-color: var(--_thumb-color);
background-clip: content-box;                                  /* paints 14px  */
```

Growing the thumb is therefore a **border-width** change, not Carbon's
`transform: scale(1.4286)`. A transform scales the hit target too, so the target
would breathe between 24 and 34px as the pointer crossed it; the border trick
keeps the box fixed at 24px in every state, and `background-clip` keeps the
corner radii proportional so a round thumb stays round at any size.

`box-sizing: border-box` is load-bearing. Without it the border is *added* to
24px rather than taken out of it.

**Never take `--itx-slider-thumb-target` below `1.5rem`.** It is the control's
thickness as well as the target, so it also sets the host's `block-size`.

## Token surface

Full list with defaults lives in `themes/protocol/components/slider.css` and in
the demo page's `id="tokens"` section. The shape worth remembering:

| Token | Default | Note |
|---|---|---|
| `--itx-slider-track-color` | `--itx-contrast-2` | rank 2, "hairline / dividers" — Carbon `$border-subtle` |
| `--itx-slider-track-thickness` | `--itx-spacing-0_5` (2px) | Carbon's SCSS, not the 4px in their style.mdx |
| `--itx-slider-fill-color` | `--itx-contrast-6` | Carbon `$layer-selected-inverse` — the strongest neutral, NOT the brand hue |
| `--itx-slider-thumb-size` | `--itx-spacing-3_5` (14px) | painted circle |
| `--itx-slider-thumb-size-active` | `--itx-spacing-5` (20px) | hover / focus |
| `--itx-slider-thumb-target` | `--itx-spacing-6` (24px) | hit target AND control thickness |
| `--itx-slider-focus-color` | falls through to `--itx-focus-color` | thumb *and* fill turn this on focus; no ring |
| `--itx-slider-disabled-color` | `--itx-contrast-2` | painted, not faded |
| `--itx-slider-duration` / `-easing` | `--itx-duration-fast` / `--itx-easing-standard` | Carbon's 110ms + productive-standard, on the house tokens |
| `--itx-slider-max-length` | `40rem` | Carbon's 640px cap |

Set by the component, never by consumers: `--itx-slider-fill`,
`--itx-slider-range-start` / `-range-end`, `--itx-slider-axis`,
`--itx-slider-marks-image` / `-marks-minor-image`.

`--itx-slider-fill` and the two range positions are registered with `@property`
as `<number>` — 0–1 fractions, **not** percentages. They are deliberately not
transitioned (a slider whose paint lags its thumb reads as broken), but the
registration means a malformed value falls back to the initial number instead
of going invalid at computed-value time and dropping the whole gradient.

The number typing is load-bearing, not cosmetic. See "Endpoints" below.

## Endpoints — the thumb, the track and the fill all have to agree

A native `<input type="range">` reserves the thumb's **box** width at each end
so the thumb cannot overflow the control. Our box is the 24px target while the
paint is a 14px circle centred in it, so the visible circle stops
`(24 − 14) / 2` = 5px short of each end. That produces two separate artefacts:

1. **The circle never reaches the track's ends.** The track is therefore
   painted transparent for `--_end-inset` at each end, so it begins exactly
   where the resting circle's outer edge begins.
2. **A fill expressed as a percentage of the track does not follow the thumb.**
   The fill edge sits at `p × w` and the thumb centre at `12px + p × (w − 24px)`;
   they agree only at `p = 0.5`. Divergence is `24p − 12`, reaching ±12px at the
   extremes — wider than the circle's 7px half-width, which is exactly when it
   stops hiding under the thumb. Below half the fill falls short (a sliver of
   pale track); above half it overshoots (a near-black stub past the circle).
   Same geometry both ends, but the dark stub is much louder, so the max end
   always looked worse.

`--_fill-stop` lands the fill on the thumb's **centre**, which puts the residue
under the circle at both extremes. Both corrections are pure geometry off
`--_target` and the resting thumb size, so they hold at any token values, and
both are computed along `--itx-slider-axis`, so they are already correct when
vertical.

This is why the fill must be a number: the mapping is
`half-target + (100% - target) × fill`, and `calc()` can multiply a
length-percentage by a number but cannot divide by a percentage. As a
percentage there is no expression that gets there.

## Focus, without an outline

Focus changes three things at once: the thumb turns `--itx-colorway`, the circle
grows 14→20px, and the **filled track** turns `--itx-colorway` too (Carbon does
the same, via `.slider__thumb:focus ~ .slider__filled-track`). No ring — an
outline would have to clear the 24px box to avoid overlapping a 14px circle, and
would read as detached. Carbon's inset ring pair was declined for the same
reason: inset shadows measure from the border box, which for us is the target,
not the circle.

## Orientation is shared, not per-thumb

`InteropSliderThumb.orientation` reads `parent.orientation()`. It used to be
hard-coded `"horizontal"`, so `<interop-slider-range [orientation]="'vertical'">`
reoriented its track and left both handles running the other way. If you add
another per-thumb property, check whether it is really the group's.

The range parent takes no `writing-mode` — its children position themselves
absolutely and it draws the bars itself. Its vertical fill is anchored from
`inset-block-end`, matching the thumbs' minimum-at-the-bottom flip.

## Vendor pseudo-elements never share a selector list

```css
/* WRONG — applies in NEITHER engine */
:host::-webkit-slider-runnable-track,
:host::-moz-range-track { … }
```

An unrecognised pseudo-element invalidates the entire selector list it appears
in. Every `::-webkit-` / `::-moz-` pair in these files is duplicated on purpose.

## The `:where()` + UA pseudo-element shape

`:host` is gone; every rule is a `:where()` list of the two input hosts (or
`interop-slider-range`), with the pseudo-element OUTSIDE the wrapper:

```css
:where(
	input[type="range"][interop-slider],
	input[type="range"][interop-slider-thumb]
)::-webkit-slider-runnable-track { … }
```

That combination is not obvious enough to assume — it was verified in
ChromeHeadless against a plain-selector control, and the layered zero-specificity
rule reaches the UA pseudo identically. Inside `:where()` the rule would be
silently dropped, which is the standard pseudo-element trap.

The private `--_` slots survive the migration deliberately: the states have to
reach the UA pseudo-elements, which inherit custom properties from the host but
would otherwise need a `::-webkit-` and a `::-moz-` rule each, per state.

## Known gaps

- **Marks on a range slider are invisible** — a thumb inside
  `<interop-slider-range>` paints no background, because the parent owns the
  track. Documented on the directive.
- **Mark labels are not rendered.** `SliderMark` accepts `{ value, label }`, and
  the label is ignored; supply your own label row.
- **No size axis.** Carbon's slider SCSS ships none, and the only step below the
  current one would put the thumb target under 24px.
