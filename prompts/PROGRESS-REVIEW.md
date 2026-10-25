# Progress — Research Review

Review of Prime's `InteropProgress`, `InteropProgressLabel` and
`InteropProgressStatus` in
`projects/interop_deprecated/src/lib/components/interop-progress/`, run against
[new-component-research.md](new-component-research.md).

## Decision

Retire Prime's progress code. Rebuild it as styles on the native element, with
no script:

- `progress[interop-progress]` is CSS only. The browser draws the fill from
  `value` and `max` through `::-webkit-progress-value` and `::-moz-progress-bar`,
  exposes `progressbar` with the right range, and matches `:indeterminate` when
  `value` is absent.
- The name comes from `<label for>`, a wrapping `<label>`, `aria-labelledby` or
  `aria-label`. `<progress>` is a labelable element.
- A milestone (done, failed) is spoken with `announce()` from `interop`. The bar
  stays silent between milestones.
- Indeterminate draws Prime's hard-edged band, moved by gradient stop positions
  along the fill axis. Forced colors keep it with `forced-color-adjust: none`
  and system colors, the way the slider does.
- There is no `min`. A range that does not start at 0 is `value - min` over
  `max - min`, done by the caller, with `aria-valuetext` for the words.

The rebuild needs about 90 lines of CSS, no TS, and two audit rules. Prime has
304 lines of TS and 289 of CSS.

```html
<label for="upload">Uploading report.pdf</label>
<progress interop-progress id="upload" value="42" max="100"></progress>
```

| Prime use | Really | Interop |
|---|---|---|
| Firmware upload, Sync data | Determinate task progress | `progress[interop-progress]` |
| Connecting to relay | Indeterminate task progress | `progress[interop-progress]` with no `value`, `aria-busy` on the region it loads |
| Account setup (step 1 of 7) | A step indicator | `ol[interop-steps]` |
| Fuel reserve, Coolant flow, "Storage used" | A gauge | `<meter>` (see question 2) |
| `<interop-progress-status>` | A hidden live region | `announce()`, plus visible text where sighted users need it |
| `[interop-progress-label]` | `aria-labelledby` wired by script | `<label for>` |

| Question | Decision |
|---|---|
| What Prime claims, and does it? | A semantic bar on native `<progress>` with ARIA values, indeterminate and min ≠ 0. It works in Chrome, but restates in ARIA what the element already exposes, and disappears in forced colors. |
| Is it the thing its name says? | The element is. The wrapper adds a redundant `role="progressbar"` and an `aria-valuemax` that ARIA in HTML says not to use. Half its demo uses are gauges or steps. |
| Each use, really | See the table above: two progress bars, one indeterminate bar, one step indicator, three gauges. |
| The platform now | Native fill, labels, `:indeterminate`, vertical and RTL all work in Chrome 155 and Playwright WebKit 27.2 with no script. |
| Prerequisites | `announce()` and `outline.css` exist. Nothing new is needed. |
| Invokers | No. A progress bar has no activation. A Cancel button beside it can use `command="close"` on its dialog. |
| Accessibility | Prime fails forced colors (invisible), its dark fill measures below 3:1 by calculation, and its label directive replaces a native label. |
| Complexity | 304 lines of TS, of which about 3 are load-bearing: the rest mirror native attributes, rewire a label, or are dev warnings. |
| What carries over | The stop-position sweep, the reduced-motion park, `aria-valuetext` guidance, silence between milestones, the audit checks. |

## 0. Names

| Name | Used by |
|---|---|
| progress / progressbar | HTML `<progress>`, ARIA `progressbar`, Base UI Progress, Radix Progress, Ark Progress |
| Progress bar | Carbon ProgressBar, Fluent ProgressBar, Spectrum and React Aria ProgressBar, Web Awesome `wa-progress-bar`, Angular Material `mat-progress-bar` |
| Progress indicator | Apple HIG (bars and spinners), Material 3 (linear and circular). Carbon's "Progress indicator" is a step tracker |
| Meter / gauge | HTML `<meter>`, ARIA `meter`, Spectrum and React Aria Meter, Base UI Meter, SwiftUI `Gauge` |
| Spinner / loading | Fluent Spinner, Carbon Loading and InlineLoading, Web Awesome `wa-spinner`, `mat-progress-spinner` |

