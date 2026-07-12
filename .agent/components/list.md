# InteropList — Mental Model Card

## Files

```
src/lib/components/interop-list/
  interop-list.ts            component (selectors: ul/ol/dl[interop-list], interop-list)
  interop-list.html          @for over resolved collection → <li> (+ optional item template)
  interop-list.spec.ts       tests
src/lib/styles/components/list.css                  structural rules
src/lib/styles/themes/protocol/components/list.css  token values
projects/demo/src/app/pages/list/                   demo page
```

No per-component `styleUrl`. Styles ship globally through `interop.css` / `protocol.css`, like every other migrated component (see `css-strategy.md`).

## What it is

A semantic list for `ul`, `ol`, `dl`, or the standalone `<interop-list>` element. Renders a `[collection]` (array / signal / observable / promise / iterable) or static projected `<li>`. `LayoutCapable` host directive feeds the shared `--itx-layout-*` axes (direction, justify, align, wrap, gap).

```html
<ul interop-list [collection]="items"></ul>
<ol interop-list [collection]="steps"></ol>
```

## CSS strategy

Two-file split. All selectors `:where()`-wrapped for zero specificity; the marker pseudo-element is the one rule kept OUTSIDE `:where()` (the spec forbids pseudo-elements inside it — they get silently dropped).

| File | Owns |
|---|---|
| `styles/components/list.css` | Layout-capable base (flex, **defaults to `column`** unlike the generic layout mixin's `row`), list reset, row inter-item spacing, the enclosed-marker structure |
| `styles/themes/protocol/components/list.css` | Marker values (colorway stroke, sizing, weight). The container itself carries no paint. |

## Enclosed-marker variant — `itx-marker="enclosed"`

Opt-in on `ol[interop-list]`. Renders each ordinal as a styled box — a **stroked circle in the active colorway by default** — with the numeral centred inside.

```html
<ol interop-list itx-marker="enclosed" [collection]="steps"></ol>
```

How it works:
- The base rule sets `list-style: none`, so the native marker is gone.
- A **named counter** (`itx-list-marker`, reset on the `ol`, incremented per `li`) reinstates the ordinal; a `::before` paints it.
- The `li` becomes `display: flex` (marker + text), centred via `align-items` with a `gap`. The marker box uses `display: grid; place-items: center` to centre the numeral; `border-radius: full` makes the circle; `border` is the stroke.
- `content: counter(itx-list-marker, var(--itx-list-marker-style, decimal))` — swap `--itx-list-marker-style` for `decimal-leading-zero`, `upper-roman`, or a consumer-defined `@counter-style` name.

**Trade-off:** because the row is now a flex container, the `li` is no longer `display: list-item`, so the automatic `list-item` counter stops — that's why a named counter is used. The consequence is that native ordering attributes (`<ol start>`, `reversed`, `<li value>`) are NOT reflected; ordering follows source order. This is the right default for collection-rendered lists; note it if a consumer hand-authors `<ol start="…">`.

### Why this approach (options considered)

- `::marker` — can only style text/font properties (`color`, `content`, `font-*`). **Cannot** take a border, background, or box model, so a stroked circle is impossible with it. Good only for recolouring/reshaping the glyph.
- `@counter-style` — defines custom glyph rendering but still feeds `::marker`, so same box limitation. Useful for custom symbol sets; exposed here via `--itx-list-marker-style`.
- **counter + `::before` (chosen)** — the only path that gives a fully styleable box around the numeral.

## Tokens (enclosed marker)

Set on the `li` row in Protocol; the `::before` inherits them.

```
--itx-list-marker-gap          marker↔text space      (spacing-3)
--itx-list-marker-align        cross-axis align       (center)
--itx-list-marker-size         box diameter           (2em)
--itx-list-marker-radius       shape                  (radius-full → circle)
--itx-list-marker-border       stroke                 (2px solid colorway)
--itx-list-marker-background    fill                   (transparent)
--itx-list-marker-color        numeral colour         (colorway)
--itx-list-marker-font-size     numeral size           (0.8em)
--itx-list-marker-font-weight   numeral weight         (600)
--itx-list-marker-style        counter() style        (decimal)
```

Sizes are `em`-relative so the marker scales with the item text. Override `--itx-list-marker-radius` to a small value for a rounded-square badge, or set `--itx-list-marker-background` for a filled chip.

## Inputs

`collection`, `trackBy` (`'auto' | 'index' | TrackByFunction`), `trackByField`, `listItemTemplate`, `attrsPreset`. See `interop-list.ts` for the trackBy precedence rules.
