# Slider — Research Review

Review of Prime's `InteropSlider`, `InteropSliderRange`, `InteropSliderThumb`,
`InteropSliderValue`, `InteropSliderMarks` and `InteropSliderLegend` in
`projects/interop_deprecated/src/lib/components/interop-slider/`, run against
[new-component-research.md](new-component-research.md).

## Decision

Retire Prime's slider code. Rebuild it as styles on the native input, plus one
small helper:

- `input[type="range"][interop-slider]` is CSS on the native element. The browser
  provides the keyboard, pointer, track click, form submission, RTL and the
  accessibility mapping.
- `itx-orientation="vertical"` is three declarations: `writing-mode: vertical-lr`
  and `direction: rtl`. Chrome then exposes `orientation=vertical`, and Arrow Up
  raises the value.
- `bindSlider()` writes the fill position on `input` and after a form reset, and
  an optional `aria-valuetext` from a formatter.
- The focus ring is the house ring from `outline.css`, drawn around the 24px input.
- There is no two-thumb slider. A range of two values is two labeled number
  inputs in a fieldset.
- There are no marks and no legend. A slider with a few named stops is a radio
  group.

The rebuild needs about 60 lines of TS and 150 of CSS. Prime has 1,442 lines of
TS and 976 of CSS.

```html
<label for="volume">Volume</label>
<input type="range" interop-slider id="volume" min="0" max="100" value="40">
```

| Prime use | Really | Interop |
|---|---|---|
| Basic, Brightness, Disabled | One approximate value | `input[interop-slider]` |
| Currency "Budget" | One value shown with a unit | `input[interop-slider]` with a `format` that sets `aria-valuetext` |
| Shirt size, 5 named steps | One choice from five named options | `fieldset[interop-radio-group="segmented"]` |
| Quality, 21 steps, marks and legend | One value with labeled stops | `input[interop-slider]` with visible min and max labels; a `<select>` if the stops matter |
| Price range, two thumbs | A minimum and a maximum | Two `input[type=number][interop-input]` in a `fieldset`, labeled Minimum and Maximum |
| Vertical temperature | One value with a unit | `input[interop-slider][itx-orientation="vertical"]` with `aria-valuetext` |
| Form demo | Native submission | Unchanged |
| Typography "leading" dial (Prime demo) | A native range already | `input[interop-slider]`; its `<output>` stops announcing |

| Question | Decision |
|---|---|
| Does Prime's slider do what it claims? | One thumb: yes, because it is the native input. The range does not. It claims "the full APG model", but each thumb announces the whole range, and the crossing rule is enforced by snapping the value back after the browser moves it |
| Is it the thing its name says? | One thumb is a native slider. The range fails APG Multi-Thumb: it does not narrow each thumb's minimum and maximum, a click on the track does nothing, and two thumbs at one end block the pointer |
| What is each use, really? | One approximate value, a choice among named options, and a minimum and maximum. See the table above |
| What does the platform do now? | Chrome 155 has no standard `::slider-*` pseudo-elements and no `appearance: base` for range. Vertical, the keyboard, the track click and RTL are native. `<datalist>` ticks render only with the native look. See §3 |
| What has to exist first? | The focus ring, the field and number input, the radio group and the dev audit exist. New: the slider CSS, `bindSlider()` and its directive |
| Can an invoker replace script? | Not for the fill. A custom `--step-up` command works for − and + buttons if they are wanted. See §5 |
| Accessibility | Eight misses, three high. See §1 |
| Complexity | 1,442 lines of TS. About 30 are load-bearing: the fill value and `aria-valuetext`. The marks engine is 346 lines and the legend 144 |
| What carries over | The gradient fill on the host, the 24px thumb target separate from the drawn circle, the vendor-selector rules, and five audit rules. See §6 |

## 0. Names

| Name | Used by |
|---|---|
| range (input type) | HTML `<input type="range">`; USWDS "Range slider" (one thumb) |
| slider | WAI-ARIA, APG, Apple HIG, Material, Fluent, Carbon, Spectrum, React Aria, Radix, Base UI, Ark, Angular Material, Web Awesome |
| range slider | Carbon and Spectrum for two thumbs; USWDS for one |
| multi-thumb slider | APG |
| rangegroup | Open UI proposal for several native range inputs in a group |

