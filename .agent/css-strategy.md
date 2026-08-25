# Interop — CSS Strategy

## Two-file split

Every component has exactly two CSS files:

| File | Purpose | Contains |
|---|---|---|
| `src/lib/styles/components/X.css` | Structure | Layout, display, flex/grid, overflow, scroll-snap, pseudo-elements, nested interaction-state blocks |
| `src/lib/styles/themes/protocol/components/X.css` | Values | Colors, borders, radii, shadows, font-weight, spacing tokens |

Both are imported globally — no per-component `styleUrl`. Consumers get component styles by importing the library's global CSS.

The theme assigns **custom properties only** — never a real CSS property. Base values go on `[interop-root] X`; values may also be scoped to host-level variant/state selectors (e.g. `X.--stuck`). The theme never owns element interaction-state selectors (`:hover`, `:focus-visible`, `[aria-current]`) — those live in structural. See *Stateful parts* and *Host-level state & variants*.

## Cascade layers

Everything the library ships is imported into the `interop` cascade layer, split into two sub-layers declared in precedence order:

```css
@layer interop.foundation, interop.theme;

@import "./components/button.css" layer(interop.foundation);
@import "./protocol/components/button.css" layer(interop.theme);
```

**Every new `@import` in `interop.css` or a theme file must carry its `layer()`.** An import without one lands unlayered and silently outranks every consumer stylesheet.

Why the layer is load-bearing, and not redundant with `:where()`: **unlayered rules beat layered rules regardless of specificity.** Zero specificity alone therefore does *not* deliver "consumer overrides always win" — against a consumer using Tailwind v4 (or any native `@layer`), unlayered library CSS at `(0,0,0)` wins over a layered utility at `(0,1,0)`. The layer is what makes the contract true.

The division of labour:

| Mechanism | Settles ordering |
|---|---|
| `:where()` | *inside* the library |
| `@layer` | *against* the consumer |

Consumers who use layers should declare the order explicitly, naming interop first. Otherwise order follows first appearance, so importing Interop before Tailwind gives the same result:

```css
@layer interop, theme, base, components, utilities;
```

A custom theme that needs to outrank the shipped one claims `@layer interop.theme` and still sits below all consumer CSS.

## Zero specificity

Every selector in structural CSS is wrapped in `:where()`:

```css
:where(interop-stepper > .interop-stepper__nav) { ... }
```

This means specificity = `(0,0,0)` for every library rule, so ordering within the layer never depends on selector weight and no `!important` is needed.

**Critical exception — pseudo-elements**: Pseudo-elements cannot go inside `:where()`. The spec disallows it and browsers silently drop the rule. The correct pattern:

```css
/* WRONG — silently dropped */
:where(li[interop-step]:not(:last-child)::after) { ... }

/* CORRECT — pseudo-element goes outside :where() */
:where(li[interop-step]:not(:last-child))::after { ... }
```

**Nested state blocks — keep `:where()` on the inner pseudo**: write `&:where(:hover)`, not `&:hover`. Inside a `:where()` rule a bare `&:hover` compiles to `:where(…):hover`, which leaks `(0,1,0)`; wrapping the pseudo keeps the whole chain at `(0,0,0)`.

## Token naming pattern

Tokens follow `--itx-[component]-[part]-[property]-[state]`:

```
--itx-pn-link-color
--itx-pn-link-color-hover
--itx-pn-link-border-color-current
```

The `-[state]` suffix is **optional** — declare it only where a state differs from base (see *Stateful parts*). A flat, inheritable token like `--itx-pn-link-color-hover` is a selector-free lever a consumer can set on any ancestor; that is precisely why state stays a suffixed token rather than one contextually-rebound value. (We evaluated collapsing all states into a single re-bound token — it reads well for the author but forces consumers to write state *selectors* to override one state. Rejected on consumer ergonomics.)

