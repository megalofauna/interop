# Tooltip — Mental Model Card

A tooltip is text in an element with `interop-tooltip`, shown while the pointer
rests on its trigger or the trigger has keyboard focus. It is written in the
markup: the tooltip is a `popover="hint"` with `role="tooltip"` and an `id`, and
the trigger names it in `aria-labelledby` or `aria-describedby`.
`bindTooltips()`, called once for the document, opens and closes every tooltip.
It holds text only: touch never opens it.

```html
<button interop-button="icon" type="button" aria-labelledby="tip-close">
  <svg interop-icon name="tabler-x"></svg>
</button>
<span interop-tooltip="label" id="tip-close" popover="hint" role="tooltip">Close</span>

<button interop-button type="button" aria-describedby="tip-draft">Save draft</button>
<span interop-tooltip id="tip-draft" popover="hint" role="tooltip">Saves without publishing</span>
```

```ts
import { bindTooltips } from "interop";

bindTooltips(); // once; returns a function that removes it
```

## Files

```
projects/interop/tooltip/
  interop-tooltip.structure.css   placement, box, fade in
  interop-tooltip.base.css        token values
  public-api.ts                   empty
projects/interop/src/bind-tooltips.ts   bindTooltips(), framework-free
```

The demo page is `projects/demo/src/app/components/tooltip/`. The demo app calls
`bindTooltips()` once, in `app.ts`.

## The markup

The author writes every attribute; `bindTooltips()` writes none.

| Markup | Trigger references it with | Use |
|---|---|---|
| `interop-tooltip="label"` | `aria-labelledby` | The name of an icon-only control. It replaces a wrapping `<label>`'s text, so the control needs no other name |
| `interop-tooltip` | `aria-describedby` | Extra text for a control that has a name |

- `popover="hint"` keeps the tooltip hidden until it opens. Browsers without
  `hint` treat it as `manual`. Without `popover` its text sits in the page, read
  by screen readers.
- A hidden element still names or describes its trigger, so the trigger is
  accessible before any script runs, and if none runs.
- Put the tooltip outside its trigger: inside, its text joins the trigger's
  name while it is open.
- IDs are unique. An `@for` that stamps out one `id` gives every trigger the
  first tooltip's text; build the ID from the item.
- A trigger's attribute may list other IDs too, such as a hint:
  `aria-describedby="hint tip-save"`.

## Behavior

`bindTooltips()` listens once on the document and reads the markup each time an
event arrives. Triggers and tooltips a framework adds, replaces or re-renders
need nothing more. Calling it again adds no listeners; each call returns its own
remover, and the last one stops listening and closes an open tooltip. A library
part that needs tooltips, such as the code block, calls it too.

The trigger is the nearest element, from the event target up, whose
`aria-describedby` or `aria-labelledby` names an `[interop-tooltip]`. A
`<label>` stands for its control, so hovering a label's icon opens its radio's
tooltip. A trigger with both kinds shows the describing one. A trigger with
`interestfor` is left to the browser where it supports interest invokers.

| Event | Result |
|---|---|
| Pointer rests on the trigger | Opens after `--itx-tooltip-interest-delay-start`, 0.5s |
| Pointer leaves the trigger and the tooltip | Closes after `--itx-tooltip-interest-delay-end`, 0.25s. The pointer can move onto the tooltip and keep it open |
| Keyboard focus on the trigger | Opens at once. Focus from a click does not open it (`:focus-visible` is checked on the focused element) |
| Blur | Closes |
| Pointer down on the trigger | Closes. The pointer has to leave before it can open it again |
| Touch | Never opens it. Pen hover does |
| Escape, `hint` supported | The browser closes it, one layer per press, and the key still reaches the page |
| Escape, `hint` not supported | A capturing `keydown` on the document closes it and calls `preventDefault()`, so one press closes one layer and a dialog around it stays open |
| Another tooltip opens | This one closes: one tooltip on screen at a time |
| The browser closes it, e.g. a click elsewhere | A capturing `toggle` listener resets its state |

Whether a tooltip is open is read from the element (`:popover-open`): a tooltip
removed while open is closed by the browser without a `toggle` event, so nothing
kept can go stale. Only the delay timer and the hover, focus and press flags are
kept, per tooltip. Before opening, the trigger and the tooltip must both be on
the page.

