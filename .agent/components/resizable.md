# InteropResizable — Mental Model Card

## Files

```
src/lib/components/interop-resizable/
  interop-resizable.ts          directive implementation
  interop-resizable.types.ts    ResizableAxis, ResizableBounds, ResizableDimensions, ResizableContainerType
  public-api.ts                 barrel
src/lib/styles/components/resizable.css
src/lib/styles/themes/protocol/components/resizable.css
projects/demo/src/app/pages/resizable/   demo page
```

## Selector and usage

```html
<!-- Tier 0 (pure CSS — zero inputs needed) -->
<div interop-resizable [initialSize]="{ width: 400, height: 300 }">...</div>

<!-- Tier 1 (implicitly activated by any enhancement input) -->
<div interop-resizable [keyboard]="true" [breakpoints]="[320, 480, 768]" ...>...</div>

<!-- Reset via template ref -->
<div #frame="interopResizable" interop-resizable>...</div>
<button (click)="frame.reset()">Reset</button>
```

## Implicit tier system

The directive is always one of two tiers. The tier is a `computed()` signal:

```typescript
protected readonly tier = computed<'native' | 'enhanced'>(() => {
  const bp = this.breakpoints();
  if ((bp && bp.length > 0) || this.showDimensions() || this.aspectLocked()
    || this.liveResize() || this.keyboard()) return 'enhanced';
  return 'native';
});
```

No consumer configuration of tier — it's implicit. Changing any enhancement input during the component's lifetime causes the effect to mount/unmount the handle automatically.

### Tier 0 — native CSS resize

- CSS `resize: horizontal | vertical | both` (driven by `data-axis` attribute)
- Zero JS in the resize loop — the browser owns it entirely
- `ResizeObserver` fires `(resize)` output on every size change
- No `(resizeStart)` or `(resizeEnd)` outputs (no discrete drag events)
- The host is `container-type: inline-size` by default for CQ support

### Tier 1 — JS-enhanced

- Native `resize` CSS is set to `none`; the directive manages sizing itself
- A `div.interop-resizable__handle` is appended to the host (BR corner)
  - `role="separator"`, `aria-valuenow/min/max`, `tabindex="0"` when `keyboard=true`
- Pointer Events with `setPointerCapture` — robust across touch, stylus, mouse
- Drag loop writes `host.style.width/height` directly, bypassing Angular CD
- rAF batching: multiple `pointermove` events coalesce to one paint frame via `flushPendingSize`

## Drag loop (Tier 1)

All drag state is plain fields (not signals) — reads/writes during drag must not enter Angular:

```typescript
private dragActive = false;
private dragStartPointerX = 0;
private dragStartPointerY = 0;
private dragStartWidth = 0;
private dragStartHeight = 0;
private dragStartAspect = 1;
private rafHandle: number | null = null;
private pendingWidth: number | null = null;
private pendingHeight: number | null = null;
```

`onPointerDown` → captures state snapshot + `setPointerCapture`
`onPointerMove` → computes `nextWidth/nextHeight`, queues via `pendingWidth/pendingHeight`, schedules rAF
`flushPendingSize` → writes inline styles, emits `(resize)` if `liveResize=true`, updates aria
`onPointerUp` → flushes pending, removes drag class, emits `(resizeEnd)`

## Enhancement features

### Magnetic snap (breakpoints)

Width-axis only. When dragged within `SNAP_WINDOW = 12px` of a breakpoint, size locks to it:

```typescript
for (const bp of bps) {
  if (Math.abs(nextWidth - bp) <= SNAP_WINDOW) { nextWidth = bp; break; }
}
```

### Aspect lock

Captured at drag start: `dragStartAspect = rect.width / rect.height`. Active when `aspectLocked()` is true OR the user holds Shift during drag. Larger delta wins:

```typescript
if (Math.abs(dx) >= Math.abs(dy)) nextHeight = nextWidth / aspect;
else nextWidth = nextHeight * aspect;
```

### Keyboard (APG separator contract)

`onKeyDown` on the handle — only active when `keyboard=true` (tabindex 0). Arrow keys step by `keyboardStep` (default 16px), Shift+arrow by `keyboardLargeStep` (default 64px). `Home` = min, `End` = max. Fires `(resize)` at keyboard settle (not rAF-batched).

### Dimension readout

`div.interop-resizable__readout` appended to host, `aria-hidden="true"`. Updated by `ResizeObserver` during drag (cheap DOM write via `textContent`). Rendered as `W × H` with `Math.round`.