`--_`-prefixed names are private resolved slots — internal to a rule block, not consumer API. They are a niche tool for composing several public tokens into one value, NOT the default mechanism for states (that is the nested pattern below).

**Nothing enforces that.** Custom properties inherit and have no encapsulation, so any component can read another's `--_` slot, and the compiler will not complain. It has happened once: the stepper's cancel button bound `[color]="'var(--_icon-color)'"`, reaching into `button.css`. It worked, which is why it survived — and it meant half of the button's icon-colour mechanism lived in a different component, so a bug in the button's fallback chain could only be found by reading the stepper.

Two rules follow.

*If you are tempted to read another component's `--_` slot, the owning component has an unfinished public API.* Finish it there. The button now publishes its resolved icon colour onto `--itx-icon-color`, the icon component's own public token, so the value crosses the boundary through documented API in one direction only.

*Cross-boundary private reads are cheap to detect.* `npm run lint:tokens` (`scripts/check-private-tokens.mjs`) fails the build on one.

It keys on the component NAME rather than the directory, because a component's code lives under `lib/components/<name>/` while its stylesheet lives under `lib/styles/components/<name>.css` — a directory comparison reads that split as a violation. It also counts `setProperty("--_x", …)` as a declaration, so a component setting its own private from its own TypeScript (the toast does this for swipe offsets) is correctly not a finding.

Validated in both directions: clean against the current tree, and it exits non-zero on exactly the stepper's `--_icon-color` read when pointed at the commit before that binding was removed.

## Stateful parts (hover / active / focus / …)

A part that varies by interaction is **one nested block**: the base declares each property once; each state is a nested `&:where(:state)` block redefining only what changes. Structural owns the state *selectors*; the theme provides flat per-state value tokens.

```css
/* structural */
:where(itx-page-nav a, itx-page-nav .itx-pn__link) {
  color: var(--itx-pn-link-color);
  border-bottom: var(--itx-pn-link-border-width) solid var(--itx-pn-link-border-color);

  &:where(:hover) {
    color: var(--itx-pn-link-color-hover, var(--itx-pn-link-color));
    border-bottom-color:
      var(--itx-pn-link-border-color-hover, var(--itx-pn-link-border-color));
  }
  &:where([aria-current]) {
    color: var(--itx-pn-link-color-active, var(--itx-pn-link-color));
  }
  &:where(:focus-visible) {
    outline: var(--itx-pn-focus-width) solid var(--itx-pn-focus-color);
    outline-offset: var(--itx-pn-focus-offset);
  }
}
```

- **Nest with `&:where(:state)`, not `&:state`.** A bare `&:hover` compiles to `:where(…):hover` and leaks `(0,1,0)`. Wrapping the inner pseudo keeps the whole chain at `(0,0,0)`.
- **Every state value falls back to base:** `var(--x-state, var(--x))`. An undeclared / renamed / commented-out state token then degrades to base, instead of going *invalid at computed-value time* (which silently drops to inherited/initial and renders wrong). Fall back to the *base* token, **never to itself** — `var(--x, var(--x))` is a cycle and computes to invalid.
- **The theme declares only deltas.** Because undeclared states inherit base, there is no mandatory parallel `-hover`/`-active`/`-focus` per property — only the ones that actually change.
- **Focus stays structural, and reads the system chain.** The `:focus-visible` rule lives here — the ring is an accessibility floor structural must guarantee, so it is never a theme-side value a theme could forget. But the VALUES come from `styles/tokens/focus.css`, via a three-tier chain:

  ```css
  outline: var(--itx-chip-focus-width, var(--itx-focus-width))
  	var(--itx-chip-focus-style, var(--itx-focus-style))
  	var(--itx-chip-focus-color, var(--itx-focus-color));
  outline-offset: var(--itx-chip-focus-offset, var(--itx-focus-offset));
  ```

  The chain is what makes an override work at any level: both tokens stay unresolved until the element, so `--itx-focus-color` set on any ancestor reaches it. Declaring a theme alias (`--itx-chip-focus-color: var(--itx-focus-color)`) on `[interop-root]` does NOT — a custom property is substituted where it is declared, so it bakes at the root and every other override silently does nothing. That was the previous shape, and it is why 54 theme declarations collapsed to 5.

  A component declares a `--itx-<comp>-focus-*` token only where it genuinely deviates — the inset group (`tree`, `segment`, `list-row`, `expansion-panel`, `chip-remove`, `field`) sets `-2px` because those ring inside their own box so stacked instances don't collide. A component with nothing to say declares nothing.

  Use `:focus-visible`, not `:focus`. A ring on bare `:focus` fires on mouse click, which is the noise that gets focus styles deleted wholesale; `outline: none` on `:focus` paired with a `:focus-visible` rule is the correct reset. `npm run lint:focus` enforces all of this — the chain, no hardcoded colours, and no visible ring on bare `:focus`.

  Rings inside `@media (prefers-contrast)` / `(forced-colors)` are exempt and keep `currentColor`: following the user's colours rather than the brand's is the entire point of high-contrast mode.
