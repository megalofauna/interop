# InteropTooltip — Mental Model Card

## Files

```
src/lib/components/interop-tooltip/
  interop-tooltip.controller.ts          shared state machine (show/hide/listeners)
  interop-tooltip.ts                     wrapper component (projection-slot ergonomics)
  interop-tooltip.html                   component template (panel + ng-template outlet)
  interop-tooltip.directive.ts           [interopTooltip] directive (attribute form)
  interop-tooltip-content.directive.ts   marker — rich-content slot (component-only)
  interop-tooltip-trigger.directive.ts   marker — trigger disambiguation (component-only)
  interop-tooltip.config.ts             INTEROP_TOOLTIP_CONFIG token + defaults
  position-strategy.ts                   InteropPositionStrategy + INTEROP_POSITION_STRATEGY token
  floating-ui.strategy.ts               FloatingUiPositionStrategy (default, lazy-loads @floating-ui/dom)
  native.strategy.ts                    NativePositionStrategy (fallback, top/bottom only)
  public-api.ts                         barrel
src/lib/styles/components/tooltip.css            structural rules
src/lib/styles/themes/protocol/components/tooltip.css  token values
projects/demo/src/app/pages/tooltip/             demo page
```

## Architecture

**Two surfaces, one shared state machine.** Both forms delegate to `InteropTooltipController` (a plain TS class), which owns: ARIA wiring on the trigger, strategy connect, all listeners (hover, focus, activate, panel hover, document Escape), show/hide timer state, and visibility callbacks. The component and the directive differ only in how the trigger and panel are sourced.

### Form 1 — `<interop-tooltip>` wrapper component

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

`host: { style: 'display: contents' }` — invisible to layout. Trigger is the first focusable projected child, or the element marked `[interopTooltipTrigger]`. Panel is rendered inside the component's own template (`#tooltipPanel`).

### Form 2 — `[interopTooltip]` directive (attribute form)

```html
<!-- String label -->
<button
  [interopTooltip]="'Align left'"
  [interopTooltipSemantic]="'label'">
  <interop-icon name="tabler-align-left" />
</button>

<!-- Rich content via inline template -->
<button [interopTooltip]="saveTpl">Save</button>
<ng-template #saveTpl>Save &nbsp;<kbd>Ctrl</kbd>+<kbd>S</kbd></ng-template>
```

Host element IS the trigger — no wrapping, no `display: contents` shim. Panel is created in `afterNextRender` as a `<div role="tooltip" popover="manual" class="interop-tooltip__panel">` and appended to **the nearest `[interop-root]` ancestor** of the host, falling back to `document.body`. The `[interop-root]` lookup is load-bearing: theme tokens (`--itx-tooltip-*`) are scoped to `[interop-root]`, so a panel appended directly to `document.body` would render with the structural-file defaults (a boring grey pill) instead of the active theme. ARIA attribute applied directly to host.

Content sync runs in an `effect()` so swapping string ↔ string or string ↔ TemplateRef re-renders the panel. TemplateRef path uses `ViewContainerRef.createEmbeddedView(tpl)`, then moves the embedded view's root nodes into the panel (the view stays attached to the container for change-detection and DI scope).

### When to use which

| Situation | Use |
|---|---|
| Standalone control, projection-slot ergonomics desired | component `<interop-tooltip>` |
| Control inside a structured parent (segmented control, listbox, radio group, menu, toolbar) | directive `[interopTooltip]` |
| Want a `[interopTooltipContent]` `<ng-template>` adjacent to the trigger in the same projection | component |
| Single attribute is enough, no wrapper desired | directive |

The directive is the right answer for any case where wrapping would interpose between a parent and its child-discovery (Angular content queries, scope-direct-child CSS selectors, roving-tabindex contracts).

## Native popover semantics

The panel uses `popover="manual"` — top-layer promotion, but **no** browser light-dismiss and **no** browser Escape handling. The controller owns the full show/hide lifecycle explicitly:

- Show on hover (after `showDelay`) or focus (immediately)
- Hide on blur, mouse-leave (150ms grace for WCAG 1.4.13 Hoverable), or pointerdown on the trigger (click-dismiss)
- Escape handled at `document` level (WCAG 1.4.13 Dismissible) — document-level so hover-triggered tooltips can be dismissed when keyboard focus is elsewhere

## WCAG 1.4.13 compliance

