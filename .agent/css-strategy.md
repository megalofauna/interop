# Interop — CSS Strategy

## Two-file split

Every component has exactly two CSS files:

| File | Purpose | Contains |
|---|---|---|
| `src/lib/styles/components/X.css` | Structure | Layout, display, flex/grid, overflow, scroll-snap, pseudo-elements, state activation selectors |
| `src/lib/styles/themes/protocol/components/X.css` | Values | Colors, borders, radii, shadows, font-weight, spacing tokens |

Both are imported globally — no per-component `styleUrl`. Consumers get component styles by importing the library's global CSS.

The theme file ONLY sets token values. It never adds new selectors or structural rules.

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

## Token naming pattern

Tokens follow `--itx-[component]-[part]-[property]-[state]`:

```
--itx-step-indicator-background-active
--itx-step-indicator-background-active-reviewed
--itx-stepper-viewport-scrollbar-width
```

Private resolved slots (internal to a rule block, not public API) use `--_`:

```css
:where(li[interop-step]) {
  --_indicator-background: var(--itx-step-indicator-background, transparent);
}
```

State-specific public tokens always cascade to the base token as the final fallback:

```css
--_indicator-background: var(
  --itx-step-indicator-background-active,
  var(--itx-step-indicator-background, transparent)
);
```

## State activation pattern

State classes drive token resolution. The structural CSS sets which private slot resolves to which public token; the theme sets the public token values. Adding a new visual state = add one class rule to the structural file + token values to the theme file.

```css
/* structural: activates the slot */
:where(li[interop-step].interop-step--active) {
  --_indicator-background: var(--itx-step-indicator-background-active, ...);
}

/* theme: sets the value */
:where(li[interop-step].interop-step--active) {
  --itx-step-indicator-background-active: var(--itx-colorway-8);
}
```

## Composite states

When two classes must combine for a distinct appearance (e.g. `active + reviewed`), the structural rule stacks both classes. It naturally wins over the single-class rules without extra specificity tricks — two classes outrank one class in normal selector weight.

```css
:where(li[interop-step].interop-step--active.interop-step--reviewed) {
  --_indicator-background: var(--itx-step-indicator-background-active-reviewed, ...);
}
```

Composite theme tokens cascade to their single-state equivalents so themes only need to declare them when they want a different visual.

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
