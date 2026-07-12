# PageNav — Mental Model Card

## Files

```
projects/interop/src/lib/composites/page-nav/
  page-nav.ts           Component class (itx-page-nav)
  page-nav.html         Template (two branches: vertical / horizontal)
  public-api.ts         Barrel

projects/interop/src/lib/styles/composites/page-nav.css                  Structural foundation (global, :where())
projects/interop/src/lib/styles/themes/protocol/composites/page-nav.css  Protocol theme — token values
```

Re-exported from `interop`. **Migrated to the two-file global CSS model** (see [../css-strategy.md](../css-strategy.md)) — no `styleUrl`, no component-scoped SCSS. Styles ship globally via `interop.css` / `protocol.css`.

## What it is

An in-page section navigator — the "on this page" / tab-bar-of-anchors pattern. Renders a flat-or-nested list of `PageNavLink`s; clicking one smooth-scrolls (or view-transition-fades) to the matching element. Two orientations from one component.

```typescript
export interface PageNavLink {
  label: string;
  href: string;               // a CSS selector / hash — passed to document.querySelector
  children?: PageNavLink[];    // one level of nesting (vertical only)
}
```

```html
<itx-page-nav [links]="links" [activeHref]="activeHref()" [sticky]="true" [fade]="true" />
```

## Two orientations, two template branches

| Orientation | Structure | Notes |
|---|---|---|
| **horizontal** (default) | `nav > interop-scroll-area > ul > li > a` | Overflow scrolls horizontally with edge shadows (delegated to `InteropScrollArea`). Plain `<a>` — no children. |
| **vertical** | `nav > .itx-pn__label + ul.itx-pn__list > li.itx-pn__item > a.itx-pn__link` | Supports one level of `.itx-pn__children`; each link has a leading `.itx-pn__indicator` dot that fades in when `aria-current`. |

Orientation is set by the `orientation()` input and reflected as a host class (`itx-pn--horizontal` / `itx-pn--vertical`) — that's the CSS hook.

## Active state is consumer-driven

There is **no built-in scroll-spy**. `activeHref()` is an input; the consumer decides which link is current (IntersectionObserver in the host page, router state, etc.) and the component reflects it as `aria-current` on the matching `<a>`. Both orientations key their active styling (color, weight, and — vertical only — the indicator dot) off `[aria-current]`.

## Sticky / stuck

`[sticky]="true"` adds `position: sticky; top: 0` (host class `itx-pn--sticky`). A constructor `afterNextRender` + `IntersectionObserver` (threshold `[1]`, `rootMargin: "-1px 0 0 0"`) watches the host against its nearest scrollable ancestor (`scrollParent()` walks up looking for `overflow-y: auto|scroll`) and toggles the `isStuck` signal → host class `itx-pn--stuck`.

`itx-pn--stuck` is purely a **styling hook**: the Protocol theme reveals a solid bar (`--itx-pn-background: var(--itx-page)` + border) when pinned; the structural file adds no behavior beyond the class.

## Scroll behavior

`handleLinkClick` → `preventDefault` → `scrollToSection(href)`:
- `document.querySelector(href)` then `scrollIntoView({ block: "start" })`.
- `[fade]="true"` + `startViewTransition` support → wraps the (instant) scroll in a view transition.
- else `[smooth]="true"` (default) → `behavior: "smooth"`; `smooth=false` → instant.

Note `fade` forces `behavior: "instant"` (the transition does the animation) — `fade` wins over `smooth`.

## CSS strategy

Two-file split, both loaded globally; **all selectors wrapped in `:where()`** for zero specificity. Follows the **code-block no-fallback contract**: structural references `--itx-pn-*` tokens directly, the theme is the single source of truth for every value. Global foundation tokens (spacing, motion) are referenced directly in structural.

Selectors key off the host classes the component binds, e.g. `:where(itx-page-nav.itx-pn--vertical .itx-pn__link)`. No `:host` (there's no component-scoped stylesheet anymore).

**Deliberately minimal surface** (a trim, not a 1:1 port):
- Dropped the entire `interop-icon` scaling layer — **neither template branch renders `<interop-icon>`** (the `provideInteropIcons(TablerMapPin2)` provider + `InteropIcon` import were dead and were removed from `page-nav.ts`).
- The stuck state no longer animates gap/icon-scale/colors — it just reveals a surface.
- The active indicator dot lost its `transform: scale()` bounce — plain opacity fade, gated by `prefers-reduced-motion`.

## Token surface (summary)

Full list with descriptions lives in the Protocol theme file's header. All prefixed `--itx-pn-`.

| Part | Tokens |
|---|---|
| Surface (bar) | `background`, `radius`, `border-width`, `border-color`, `padding-block`, `padding-inline`, `gap`, `z-index` |
| Links (shared) | `font-size`, `font-weight`, `font-weight-active`, `link-color`, `link-color-hover`, `link-color-active`, `link-background-hover`, `link-padding-block`, `link-padding-inline`, `link-radius` |
| Focus ring | `focus-color`, `focus-width`, `focus-offset` |
| Vertical | `label-color`, `item-gap`, `indent`, `child-color`, `child-font-size`, `indicator-size`, `indicator-radius`, `indicator-color` |

Stuck-state values are set on `:where([interop-root] itx-page-nav.itx-pn--stuck)` in the theme.

## Inputs

| Input | Type | Default | Effect |
|---|---|---|---|
| `links` | `PageNavLink[]` | `[]` | Items to render |
| `label` | `string` | `"On this page"` | `aria-label` on the `<nav>` + visible label (vertical) |
| `activeHref` | `string \| null` | `null` | Which link gets `aria-current` (consumer-driven) |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Template branch + host class |
| `sticky` | `boolean` | `false` | `position: sticky` + IntersectionObserver stuck detection |
| `smooth` | `boolean` | `true` | Smooth vs instant scroll |
| `fade` | `boolean` | `false` | View-transition fade (forces instant scroll) |

## Accessibility

- `<nav>` landmark with `aria-label` (the `label` input).
- Active link gets `aria-current` (reflected from `activeHref`).
- The vertical section label (`.itx-pn__label`) is `aria-hidden` (decorative — the `<nav>` already has an accessible name), as is the indicator dot.
- Focus-visible ring on links via `--itx-pn-focus-*`; `prefers-reduced-motion` disables link/indicator transitions.

## Things to know when editing

- **No scroll-spy.** If you want the nav to self-highlight on scroll, that's a new feature — currently `activeHref` must be fed in.
- **`scrollParent()` requires an explicitly scrollable ancestor.** If the page scrolls on `<html>`/`<body>` without `overflow-y: auto|scroll`, the observer root falls back to `null` (viewport) — usually fine, but nested scroll containers need the overflow set for stuck detection to fire.
- **Horizontal children are ignored.** `PageNavLink.children` only renders in the vertical branch.
- **`href` is a `querySelector` argument,** not necessarily a URL hash — any valid selector works, but IDs (`#section`) are the norm.

## Known gaps

- **No scroll-spy / active tracking** built in (see above).
- **One nesting level** in vertical; deeper trees aren't rendered.
