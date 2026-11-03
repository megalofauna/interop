# Progress — Mental Model Card

A progress bar shows how far a task has got: an upload, a sync, an export. It is
the native `<progress>`, styled, as a bar or a ring. It needs no script. Research:
[prompts/PROGRESS-REVIEW.md](../../prompts/PROGRESS-REVIEW.md).

For a measurement in a range (storage used, battery), use `<meter>`. For the
steps of a form, use [steps](steps.md). For a wait of a second or two, use the
button's busy state. A multi-step flow is not a bar.

## Files

```
projects/interop/progress/
  interop-progress.structure.css   track, fill, indeterminate band, forced colors; names list at the top
  interop-progress.base.css        token values and size steps
  public-api.ts                    empty: CSS only
```

The demo page is `projects/demo/src/app/components/progress/`.

## Markup

```html
<label for="upload">Uploading report.pdf</label>
<progress interop-progress id="upload" value="42" max="100"></progress>
```

- **Name.** `<label for>`, a wrapping `<label>`, `aria-labelledby` or
  `aria-label`. `<progress>` is a labelable element.
- **Range.** `value` and `max`, any `max`. There is no `min`: a range that does
  not start at 0 is `value - min` over `max - min`, done by the caller.
- **Words.** `aria-valuetext="3 of 7 files"` when a count says more than a
  percentage.
- **Unknown amount.** No `value` attribute. `removeAttribute('value')` is the
  only way back; setting `.value` cannot do it.
- **A region that waits** gets `aria-busy="true"` and `aria-describedby` pointing
  at the bar, both cleared when it loads. The bar sits outside the region: some
  screen readers skip busy content.
- **Milestones** are spoken once with `announce()` from `interop`, from the bar,
  and shown as text: done, failed. The bar is silent while it moves in most
  screen readers (NVDA beeps), and nothing announces every step.
- In Angular, bind `[value]` on the element. There is no directive.

## Look

The [slider](slider.md)'s track size, shape, shade and fill, at the same size
steps; `styles/contrast.spec.ts` fails if those differ. Progress fills its
track where the slider edges its recess (2026-11-03); the slider may follow.

| `itx-size` | Thickness |
|---|---|
| `sm` | 4px |
| none, `md` | 6px |
| `lg` | 8px |

- The element is the track: a solid fill with round ends and an inset shade
  along its top, no edge. The fill is `neutral-500` in both schemes: the
  darkest gray 3:1 against the page that keeps the fill 3:1 against it (light
  4.73 and 3.79, dark 3.68 and 3.76). It is the only neutral step that does
  both in both schemes; `neutral-600` drops the fill to 2.30 in light. A thin
  edge broke up at some screen resolutions, so the fill shows the track's
  length instead.
- The fill is the browser's own part (`::-webkit-progress-value`,
  `::-moz-progress-bar`) in the text color, so the browser sizes it from `value`
  and `max`. It eases to a new value over the slower shared transition.
- **Indeterminate.** A band 30% of the track long crosses it, drawn as a
  gradient whose stop positions move with a registered `--itx-progress-sweep`.
  `linear`, because an easing on a loop pulses. One keyframe serves both
  directions; `:dir(rtl)` flips the gradient. Firefox draws an indeterminate
  fill across the whole track, so that fill is made transparent.
- **Reduced motion** slows the band from 1s to 2s per crossing
  (`--itx-animation-duration-sweep` in `styles/transition.css`), like the busy
  spinner, so it still says that something is happening.
- Forced colors (`forced-color-adjust: none`): track `Canvas`, a 1px
  `CanvasText` edge (the edge width is 0 otherwise), fill and band
  `Highlight`, no shade. Without it the browser drops the gradient and the
  shadows, and the bar disappears.
- Contrast, measured: track and fill 3:1 against the page, fill 3:1 against
  the track.
- No vertical bar. Add `itx-orientation="vertical"` when a use appears: in
  Chrome 155 and WebKit the fill part follows `writing-mode: vertical-lr`, and
  `direction: rtl` fills it from the bottom.

## Ring