| Criterion | Requirement | Implementation |
|---|---|---|
| Dismissible | User can dismiss without moving focus | `document keydown` → Escape hides, focus untouched |
| Hoverable | Mouse can travel from trigger to panel without closing | `mouseenter`/`pointerenter` on the panel calls `cancelClose()` |
| Persistent | No auto-dismiss timer | No `setTimeout` on the visible state — only on open/close transitions |

## Accessibility model

The panel has `role="tooltip"` and is always in the DOM at `opacity: 0` (never `display: none`). This matters for AT: NVDA and JAWS resolve `aria-describedby` by reading the referenced element's text at focus time — `display: none` would yield empty description. `opacity: 0` keeps it measurable and AT-readable before the first hover.

ARIA on the trigger:
- `aria-describedby` (default `semantic="description"`) — supplemental info, announced after the name
- `aria-labelledby` (`semantic="label"`) — replaces the accessible name. Reserve for icon-only controls with no other accessible name. A dev-mode warning fires if the host has visible text content and no `aria-label`.

## Show/hide mechanics

The controller tracks active show reasons in a `Set<'focus' | 'hover'>`. This prevents the classic hover-then-focus race condition:

- `requestShow(reason, delay)` — adds to set, schedules `showTooltip()` after delay
- `requestHide(reason, delay)` — removes from set; hides only when set is empty
- `cancelClose()` — clears pending hide timer (called when mouse enters panel)
- `dismissOnActivate()` — clears the reasons set and hides immediately on `pointerdown`. Without this, button activation often leaves the trigger focused, and the focus reason re-shows the tooltip over the just-pressed control.

The focus listener also gates on `trigger.matches(':focus-visible')` before requesting a show. Without this check, a pointer click that lands focus on the trigger would re-open the tooltip immediately after `dismissOnActivate` hid it — `:focus-visible` is exactly the browser's "focus came from keyboard / AT" heuristic, so deferring to it keeps Tab-focus showing tooltips while suppressing click-focus. This matches the project's general `:focus-visible` pattern for JS focus handlers (see `feedback_focus_visible.md`).

Focus always shows immediately (delay 0); hover respects `showDelay` (default 600ms).

## Safari cross-browser event compat

Both `mouseenter` + `pointerenter` are bound on trigger and panel. Safari does not reliably fire `pointerenter` on elements adjacent to native `[popover]` elements, but `mouseenter` alone is also insufficient in Safari. The combination works cross-browser. Duplicate fires are harmless — `requestShow` is idempotent when already visible.

## Position strategy

```typescript
providers: [
  { provide: INTEROP_POSITION_STRATEGY, useFactory: () => new FloatingUiPositionStrategy() },
],
```

Provided per-instance on both the component and the directive (each tooltip gets its own). Strategy lifecycle:

1. `connect(trigger, panel)` — called by the controller's constructor; also kicks off the lazy `@floating-ui/dom` import
2. `position({ placement, offset })` → `Promise<ResolvedPlacement>` — applies `top`/`left` inline styles (FloatingUI) or `position-area` (future CSS anchor strategy)
3. `startAutoUpdate(cb)` → `() => void` — scroll/resize loop while panel is visible
4. `disconnect()` — called from controller `destroy()`; cleans up styles and listeners

**FloatingUiPositionStrategy** lazy-loads `@floating-ui/dom` on first `connect()` (optional peer dep). If the import fails, it logs `console.error` and automatically falls back to `NativePositionStrategy` (top/bottom only, no flip/shift). Subsequent `position()` calls use the fallback transparently.

**NativePositionStrategy** uses `getBoundingClientRect`. Vertical placement only; horizontal centering clamped to viewport with 8px margin. Auto-update via passive `window scroll` and `resize` listeners.

## Trigger discovery

### Component
On `afterNextRender`, resolves trigger:
1. Explicit marker: first child with `[interopTooltipTrigger]`
2. Fallback: `querySelector('button, a[href], input, select, textarea, [tabindex]')` on the host

Use `[interopTooltipTrigger]` when auto-detection picks the wrong element, or when the trigger is a component that renders its focusable element internally.

### Directive
The host element IS the trigger. No discovery. A dev-mode warning fires if the host is not intrinsically focusable.

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
| `touchBehavior` | `'none'` | `'none'` / `'longpress'` / `'tap'` — touch behaviour |

## Inputs / Outputs

### Component `<interop-tooltip>`

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

### Directive `[interopTooltip]`

All inputs use the `interopTooltip*` prefix to avoid clashing with host attributes.

