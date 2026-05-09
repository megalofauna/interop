# InteropPopover — Mental Model Card

## Files

```
src/lib/components/interop-popover/
  interop-popover.ts                  main directive (panel)
  interop-popover-trigger.ts          trigger directive
  interop-popover-arrow.ts            marker directive (custom arrow)
  interop-popover.types.ts            shared types + global config token
  public-api.ts                       barrel
src/lib/styles/components/popover.css            structural rules
src/lib/styles/themes/protocol/components/popover.css  token values
projects/demo/src/app/pages/popover/             demo page
```

Shares positioning infrastructure with `InteropTooltip` — imports `FloatingUiPositionStrategy` and `INTEROP_POSITION_STRATEGY` from `interop-tooltip/`. Same migration story for CSS anchor positioning when that ships in all browsers.

## Architecture

**Two directives + one marker:**

```html
<!-- Trigger: any focusable element -->
<button [interop-popover-trigger]="ref" [popoverHaspopup]="'menu'">Open</button>

<!-- Panel: any element. -->
<div #ref="interopPopover" interop-popover [showArrow]="true">
  <ul interop-listbox>...</ul>
</div>
```

The trigger and popover are decoupled in the DOM — they communicate via the template-ref input. `[interop-popover-trigger]` accepts an `InteropPopover` directive instance.

**Why directive (not component):** the popover's host element is the consumer's choice (`<div>`, `<aside>`, `<menu>`, etc.). The directive applies behavior + the native `popover` attribute without dictating the element.

## Native popover semantics

The directive sets `popover="auto"` (default), `"manual"`, or `"hint"` based on `popoverType` input.

| Mode | Light-dismiss? | Stack | Right for |
|---|---|---|---|
| `auto` | yes (click outside, Escape) | one open at a time | menus, dropdowns, selection panels |
| `manual` | no | independent | non-modal panels that shouldn't auto-dismiss |
| `hint` | pointer events outside | separate from `auto` | tooltip-mode (Chrome 131+; degrades on others) |

The native `popover` attribute handles top-layer promotion — no z-index management, no portaling, no fighting `transform`-on-ancestor stacking issues.

## Lifecycle

The directive listens to the native `toggle` event:

```typescript
@HostListener('toggle', ['$event'])
onToggle(event: ToggleEventLike): void {
  if (event.newState === 'open')  { /* connect, position, focus */ }
  else                            { /* stop autoUpdate, restore focus */ }
}
```

On open:
1. Capture `document.activeElement` as `previousFocus`
2. Connect position strategy (idempotent)
3. `position()` — applies inline `top`/`left` (FloatingUI) or sets CSS anchor properties (when swapped)
4. `startAutoUpdate()` — keeps position synced to scroll/resize
5. `applyAutoFocus()` — if `autoFocus` input is set, focus the matching child

On close:
1. Stop autoUpdate
2. Restore focus to `previousFocus` with `{ preventScroll: true }` (matches the dialog's no-flash fix)
3. Emit `(closed)` with reason: `'programmatic'`, `'light-dismiss'`, or `'trigger'`

## Trigger directive — what it wires

`[interop-popover-trigger]` sets the following on its host element:

| Attribute | Source |
|---|---|
| `popovertarget` | `target.popoverId` |
| `popovertargetaction` | `'toggle'` |
| `aria-expanded` | `target.isOpen()` (signal) |
| `aria-controls` | `target.popoverId` |
| `aria-haspopup` | `[popoverHaspopup]` input (consumer-set) |
| `style.anchor-name` | `target.anchorName` (per-instance, future-proofs CSS anchor positioning) |

`aria-haspopup` is the consumer's call: `'menu'` for command lists, `'listbox'` for selection, `'dialog'` rare, `true` for generic.

## Arrow modes

Three orthogonal modes:

```html
<!-- 1. No arrow (default) -->
<div interop-popover>...</div>

<!-- 2. Built-in CSS triangle (auto-positioned per data-placement) -->
<div interop-popover [showArrow]="true">...</div>

<!-- 3. Custom — any element with the marker, auto-rotated per placement -->
<div interop-popover>
  <span interop-popover-arrow>
    <interop-icon name="tabler-caret-up" />
  </span>
  ...
</div>
```

The structural CSS suppresses the built-in triangle automatically when `[interop-popover-arrow]` is present (`:has()` selector). Consumers don't have to set `[showArrow]="false"`.

For custom arrows, the structural CSS rotates the marker by 0/90/180/270deg based on `[data-placement]`, so a single icon (e.g. `caret-up`) reorients correctly for all four sides.

## Position strategy

Reuses the tooltip's infrastructure:

```typescript
providers: [
  { provide: INTEROP_POSITION_STRATEGY, useFactory: () => new FloatingUiPositionStrategy() },
],
```

Per-component-instance — every `[interop-popover]` gets its own strategy instance. Consumers can override globally or per-subtree.

When CSS anchor positioning reaches Newly Available baseline, swap the provider's `useFactory` to `CssAnchorPositionStrategy`. The directive's `position-anchor` and `anchor-name` are already set inline; the strategy just becomes a no-op for `position()` and `startAutoUpdate()`.

## Backdrop

`[showBackdrop]="true"` opts the panel into a `::backdrop` rendering that consumes the **global** tokens:

- `--itx-backdrop-color` (defined in `protocol/foundation.css`)
- `--itx-backdrop-blur` (defined in `protocol/foundation.css`)

These are shared across any component that renders a backdrop — dialog, popover, future drawers. A theme decision once, propagated everywhere.

Default is **off**. Backdrops on popovers are usually wrong — the value of an anchored panel is that the underlying content stays visible and active.

## Token surface (Protocol theme)

```
Sizing            min-width, max-width, max-height, padding
Appearance        background, foreground, border-{radius,width,style,color}, shadow
Animation         enter/exit duration + easing, enter/exit translate vector
Arrow             arrow-size, arrow-color, arrow-offset
Backdrop (global) --itx-backdrop-color, --itx-backdrop-blur
```

24 component-scoped tokens + 2 global backdrop tokens.

## DevMode warnings

1. **No trigger registered after init** — the popover's `registerTrigger` was never called by an `[interop-popover-trigger]`. ARIA wiring missing. Logged from `ngAfterViewInit` via microtask.

2. **No target on trigger** — `[interop-popover-trigger]` was applied without binding to an `InteropPopover` instance. Logged from the trigger's `ngAfterViewInit`.

## Known gaps

- **Close-reason precision** — `'trigger'` vs `'light-dismiss'` distinction is currently always reported as `'light-dismiss'` for non-programmatic closes. Differentiating reliably requires extra event tracking on the trigger; deferred until a use case demands it.

- **Keyboard contract for menu content** — when the popover wraps `role="menu"` content, the APG mandates arrow-key navigation, Home/End, character search. That's the **content's** responsibility (`InteropListbox` already handles its part). The popover stays out of internal keyboard navigation.

- **CSS anchor positioning support** — currently no automatic detection. Consumers stay on FloatingUI until they explicitly swap the strategy provider. Once browser support is universal, the default flips.