- **Ancestor-driven state is the one exception.** When a part's state comes from an *ancestor* (e.g. an indicator shown by its link's `[aria-current]`), it cannot self-nest — use a descendant selector kept beside the part's base rule:
  ```css
  :where(… .itx-pn__link[aria-current] .itx-pn__indicator) { opacity: 1; }
  ```

## Host-level state & variants

Element interaction states live in structural (above). Host-level **variants** and states — orientation classes, a sticky `--stuck` flag — differ: their *values* may be scoped in the **theme** to the host selector, because that is still only assigning custom properties:

```css
/* theme — reveal a surface when the sticky nav is pinned */
:where([interop-root] itx-page-nav.itx-pn--stuck) {
  --itx-pn-background: var(--itx-page);
}
```

The invariant that never bends: **the theme assigns custom properties only.** It may scope them (to `[interop-root]`, a variant, or a host state); it never sets a real CSS property, and never owns an element interaction-state selector — those are structural.

## Composite states

When two states combine into a distinct look (e.g. `[aria-current]:hover`), add an explicit nested block; two conditions naturally outrank either single one in source order at equal (zero) specificity:

```css
&:where([aria-current]:hover) { … }
```

Its state token still falls back — to the nearer single-state token, then to base:
`var(--x-active-hover, var(--x-hover, var(--x)))`.

## File structure & ordering

Uniformity is a goal in itself: across every component the two files should read the same, so that ideally the only thing differing between two components' files is the component name in the selectors and token names. Both files follow a fixed skeleton.

**Structural (`components|composites/X.css`):**
1. Header comment — purpose, the no-fallback contract note, a pointer to the theme for the token surface.
2. Host — `:where(X)` base, then host-state hooks (`X.--sticky`, `X.--stuck`, orientation).
3. Regions / parts in **DOM order**. Each stateful part is one nested block (base → `&:where(:state)` deltas → focus). Layout-only parts are plain blocks.
4. `@media` trailers last (`prefers-contrast`, and `prefers-reduced-motion` **only** for animations — see *Motion* below).

**Theme (`themes/protocol/.../X.css`):**
1. Header comment listing the full token surface, grouped by part.
2. `:where([interop-root] X) { … }` — all base values, grouped by part in the **same order** as the structural file; within a part, `base` then `state-deltas` then `focus`.
3. Host-state / variant blocks (`X.--stuck`, …) last — custom-property assignments only.

No dead commented-out tokens or rules land in a committed file: a token with no consumer is cruft, and an undeclared state already degrades to base.

## Motion

**Never write a literal duration.** Read `var(--itx-COMP-duration)`, declared in
the theme against one of `--itx-duration-speedy | fast | base | slow`. `fast` is
the house default for a micro-transition; almost everything uses it.

