# InteropTooltip — Mental Model Card

## Files

```
src/lib/components/interop-tooltip/
  interop-tooltip.ts                     main component
  interop-tooltip.html                   template (panel + ng-template outlet)
  interop-tooltip.scss                   component styles
  interop-tooltip-content.directive.ts   marker directive — rich content slot
  interop-tooltip-trigger.directive.ts   marker directive — trigger disambiguation
  interop-tooltip.config.ts             INTEROP_TOOLTIP_CONFIG token + defaults
  position-strategy.ts                   InteropPositionStrategy interface + INTEROP_POSITION_STRATEGY token
  floating-ui.strategy.ts               FloatingUiPositionStrategy (default, lazy-loads @floating-ui/dom)
  native.strategy.ts                    NativePositionStrategy (fallback, top/bottom only)
  public-api.ts                         barrel
src/lib/styles/components/tooltip.css            structural rules
src/lib/styles/themes/protocol/components/tooltip.css  token values
projects/demo/src/app/pages/tooltip/             demo page
```

## Architecture

**One component + two marker directives:**

```html
<!-- Simple: string label -->
<interop-tooltip label="Saves your progress">
  <button type="button">Save</button>
</interop-tooltip>

<!-- Rich: projected template -->
<interop-tooltip>
  <button interopTooltipTrigger>Save</button>
  <ng-template interopTooltipContent>
    Save &nbsp;<kbd>Ctrl</kbd>+<kbd>S</kbd>
  </ng-template>
</interop-tooltip>
```

`interop-tooltip` has `host: { style: 'display: contents' }` — the host element is invisible to layout. From the browser's perspective, the projected trigger renders exactly as if the wrapper weren't there.

**Why a component (not directive):** The tooltip owns a view — it projects the trigger, queries it by DI token, and renders the panel via `#tooltipPanel`. A directive has no template of its own.

## Native popover semantics

The panel uses `popover="manual"` — top-layer promotion, but **no** browser light-dismiss and **no** browser Escape handling. The component owns the full show/hide lifecycle explicitly:

- Show on hover (after `showDelay`) or focus (immediately)
- Hide on blur or mouse-leave (150ms grace for WCAG 1.4.13 Hoverable)
- Escape handled at `document` level (WCAG 1.4.13 Dismissible) — document-level so hover-triggered tooltips can be dismissed when keyboard focus is elsewhere

## WCAG 1.4.13 compliance

The three criteria, and how each is met:

| Criterion | Requirement | Implementation |
|---|---|---|
| Dismissible | User can dismiss without moving focus | `document keydown` → Escape hides, focus untouched |
| Hoverable | Mouse can travel from trigger to panel without closing | `mouseenter`/`pointerenter` on the panel calls `cancelClose()` |
| Persistent | No auto-dismiss timer | No `setTimeout` on the visible state — only on open/close transitions |

## Accessibility model

The panel has `role="tooltip"` and is always in the DOM at `opacity: 0` (never `display: none`). This matters for AT: NVDA and JAWS resolve `aria-describedby` by reading the referenced element's text at focus time — if the element is `display: none`, the description is empty. `opacity: 0` keeps it measurable and AT-readable before the first hover.

ARIA attribute on the trigger:
- `aria-describedby` (default `semantic="description"`) — supplemental info, announced after the name
- `aria-labelledby` (`semantic="label"`) — replaces the accessible name. Reserve for icon-only controls with no other accessible name. A dev-mode warning fires if the trigger has visible text content.

## Show/hide mechanics

The component tracks active show reasons in a `Set<'focus' | 'hover'>`. This prevents the classic hover-then-focus race condition:

- `requestShow(reason, delay)` — adds to set, schedules `showTooltip()` after delay
- `requestHide(reason, delay)` — removes from set; hides only when set is empty
- `cancelClose()` — clears pending hide timer (called when mouse enters panel)

Focus always shows immediately (delay 0); hover respects `showDelay` (default 600ms).

## Safari cross-browser event compat

Both `mouseenter` + `pointerenter` are bound on trigger and panel. Safari does not reliably fire `pointerenter` on elements adjacent to native `[popover]` elements, but `mouseenter` alone is also insufficient in Safari. The combination works cross-browser. Duplicate fires are harmless — `requestShow` is idempotent when already visible.

## Position strategy

```typescript
providers: [
  { provide: INTEROP_POSITION_STRATEGY, useFactory: () => new FloatingUiPositionStrategy() },
],
```

Per-component-instance (each `interop-tooltip` gets its own). The strategy lifecycle:

1. `connect(trigger, panel)` — called once in `afterNextRender`; also kicks off the lazy `@floating-ui/dom` import
2. `position({ placement, offset })` → `Promise<ResolvedPlacement>` — applies `top`/`left` inline styles (FloatingUI) or `position-area` (future CSS anchor strategy)
3. `startAutoUpdate(cb)` → `() => void` — scroll/resize loop while panel is visible
4. `disconnect()` — called `ngOnDestroy`; cleans up styles and listeners

**FloatingUiPositionStrategy** lazy-loads `@floating-ui/dom` on first `connect()` (optional peer dep). If the import fails, it logs a `console.error` and automatically falls back to `NativePositionStrategy` (top/bottom only, no flip/shift). Subsequent `position()` calls use the fallback transparently.

**NativePositionStrategy** uses `getBoundingClientRect`. Supports vertical placement only; horizontal centering clamped to viewport with 8px margin. Auto-update via passive `window scroll` and `resize` listeners.

