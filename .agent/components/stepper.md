# InteropStepper — Retired

Replaced by the step indicator `ol[interop-steps]`, the multi-step form recipe,
and `bindSteps()`. Research: [prompts/STEPPER-REVIEW.md](../../prompts/STEPPER-REVIEW.md).
The deprecated source is in
`projects/interop_deprecated/src/lib/components/interop-stepper/`, with CSS in
`styles/components/stepper.css` and `styles/themes/protocol/components/stepper.css`.

## What it was

A component that fused a step header, tab-like panels, a scroll-snap carousel,
a popover listbox menu and a Back/Next/Cancel bar: about 2,950 lines, of which
about 150 were specific to a stepper.

## Why it is not rebuilt

- Focus on the new step's heading, its central accessibility feature, never
  worked: the heading had no `tabindex`.
- Visited panels stayed in the accessibility tree and the tab order, side by
  side in the carousel, and a scroll could switch steps past the gate.
- Form-aware gating, the most-requested feature, was never built.
- Most of its code reimplemented tabs, a carousel, a menu and buttons.

Do not reintroduce tab roles, a carousel, or clickable navigation to future
steps. Never hide a step with `disabled`: its values drop out of the
submission. Never hide one with `hidden="until-found"`: find-in-page would
reveal future steps.
