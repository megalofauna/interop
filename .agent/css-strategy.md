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

## Linting

`npm run lint` runs four guards; `npm run lint:css` is the stylelint one.

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
