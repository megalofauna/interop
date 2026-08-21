# InteropResizable — Mental Model Card

## Files

```
projects/interop/src/lib/components/interop-resizable/
  interop-resizable.ts          directive implementation
  interop-resizable.types.ts    ResizableAxis, ResizableBounds, ResizableDimensions,
                                ResizableContainerType, ResizableAspectRatio, ResizableRatio
  interop-resizable.spec.ts     18 specs — bounds, measurement, ratio, snap
  public-api.ts                 barrel
projects/interop/src/lib/styles/components/resizable.css
projects/interop/src/lib/styles/themes/protocol/components/resizable.css
projects/demo/src/app/pages/resizable/   demo page
.agent/explorations/resize-aspect-ratio/ cross-engine measurements this design rests on
```

## Selector and usage

```html
<!-- Tier 0 (pure CSS — zero inputs needed) -->
<div interop-resizable [initialSize]="{ width: 400, height: 300 }">...</div>

<!-- Ratio-first — still Tier 0, still zero JS in the resize loop -->
<div interop-resizable [aspectRatio]="'16/9'" [max]="{ height: 400 }">...</div>

<!-- Tier 1 (implicitly activated by any enhancement input) -->
<div interop-resizable [keyboard]="true" [breakpoints]="[320, 480, 768]" ...>...</div>

<!-- Reset via template ref -->
<div #frame="interopResizable" interop-resizable>...</div>
<button (click)="frame.reset()">Reset</button>
```

## Implicit tier system

The tier is a `computed()`; the consumer never configures it.

```typescript
protected readonly tier = computed<'native' | 'enhanced'>(() => {
  const bp = this.breakpoints();
  if ((bp && bp.length > 0) || this.showDimensions()
    || (this.aspectLocked() && !this.ratio())   // inert under a ratio — see below
    || this.liveResize() || this.keyboard()) return 'enhanced';
  return 'native';
});
```

**`[aspectRatio]` deliberately does not activate Tier 1.** Native single-axis
`resize` holds the ratio on its own, so the common case stays zero-JS.
`aspectLocked` is excluded when a ratio is set, so an input that has been made
inert can't mount a drag handle nobody asked for.

### Tier 0 — native CSS resize

- CSS `resize: horizontal | vertical | both`, driven by the `data-axis` attribute
- Zero JS in the resize loop — the browser owns it entirely
- `ResizeObserver` fires `(resize)` on every size change
- No `(resizeStart)` / `(resizeEnd)` (no discrete drag events)
- Host is `container-type: inline-size` by default

### Tier 1 — JS-enhanced

- Native `resize` set to `none`; the directive manages sizing itself
- A `div.interop-resizable__handle` appended to the host (BR corner),
  `role="separator"`, `aria-valuenow/min/max`, `tabindex="0"` when `keyboard=true`
- Pointer Events with `setPointerCapture` — robust across touch, stylus, mouse
- Drag loop writes `host.style.*` directly, bypassing Angular change detection
- rAF batching: many `pointermove` events coalesce to one paint via `flushPendingSize`

## Aspect ratio — two modes, one capability

They do not stack. A declared ratio is authoritative and the capture path goes
inert, Shift included.

| | `[aspectRatio]="'16/9'"` | `[aspectLocked]="true"` |
|---|---|---|
| Ratio comes from | the declaration | whatever the frame measures at drag start |
| Size | emerges from the ratio | you set it |
| Shift | no aspect meaning | toggles the lock mid-drag |
| Tier | stays Tier 0 | forces Tier 1 |
| Use when | a *specific* ratio is the point | the user's *current* proportions are |

### What a ratio changes

- **`axis="both"` coerces to `horizontal`.** Forced by the platform: `resize:
  both` writes *both* inline dimensions, and a box with two definite sizes
  ignores its aspect ratio outright. An explicit `axis="vertical"` is honoured
  and drives the block axis. `data-axis` reflects the *resolved* axis.
- **Only the driving axis is ever written** — by `initialSize`, by the drag
  loop, by the keyboard. The cross axis must stay `auto` for CSS to derive it.
- **A stale cross-axis inline size is cleared** when a ratio becomes active
  (an effect in `ngOnInit`). Without this, a ratio set *after* mount leaves the
  height `initialSize` wrote, two sizes are definite, and the feature silently
  does nothing.
- **`initialSize` cross-axis value is dropped** with a dev warning — a genuine
  contradiction, not a constraint to reconcile.
- **Degenerate values are treated as unset** (dev warning), matching CSS:
  zero, negative, non-finite, unparseable, and `auto`.

### Bound projection

Cross-axis bounds are **projected** onto the driving axis, never emitted to CSS.
Min/max in the ratio-dependent axis are applied *without regard to
aspect-ratio*, so any that reach CSS clamp the derived size and break the ratio.

