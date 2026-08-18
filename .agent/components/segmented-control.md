# InteropSegmentedControl — Mental Model Card

## Files

```
src/lib/components/interop-segmented-control/
  interop-segmented-control.ts          container component, SegmentedControlRef impl
  interop-segmented-control.token.ts    SegmentedControlRef, SegmentRef interfaces + DI token
  interop-segment/
    interop-segment.ts                  button[interop-segment] — option button
  public-api.ts                         barrel
src/lib/styles/components/segment.css                       structural rules (container AND segment)
src/lib/styles/themes/protocol/components/segmented-control.css   token values (both)
projects/demo/src/app/pages/segmented-control/              demo page
```

> **Filename trap — the two style files are not named the same thing.** The
> structural file is `styles/components/segment.css` — singular, and no
> `segmented-control.css` exists under `components/` at all; the theme file is
> `styles/themes/protocol/components/segmented-control.css`. Searching for
> `segmented-control.css` finds only the theme and makes the structural half
> look missing; searching for `segment.css` finds only the structure.
>
> There used to be a third file, `interop-segmented-control.css`, colocated
> with the TypeScript and holding the fieldset / legend / track rules. It was
> folded into `styles/components/segment.css` on 2026-08-17 — Angular injected
> it unlayered, so it outranked the whole `interop` layer, and a CSS-only
> consumer got a styled row of segments inside an unstyled fieldset.

## DOM structure

```html
<fieldset
	interop-segmented-control
	label="View"
	[value]="view()"
	(valueChange)="view.set($event)"
>
	<legend [class.interop-sr-only]="labelHidden()">View</legend>
	<div class="interop-segmented-control__track">
		<interop-indicator />
		<!-- only when hasResolvedSelection() -->
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

| Key                   | Action                                 |
| --------------------- | -------------------------------------- |
| ArrowRight, ArrowDown | move forward, skipping disabled, wrap  |
| ArrowLeft, ArrowUp    | move backward, skipping disabled, wrap |
| Home                  | first non-disabled                     |
| End                   | last non-disabled                      |

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

The pill is a separate `<interop-indicator>` child of the track, rendered conditionally on `hasResolvedSelection()` — which is stricter than `effectiveValue() !== null`: it also requires that a _mounted_ segment actually carries that value. A value with no matching segment would anchor the indicator to nothing and collapse it to a small artefact in the corner, so the existence check is the parent's half of the anchor contract (see `indicator.md`). It is _not_ a pseudo-element on the host.

Wiring:

1. The container CSS sets `--itx-indicator-anchor-name: --itx-segment-active` on the **track wrapper** (`.interop-segmented-control__track`), not on the fieldset — the track is the indicator's containing block (`position: relative`), so the binding and the positioning context are the same element.
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
	width: var(--itx-segmented-control-rule-width, var(--itx-rule-width, 0));
	background-color: var(
		--itx-segmented-control-rule-color,
		var(--itx-rule-color, currentColor)
	);
	pointer-events: none;
}
```

`:not([aria-pressed="true"])` on both sides suppresses the divider whenever an adjacent segment is selected, so the rule never overlays the indicator pill.

**The tokens are the control's own, and that is the fix, not a detail.** The theme used to declare `--itx-rule-width: 1px` / `--itx-rule-color` on `fieldset[interop-segmented-control]` — those are the PUBLIC pair of the global `[itx-rule]` utility, so every `<hr itx-rule>` a consumer placed anywhere inside a segmented control silently inherited the control's divider paint. Scoping to the fieldset limited the blast radius; it did not make it correct. A component must never write a shared vocabulary. The pair is now `--itx-segmented-control-rule-{color,width}`, read through the chain above so the utility's tokens still govern when the control says nothing, and the width is `var(--itx-border-width-hairline)` rather than a literal `1px` — a literal cannot follow the `prefers-contrast` bump.

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

| Input         | Type             | Default  | Notes                                           |
| ------------- | ---------------- | -------- | ----------------------------------------------- |
| `label`       | `string`         | required | Rendered as `<legend>` text                     |
| `labelHidden` | `boolean`        | `false`  | Visually hides legend; remains AT-readable      |
| `value`       | `string \| null` | `null`   | Controlled selection; pair with `(valueChange)` |
| `disabled`    | `boolean`        | `false`  | Disables whole group                            |