## Trigger discovery

On `afterNextRender`, the component resolves the trigger element:

1. Explicit marker wins: first child with `[interopTooltipTrigger]`, read via `contentChild(InteropTooltipTriggerDirective, { read: ElementRef })`
2. Auto-detection fallback: `querySelector('button, a[href], input, select, textarea, [tabindex]')` on the host

Use `[interopTooltipTrigger]` when auto-detection would pick the wrong element, or when the trigger is a component that renders its focusable element internally.

## Configuration

Three-level resolution: instance input > `INTEROP_TOOLTIP_CONFIG` token > `INTEROP_TOOLTIP_DEFAULTS`.

```typescript
// Global defaults (app.config.ts)
{ provide: INTEROP_TOOLTIP_CONFIG, useValue: { showDelay: 400, placement: 'bottom' } }
```

| Config key | Default | Description |
|---|---|---|
| `placement` | `'top'` | Preferred placement; FloatingUI flips/shifts if needed |
| `showDelay` | `600` | Hover delay (ms); focus always immediate |
| `offset` | `8` | Gap between trigger edge and panel (px) |
| `semantic` | `'description'` | `'description'` → `aria-describedby`; `'label'` → `aria-labelledby` |
| `touchBehavior` | `'none'` | `'none'` / `'longpress'` / `'tap'` — touch device behavior |

## Inputs / Outputs

| Input | Type | Default | Notes |
|---|---|---|---|
| `label` | `string` | `''` | String content; overridden by `[interopTooltipContent]` template |
| `placement` | `Placement \| undefined` | `undefined` | Falls through to config/defaults |
| `showDelay` | `number \| undefined` | `undefined` | Falls through to config/defaults |
| `offset` | `number \| undefined` | `undefined` | Falls through to config/defaults |
| `semantic` | `'description' \| 'label' \| undefined` | `undefined` | Falls through to config/defaults |

| Output | Type | Notes |
|---|---|---|
| `visibilityChange` | `boolean` | Emits `true` on show, `false` on hide |

## DevMode warnings

1. **No focusable trigger found** — `console.warn` if neither `[interopTooltipTrigger]` nor a standard focusable element exists in the projected content.
2. **Native `[disabled]` on trigger** — `console.error`: disabled elements receive no hover/focus events; tooltip will never show. Redirect to `aria-disabled`.
3. **No content provided** — `console.warn` if both `label` and `[interopTooltipContent]` are absent.
4. **`semantic="label"` with visible text** — `console.warn` if `aria-labelledby` would override visible text content, which suppresses it for screen reader users.

## CSS strategy

Two-file split per `css-strategy.md`:

| File | Purpose |
|---|---|
| `src/lib/styles/components/tooltip.css` | Structural rules — layout, animation mechanism, state activation selectors |
| `src/lib/styles/themes/protocol/components/tooltip.css` | Token values — colors, radii, shadows, durations |

Both files are imported globally (no per-component `styleUrl`). The structural file owns:

- `.interop-tooltip__panel` base rules: `position: fixed`, `opacity: 0`, `padding`, `border-radius`, `font-size`, `max-inline-size`, `box-shadow`, `transition`
- `:not(:popover-open)` closed-state override: `display: block; pointer-events: none; top: -9999px; left: -9999px` — keeps the element in the AT tree without affecting layout
- `:popover-open` open state: `opacity: 1; transform: scale(1); pointer-events: auto`
- `@starting-style` entry animation: `opacity: 0; transform: scale(0.96)`
- `@supports (transition-behavior: allow-discrete)` guard — prevents fallback browsers from rejecting the full `transition` shorthand when `overlay`/`display` discrete transitions are included
- `@media (prefers-reduced-motion: reduce)` override: `transition: none`

All selectors are wrapped in `:where()` for zero specificity. No pseudo-elements on this component, so the pseudo-element exception from `css-strategy.md` does not apply.

Token naming follows `--itx-[component]-[property](-[state])`:

```
--itx-tooltip-background
--itx-tooltip-foreground
--itx-tooltip-padding
--itx-tooltip-border-radius
--itx-tooltip-font-size
--itx-tooltip-max-width
--itx-tooltip-shadow
--itx-tooltip-enter-duration
--itx-tooltip-exit-duration
--itx-tooltip-enter-easing
--itx-tooltip-exit-easing
```

The Protocol theme sets a dark-pill appearance via `light-dark()` so the tooltip inverts correctly for both color schemes — dark background in light mode, dark background in dark mode — without mode-specific overrides.

## CSS Anchor Positioning migration

Both `interop-tooltip` and `interop-popover` already set `anchor-name` / `position-anchor` inline to prepare for this. When CSS anchor positioning reaches Newly Available baseline, swap `useFactory` in the `providers` array to a `CssAnchorPositionStrategy`. The component code requires no other changes — `position()` and `startAutoUpdate()` become no-ops in that strategy.

## Known gaps

- **Touch behavior** — `touchBehavior: 'longpress'` and `'tap'` are defined in the config interface but not yet implemented in the component.
- **Close-reason tracking** — `visibilityChange` emits a boolean, not a reason code. If consumers need to distinguish Escape-dismiss from blur-hide, they must track it externally.
- **Left/right native fallback** — `NativePositionStrategy` only supports vertical placement. On left/right requests it still resolves top/bottom. No warning is emitted.