```
[aspectRatio]="'16/9'"  [max]="{ height: 300 }"   →

--itx-resizable-max-width   calc(300px * 16 / 9)
--itx-resizable-min-height  0
--itx-resizable-max-height  none
```

Two rules worth remembering:

- **Emit `calc()`, never a computed number.** Engines quantise layout
  differently (Gecko 1/60px, Blink 1/64px), so a value computed in JS is a
  fraction wrong somewhere. JS compares full-precision floats to pick the
  tighter bound; CSS does the arithmetic.
- **Explicit beats derived.** Merging follows css-sizing-4's transfer rules — a
  transferred minimum is capped by an explicit maximum, a transferred maximum
  floored by an explicit minimum. A bound the consumer wrote is never silently
  violated by one the component inferred; the loser is named in a dev warning.

## Bounds resolution

`resolvedBounds()` is the single source of truth, returning both a numeric form
(for the Tier-1 clamp, Home/End, ARIA) and a CSS form (for the tokens Tier 0
lays out from) per axis. Deriving both from one computation is what keeps the
tiers agreeing — reading the raw inputs at each use site is what let Tier 1
write a size Tier 0's CSS then overrode.

**A `min > max` conflict resolves in favour of min**, because that is what CSS
does (CSS 2.2 §10.4 applies max first, min last) and what all three engines
render. `clamp()` is order-independent since `resolvedBounds` guarantees
`hi >= lo`.

## Drag loop (Tier 1)

Drag state is plain fields, not signals:

```typescript
private dragActive = false;
private dragStartPointerX / Y = 0;
private dragStartWidth / Height = 0;
private dragStartAspect = 1;
private dragRatio: ResizableRatio | null = null;   // latched at pointerdown
private dragDrivingIsWidth = true;                 // latched at pointerdown
private rafHandle: number | null = null;
private pendingWidth / pendingHeight: number | null = null;
```

The precise rule is **mutable per-drag state is never a signal**, not "don't
touch Angular" — the handlers read config signals (`ratio()`, `resolvedAxis()`,
`effectiveBounds()`) freely, and those reads are untracked because a DOM event
callback is not a reactive context.

The app is zoneless, so a manually-registered listener never notifies the
scheduler: the drag loop is invisible to change detection by design. Making a
drag field a signal that anything consumes would (a) schedule CD at *write*
time, routing around the rAF batching, and (b) — the catastrophic one — re-run
the tier effect every frame, which unmounts and remounts the handle currently
holding pointer capture. `liveResize` is the deliberate, opt-in breach: it
emits `(resize)` per frame, which is why it defaults to false.

`onPointerDown` → snapshot + latch ratio/axis + `setPointerCapture`
`onPointerMove` → compute next size, snap, queue, schedule rAF
`flushPendingSize` → write inline styles (driving axis only under a ratio),
emit `(resize)` if `liveResize`, update ARIA
`onPointerUp` → flush, drop drag class, emit `(resizeEnd)`

## Enhancement features

### Magnetic snap (breakpoints)

Snaps on the **driving axis** (was width-only, which made `axis="vertical"` +
breakpoints a dead input that still forced Tier 1). `SNAP_WINDOW = 12px`, and
the snapped value is **re-clamped** — otherwise a target outside the bounds
punches through them and the inline style disagrees with the rendered box.

### Aspect lock (capture-based)

`dragStartAspect = rect.width / rect.height`, captured at drag start. Active
when `aspectLocked()` or Shift is held. Larger delta wins. Entirely skipped
when a ratio is set.

### Keyboard (APG separator contract)

Arrow keys step by `keyboardStep` (16px), Shift+arrow by `keyboardLargeStep`
(64px) — Shift keeps this meaning under a ratio. `Home` = min, `End` = max,
both from `effectiveBounds`. Acts on the driving axis.

### Dimension readout

`div.interop-resizable__readout`, `aria-hidden`, updated by `ResizeObserver`
during drag via `textContent`. Rendered as `W × H` with `Math.round`.

## Public API

```typescript
reset(): void
```

Clears inline width/height, then re-applies `initialSize`. Also fired by
double-clicking the Tier 1 handle.

**Under a ratio**, "natural size" would mean fill-available on the driving
axis, so a plain reset would blow the frame up to a full-width slab. It falls
back to the driving-axis size measured at mount (`naturalDrivingSize`,
captured in `ngOnInit` *before* `initialSize` is applied) when no driving-axis
seed exists.

## Outputs

| Output | When |
|---|---|
| `resizeStart` | Tier 1 drag begins |
| `resize` | ResizeObserver (both tiers); mid-drag only if `liveResize=true` |
| `resizeEnd` | Tier 1 drag ends (pointerup, keyboard settle, double-click reset) |