| Output        | Type     | Notes                                   |
| ------------- | -------- | --------------------------------------- |
| `valueChange` | `string` | Emitted on click + arrow-key activation |

### `InteropSegment`

| Input      | Type      | Default  | Notes                                      |
| ---------- | --------- | -------- | ------------------------------------------ |
| `value`    | `string`  | required | Identity of this option                    |
| `disabled` | `boolean` | `false`  | Skipped by arrow keys; pointer-events:none |

### Attributes (not inputs)

Neither of these has an `input()` declaration — they are plain attributes read only by CSS selectors, so they take a literal string and cannot be bound to a signal without `attr.` binding.

| Attribute         | On                  | Values                 | Notes                                                         |
| ----------------- | ------------------- | ---------------------- | ------------------------------------------------------------- |
| `itx-size`        | fieldset or segment | `sm` \| `md` \| `lg`   | 32 / 40 / 48px. Unset = md                                    |
| `interop-segment` | segment             | space-separated tokens | `interop-segment="icon"` squares the segment for a 16px glyph |

## DevMode warnings

- Container not on `<fieldset>` — wrong element
- Fewer than 2 segments — degenerate
- More than 5 segments — recommend `<select>` or radio group instead
- Segment not on `<button>` — wrong element
- Segment without parent container — missing DI scope

## CSS strategy

Two-file split per `css-strategy.md`, and now genuinely two files: container and segment both live in `styles/components/segment.css` with `:where()` global selectors, so the bare attributes work without importing the Angular classes. The container's `:host` rules became `:where(fieldset[interop-segmented-control])`, `… > legend` and `… .interop-segmented-control__track`.

Public token namespaces:

- `--itx-segmented-control-legend-*` — the group label. 4 tokens.
- `--itx-segmented-control-track-*` — the track `<div>` (background, border, radius, **box-shadow**, padding, max-width, flex layout knobs). 15 tokens.
- `--itx-segment-*` — segment button (layout, typography, state variants for rest/hover/selected, focus ring, transition, disabled). 25 tokens.
- `--itx-segmented-control-rule-*` — inter-segment divider, scoped to the fieldset. 2 tokens.
- `--itx-indicator-*` — shared with the indicator pill, scoped to the fieldset; the selected-segment fallback path reads these too. 3 tokens.

The Protocol theme declares **47 distinct tokens** in total (53 declarations — the three size steps re-declare `--itx-segment-padding-block`, and the icon-only rules re-declare `--itx-segment-padding-inline`). The remaining 2 of the 47 are the managed radii below.

State activation lives in the structural file (`segment.css`) via selectors like `:where(button[interop-segment]:hover:not([aria-pressed="true"]):not(:disabled))`. Theme file declares values only.

## Visual language — Carbon Content Switcher borrow

Proportions and paint follow IBM Carbon's Content Switcher, in its **default "high contrast" flavour** (see `.agent/workflows/carbon-borrow.md`). What Interop had before the borrow was effectively Carbon's _low contrast_ variant — filled track, light pill, weight shift on the selected label. The component has no variant axis, so only one flavour is expressed; the theme's inline comments name the single value that walks each decision back.

**Selection is a wash, not an inversion.** Carbon's `$layer-selected-inverse` was expressed as `--itx-indicator-background-color: var(--itx-surface-below)` — the ELEVATION axis, pointing the wrong way. Elevation climbs toward light in both schemes, so "below" is darker than the track in both: in dark, L 0.148 under a 0.193 track, i.e. the selected segment sank instead of standing out. It is now `var(--itx-contrast-1)`, whose definition is verbatim "wash — hover fills, stripes, selected tints". In light the two are indistinguishable (0.855 → 0.860); in dark it flips to 0.243. The label is `--itx-segment-foreground-selected: var(--itx-contrast-6)`. Both anchor-positioning paths read the same fill token, so the enhancement path (indicator pill) and the fallback path (segment paints its own background) can't disagree about the colour. (The `--itx-neutral-*` names this card used to quote were deleted in ITX-40.)

**The track is transparent, framed by an inset box-shadow.**

```css
--itx-segmented-control-track-background-color: transparent;
--itx-segmented-control-track-border-width: 0;
/* declared on the fieldset, not [interop-root] — see below */
--itx-segmented-control-track-box-shadow: inset 0 0 0
	var(--itx-border-width-hairline) var(--itx-contrast-6);
--itx-segmented-control-track-padding: 0;
```

