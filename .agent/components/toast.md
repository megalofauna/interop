# Toast — Mental Model Card

> `src/lib/components/interop-toast/` — one component you place, one service you
> call. Visual language borrowed from IBM Carbon's Notification (toast variant,
> low-contrast treatment) — see [`.agent/workflows/carbon-borrow.md`](../workflows/carbon-borrow.md).

## The one idea

**Toast is service-first, not markup-first.** There is no `<interop-toast>`
element to write. You place exactly one `<interop-toast-viewport />` in the app
shell and everything after that is imperative: `toast.success('Saved')` returns
a handle, the service pushes state into a signal array, the viewport renders the
tail of it.

That inversion is what makes the rest legible. The viewport owns *presentation
and interaction* (position, stacking, pause, hotkey). The service owns
*lifecycle* (creation, duration, dismissal, async transitions). The item owns
*one toast's* timer, swipe and ARIA. Nothing crosses those lines.

The consequence to remember: a toast that is not rendered is not running. See
[Overflow is not a queue](#overflow-is-not-a-queue).

## Files

```
src/lib/components/interop-toast/
  interop-toast.types.ts     ToastType/Position/DismissReason/CancelBehavior/
                             SwipeDirection, ToastAction, InteropToastOptions,
                             ToastAsyncMessages, ToastState
  interop-toast.config.ts    InteropToastConfig, INTEROP_TOAST_DEFAULTS,
                             INTEROP_TOAST_CONFIG (InjectionToken<Partial<…>>)
  interop-toast.service.ts   InteropToastService — root-provided, owns _toasts
  interop-toast-handle.ts    InteropToastHandle — per-toast handle + Subjects
  interop-toast-viewport.ts  interop-toast-viewport — the only exported component
  interop-toast-item.ts      interop-toast-item — internal, NOT exported
  public-api.ts

src/lib/styles/components/toast.css                   structural (global)
src/lib/styles/themes/protocol/components/toast.css   41 tokens (Protocol theme)
```

`public-api.ts` exports the viewport, the service, the handle, the config token,
the defaults object, and the types. **`InteropToastItem` is deliberately not
exported** — it is an implementation detail of the viewport's `@for`, and its
inputs (`toast`, `index`, `total`, `expanded`, `paused`) are wiring, not API.

## Sub-components

### InteropToastViewport — `interop-toast-viewport`

Standalone, OnPush. Place one in the root layout. Host is `role="region"` with a
hardcoded `aria-label="Notifications"`, plus `[data-position]` and
`[data-expanded]`.

```html
<router-outlet />
<interop-toast-viewport position="top-center" />
```

**Inputs** (all optional, all `undefined` by default — see the cascade below):
`position`, `maxVisible`, `hotkey`. No outputs.

Responsibilities:
- renders two visually-hidden live regions, then `@for` over `visibleToasts()`
- `mouseenter` / `focusin` → `expanded = true`, `paused = true`
- `mouseleave` / `focusout` → collapse + unpause, but only if the *other* input
  is also gone (`hasHover` and `hasFocus` are tracked separately). `focusout`
  first checks `el.contains(event.relatedTarget)` so moving between the close
  and action buttons doesn't collapse the stack.
- `visibilitychange` → pause while `document.hidden`, unpause on return unless
  hovered or focused
- a global `keydown` hotkey that stashes `document.activeElement`, then focuses
  the first `button, [tabindex]:not([tabindex="-1"])` in the viewport. Focus is
  restored on the way out in `focusout`.
- registers/unregisters itself with the service so `create()` can warn when
  there is no viewport

### InteropToastItem — `interop-toast-item`

Internal. Renders one toast: a `__content` block (`__message` + optional
`__description`), then an `__actions` block (optional action `<button>`,
optional close `<button aria-label="Close notification">` wrapping a 16px
`aria-hidden` inline SVG cross).

Host carries `role`, `aria-live`, `aria-atomic="true"`, `data-type`,
`data-state`, `data-swipe`, `data-dismissible`, `tabindex="0"`, and
`(keydown.escape)`.

Owns two things the service can't: the **auto-dismiss timer** (an `effect` that
re-runs on `toast()`/`paused()` change, banking `timeRemaining` on pause and
resuming from it) and the **swipe gesture**.

