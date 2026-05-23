# InteropIndicator — Mental Model Card

## Files

```
src/lib/components/interop-indicator/
  interop-indicator.ts        component (empty template + aria-hidden host)
  public-api.ts               barrel
src/lib/styles/components/indicator.css                  structural rules
src/lib/styles/themes/protocol/components/indicator.css  token values
```

No demo page of its own — the indicator is always used as a child of another component. Live consumers today: `interop-segmented-control`. Anticipated future consumers: tab strips, toggle groups, nav rails.

## What it is

A purpose-built **decorative surface** for the "sliding pill" pattern. It owns no behaviour and exposes no inputs. Its only job is to be a styled, animatable rectangle that tracks an external CSS anchor.

```html
<interop-indicator />
```

The host element is `aria-hidden="true"` — selection state is conveyed by the underlying control (e.g. `aria-pressed` on a segment button), not by this decoration.

## Architecture — the anchor contract

The indicator is positioned via **CSS Anchor Positioning**. The contract:

1. The **parent component** wraps the indicator in a positioning context (a `position: relative` ancestor).
2. The parent exposes `anchor-name: --itx-indicator-anchor` (or a custom name) on whichever item is currently active.
3. The indicator reads that name via `position-anchor: var(--itx-indicator-anchor-name, --itx-indicator-anchor)` and tracks the four edges with `top: anchor(top)`, etc.
4. When the parent switches which element carries the anchor name, the browser interpolates the indicator's `top/right/bottom/left` — animation is free.

In `interop-segmented-control` the anchor name is overridden via container CSS:

```css
:host { --itx-indicator-anchor-name: --itx-segment-active; }
```

…and the active segment sets `anchor-name: --itx-segment-active` (inside an `@supports (anchor-name: none)` guard).

## Why a component, not a directive

Three reasons:

1. **Encapsulated styling surface** — the indicator is one DOM node with no children. A component selector (`interop-indicator`) is the natural attachment for global `:where(interop-indicator) { ... }` rules.
2. **Forced aria-hidden** — the host is unconditionally `aria-hidden="true"`. A directive applied to existing markup couldn't enforce this without surprising the consumer.
3. **Future content** — leaves room for slots (e.g. a tick mark inside the pill) without changing the consumer-facing API.

## Two render paths

### Enhancement — anchor positioning supported

```css
@supports (anchor-name: none) {
  :where(interop-indicator) {
    position-anchor: var(--itx-indicator-anchor-name, --itx-indicator-anchor);
    top: anchor(top); right: anchor(right);
    bottom: anchor(bottom); left: anchor(left);
    transition-property: top, right, bottom, left;
    transition-duration: var(--itx-indicator-transition-duration, 150ms);
  }
}
```

The browser interpolates the four edges between anchor changes. Pure CSS animation, no JavaScript.

### Fallback — anchor positioning unsupported

```css
@supports not (anchor-name: none) {
  :where(interop-indicator) { display: none; }
}
```

The indicator hides itself. Parent components are expected to provide a **painted fallback**: paint the active item's background directly using the same `--itx-indicator-*` tokens. Both `interop-segmented-control`'s segment styles and any future consumer share this convention, so the visual is preserved even when the motion isn't.

`segment.css` shows the dual-path pattern for the parent's selected-segment styling — its `@supports (anchor-name: none)` clause clears the segment's own background so the live indicator shows through, while the non-supports path falls back to painting the segment background from the same indicator tokens.

## Anchor failure modes

When the indicator's anchor cannot be resolved:

| Failure | Visual |
|---|---|
| No element in the document carries the anchor name | All four `anchor()` functions resolve to nothing; the indicator collapses to its intrinsic min size (just the border) at the containing block's top-left |
| Multiple elements carry the same anchor name | Browser picks one (typically the first in tree order); behaviour is well-defined but may not match parent's expectation |
| Anchor element exists but parent's positioning context is missing | The `position: relative` containing block is missing; coordinates resolve relative to the next positioned ancestor |

The first case is the most common authoring mistake — a parent renders `<interop-indicator />` based on "has a selected value" without checking that any child actually carries the anchor. Defensively, parents should render the indicator only when an item that owns the anchor name is present.

## Tokens

Public, all on `[interop-root]` in Protocol theme:

```
Visual surface
  --itx-indicator-background-color        --itx-indicator-background-image
  --itx-indicator-border-color            --itx-indicator-border-width
  --itx-indicator-border-style            --itx-indicator-border-radius
  --itx-indicator-box-shadow

Anchor binding
  --itx-indicator-anchor-name             (default: --itx-indicator-anchor)

Transition
  --itx-indicator-transition-duration     --itx-indicator-transition-timing-function
```

Re-theming all indicators across the app is a single token-set at any ancestor scope. Distinguishing one indicator from another (e.g. tab strip vs segmented control) is a token override on the parent component.

## CSS strategy

Two-file split per `css-strategy.md`:

| File | Purpose |
|---|---|
| `src/lib/styles/components/indicator.css` | Structural — display, position, anchor wiring, `@supports` branching, reduced-motion override |
| `src/lib/styles/themes/protocol/components/indicator.css` | Values — colors, borders, radii, transition |

Both files are imported globally via `interop.css`. All selectors are wrapped in `:where()` for zero specificity. No pseudo-elements, so the pseudo-element exception from `css-strategy.md` does not apply.

The structural file owns: `display: block`, `position: absolute`, `pointer-events: none`, and the `@supports`-gated anchor wiring. The theme owns: `light-dark()` colour values for the surface, border thickness/style, transition duration/easing.

## Inputs / Outputs

None. The component has no API surface. All behaviour is parent-driven via CSS anchor names.

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  :where(interop-indicator) { transition: none; }
}
```

The anchor binding still applies — the indicator still tracks the active item — but jumps to each new position without interpolation.

## Known gaps

- **No matched-anchor signal back to the parent** — the indicator silently collapses if no element owns the anchor name. The parent has no callback indicating "your anchor reference is dead." Parents must defensively gate rendering on "an item with this value actually exists" rather than relying on the indicator to fail loud.
- **Single anchor name per scope** — multiple indicators in the same containing block must each be configured with a distinct `--itx-indicator-anchor-name` and matching `anchor-name` on its target. There is no per-instance input for this; consumers override the custom property at the parent's scope.
