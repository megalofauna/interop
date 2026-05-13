# InteropScrollArea — Mental Model Card

A general-purpose scroll container that adds overflow-awareness on top of a
native scrollport: detects when content overflows, exposes scroll position
state as signals + an output, fades content at scrollable edges via mask
gradients, and auto-promotes itself to a focusable keyboard scroll target
when overflow exists without focusable descendants.

The component does not introduce its own scroll model. The host element
itself is the scroll container; the SCSS sets `overflow` per orientation.
All work the JS does is observation: detecting overflow, tracking scroll
position, updating shadow custom properties, watching for DOM changes that
would affect either.

## Files

```
src/lib/components/interop-scroll-area/
  interop-scroll-area.ts          component
  interop-scroll-area.scss        :host overflow + mask shadows + focus ring
  interop-scroll-area.config.ts   config interface, defaults, INJECTION_TOKEN
  public-api.ts                   barrel
```

No dedicated structural-vs-theme split — the scroll-area's structural CSS
*is* its theme surface (a small set of tokens, declared in the SCSS header).

## DOM structure

```html
<interop-scroll-area
  orientation="horizontal"
  ariaLabel="Steps"
  (scrollState)="onScroll($event)"
  (overflowChange)="onOverflow($event)"
>
  <ol>
    <li>...</li>
    ...
  </ol>
</interop-scroll-area>
```

The host element is the scrollport. Children are projected as-is into the
default slot. The host carries:

- `data-orientation` — `vertical` / `horizontal` / `both`
- `data-overflowing` — present when content overflows
- `data-shadows` — present when shadow fades are enabled
- `tabindex` — `0` only when overflowing AND no focusable descendants
- `role` — `region` only when `[ariaLabel]` is set; null otherwise
- `aria-label` — present only when `[ariaLabel]` is set

## Resolution chain (per-prop)

Three-level lookup, with the first non-undefined value winning:

```
input prop  →  INTEROP_SCROLL_AREA_CONFIG (root or scoped)  →  INTEROP_SCROLL_AREA_DEFAULTS
```

Applies to `orientation`, `showShadows`, `shadowThreshold`. `tabIndex` and
`ariaLabel` are direct inputs — no config layer.

Defaults (`interop-scroll-area.config.ts`):

| Field | Default |
|---|---|
| `orientation` | `'vertical'` |
| `showShadows` | `true` |
| `shadowThreshold` | `60` (px distance from edge across which the fade ramps 0 → 1) |
| `overscrollBehavior` | `'contain'` |

**Footgun:** `overscrollBehavior` is declared in the config interface but
the TS component never imperatively applies it. The SCSS reads
`--itx-scroll-area-overscroll` directly (defaulting to `contain`). To set
it, callers must set the CSS variable; the config field is documentation,
not wiring.

## Outputs and exposed signals

Outputs:

- `scrollState: ScrollStateEvent` — fires on every settled scroll frame
  (RAF-throttled). Carries `scrollTop`, `scrollLeft`, `atTop`, `atBottom`,
  `atStart`, `atEnd`, `overflowing`, and `direction` (`up|down|left|right|idle`).
- `overflowChange: boolean` — fires only when `overflowing()` flips.

Public signals (read freely from the template ref):

- `atTop`, `atBottom`, `atStart`, `atEnd` — edge state
- `overflowing` — overflow on either axis (respecting `orientation`)
- `scrollDirection` — last move direction

## Overflow detection

Triggered by `init()`, `ResizeObserver` (host + every direct child), and
`MutationObserver` (childList + subtree). Compares `scrollHeight`/`Width`
against `clientHeight`/`Width` with a 1px tolerance. Respects orientation
— vertical orientation never reports horizontal overflow, etc.

Newly-added subtree elements are automatically observed by the
`ResizeObserver` (the MutationObserver hooks up the observation when an
`HTMLElement` is added). No cleanup of removed elements — the observer
silently drops them on its own.

## Scroll state (RAF-throttled)

The `scroll` listener (passive) schedules a single
`requestAnimationFrame` per frame; subsequent scroll events while one is
pending are coalesced. Inside the RAF, `updateScrollState()`:

