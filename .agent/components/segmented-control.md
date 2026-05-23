# InteropSegmentedControl — Mental Model Card

## Files

```
src/lib/components/interop-segmented-control/
  interop-segmented-control.ts          container component, SegmentedControlRef impl
  interop-segmented-control.css         component styles (host fieldset / legend)
  interop-segmented-control.token.ts    SegmentedControlRef, SegmentRef interfaces + DI token
  interop-segment/
    interop-segment.ts                  button[interop-segment] — option button
  public-api.ts                         barrel
src/lib/styles/components/segment.css                       structural rules (segment)
src/lib/styles/themes/protocol/components/segmented-control.css   token values (both)
projects/demo/src/app/pages/segmented-control/              demo page
```

## DOM structure

```html
<fieldset interop-segmented-control label="View" [value]="view()" (valueChange)="view.set($event)">
  <legend [class.interop-sr-only]="labelHidden()">View</legend>
  <div class="interop-segmented-control__track">
    <interop-indicator />            <!-- only when hasResolvedSelection() -->
    <button interop-segment value="list">List</button>
    <button interop-segment value="grid">Grid</button>
    <button interop-segment value="detail">Detail</button>
  </div>
</fieldset>
```

The container is the consumer-provided `<fieldset>` (attribute selector). The `<legend>` provides the group's accessible name via native semantics — no `role="group"` needed. **A component-rendered `<div class="…__track">` wraps the indicator and content-projected segments**; it owns all of the track's visual styling and the anchor-positioning context for the indicator. The fieldset itself is a pure layout shell that stacks the legend above the track in normal document flow.

Each option is a `<button>` with `aria-pressed` reflecting selection state. Inter-segment dividers are CSS-only: a `::before` pseudo-element on every non-first segment, painted only when the rule width is non-zero.

### Why the track wrapper

Painting the track on the fieldset itself either bleeds the background under the `<legend>` or forces an absolutely-positioned legend overlaying the track. Neither works once the legend's visible height varies (font scaling, multi-line labels). The wrapper makes legend → track a true sibling stack; the legend can claim its own block flow, and the track owns background / border / radius / padding cleanly without coordinating with legend metrics.

## Why fieldset + button, not radio

A segmented control is a **stateful command group**, not a form input that produces a value on submit. `aria-pressed` on buttons matches the OS-native segmented control's interaction model (macOS NSSegmentedControl, iOS UISegmentedControl). Radios would announce as a separate value control, semantically wrong for view-mode style toggles. The container's `valueChange` output is for two-way binding in app code; the fieldset is not a form participant.

## Roving tabindex (single Tab stop)

The fundamental keyboard contract: **the whole control is one Tab stop**. Inside it, arrow keys move focus AND change selection. This matches OS-native behaviour and avoids the Angular Material regression where each segment was independently tabbable.

State:

```typescript
private _roverIndex = signal(0);                              // who owns tabindex=0
readonly segments = contentChildren(InteropSegment);          // DI-based, descendants:true
```

Each `InteropSegment.tabIndex` is a computed that returns `0` iff its own index in `parent.segments()` matches `parent.roverIndex()`, else `-1`.

Keyboard handler on the fieldset (`(keydown)`):

| Key | Action |
|---|---|
| ArrowRight, ArrowDown | move forward, skipping disabled, wrap |
| ArrowLeft, ArrowUp | move backward, skipping disabled, wrap |
| Home | first non-disabled |
| End | last non-disabled |

Movement calls `onSegmentSelect(value, index)` (which fires `valueChange`) AND `target.focus()`. There is no "focus-only" navigation mode — arrow keys both move focus and commit selection. Mouse click also calls `onSegmentSelect`.

An `effect` keeps `_roverIndex` in sync with the externally-controlled `value` input, so that on first Tab into the group the focus lands on the selected segment (not whichever was index 0).

## Selection state — controlled / uncontrolled hybrid

Same pattern as the radio group:

```typescript
value = input<string | null>(null);                   // controlled (external)
private _selectedValue = signal<string | null>(null); // uncontrolled (internal)
readonly effectiveValue = computed(() => this.value() ?? this._selectedValue());
```

`onSegmentSelect` always writes `_selectedValue` AND emits `valueChange`. If the consumer threads `value` back in, controlled wins; if not, internal state still works.

## Animated selection pill (CSS Anchor Positioning)

The pill is a separate `<interop-indicator>` child, rendered conditionally when `effectiveValue() !== null`. It is *not* a pseudo-element on the host.

Wiring:

1. The container CSS sets `--itx-indicator-anchor-name: --itx-segment-active` on the fieldset.
2. The segment CSS, inside `@supports (anchor-name: none)`, applies `anchor-name: --itx-segment-active` to `button[interop-segment][aria-pressed="true"]` — i.e. the active segment exposes that anchor.
3. The indicator's own styles consume `--itx-indicator-anchor-name` via `position-anchor`, then position absolutely against it.
4. The active segment clears its own background/border so the pill shows through.

This means the pill animation is **zero-JS** — the browser interpolates `top`/`left`/`width`/`height` between anchor changes when the consumer transitions them.

Fallback (no anchor support): the `<interop-indicator>` element is hidden, and `button[interop-segment][aria-pressed="true"]` paints its own background from the same `--itx-indicator-background-*` tokens — so the selected pill color tracks the configured indicator color without per-control plumbing. Both paths share the same token surface.

## Inter-segment dividers (CSS-only)

Dividers are rendered as a `::before` pseudo-element on every non-first segment, via the adjacent-sibling combinator:

```css
:where(
  button[interop-segment]:not([aria-pressed="true"])
  + button[interop-segment]:not([aria-pressed="true"])
)::before {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: var(--itx-rule-width, 0);
  background-color: var(--itx-rule-color, currentColor);
  pointer-events: none;
}
```

`:not([aria-pressed="true"])` on both sides suppresses the divider whenever an adjacent segment is selected, so the rule never overlays the indicator pill. Default `--itx-rule-width` in the Protocol theme is `0px` (invisible); consumers raise it to opt in.

This replaced an earlier imperative approach (`<hr itx-rule>` injection via `Renderer2.insertBefore` inside an `effect`), which had timing fragility against Angular's content-projection lifecycle — when `contentChildren` reported new segments before their DOM elements were placed as direct children of the fieldset, the injection could land separators at the wrong DOM positions. CSS sibling combinators don't have this hazard.

A consumer who places their own `<hr itx-rule>` between two segments breaks adjacency, suppressing the pseudo for that gap — explicit markup wins. The `<hr itx-rule>` utility itself (`styles/utilities/rule.css`) remains available for other contexts.

## DI token + interface contract

To avoid circular imports between container and segment:

- `interop-segmented-control.token.ts` declares `SegmentedControlRef`, `SegmentRef`, and the `INTEROP_SEGMENTED_CONTROL` injection token.
- Container provides itself via `{ provide: INTEROP_SEGMENTED_CONTROL, useExisting: InteropSegmentedControl }`.
- Each `InteropSegment` injects with `{ optional: true }` so it can dev-warn if used outside a container.

`SegmentedControlRef` exposes only the slice segments need to read: `effectiveValue`, `roverIndex`, `segments`, `disabled`, and `onSegmentSelect`.

## Inputs / Outputs

### `InteropSegmentedControl`

| Input | Type | Default | Notes |
|---|---|---|---|
| `label` | `string` | required | Rendered as `<legend>` text |
| `labelHidden` | `boolean` | `false` | Visually hides legend; remains AT-readable |
| `value` | `string \| null` | `null` | Controlled selection; pair with `(valueChange)` |
| `disabled` | `boolean` | `false` | Disables whole group |

| Output | Type | Notes |
|---|---|---|
| `valueChange` | `string` | Emitted on click + arrow-key activation |

### `InteropSegment`

| Input | Type | Default | Notes |
|---|---|---|---|
| `value` | `string` | required | Identity of this option |
| `disabled` | `boolean` | `false` | Skipped by arrow keys; pointer-events:none |

## DevMode warnings

- Container not on `<fieldset>` — wrong element
- Fewer than 2 segments — degenerate
- More than 5 segments — recommend `<select>` or radio group instead
- Segment not on `<button>` — wrong element
- Segment without parent container — missing DI scope

## CSS strategy

Two-file split per `css-strategy.md`. Container styles use `:host { ... }` (component-style scoping); segment styles use `:where(button[interop-segment])` global selectors so the bare attribute works without importing the Angular class.

Public token namespaces:

- `--itx-segmented-control-track-*` — fieldset track (background, border, radius, padding, flex layout knobs)
- `--itx-segment-*` — segment button (typography, padding, state variants for rest/hover/selected, focus ring, disabled)
- `--itx-indicator-*` — shared with the indicator pill; selected-segment fallback path reads these too

State activation lives in the structural file (`segment.css`) via selectors like `:where(button[interop-segment]:hover:not([aria-pressed="true"]):not(:disabled))`. Theme file declares values only.

## Known structural constraints

Segment buttons should remain **direct children of the fieldset**. Constraints:

1. **Layout** — the fieldset is `display: flex`. Wrapping a segment in an element with `display: contents` mostly works, but `<fieldset>` flex contexts have browser inconsistencies that surface intermittently.
2. **Single Tab stop** depends on roving tabindex being applied to the segment elements themselves. If a wrapper introduces its own tabbable element or changes focus targets, the contract breaks.
3. **Anchor positioning** — `anchor-name` is set on the active segment button. The indicator pill consumes `position-anchor: --itx-segment-active`. A wrapper between them is harmless for anchor lookup (names are scoped to the containing block) but only if the segment itself still receives the `[aria-pressed="true"]` style.

Tooltips for icon-only segments: use the `[interopTooltip]` directive form, which attaches to the segment button directly without wrapping. The `<interop-tooltip>` wrapper component is incompatible with this parent — see `tooltip.md` "Architecture / When to use which".

## Icon-only segments

Use `interop-segment="icon"` (the segment attribute accepts a space-separated token list; `~="icon"` selector adds `aspect-ratio: 1/1` so the segment is square) combined with the `[interopTooltip]` directive for an accessible label:

```html
<button
  interop-segment="icon"
  value="left"
  [interopTooltip]="'Align left'"
  [interopTooltipSemantic]="'label'">
  <interop-icon name="tabler-align-left" />
</button>
```

`semantic="label"` wires `aria-labelledby` so the tooltip text becomes the button's accessible name — no separate `aria-label` needed. The directive form is required here because `<interop-tooltip>` as a wrapper would interpose between the fieldset and its segment children.

## Open questions / future

- **Vertical orientation**: token plumbing (`--itx-segmented-control-track-flex-direction`) is in place but no demo yet. Arrow key mapping already treats Up/Down as equivalent to Left/Right; vertical works keyboard-wise without changes. The CSS divider uses `inset-inline-start`, which is correct for horizontal tracks; for vertical tracks the divider would need to be on the block-start edge — defer until vertical demo lands.
- **Form integration**: no `ControlValueAccessor` today. If we need form binding, add a separate `InteropSegmentedControlAccessor` directive rather than coupling the base component to forms.