**Do not write a `prefers-reduced-motion` block for a transition.** Every
duration derives from `--itx-duration-base`, which `tokens/motion.css` sets to
`0ms` under the preference — so a component that reads the tokens honours it for
free. This used to be 28 hand-written blocks across 23 files, 26 of whose
declarations were an identical `transition: none`; a component that forgot the
block just ignored the preference, and nothing said so.

The reading is deliberately blunt — no motion at all. "Reduced" does not really
mean "none", and the presets under `styles/motion/` are where that nuance will
eventually live, but one rule that is always obeyed beats a per-component
judgement call that is usually forgotten.

**Animations are the exception and still need a block.** They carry their own
durations, which no token reaches. Stop the animation *and* park it in a sane
resting state — a caret frozen at `opacity: 0` reads as no caret at all:

```css
@media (prefers-reduced-motion: reduce) {
	:where(X) { animation: none; opacity: 1; }
}
```

`scroll-behavior`, `@starting-style` compensation and hover `transform`s are the
other legitimate survivors. `scripts/check-motion.mjs` enforces the rest, and a
`var()` fallback is a chain (allowed) while a literal fallback is a second source
of truth (rejected).

## Addressability — a value nobody can name is a value nobody can change

The theme is the single source of truth for every value. A declaration only
honours that if the value it produces is **addressable** — reachable by naming
one token. Two constructs quietly break it, and both report as the same bug:
*"I can't see a way to override this."*

### 1. A CSS-wide keyword as a value

```css
--itx-kbd-perspective: unset;      /* NOT "no perspective" */
--itx-button-corner-shape: unset;  /* NOT "no corner shape" */
--itx-button-background-hover: inherit;
```

`unset` / `inherit` / `initial` / `revert` apply to the **custom property**, not
to the property that reads it. `unset` on an inherited custom property means
*inherit*; with nothing declaring it above, that is guaranteed-invalid and the
reading declaration dies. Where an ancestor DOES declare it, you inherit that —
which is worse, because it resolves to the value you were trying to cancel.

This shipped three bugs, each of which looked deliberate in review: the kbd
keycap tilt never rendered, the button's squircle never rendered (with an
override block existing to undo it), and a toolbar's six hover/active
neutralisations resolved to `[interop-root]`'s own fills.

Write a real value. If you genuinely want the keyword, put it in the `var()`
**fallback slot**, where it is valid:

```css
font-family: var(--itx-cb-tab-font-family, inherit);
```

And if the component has no opinion, declare nothing — absence is how the theme
says that, and the structural fallback carries it.
`scripts/check-keywords.mjs` fails the build on all of them.

**The same keyword on a real property is the same bug** whenever that property
is also driven by a token. It shipped on the code-block tab:

```css
:where(itx-code-block .itx-cb__tab)                { border-radius: var(--itx-cb-tab-border-radius); }
:where(itx-code-block .itx-cb__tab:focus-visible)  { border-radius: inherit; }   /* ← */
```

Both zero-specificity, so the later rule won — and `inherit` means *the parent
element's computed value*, which was the **tablist's** radius. A focused tab
took a radius from a different box, named by no token. The reported symptom was
that changing `--itx-cb-tab-border-radius` did nothing.

The trap is that the identical line is *correct* on a pseudo-element, where the
"parent" is the generating element: `border-radius: inherit` on a `::before`
overlay means "clip me to my own element's corners" (`utilities/decoration.css`,
`composites/terminal.css`). Same words, opposite meanings, and only the selector
tells you which.

A blanket ban would be wrong — `color: inherit` and `font: inherit` on a
`<button>` are the standard UA reset and 25 of those ship. So only the decidable
slice is automated: **Rule 3 in `scripts/check-shape.mjs`** flags a CSS-wide
keyword on any radius outside a pseudo-element rule, because a parent's radius
is never what a component's own radius token meant.

### 2. A shorthand as a token value

