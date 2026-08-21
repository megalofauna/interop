# Amber Lab — how the accent solver chose its strategy

Rescued from `ITX-10-link-cards-for-command-palette`, which was never merged and
is being deleted. This was a live demo page at the time (`Experiments → Amber
Lab`, scoped to `itx-colorway="amber-lab"`); it is kept here as a record, not
restored as a route.

## Why it is worth keeping

The generator still cites it by name, as the evidence for a decision it makes on
every accent family:

> `scripts/generate-color-ladder.mjs` — `solveSolid()`
> *"Keeps saturation and moves lightness, rather than the reverse: a brand colour
> that has been desaturated to hit a contrast target is no longer the brand
> colour (amber-lab Strategy 2 produced 'a barely-amber dark brown'), whereas one
> that has shifted lightness still reads as itself. Strategy 4, adopted."*

And so does the spec:

> `projects/interop/src/lib/styles/tokens/accents.spec.ts:72`
> *"The recorded win from amber-lab Strategy 2: the same vivid colour in …"*

Two shipped files argue from an experiment whose only copy was on a branch
scheduled for deletion. That is the whole reason this directory exists.

## What it did

Derived seven roles — `bg-subtle`, `bg-muted`, `bg-bold`, `border-muted`,
`border-bold`, `text`, `on-bold` — from the amber hue (54.35°) rather than
reading them off a fixed lightness ramp, and compared two derivation strategies
side by side in pinned light and dark frames: raw role swatches on top, the same
roles composed into a card below, so each could be judged doing its actual job.

That framing — *show the roles doing their jobs, not as swatches* — is the same
argument the Colour page now makes with real componentry.

## Caveats

Written 2026-07-25, against the pre-ITX-40 colour system. It will not compile or
render as-is: the vocabulary it explores (`bg-subtle`, `bg-bold`, `on-bold`) was
superseded by the seeded accent families, and the surrounding demo shell has
moved on. Read it as an argument, not as code.

Files: `amber-lab-page.{html,scss,ts}` and `amber-lab.css`, verbatim.
