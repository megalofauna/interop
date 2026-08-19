# Plan — collapse the color families into one ramp plus a cast

**Status:** REJECTED as specified, 2026-08-18, by adversarial review. The
mechanism works; the colour science does not. Kept as a record of what was
tested and why it fails — see §8. The surviving recommendation is the simpler
rename, §10.
**Raised:** 2026-08-18
**Supersedes the idea in:** the `--itx-colorway-contrast-*` parity proposal,
which this replaces entirely.

---

## 1. The requirement

`--itx-contrast-3` is the ONE canonical way to ask for a mark at that contrast
slot, neutral or brand. **A consumer must never name a colorway-specific token.**
Intent is declared separately from the request. CSS only, no JS.

---

## 2. What is wrong today

Two parallel vocabularies for the same idea:

```
neutral   --itx-contrast-1 … -6                    parametric, 6 steps
brand     --itx-colorway-{tint,on-tint,border,text,solid,on-solid}   6 nouns
status    the identical 6 nouns, x4 families
```

The neutral axis lets you say "rank 3." The brand axis makes you pick a noun
that someone else chose. The usage counts show what that costs:

| rung | call sites |
|---|---|
| `--itx-colorway-solid` | 55 |
| `-on-solid` | 12 |
| `-text` | 8 |
| `-tint` | 6 |
| `-border` | 6 |
| `-on-tint` | 5 |

`solid` outnumbers every expressive rung combined — not because it is usually
right, but because it is the only name anyone is confident about. That is why
five components shipped `-solid` on an edge or a mark (tabs, callout, listbox,
content, chip) and why, on the day this plan was written, an edit reached for
`--itx-colorway-solid-on-solid` (does not exist, declaration dead) and put
`-on-tint`, a label rung, on a border. **The misuse is not carelessness; it is
what a vocabulary too large to hold in your head produces.**

`tint` is also actively misleading: it tracks the current surface, so in dark
mode it is DARKER than `solid` (0.253 vs 0.780 at layer 0). In painting, a tint
is lighter. And `--itx-tint-light`/`-dark` already mean something else entirely —
the chroma+hue pack.

---

## 3. The finding that makes the collapse possible

**The lightness solve is very nearly cast-invariant.** At layer 0:

| | lightness | chroma |
|---|---|---|
| surface | 0.898 / 0.193 | — |
| neutral rank 1 | 0.860 / 0.243 | 0.006 |
| brand wash | 0.848 / 0.253 | 0.075 / 0.153 |

0.012 apart in light, 0.010 in dark. The expensive part of the system — a
per-layer, per-scheme contrast solve — does not need to exist twice.

Both families already compose identically: `oklch(<lightness> <chroma> <hue>)`.
The neutral case just bundles chroma+hue into one pack token. **The seam already
exists inside the generated CSS; this plan exposes it.**

> Load-bearing caveat: 0.012 L is small but a rank is a CONTRAST TARGET, and
> OKLCH lightness is perceptual while WCAG uses relative luminance — the two
> diverge further as chroma rises. Whether the shared ramp still hits every
> rank's ratio at brand chroma is the single question that decides this plan.
> See §8.

---

## 4. The model

**One lightness ramp. The cast is inherited data.**

```css
/* the rank: a lightness, composed with whatever cast is in scope */
--itx-contrast-3: oklch(var(--itx-rank-3-l) var(--itx-cast-mark-c) var(--itx-cast-h));

/* the secondary layer of intent */
:where([itx-cast="colorway"]) {
	--itx-cast-wash-c: …;   /* ranks 1–2 */
	--itx-cast-mark-c: …;   /* ranks 3–6 */
	--itx-cast-h: …;
}
```

A cast is three numbers per scheme, generator-solved per hue. Two chroma values
rather than one because a wash near white cannot hold mark chroma without
ceasing to be a wash (0.075 vs 0.190 in light).

Consumer surface, in full:

```html
<span interop-chip itx-cast="colorway">Brand</span>
<div interop-callout itx-cast="warning">…</div>
```

`chip.css` says `border-color: var(--itx-contrast-3)` and never learns that
brand exists.

### The composition rule — the part that breaks if done naively

Every `[itx-layer]` re-declares all six ranks unconditionally. So a cast set
ABOVE a layer boundary is clobbered at that boundary, and a cast set BELOW one
arrives after the ranks were already resolved. `elevation.spec.ts` already
asserts this as a negative case for `--itx-surface`.

The fix is the co-declaration rule added to `css-strategy.md` on 2026-08-17 —
one more selector in the set:

```css
:where([interop-root], [itx-layer], [itx-sink], [itx-cast]) { /* the six ranks */ }
```