**All three report the border box.** `(resize)` previously emitted
`entry.contentRect` while `(resizeEnd)` emitted `getBoundingClientRect()`, so
the two disagreed by the border for identical state — `ResizableDimensions`
already documented itself as the rect, so this restored the contract.

## Host attributes

| Attribute | Value |
|---|---|
| `class` | `interop-resizable` (always) |
| `data-axis` | the **resolved** axis — reflects ratio-mode coercion |
| `data-tier` | `'native' \| 'enhanced'` |
| `data-aspect-ratio` | `''` when a valid ratio is set, absent otherwise |
| `data-aspect-locked` | `''` when locked; never set when a ratio is present |
| `style.aspect-ratio` | the normalised ratio, written by the directive |
| `style.container-type` | bound to `containerType()` |
| `style.--itx-resizable-{min,max}-{width,height}` | from `resolvedBounds()` |

The ratio is an input, not a token — deliberately. A *value* can live in the
cascade; a *mode* cannot, because the cascade has no way to notify the
component, and this one drives axis coercion and cross-axis neutralisation.
Consumers who need the ratio to vary by breakpoint bind the input to a signal.

## CSS — strategy conformance & token surface

Runs the two-file split per [css-strategy](../css-strategy.md). Structural
(`styles/components/resizable.css`) owns layout, state *selectors*, and motion;
theme (`styles/themes/protocol/components/resizable.css`) owns values only.
Every selector is `:where()`-wrapped → specificity `(0,0,0)`.

- **No structural fallbacks.** Base declarations are bare `var(--token)`; the
  theme guarantees a value. Only per-state tokens fall back — and always to
  their *base* token, never a literal.
- **`box-sizing: border-box` on the host.** The drag loop measures with
  `getBoundingClientRect()` and writes those measurements back into
  `width`/`height`; content-box made every drag inflate the frame by its own
  border, compounding across drags.
- **`overflow: hidden` is load-bearing beyond enabling `resize`.** It makes the
  host a scroll container, which is exempt from the automatic content-based
  minimum. Without it, content taller than the derived height floors the box
  and destroys the ratio. A consumer overriding it to `visible` — to unclip a
  shadow or focus ring — silently re-enables that floor.
- **Handle is one nested block.** Base → `&:where(:hover)` → `&:where(:focus-visible)`.
  The active colour is ancestor-driven (host `.interop-resizable--dragging`),
  so it sits beside the base rule rather than self-nesting.

| Group | Tokens | Notes |
|---|---|---|
| Bounds | `--itx-resizable-{min,max}-{width,height}` | Two ways to set — see below. |
| Frame | `--itx-resizable-border-{color,width,style,radius}` | **`-border-color` is `transparent` by default.** Width stays `1px` so revealing it costs no reflow. |
| Handle | `--itx-resizable-handle-{size,color,color-hover,color-active,corner-radius}` + `-focus-outline-{color,width,offset}` | `-handle-color` is the primary lever. |
| Readout | `--itx-resizable-readout-{background-color,foreground,padding,border-radius,font-family,font-size,offset}` | `[showDimensions]` badge only. |

Not themeable by design: axis cursors, `touch-action`, z-index, transition
timings, the drag/rAF behaviour.

### Bounds: two paths, one token

Each bound resolves to a single custom property, settable two ways — as a CSS
token on an ancestor (a scoped default for many instances), or via the
`[min]`/`[max]` inputs (a per-instance override that wins through the normal
cascade). Both tiers read the result identically: the inputs don't *enforce*
bounds in JS, they *feed the CSS*.

**This contract is void on the cross axis under a ratio.** The cross-axis
tokens are actively neutralised to `0` / `none`, which means a consumer's
ancestor-set `--itx-resizable-max-height` is discarded there. That is not
incidental: because `resizable.css` declares `min/max-block-size` from those
tokens unconditionally, suppressing only the directive's host bindings would
leave a stylesheet-set bound free to break the ratio.

This is the first [[project_disambiguation_notes]] case; the reader-facing
explainer is an `interop-expansion-panel` disclosure (summary = "Why can I set
bounds in two places?") on the demo page. The ratio-vs-lock choice is a second
case and wants the same treatment — not yet written.

## Container queries

The host is a CQ container by default (`container-type: inline-size`).
Descendants can write `@container` rules against its width. Override with
`[containerType]` for `size` or `normal`.

## Testing

18 specs in `interop-resizable.spec.ts`, covering bounds resolution,
measurement consistency, ratio behaviour and snap. Two caveats:

- **Karma does not load the library stylesheet**, so Tier 0 is invisible to the
  specs. The integration probe in `.agent/explorations/resize-aspect-ratio/`
  covers that half against the *built* CSS in all three engines.
- **The test harness is zone-based while the app is zoneless**, so the specs do
  not prove the change-detection discipline described above.
