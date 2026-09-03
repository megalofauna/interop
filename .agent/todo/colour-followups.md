# Colour — deferred

Everything the elevation rework and the naming work opened is closed except
what is below. `.agent/color.md` describes what ships.

## Layered depth for shadows

`--itx-elevation-shadow` is one value for every layer, so a card at layer 1 and
one at layer 2 cast the same shadow. Material scales it: further from the page
means larger and softer.

The engine is the right place — it already writes a surface per depth, so it
could write a shadow the same way. The values want to be a ramp of their own,
blur and offset growing with depth, rather than fixed steps.

This matters more than it did. In dark mode the scrim does not separate a
dialog from the page — 1.27 against 3.29 light, and raising the alpha to 0.7
only reaches 1.31, because darkening an already-dark page cannot create
separation. The shadow is what carries that separation, and right now it does
not know how deep it is.

## Usage guidance at the point of use

Radix puts a panel behind each swatch: what the colour is for, what it pairs
with, the values to copy. Ours has the measurements but not the guidance, so a
developer reads a number and still has to decide what it is for.

Chris asked for the worked vocabulary sample first, which is now shipped on the
Colour page. This is the other half.

## The family and modifier slots are positionally ambiguous

`--itx-role-text-danger` and `--itx-role-text-quiet` are the same shape and
different slots. Nothing in the name says which, and both are legal.

Accepted deliberately — no clean fix presented itself that was better than the
ambiguity. Worth revisiting if a family ever collides with a modifier word.

## The contrast metric

WCAG 2 is symmetric, so blind to polarity; it ignores font size and weight; and
it is unreliable near black, which is where the dark ramp lives. APCA exists for
those reasons and Radix has moved.

Parked, not rejected. It blocks nothing: swapping the metric is a change to two
scripts, and every floor in the system is measured rather than asserted, so the
cost of changing it is bounded.
