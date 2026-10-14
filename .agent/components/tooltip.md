# Tooltip — Mental Model Card

A tooltip is an element with `interop-tooltip`, shown while the pointer rests
on its trigger or the trigger has keyboard focus. `bindTooltip(trigger,
tooltip)`, or `[interopTooltip]` in Angular, makes it a `popover="hint"` with
`role="tooltip"` and wires it to the trigger. It holds text only: touch never
opens it.

```html
<button interop-button type="button" [interopTooltip]="close">
  <svg interop-icon name="tabler-x"></svg>
</button>
<span interop-tooltip="label" #close>Close</span>

<button interop-button type="button" [interopTooltip]="draft">Save draft</button>
<span interop-tooltip #draft>Saves without publishing</span>
```

## Files

```
projects/interop/tooltip/
  interop-tooltip.structure.css   placement, box, fade in
  interop-tooltip.base.css        token values
  tooltip.ts                      InteropTooltip directive
  public-api.ts
projects/interop/src/bind-tooltip.ts   bindTooltip(), framework-free
```

The demo page is `projects/demo/src/app/components/tooltip/`.

## Label or description

| Markup | Relation | Use |
|---|---|---|
| `interop-tooltip="label"` | Its ID is added to the trigger's `aria-labelledby` | The name of an icon-only button. The trigger needs no other name |
| `interop-tooltip` | Its ID is added to the trigger's `aria-describedby` | Extra text for a trigger that has a name |

IDs already in the attribute stay. A tooltip with no ID gets
`itx-tooltip-<n>`. `bindTooltip()` adds `popover="hint"` and `role="tooltip"`
only when the element has no `popover` or `role`. Browsers without `hint` treat
it as `manual`.

## Behavior

| Event | Result |
|---|---|
| Pointer rests on the trigger | Opens after `--itx-tooltip-interest-delay-start`, 0.5s |
| Pointer leaves the trigger and the tooltip | Closes after `--itx-tooltip-interest-delay-end`, 0.25s. The pointer can move onto the tooltip and keep it open |
| Keyboard focus on the trigger | Opens at once. Focus from a click does not open it (`:focus-visible` is checked) |
| Blur | Closes |
| Pointer down on the trigger | Closes. The pointer has to leave before it can open it again |
| Touch | Never opens it |
| Escape, `hint` supported | The browser closes it, one layer per press, and the key still reaches the page |
| Escape, `hint` not supported | A capturing `keydown` on the document closes it and calls `preventDefault()`, so one press closes one layer and a dialog around it stays open |
| Another tooltip opens | This one closes: one tooltip on screen at a time |
| The browser closes it, e.g. a click elsewhere | `toggle` resets its state |

The delays are read from the tooltip's computed style each time one starts,
so set them on the tooltip, a class or a container. Values in `s` and `ms`
work.

`showPopover({ source: trigger })` makes the trigger the anchor.

`InteropTooltip` (selector `[interopTooltip]`) takes an element or an ID.
Changing it rebinds; `null` unbinds. Unbinding closes the tooltip and removes
the trigger's reference to it.

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
| `tooltip-interactive` | A tooltip holding a link, button, form control, `details`, `[tabindex]` or `[contenteditable]` |
| `tooltip-trigger-disabled` | A `disabled` control with a tooltip. Use `aria-disabled="true"` with `guardActivation()` |
| `tooltip-repeats-name` | A describing tooltip whose text equals the trigger's name |
| `tooltip-label-in-name` | A label tooltip on a trigger with visible text that the tooltip does not contain (WCAG 2.5.3) |

## Tested

Style guards: text contrast at 4.5:1, light and dark; radius; motion. axe on
label and describing tooltips, open and closed. `bindTooltip()` has 11 specs,
`InteropTooltip` 2. Audit rules have specs.

Not recorded: browser runs, screen reader output.

## Not built

Tooltips on touch, interactive content (use a popover), an arrow, the
`interestfor` attribute.
