# Interop — CSS Strategy

## Two-file split

Every component has exactly two CSS files:

| File | Purpose | Contains |
|---|---|---|
| `src/lib/styles/components/X.css` | Structure | Layout, display, flex/grid, overflow, scroll-snap, pseudo-elements, nested interaction-state blocks |
| `src/lib/styles/themes/protocol/components/X.css` | Values | Colors, borders, radii, shadows, font-weight, spacing tokens |

Both are imported globally — no per-component `styleUrl`. Consumers get component styles by importing the library's global CSS.

The theme assigns **custom properties only** — never a real CSS property. Base values go on `[interop-root] X`; values may also be scoped to host-level variant/state selectors (e.g. `X.--stuck`). The theme never owns element interaction-state selectors (`:hover`, `:focus-visible`, `[aria-current]`) — those live in structural. See *Stateful parts* and *Host-level state & variants*.

## Zero specificity

Every selector in structural CSS is wrapped in `:where()`:

```css
:where(interop-stepper > .interop-stepper__nav) { ... }
```

This means specificity = `(0,0,0)` for every library rule. Consumer overrides always win regardless of declaration order. No `!important` needed.

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
- **Focus stays structural.** The `:focus-visible` rule lives here (theme only tunes its tokens), never as a theme-side value a theme could forget. The ring is an accessibility floor structural must guarantee.
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
4. `@media` trailers last (`prefers-reduced-motion`, `prefers-contrast`).

**Theme (`themes/protocol/.../X.css`):**
1. Header comment listing the full token surface, grouped by part.
2. `:where([interop-root] X) { … }` — all base values, grouped by part in the **same order** as the structural file; within a part, `base` then `state-deltas` then `focus`.
3. Host-state / variant blocks (`X.--stuck`, …) last — custom-property assignments only.

No dead commented-out tokens or rules land in a committed file: a token with no consumer is cruft, and an undeclared state already degrades to base.

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
