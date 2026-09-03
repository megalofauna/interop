# Colour role naming — how the vocabulary was chosen

Recorded 2026-08-29, decided 2026-09-01. `.agent/color.md` is the reference;
this is why it looks the way it does.

## What shipped

```
--itx-role-text  -quiet  -quieter  -disabled
--itx-role-text-{family}  -text-inverse
--itx-role-background-interactive  -background-control
--itx-role-background-{family}  -{family}-subtle
--itx-role-edge  -edge-{family}  --itx-role-divider
--itx-role-scrim
```

`namespace · type · role · family · modifier`, both trailing segments optional,
so the common case is the shortest to write. One grammar in both slots:
unmarked is full strength, a modifier is quieter.

Four decisions worth keeping the reasons for.

**Prominence, not brightness.** A brightness word is true in one arm and false
in the other — the dark text ramp runs 0.664 to 0.970 while the light one runs
0.489 to 0.150, so `brightest` would resolve to near-black in light mode. Both
arms land on the same contrast from opposite lightnesses, which is the property
a brightness name throws away.

**A comparative rather than two adjectives.** `quiet` and `quieter` carry their
own order. Two plain adjectives — `subtle` and `muted` — do not, and a reader
has to learn which is further out.

**The fill is unmarked and the wash is modified.** Usage decided it: the fill
had 38 reads against the wash's 5, so the common case got the shorter name. It
cost a new name for the label, because there was no longer a word to point at,
which is where `--itx-role-text-inverse` comes from.

**Four names retired by measurement rather than renamed.** Per-family
`on-solid` collapsed to one `--itx-role-text-inverse`, because one label clears
all five fills at worst 4.75. Per-family `on-tint` disappeared entirely,
because the family text already clears its own wash at 7.10 to 8.32 — five
tokens restating a guarantee the pairing already makes.

## Names considered and rejected

| name | why not |
|---|---|
| `tint`, `on-tint` | names an appearance, not a job; disliked on sight |
| `solid`, `on-solid` | same, and the fill is unmarked now |
| `wash` | the same job as `tint` under a second name |
| `ink` | a metaphor, which `.agent/writing.md` rules out |
| `bold` | collides with font-weight in conversation, and invites `bolder` |
| `strong` | cheaper than `bold`, but keeps two grammars |
| `container` | Material's word, and it collides with `@container`, which drives the layer counter |
| `page-N`, `layer-N` | two names for one ramp, and `layer` collides with `itx-layer` |
| `subtler` | invited by the text scale, and the background scale has no such rung |

## Why there was nothing to copy

Nine systems were surveyed and they disagree on every axis. That is what made
the naming worth doing rather than borrowing.

**Naming a foreground/background pair.** Three strategies, no winner.

| approach | systems |
|---|---|
| encode the pair in the name | Material `onErrorContainer`, shadcn `-foreground`, Radix `--accent-contrast`, Fluent `...ForegroundOnBrand`, Interop `on-tint` |
| name by slot and prominence, document the pairing | Atlassian, Bootstrap `-bg-subtle` / `-text-emphasis` |
| hybrid | Primer — slot and prominence, plus `fgColor-onEmphasis` for the inverted case |

**Naming a wash.**

| name | systems |
|---|---|
| `subtle` | Bootstrap, Atlassian, Spectrum |
| `muted` | Primer, shadcn |
| `container` | Material — and it collides with `@container`, which drives our layer counter |
| numbered | Fluent, Radix |
| `tint` | Interop, alone |

**Slot-first or family-first.** Primer, Atlassian and Carbon lead with the slot
(`--fgColor-danger-emphasis`). Bootstrap and shadcn lead with the family
(`--bs-danger-bg-subtle`). Ours went slot-first once the 84 step tokens that
were holding it family-first were deleted.

## What the critiques of other systems say

- **Asserted guarantees drift silently.** Radix issue #12, open since 2021: step
  9 solids fail 4.5:1 with white text for most hues. Issue #42, open since 2024:
  yellow, amber and orange measure 4.33, 4.44 and 4.13 against a documented
  4.5:1. Both were found by users with devtools. Neither has a maintainer
  response. The documented promise has since changed metric, threshold and
  reference background.
- **WCAG 2 is contested.** Symmetric, so blind to polarity. Ignores font size
  and weight. Unreliable near black, which is where dark themes live. APCA
  exists for those reasons and Radix has moved. Out of scope for now.
- **Semantic tokens bloat.** Each axis multiplies the count. Names chosen for
  global meaning stop making sense inside independently built components.
- **Generated colour dilutes intent.** Material concedes dynamic colour causes
  contrast problems and brand drift without deliberate constraint.

## What a colour system should be

Bracketing all of the above.

**Audiences, ranked.** The library's own components first, because a consumer
cannot see or fix a contrast failure inside a component they did not write. Then
the application developer building beside the library. Then the brand owner.

**It must guarantee** legibility measured continuously against the shipped
artifact, legibility at every depth the system can produce, and a claim precise
enough to be falsified.

**It must make easy** answering "what am I painting" and "how much should it
stand out" and nothing else; landing somewhere safe without reading docs;
reaching the raw material in the same vocabulary when the named thing is wrong;
changing colour without re-deriving relationships.

**It must refuse** a name per combination; naming by appearance (`tint`) or by
recipe (`step 3`) rather than by job; letting an invisible mistake render;
promising more than it measures.

**Judge one by:** can a developer choose correctly without docs; does anything
catch a wrong choice; does the guarantee survive a palette change and how do you
know; how many names must a person carry.

Most systems answer the first well and the second not at all.

Where this one landed, against those four:

1. **Choosing without docs.** A developer picks a job, not a number. The old
   answer was worst-in-class — it required knowing which step you stood on.
2. **Catching a wrong choice.** `check-color-axes.mjs` fails a raw step and an
   elevation token on a mark. Both contrast checks fail a floor.
3. **Surviving a palette change.** Redeclare a surface or a hue and both checks
   re-measure. Nothing restates a relationship that has to be kept in sync.
4. **Names to carry.** Thirteen roles, six surfaces, five hues, two chroma
   dials. It was 84 steps plus 30 family roles.
