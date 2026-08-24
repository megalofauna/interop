# InteropSlider — Mental Model Card

## Files

```
src/lib/components/interop-slider/
  interop-slider.ts            input[type=range][interop-slider] — single-thumb
  interop-slider-range.ts      <interop-slider-range> — two-handle group
  interop-slider-thumb.ts      input[type=range][interop-slider-thumb="start"|"end"]
  interop-slider-value.ts      output[interop-slider-value] — <output> companion
  interop-slider-marks.ts      input[type=range][interop-slider-marks] — tick gradients
  interop-slider-legend.ts     <interop-slider-legend for> — mark labels
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
| Major ticks, minor ticks, track + fill | **one three-layer `background-image` on the host `<input>`**, front to back in that order |
| Thumb | `::-webkit-slider-thumb` / `::-moz-range-thumb` — the only thing above any of it |
| UA track pseudos | nothing. They still exist and are still sized, because WebKit centres the thumb against the track box |
| Track + fill (range) | `::before` / `::after` on `<interop-slider-range>` |
| Track (range thumbs) | nothing — the thumb inputs paint no background at all |
| Mark labels | `<interop-slider-legend>`, a sibling element — the input has no pseudo-elements to put them in |

**`background-image`'s first layer is the topmost**, so the declaration reads in
paint order. That is the whole stacking model of this component.

The track used to live on the UA track pseudo instead, and the reason is worth
keeping because it constrains any future layer: `[interop-slider-marks]` emitted
a background layer *list* whose length varied with the data — three layers for
uniform marks, one **per tick** for non-uniform — and `background-size` cycles
its values across layers, so any list mixing marks with the track gradient would
start assigning the track's 2px thickness to a tick the moment the count
changed. Two elements, one size each.

The directive now emits **exactly one layer per tick rank** either way: a
repeating gradient when the marks are uniform, one multi-stop gradient carrying
every tick when they are not. A fixed layer count is what buys the shared
per-layer size list. *If you add a mark layer, it must be a fixed one.*

What the move bought: a child box paints above its parent's background, so the
pseudo track cut a 2px slot through the middle of every tick. Deliberate and
Carbon-ish while a tick was 8px and read as a notch above and below the line —
but once the ticks grew long enough to bracket the thumb, a bright fill halving
each one stopped reading as a notch and started reading as damage.

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

## Endpoints — the scale has ONE terminus

A native `<input type="range">` reserves the thumb's **box** width at each end
so the thumb cannot overflow the control. The box is the 24px target, so the
thumb's **centre** — the thing that marks the value — travels only
`[12px, w − 12px]`. **That travel is the scale**, and every part that positions
itself along the track begins and ends there:

| | expression |
|---|---|
| `--_end-inset` | where the track and fill start and stop |
| `--_mark-size` | the band the tick gradients are painted into |
| `--_fill-stop` | where the fill's leading edge lands |
| the legend's `inset-inline-start` | where each label centres |

All four are `half-target + p × (100% − target)`. That is the whole geometry of
this component. A fifth part that positions itself with a raw percentage of the
element is wrong before it is written.

Three things had to be learned the hard way to get there, in this order:

1. **A fill expressed as a percentage of the track does not follow the thumb.**
   The fill edge sits at `p × w` and the thumb centre at `12px + p × (w − 24px)`;
   they agree only at `p = 0.5`. Divergence is `24p − 12`, reaching ±12px at the
   extremes — wider than the circle's 7px half-width, which is exactly when it
   stops hiding under the thumb. Below half the fill falls short (a sliver of
   pale track); above half it overshoots (a near-black stub past the circle).
   Same geometry both ends, but the dark stub is much louder, so the max end
   always looked worse.

   `--_fill-stop` lands the fill on the thumb's **centre**.

2. **The marks had the same bug, and did not get the same fix** until it was
   found again a round later. A tick for fraction `p` painted across the full
   box lands at `p × W`; the thumb centre lands at `12 + p × (W − 24)`. Same
   `24p − 12` divergence — ±12px at the ends — so the outer ticks missed the
   parked thumb by half the target and the whole tick row read wider than the
   control.

   The fix is **`--_mark-size`, not the gradients**. Marks are a background
   *tile* with `no-repeat`, and percentage colour-stops resolve against the
   **tile**, not the element — so sizing the tile to `calc(100% - target)` and
   letting the existing `background-position: center` offset it re-bases every
   percentage in every mark layer at once. One `background-size` for all
   layers, so the varying-layer-count constraint survives; symmetric, so RTL
   needs no rule.

   The tile carries **half a major tick of padding at each end** — the
   `+ var(--itx-slider-mark-thickness)` in `--_mark-size` — which is the room a
   tick *centred* on the first or last value needs in order not to be clipped
   by `no-repeat`. Without it the outermost ticks had to be painted flush
   *into* the band by their own layers, leaving each one a pixel inboard of the
   value it named. Invisible at 8px; not at 20px.

   The padding is also what makes the arithmetic exact rather than approximate.
   Inside a gradient `100%` is the **tile**, so `100% − mark-thickness` *is* the
   thumb's travel, and every tick position is a plain length expression off it —
   no percentages, no special case for the ends, and no way for a repeating
   pattern to bleed a spurious tick into the gutter however short its period
   gets. That last hazard is why the earlier full-width-tile approach was
   rejected.

3. **Fixing the ticks left the TRACK as the only part still in the old space.**
   `--_end-inset` was `(target − thumb-size) / 2` = 5px, chosen back when the
   ticks were also in full-box space so the track would begin "exactly where
   the resting circle's outer edge begins". With the ticks at 12px, that left a
   7px stub of track and fill living outside the outer ticks at every value
   between the extremes — measurable as `trackRow` reporting ink at x=5 while
   `bandRow` reported x=12.

   `--_end-inset` is now `target / 2`, on the single slider **and** on
   `interop-slider-range`. Note what that removes: the old expression read
   `--itx-slider-thumb-size` and carried a warning to read the *public* token
   rather than the `--_thumb-size` slot, because hover and focus grow that slot
   and the track's ends must not move. The dependency is gone, so the trap is
   gone with it — by construction, not by anyone remembering.

### What is left, and cannot be removed

At the extremes the painted circle overhangs the scale by its own radius,
symmetrically. **It has to.** The handle marks its value with its *centre*, so
parked on an endpoint it necessarily reaches `thumb-size / 2` beyond it. Every
control that centres a round handle does this, Carbon included. There is no
token value that removes it — shrinking the thumb only shrinks the overhang in
proportion.

What *is* controllable is whether anything else is out there for the eye to
misread, and whether the endpoint is marked at all. Hence the two decisions
above: nothing but the circle now lives past the outer tick, and
`--itx-slider-mark-length` is **longer than the resting circle is wide** (20px
against 14px) so the endpoint tick clears it top and bottom. The thumb reads as
sitting *on* the end marker rather than past it. 20px is also
`--itx-slider-thumb-size-active`, so on hover the circle grows to exactly meet
the tick — the bracket closes rather than disappearing.

Both decisions were made against rendered candidates at 6× zoom, not from
prose. 16px was rejected as too subtle (1px of clearance); 24px read heavy.

This is why the fill must be a number: the mapping is
`half-target + (100% - target) × fill`, and `calc()` can multiply a
length-percentage by a number but cannot divide by a percentage. As a
percentage there is no expression that gets there.

## The legend is a sibling, never a wrapper

`<interop-slider-legend for="quality">` renders the `label` on each
`{ value, label }` mark, centred on its tick. It exists because the input has
no pseudo-elements and nothing here is wrapped — but a label row does not need
to *contain* the control, so it does not.

It resolves through `InteropSliderRegistry` by `[for]`, the same mechanism
`<output interop-slider-value for>` already used. Marks travel through a second
map on that registry rather than through `InteropSliderApi`: they are a
*companion directive's* data, and a slider with no `[interop-slider-marks]`
should not have to pretend it has an empty list of them. `[interop-slider-marks]`
publishes the resolved list — value, label, and fraction of the domain — so the
tick and its label come out of one normalisation.

`aria-hidden="true"` on the host, always. The legend restates what the slider
already announces; give the slider a `[valueText]` to put the same vocabulary
in the accessibility tree, which also feeds `<output interop-slider-value>`.

Two things it deliberately does not do. It does not clamp the outer labels back
inside the box — a label wider than the thumb target, centred on a tick that
sits `target / 2` in from the edge, overflows, and nudging it would break the
one thing the component promises. And it does not take an `[orientation]`; it
reads the slider's, which is why `orientation` is on `InteropSliderApi` and not
just on the two implementations.

One footgun, found by measuring rather than by looking. A **vertical** legend
spans `--itx-slider-length`, and the theme declares every `--itx-slider-*`
token *on the host elements* — so setting the token on a shared ancestor is
**shadowed, not inherited**, and the legend silently keeps the 8rem default
while the track runs longer. Set it on both the input and the legend. This is
a property of the theme's selector shape, not of the legend; it applies to any
`--itx-slider-*` token a consumer tries to set from above.

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
- **No size axis.** Carbon's slider SCSS ships none, and the only step below the
  current one would put the thumb target under 24px.
- **Major and minor ticks share one length.** Both read
  `--itx-slider-mark-length`, so they differ only in thickness (2px vs 1px) and
  by one contrast rank. This is no longer a structural limit — the layer count
  is fixed and `background-size` is already a per-layer list, so giving the
  minors their own `--_mark-minor-size` slot is a two-line change. It simply
  has not been asked for.