GOV.UK and USWDS ship no progress bar; their nearest pieces are a task list
and a step indicator.

The pick is **progress**: the element's name, the attribute
`interop-progress`. Also known as: progress bar, progress indicator (linear),
loading bar. Mature systems keep three things apart: task progress, a looped
activity indicator, and a measurement. Interop does the same: progress here,
the busy spinner in [button](../.agent/components/button.md), and `<meter>` for
a measurement.

## 1. Prime

Three files: `interop-progress.ts` (165 lines), `interop-progress-label.ts` (96),
`interop-progress-status.ts` (40), plus `public-api.ts`. CSS:
`styles/components/progress.css` (186) and the protocol theme file (103). No
spec files. Consumers are only in the deprecated demo.

History: `27eec698` created the three files. `57d5276c` (ITX-26) moved the fill
from `::-webkit-progress-value` to a host gradient driven by
`--itx-progress-percent`, because "vertical bars reorient their box but not
their fill". `11900a51` moved the styles out of `styleUrl` into layered CSS.

### What held

- It is a real `<progress>`, so semantics never depended on the wrapper.
- Indeterminate removes `value`, which is the only way back to indeterminate.
- `aria-valuetext` is offered for "3 of 7" or "42 MB of 100 MB".
- The bar is silent; milestones go to a separate message.
- The indeterminate band moves by gradient stop positions along `--_axis`, so
  one keyframe works in RTL and vertical.
- Reduced motion parks the band instead of hiding it.

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | Forced colors drop the gradient: track, fill and band all disappear. No `@media (forced-colors)` block. Verified in Chrome 155 | 1.4.11, 1.4.1 | High |
| 2 | Dark fill against track computes to 2.51:1 on surface 0, 1.76:1 on surface 2 (calculated from tokens, not measured) | 1.4.11 | High |
| 3 | Track against page computes to about 1.16:1, so an empty bar shows nothing | 1.4.11 | Medium |
| 4 | Explicit `role="progressbar"` on `<progress>`: "NOT RECOMMENDED" by ARIA in HTML | 4.1.2 (conformance hygiene) | Low |
| 5 | `aria-valuemax` on `<progress>`: "SHOULD NOT" by ARIA in HTML. The ARIA values override the native ones (Chrome exposed valuemin=1 valuemax=7 value=3 over native max=100 value=29) | 4.1.2 | Low |
| 6 | Reduced motion drops the parked band to `opacity: 0.6`, lowering contrast further | 1.4.11 | Medium |
| 7 | The status region is visually hidden, so "Sync complete" is spoken but never shown | 1.3.1 (parity) | Low |

### Bugs

1. `min === max` (5, 5, 5): `(v - min) / (max - min)` is 0/0, so `value="NaN"`
   (`interop-progress.ts:121`).
2. `min > max` (10, 0, value 5): the clamp yields 0, then (0 − 10)/(0 − 10)
   draws a full bar. No warning.
3. `Math.round` (`:121`): 99.6 of 100 draws a complete bar; 0.4 draws an empty one.
4. Dev warnings run once in `afterNextRender` (`:126`). A value that later leaves
   the range, or `indeterminate` set later, is never checked.
5. The name check misses a wrapping `<label>` and `title`, passes an
   `aria-labelledby` that points at a missing id, and builds
   `label[for="${el.id}"]` unescaped, so an id containing `"` throws.
6. The label directive wires once (`interop-progress-label.ts:45`), reads `target`
   with `getAttribute` though its own warning says `[target]`, overwrites an
   existing `aria-labelledby`, searches only following siblings, and loses the
   name when an `@if` re-renders the bar.
