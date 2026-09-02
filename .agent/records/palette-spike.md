> **Superseded 2026-09-01.** The 14-step ramps this record argues for were
> deleted: the system is six surface values, four text tiers and one hue per
> family. Kept because the reasoning is the reasoning — if anyone proposes a
> stepped palette again, this is what was measured last time. See
> `.agent/color.md` for what ships.

# Palette spike — findings

Branch `itx-53-palette-spike`. Throwaway; the code is evidence, not a deliverable.

**All four questions pass.** Two of them pass more strongly than the plan anticipated.

---

## Q1 — Does computed elevation work? **YES**

One expression reproduces every layer, both directions, both schemes:

```
clamp(min, page + step·(1 − ease^max(0,n))/(1 − ease) + down·min(0,n), max)
        └ geometric going up            └ linear going down
```

**Engine size: 1,807 → 216 non-comment lines** (8.4×), with the counter and absolute pins
retained. Everything removed was the colour payload — ten `@container` blocks each
re-declaring the entire system.

**Every `layerOf()` assertion passes.** Compounding, sink netting, absolute pins, ceiling and
floor clamping: zero counting failures. The mechanism is behaviourally identical.

Six assertions fail, in three categories:

| n | category | detail |
| --- | --- | --- |
| 3 | **Rounding only** | `oklch(0.2715)` vs `oklch(0.272)`. The *published* value is the generator's `round3` of the true one. Verified byte-identical in 8-bit sRGB at every layer. Chrome serializes `background-color` as `oklch()`, not `rgb()`, so string equality sees a difference the screen cannot. |
| 2 | **Spike incompleteness** | The spike emits surfaces only, no `--itx-contrast-*`. Not a defect in the approach. |
| 1 | **Real regression** | See below. |

### The one genuine regression

`--itx-ramp-surface-1-dark: 0.9` set on an ancestor stops working. The computed engine never
reads those numbers. This is a **documented public override** — `.agent/color.md` states
"set any `--itx-ramp-*-light` / `-dark` number on any ancestor" — so adopting this is a
breaking change to a published API.

It is replaced by something better: `--itx-l-page`, `--itx-l-step`, `--itx-l-ease`,
`--itx-l-down`, `--itx-l-min`, `--itx-l-max` (and the `d-` pair). Those are the generator's
entire `RAMP` config, live in the browser. **Drag one in devtools and every layer moves at
once.** That is the tuning DX the config-seam work wanted a GUI for, falling out for free.

### Wart worth knowing

`(1 − ease)` divides by zero on a uniform ramp. Emitting a linear form per scheme when
`ease === 1` avoids it and keeps the uniform ramp exact — the two schemes already sit in
separate arms of `light-dark()`, so it costs nothing.

---

## Q2 — Can an arbitrary hue hold the offset guarantee? **YES**

Every foreground step clears its floor against **every** background step, in both schemes, for
all four hues — including the deliberately hostile 215° teal whose chroma ceiling is `.145`,
the lowest on the circle.

The guarantee is structural, not lucky: each foreground is solved against the *worst*
background in its band, so every other pairing has slack by construction.

**The band model departs from Radix, deliberately.** Radix is monotonic in lightness. Interop's
elevation moves toward light in *both* schemes, so a monotonic scale would run elevation
backwards. Instead:

- **1–5** background band, ordered by elevation. Step 1 is the page.
- **6–12** foreground band, ordered by increasing contrast *against* that band.

What matters is not that lightness ascends but that contrast ascends where it is read.

**Cosmetic note:** in a saturated colourway, step 12 desaturates badly — the hostile hue lands
`C .049` at `L .937`, because that lightness cannot hold chroma. High-contrast text in a brand
colour goes nearly grey. Expected, but worth seeing before committing.

---

## Q3 — Is the matrix usable? **IT ISN'T A MATRIX**

The honest artifact is three constants:

> **Borders → step 8. Text → step 11. High-contrast text → step 12.**

That holds for every scale, every background step, in light universally. In dark, background
steps 1–2 have *more* headroom (step 7 borders and step 8 text also clear) — so the rule is
conservative and never wrong.

No lookup, no arithmetic, not even the `+6` offset rule of thumb. Three numbers replace eight
role names. This is the strongest result in the spike.

---

## Q4 — Does the dev warning survive contact? **YES — and it found real bugs**

Audited six real demo pages in dark mode.

**110 raw findings → 6 distinct causes. Zero false positives.**

| raw | deduped | page |
| --- | --- | --- |
| 7 | 4 | foundation/color |
| 3 | 2 | components/callout |
| 9 | 2 | components/badge |
| 50 | 2 | components/toast |
| 20 | 2 | components/table |
| 21 | 2 | components/tree |

**Deduplicate by cause, not instance.** 50 findings on the toast page are one defect repeated
across 50 code-comment spans. Raw counts make a real signal look like noise.

### The six causes are all genuine

