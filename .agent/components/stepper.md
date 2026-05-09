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
    <button class="interop-stepper__nav-trigger" [style.anchor-name]="menuAnchorName" ...>
      <interop-icon /> step label  N/M
    </button>
    <!-- Full step list (wide viewports) -->
    <ol interop-step-list>
      <li interop-step label="Step 1">...</li>
    </ol>
  </nav>

  <div #viewport class="interop-stepper__viewport">
    <section interop-step-panel>Panel 1</section>
    <section interop-step-panel>Panel 2</section>
  </div>

  <div class="interop-stepper__actions">
    <!-- Source order = priority order (Back first, then Next, then secondary) -->
    <button interop-button (click)="back()">Back</button>
    <button interop-button (click)="next()">Next/Finish</button>
    <!-- menu trigger (always mode) and cancel (cancellable mode) follow -->
  </div>

  <!-- Popover: lifted to stepper top-level, positioned via anchor-name -->
  <div #menuPopover [id]="menuId" popover [style.position-anchor]="menuAnchorName">
    <interop-listbox ... />
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

Per-instance anchor names prevent multiple steppers from colliding:

```typescript
protected readonly menuId = `interop-stepper-menu-${nextStepperId++}`;
protected readonly menuAnchorName = `--${this.menuId}-anchor`;
```

The compact nav-trigger and the menu popover share these via `[style.anchor-name]` / `[style.position-anchor]`. At narrow viewports the full step list is hidden (`display: none`) and the nav-trigger is shown — since the nav-trigger is in layout, the popover anchors to it. At wide viewports the nav-trigger is `display: none` so it exits anchor resolution.

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
