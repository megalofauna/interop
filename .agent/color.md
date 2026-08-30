# Interop — Colour

A component declares that it is a layer. Its surface follows from the depth it
sits at. Everything it draws on that surface it names from a palette of fixed
steps.

## The two things

**Elevation** is the background. It moves with depth.

```
--itx-surface  --itx-surface-above  --itx-surface-above-2  --itx-surface-below
attributes: itx-layer · itx-sink · itx-layer="N"
```

**The palette** is everything drawn on top. A step is one colour at every depth
and in both schemes.

```
--itx-neutral-1…14  --itx-colorway-1…14
--itx-danger-1…14  --itx-success-1…14  --itx-warning-1…14  --itx-info-1…14
roles: --itx-<family>-tint / -on-tint / -border / -text / -solid / -on-solid
```

Neutral has steps and no roles. The four status families and the colourway have
both. One colourway ships.

## The floor rule

Contrast comes from the distance between two steps, counting from the
background.

| distance | clears |
|---|---|
| 7 steps | 3:1 |
| 8 steps | 4.5:1 |
| 10 steps | 7:1 |

One rule covers every family in both schemes, because every family sits on one
lightness ramp. Step 9 is L .596 whatever the hue.

Chroma costs contrast. Two steps at the same lightness measure differently if
one carries more chroma, so a saturated family reaches its ceiling earlier. Run
the checks on a new family rather than assuming the distances hold.

## Roles sit one step further out

`--itx-<family>-border` is step 9. The rule's minimum is 8.

A step is fixed and the surface climbs, so a pairing measured on the page reads
closer once it is nested. Roles are placed to hold at the deepest layer.
Measured at dark layer 2:

| border at | danger reads |
|---|---|
| step 8 | 2.99:1 |
| step 9 | 3.97:1 |

The tint is step 3 for the same reason. Step 2 is L .199 and the surface reaches
L .234, so a step-2 tint inverts against a card.

## Two rules that break this

**`var()` draws from the computed value on the same element.** css-variables-1
§2. Declarations in one rule block see each other, so a chain of slots
redeclared in one block collapses to whichever slot the block did not
redeclare. An inherited custom property cannot increment itself:
`--x: calc(var(--x) + 1)` is a self-cycle, cycles are guaranteed-invalid, and
guaranteed-invalid inherits, which takes the subtree with it.

`elevation-legacy.spec.ts` pins this against the CSS that failed it. Read it
before proposing anything shaped like a shift register.

**A block that redeclares a family's steps must redeclare its roles.** Same
rule, applied to the palette. `--itx-danger-tint: var(--itx-danger-3)` written
at `[interop-root]` composes there and inherits as a finished colour, so a
descendant carrying `[itx-status-palette="eighties"]` keeps the root's roles.
`accents.spec.ts` asserts both directions.

## The counter

`@container style()` evaluates against the nearest ancestor container, never the
element itself, so there is no cycle. Every element answers style queries by
default, and `--itx-layer` inherits, so depth compounds through arbitrary DOM.

Three tiers in source order, all `:where()` zero-specificity:

1. Layer 0, unconditional, outside `@container`. If `[interop-root]` is `<html>`
   it has no ancestor container and the query is never known.
2. A one-step floor for `[itx-layer]` and `[itx-sink]`. Browsers without style
   queries stop here and get one step instead of compounding.
3. The counter, unrolled, with a terminal block at the ceiling that re-asserts
   without moving. Without it an element at the ceiling matches no block and
   falls back to tier 2.

Absolute pins come last so a dialog does not inherit depth from where it sits.

Adding a layer means adding a `@container` block and a pin. This is the one part
of the system that cannot be a custom property.

Style queries reached Baseline newly-available 2026-05-19 (Firefox 151). Tier 2
is what makes that survivable.

## Source files

Both are hand-authored. Edit them directly.

- `styles/themes/protocol/ladder.css` — the palette, the tint packs, the ramp
  dials, the roles.
- `styles/tokens/elevation.css` — the counter and four `clamp()` formulas.

`scripts/inline-css-fixture.mjs` copies both into `ladder.css-source.ts` as
strings, because Karma runs in a browser and cannot read files.

## Checks

Both run in `npm run lint`.

| | reads | proves |
|---|---|---|
| `check-contrast-render.mjs` | the literal values in `ladder.css` | the floor rule over every palette, 120 pairings |
| `check-contrast-css.mjs` | the real cascade in Chrome, at every layer | each role clears its floor as a consumer receives it, 96 pairings |

The first cannot see whether a role points where it claims. The second cannot
see a step nothing has wired up. Both are needed.

`check-color-axes.mjs` fails an elevation token used on a mark property, and
fails a self-referencing custom property.

## Overriding

Every library selector is zero-specificity and sits inside the `interop` cascade
layer, so any rule a consumer writes wins on contact.

**Change one component.** Set its own token. No layer block touches it.

```css
--itx-dialog-background: var(--itx-neutral-2);
```

**Change a step everywhere.** Steps are declared once and inherit.

```css
--itx-neutral-8: oklch(0.55 0.01 250);
```

**Move every surface.** Set a ramp dial or a tint pack on any ancestor.

```css
--itx-ramp-dark-page: 0.20;
--itx-tint-dark: 0.006 250;
```

Surfaces are computed as `clamp(min, page + step × layer, max)`, so one dial
retunes the whole ladder live.

The ramp dials move the surface. The palette does not follow, and `--itx-neutral-1`
restates the page lightness rather than referencing it. Dark has roughly +0.05 of
headroom before a role drops under its floor; `npm run lint` reports the moment
it does.

**`--itx-surface` is a source, not an override point.** The engine rewrites it at
every layer boundary, so a value set on an ancestor is replaced one layer down.
`elevation.spec.ts` asserts this as a negative case.

## Reference

`.agent/records/palette-spike.md` — why 14 steps at curve 1.30, and why 16
fragments.

`.agent/records/color-naming.md` — the job list, the open naming question, and
why there is no industry convention to copy. Read it before renaming a role.

`.agent/todo/colour-followups.md` — what is deferred.

The demo's Colour page measures all of the above live at `/foundation/color`.
