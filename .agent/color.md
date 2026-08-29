# Interop — Colour

One relative axis and one absolute vocabulary. A component declares *that it is a layer*, and picks a *step* for everything it draws on top.

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

**This is also why roles are re-declared in every palette block.** `--itx-danger-tint: var(--itx-danger-3)` written once at `[interop-root]` composes *there* and inherits as a finished colour, so a descendant carrying `[itx-status-palette="eighties"]` would keep the root's roles even though it redeclares every step. Same rule, different victim.

## The two things

They are different *kinds* of thing, so they are written differently.

| | Elevation | The palette |
|---|---|---|
| written as | a spatial word | a family and a number |
| what it is | the neutral substrate | everything drawn on top |
| relative to | the current layer | nothing — absolute |
| moves with depth | **yes** | **no** |
| scheme-symmetric | yes — toward light in both | no — each step carries both arms |

```
ELEVATION — backgrounds only. Computed, not tabulated.
  --itx-surface  --itx-surface-above  --itx-surface-above-2  --itx-surface-below
  attributes: itx-layer · itx-sink · itx-layer="N" (absolute pin)

THE PALETTE — washes, borders, icons, text.
  --itx-neutral-1…14  --itx-colorway-1…14  --itx-danger-1…14  (success, warning, info)
  roles: --itx-<family>-tint / -border / -text / -on-tint / -solid / -on-solid
```

**A step is one colour, everywhere.** That is the whole bargain. The old system's ranks were contrast *targets* re-solved against whatever surface they landed on, which held contrast automatically but cost a 2270-line solver and could not be held in anyone's head. Position now carries the guarantee instead, and the guarantee is measured rather than solved.

## The floor rule

> **Borders 7 steps from the background. Text 8. Enhanced text 10.**

One rule, every family, both schemes — because every family shares one lightness envelope, so step 9 is L .596 whatever the hue. Settled 2026-08-21 at 14 steps, curve 1.30; the evidence, including why 16 steps fragments and why a linear ramp reads as accelerating, is in `.agent/records/palette-spike.md`.

Chroma erodes it. A saturated family loses luminance at the same lightness, which is why the eighties `danger` arm had to be re-derived downward — at hue 25 the chroma ceiling for a 4.5:1 step 9 is about .134, and no lightness nudge fixes it without kinking an even ramp.

## Roles sit one tier further out

`--itx-<family>-border` is step **9**, not the 8 the rule's minimum would give. That is not slack.

Palette steps are page-relative and fixed; the surface climbs with elevation. By the deepest layer the background has moved about two steps up the ramp, so a role chosen against the page alone lands under its floor at depth. Measured, at dark layer 2:

| border step | worst family | ratio |
|---|---|---|
| 8 | danger | **2.99** ✗ |
| 9 | danger | 3.97 ✓ |
| 10 | danger | 5.30 — reads as a rule, not an edge |

The tint is step **3** for the same reason: step 2 (L .199) inverts against layers 1 and 2 (L .202, .234), so a callout inside a card would be darker than the card.

This was the deliberate trade — see "Position wins" in the decision record. Depth safety now comes from the ramp being short (`DEPTH.above` is 2), not from re-solving.

## How the counter works

`@container style()` — a container query is evaluated against the nearest **ancestor** container, never the element itself, so there is no cycle. Every element is a style container by default (`container-type: normal` still answers style queries), and because `--itx-layer` inherits it compounds through arbitrary intermediate DOM.

Three tiers in source order, all `:where()` zero-specificity (`@container` adds none), so later simply wins:

1. Layer 0, unconditional. **Not** inside `@container` — if `[interop-root]` is `<html>` it has no ancestor container and the query is never known.
2. A one-step floor for `[itx-layer]` / `[itx-sink]`. Browsers without style queries stop here: one step, not compounding. A defensible degradation, not a broken page.
3. The counter, unrolled, with a terminal block at the ceiling that re-asserts without moving. Without it, an element at the ceiling matches no block, falls through to tier 2, and snaps back to 1.

Absolute pins come last, so a dialog does not inherit depth from wherever it happens to sit.

Style queries reached Baseline newly-available 2026-05-19 (Firefox 151). That is the one real dependency, and tier 2 is why it is survivable.

## Hand-authored, and measured

Both files are source. Edit them directly.

- `styles/themes/protocol/ladder.css` — the palette: literal `oklch()` per step, plus the tint packs, the ramp dials and the roles.
- `styles/tokens/elevation.css` — the engine: the counter and four `clamp()` formulas. 212 lines, and no colour payload at all.

`scripts/inline-css-fixture.mjs` copies both into `ladder.css-source.ts` as strings, because Karma runs in a browser and cannot read files. It derives nothing.

**Two checks, and they measure different things.** Both run in `npm run lint`.

| | reads | proves |
|---|---|---|
| `check-contrast-render.mjs` | the literal values in `ladder.css` | the floor rule, over every palette — 132 pairings |
| `check-contrast-css.mjs` | the real cascade, in Chrome, at every depth | that each **role** clears its floor as a consumer receives it — 96 pairings |

The first cannot see whether a role points where it claims; the second cannot see a step nobody has wired up yet. Neither is redundant.

> **The theme publishes both arms inside one `light-dark()` per step.** `color-scheme` is `light dark` on `[interop-root]`, and while it computes to that, **nothing in CSS can observe which scheme is active** — not `@supports`, not a style query, not `@container`. Only `light-dark()` knows. So scheme-varying values have to travel inside a colour function.

## Overriding

The rules precede the componentry — components cohere because none of them chose. That must never make overriding harder.

> **`--itx-surface*` is a source, never an override point.** It is written *only* by the engine, which re-declares it at every layer boundary, so a value set on an ancestor is stomped at the next one. Components alias it into their own namespace (`--itx-dialog-background: var(--itx-surface)`); consumers override the namespace, which no layer block touches. Asserted as a negative case in `elevation.spec.ts` so the reason stays visible.

**Palette steps are ordinary tokens** and carry none of that. `--itx-neutral-8: <anything>` on any ancestor reaches everything below it, because no layer block redeclares it. That is the practical dividend of making them absolute.

To move the surfaces instead, set `--itx-tint-light` / `--itx-tint-dark` (chroma + hue), or a ramp **dial** — `--itx-ramp-{light,dark}-{page,step,ease,min,max}`.

> **Surfaces are computed, not tabulated:**
>
> ```
> clamp(min, page + step·layer, max)
> ```
>
> which is why one dial retunes the whole ladder at once, live, with no build step. Drag one in devtools and every layer moves.

## Enforcement

`npm run lint:tokens` runs `check-color-axes.mjs`: an elevation token on a mark property fails, and so does a self-referencing custom property.

Its two sibling rules — wash-rank-as-text and text-rank-as-fill — were **retired with the ranks**, deliberately. Both keyed on `--itx-contrast-N`; once those tokens went the rules matched nothing and passed vacuously, which is worse than no rule. They have no palette equivalent, because a step carries no reserved job: `--itx-danger-3` as a fill is correct and `--itx-danger-11` as text is correct, and neither is inferable from the number. Measurement replaced them.

Convention did not hold the axis split either. `--itx-border` said one thing while four separate files independently re-derived `--itx-neutral-7` as "the house hairline", and grep — the only detector — missed three global-token stomps. So it is a build error.