The pick is **slider**, which ARIA and every library use. "Range" means the
input type to some and two thumbs to others, so Interop does not use it as a
component name.

## 1. Prime

The TS has 1,442 lines in 9 files: marks 346, slider 269, range 230, thumb 196,
legend 144, the marks spec 156, value 90, token 92 and registry 67. Without
comments it is 795 lines. The CSS has 976 lines: 801 of structure (184 of them a
header comment) and 175 of theme. The only spec covers mark normalization and
the legend.

The design came from Carbon borrow round 13. `9ad1747f` ("one geometry for the
whole scale") moved ticks, track, fill and legend onto the thumb's travel, and
added the legend. `11900a51` merged three sheets into one global pair.

### What held

- **Native first.** The single slider is the native input. Prime reached for
  `aria-valuetext` only when the number alone misleads
  (`interop-slider.ts:134-146`).
- **Fill as a background on the host.** One gradient is drawn by the input
  itself, driven by one registered `<number>` custom property
  (`slider.css:203-207, 331-340`). It is the fill that works in every engine.
- **The travel mapping.** `calc(target / 2 + (100% - target) * p)` keeps the fill
  edge under the thumb center. A plain percentage drifts by up to 12px
  (`9ad1747f`).
- **A target separate from the drawn thumb.** A transparent border with
  `background-clip: content-box` keeps the thumb's box at 24px while the circle
  is 14px (`slider.css:478-485`).
- **Selector lessons.**
  - Vendor pseudo-elements never share a selector list: one unknown
    pseudo-element drops the whole rule.
  - `:where(…)::-webkit-slider-thumb` reaches the UA part with the
    pseudo-element outside `:where()`.
- **Naming checks.** The range's group and each thumb need their own name, and
  the dev warnings check it.

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | Range thumbs keep the full `min` and `max` (`interop-slider-thumb.ts:135-136`), so a screen reader hears "Minimum price, 300, 0 to 2000". The minimum can pass the maximum for one frame before snapping back (`interop-slider-range.ts:152-172`) | 4.1.2 | High |
| 2 | The range's thumbs have `pointer-events: none` on the track (`slider.css:565`), so a click on the track does nothing. Keyboard does not satisfy 2.5.7 | 2.5.7 | High |
| 3 | No forced-colors block. The track, fill and ticks are a `background-image`, which forced colors remove. Only the thumb's edge remains | 1.4.11 | High |
| 4 | `outline: none` on bare `:focus` (`slider.css:366-371`). Focus recolors the thumb and grows it to 20px, which hover also does, so focus differs from hover by color alone. The comment cites 2.4.11, which is Focus Not Obscured | 2.4.7 | Medium |
| 5 | `<output>` has the implicit role `status`. Every step of a drag is announced twice: once by the slider and once by the output | 4.1.3 | Medium |
| 6 | Two thumbs at one value share one 24px box | 2.5.8 | Medium |
| 7 | The unfilled track uses `--itx-role-background-control`, rated about 1.5:1 in `11900a51` | 1.4.11 | Medium (not measured) |
| 8 | The demo's price range has a `<label>` with no `for`. The vertical example has no visible label and no unit in its value text | 1.3.1, 2.5.3 | Low |

### Bugs

1. **The model keeps a value the input refused.** Native `value=150` with
   `max=100` becomes 100; `value=7` with `step=5` becomes 5. Prime's `value()`
   keeps 150 or 7, and `<output>` shows 150 while the thumb sits at 100.
2. **Form reset.** A reset returns the input to its default and fires no `input`
   or `change` event. Verified in Chrome 155: the value is back only after the
   `reset` event has run. The model, output and fill keep the old value.
3. **Both thumbs at the maximum.** The thumb on top cannot move down past the
   other, and the other is underneath, so the pointer cannot move either.
   Reasoned from the code; not driven in a browser.
4. **Marks on a range are invisible.** The thumbs paint no background.
5. **A token set on an ancestor is ignored.** The theme declares every
   `--itx-slider-*` token on the input itself, so a consumer has to set
   `--itx-slider-length` on the input and the legend.
6. **Readouts lose their slider.** On first render every
   `<output interop-slider-value>` warns that no slider has its id, because it
   looks the slider up before the slider registers. Seen on Prime's demo page in
   Chrome 155.
7. **CSS-only use collapses the thumb.** The tokens exist only under
   `[interop-root]`, so `--_target` is undefined without it.

**Test coverage.** One spec, 11 cases, on marks and the legend. Nothing tests
value sync, clamping, reset, the range, `aria-valuetext`, vertical or forced
colors.

## 2. Evidence

**When a slider is right.**

- **Baymard:** numeric filter sliders, price included, need text fields beside
  them. Users who struggled with the slider switched to the fields
  (https://baymard.com/blog/slider-interfaces).
- **Carbon:** pairs every slider with number inputs. It rules sliders out for
  very large ranges, ranges of two or three values, non-numeric values and dates
  (https://carbondesignsystem.com/components/slider/usage/).
- **USWDS:** use a slider when the range matters more than precision
  (https://designsystem.digital.gov/components/range-slider/).
- **NN/g:** a precise value is hard to set with a slider. The full article was
  not retrieved.

**APG and the platform.**

- APG Multi-Thumb: each thumb is its own slider. The minimum thumb's maximum is
  the other's value, and the other way round
  (https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/).
- APG warns that touch screen readers may not operate custom sliders. A native
  range uses the platform's adjust gesture.
- WCAG 2.5.7: a click anywhere on the track counts as the single-pointer
  alternative. The keyboard does not
  (https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).
- `<output>` is `role="status"`, so updating it on every `input` makes screen
  readers repeat the value
  (https://scottohara.me/blog/2019/07/10/the-output-element.html).

**Platform futures.**

- **CSS Forms** names `::slider-track`, `::slider-fill` and `::slider-thumb`,
  enabled by `appearance: base` (https://drafts.csswg.org/css-forms-1/).
  - WebKit has a bug open for them, with different names
    (https://bugs.webkit.org/show_bug.cgi?id=305881).
  - Chrome has no intent to ship.
- **Open UI `<rangegroup>`** groups native range inputs, with a Chromium
  prototype. Orientation, keyboard and naming are still open
  (https://open-ui.org/components/enhanced-range-input.explainer/).
- **A scroll-driven CSS fill** (a `view-timeline` on the thumb) works in Chrome
  and Safari 26, and needs a polyfill in Firefox
  (https://css-tip.com/value-input/). It depends on `::-webkit-slider-thumb`, so
  Interop does not use it.

## 3. The platform, checked in Chrome 155

| Feature | Result |
|---|---|
| `::slider-track`, `::slider-thumb`, `::slider-fill` | Not supported (the selectors throw) |
| `appearance: base` | Not supported. `base-select` is |
| `accent-color` | Supported. It recolors the native thumb and fill |
| Keyboard on a native range, step 5 | Arrow Right and Arrow Up +5. Page Up and Page Down ±10. End 100, Home 0 |
| RTL | Arrow Right lowers the value |
| `writing-mode: vertical-lr; direction: rtl` | `orientation=vertical`. Arrow Up raises the value, the minimum is at the bottom. No transform, no `aria-orientation` |
| Click on the track | The thumb jumps to the click: 76 at 76%, with the native look and with `appearance: none` |
| `<datalist>` ticks | Drawn with the native look, and gone with `appearance: none` |
| `<output for>` | `status live=polite atomic` |
| Form reset | No `input` or `change` event. The value is back after the `reset` event has run |
| Custom `command="--step-up"` aimed at the input | A `command` listener with `stepUp()` moved 50 → 60 → 70 on Enter and Space |
| `aria-valuetext` on a native range | Not settled. DevTools reports `valuetext` as the number for both a native range and an ARIA `role="slider"` div that set it, so the protocol does not show it |

Other browsers (sources, not checked here):

- Vertical `writing-mode` on range: Chrome 124, Firefox 120, Safari 16.5.
- `<datalist>` ticks: Firefox 109.
- WebKit has a layout test for `aria-valuetext` on a native slider.

## 4. Prerequisites in Interop

| Piece | Status |
|---|---|
| Focus ring (`outline.css`) | Exists |
| Field, label and number input | Exists |
| Segmented radio group, for named steps | Exists |
| `itx-orientation` axis | Exists, on segmented and page nav |
| Dev audit | Exists; needs slider rules |
| Slider CSS: track, fill, thumb, vertical, forced colors | New |
| `bindSlider()`: fill on `input` and after a reset, optional `aria-valuetext` | New, about 40 lines |
| `InteropSlider` directive | New, a few lines |

## 5. Invokers

| Job | Invoker? |
|---|---|
| − and + buttons beside a slider | A custom `--step-up` / `--step-down` aimed at the input works today, with one `command` listener. A built-in `step-up` is only proposed, for number inputs |
| Fill | No. It follows `input` events |
| Keyboard, drag, track click | Native already |
| Two thumbs | No |

## 6. What carries over

1. **The fill** as a host background gradient, from one registered `<number>`
   property, using the travel mapping.
2. **The thumb target:** a 24px box with a transparent border and
   `background-clip: content-box` around a smaller circle.
3. **Selector rules:** one rule per vendor pseudo-element, and the pseudo-element
   outside `:where()`.
4. **Logical properties** for the axis, so vertical is `writing-mode` plus
   `direction`.
5. **Audit rules**, from Prime's dev warnings:
   - no accessible name;
   - `min` not below `max`;
   - `step` not positive;
   - a value outside the range;
   - a step that does not divide the range.
6. **`aria-valuetext` guidance:** set it only when the number alone misleads
   ("$40", "72 degrees", "Monday").

Dropped:

- `<interop-slider-range>` and its thumbs;
- the marks engine and the legend;
- the registry and the DI tokens;
- `model()` sync, since Angular forms work with the native input;
- the `scaleY(-1)` vertical transform and the hand-set `aria-orientation`;
- `<output>` as a live readout;
- the focus treatment that replaced the ring.

## Questions for you

1. **Look.** Recommendation: a custom look with `appearance: none`:
   - a 4px track at 3:1 against the page;
   - a filled extent in the text color;
   - a 16px circle in a 24px target;
   - the house focus ring around the input.

   The alternative is the native look with `accent-color` only. That needs no
   script, keeps `<datalist>` ticks and the browser's forced colors, but leaves
   the thumb, the track and their contrast to each browser.
2. **Fill without script.** Recommendation: the fill comes from `bindSlider()`.
   Without it the track draws unfilled, and the thumb still shows the value.
   Firefox's `::-moz-range-progress` fills there without script.
3. **Two values.** Recommendation: no two-thumb slider. Show two labeled number
   inputs, Minimum and Maximum, in a fieldset, as Baymard and Carbon advise.
   Revisit when `<rangegroup>` ships.
4. **The value readout.** Recommendation: a visible readout is the page's own
   text, written by `bindSlider()` into an element the author leaves empty, and
   marked `aria-hidden="true"`. The slider speaks its own value, and
   `aria-valuetext` carries the unit.
5. **Ticks and labels.** Recommendation: none in v1. Show the minimum and maximum
   as text at the ends. A slider with a few named stops is a radio group.
6. **− and + buttons.** Recommendation: not in v1. Add them as a custom
   `--step-up` / `--step-down` command when a consumer asks.
7. **Size steps.** Recommendation: one size. The thumb target is 24px, and a
   smaller step would break 2.5.8.

## Unverified

- Screen reader speech: `aria-valuetext` on a native range in NVDA, JAWS,
  VoiceOver and TalkBack, and the double announcement from `<output>`.
- Firefox and Safari: the track click, vertical, and the scroll-driven fill.
- Bug 3 (both thumbs at the maximum) is read from the code. Prime's demo runs
  again (`npm run demo:prime`, port 1338), but the probe has no drag.
- The contrast of Prime's track and of its focus state.