Ranks then re-resolve at cast boundaries AND layer boundaries, so the two axes
compose rather than fight. No combinatorial explosion: a cast is data, not a
set of blocks.

---

## 5. What survives, what dies

**Survives:** `--itx-contrast-1…6` (now the only mark vocabulary),
`--itx-surface*`, and `--itx-colorway-solid` / `-on-solid` / `-solid-hover` /
`-solid-active`. Solid is different in kind — fixed brand identity,
scheme-invariant, not a rank — and keeping it separate is what lets the ranks
stay coherent.

**Dies:** `--itx-colorway-{tint,on-tint,border,text}` and the whole of
`--itx-{warning,info,success,error}-{tint,on-tint,border,text}`. Four parallel
ramps become four cast definitions.

**`on-tint` disappears rather than being replaced.** A rank-1 wash sits ~0.05 L
off the surface, so text on it is `--itx-contrast-6` — exactly how the neutral
axis already works. One fewer paired concept to keep in sync. (Verify this holds
at every layer/scheme/hue before relying on it.)

---

## 6. Migration

~25 colorway call sites and ~26 status ones. `solid`'s 55 do not move.

Mechanical, per site: a named rung becomes a rank plus, where the element was
not already inside a cast scope, an `itx-cast` attribute on the nearest sensible
host. The interesting work is deciding the SCOPE of each cast, which is a design
judgement per component, not a rename.

---

## 7. Known costs

**Casting is total.** Inside a cast scope every rank goes brand, body text
included. The same mechanism supplies the escape (`[itx-cast="neutral"]`), but
it means casts want to be scoped to the parts that should carry them, not
wrapped around whole components. This is the main ergonomic risk and the thing
most likely to make the model unpleasant in practice.

**Gamut cannot become a consumer's problem.** "Blue holds .28 at L .50; teal
cannot exceed .146 anywhere" — the generator's own note. Cast chroma must stay
build-time solved per hue. A consumer who writes their own cast pack by hand can
produce out-of-gamut values that clip, which moves luminance and silently breaks
the rank's contrast target.

**Semantic loss.** `--itx-warning-border` says what it is. `--itx-contrast-3`
inside `[itx-cast="warning"]` says where it is. The meaning moves from the token
to its context — which is the point, and also a real readability cost when
scanning a stylesheet in isolation.

---

## 8. The review — REJECT as specified

### Fatal: "lightness is cast-invariant" is false

The 0.010–0.012 delta this plan was built on was measured at **one cell** —
layer 0, the wash rung, blue — where neutral and brand happen to agree. Across
10 shipped families x 2 schemes x 8 layers x ranks 2–5, reusing neutral rank
lightness at cast chroma misses the stated contrast floor in **316 of 640 cells
(49%)**, gamut-clamped (the best case). Letting chroma clip instead: 312/640.

  danger-eighties  dark  n2  rank 3   floor 3.0   actual 2.70:1
  success-eighties light  0  rank 3   floor 3.0   actual 2.78:1
  colorway (blue)  dark   0  rank 5   floor 7.0   actual 6.93:1
  warning          dark   0  rank 2   floor 1.5   actual 1.49:1

Not boundary noise — a systematic 7–10% shortfall, always the same direction,
every family. Cause is exactly the suspected one: OKLCH L is perceptual, WCAG is
relative luminance, and they diverge by a hue-dependent amount that grows with
chroma. The generator already knows this, which is why `solveRank` binary
searches on measured luminance and `solveAccentRole` re-clamps chroma inside the
search loop. This plan deletes that machinery and asserts its answer.

A shared worst-case ramp does exist (no unsolvable cell, ΔL 0.008–0.025) but
drags the neutrals off their floors — hairlines go 1.50 -> 1.65:1 on every
neutral page, forever, to serve casts. And the worst-case hue is whatever a
CONSUMER seeds, so it is either re-solved per colourway (reintroducing per-family
numbers, the thing being deleted) or wrong-by-overshoot for everyone.

### Fatal: a two-value chroma pack cannot be gamut-correct

Rank 6 is a fixed pole (L 0.150 light / 0.920 dark at every layer), so one
"mark chroma" spanning ranks 3–6 must fit at the worst of those lightnesses.
Gamut-safe static chroma retains **19–27% of the seed** for most families;
18 of 20 hue x scheme pairs keep under 80%, median ~40%. Rank 3 — a border —
would be near-grey because rank 6 cannot hold colour at the pole.

