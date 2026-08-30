# Colour — deferred after the elevation rework

Raised and agreed 2026-08-22, during the move to a monotonic ramp.

**Update 2026-08-28.** The solver is gone: the contrast ranks are deleted, the
2270-line generator with them, and both stylesheets are hand-authored. Three
items below are settled by that and marked inline. The Colour page review is
NOT — it is now more overdue, because the page still renders per-layer role
figures that describe behaviour which no longer exists.

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

## Three text levels — STILL OPEN

Chris wants three, matching the rank system's secondary / body / maximum. On a
uniform ramp this is three DISTANCES rather than three reserved steps, so it
costs nothing structurally — see the palette floors.

## Page-relative steps lose their margin at depth — SETTLED

**Resolved 2026-08-28.** Option 1 (depth-tracking roles) was rejected along with
the rest of the relative machinery. The answer taken instead is option 2 taken
seriously: the ramp is short, and the ROLES are picked one tier further out than
the floor rule's minimum so they clear at the deepest layer rather than only on
the page. Border is step 9, not 8 — at dark layer 2 step 8 measures 2.99:1
against a 3:1 floor and step 9 measures 3.97:1. `check-contrast-css.mjs` now
measures all 96 role pairings at every depth, so this cannot silently regress.

The original analysis follows, because the numbers are still the reason.


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

**Decision (2026-08-22): deferred.** No fix now. Guaranteed contrast at any
depth stays a goal, but not a day-one one, and none of the three options is
worth committing to before the palettes have been used in real contexts long
enough to show what the problem actually looks like. Point-fix what the audit
catches; revisit once button and stepper are moved and the palette has been
lived in.

**Update (2026-08-22): the ramp was capped at three shades.** `DEPTH.above`
went 6 → 2, which removes most of this problem rather than solving it. The
deepest surface is now layer 2, where secondary text (step 9) measures 4.18:1
in dark — still short, which is why the field's addons and the stepper's
pending number sit at step 10. Layers 3–6, where the drift got genuinely bad
(down to 2.69:1), no longer exist. What is left to decide is whether step 9
should clear AA at layer 2 on its own, which is a question about where the
palette's secondary step sits rather than about depth tracking.

## Retiring the contrast ranks needs the status roles rebuilt first — DONE

**Resolved 2026-08-28**, and the blocker below turned out to be the wrong shape.
The tint did not need to be derived from the surface by relative colour syntax:
every status family already had its own 14-step palette, so the roles just point
at steps. The inversion problem was real and was solved by choosing step 3 rather
than step 2 — step 2 (L .199) sits below layers 1 and 2 (L .202, .234).

The original analysis follows.


The queue item read "retire `--itx-contrast-*` once the last read is gone."
The last *public* read is gone — 0 consumers across the library and all 38
demo routes. But the ranks are not dead, they have become internal: 192
declarations in the engine derive status roles from them via relative colour
syntax, `oklch(from var(--itx-contrast-N) l <chroma> var(--itx-<status>-hue))`.

The blocker is the tint specifically. It rides rank 1 because a rank is
solved away from *its own* surface at every layer, so a wash riding it cannot
invert. A palette step cannot do that job — measured against the shipped
surfaces, in dark:

| layer | surface | step 2 | result |
| --- | --- | --- | --- |
| 0 | 0.170 | 0.199 | lifts 0.029 |
| 1 | 0.202 | 0.199 | **inverts** 0.003 |
| 2 | 0.234 | 0.199 | **inverts** 0.035 |

A callout inside a card would be darker than the card. That is the exact bug
rank 1 was introduced to fix, and unlike the margin question this one is
visible rather than measurable.

The way out is to derive the tint from the surface directly rather than from
a solved rank — `oklch(from var(--itx-surface) calc(l ± delta) <chroma>
<hue>)`, with the sign flipped per scheme by `light-dark()`. That is sound
and would let the whole rank apparatus go, but it is a redesign of the status
system rather than a cleanup, and it should be done deliberately.

Not doing it now. The ranks cost 72 declarations inside a 1,268-line
generated file that nobody reads by hand, they carry the render manifest's
floor proof, and nothing is blocked by their existence. Revisit when the
status roles are being looked at for their own sake.
