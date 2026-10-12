# InteropTabs — Retired

Replaced by consumer-written tab markup, `bindTabs()`, and CSS. The design and
its reasons are in [prompts/TABS-RESEARCH.md](../../prompts/TABS-RESEARCH.md);
the relationship to the segmented control is in
[prompts/TABS-SEGMENTED-RELATIONSHIP.md](../../prompts/TABS-SEGMENTED-RELATIONSHIP.md).
The deprecated source is in
`projects/interop_deprecated/src/lib/components/interop-tabs/`, with CSS in
`styles/components/tabs.css` and `styles/themes/protocol/components/tabs.css`.

## What it was

An `<interop-tabs>` component on a `<section>` that generated its tab strip
from `<interop-tab-panel>` children, with lazy, destroy-on-hide and pre-render
panel options, three ways to drive the selection, an `ariaLabel` input, and a
projected actions slot.

## Why it is not rebuilt

- A generated strip cannot carry the consumer's attributes, tooltips or badges,
  and needs regenerating when control flow changes the panels. Every surveyed
  design system has the consumer write the tabs.
- The `ariaLabel` input existed because the strip was generated, and it also
  named the host `<section>`, turning every tab group into a duplicate landmark.
- Most of its code was Angular machinery for state the DOM can hold.

Do not reintroduce a generated tab strip. The consumer writes
`[role=tablist] > button[role=tab][aria-controls]` and the panels; the helper
adds behavior and fills in the reverse wiring.
