# Interop — Playbook

## Spirit

Interop components are semantically correct, accessible first, and performant by default. The right HTML element always wins over a styled `<div>`. Complexity is opt-in — simpler code paths are the default.

## Architecture

### Standalone components
Every component is `standalone: true` with `ChangeDetectionStrategy.OnPush`. No NgModules.

### Signal-based reactivity
- `input<T>()` for all inputs, `output<T>()` for all outputs
- `signal<T>()` for writable internal state
- `computed()` for derived state — never manually sync
- `effect()` sparingly, only when side-effects must track signal changes

### Injection token pattern
Cross-component coordination uses `InjectionToken`. The parent provides itself:
```typescript
providers: [{ provide: INTEROP_STEPPER_TOKEN, useExisting: InteropStepper }]
```
Children inject via `inject(INTEROP_STEPPER_TOKEN, { optional: true })`.

### Host directives
Structural or behavioral concerns that belong on the host element are host directives, not wrapper divs. The component's selector IS the element.

### Icon registry
`provideInteropIcons(...icons)` registers icons at a given scope. An icon lookup walks the injector tree. A component that needs specific icons out-of-the-box should call `provideInteropIcons(...)` in its own `providers` array — this scopes the defaults to the component so consumers don't need to know about them. Per-scope registration does NOT propagate up.

## CSS strategy — see css-strategy.md for full detail

Two-file split: structural rules go in `styles/components/X.css`, token values go in `styles/themes/protocol/components/X.css`. Both are imported globally.

## Action bar layout pattern

Source order = priority order. The "primary" pair (Back, Next) is written first. Secondary items (menu trigger, cancel) are written after. CSS layout rules:

- `margin-inline-start: auto` on `:first-child` pushes the first item — and everything following it in flow — to the inline-end.
- `order: -1` on `:nth-child(n+3)` lifts items 3+ to the inline-start.
- Result: `[secondary] → [space] → [primary-1] [primary-2]`

## DOM writes during animation/drag

Never trigger Angular change detection inside a drag or animation loop. Write directly to `element.style` in pointer event handlers, batched via `requestAnimationFrame`. Emit Angular outputs only at end-of-drag (`pointerup` / `keydown` settle).

## Scroll management

Use `element.scrollTo({ top, left })` computed from `getBoundingClientRect()` rather than `scrollIntoView()`. `scrollIntoView()` walks all scrollable ancestors including the page — this causes the page to scroll when only the component viewport should move.

Defer scroll calls with `requestAnimationFrame()` when they follow an Angular CD flush (e.g., after a `[hidden]` binding changes). Without the defer, the panel may still have `display: none` at the time of the call.

## Container queries

Components that need responsive layout declare `container-type: inline-size; container-name: <name>` on the host. Hard-coded pixel thresholds in `@container` rules are intentional — CSS `@container` parens cannot read custom properties.

## Popover / anchor positioning

When a component needs an anchored overlay (menu, picker, etc.), prefer composing `InteropPopover` + `InteropPopoverTrigger` over hand-rolling the native `popover` attribute and CSS-anchor wiring. The directive owns per-instance id, `anchor-name` / `position-anchor`, ARIA wiring, and delegates positioning to `INTEROP_POSITION_STRATEGY` (FloatingUI by default).

Pattern:
```html
<button [interop-popover-trigger]="menu" [popoverHaspopup]="'menu'">…</button>

<!-- Hoist the popover to the root template scope when multiple triggers
     in sibling @if branches need to bind to it: template ref vars declared
     inside @if are scoped to that block. -->
<div #menu="interopPopover" interop-popover placement="top-start">…</div>
```

Programmatic dismissal: `popoverInstance.close()` (uses the directive's API; do not call raw `.hidePopover()` on the host).

## Accessibility

- Wizard steppers: `<nav>` landmark with `aria-label`, step buttons with `aria-current` and `aria-disabled`
- Drag handles: `role="separator"`, `aria-valuenow/min/max`, `tabindex="0"` when keyboard-enabled
- Focus management: move focus to the destination panel after scroll settles (not during scroll)
- `:focus-visible` for form controls; `:focus-visible` CSS pseudo-class for buttons

## Attribute naming convention

Two namespaces. Never mix their roles.

| Prefix | Role | Examples |
|---|---|---|
| `interop-*` | **Identity / activation** — declares "this element IS an interop component" | `interop-button`, `interop-root`, `interop-dialog`, `interop-popover` |
| `itx-*` | **System configuration** — cross-component modifier axes owned by the design system | `itx-size="md"`, `itx-radius="sm"`, `itx-variant="icon"` |

Rules:
- `interop-*` answers **what is this element**. Never use it to configure appearance.
- `itx-*` answers **how is the system configured for it**. These are reusable across components — the same `itx-size` axis applies to button, segmented control, input, etc.
- **Variant** stays as a value on the identity attribute: `interop-button="primary"`. Variant is definitional — it describes what kind of component this is, not a quantitative axis. `interop-button` with no value is also valid (default/unstyled). CSS uses `[interop-button~="primary"]` to target variants.
- `data-*` remains correct for **component-internal state** (`data-has-selection`, `data-thumb-role`) — internal, not consumer-facing.

Well-formed example:
```html
<!-- identity       system axes -->
<button interop-button itx-size="md" itx-radius="sm" itx-variant="action">Save</button>
```

CSS selectors follow the same split:
```css
/* identity selector */
:where(button[interop-button]) { … }

/* system modifier selectors */
:where(button[interop-button][itx-size="md"]) { … }
:where(button[interop-button][itx-variant="action"]) { … }
```

## What NOT to do

- Don't add fallbacks or validation for scenarios that can't happen inside the library
- Don't write comments that describe WHAT code does — only WHY it does something non-obvious
- Don't create intermediate wrapper divs when a host directive solves the problem
- Don't use `scrollIntoView()` for scroll-snap viewports (see above)
- Don't trigger Angular CD in pointer/animation loops
