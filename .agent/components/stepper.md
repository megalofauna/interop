# InteropStepper — Mental Model Card

## Files

```
src/lib/components/interop-stepper/
  interop-stepper.ts           component, IInteropStepper impl
  interop-stepper.html         template (nav + viewport + actions)
  interop-stepper.token.ts     IInteropStepper, StepperNavContext, StepPanelRef interfaces + token
  interop-step.ts              li[interop-step] — indicator + label + registration
  interop-step-panel.ts        section[interop-step-panel] — panel ref + focus
  interop-step-list.directive  ol[interop-step-list] — structural only
src/lib/styles/components/stepper.css       structural rules
src/lib/styles/themes/protocol/components/stepper.css  token values
projects/demo/src/app/pages/stepper/        demo page
```

## DOM structure

```html
<interop-stepper>
  <nav class="interop-stepper__nav">
    <!-- Compact trigger (narrow viewports): button or div -->
    <button class="interop-stepper__nav-trigger" [interop-popover-trigger]="menuPopover" [popoverHaspopup]="'menu'" ...>
      <interop-icon /> step label  N/M
    </button>
    <!-- Full step list (wide viewports) -->
    <ol interop-step-list>
      <li interop-step label="Step 1">...</li>
    </ol>
  </nav>

  <!-- Popover hoisted to root template scope so both triggers (nav-trigger
       above, action-bar menu-trigger below) can bind via #menuPopover -->
  <div #menuPopover="interopPopover" interop-popover placement="top-start">
    @if (menu() !== "never") {
      <ul interop-listbox ...></ul>
    }
  </div>

  <div #viewport class="interop-stepper__viewport">
    <section interop-step-panel>Panel 1</section>
    <section interop-step-panel>Panel 2</section>
  </div>

  <div class="interop-stepper__actions">
    <!-- Source order = priority order (Back first, then Next, then secondary) -->
    <button interop-button (click)="back()">Back</button>
    <button interop-button (click)="next()">Next/Finish</button>
    <!-- Action-bar menu trigger (when menu="always") and cancel (when cancellable) follow -->
    <button class="interop-stepper__menu-trigger" [interop-popover-trigger]="menuPopover" [popoverHaspopup]="'menu'">
      <interop-icon name="tabler-list" />
    </button>
  </div>
</interop-stepper>
```

## State machine

### Monotonic frontier

The central invariant: completion is irreversible by navigation.

```typescript
private readonly _frontier = signal<number>(0);
```

- `_frontier` = the highest index the user has ever *advanced to*
- Forward navigation: `if (index > _frontier()) _frontier.set(index)`
- Backward navigation: `_frontier` never decreases
- `reset()`: `_frontier.set(0)` — the only rollback path

### Auto-status derivation

```typescript
getAutoStatus(index: number): StepStatus {
  if (index === this.activeIndex()) return 'active';
  if (index < this._frontier())    return 'completed';
  return 'pending';
}
```

Exactly one step is "active" at a time. Status is derived, not stored per-step.

### `wasReached(index)`

```typescript
wasReached(index: number): boolean { return index < this._frontier(); }
```

True when the user has ever advanced past this step. Drives the `interop-step--reviewed` host class independently of `getAutoStatus()`. Used for the composite `active + reviewed` visual — a step the user revisited looks different from a fresh active step.

### CSS class mapping

| Condition | Classes on `li[interop-step]` |
|---|---|
| Auto-status active, never visited before | `interop-step--active` |
| Auto-status active, revisited (was reviewed) | `interop-step--active interop-step--reviewed` |
| Auto-status completed | `interop-step--completed` |
| Auto-status pending, past frontier | `interop-step--locked` |
| Consumer-provided status | overrides auto (error, skipped, etc.) |

## Scroll-snap viewport

The viewport is a flex container with `scroll-snap-type: x/y mandatory`. Each panel is `flex: 0 0 100%; scroll-snap-align: start; scroll-snap-stop: always`.

### Programmatic scroll

`_scrollToActivePanel()` is called by `_navigate()` and `reset()`. Key details:

1. Sets `_isProgrammaticScroll = true` before the scroll
2. Schedules scroll via `requestAnimationFrame` — defers until Angular has flushed `[hidden]` bindings (critical for first forward navigation in linear mode)
3. Uses `viewportEl.scrollTo({ top/left })` computed from `getBoundingClientRect()` offsets — NOT `scrollIntoView()`, which would scroll the page
4. Sets a 1-second fallback `setTimeout` to clear `_isProgrammaticScroll` if `scrollend` never fires
5. `scrollend` handler: clears flag + focuses destination panel

### Gesture-driven scroll

`scrollend` fires after a touch swipe settles. The handler checks `_isProgrammaticScroll`:
- If true: programmatic scroll just landed — focus panel, clear flag
- If false: gesture scroll — compute snapped index from `Math.round(scrollPos / clientDim)`, call `_setActiveFromScroll(idx)`

`_setActiveFromScroll` mirrors `_navigate` but skips the scroll call.

## Popover menu

The menu is an `InteropPopover` instance. The directive owns the per-instance id, the `anchor-name` / `position-anchor` wiring, and the `popover` attribute. Positioning is delegated to `INTEROP_POSITION_STRATEGY` (FloatingUI by default) and configured via `placement="top-start"` on the popover element so the menu opens upward — matching the action-bar's bottom-of-stepper position. FloatingUI flips automatically when there's no room above.

The compact nav-trigger (narrow viewports) and the action-bar menu-trigger (wide viewports + `menu="always"`) both bind to the same popover via `[interop-popover-trigger]="menuPopover"` referencing a `#menuPopover="interopPopover"` template ref variable.

**Template-scope detail:** `#menuPopover` is declared at the root template scope, NOT inside an `@if`. Template ref variables declared inside `@if` blocks are scoped to that block, so siblings can't see them — and the two triggers live in separate `@if` branches. Hoisting the popover element to root scope is what makes both bindings reachable. The popover's inner listbox content is gated by `@if (menu() !== "never")` so `menuOptions()` doesn't recompute when the menu UI is disabled. When `menu="never"` the popover element renders but has no triggers and no listbox content; the native `popover` attribute keeps it hidden.

Programmatic dismissal after step selection: `this.menuPopover()?.close()` (uses the directive's API, not raw `hidePopover()`).

## Registration protocol

Steps and panels self-register in `ngOnInit` via the injected `INTEROP_STEPPER_TOKEN`:

```typescript
// In InteropStep.ngOnInit():
this.index = this.stepper.registerStep(this.label);   // returns 0-based index

// In InteropStepPanel.ngOnInit():
this.index = this.stepper.registerPanel(this);        // returns 0-based index
```

The `StepPanelRef` interface the stepper holds:
```typescript
interface StepPanelRef {
  requestFocus(options?: { preventScroll?: boolean }): void;
  getElement(): HTMLElement;
}
```

## Action bar layout

Source order = priority order. CSS layout rules (see css-strategy.md):
- `margin-inline-start: auto` on `:first-child` pushes primary pair to the end
- `order: -1` on `:nth-child(n+3)` moves secondary items to the start

Effective rendering order: `[cancel] [menu] ← space → [back] [next]`

## Key inputs

| Input | Default | Effect |
|---|---|---|
| `linear` | `true` | Locks future steps until advanced to |
| `orientation` | `'horizontal'` | `'vertical'` stacks panels vertically |
| `actions` | `true` | Renders built-in action bar |
| `responsiveActions` | `false` | `'sm'/'md'/'lg'` stacks buttons at 320/480/640px |
| `menu` | `'auto'` | `'always'` shows menu button at all sizes; `'never'` removes it |
| `cancellable` | `false` | Shows Cancel button; `cancel` output fires |

## Icons

Default icons are registered in the component's own `providers` array:
```typescript
provideInteropIcons(TablerCheck, TablerAlertCircle, TablerMinus, TablerList)
```
This ensures they're available without consumer setup. Consumers can override at any ancestor scope.

Icon names used: `tabler-check` (completed), `tabler-alert-circle` (error), `tabler-minus` (skipped), `tabler-list` (menu trigger).