Carbon draws this frame as an `outline` with `-1px` offset so the edge costs no layout. An inset `box-shadow` is the same trick — **zero layout cost, so the control measures exactly its size step** — with one difference that drives the hover decision below: box-shadow paints _under_ the children, where outline paints above them.

The radius is not declared at all: `--itx-segmented-control-track-border-radius` falls through to the global `--itx-radius` knob, which defaults to `none`. The spread reads `--itx-border-width-hairline` rather than a literal `1px`, and that is why the declaration sits on `fieldset[interop-segmented-control]` rather than on `[interop-root]` — an alias to a system token parked on the root substitutes there and freezes, so neither an `[itx-scale-scope]` rescale nor the `prefers-contrast` bump to 2px would reach it. `check-shape.mjs` fails the build on that shape.

Rank 6 for the frame is the one edge in this component above rank 3 ("border, emphasis edge"), and it is deliberate: a maximum-strength frame carrying an otherwise unpainted group is the whole identity of Carbon's high-contrast flavour.

**Size axis — sm 32 / md 40 / lg 48.** There is no height token. The control's height _is_ the line box plus block padding, so each step is expressed as `padding = (height − 18px) / 2`:

| `itx-size`     | `--itx-segment-padding-block` | height              |
| -------------- | ----------------------------- | ------------------- |
| `sm`           | `0.4375rem` (7px)             | 7 + 18 + 7 = 32px   |
| `md` (default) | `0.6875rem` (11px)            | 11 + 18 + 11 = 40px |
| `lg`           | `0.9375rem` (15px)            | 15 + 18 + 15 = 48px |

`itx-size` is a **plain attribute, not an Angular input** — no `input()` declares it. It is matched on `fieldset[interop-segmented-control][itx-size]` to size a whole control, or on `button[interop-segment][itx-size]` to size one segment. The md value is also the unqualified default, so md is declared twice by design.

**Segments are equal-width.** `--itx-segment-flex: 1 1 0` — Carbon: "each container that makes up the content switcher is equal in size". Because the fieldset is `flex: 0 1 fit-content` (shrink-to-fit), `1 1 0` sizes every segment to the widest label rather than stretching the control. `0 0 fit-content` reverts to content-width segments.

**Type is fixed, not fluid.** `$body-compact-01` — `--itx-segment-font-size: 0.875rem` / `--itx-segment-line-height: 1.2857` / `--itx-segment-font-weight: 500`, in `--itx-font-family-sans`. A fluid `clamp()` font-size is **forbidden in a fixed-height box**: the height arithmetic above only holds if the 18px line box is constant, and a clamp() label would drift the pinned heights with the viewport. Note that `--itx-segment-line-height` did not previously exist as a token at all — the segment inherited its line box from prose, which under a typography root is exactly such a clamp(). Its structural fallback is `inherit`, so leaving it unset restores the old drifting behaviour.

**Selected weight stays put.** `--itx-segment-font-weight-selected: 500`, the same as rest. Carbon holds the weight constant in this flavour so selection can never reflow segment widths; `600` is the low-contrast look.

**Hover moves the label only — no background wash.**

```css
--itx-segment-background-hover: transparent;
--itx-segment-foreground-hover: var(--itx-contrast-6); /* rank 5 at rest */
```

Carbon washes the segment with `$layer-hover` here and we deliberately don't, for the box-shadow reason above: the frame is drawn _inside_ the same box the segments occupy, so an opaque segment fill paints over it — and the first and last segments clip the frame at exactly the corners where it reads most. Carbon gets away with the wash because its frame is an `outline`, which paints above the children. Luminance alone carries the affordance anyway: unlike a bare button, a segment has the track and its neighbours as constant reference, so grey → full strength is unambiguous.

**Focus** is the system ring, inset. The theme declares exactly one focus token, `--itx-segment-focus-offset: -2px`; width, style and colour come from `tokens/focus.css` through the three-tier chain in the structural file. The negative offset keeps the ring inside the frame instead of spilling onto the neighbouring segment.

### Trap — `--itx-outer-radius` / `--itx-inner-radius` are homed in the wrong file