1. Reads `scrollTop`/`Left` and `scroll*`/`client*` dimensions once
2. Sets `atTop`/`atBottom`/`atStart`/`atEnd` (1px tolerance)
3. Derives `scrollDirection` by comparing against `lastScroll*` deltas
4. If `showShadows`, sets four `--_shadow-*` custom properties (0–1)
   based on distance from each edge, capped at `shadowThreshold` px
5. Emits `scrollState`

All four shadow vars are always written when shadows are enabled, even
on a single-axis scroll. The SCSS only consumes the ones relevant to the
current `[data-orientation]`.

## Auto tabindex / role

Two host attributes are derived rather than configured directly:

```
effectiveTabIndex():
  if [tabIndex] explicitly set        → use it (including null to disable)
  else if overflowing && no focusable → 0
  else                                → null

effectiveRole():
  if [ariaLabel] set                  → 'region'
  else                                → null
```

The "no focusable child" heuristic uses a `querySelector` against
`a[href], button:not([disabled]), input:not([disabled]), …, [tabindex]:not([tabindex="-1"])`.
It is rechecked on every mutation.

**Rationale:** a scroll container with no focusable content can't be
keyboard-scrolled at all without a tabindex; one *with* focusable content
already gets keyboard access for free via the child controls, and giving
it tabindex=0 would inject an unhelpful tab stop on the container itself.

The role-from-aria-label coupling is intentional: a region landmark
without an accessible name is worse than no landmark, so the role only
activates when a name is present. DevMode warns on the explicit
empty-string case (`ariaLabel=""`).

## Shadows (mask-image based)

Visual fades at scrollable edges use `mask-image` rather than
overlay elements — no extra DOM, no background-color assumption, works
on any backdrop.

The SCSS computes a linear gradient with stops at
`var(--_shadow-{top|bottom|start|end}) * var(--_shadow-size)`. When a
shadow var is 0, that gradient stop collapses to 0px and the edge is
fully opaque (no fade). When it's 1, the full `--itx-scroll-area-shadow-size`
fades the content out.

The `both` orientation composes two gradients with `mask-composite:
intersect`, intersecting horizontal and vertical fades.

## Public API

```ts
scrollTo(options: ScrollToOptions): Promise<void>
scrollToTop(behavior?: ScrollBehavior): Promise<void>
scrollToBottom(behavior?: ScrollBehavior): Promise<void>
```

All three return a Promise that resolves on `scrollend` (with a 1-second
`setTimeout` fallback for browsers where `scrollend` doesn't fire or the
scroll is interrupted). A no-op scroll (target within 1px of current
position) resolves immediately without dispatching anything.

## Lifecycle

- `afterNextRender(() => init())` — wires listeners and observers after
  the first browser frame; safe to run inside SSR / hydration
- `ngOnDestroy()` — disconnects both observers, cancels any pending RAF,
  removes the scroll listener

The `boundScrollHandler` reference is stored so it can be reliably
removed (anonymous bind would leak).

## DevMode warnings

- `ariaLabel=""` (empty string) — flagged. A region landmark with no
  accessible name is worse than no landmark. Omit the input or set a
  meaningful value.

No warnings yet for: a scroll-area with explicit `[ariaLabel]` but
`orientation="both"` (region landmarks named for layout aren't
necessarily meaningful), or a scroll-area whose only focusable child
is a focus trap.

## When to use

- **Horizontal-overflow strips** of tabs, chips, breadcrumbs, step
  indicators — where the natural pattern is "let it scroll, but show
  affordances that more exists off-edge"
- **Card decks** that need to scroll on narrow viewports
- **Code blocks / pre** that need keyboard scroll for AT users
- **Modals or sheets** with scrollable bodies (replace ad-hoc overflow:
  auto with this so the affordances and edge-state outputs come for free)

## When NOT to use

- **Inside a scroll-snap viewport already managed by another component**
  (e.g. the stepper's panel viewport) — that container handles snap and
  doesn't want a second overflow observer fighting it
- **Around content with its own infinite-scroll loader** — the
  ResizeObserver will fire repeatedly as content loads; consider gating
  the loader by `(scrollState)` rather than wrapping
- **As a substitute for a popover/menu** when the goal is "hide the long
  list until the user asks" — that's overlay UX, not overflow UX
- **For document-level scrolling** — the component owns its host's
  overflow; document body scroll is a separate concern