```css
--itx-cb-tab-border: none;                                        /* was */
--itx-cb-tab-border-bottom: var(--itx-border-width-thick) solid transparent;
```

One token holding width + style + colour is one lever for three values. A theme
that wants a different colour must restate the width and the style with it, and
a **state rule cannot reach inside it at all** — which is why the code-block tab
needed a separate `--itx-cb-tab-border-bottom-color-hover` bolted on beside the
shorthand it could not modify.

Write longhands, and prefer logical ones:

```css
border-block-end-width: var(--itx-cb-tab-border-block-end-width, var(--itx-cb-tab-border-width));
border-block-end-style: var(--itx-cb-tab-border-block-end-style, var(--itx-cb-tab-border-style));
border-block-end-color: var(--itx-cb-tab-border-block-end-color, var(--itx-cb-tab-border-color));
```

Per-side and per-corner tokens fall back to a base one — the same
`var(--x-state, var(--x))` shape the state tokens use, and for the same reason:
an undeclared override degrades to the base instead of going invalid at
computed-value time and dropping the edge. The theme then declares only what
differs, so a complete surface costs the theme nothing to ignore.

`interop-tabs` and the code-block tab both expose this shape. Nothing lints it
yet; a shorthand's *value* is not distinguishable from a longhand's by regex
alone.

## Position a positioned box with INSET, never margin

If an element is `fixed`, `absolute`, `sticky`, or in the top layer, place it
with `inset-block-start` / `inset-inline-*` — not with `margin`.

```css
/* WRONG — a consumer's child reset silently wins */
:where(dialog[interop-command-palette]) {
	margin-block-start: var(--itx-cmdp-offset-block-start, 12vh);
}

/* RIGHT — no margin reset can reach an inset */
:where(dialog[interop-command-palette]) {
	inset-block-start: var(--itx-cmdp-offset-block-start, 12vh);
	inset-block-end: auto;
	margin-block: 0;
}
```

**Why, concretely.** The command palette hung its viewport offset on
`margin-block-start`. The demo app has an ordinary child reset in a component
stylesheet:

```scss
:host > * { margin-block: 0; }
```

Angular injects component styles **unlayered**, and unlayered beats every
cascade layer at any specificity — so that one line silently defeated the
library rule, and the palette computed `margin-block-start: 0px` and centred
itself. Nothing was wrong with the app's CSS. `margin` is simply one of the most
commonly reset properties in any codebase, and a library that hangs placement on
it is asking to lose a fight it cannot see.

`inset` is not reset by convention the way `margin` is, so the same app cannot
clobber it by accident.

**A second reason, independent of resets.** `margin: auto` placement on an
absolutely positioned box resolves through the over-constrained equation, which
is the part of dialog positioning where engines have historically diverged. An
inset states the position outright. Both forms measured identically in Chrome
(top = 12vh); only the inset form is robust.

**Scope.** Audited 2026-08-18: the palette was the only offender. Margins on
elements that are *not* positioned are fine and stay — the sr-only utility's
`margin: -1px` is part of the canonical clip recipe, and toast's
`margin-block-start` spaces a description under a message rather than placing
the toast. The rule is about PLACEMENT, not about avoiding margin.

**Related:** the same unlayered-beats-layered mechanic is why component
`styleUrl` sheets were removed from the library — see
`.agent/records/styleurl-migration.md`. The library no longer ships any, but
consumer apps still do, and this is what that costs them.

## Co-declaration — where an alias must be declared

A custom property is substituted **where it is declared**, using that element's
computed values. It then inherits as a finished value. So an alias is only as
live as the selector it sits on.

```css
/* WRONG — substitutes at the root and freezes layer 0's grey for the whole tree */
:where([interop-root]) {
	--itx-widget-background: var(--itx-contrast-2);
}

/* RIGHT — re-resolves wherever the input is re-declared */
:where([interop-root], [itx-layer], [itx-sink]) {
	--itx-widget-background: var(--itx-contrast-2);
}
```