1. **`code.demo-page__api-type` — 3.09:1, five pages.** `--itx-colorway-solid` used as text.
   A *fill* colour where `--itx-colorway-text` exists and is solved to 4.5:1. Straightforward
   misuse, invisible until measured.
2. **`span.itx-cr__token` — 3.11:1, five pages.** `rgb(106, 115, 125)`, a hardcoded Shiki theme
   colour that bypasses the token system entirely. Code comments are below AA in dark mode.
3–6. **`td` — 4.03 / 3.52 / 3.03 / 2.59:1 across layers 1–4.** This is
   `--itx-danger-text` (L .626), solved against layer 0 and used at depth.

### Cause 3–6, stated accurately

Those four numbers are *exactly* the status-drift figures computed from the generator earlier
this week, and the audit surfaced them with no special instrumentation — a defect that
previously required building a purpose-made measuring rig to see.

**But the location matters, and an earlier draft of this document overstated it.** They are on
the Colour page only, in the `color-depth__readout` tables — markup written in this same
session to *demonstrate* the drift, colouring its own fail markers with `--itx-danger-text` at
layers 1–4. Not `interop-table`, and not independent of the work that predicted it.

That is still a genuine instance of the defect in live markup, caught automatically at the
point of use. It is not the stronger claim that the tool found the bug somewhere nobody was
looking.

A build-time proof protects the point of *definition*. This catches the point of *use*, which
is where the bug actually was.

**Post-fix state.** With cause 1 corrected, every component page reports exactly one cause —
the Shiki comment colour — and the Colour page reports the four status-drift rows. Two real
causes across the whole demo.

---

## Recommendation

**Proceed to stage 1** (computed elevation engine) as its own change. It is 8.4× smaller, the
counting is provably identical, and the only behavioural cost is a documented override that
gets replaced by a better one. Handle the ramp-number override as a deliberate, announced
break.

**Then stage 3** (dev warning) *before* stage 2. It is already finding real defects against the
current system, so it pays for itself whether or not the palette model ever changes — and it is
the instrument that would make a stage-4 migration safe to attempt.

**Fix the two live defects now**, independent of any of this: the `-solid`-as-text misuse and
the hardcoded Shiki comment colour.

The palette rewrite itself (stages 2, 4, 5) still carries every risk in the plan's regret
section — most of all that the system being replaced is six days old. But Q3 materially changes
the calculus: "borders 8, text 11, high-contrast 12" is a system a developer can hold in their
head, which is the thing the current one demonstrably is not.

---

## Decided, 2026-08-21 — 14 steps, curve 1.30

Settled in the browser, against the four candidates rendered on the demo's
Colour page.

### What the shape turned out to be

Not what the spike proposed. The spike's band model solved steps 6–12
*backwards* from contrast floors — step 8 was "whatever clears 3:1 against the
worst background" — so each step was a separate answer and the ramp did not
gradate. It read as neither a palette nor the role system. Chris called it: *"a
hybrid approach that doesn't really accomplish either."*

The shape now is a **palette, then a verdict**. Steps are placed by lightness
alone; contrast is measured afterwards and the guidance is an output.

### The two dials

**Length.** 12 matched Radix, not the common count — ten is (Carbon, Ant, Open
Color, Bootstrap), Tailwind ships 11 and got there by adding to both ends
twice. Measured here, the single-distance rule survives 12 and 14 and
**fragments at 16**, where the hues stop agreeing and need per-hue exceptions.

**Curve.** Even in OKLCH lightness is *not* even to the eye. On a linear ramp
the last step removes **2.86×** the light of the one before it while the first
removes 1.26× — it measures uniform and reads as accelerating into the dark.
This is why neither Radix nor Tailwind is linear in any single space.

The dials fight: the tidy rule was partly an artefact of the ramp being uneven.
Each candidate below is the most easing that length can take while every hue
still shares one distance per floor.

| candidate | evenness | borders | text | enhanced |
| --- | --- | --- | --- | --- |
| 12 linear | 2.38 | 5 | 6 | 8 |
| 12 · curve 1.25 | 1.50 | 6 | 7 | 8 |
| 14 linear | 2.19 | 6 | 7 | 9 |
| **14 · curve 1.30** | **1.39** | **7** | **8** | **10** |

Evenness is the largest adjacent luminance jump over the smallest; 1.0 is
perfect.

### The rule

> **Borders 7 apart. Text 8 apart. Enhanced 10 apart.**

Holds for all five hues, including the 215° teal whose chroma ceiling is the
lowest on the circle — because the distances come from lightness, and lightness
is what the ramp controls.

### Still open

- **Three text levels.** Chris wants three; the model gives two distances above
  the border. The shipping rank system already has three (rank 4 secondary,
  rank 5 body, rank 6 maximum), so adopting this as drawn loses one.
- **Scheme pairing.** The preview is one ramp, deliberately. How light and dark
  draw from it is undecided and easier to reason about separately.
- **Nothing is a token yet.** This is still preview only: the generator writes
  no CSS.
