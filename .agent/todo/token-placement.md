# Token placement — one rule

> A theme declaration belongs on the component's own selector.

`tokens/shape.css` has said this since it was written; `tokens/placement.spec.ts`
now asserts it. Three placements exist and they are not interchangeable:

| declared on | substitutes | sees a container's token | consumer override |
| --- | --- | --- | --- |
| `[interop-root]` | at the root | no | survives any depth |
| `[interop-root], [itx-layer], [itx-sink]` | at each boundary | no | **wiped one layer down** |
| the component | at the element | **yes** | must target the element |

## Why the per-layer blocks exist, and why that expired

When contrast ranks were surface-relative, a component token aliasing one had
to be re-declared at every boundary or it froze at the wrong depth. The palette
replaced the ranks and is page-relative. The blocks are a fossil.

The objection — "but some of these read `--itx-surface*`" — does not hold.
`--itx-surface` is registered `inherits: true`, so an element inherits the
nearest boundary's value and reading it there gives the same answer
co-declaration would. Asserted in placement.spec.ts.

## The trade

An element's own declaration beats anything it inherits. So a rig that restyles
a component by setting that component's tokens **on itself** stops reaching it.
The toolbar's buttons went back to the 40px base height and the default fill
the moment button's theme moved.

The fix is for the rig to target the component's elements:

    :where([interop-toolbar]) :where([interop-button]) { … }

Both selectors are zero-specificity, so precedence is source order within
`interop.theme` — and `protocol.css` imports rigs (line 94) after components
(line 55). That ordering is now load-bearing.

## Progress

**Done — no per-layer theme block remains.** All 22 files converted across
three passes: visimorph and button as the pilot, then the seven unambiguous
ones (dialog, progress, popover, table, tree, tabs, expansion-panel), then the
eight that needed a judgement call about their base selector.

Base selectors that were not obvious, and why:

| file | selector | reason |
| --- | --- | --- |
| chip | four entry points | a chip-list stands alone, without a filter |
| field | `interop-field-input, interop-field-textarea` | there is no wrapping host |
| indicator | `interop-indicator, fieldset[interop-segmented-control]` | segment.css reads indicator tokens on a segment button, outside any indicator |
| tooltip | `.interop-tooltip__panel` | the panel is created in JS; it now carries its own tokens instead of depending on where it is appended |

Cross-component declarations retargeted: `rigs/toolbar.css` (15). The others
found in the survey turned out not to need it — `segmented-control.css` sets
`--itx-segment-*` on the fieldset and segments inherit it, and the
`inline-code` and `stepper` cases declare into their own subtree.

Verified by resolving a representative token on the element that reads it, per
component — the contrast audit alone would not catch a sizing regression. Two
apparent failures were bad probes rather than bad conversions:
`--itx-field-addon-color` lives in an `interop-field-control` block that was
never per-layer, and `--itx-segment-background-selected` is never declared at
all, being a foundation fallback chain.

## Guard

`scripts/check-token-placement.mjs`, in `lint:tokens` (and `npm run
lint:placement` on its own). Two rules:

1. No per-layer block in the theme. If a value genuinely needs the nearest
   boundary's surface it can still read it — `--itx-surface*` is registered
   `inherits: true`, so reading it at the component gives the same answer.
2. Nothing declared at `[interop-root]` may read a container-published token
   (`--itx-inner-radius`, `--itx-outer-radius`, `--itx-context-radius`,
   `--itx-radius-attr`). That is the freeze bug.

Both were verified to fail on a deliberately reintroduced violation before
being trusted — a guard that has only ever passed proves nothing.

## A footgun the sweep exposed

Running the full `lint:tokens` rather than individual checks turned up two
declarations I had added earlier: `--itx-control-corner-shape: initial` and its
label twin. A CSS-wide keyword as a custom-property value sets THE PROPERTY to
guaranteed-invalid; it does not pass the keyword through to whatever reads it.
Both happened to render correctly, because the foundation's
`var(--itx-control-corner-shape, initial)` fell back to the same thing — a
no-op that looked like a working default. `check-keywords.mjs` already existed
and would have caught it immediately. Both now name `round`, the real value.