**The rule: an alias must be declared on the same selector set as its input.**

Look up where the system token you are reading is declared, and match it:

| input | declared on | so co-declare on |
|---|---|---|
| `--itx-contrast-*`, `--itx-surface*` | `[interop-root]`, `[itx-layer]`, `[itx-sink]`, `[itx-layer="N"]` | `:where([interop-root], [itx-layer], [itx-sink])` |
| the radius / border-width / duration ramps | `[interop-root]`, `[itx-scale-scope]` | `:where([interop-root], [itx-scale-scope])` |
| `--itx-colorway-*` | `[interop-root]` only (colorway blocks are a **compound** selector on the root element) | `:where([interop-root])` is already correct |

`--itx-contrast-2` alone is declared **27 times** in `tokens/elevation.css`, once
per layer. That is the whole point of a rank: it is a contrast *target* against
the current surface, not a fixed gray. An alias on the bare root throws that away
silently — the component still renders, in a plausible gray, just the wrong one.

### Why not scope the block to the component instead

`:where([interop-root] button[interop-button])` also tracks the layer, and was
the first fix tried (tabs and progress shipped it briefly). It has a cost that is
easy to miss: it puts a declaration **on the component element**, and a
declaration always beats an inherited value. Region theming —
`.sidebar { --itx-button-background: … }` — stops working entirely.

Co-declaration keeps that working, with one documented exception: an `[itx-layer]`
between the overriding ancestor and the component reclaims the token, exactly as
`[itx-scale-scope]` does for radius. Both behaviors are asserted in
`tokens/elevation.spec.ts`, under "component aliases onto a rank".

### Enforcement

`scripts/check-shape.mjs` fails the build on an alias to a system token declared
on a bare `[interop-root]`, and names the remedy for the axis it caught. It did
not cover the color axes until 2026-08-17; 84 sites across 14 theme files had
accumulated behind that gap.

## Radius

`--itx-radius` is the global knob. A component that follows it puts the whole
chain in its **structural** rule and declares **no theme default**:

```css
border-radius: var(--itx-<c>-border-radius, var(--itx-radius-attr, var(--itx-radius)));
```

Absence of a theme default is how a component says "I have no opinion", and it
is load-bearing. The obvious alternative is the bug:

```css
/* WRONG — substitutes on the root and freezes there */
:where([interop-root]) { --itx-<c>-border-radius: var(--itx-radius); }
```

17 of 29 radius defaults were written that way. Pin a default only when the
shape is the point — a chip is a pill, a step indicator is a circle. "We draw it
square" is not a reason to pin; the knob defaults to `none`.

The same rule governs every cross-cutting token, radius or not: **an alias that
reads a system token must be declared on the component, never on
`[interop-root]`.** `scripts/check-shape.mjs` fails the build on both halves —
a literal radius, and a system token aliased at the root.

What makes this bug so durable is that it *half*-works. A media override
(reduced motion, high contrast) also targets the root, lands on the same
element, and still applies — so the behaviour everyone checks by hand looks
correct. Only a consumer's subtree override silently fails.

**Rescaling a subtree** needs more than a chain. A derived step
(`calc(var(--itx-radius-base) * 2)`) substitutes where it is declared, so a base
override below the root changes an input to a calculation that already ran. The
ramps are therefore re-declared on `[itx-scale-scope]`:

```html
<section itx-scale-scope style="--itx-radius-base: 8px">
```

That rescales radius, border width and duration for the subtree,
proportionally. It is opt-in rather than on `*` because the alternative is
re-declaring ~20 custom properties on every element in the document.
`tokens/baking.spec.ts` and `tokens/shape.spec.ts` hold all of this as
executable cases.

### Nested radii

`--itx-outer-radius` / `--itx-inner-radius` are a **container-published
contract**, not a root token pair. A container states its own painted radius and
the radius a child inset by its padding needs to sit flush in the corner:

```css
:where(fieldset[interop-segmented-control]) {
  --itx-outer-radius: var(--itx-segmented-control-track-border-radius, var(--itx-radius));
  --itx-inner-radius: max(0px, calc(var(--itx-outer-radius) - var(--itx-segmented-control-track-padding)));
}
```

Three rules, each of which was a shipped bug first:

- **Declare them on the container, never on `[interop-root]`.** A derived alias
  substitutes where it is declared. Measured: with `--itx-outer-radius:
  var(--itx-radius)` on the root, a subtree setting `--itx-radius: 16px` still
  reads `4px`. `check-shape.mjs` Rule 2 does *not* catch this one — its selector
  test matches the bare `:where([interop-root])`, not the ramp block's
  two-selector form.
- **The outer value must be the token the container actually paints with.** The
  segmented control set it to an unrelated ramp step, so the "outer" radius was
  the outer radius of nothing: the track painted 4px, the pill 2px, and moving
  the token moved neither.
- **`max(0px, …)`, and spell the unit.** The subtraction goes negative whenever
  padding exceeds radius — the *default* case — and a negative radius kills the
  declaration. `max(0, …)` is invalid: calc and max cannot mix a unitless number
  with a length.

Consumers read it as `var(--itx-inner-radius, var(--itx-radius))`; that fallback
is the "no container published one" case and resolves at the reading element, so
nothing needs declaring at the root. `indicator.css` and `visimorph.css` both do
this, which is why a checkbox inside a segmented control takes the track's inner
corner. A component that pins its own radius token on top of that chain opts out
of the whole mechanism — which is what made this inert for two rounds.

## The globals file

`styles/interop.globals.css` is GENERATED by `scripts/generate-globals.mjs` and is
the one place a consumer sets global levers. Do not hand-edit it; add a knob to the
`GROUPS` table in the generator instead. Every default is READ from the library
source, and `--check` (wired into `lint:tokens`) fails the build when they drift.

Two things the generator exists to get right, both of which bit during its own
construction:

- **Preference overrides must travel with the knob.** A consumer's copy is
  *unlayered*, so it outranks every layered rule regardless of specificity or media
  query. Emitting `--itx-duration-base: 200ms` alone silently disables
  `prefers-reduced-motion` for that whole app. The generator detects a token's
  at-rule overrides and re-emits them beneath it.
- **Read declarations with at-rules stripped.** The first version took the *last*
  declaration in the file and picked up the reduced-motion `0ms` as the default.

`styles/interop.tokens.css` is its companion — every component's own levers,
one commented block each, generated by `scripts/generate-token-reference.mjs`
from the `var(--itx-X-…)` reads in each component's stylesheet. Separate because
the globals file is 19 global values and this is 748 per-component ones; burying the
former in the latter would defeat the point. Both share `scripts/lib/css-read.mjs`
so they cannot disagree about what a file says.

It reads the FIRST declaration, not the last: the file skeleton puts base values
before variant blocks, so the last one is the most specialised, not the default.
Reading it backwards claimed a button was 4rem tall (the xl size) with a
transparent background (a variant).

Levers that are NOT tokens belong in the file as comments, not declarations:
`itx-colorway` (root-only), `itx-status-palette` (any element), `itx-scale-scope`,
and the build-time dials in `generate-color-ladder.mjs` — layer count, contrast
floors, seeds — which cannot be custom properties because the engine unrolls a
`@container` block per layer.

## Edges (border width & high contrast)

**Never write a literal border width.** Read the semantic scale in
`tokens/shape.css` — `--itx-border-width-hairline` (1px), `-thick` (2px),
`-heavy` (3px) — or the numeric ramp behind it. There was no primitive at all
before: 48 declarations across 30 files wrote `1px`/`2px`/`3px` by hand.

