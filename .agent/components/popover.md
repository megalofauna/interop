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

The structural CSS suppresses the built-in triangle automatically when `[interop-popover-arrow]` is present (the directive sets `[data-custom-arrow]` on the panel; the built-in rules are `:not([data-custom-arrow])`). Consumers don't have to set `[showArrow]="false"`.

For custom arrows, the structural CSS rotates the marker by 0/90/180/270deg based on `[data-placement]`, so a single icon (e.g. `caret-up`) reorients correctly for all four sides.

**The built-in arrow is two stacked triangles, not one.** `::before` paints the caret in the panel's *border* colour flush with the panel edge; `::after` paints it in the panel's *background* colour, shifted inward by exactly one `--itx-popover-border-width`. That one-border-width offset is what makes the frame read as a continuous hairline around the caret instead of stopping dead at the panel edge, and it lets the fill triangle's base overlap — and therefore hide — the panel's own border across the caret's width. Lifted from Carbon, which builds its caret the same way.

Each triangle is the border trick (zero-size box, three transparent borders, one coloured), so **`--itx-popover-arrow-size` is both the half-width and the depth**: `6px` renders a 12 × 6 caret, which is Carbon's exact caret box.

The custom arrow is pulled out of the panel by a percentage `translate`, which resolves against the element's own border box. A consumer's icon of any size lands flush against the panel edge with no token to keep in step. `--itx-popover-arrow-offset` nudges along the axis; positive moves *inward*.

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
Typography        font-size, line-height
Appearance        background, foreground, border-{radius,width,style,color}, shadow
Animation         enter/exit duration + easing, enter/exit translate vector
Arrow             arrow-size, arrow-color, arrow-border-color, arrow-offset
Backdrop (global) --itx-backdrop-color, --itx-backdrop-blur
```

| Token | Value |
|---|---|
| `--itx-popover-min-width` | `0` |
| `--itx-popover-max-width` | `min(90vw, 23rem)` — Carbon's 368px cap |
| `--itx-popover-max-height` | `70vh` (ours; Carbon has no ceiling) |
| `--itx-popover-padding` | `var(--itx-spacing-4)` — 16px, one value |
| `--itx-popover-font-size` | `0.875rem` |
| `--itx-popover-line-height` | `1.4286` — 20/14 |
| `--itx-popover-background` | `var(--itx-surface-above)` |
| `--itx-popover-foreground` | `var(--itx-role-text)` |
| `--itx-popover-border-radius` | `var(--itx-radius-none)` |
| `--itx-popover-border-width` | `1px` |
| `--itx-popover-border-style` | `solid` |
| `--itx-popover-border-color` | `var(--itx-role-edge)` |
| `--itx-popover-shadow` | `0 2px 2px oklch(0 0 0 / 0.2)` |
| `--itx-popover-enter/exit-duration` | `var(--itx-duration-fast)` |
| `--itx-popover-enter-easing` | `var(--itx-easing-decelerate)` |
| `--itx-popover-exit-easing` | `var(--itx-easing-accelerate)` |
| `--itx-popover-enter/exit-translate` | `0 -0.25rem` |
| `--itx-popover-arrow-size` | `6px` → a 12 × 6 caret |
| `--itx-popover-arrow-color` | **unset** — derives from `-background` at the panel |
| `--itx-popover-arrow-border-color` | **unset** — derives from `-border-color` at the panel |
| `--itx-popover-arrow-offset` | `0px` |

23 component-scoped tokens (21 declared, 2 derived) + 2 global backdrop tokens.

### The two arrow colours are deliberately undeclared

They are the **only** `var()` fallbacks the foundation carries, and they are the point of the exercise. `--itx-popover-arrow-color: var(--itx-popover-background)` written in the theme resolves `--itx-popover-background` *at `[interop-root]`* and then inherits the frozen result — so re-pointing the background on one panel left that panel's caret painted in the root's colour. Reading them at the point of use instead (`var(--itx-popover-arrow-color, var(--itx-popover-background))`) resolves at the panel, so a per-instance override is picked up. Both remain public tokens; an ancestor that sets either one still wins.

This is the `var()` gotcha from `.agent/workflows/carbon-borrow.md`, and it had been live here.

### Foundation carries no other fallbacks

Everything else in `styles/components/popover.css` reads a bare `var(--itx-popover-*)`. Before the Carbon round every token had a hardcoded fallback in the foundation, three of which had already drifted from the theme (an 8px arrow written as `12px`, a `--itx-duration-fast` exit written as `96ms`, a one-value padding written as a pair). See `.agent/css-strategy.md`.

## Typography — why popover does NOT isolate

A globally-declared `interop-typography-root` makes `prose.css`'s bare element selectors act as global element styles, and a popover full of projected content is exposed to them. The general fix is the static host attribute `interop-typography-isolate`.

**The popover deliberately does not set it.** Unlike a tree row or a table cell, a popover's content genuinely may be running text — a hover-card, a definition panel, a help bubble — and isolating would make prose inside a popover unable to read as prose.

Instead the panel declares its own baseline (`--itx-popover-font-size` / `-line-height`, Carbon's `$body-01` at 14/20). Projected `<p>` and `<li>` still win, because prose targets them directly and an inherited value cannot beat a direct declaration. The baseline covers everything prose does not claim: labels, buttons, bare spans, listbox rows.

Consequence worth knowing: a bare `<p>` inside a popover inside a typography root renders at the *fluid* `--itx-font-size-body`, not 14px. If a specific panel must be pinned, put `interop-typography-isolate` on that panel in the consumer's template — it is a plain attribute, not an input.

## Borrowed visual language — IBM Carbon Popover

Round 10 of `.agent/workflows/carbon-borrow.md`.

| Taken | Carbon | Resolves to |
|---|---|---|
| Padding | `$spacing-05` both axes | `var(--itx-spacing-4)` (was 12/16) |
| Max width | `to-rem(368px)` | `min(90vw, 23rem)` |
| Type | `$body-01` 14/20/400 | `0.875rem` / `1.4286` (was undeclared) |
| Caret box | 12 wide × 6 deep | `--itx-popover-arrow-size: 6px` (was 8 → 16 × 8) |
| Caret border | `::before` in `$popover-border-color`, `::after` inset 1px | same construction |
| Fill | `theme.$layer` | `var(--itx-surface-above)` |
| Text | `theme.$text-primary` | `var(--itx-role-text)` |
| Frame | `1px solid $border-subtle` | `1px solid var(--itx-role-edge)` |
| Shadow | `drop-shadow(0 2px 2px rgba(0,0,0,.2))` | `0 2px 2px oklch(0 0 0 / 0.2)` |

**Declined:**

- **Carbon's 2px `$popover-border-radius`.** Nine rounds have converged on square corners and our tooltip — the sibling surface Carbon builds on this same container — is already at `--itx-radius-none`. Walk back with `--itx-radius-nominal`.
- **`filter: drop-shadow()`.** Carbon hangs it off an intermediate wrapper so the shadow wraps the caret silhouette. We have no wrapper, and putting `filter` on the panel would make it a containing block for every positioned descendant. Cost: the caret casts no shadow.
- **Carbon's literal `$border-subtle` (our `--itx-role-divider`).** Too light against `--itx-surface-above` to read as a frame; `--itx-role-edge` is the house hairline, and it is the one that clears 3:1. Also avoids reading `--itx-border`, which this round found was being stomped app-wide by the dialog theme (fixed in the same commit — `dialog.css` was declaring the global `--itx-border` on `[interop-root]` to lighten its own edge, and won on import order).
- **`will-change: transform` on the caret.** Carbon adds it against a subpixel seam between a *sibling* caret and the content. Ours is a pseudo-element of the panel itself, so the seam case differs; not paying for a compositor layer speculatively.
- **High-contrast (inverse fill/text) and tab-tip variants.** No variant axis on the component, and the inverse pill is already the tooltip's job.

**Popover and tooltip in one voice:** squared corners, one hairline language, the same `--itx-duration-fast` / decelerate-in / accelerate-out motion pair. They differ where Carbon's own family differs — the tooltip is the inverse pill (`--itx-shadow-sm` is enough behind it), the popover is the light `$layer` surface and takes Carbon's tighter, darker `0 2px 2px` shadow. When tooltip's own borrow round runs, that shadow is the value to reconcile.

## DevMode warnings

1. **No trigger registered after init** — the popover's `registerTrigger` was never called by an `[interop-popover-trigger]`. ARIA wiring missing. Logged from `ngAfterViewInit` via microtask.

2. **No target on trigger** — `[interop-popover-trigger]` was applied without binding to an `InteropPopover` instance. Logged from the trigger's `ngAfterViewInit`.

## Known gaps

- **Close-reason precision** — `'trigger'` vs `'light-dismiss'` distinction is currently always reported as `'light-dismiss'` for non-programmatic closes. Differentiating reliably requires extra event tracking on the trigger; deferred until a use case demands it.

- **Keyboard contract for menu content** — when the popover wraps `role="menu"` content, the APG mandates arrow-key navigation, Home/End, character search. That's the **content's** responsibility (`InteropListbox` already handles its part). The popover stays out of internal keyboard navigation.

- **CSS anchor positioning support** — currently no automatic detection. Consumers stay on FloatingUI until they explicitly swap the strategy provider. Once browser support is universal, the default flips.

## Multiple triggers, one popover

`registerTrigger()` keeps a **Set**, and returns a function that unregisters
just that trigger. It used to be a single slot assigned on init and cleared to
`null` on destroy, which broke in two ways once a component bound two triggers
to one popover — the pattern the stepper uses, with a nav-trigger at the top
and an action-bar trigger at the bottom, CSS showing exactly one per viewport:

- the second to register silently replaced the first, and
- either one being destroyed cleared the slot for both.

**`resolveTriggerForOpen()` must not depend on focus.** It still prefers
`document.activeElement` when that element targets this popover — the fast,
exact answer — but that only works in Chrome. Safari and iOS deliberately do
not focus a `<button>` on click, per the platform convention, so
`activeElement` stays on `<body>` there and the branch never fires. This is why
the bug was invisible in Chrome and obvious on an iPhone.

The fallback is therefore geometric: prefer a registered trigger that actually
measures. A `display: none` trigger is 0×0 at (0, 0), and anchoring to it is
what parked the panel in the viewport's top-left corner — the reported symptom,
exactly.

When adding a trigger, nothing is required beyond binding it; when debugging a
mis-anchored popover, check how many triggers are registered and which of them
is visible before looking at the position strategy.