| Input | Type | Notes |
|---|---|---|
| `interopTooltip` | `string \| TemplateRef<unknown>` | Required. String label or rich-content template. |
| `interopTooltipPlacement` | `Placement \| undefined` | Falls through to config/defaults |
| `interopTooltipShowDelay` | `number \| undefined` | Falls through to config/defaults |
| `interopTooltipOffset` | `number \| undefined` | Falls through to config/defaults |
| `interopTooltipSemantic` | `'description' \| 'label' \| undefined` | Falls through to config/defaults |

| Output | Type | Notes |
|---|---|---|
| `interopTooltipVisibilityChange` | `boolean` | Emits `true` on show, `false` on hide |

## DevMode warnings

### Component
1. **No focusable trigger found** — `console.warn` if neither `[interopTooltipTrigger]` nor a standard focusable element exists in the projected content.
2. **Native `[disabled]` on trigger** — `console.error`: disabled elements receive no hover/focus events; tooltip will never show. Redirect to `aria-disabled`.
3. **No content provided** — `console.warn` if both `label` and `[interopTooltipContent]` are absent.
4. **`semantic="label"` with visible text and no `aria-label`** — `console.warn`: `aria-labelledby` would override visible text content, suppressing it for screen reader users.

### Directive
1. **Native `[disabled]` on host** — same warning, same reason.
2. **Host is not intrinsically focusable** — `console.warn` if the host element isn't a button/a[href]/input/select/textarea and has no `tabindex`.
3. **`semantic="label"` with visible text and no `aria-label`** — same as component.

## CSS strategy

Two-file split per `css-strategy.md`:

| File | Purpose |
|---|---|
| `src/lib/styles/components/tooltip.css` | Structural — layout, animation mechanism, state activation selectors |
| `src/lib/styles/themes/protocol/components/tooltip.css` | Values — colors, radii, shadows, durations |

Both files are imported globally. The `.interop-tooltip__panel` class is shared between component-templated panels and directive-created panels, so styling is identical regardless of which form created it.

Structural file owns:
- `.interop-tooltip__panel` base rules: `position: fixed`, `opacity: 0`, `padding`, `border-radius`, `font-size`, `max-inline-size`, `box-shadow`, `transition`
- `:not(:popover-open)` closed-state override: `display: block; pointer-events: none; top: -9999px; left: -9999px` — keeps the element in the AT tree without affecting layout
- `:popover-open` open state: `opacity: 1; transform: scale(1); pointer-events: auto`
- `@starting-style` entry animation
- `@supports (transition-behavior: allow-discrete)` guard — prevents fallback browsers from rejecting `overlay`/`display` discrete transitions
- `@media (prefers-reduced-motion: reduce)` override

All selectors are wrapped in `:where()` for zero specificity. No pseudo-elements on this component, so the pseudo-element exception from `css-strategy.md` does not apply.

Token naming follows `--itx-tooltip-[property](-[state])`:
```
--itx-tooltip-background        --itx-tooltip-foreground
--itx-tooltip-padding           --itx-tooltip-border-radius
--itx-tooltip-font-size         --itx-tooltip-max-width
--itx-tooltip-shadow
--itx-tooltip-enter-duration    --itx-tooltip-exit-duration
--itx-tooltip-enter-easing      --itx-tooltip-exit-easing
```

The Protocol theme sets a dark-pill appearance via `light-dark()` so the tooltip inverts correctly for both color schemes.

## CSS Anchor Positioning migration

When CSS anchor positioning reaches Newly Available baseline, swap the `useFactory` in the `providers` array to a `CssAnchorPositionStrategy`. The controller code requires no changes — `position()` and `startAutoUpdate()` become no-ops in that strategy. Applies to both component and directive forms.

## Known gaps

- **Touch behavior** — `touchBehavior: 'longpress'` and `'tap'` are defined in the config interface but not yet implemented in the controller.
- **Close-reason tracking** — `visibilityChange` emits a boolean, not a reason code. If consumers need to distinguish Escape-dismiss from blur-hide from pointerdown-dismiss, they must track it externally.
- **Left/right native fallback** — `NativePositionStrategy` only supports vertical placement. On left/right requests it still resolves top/bottom. No warning is emitted.
- **Directive panel placement in DOM** — panel is appended to the nearest `[interop-root]` ancestor (or `document.body` if there is none). Inside Shadow DOM contexts a consumer-supplied outlet may be needed; not currently supported.
