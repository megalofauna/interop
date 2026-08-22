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
