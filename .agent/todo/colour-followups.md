# Colour — deferred after the elevation rework

Raised and agreed 2026-08-22, during the move to a monotonic ramp.

## Layered depth for shadows

`--itx-elevation-shadow` is currently one value for every layer, so a card at
layer 1 and one at layer 5 cast the same shadow. Material scales it: further
from the page means a larger, softer shadow.

The engine is already the right place — it emits a per-layer token set, so it
could emit a per-layer shadow the same way it emits a per-layer surface. The
values want to be a ramp of their own (blur and offset growing with depth)
rather than three fixed steps.

Not urgent: one quiet shadow reads correctly at every depth today, it just does
not reinforce depth the way it could.

## Review — and probably gut — the Colour page

The page has grown to fifteen sections and now documents several things that
are no longer true or no longer interesting:

- **The direction comparison is stale.** Its left frame shows the bidirectional
  model, which no longer ships. Either rewrite it as a before/after record or
  retire it.
- **Step-size candidates** for the dark ramp predate the monotonic change.
- **The palette boards** and the **12/14-step candidates** overlap heavily now
  that a candidate has been chosen.
- **Ranks hold at every depth** and **What each rank is for** describe a
  vocabulary the palette is meant to replace.

The page has been doing double duty as a design surface and a reference, and the
design work is mostly finished. What should survive is the reference: the
palette, the legibility board, what the two axes are, and how to override.
Everything that exists to argue a decision that has since been made belongs in
`.agent/records/palette-spike.md`, not on a page consumers read.

## Three text levels

Chris wants three, matching the rank system's secondary / body / maximum. On a
uniform ramp this is three DISTANCES rather than three reserved steps, so it
costs nothing structurally — see the palette floors.

## Page-relative steps lose their margin at depth

Found migrating the field (2026-08-22). Contrast ranks were **surface-relative**:
every layer boundary re-solved them against its own ground, so a rank held its
ratio at any depth. Palette steps are **page-relative** and fixed. The two ramps
are now independent, and the elevation ramp keeps climbing after the palette has
stopped compensating.

Secondary text (step 9) against the dark elevation ramp:

| layer | surface | step 9 | step 10 | step 11 |
| --- | --- | --- | --- | --- |
| 0 | 0.170 | 4.78 | 6.31 | 8.25 |
| 1 | 0.202 | 4.50 | 5.95 | 7.78 |
| 2 | 0.234 | **4.18** | 5.52 | 7.22 |
| 3 | 0.266 | **3.81** | 5.03 | 6.58 |
| 4 | 0.298 | **3.42** | 4.52 | 5.91 |
| 5 | 0.330 | **3.04** | **4.02** | 5.26 |
| 6 | 0.362 | **2.69** | **3.56** | 4.65 |

Step 9 clears AA to layer 1. Step 10 to layer 4. Nothing clears layer 6 but 11.
Point-fixing each component to the depth it happens to render at is fitting the
demo, not the system — the same component at a different depth breaks again.

Three ways out, in preference order:

1. **Derive depth-tracking text roles per layer.** `--itx-text-secondary` and
   friends emitted inside `tokenSet()`, resolved against the current surface —
   exactly the trick that fixed status drift. Components read the role and get
   depth tracking free; the flat palette stays for consumers picking a step by
   hand. Costs a handful of role tokens, no new palette tokens.
2. **Cap the elevation ramp** at the depth real UI reaches (2–3), so a fixed
   step is safe everywhere. Cheapest, but it spends the elevation range we just
   built to fix the dark page.
3. **Consumers offset by depth.** Radix's answer. Manual and unguarded, and it
   gives back the automatic guarantee the ranks provided — the thing the README
   sells.

Recommend 1. Decide before button and stepper, which read the most ranks and
render at the widest spread of depths.
