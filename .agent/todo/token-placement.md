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

Done: `visimorph`, `button`, and the `toolbar` rig that restyles buttons.

Remaining: ~23 theme files still open with a per-layer block, roughly 400
declarations. Largest are stepper (56), command-palette (38), expansion-panel
(37), segmented-control (36), chip (34).

Cross-component declarations needing the rig treatment as their target moves:
23 in total — 15 in `rigs/toolbar.css` (done), 4 in `composites/inline-code.css`,
3 in `components/segmented-control.css` (its `--itx-segment-*`), 1 in
`components/stepper.css`.

Per file the one judgement call is the base selector, which must cover every
entry point — chip tokens are read under `[interop-chip-filter]`,
`[interop-chip-list]` and `[interop-chip-input]`. Derive it from the foundation
file's own top-level selectors rather than guessing.

## Guard, once the sweep lands

`scripts/check-token-placement.mjs`, in the same gate as `check-color-axes`:

1. A declaration in a per-layer block whose value does not read `--itx-surface*`
   or a per-layer colourway role → fail.
2. Any declaration at root or per-layer whose value reads a container-published
   token (`--itx-inner-radius`, `--itx-outer-radius`, `--itx-context-radius`,
   `--itx-radius-attr`) → fail. This is the freeze bug; currently zero
   violations, so the guard locks in a property that already holds.