### InteropToastService — `@Injectable({ providedIn: 'root' })`

`_toasts = signal<ToastState[]>([])` is the source of truth. `count` is a public
computed of its length. Two private `Map`s hold the live handles and the async
subscriptions by id.

### InteropToastHandle

Returned by every creation method. Plain class, not an injectable. Wraps three
RxJS `Subject`s and two callbacks closed over the toast's id.

| Member | Notes |
|---|---|
| `id` | `itx-toast-${n}` from a module-level counter |
| `dismiss()` | dismisses with reason `'programmatic'` |
| `update(patch)` | patches `message`/`description`/`type`/`action`/`duration`/`dismissible` |
| `afterDismissed()` | emits the `ToastDismissReason`, then completes |
| `onAction()` | emits the action id, completes when the toast is dismissed |
| `afterOpened()` | **never emits** — see [Known gaps](#known-gaps) |

## Creating a toast

Every public method funnels into one private `create()`:

```
show(msg, opts)                → type: opts.type ?? 'default'
success/error/warning/info/loading(msg, opts)  → type forced
observe(source$, messages, opts)  → starts 'loading', subscribes
promise(promise, messages, opts)  → starts 'loading', then()
```

`create()` mints the id, resolves `duration` and `dismissible`, emits dev-mode
warnings, builds the `ToastState`, constructs the handle, and appends to
`_toasts`. **Append, not prepend** — the end of the array is the newest toast,
which is why the viewport slices from the end.

### Duration is resolved, not defaulted

`resolveDuration(type, explicit)`:

1. an explicit `duration` always wins — including `0`
2. `error`, `warning`, `loading` → `0` (never auto-dismiss)
3. otherwise global config `duration`, else `6000`

`0` and `Infinity` both mean "no timer"; the item checks
`duration <= 0 || !isFinite(duration)`.

### Dismissible is inferred from that

`resolveDismissible(type, duration, options)`:

1. an explicit `true`/`false` wins (`'auto'` falls through)
2. `error` / `warning` → `true`
3. `loading` → `true` unless `cancelBehavior === 'prevent'`
4. `duration === 0` or non-finite → `true`
5. otherwise → **`false`**

The rule underneath: *anything that will not leave on its own must offer a way
out, and anything that will should not add a button for it.* So a plain 6-second
`success()` has **no close button** — that is correct, not a bug. Pass
`{ dismissible: true }` to force one.

### Async toasts

`observe()` and `promise()` are the same shape: create a `loading` toast, then
`ref.update()` it into `success` (duration re-resolved from options) or `error`
(duration forced to `0`), setting `dismissible: true` either way. Both default
`cancelBehavior` to `'detach'`.

`success` / `error` in `ToastAsyncMessages` may be a string or a factory
receiving the resolved value / thrown error.

Only `observe()` registers its `Subscription` in `asyncSubs` — a `Promise` has
nothing to cancel, so `cancelBehavior: 'unsubscribe'` is a no-op for
`promise()`.

## Dismissal — five reasons, one funnel

Everything routes through `removeToast(id, reason)`.

| `ToastDismissReason` | Raised by |
|---|---|
| `timeout` | the item's timer firing |
| `dismissed` | the close button, or Escape on a focused item |
| `programmatic` | `handle.dismiss()`, `service.dismiss(id)`, `dismissAll()` |
| `swipe` | swipe past threshold or velocity |
| `action` | **clicking the action button** — it fires `onAction()` *and* dismisses |

`removeToast` does three things in order:

1. **The `prevent` guard.** `cancelBehavior === 'prevent'` + `type === 'loading'`
   + reason is not `'programmatic'` → return, toast stays. This is the only way
   to make a toast that the user genuinely cannot get rid of, which is why it is
   scoped to `loading` and why code can always still close it.
2. **Subscription teardown.** `'unsubscribe'` calls `sub.unsubscribe()`;
   `'detach'` and `'prevent'` just drop the entry and let the work finish.
3. **Removal + notification.** Filters `_toasts`, calls `ref._emitDismissed()`
   (which completes both `afterDismissed` and `onAction`), deletes the ref.

`dismissAll()` iterates a snapshot with reason `'programmatic'`, so it clears
`prevent` toasts too.

## Overflow is not a queue

```typescript
visibleToasts = computed(() => this.service._toasts().slice(-max));
```

Excess toasts stay in `_toasts` — they are simply not rendered. Because the
auto-dismiss timer lives in `InteropToastItem`, **an unrendered toast has no
running timer**. It starts its countdown when a newer toast leaves and it slides
into the visible slice. That is the right behaviour (nobody wants a toast to
expire unseen) but it is not what "queued" usually implies, and `count` reports
the full backlog, not the visible number.

## ARIA and the live-region story

Two mechanisms are present; only one is doing work.

**The item announces itself.** The host element is the live region:

| Toast type | `role` | `aria-live` |
|---|---|---|
| `error` | `alert` | `assertive` |
| everything else | `status` | `polite` |

plus `aria-atomic="true"` so the message and description are read as one unit.
The item is inserted into the DOM after the viewport already exists, which is
what makes the announcement fire.

**The viewport's two live regions are inert plumbing.** It pre-renders a polite
and an assertive `.interop-toast-viewport__live-region` (both
`aria-atomic="true"`, `aria-relevant="additions text"`, visually hidden by the
classic clip-rect recipe in the structural CSS) so that primed regions exist
before any content arrives. **Nothing in the codebase ever writes into them.**
They are the scaffolding for a future "announce through a stable region instead
of through the toast element" migration; today they are empty and harmless.

**Keyboard reach.** Toasts are famously unreachable by keyboard, so:
`tabindex="0"` on every item, a global hotkey (`alt+KeyT`) that moves focus into
the region and restores it afterwards, `Escape` to dismiss a focused dismissible
toast, and pause-on-focus so the thing you are reading does not vanish.

**`altText` is collected but not rendered.** `ToastAction.altText` exists on the
type, dev-mode warns when an action omits it — and the item template renders
only `action.label`. See [Known gaps](#known-gaps).

## Swipe

Set up in `afterNextRender`, gated on the config's `swipeDismiss`. Left button
only. `pointermove` writes `--_swipe-x` / `--_swipe-y` inline on the host; the
structural CSS reads them through `translate: var(--_swipe-x, 0) var(--_swipe-y, 0)`.
These are private runtime slots and legitimately carry inline `0` fallbacks —
at rest there is no translation.

On `pointerup`, dismiss if `distance >= swipeThreshold` (50px) **or**
`velocity > 0.11` px/ms; otherwise remove the properties and let the 150ms
`translate` transition snap it back. The gesture is **omnidirectional** —
distance is `√(dx² + dy²)`, no axis is privileged. The exported
`ToastSwipeDirection` type has no consumer.

`touch-action: none` on the item is what stops the browser scrolling instead.

## Configuration cascade

Three tiers, resolved per-value: **component input → `INTEROP_TOAST_CONFIG` →
`INTEROP_TOAST_DEFAULTS`**. The token is `Partial<InteropToastConfig>` with an
empty-object factory, so providing it never forces you to restate everything.

```typescript
providers: [
  { provide: INTEROP_TOAST_CONFIG,
    useValue: { position: 'top-right', duration: 8000 } satisfies Partial<InteropToastConfig> },
]
```

| Key | Default | Read by |
|---|---|---|
| `duration` | `6000` | service — `resolveDuration` |
| `position` | `'bottom-right'` | viewport |
| `maxVisible` | `3` | viewport |
| `hotkey` | `'alt+KeyT'` | viewport |
| `swipeDismiss` | `true` | item |
| `swipeThreshold` | `50` | item |
| `gap` | `14` | **nothing** |
| `pauseOnHover` | `true` | **nothing** |
| `pauseOnFocusWithin` | `true` | **nothing** |
| `pauseOnDocumentHidden` | `true` | **nothing** |
| `expandOnHover` | `true` | **nothing** |

The bottom five are declared, defaulted, and never read. The behaviours they
name are unconditional in the viewport, and `gap` is a CSS concern that
`--itx-toast-gap` already owns. Treat them as unimplemented, not as switches.

`hotkey` is parsed as `+`-separated modifiers plus a trailing **`KeyboardEvent.code`**
(`'alt+KeyT'`, not `'alt+t'`), compared case-insensitively, with every unlisted
modifier required to be *off*.

## Dev-mode warnings

Three, all in `create()`:

1. no `<interop-toast-viewport>` registered — the single most common
   "toasts don't work" cause
2. `type: 'error'` with a finite positive `duration` — errors should persist
3. an `action` without `altText`

## CSS architecture

The standard two-file split (`css-strategy.md`), with no per-component
`styleUrl` and no view encapsulation.

**`styles/components/toast.css` — structure.** Fixed positioning and the six
`data-position` variants, flex layout, the visually-hidden live-region recipe,
`@starting-style` enter animation (`opacity: 0; scale: 0.93`), the swipe
translate, focus rings, hover states, and a `prefers-reduced-motion` block that
kills the transition *and* overrides the `@starting-style` so nothing animates
in. Everything is wrapped in `:where()` and nested states use `&:where(:state)`,
so the whole file is specificity `(0,0,0)`. Colour, border, radius, shadow and
spacing are all bare `var(--itx-toast-*)` with **no inline fallbacks** — the
theme owns every value.

**`styles/themes/protocol/components/toast.css` — values.** 41 custom
properties on `:where([interop-root])`, one `@media (min-width: 99rem)` that
rebinds `--itx-toast-width`, and five `:where([interop-root] interop-toast-item[data-type="…"])`
blocks that rebind **colour tokens only** from the status palette. Because the
variants only touch colour, a toast re-skins with the active
`itx-status-palette` and nothing about the borrow had to change them.

| `data-type` | background / foreground | accent + border colour |
|---|---|---|
| `success` | `--itx-success-surface` / `--itx-on-success-surface` | `--itx-success` |
| `error` | `--itx-danger-surface` / `--itx-on-danger-surface` | `--itx-danger` |
| `warning` | `--itx-warning-surface` / `--itx-on-warning-surface` | `--itx-warning` |
| `info` | `--itx-info-surface` / `--itx-on-info-surface` | `--itx-info` |
| `loading` | base | `--itx-muted` |
| `default` | base | `--itx-border` |

**Attributes set with no CSS consumer:** `data-state`, `data-swipe`,
`data-expanded` on the viewport, and the `--_index` / `--_total` style bindings.
The state is tracked but not yet expressed — notably, `expanded` is a real
signal that drives nothing visual, so hover does not currently fan the stack.

## What the Carbon borrow established

Carbon's *low-contrast toast notification*, taken as visual language only — no
markup, no behaviour.

**A squared 288px panel.** `--itx-toast-width: 18rem`, widening to `22rem`
(352px) at Carbon's `max` breakpoint, `@media (min-width: 99rem)` = 1584px. The
viewport is padded and `border-box`, so its `max-inline-size` is grossed up:
`calc(var(--itx-toast-width) + 2 * var(--itx-toast-offset))`. Squared, not
rounded — `--itx-toast-border-radius: var(--itx-radius-none)`, and the action
and close buttons match. Carbon gives notifications no radius at all, and the
reasoning holds: a rounded toast reads as a floating card, a square one reads as
a message the system has posted, which is what it is.

**A 3px status bar as `border-inline-start`, not an inset box-shadow.** The
panel has no frame (`--itx-toast-border-width: 0px`); its only edge is
`border-inline-start: var(--itx-toast-accent-width) solid var(--itx-toast-accent-color)`
at 3px. This is a deliberate divergence from the technique the **tree** uses for
its 4px edge marker, for two reasons:

1. the toast already budgets layout for the bar, so a border stealing 3px of
   box is wanted, not a problem — which is exactly the condition the tree's
   inset `box-shadow` exists to avoid;
2. `border-inline-start` **flips in RTL**. A `box-shadow` x-offset does not — it
   is physical, and would sit on the wrong edge in an RTL document.

Same logic drives the padding: `--itx-toast-padding` is a uniform 16px rather
than Carbon's 13px-plus-3px-bar, because expressing that would need a physical
4-value shorthand that strands the reduced side on the left in RTL. The start
edge sits 3px wider. That is the cheaper error.

**A 14px/18px type pair separated by weight, not by dimming.** Title and
description are the *same* size — `--itx-toast-font-size` and
`--itx-toast-description-font-size` are both `0.875rem`, with
`--itx-toast-line-height: 1.2857` (18/14). Only the weight separates them: 600
over 400. And they are not dimmed apart —
`--itx-toast-description-opacity: 1` and
`--itx-toast-description-margin-block-start: var(--itx-spacing-0)`, so the pair
stacks with no gap and reads as one block of text rather than a heading with a
caption.

The sizes are **fixed rem, not `--itx-font-size-*`**. Those roles are fluid
`clamp()` values and overflow a fixed-height row — one of the few places the
typography system is deliberately bypassed.

**Elevation mapped, not copied.** Carbon's `0 2px 6px 0 rgb(0 0 0 / 0.2)` is a
tight close shadow; rather than hardcode it, `--itx-toast-shadow` points at
`--itx-shadow-md`, which keeps its `light-dark()` pair.

**Adjusted rather than copied:**
- **Close button 32px, not Carbon's 48px flush corner.** Ours sits inside the
  padded content row, so 48 would set the height of the whole panel. 32 is the
  largest step that leaves the toast the height of its text while still clearing
  WCAG 2.2 SC 2.5.8. The glyph stays full-strength (`--itx-toast-close-opacity: 1`,
  and hover-opacity is also `1`) — hover moves the *background*, not the fill.
- **Focus stays ours.** Carbon's is 2px inset blue; ours is 2px `--itx-colorway`
  outside the box. Focus is where our brand survives an otherwise neutral
  component.

### The known gap: two of Carbon's three status signals

Carbon's status language is a **triple** — the edge bar, the tinted background,
and a glyph in the full-strength status colour. **The item markup has no icon
slot**, so we ship two of the three. That is a component change, not a value
change, and it is the single largest outstanding item on this borrow.

Also not taken:
- the **high-contrast (inverse) treatment** — a dark panel with inverse support
  colours. We express one contrast level, not two.
- the **ghost action button**. Carbon's action has no border and leans on link
  colour to read as interactive. Our foundation sets `color: inherit` on the
  action with no token to redirect it, so dropping the frame would leave the
  action indistinguishable from the message. The 1px frame
  (`--itx-toast-action-border-width: 1px`) stays until there is a colour token
  to trade it for; Carbon's 32px height is approximated with padding.
- the **caption row** and the inline/callout notification variants — no
  equivalent here.

## Token reference

All 41, set on `[interop-root]`, verified against
`themes/protocol/components/toast.css`.

### Viewport

| Token | Default |
|---|---|
| `--itx-toast-z-index` | `9999` |
| `--itx-toast-gap` | `var(--itx-spacing-3)` — 12px |
| `--itx-toast-offset` | `var(--itx-spacing-4)` — 16px |
| `--itx-toast-width` | `18rem` — 288px (`22rem` / 352px above 99rem) |
| `--itx-toast-max-width` | `calc(var(--itx-toast-width) + 2 * var(--itx-toast-offset))` |

### Item container

| Token | Default |
|---|---|
| `--itx-toast-background` | `var(--itx-surface-above)` |
| `--itx-toast-foreground` | `var(--itx-on-surface)` |
| `--itx-toast-border-width` | `0px` |
| `--itx-toast-border-color` | `var(--itx-border)` |
| `--itx-toast-border-radius` | `var(--itx-radius-none)` — 0 |
| `--itx-toast-accent-width` | `3px` |
| `--itx-toast-accent-color` | `var(--itx-border)` |
| `--itx-toast-padding` | `var(--itx-spacing-4)` — 16px |
| `--itx-toast-item-gap` | `var(--itx-spacing-4)` — 16px |
| `--itx-toast-shadow` | `var(--itx-shadow-md)` |

### Item typography

| Token | Default |
|---|---|
| `--itx-toast-font-size` | `0.875rem` — 14px |
| `--itx-toast-line-height` | `1.2857` — 18px on 14px |
| `--itx-toast-message-font-weight` | `600` |
| `--itx-toast-description-font-size` | `0.875rem` — 14px |
| `--itx-toast-description-margin-block-start` | `var(--itx-spacing-0)` — 0 |
| `--itx-toast-description-opacity` | `1` |

### Motion

| Token | Default |
|---|---|
| `--itx-toast-enter-duration` | `var(--itx-duration-base)` — 200ms |
| `--itx-toast-enter-easing` | `var(--itx-easing-decelerate)` — `cubic-bezier(0, 0, 0.2, 1)` |

### Action button

| Token | Default |
|---|---|
| `--itx-toast-actions-gap` | `var(--itx-spacing-2)` — 8px |
| `--itx-toast-action-padding-block` | `var(--itx-spacing-2)` — 8px |
| `--itx-toast-action-padding-inline` | `var(--itx-spacing-3)` — 12px |
| `--itx-toast-action-border-width` | `1px` |
| `--itx-toast-action-border-color` | `var(--itx-border)` |
| `--itx-toast-action-border-radius` | `var(--itx-radius-none)` — 0 |
| `--itx-toast-action-font-size` | `0.875rem` — 14px |
| `--itx-toast-action-font-weight` | `400` |
| `--itx-toast-action-background-hover` | `var(--itx-surface-hover)` |

### Close button

| Token | Default |
|---|---|
| `--itx-toast-close-size` | `var(--itx-spacing-8)` — 32px |
| `--itx-toast-close-border-radius` | `var(--itx-radius-none)` — 0 |
| `--itx-toast-close-opacity` | `1` |
| `--itx-toast-close-opacity-hover` | `1` |
| `--itx-toast-close-background-hover` | `var(--itx-surface-hover)` |

### Focus

| Token | Default |
|---|---|
| `--itx-toast-focus-width` | `2px` |
| `--itx-toast-focus-color` | `var(--itx-colorway)` |
| `--itx-toast-focus-offset` | `2px` — the toast item itself |
| `--itx-toast-focus-offset-tight` | `1px` — buttons inside the panel |

## Known gaps

Ordered by how likely they are to bite.

1. **No status icon slot.** Blocks the third of Carbon's three status signals.
   Component change.
2. **`afterOpened()` never emits.** `InteropToastHandle._emitOpened()` exists
   and is fully implemented; **nothing calls it**. The `Subject` is created and
   never nexted, so subscribers hang forever. Either the item should report
   its `afterNextRender` back to the service, or the method should go.
3. **`ToastAction.altText` is never rendered.** The type documents it, devMode
   warns when it is missing, and the template ignores it. The intent (an
   `aria-description`-ish alternative route for AT users) is unrealised, so the
   warning currently asks for something that has no effect.
4. **Five config keys are dead** — `gap`, `pauseOnHover`, `pauseOnFocusWithin`,
   `pauseOnDocumentHidden`, `expandOnHover`. The behaviours are unconditional.
   Either wire them or drop them; a documented switch that does nothing is worse
   than an undocumented behaviour.
5. **`expanded` drives nothing.** The viewport computes it, sets `data-expanded`,
   and passes it to every item; no CSS reads it and the item ignores the input.
   Stack fanning on hover is state without a visual. Same for `--_index` /
   `--_total`, `data-state` and `data-swipe`.
6. **`ToastSwipeDirection` has no consumer.** Swipe is omnidirectional. Either
   constrain the gesture per position (the useful version — a bottom-right toast
   should swipe right, not up into the page) or delete the type.
7. **No exit animation.** `@starting-style` handles enter; removal is a
   straight DOM detach. `data-state: 'exiting'` is declared in the item's signal
   union and never set.