`progress[interop-progress="ring"]`: the same element drawn as a ring, CSS only.

```html
<progress interop-progress="ring" value="42" max="100" aria-label="Uploading report.pdf"></progress>
<progress interop-progress="ring" itx-size="sm" aria-label="Loading"></progress>
```

- The bar bent round, from the bar's own tokens: the filled track and the
  fill over it. The same contrast pairs as the bar, so the bar's guard covers
  it. No inset shade. In forced colors the edge draws on its outer and inner
  circles.
- Thickness is the track's (4, 6, 8px); the diameter a button's height at the
  same size (32, 40, 56px), so a ring sits beside a button.
- The fill is `--itx-progress-ring-fill`, `attr(value type(<number>), 0) /
  attr(max type(<number>), 1)` of a turn, swept clockwise from the top by a
  `conic-gradient`; a `radial-gradient` mask cuts the disc to a ring. A script
  setting `.value` writes the attribute, so the ring follows. The angle is a
  registered `<angle>`, so a new value eases round over the bar's transition.
- The browser's fill parts are transparent: they would draw a bar inside.
- **Indeterminate** (no `value`) is a spinner: an arc of 0.3 turn turns with
  `--itx-animation-duration-spin`, the busy spinner's, which reduced motion
  slows from 0.75s to 1.5s. Clockwise in RTL too.
- Forced colors: the bar's block covers it (track `Canvas`, edges
  `CanvasText`, fill `Highlight`).
- Typed `attr()`: Chrome 156, WebKit 27.2, and the user's Firefox and Safari
  (2026-11-02).

## Dev audit rules

| Rule | Flags |
|---|---|
| `progress-name` | No label, `aria-label` or `aria-labelledby` |
| `progress-aria` | `role`, `aria-valuenow`, `aria-valuemin` or `aria-valuemax` on the element. They restate the native role or override the native range |

## Tests

- `src/audit.spec.ts`: each rule, and a labeled, wrapped, named and
  indeterminate bar that pass.
- `a11y/a11y.spec.ts`: axe on determinate, indeterminate and sized bars and
  rings, with a busy region.
- `npm run test:browser` (`scripts/browser/check-progress.mjs`), Chromium and
  WebKit: the ring's angle for 25 of 100, 0.66 of 1 and 7 of 7, a value set
  from script, the spinner and its reduced-motion duration, the sizes against
  a large button, forced colors, and the bar unchanged. Ignoring `max` fails
  it.
- `styles/contrast.spec.ts` (and the shared track), `forced-colors.spec.ts`,
  `motion.spec.ts`, `preferences.spec.ts`, `radius.spec.ts`.
- Chrome 155, on the demo: names from the labels, `valuemax=7` for a count, no
  value when indeterminate; the export example fills and announces; the band
  draws in `Highlight` in forced colors; the page checks pass (axe light and
  dark, 320px, focus rings).
- Playwright WebKit 27.2 (not Safari): the three sizes draw as in Chrome; the
  indeterminate band runs in Safari (user).
- Firefox: the indeterminate band runs in the track lab (user); the library
  page is not yet checked there.
- Not yet tested: what screen readers speak for `aria-valuetext` on
  `<progress>` (the DevTools protocol shows it empty).

## Not built

- `<meter>`. It brings `low`, `high` and `optimum` and the browser's green,
  yellow and red, which is a color decision of its own. Review it separately.
- Text inside the ring (a percentage). Untested on `<progress>`; it would
  likely need a wrapper, the first thing the ring would add to the element.
- Vertical (see Look).
- `appearance: base` with `::slider-track` and `::slider-fill`, which no
  browser ships.

## Prime

Prime's `InteropProgress` restated the native role and range in ARIA, set
`aria-valuemax` (which ARIA in HTML says not to), normalized the value to 0–100
with `Math.round` (99.6 drew a full bar; min = max gave `NaN`), and wired names
with a directive that claimed `<progress>` cannot take a label. Its gradient fill
disappeared in forced colors. Its status component was an always-on hidden live
region. Do not reintroduce the wrapper, the label directive, the live region, or
`min`.