The delays are read from the tooltip's computed style each time one starts,
so set them on the tooltip, a class or a container. Values in `s` and `ms`
work.

`showPopover({ source: trigger })` makes the trigger in use the anchor, so one
tooltip can serve several triggers.

## Look

| Concern | How |
|---|---|
| Placement | `position-area: block-start`, above the trigger and centered. `position-try-fallbacks: flip-block` moves it below when there is no room above |
| Width | `max-content`, up to 20rem and the window less 0.5rem each side. A tooltip that does not fit takes a fallback instead of wrapping |
| Font | Set on the tooltip, so a tooltip inside code or a heading keeps the body font at `p-sm` |
| Colors | Inverted: neutral-50 on neutral-900 in light, neutral-900 on neutral-100 in dark. 4.5:1 (tested) |
| Edge | A 1px transparent border, so forced colors draw an edge |
| Corner | Half the house radius |
| Motion | Fades in over the faster shared duration; disappears at once. A fade out keeps a closed tooltip rendered, and Chrome can then lose the name or description of its trigger |

| Token | Default |
|---|---|
| `--itx-tooltip-position-area`, `-position-try-fallbacks` | block-start, flip-block |
| `--itx-tooltip-margin-block`, `-margin-inline` | `--itx-space-1`, 0px |
| `--itx-tooltip-max-inline-size` | 20rem |
| `--itx-tooltip-padding-block`, `-padding-inline` | `--itx-space-1`, `--itx-space-2` |
| `--itx-tooltip-font-family`, `-font-weight` | `--itx-font-family`, `--itx-font-weight` |
| `--itx-tooltip-font-size`, `-line-height` | the `p-sm` role |
| `--itx-tooltip-color`, `-background-color` | neutral-50/900, neutral-900/100 |
| `--itx-tooltip-border-width`, `-border-style`, `-border-color` | 1px, solid, transparent |
| `--itx-tooltip-border-radius` | `calc(var(--itx-radius, var(--itx-radius-base)) / 2)` |
| `--itx-tooltip-corner-shape` | `--itx-corner-shape` |
| `--itx-tooltip-interest-delay-start`, `-interest-delay-end` | 0.5s, 0.25s |
| `--itx-tooltip-transition-duration`, `-transition-timing-function` | the faster shared duration, the shared easing |

## Dev audit rules

| Rule | Flags |
|---|---|
| `tooltip-not-popover` | A tooltip without `popover` |
| `tooltip-relation` | A label tooltip referenced by `aria-describedby`, or a describing tooltip by `aria-labelledby` |
| `tooltip-trigger-unfocusable` | An element with a tooltip that the keyboard cannot reach |
| `tooltip-orphan` | A tooltip no element references. A trigger behind a closed `@if` makes this fire too |
| `tooltip-interactive` | A tooltip holding a link, button, form control, `details`, `[tabindex]` or `[contenteditable]` |
| `tooltip-trigger-disabled` | A `disabled` control with a tooltip. Use `aria-disabled="true"` with `guardActivation()` |
| `tooltip-repeats-name` | A describing tooltip whose text equals the trigger's name |
| `tooltip-label-in-name` | A label tooltip on a trigger with visible text that the tooltip does not contain (WCAG 2.5.3) |

axe flags a reference to an ID that does not exist, and duplicate IDs.

## Tested

Style guards: text contrast at 4.5:1, light and dark; radius; motion. axe on
label and describing tooltips, open and closed. `bindTooltips()` has 16 specs,
with jsdom standing in for the popover API and `:focus-visible`. Audit rules
have specs. `scripts/browser/check-tooltip.mjs` checks real popovers in Chromium
and WebKit.

Not recorded: screen reader output.

## Not built

Tooltips on touch, interactive content (use a popover), an arrow. Interest
invokers (`interestfor`, Chrome and Edge 142+) are allowed only on `<button>`,
`<a>`, `<area>` and SVG `<a>`; when they are Baseline, buttons and links add
the attribute to the same markup, and `bindTooltips()` already leaves them to
the browser.