## Public API

```typescript
reset(): void
```

Removes inline `width` and `height` styles from the host, then re-applies `initialSize` if set. Also called by double-clicking the Tier 1 handle (`onHandleDblClick`).

## Outputs

| Output | When |
|---|---|
| `resizeStart` | Tier 1 drag begins (`onPointerDown`) |
| `resize` | ResizeObserver (both tiers); mid-drag only if `liveResize=true` |
| `resizeEnd` | Tier 1 drag ends (`onPointerUp`, keyboard settle, double-click reset) |

## Host attributes

| Attribute | Value |
|---|---|
| `class` | `interop-resizable` (always) |
| `data-axis` | `'horizontal' | 'vertical' | 'both'` |
| `data-tier` | `'native' | 'enhanced'` |
| `data-aspect-locked` | `''` when aspect-locked, absent otherwise |
| `style.container-type` | bound to `containerType()` input |

## CSS — strategy conformance & token surface

Runs the two-file split per [css-strategy](../css-strategy.md). Structural
(`styles/components/resizable.css`) owns layout, state *selectors*, and
motion; theme (`styles/themes/protocol/components/resizable.css`) owns values
only. Every selector is `:where()`-wrapped → specificity `(0,0,0)`, so any
consumer override wins.

- **No structural fallbacks.** Base declarations are bare `var(--token)`; the
  theme guarantees a value. Only per-state tokens fall back — and always to
  their *base* token (`var(--x-hover, var(--x))`), never a literal.
- **Handle is one nested block.** Base → `&:where(:hover)` (recolour +
  `scale(1.02)` from center) → `&:where(:focus-visible)` (the a11y ring,
  structural-owned). The **active** colour is ancestor-driven (host
  `.interop-resizable--dragging` class), so it can't self-nest — it's a
  descendant rule beside the base, per the strategy's one exception. Same
  pattern for the readout's drag-reveal (`opacity: 1`).
- **Theme scoped to the host:** `:where([interop-root] [interop-resizable])`,
  grouped by part — matches the current canonical form (command-palette), not
  the older bare-`[interop-root]` files.

This is a low-level directive, so the lever set is deliberately small — only
what a consumer plausibly needs to restyle:

| Group | Tokens | Notes |
|---|---|---|
| Bounds | `--itx-resizable-{min,max}-{width,height}` | One token per bound, two ways to set it — see *Bounds: two paths* below. |
| Frame | `--itx-resizable-border-{color,width,style,radius}` | **`-border-color` is `transparent` by default** — frame off until opted in. Width stays `1px` so revealing it costs no reflow. |
| Handle | `--itx-resizable-handle-{size,color,color-hover,color-active,corner-radius}` + `-focus-outline-{color,width,offset}` | Corner-drag affordance. `-handle-color` is the primary lever. |
| Readout | `--itx-resizable-readout-{background-color,foreground,padding,border-radius,font-family,font-size,offset}` | Tier-1 `[showDimensions]` badge only. |

Not themeable by design: axis cursors, `touch-action: none`, z-index,
transition timings, the drag/rAF behavior — all structural constants.

### Bounds: two paths, one token

Each bound resolves to a single custom property (e.g. `--itx-resizable-min-width`), settable two ways:

- **CSS token** on an ancestor (or the host) — a scoped default for many instances.
- **`[min]` / `[max]` inputs** — a per-instance override. The directive writes the same custom property inline on the host via a `boundVar(bound, axis)` host binding, so the input wins over an ancestor default through the normal cascade.

Both tiers read the result identically: Tier 0's native `resize` honours the `min`/`max-inline-size` the token feeds (no JS in the loop); the Tier-1 drag loop reads the same inputs when clamping. This is the reason the inputs work in both tiers — they don't *enforce* bounds in JS, they *feed the CSS*.

This is the first [[project_disambiguation_notes]] case. The reader-facing explainer is filed as an `interop-expansion-panel` disclosure (summary = "Why can I set bounds in two places?") in the demo page's "Setting size bounds" section (`projects/demo/src/app/pages/resizable/resizable-page.html`).

**Bug fixed during this run:** dead selector
`:where([interop-resizable--dragging] …)` matched a nonexistent *attribute*,
not the `.interop-resizable--dragging` class — removed; the class-based
descendant rule is now the sole active-state hook.

## Container queries

The host is a CQ container by default (`container-type: inline-size`). Descendants can write `@container` rules targeting its width. Override with `[containerType]` if you need `size` or `normal`.
