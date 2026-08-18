# InteropBadge — Mental Model Card

## Files

```
src/lib/components/interop-badge/
  interop-badge.ts      component — inline template, a11y wiring, announcement
  public-api.ts         barrel export

src/lib/styles/components/badge.css                  structure
src/lib/styles/themes/protocol/components/badge.css  values
```

Badge follows the two-file split as of 2026-08-17; it has no `styleUrl`.

## Shape

`<interop-badge>` wraps a decorated element — a button, link, avatar, icon — in
a positioning context it owns, then overlays an indicator on one of its
corners.

```html
<interop-badge [count]="unread()" [accessibleLabel]="unreadLabel">
  <button interop-button="primary">
    <interop-icon name="bell" />
  </button>
</interop-badge>
```

Because the component controls the container, `overflow: visible` is
guaranteed regardless of the surrounding layout — the structural clipping
problem that affects directive-based badge implementations cannot occur here.

**Inputs:** `count`, `max`, `dot`, `hidden`, `position`, `accessibleLabel`, `announce`
**Outputs:** none

## Positioning

The indicator is `position: fixed` plus CSS Anchor Positioning, so it escapes
every overflow and stacking context without a line of layout JavaScript. The
host publishes `anchor-name`, the indicator reads it as `position-anchor`, and
`position-area` drops it in the requested corner cell.

Requires Chrome 125+, Firefox 135+, Safari 18.2+. There is **no fallback path**
— in an older browser the indicator falls back to plain `position: fixed` at
the viewport origin. If that becomes a support target, that is the gap.

The translate maths centre the indicator **on** the corner: half in, half out.
`--itx-badge-offset` pushes it further out from there; a negative value tucks
it inside, toward Carbon's own placement.

> `--itx-badge-offset` must carry a unit. It is subtracted from a percentage
> inside `calc()`, so a bare `0` makes the whole `calc()` invalid and the
> translate is dropped, leaving the badge sitting outside the corner cell.

## Accessibility model

- The visible indicator span is `aria-hidden="true"` — a number in isolation is
  meaningless.
- A visually-hidden sibling (`.interop-sr-only`) carries the computed
  accessible text.
- `afterNextRender` finds the first interactive element inside the projected
  content and wires the sibling to it via `aria-describedby`; `ngOnDestroy`
  removes it again, but only if it is still the id we set.
- `[announce]="true"` queues count changes through `InteropAnnouncer`, which
  pre-seeds its `aria-live` regions at app init to dodge VoiceOver's
  create-then-populate timing bug. The first render never speaks.
- Dev mode warns when `[accessibleLabel]` is missing and the badge is visible.

`[accessibleLabel]` takes a **function** as well as a string. Prefer the
function whenever the count can exceed `[max]`: it receives the real count, not
the display string, so the spoken text can stay truthful where the visible
"99+" cannot. Angular templates have no arrow-function syntax, so pass a class
member.

The indicator is non-interactive, so WCAG 2.2 SC 2.5.8's 24×24 CSS px target
floor — the reason chip stops at 24px — does not apply to it. 16px is safe.

### Known gaps

- **No interactive-child fallback.** When the projected content contains
  nothing focusable (a bare avatar image), the accessible text is rendered but
  never referenced by anything. Deferred.
- **No `[href]` / linked variant.** Whether the badge host should be able to
  behave as an interactive element is an open API question. Deferred.

## CSS architecture

Two files, both imported globally and both layered — `styles/components/badge.css`
for structure, `styles/themes/protocol/components/badge.css` for values. Until
2026-08-17 all of it lived in `interop-badge.scss` behind the component's
`styleUrl`, which meant a CSS-only consumer got no badge styling at all and the
injected sheet was UNLAYERED, so it outranked the whole `interop` layer.

Two things about the migration worth remembering:

- `.interop-badge__indicator` stays an **unscoped** class selector rather than
  being nested under `interop-badge`. That is deliberate: hand-written or
  replicated markup should pick it up.
- The indicator's `.interop-sr-only` copy is gone. It folded into the global
  `styles/utilities/visually-hidden.css` rule, which is where that lives now.

The theme scopes its declarations to `:where([interop-root] interop-badge)`
rather than to `[interop-root]`, so `--itx-badge-radius: var(--itx-radius-full)`
substitutes on the component instead of baking at the root. The radius is one of
the few in the library that PINS rather than following `--itx-radius`: a badge
is a spot, and Carbon names the radius.

## Visual language

Borrowed from IBM Carbon's `badge-indicator` (round 10). Procedure and the
Carbon → Interop conversion tables: `.agent/workflows/carbon-borrow.md`.

Carbon's badge is the most minimal component in the system — a count bubble and
a dot, no size axis, no variants, no states — so the borrow is almost the whole
component:

| Carbon | Resolves to | Interop |
|---|---|---|
| `$helper-text-01` | 12 / 16 / 400 | `--itx-badge-font-size: 0.75rem`, `-line-height: 1.3333`, `-font-weight: 400` |
| `max-block-size: $spacing-05` | 16px | `--itx-badge-size: var(--itx-spacing-4)` |
| `min-block-size: $spacing-03` | 8px | `--itx-badge-dot-size: var(--itx-spacing-2)` |
| `padding: 0 $spacing-02 …` | inline 4px | `--itx-badge-padding-inline: var(--itx-spacing-1)` |
| `border-radius: 100px` | round | `--itx-badge-radius: var(--itx-radius-full)` |
| `background: $support-error` | red-60 | `--itx-badge-background: var(--itx-danger)` |
| `color: $text-on-color` | white | `--itx-badge-color: var(--itx-on-danger)` |

**Round is kept.** The house style squares components off unless Carbon names a
radius — Carbon names one here, and a badge is a spot; a spot with corners
reads as a chip that lost its label.

Paint routes through the **status palette**, not through a literal red, so
`itx-status-palette="eighties"` on any ancestor reskins the badge along with
callouts, toasts and alerts. Carbon's `$support-error` and our `--itx-danger`
are the same semantic slot.

### Declined from Carbon

- **The asymmetric `0 4px 2px` padding.** It is an optical nudge for a line box
  Carbon does not centre. We do centre it, over a line box that exactly equals
  the bubble height, so the nudge would push the digits off-centre.
- **Carbon's placement.** Carbon insets the badge fully *inside* the anchor
  (`inset: 0`, then 4–8px of margin pushing it further in), which works because
  its only anchor is a 48px UI-shell icon button. Interop's badge wraps
  arbitrary content, including short text buttons where an inside badge lands
  on the label. Corner-overlap stays; `--itx-badge-offset` is the seam.
- **The count/dot offset split** (4px vs 8px). Carbon needs two because it is
  measuring two box sizes inward from an edge. Corner-centring is
  size-independent, so one offset covers both shapes.
- **Position variants.** Carbon only draws top-inline-end. The other three
  corners keep Interop's own translate maths.

### Taken from Chip, not from Carbon

Chip is the same visual family and went through this in round 1, so where
Carbon is silent we follow chip:

- **A stated dot size, not a derived one.** The dot was
  `calc(var(--itx-badge-size) * 0.6)`. Chip's borrow deleted the equivalent
  `padding-step × sizing-multiplier` formula for the same reason: a derived
  dimension cannot be retuned independently, and it is the thing that goes
  wrong quietly. The dot now holds Carbon's 8px under its own name.
- **A `min-inline-size` floor equal to the block size**, so a one-digit count
  is a circle rather than a 15px-wide ellipse. Carbon's own floor is the
  *dot's* 8px, which does not achieve this; chip states
  `--itx-chip-min-width` for exactly the same reason.
- **No transition, no hover, no focus ring.** Nothing here is focusable, so the
  house `--itx-colorway` focus ring has nowhere to land, and there is no state
  to transition between.

The floor reads `--itx-badge-size` **directly** rather than via a derived
`--itx-badge-min-width`, because `--a: var(--b)` resolves `--b` at the element
where `--a` is declared — a derived token set on `[interop-root]` would freeze
at 16px and ignore every downstream override. Same rule chip's remove button
follows.

## Token reference

Set on any ancestor, e.g. `[interop-root]`. Every one is read with an inline
fallback (see *CSS architecture*), so an unset token is not a broken one.

| Token | Default | Description |
|---|---|---|
| `--itx-badge-size` | `var(--itx-spacing-4)` — 16px | Count bubble block size, and its inline floor |
| `--itx-badge-dot-size` | `var(--itx-spacing-2)` — 8px | Dot diameter — Carbon's `min-block-size` |
| `--itx-badge-padding-inline` | `var(--itx-spacing-1)` — 4px | Inline padding around the count |
| `--itx-badge-radius` | `var(--itx-radius-full)` | Corner radius — Carbon's `100px` |
| `--itx-badge-background` | `var(--itx-danger)` | Fill; follows `itx-status-palette` |
| `--itx-badge-color` | `var(--itx-on-danger)` | Label colour |
| `--itx-badge-font-size` | `0.75rem` | Carbon `$helper-text-01`; fixed rem, never `--itx-font-size-*` (those are fluid `clamp()` and would overflow a fixed-height box) |
| `--itx-badge-font-weight` | `400` | Carbon `$helper-text-01` |
| `--itx-badge-line-height` | `1.3333` | 16/12 — exactly the bubble height, so the digits centre with no nudge |
| `--itx-badge-offset` | `0px` | Outward bleed past the corner. **Must carry a unit.** |

## Known design decisions

- **Why `position: fixed` and not `absolute`.** Anchor positioning frees the
  indicator from every ancestor's overflow and stacking context. A badge that
  can be clipped by a scroll container is the failure mode this component
  exists to prevent.
- **Why the indicator is `aria-hidden` rather than labelled.** The number alone
  never carries its own meaning ("3" — three what?). The label belongs to the
  thing being decorated, so it is attached there by `aria-describedby`.
- **Why `.interop-sr-only` is duplicated locally.** The global rule lives in
  `styles/components/chip.css`, which a consumer importing only the Angular
  component never loads — and without it the accessible text renders visibly.
  `interop-segmented-control` carries the same duplicate for the same reason.
  Both fold back into the global rule the moment badge joins the two-file split.
