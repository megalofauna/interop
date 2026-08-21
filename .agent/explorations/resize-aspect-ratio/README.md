# CSS `resize` + `aspect-ratio` — cross-engine findings

Verification run for the ratio-first `interop-resizable` design (2026-07-25). The
Tier 0 story rests on one empirical claim about how user agents implement native
`resize`, so it was measured rather than assumed. All three engines were driven
with real dispatched input against the UA's own resizer control.

**Engines:** Blink (Chromium 1234 / Playwright), WebKit 26.5 (Playwright),
Gecko (Zen 1.20.1b, driven over WebDriver BiDi — Playwright's Firefox build
would not launch on Darwin 27).

## Results

| # | Case | Blink | WebKit | Gecko |
|---|---|---|---|---|
| A | `resize: horizontal` + `aspect-ratio` | writes `width` only — ratio 1.7778 | same | same |
| B | `resize: both` + `aspect-ratio` | writes `width` **and** `height` — ratio 1.7391 | same | same |
| C | `resize: vertical` + `aspect-ratio` | writes `height` only — ratio 1.7778 | same | same |
| D | horizontal + ratio + `max-block-size: 300px` | 700 × 300 — ratio 2.3333 | same | same |
| E | `min-inline-size: 711.11px` vs `max-inline-size: 600px` | renders 711.11 | 711.11 | 711.**12** |
| F | ratio + both dimensions definite | ratio ignored (400 × 300) | same | same |
| G | `overflow: visible`, 240px content in a 320px-wide 16/9 box | 320 × 257 — ratio 1.2451 | same | same |
| H | `overflow: hidden`, same content | 320 × 180 — ratio 1.7778 | same | same |

## What each result settles

**A + B + C — single-axis `resize` is the whole Tier 0 mechanism.** Under
single-axis `resize` every engine writes only the resized dimension, leaving the
other `auto`, so `aspect-ratio` resolves it with zero JS. Under `resize: both`
every engine writes both dimensions, and per css-sizing-4 a preferred aspect
ratio "only ever has an effect if at least one of the box's sizes is automatic" —
so the ratio is ignored outright. **Ratio-first must therefore coerce
`axis="both"` to a single axis.** This is forced by the platform, not a
preference. C shows vertical is an equally valid driving axis.

**D — cross-axis bounds break the ratio, and must be neutralised.** Min/max in
the ratio-dependent axis are applied "without regards to aspect-ratio", so any
cross-axis bound that reaches CSS wins over the ratio. Because
`styles/components/resizable.css` declares `min/max-block-size` from the
`--itx-resizable-{min,max}-height` tokens unconditionally — and the documented
two-path bounds contract invites consumers to set those tokens from a
stylesheet — suppressing the directive's own host bindings is not sufficient.
Ratio mode must write the neutral value (`0` / `none`) into the cross-axis
tokens inline.

**E — CSS resolves min over max; the directive's `clamp()` did not.** Both the
CSS 2.2 §10.4 algorithm and all three engines resolve a `min > max` conflict in
favour of `min`. The former hand-rolled clamp returned the *max* for the same
inputs, so Tier 0 and Tier 1 disagreed by the width of the conflict. Fixed;
see `interop-resizable.spec.ts`.

**E and C also disagree between engines at the sub-pixel level** — 711.11 vs
711.12, 666.66 vs 666.67 — because Gecko quantises layout to 1/60px app units
and Blink to 1/64px. **Any projected bound computed in JS bakes in one engine's
answer and hands it to the others.** Ratio arithmetic therefore belongs in CSS
(`min-inline-size: calc(400px * 16 / 9)`); JS may compare full-precision floats
to decide which bound is tighter, but must not produce the emitted value.

**G + H — `overflow: hidden` is load-bearing for the ratio.** A scroll container
is exempt from the automatic content-based minimum; a non-scroll-container is
not, and content taller than the derived height floors the box and destroys the
ratio. The `overflow: hidden` in `resizable.css` reads as an incidental
requirement of `resize` — it is also what keeps the ratio intact against
content. A consumer overriding it to `visible` (to unclip a shadow or focus
ring) silently re-enables the content floor.

## Running it

Not wired into `npm test` — these drive real browsers and exist to re-verify a
platform assumption, not to gate CI.

```bash
cd /tmp && mkdir -p rp && cd rp && npm init -y && npm i playwright puppeteer-core
npx playwright install chromium webkit
cp <repo>/.agent/explorations/resize-aspect-ratio/{probe.html,probe.mjs,zen.mjs} .

node probe.mjs cr     # Blink
node probe.mjs wk     # WebKit
node zen.mjs          # Gecko, via /Applications/Zen.app
```

`probe.mjs` reloads the page per case so earlier drags cannot push later
elements below the fold — without that, drags silently no-op.

`gecko-check.html` is the no-tooling fallback: open it in any browser, the
layout assertions self-report PASS/FAIL and the drag cases give live ratio
readouts.

## Related

- [resizable mental model card](../../components/resizable.md)
- Specs consulted: CSS 2.2 §10.4 (min/max resolution), css-sizing-4
  (aspect-ratio effects, min/max transfer, automatic content minimum,
  `box-sizing` dependence, degenerate ratios)

## Integration check

`integration.html` + `integration.mjs` / `integration-zen.mjs` verify the other
half — that what the directive actually emits produces the intended layout
against the built `resizable.css`. The unit specs cannot cover this: Karma does
not load the library stylesheet, so Tier 0 is invisible to them.

Two hosts, same intent, dragged past the bound. `projected` carries what the
directive emits for `[aspectRatio]="'16/9'" [max]="{ height: 300 }"` — the
cross-axis max projected onto the driving axis as `calc()`, cross-axis tokens
neutralised. `naive` lets a raw cross-axis max reach CSS, which is what the
component did before projection.

| | Blink | WebKit | Gecko |
|---|---|---|---|
| `projected` | 533.33 × 299.98 — ratio 1.7779 | same | 533.33 × 300.00 — ratio 1.7778 |
| `naive` | 800 × 300 — ratio 2.6667 | same | same |

The projected host stops exactly where the derived height reaches its bound and
keeps its shape; the naive one is clamped flat. The ≤0.02px difference between
engines is the layout-quantisation gap the `calc()` emission exists to absorb.

Copy `dist/interop/styles/components/resizable.css` next to `integration.html`
as `resizable.css` before running — the page loads the built file, not the
source, so it verifies what actually ships.
