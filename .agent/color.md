# Interop — Colour

Two axes, generated, relative to the current layer. A component declares *that it is a layer*, never which grey it is.

## The rule that broke this twice

**`var()` draws from the computed value of the custom property on the SAME element.** css-variables-1 §2. Declarations in one rule block see each other.

So this does not work, and cannot be made to work:

```css
/* WRONG — all of these collapse to whichever slot the block did not redeclare */
:where([itx-raise]) {
  --_e-0:  var(--_e-p1);
  --_e-p1: var(--_e-p2);
  --_e-p2: var(--_e-p3);
}
```

`--_e-0` resolves through the chain to the inherited `--_e-p3`, and so does every other slot. The old `docs/ELEVATION_SYSTEM.md` claimed the opposite ("resolve against inherited (parent) values, not sibling declarations"), the sliding-window elevation system was built on that claim, and it never worked — 154 lines with zero consumers. A block containing `--_e-p3: var(--_e-p3)` is worse still: a self-edge is a cycle, cycles are *guaranteed-invalid*, and guaranteed-invalid **inherits**, so the whole subtree went transparent.

`--x: calc(var(--x) + 1)` is the same mistake in one line. **An inherited custom property cannot increment itself.**

`elevation-legacy.spec.ts` pins all of this down against the real old CSS. Read it before proposing anything that looks like a shift register.

## The two axes

They are different *kinds* of thing, so they are written differently and cannot be spelled in each other's notation.

| | Elevation | Contrast |
|---|---|---|
| written as | a spatial word | a bare scalar |
| direction, light | toward light | toward dark |
| direction, dark | toward light | toward light |
| scheme-symmetric | **yes** | **no — flips** |
| has an inherited "current" | yes (`--itx-layer`) | no — always reads off the current surface |
| compounds | yes | never |
| hue variants | no | yes — same rank, any family |

```
ELEVATION — the neutral substrate. Backgrounds only.
  --itx-surface  --itx-surface-above  --itx-surface-above-2  --itx-surface-below
  attributes: itx-layer · itx-sink · itx-layer="N" (absolute pin)

CONTRAST — everything drawn on top. Washes, dividers, borders, icons, text.
  --itx-contrast-1 … -6        --itx-contrast-<family>-N
```

**A rank is a contrast target, not a grey.** Rank 3 means "3:1 against whatever I am sitting on". That is what keeps it correct at every depth without anyone re-picking it, and what will let it survive a hue change — the recorded amber failure was a lightness *slot* that could not, forcing `--itx-colorway` to be hand-repointed from slot 8 to 5.

| rank | intent | floor |
|---|---|---|
| 1 | wash — hover fills, stripes, selected tints | perceptible (≥ 0.02 L) |
| 2 | hairline, dividers | 1.5:1 |
| 3 | border, emphasis edge | 3:1 |
| 4 | secondary text | 4.5:1 |
| 5 | body text | 7:1 |
| 6 | maximum | as far as the scheme allows |

There is **no role-alias vocabulary** (`--itx-hairline`, `--itx-ink`…). A second set of names rebuilds the "which do I reach for?" problem the ranks exist to remove.

**Washes are contrast, not elevation.** Settled by direction: in light mode a hover wash goes *darker* while elevation goes *lighter*. Carbon's `$layer-hover` behaves the same way. A row hover is `--itx-contrast-1`, not half a layer up.

## How the counter works

`@container style()` — a container query is evaluated against the nearest **ancestor** container, never the element itself, so there is no cycle. Every element is a style container by default (`container-type: normal` still answers style queries), and because `--itx-layer` inherits it compounds through arbitrary intermediate DOM.

Three tiers in source order, all `:where()` zero-specificity (`@container` adds none), so later simply wins:

1. Layer 0, unconditional. **Not** inside `@container` — if `[interop-root]` is `<html>` it has no ancestor container and the query is never known.
2. A one-step floor for `[itx-layer]` / `[itx-sink]`. Browsers without style queries stop here: one step, not compounding. A defensible degradation, not a broken page.
3. The counter, unrolled −2…4, with terminal blocks at both ends that re-assert without moving. Without those, an element at the ceiling matches no block, falls through to tier 2, and snaps back to 1.