```css
/* themes/protocol/components/segmented-control.css */
--itx-outer-radius: var(--itx-radius-2);
--itx-inner-radius: calc(
	var(--itx-outer-radius) - var(--itx-segmented-control-track-padding)
);
```

These are **declared here but read elsewhere**, on `[interop-root]`:

- `themes/protocol/components/indicator.css` → `--itx-indicator-border-radius: var(--itx-inner-radius)`
- `themes/protocol/components/visimorph/visimorph.css` → `--itx-control-radius: var(--itx-inner-radius, 4px)`, which is the shared radius for **checkbox, radio, and toggle**.

So retuning these two "for the segmented control" silently changes checkbox and radio corners across the app. Worse, it doesn't even change _this_ component: the borrow sets `--itx-indicator-border-radius: var(--itx-radius-1)` scoped to `fieldset[interop-segmented-control]`, which wins over the root-level indicator value by inheritance proximity — so the segmented control ignores both tokens entirely. They are generic managed radii that happen to live in this file; they belong in the foundation or a shape theme file. Left in place by the borrow rather than moved, to keep that change out of a visual-only commit.

## Known structural constraints

Segment buttons should remain **direct children of the fieldset**. Constraints:

1. **Layout** — the fieldset is `display: flex`. Wrapping a segment in an element with `display: contents` mostly works, but `<fieldset>` flex contexts have browser inconsistencies that surface intermittently.
2. **Single Tab stop** depends on roving tabindex being applied to the segment elements themselves. If a wrapper introduces its own tabbable element or changes focus targets, the contract breaks.
3. **Anchor positioning** — `anchor-name` is set on the active segment button. The indicator pill consumes `position-anchor: --itx-segment-active`. A wrapper between them is harmless for anchor lookup (names are scoped to the containing block) but only if the segment itself still receives the `[aria-pressed="true"]` style.

Tooltips for icon-only segments: use the `[interopTooltip]` directive form, which attaches to the segment button directly without wrapping. The `<interop-tooltip>` wrapper component is incompatible with this parent — see `tooltip.md` "Architecture / When to use which".

## Icon-only segments

Use `interop-segment="icon"` — the segment attribute accepts a space-separated token list, matched with `[interop-segment~="icon"]`. Combine it with the `[interopTooltip]` directive for an accessible label:

```html
<button
	interop-segment="icon"
	value="left"
	[interopTooltip]="'Align left'"
	[interopTooltipSemantic]="'label'"
>
	<interop-icon name="tabler-align-left" />
</button>
```

`semantic="label"` wires `aria-labelledby` so the tooltip text becomes the button's accessible name — no separate `aria-label` needed. The directive form is required here because `<interop-tooltip>` as a wrapper would interpose between the fieldset and its segment children.

**There is no `aspect-ratio` rule.** An earlier version of this card claimed `~="icon"` sets `aspect-ratio: 1/1`; that block exists in `segment.css` but every declaration in it is commented out, so it does nothing. Squareness comes from the _theme_ instead, which matches the inline padding to the block padding around an assumed **16px** glyph:

| Size         | inline padding                | resulting box |
| ------------ | ----------------------------- | ------------- |
| `sm`         | `var(--itx-spacing-2)` — 8px  | 32 × 32       |
| md (default) | `var(--itx-spacing-3)` — 12px | 40 × 40       |
| `lg`         | `var(--itx-spacing-4)` — 16px | 48 × 48       |

The consequence: the square only holds if the glyph really is 16px. An `<interop-icon [size]="20">` inside an icon segment silently makes it 4px wider than tall. Carbon's own icon steps are 16 at sm/md and 20 at lg; icons here are left at their inherited size, so the padding above is what squares a 16px glyph at each height, not Carbon's literal 8 / 12 / 14.

## Open questions / future

- **Vertical orientation**: token plumbing (`--itx-segmented-control-track-flex-direction`) is in place but no demo yet. Arrow key mapping already treats Up/Down as equivalent to Left/Right; vertical works keyboard-wise without changes. The CSS divider uses `inset-inline-start`, which is correct for horizontal tracks; for vertical tracks the divider would need to be on the block-start edge — defer until vertical demo lands.
- **Form integration**: no `ControlValueAccessor` today. If we need form binding, add a separate `InteropSegmentedControlAccessor` directive rather than coupling the base component to forms.
