# Interop — Colour

A component declares that it is a layer. Its surface follows from the depth it
sits at. Everything it draws on that surface it names by the job the colour
does.

## The two things

**The substrate** is six authored values. The engine indexes them from depth.

```
--itx-surface-1 … -6            values, one sequence
--itx-surface  -above  -above-2  -below      pointers, written from depth
attributes: itx-layer · itx-sink · itx-layer="N"
```

Depth maps 0 → surface-2, 1 → surface-4, 2 → surface-5. `-above` and `-below`
name the surface the next layer would paint, and they are the same value: a
raise and a recess at the same depth are the same colour, and the shadow is
what separates them.

1 to 3 are the ground, 3% apart; 4 to 6 sit on it, 5% apart. Spacing tracks how
often two members sit side by side. Depth never lands on 1, 3 or 6 — a
component that wants page-level texture reads those directly.

**The roles** are everything drawn on top, named by job.

```
--itx-role-text  -quiet  -quieter  -disabled     the far end, 7:1, 4.5:1, 3:1
--itx-role-text-{family}  -text-inverse
--itx-role-background-interactive                hover and selected
--itx-role-background-control                    a filled control's own plane
--itx-role-background-{family}  -{family}-subtle the fill and the wash
--itx-role-edge  -edge-{family}  --itx-role-divider
--itx-role-scrim
```

`namespace · type · role · family · modifier`, both trailing segments optional.
One grammar in both slots: unmarked is full strength, a modifier is quieter.

Named for prominence, not brightness. A brightness word is true in one arm and
false in the other — the dark text ramp runs 0.664 to 0.970 while the light one
runs 0.489 to 0.150.

## A family is one hue

```css
--itx-danger-hue: 33;
--itx-accent-chroma: 0.16;
--itx-accent-chroma-subtle: 0.064;
```

At fixed lightness and chroma, contrast barely moves around the hue circle.
Chroma is the variable that breaks it — spread across the five hues at L 0.60
is 0.06 at chroma 0.02, 0.42 at 0.105, 1.51 at 0.22. Capped at 0.16, every hue
clears its floor with no per-hue correction. Past 0.18 the correction comes
back, which is what the deleted solver used to compute.

Adding a family is one hue number and four derived roles.

## Two derived roles, and why they are different

`--itx-role-background-interactive` is the surface plus half a step;
`--itx-role-background-control` is a full step. Both use relative colour syntax
against `--itx-surface`, so they resolve to real values and both checks can see
them.

They are the only roles that move with depth. Everything else is absolute.

**Hover and selected share the interactive fill and do not compound.** At
+0.075 the room between the 7:1 tier and the far end collapses to 0.004 and the
top two text tiers stop separating. The difference between the two states is
carried by a mark, which needs 3:1 against *adjacent* colours — and a
component's two states are never adjacent, because they are the same pixels at
different times.

**The state ramp has two rungs and no more.** At +0.10 out from the surface,
three of the four text tiers stop clearing. A control that needs more states
than rest-and-one carries them with a mark or an edge.

## Two weights of one ink

The edge and the divider are `color-mix()` of `--itx-role-text` at two
opacities, so they hold as the surface climbs — the divider varies about 0.2
across every background it can land on, where an opaque border drifts 0.58
across three layers. The edge clears 3:1 everywhere; the divider has no floor.

Opacity is per-scheme, because contrast is not symmetric: the same 25% reads
about 2.15 on dark and 1.66 on light.

It has to be baked into the colour, not carried as a number. `light-dark()`
takes `<color>` only, so `light-dark(33%, 25%)` silently resolves the whole
`color-mix` to transparent — 1.00:1, and it looks like a border that is not
there.

## Two rules that break this

**`var()` draws from the computed value on the same element.** css-variables-1
§2. Declarations in one rule block see each other, so a chain of slots
redeclared in one block collapses to whichever slot the block did not
redeclare. An inherited custom property cannot increment itself:
`--x: calc(var(--x) + 1)` is a self-cycle, cycles are guaranteed-invalid, and
guaranteed-invalid inherits, which takes the subtree with it.

`elevation-legacy.spec.ts` pins this against the CSS that failed it. Read it
before proposing anything shaped like a shift register.

**A block that redeclares a family's hue must redeclare its roles.** Same rule,
applied to the palette. A role written at `[interop-root]` composes there and
inherits as a finished colour, so a descendant carrying
`[itx-status-palette="eighties"]` would keep the root's roles — the swap reads
correctly in the stylesheet and does nothing on screen. `accents.spec.ts`
asserts both directions.

The six surfaces are the deliberate exception: they are declared at the root
alone. Repeating them per layer would leave the tint unresolved until the
layer, so a mid-tree retint would reach it — but a declaration beats
inheritance, so every layer would also stomp whatever a consumer set above it.
Overriding is worth more, and it costs nothing: retinting a subtree is
redeclaring the surfaces on it, the same act as retuning the ramp.

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

- `styles/themes/protocol/ladder.css` — six surfaces, the roles, the hues, the
  tint packs and the chroma caps.
- `styles/tokens/elevation.css` — the counter and the depth-to-surface lookup.
  It holds no colour.

`scripts/inline-css-fixture.mjs` copies both into `ladder.css-source.ts` as
strings, because Karma runs in a browser and cannot read files.

## Checks

Both run in `npm run lint`, and they differ in mechanism rather than only in
manifest.

| | reads | proves |
|---|---|---|
| `check-contrast-render.mjs` | the ladder's literals, resolved by substitution | every value clears its floor, 2228 pairings |
| `check-contrast-css.mjs` | the real cascade in Chrome, at every layer | each role clears its floor as a consumer receives it, 204 pairings |

Only the first reaches surfaces 1, 3 and 6, which depth never lands on, and
only it can verify a value before anything wires it up. Only the second sees
whether a component's token points where it claims. Both are needed.

A translucent foreground is composited over its real background in both. Over
black instead, the edge reads 2.44 against the 3.10 it renders.

`check-color-axes.mjs` fails an elevation token on a mark property, a raw
palette step where a role exists, and a self-referencing custom property.

`check-token-placement.mjs` fails a theme declaration co-declared at the
elevation boundaries, with one exemption for a value derived from
`--itx-surface` — that one composes where it is declared and has nowhere else
to go.

## Overriding

Every library selector is zero-specificity and sits inside the `interop` cascade
layer, so any rule a consumer writes wins on contact.

**Change one component.** Set its own token. No layer block touches it.

```css
--itx-dialog-background: var(--itx-role-background-interactive);
```

**Change a role everywhere.** Roles are declared once and inherit.

```css
--itx-role-edge: oklch(0.55 0.01 250);
```

**Move every surface.** Redeclare the surfaces, or the tint pack supplying
their chroma and hue.

```css
--itx-tint-dark: 0.012 30;
--itx-surface-2: light-dark(
	oklch(0.97 var(--itx-tint-light)),
	oklch(0.2 var(--itx-tint-dark))
);
```

**`--itx-surface` is a source, not an override point.** The engine rewrites it
at every layer boundary, so a value set on an ancestor is replaced one layer
down — and so are the two fills derived from it. `elevation.spec.ts` asserts
this as a negative case.

## Reference

`.agent/records/color-naming.md` — why the vocabulary reads the way it does,
the names rejected and what for, and the nine-system survey that found no
convention to copy.

`.agent/todo/colour-followups.md` — what is deferred.

The demo's Colour page measures all of the above live at `/foundation/color`.