Letting it clip does keep contrast predictable (Chrome's paint matches the
generator's clip model, 4/4 pixel-exact) but destroys identity: blue rank 6
renders cyan (−33.3° hue), amber body text renders orange-red (−15.9°), amber
maximum renders maroon. That is the amber-slot failure `.agent/color.md` records
as the reason the slot model was replaced, reintroduced in a new coordinate
system. Today nothing ever goes out of gamut.

### The headline snippet is not writable

`light-dark()` is a colour function and cannot carry bare numbers, so
`oklch(var(--rank-l) var(--cast-c) var(--cast-h))` does not work for a
two-scheme system. It must be `light-dark(oklch(l-light c-light h),
oklch(l-dark c-dark h))` — five inherited inputs per rank, not two, and the
"one ramp" is two tokens.

### Also major

- **Casting is not total where it matters.** Body text does not go brand,
  because `color` was substituted at `[interop-root]` and inherits finished.
  Making it total requires adding `[itx-cast]` to paint rules, and then a cast
  boundary reclaims a consumer's region override — the exact failure
  `css-strategy.md` rejects component-scoped blocks for.
- **It moves theme decisions into markup, i.e. into TypeScript.** All 24
  status-family reads are theme bindings on host-level variant selectors
  (`interop-callout[data-type="warning"]`). Under casting those become
  inexpressible from the theme layer; the component must write `itx-cast` on its
  own host, which CSS cannot do — so a pure-CSS variant becomes an Angular host
  binding. Flagged against `project_angular_waystation`.
- **`on-tint` has no positional equivalent.** Ranks are solved against the
  SURFACE, never against a wash sitting on it: re-measured against their own
  rank-1 wash, **158 of 160** cells have at least one rank failing. Only rank 6
  survives, so "text on a tinted callout" collapses to "always maximum",
  deleting the secondary/body distinction inside every tinted panel. 16 of the
  24 status reads are tint/on-tint pairs.
- **The guards go blind.** `check-shape.mjs` rule 2 only fires on a bare
  `[interop-root]` selector; it never checks that a co-declared selector is
  COMPLETE. An incomplete cast co-declaration renders a plausible grey, wrong,
  guard green — the same class the 84-site sweep just fixed.
- **An undeclared cast is guaranteed-invalid and inherits**, taking a whole
  subtree's ranks to transparent. Fixable with `@property`, unmentioned.

### Disproved, in the design's favour

- **Cast x layer composition works.** Every case passed in Chrome 151 — cast
  above, below, and on the same element as a boundary; nested casts; cast on the
  root; counting still compounds. The co-declaration fix is sound and source
  order is irrelevant, because `var()` reads the computed value.
- **Recalc cost is a non-issue.** 4000 nodes: 6.8 ms plain, 6.3 ms all-cast,
  6.9 ms all-layer. Within noise.
- **The size win is real but small on the wire** — ~123 kB -> ~52 kB raw, but
  the files gzip to 9.76 kB today, so ~4–5 kB. The genuine win is parse and
  legibility.

## 9. What it would take to revive it

Six conditions, all of them, per the review: per-rank gamut-solved chroma (which
returns the token count to near parity with today); either per-cast lightness
(at which point "one ramp" is gone) or a proven worst-case ramp with the neutral
overshoot accepted in writing; `on-tint` surviving in some form; `check-shape`
validating co-declaration COMPLETENESS; status variants still expressible from
the theme layer without a host binding; and `@property` registration for the
cast pack.

If all six land, the result is today's system plus `itx-cast` as a scoping
attribute plus rank-numbered names — which is §10 with one extra attribute, not
the collapse this plan describes.

## 10. The surviving recommendation — rank-numbered names

`--itx-colorway-contrast-1…6`, `--itx-<status>-contrast-1…6`.

It takes the whole pedagogical win — one vocabulary, ranks all the way down,
"border" stops being a privileged name that people reach for wrongly — while
keeping per-rung solved lightness, per-rung gamut-clamped chroma, `on-tint`,
per-property mixing, theme-layer variants, and **zero markup attributes**.

It also closes a live doc/code divergence: `.agent/color.md:46` already documents
the axis as `--itx-contrast-<family>-N`, while the shipped tokens are
`--itx-colorway-border` / `-text` / `-tint`. The documentation has described this
naming all along.

Honest caveat: the existing roles are not a clean 1–6. `border` is rank 3,
`text` is rank 4, `tint` is the rank-1 wash, and `on-tint` has no rank at all
because it is solved against the tint rather than the surface. So it lands as
`contrast-1/3/4` plus one off-ladder token, and filling in 2/5/6 for every
family would cost ~960 declarations — emit only ranks that have consumers.

Doing nothing is also defensible: the entire deleted surface is 30 read sites
across 9 files.
