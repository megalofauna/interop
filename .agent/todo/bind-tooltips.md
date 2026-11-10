# Plan — `bindTooltips()`: every tooltip from the markup, with one call

**Status:** built 2026-11-10. The tooltip card ([../components/tooltip.md](../components/tooltip.md))
describes what shipped; this is the record of the decision.
**Replaced:** `bindTooltip(trigger, tooltip)` and the `[interopTooltip]` directive. It also covers
the tooltip part of `bound-helpers-and-rerender.md` (on branch `itx-transition` when this was built).

## Why

`bindTooltip()` bound one trigger to one tooltip, so every tooltip needed its own call, and a
framework re-render (hot module replacement, `@if`, `@for`) left the binding on elements no longer
on the page. The pairing was already in the markup, in the trigger's ARIA.

## Decisions

Agreed 2026-11-09 after a critical review:

- **The markup is the contract.** The author writes `popover="hint"`, `role="tooltip"` and an `id` on
  the tooltip, and `aria-labelledby` (label tooltip) or `aria-describedby` (describing tooltip) on
  the trigger. `bindTooltips()` writes no attributes. Without authored `popover`, a tooltip's text
  sits in the page, read by screen readers, until it first opens.
- **One install per document**, with no `root` parameter: a popover's events travel through its own
  ancestors, so a root that does not contain the tooltip misses them, and overlapping roots would
  handle each event twice. Each call returns its own remover; the last one stops listening.
- **Open state is read from the DOM** (`:popover-open`). A popover removed while open is hidden by the
  browser without a `toggle` event, so a stored flag would go stale. Only the timer and the hover,
  focus and press flags are kept, per tooltip.
- **Finding the trigger:** the nearest element whose ID list names an `[interop-tooltip]`; other IDs
  in the list do not stop the walk; a `<label>` stands for its control; a trigger with both kinds
  shows the describing one; `interestfor` triggers are left to the browser where supported.
- **`bindTooltip()` and `[interopTooltip]` retired:** one way per pattern, and their remover stripped
  ARIA the markup now owns.
- **Playbook amended:** "binds only the element it is given" now has an exception for behavior that
  must survive a re-render.
- **Audit rules added:** `tooltip-not-popover`, `tooltip-relation`, `tooltip-trigger-unfocusable`,
  `tooltip-orphan`.

## Interest invokers

`interestfor` is allowed only on `<button>`, `<a>`, `<area>` and SVG `<a>`, ships only in Chrome and
Edge 142+, and MDN describes no ARIA it adds. When it is Baseline, buttons and links add it to the
same markup; radios and other controls keep `bindTooltips()`.