A `border-width: 0` stays a literal. That is absence, not a weight, and routing
it through a token buys nothing.

**Do not write a `prefers-contrast` block to bump a width.** Hairline thickens
to 2px under the preference (`tokens/shape.css`) and the focus ring goes to
3px (`tokens/focus.css`), so any component reading those tokens follows. Five
components used to write those bumps by hand; every other bordered component
ignored the preference entirely.

**Do write one to add an edge a component only has in high contrast.** Which
part of a component needs a selection edge — a chip's checked state, a segment's
`aria-pressed`, the stepper's active indicator — is component knowledge no token
carries. The shape is:

```css
@media (prefers-contrast: more), (prefers-contrast: high) {
	:where(X[selected]) { outline: var(--itx-border-width-thick) solid currentColor; }
}
```

`more` is the spec value; `high` was an early-draft keyword that the library used
everywhere until ITX-45. Both are listed because an invalid query in a comma list is
dropped individually, so keeping the legacy one costs nothing.

`currentColor` is deliberate here and the focus guard exempts it: high contrast
means following the user's colours, not the brand's.

## Linting

`npm run lint` runs nine guards; `npm run lint:css` is the stylelint one.

`check-shape.mjs` carries three rules: no literal radius, no system token
baked at the root, and no CSS-wide keyword on a radius outside a
pseudo-element rule (see *Addressability*).

Stylelint was configured long before it was installed, and its config had never
been executed — `custom-property-pattern` was written as `^--(itx-…)$`, but
stylelint matches the name **without** the leading `--`, so the rule could never
pass. First real run reported 6451 errors, essentially all of them spurious.
Corrected, the same tree reports zero.

Two rules are deliberately shaped around how this codebase is written:

- **`selector-type-no-unknown` ignores custom elements.** The library is built on
  them — `interop-table`, `itx-code-block`, `interop-field-control` — so without
  `ignore: ["custom-elements"]` the rule fires on almost every theme file.
- **`no-duplicate-selectors` is off.** The file skeleton above deliberately
  repeats a host selector across sections: `:where(button[interop-button])`
  appears once for layout and again under *State-resolved private slots*, and
  `:where([interop-tree-item])` once for the item and again for the focus
  target. Merging those to satisfy the rule would flatten the structure this
  document prescribes. The rule encodes an assumption we knowingly violate, so
  it is disabled rather than suppressed file by file.

The custom-property pattern allows the `_` half-step suffix (`--itx-spacing-0_5`,
`--itx-radius-0_5`) and the `--interop-content-*` namespace, both of which are
existing, intentional conventions.

## Container queries for responsive behavior

The component host declares a container:

```css
:where(interop-stepper) {
  container-type: inline-size;
  container-name: stepper;
}
```

Responsive rules reference the named container. Thresholds are hard-coded in pixels — `@container` parens cannot read CSS custom properties:

```css
@container stepper (max-width: 599px) {
  :where(.interop-stepper__nav-trigger) { display: inline-flex; }
  :where(ol[interop-step-list]) { display: none; }
}
```

## Scrollbar hiding

Three-layer approach for cross-browser coverage:

```css
/* Modern — Firefox, Chromium 121+, Safari 18.4+ */
scrollbar-width: none;
scrollbar-color: transparent transparent;

/* WebKit fallback */
:where(.viewport)::-webkit-scrollbar {
  inline-size: 0;
  block-size: 0;
  display: none;
}
```

Consumers can opt-in to visible scrollbars by overriding `--itx-[component]-viewport-scrollbar-width` to `thin` or `auto`, plus the thumb/track color tokens.

## Import chain

```
src/lib/styles/interop.css
  @import "./components/stepper.css"
  @import "./components/resizable.css"
  ...

src/lib/styles/themes/protocol.css
  @import "./protocol/components/stepper.css"
  @import "./protocol/components/resizable.css"
  ...
```

When adding a new component, add both imports. Neither file is auto-discovered.