Absolute pins come last, so a dialog does not inherit depth from wherever it happens to sit.

Style queries reached Baseline newly-available 2026-05-19 (Firefox 151). That is the one real dependency, and tier 2 is why it is survivable.

## Generated, not hand-written

`scripts/generate-color-ladder.mjs` owns everything and emits:

- `styles/themes/protocol/ladder.css` — theme: the lightness **numbers**
- `styles/tokens/elevation.css` — foundation: the engine
- `styles/tokens/ladder.css-source.ts` — the same CSS as strings, so `elevation.spec.ts` exercises the real file rather than a replica that could drift

Surfaces are art-directed (perceptual ramps are not a formula, and light has a ceiling at white). Contrast ranks are **solved** — pushed away from their own surface only as far as the floor requires. Because they are solved per surface, running out of headroom fixes itself: dark layer 4 lands rank 4 at L .751 for a true 4.5:1, where a hand-tabulated .790 would have given 3.4:1.

`npm run check:color` validates without writing. It fails the build if any rank misses its floor or two adjacent surfaces are under 0.02 L apart. This replaces the manual canvas audit of commit `fc6f2ac3`.

**The theme publishes numbers, not finished colours.** If it published `light-dark(oklch(0.93 var(--itx-tint-light)), …)`, that `oklch()` would compose at `[interop-root]` and the tint would bake there — so a retint on any other ancestor would do nothing. Handing over bare lightness moves composition into the layer blocks, which are re-declared at every boundary, so lightness *and* tint both stay live and overridable at any depth.

Both schemes ride inside one `light-dark()` because `color-scheme` is `light dark` and, while it computes to that, **nothing in CSS can observe which scheme is active** — not `@supports`, not a style query, not `@container`. Only `light-dark()` knows. Scheme-varying numbers therefore have to travel inside a colour function.

Relative colour syntax (`oklch(from …)`) is deliberately unused: per the same late-binding limit it buys nothing at the token layer, and it is the newest colour dependency in the stack.

## Overriding

The rules precede the componentry — components cohere because none of them chose. That must never make overriding harder.

> **The generic vocabulary is a source, never an override point.** `--itx-surface*` and `--itx-contrast-*` are written *only* by the engine. Components alias them into their own namespace (`--itx-dialog-background: var(--itx-surface)`); consumers override the namespace, which no layer block touches.

Setting the generic `--itx-surface` on an ancestor **is** stomped at the next boundary — necessarily, since every layer block re-declares it. That is asserted in `elevation.spec.ts` as a negative case so the reason stays visible.

To move the palette instead, set `--itx-tint-light` / `--itx-tint-dark` (chroma + hue), or one of the ramp **dials** — `--itx-ramp-{light,dark}-{page,step,ease,down,min,max}` — on any ancestor. Both reach every layer below.

> **Surfaces are computed, not tabulated.** The engine derives every layer's lightness from those six numbers per scheme:
>
> ```
> clamp(min, page + step·(1 − ease^max(0,n))/(1 − ease) + down·min(0,n), max)
> ```
>
> which is why one dial retunes the whole ladder at once, live, with no regeneration. A uniform ramp (`ease: 1`) gets the plain multiplication — `1/(1 − ease)` cannot divide by zero.
>
> The per-layer `--itx-ramp-surface-N-light` / `-dark` numbers this replaced **no longer exist**. They moved one rung; a dial moves all of them. `elevation.spec.ts` asserts their removal so it stays visible.
>
> Contrast ranks and accent roles are still published per layer and still enumerated by the engine. They are *solved* against their surface rather than derived from it, and a solver's output cannot be reached by `calc()`.

## Enforcement

`npm run lint:tokens` runs `check-color-axes.mjs`: an elevation token on a mark property fails, and a text-level rank (4–6) used as a fill fails. Low ranks as fills are correct — that is what a wash is.

Convention did not hold this split. `--itx-border` said one thing while four separate files independently re-derived `--itx-neutral-7` as "the house hairline", and grep — the only detector — missed three global-token stomps. So it is a build error.
