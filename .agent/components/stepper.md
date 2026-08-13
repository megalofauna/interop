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
    <!-- Compact trigger: rendered in vertical mode (always) and in horizontal
         narrow mode when menu="always". For horizontal menu="auto"|"never" it
         stays display:none — the in-flow step list inside the scroll-area is
         the mobile UX instead. -->
    <button class="interop-stepper__nav-trigger" [interop-popover-trigger]="menuPopover" [popoverHaspopup]="'menu'" ...>
      <interop-icon /> step label  N/M
    </button>
    <!-- Horizontal: step list wrapped in InteropScrollArea so a narrow
         viewport can scroll the strip horizontally with edge fades.
         Vertical: bare ng-content slot, no scroll-area. -->
    <interop-scroll-area orientation="horizontal" class="interop-stepper__list-scroll">
      <ol interop-step-list>
        <li interop-step label="Step 1">...</li>
      </ol>
    </interop-scroll-area>
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

The menu is an `InteropPopover` instance, used as an *opt-in alternative* to
the default scroll-area mobile pattern. Surfaced when:

- `orientation="vertical"` — the step list lives in the popover (consumer
  supplies it via `[stepListTemplate]`); the compact nav-trigger is always
  present as the popover trigger.
- `menu="always"` — popover trigger present at every viewport size. On
  narrow horizontal it replaces the in-flow step list (compact nav-trigger
  pattern). On wide horizontal a separate menu button sits in the action
  bar; the in-flow step list remains visible.
- `menu="auto"` (default) / `"never"` in horizontal — popover element
  renders but has no triggers; the scroll-area wrapper handles overflow.

The directive owns the per-instance id, the `anchor-name` /
`position-anchor` wiring, and the `popover` attribute. Positioning is
delegated to `INTEROP_POSITION_STRATEGY` (FloatingUI by default) and
configured via `placement="top-start"` on the popover element so the menu
opens upward — matching the action-bar's bottom-of-stepper position.
FloatingUI flips automatically when there's no room above.

The compact nav-trigger (narrow + `menu="always"`, or vertical) and the
action-bar menu-trigger (wide + `menu="always"`) both bind to the same
popover via `[interop-popover-trigger]="menuPopover"` referencing a
`#menuPopover="interopPopover"` template ref variable.

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

## Typography and paint — Carbon round 15

Carbon has no "Stepper". Its equivalent is **Progress Indicator**, and the borrow
was narrow because the shape already agreed: 2px connector line, a round
indicator per step, label beneath (horizontal) or beside (vertical), and a state
per step. What round 15 actually did was fix three things it found on the way in.

**Step type is fixed rem, and must stay that way.** Both the label and the
indicator numeral were reading `--itx-font-size-label`, a fluid `clamp()` role
token. The numeral sits inside a fixed 32px circle and the label inside a fixed
track, so both grow toward overflow as the viewport widens — the exact trap the
borrow workflow warns about. Label is now `0.875rem` (Carbon `$body-compact-01`)
and the numeral `0.8125rem`. Do not "simplify" these back onto a role token.

**`--itx-on-neutral` never existed.** The theme read it twice, with `white` and
`black` as literal fallbacks, so the active indicator painted white on
`--itx-neutral-3` — which is *light* in light mode. The current step's number
measured **1.23:1**. Both now use `--itx-on-surface`, the `light-dark()` pair
that belongs opposite a neutral surface: 16.0 light, 13.7 dark. The lesson
generalises — a fallback on a token that does not exist is not a fallback, it is
the value, and it cannot follow the scheme.

**The step list is `interop-typography-isolate`d.** It is a row of controls, not
running text, and prose.css was putting `--itx-rhythm-tight` between every
adjacent `<li>`. Horizontally that pushed every step after the first down 16px,
so the strip and its connector visibly stepped downward; vertically it opened a
gap the component never asked for. The isolate attribute is the documented
mechanism and the one `interop-tree`, `interop-listbox` and the field controls
already use.

### Declined from Carbon

- **`$interactive` (brand blue) on the current and completed connector.** The
  house uses neutral for structure and keeps colour for state that matters —
  rounds 2, 3 and 4 all went the same way. Our connector stays neutral-5 → 
  neutral-8, and the indicator fill carries the state instead.
- **The 16px indicator.** Carbon's holds an icon; ours holds a numeral and needs
  the 32px box to do it.
- **Flat label colour** (`$text-primary` on every step). Ours dims per state,
  which is a real distinction Carbon offloads onto the line colour it paints
  brand — having declined that, the dimming is doing the work instead.

### Known gaps this surfaced

- **No `--itx-step-label-line-height` token.** The label computes `line-height:
  normal`; Carbon specifies 1.45 horizontal. Adding one is a foundation change,
  so it was left out of a theme-only round.
- **`--itx-step-optional-opacity: 0.65`** paints the optional-step hint with
  opacity rather than a colour. Opacity multiplies against whatever is behind,
  so the contrast is unknowable from the token alone; Carbon uses
  `$text-secondary` (our `--itx-neutral-9`). Switching needs a foundation colour
  token. No demo currently renders an optional step, so this is untested either
  way.
- **The demo page has no CSS-tokens section**, unlike its siblings — so there is
  no table to keep in sync, and no published surface for the ~60 `--itx-step*`
  tokens.