7. The demo inserts the status region with "Half way there!" already inside
   (`progress-page.ts:56`). Live regions usually stay silent for content present
   at insertion. At 100%, `aria-atomic` reads both messages together.
8. The demo's step example (min 1) shows an empty bar labeled "1 of 7 steps
   complete".
9. The CSS comment's reason for the gradient is stale: in Chrome 155 and
   Playwright WebKit 27.2, `::-webkit-progress-value` follows `writing-mode:
   vertical-lr` and fills bottom-up with `direction: rtl`.

There are no tests. Nothing covers naming, indeterminate, the min ≠ 0 math, the
label directive or the status region.

## 2. Evidence

- Thresholds: show an indicator after about 1 s; a looped indicator for 2–10 s;
  percent done for 10 s or more, or for countable work ("3 of 50"). Users with a
  looped indicator waited about 3× longer than with none.
  [NN/g](https://www.nngroup.com/articles/progress-indicators/)
- Carbon: ProgressBar for long or unknown-duration work, InlineLoading for short
  create/update/delete, skeletons for full-page loads.
  [Carbon](https://carbondesignsystem.com/components/progress-bar/usage/)
- APG: `meter` "should not be used to indicate progress"; use `progressbar`.
  [APG meter](https://www.w3.org/WAI/ARIA/apg/patterns/meter/)
- HTML: `<progress>` "is not suitable for representing a gauge".
  [HTML](https://html.spec.whatwg.org/multipage/form-elements.html#the-progress-element)
- Roselli: ARIA value support is "meh"; values help only when the wait is long
  and match something visible.
  [More Accessible Skeletons](https://adrianroselli.com/2020/11/more-accessible-skeletons.html)
- Screen readers: NVDA beeps on value change by default (configurable). macOS
  VoiceOver speaks changes only with the VO cursor on the bar. Firefox with
  VoiceOver announces no value changes
  ([bug 1105770](https://bugzil.la/1105770)). On mobile, assume silence. Every
  source lands on the same practice: keep `<progress>` for semantics and
  announce milestones separately.
- ARIA progressbar: put `aria-busy="true"` on the region being loaded and point
  its `aria-describedby` at the bar.
  [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/progressbar_role)

## 3. The platform, checked in Chrome 155.0.8059.85

| Feature | Result |
|---|---|
| `<label for>` and wrapping `<label>` name `<progress>` | Yes: "Native label", "Wrapped"; `labels.length` 1 |
| Native range in the AX tree | `value=3 max=7` exposes valuenow 3, valuemax 7; no normalization needed |
| ARIA values over native | `aria-valuenow/min/max` win over `value/max` |
| No `value` | `:indeterminate` matches, `position` −1, no valuenow |
| `aria-valuetext` | Not shown by CDP on `<progress>` or on a `div role=progressbar`; unconfirmed |
| `appearance: none` + `::-webkit-progress-value` vertical | Fills along `writing-mode: vertical-lr`; bottom-up with `direction: rtl` |
| Same, `dir="rtl"` horizontal | Fills right to left |
| Forced colors, gradient fill | `background-image: none`; bar invisible |
| Forced colors, styled pseudo-elements | Invisible without `forced-color-adjust: none` |
| Forced colors with `forced-color-adjust: none` + `CanvasText`/`Canvas` | Determinate fill and indeterminate band both draw |
| Native `<progress>` in forced colors | Draws in system colors with an edge |
| `appearance: none` indeterminate | Draws nothing; the band must be authored |
| Typed `attr(value type(<number>))` | Supported; a gradient from it drew 60% |
| `ariaNotify` | Present |
| `appearance: base` | `CSS.supports` false |

Playwright WebKit 27.2 (not real Safari) matched Chrome on labels, vertical and
RTL fill, `:indeterminate`, and typed `attr()`; it has no `ariaNotify`. Firefox
failed to launch.

Other browsers, from sources: `:indeterminate` on progress is Baseline (Chrome
39, Firefox 51, Safari 10). Typed `attr()`: Chrome 133, Firefox 155; caniuse
says Safari has it only in Technology Preview, which conflicts with Playwright
WebKit 27.2. The design does not depend on it. `ariaNotify`: Chrome 141,
Firefox 150, Safari 27 per caniuse. Customizable progress
(`appearance: base`, `::slider-track`, `::slider-fill`) is in the css-forms-1
draft with no implementation.

## 4. Prerequisites in Interop

| Piece | Status |
|---|---|
| `announce()` | Exists (`src/announce.ts`) |
| Neutral track and fill pair, measured | Exists for the slider (`--itx-slider-track-color`, `--itx-slider-fill-color`); reuse its values |
| Forced-colors pattern for a filled track | Exists in `interop-slider.structure.css:119-133` |
| `LABELABLE` in the audit | Already lists `progress` (`src/audit.ts:35`) |
| Steps for step progress | Exists (`ol[interop-steps]`) |
| `<meter>` | Not built; question 2 |

## 5. Invokers

| Job | Invoker? |
|---|---|
| Set the value | No. The value comes from the task, not from a button |
| Return to indeterminate | No. It needs `removeAttribute('value')` |
| Announce a milestone | No. `announce()` |
| Cancel the task in a progress dialog | Yes, `command="close"` on the dialog; the task's own cancel stays the app's script |
| Open a progress dialog | Yes, `command="show-modal"` |

## 6. What carries over

1. The indeterminate band: gradient stops moved by a registered `<number>`
   property along `--_axis`, hard-edged, `linear`, one keyframe for RTL and vertical.
2. Reduced motion parks the band mid-track, at full opacity.
3. `aria-valuetext` for counts and sizes, documented on the card.
4. Silence between milestones; `announce()` at done and failed.
5. Audit rules from Prime's warnings: `progress-name` (no accessible name) and
   `progress-aria` (`role` or `aria-value*` on `<progress>`, which overrides the
   native range).
6. The demo's realistic examples: upload, sync, connecting.

## Questions for you

1. **CSS only, no directive and no `bind*()`.** The native pseudo-elements draw
   the fill from `value`, so nothing needs to publish a percent. Recommend: yes.
   An Angular user binds `[value]` on the element.
2. **Gauges.** Fuel reserve and storage used are `<meter>`. Ship
   `meter[interop-meter]` now, or leave `<meter>` unstyled and review it on its
   own? `<meter>` brings `low`/`high`/`optimum` and the browser's green, yellow
   and red, which is a color decision. Recommend: review it on its own.
3. **Color.** Use the slider's neutral pair (fill `neutral-900`/`neutral-50`,
   track `neutral-500`/`neutral-400`) so a bar and a slider match, or a separate
   pair? Recommend: the slider's pair, measured in `contrast.spec.ts`.
4. **Thickness.** Prime had sm 4px and md 8px. The slider's track is 4px with no
   size axis. Recommend: 4px default to match the slider, plus `itx-size="md"`
   at 8px only if you want a bar that is the subject of a view.
5. **Vertical.** Keep `itx-orientation="vertical"` (`writing-mode: vertical-lr`,
   `direction: rtl`), as the slider has it? No Prime use is vertical except the
   "Storage used" gauge. Recommend: drop it until a use appears.
6. **Busy region.** Document `aria-busy` on the loading region plus
   `aria-describedby` to the bar on the card, with no helper and no audit rule.
   Recommend: yes.
7. **Ring and spinner.** Out of scope: the button's busy spinner covers inline
   loading, and a ring waits for typed `attr()` in Safari. Recommend: agree.

## Unverified

- Firefox: vertical and RTL fill, forced colors, `::-moz-progress-bar` with an
  authored indeterminate band.
- Real Safari: everything here ran in Playwright WebKit, which is not Safari.
- What a screen reader speaks for `aria-valuetext` on `<progress>`; CDP showed
  it empty for both `<progress>` and a `div`.
- The contrast numbers for Prime's tokens are calculated from OKLCH, not
  measured in the browser.
- Whether a `transition` on the fill pseudo-element animates the value change.
