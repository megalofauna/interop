# Colour role naming — the open question

Recorded 2026-08-29. Nothing here is decided. `tint`, `on-tint` and `solid` are
all disliked and slated to change; the rename waits on the job list below.

## Why it is not decided yet

**There is no industry consensus to copy.** Nine systems were surveyed and they
disagree on every axis.

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
(`--bs-danger-bg-subtle`). Ours is family-first and the 84 step tokens
(`--itx-danger-9`) hold it there.

## The job list

Built from every colour-valued declaration in `styles/themes/`. Steps are what
components pick today, not what they should pick.

**Fills** — a background that is not the elevation surface.

| job | steps now | consumers |
|---|---|---|
| hover wash | 2 | table-row, tree-row, option, pn-link, chip-remove, toast-action, button |
| selected wash | 2 | option-selected, pn-link-current, chip-selectable |
| control rest | 3, 4 | button, step-indicator, list-marker, tab-selected |
| track | 3 | progress, slider, stepper scrollbar |
| family wash | 3 (`tint`) | callout, toast, tree, content, page-nav |
| family solid | outside the ramp (`solid`) | 38 reads |

**Text**

| job | steps now | consumers |
|---|---|---|
| primary | 14 | ~20 — content, table, dialog, popover, field, term, toast, tree, kbd |
| middle | 11 | quote, segment, step-label, term-prompt, `as-button~="secondary"` |
| secondary | **9 and 10** | 9: caption, note, del, muted, description, legend, group-label, link, tab · 10: field label, placeholder, addon, step-indicator |
| disabled | 8 | field-disabled, button-disabled |
| on family wash | 13 (`on-tint`) | named |
| on family solid | outside the ramp (`on-solid`) | named, unverified |
| on neutral solid | — | **missing** |

**Edges**

| job | steps now | consumers |
|---|---|---|
| invisible | 1 | button primary and tertiary — matches the surface so layout does not shift |
| separator | **2, 3, 5** | 3: content-rule, rig-divider, segmented-control-rule, expansion-panel, toolbar, page-nav, stepper-menu, code, table · 2: dialog, command-palette · 5: popover |
| visible edge | 8 | kbd, table, toast, step-indicator, content-quote, list-row-rule |
| emphasized edge | 9, 12, 14 | step-indicator-active, pn-link-hover, list-marker, indicator |
| family edge | 9 (`border`) | named |

**Marks** — handles, thumbs, indicators, ticks. Steps 3, 8, 9, 14. Slider thumb
is 14, slider mark 8, minor mark 3, resizable handle 8 hovering to 9.

**Scrim** — three literals with alpha: `dialog-backdrop`, `cmdp-backdrop`,
`term-scan-line`. The palette cannot express these and they have no name.

### What the counts say

Named today: 4 surfaces, 6 family roles. In use and unnamed: about fourteen.

Component themes read hand-picked neutral steps **185 times** and named roles
**64 times**. Neutral is the most-used family and the only one with no roles, so
every one of those 185 is a bare number chosen in isolation.

One text ramp was discovered six times under nine names. Five components landed
on step 9 for the same job — `caption-color`, `note-color`, `del-color`,
`muted`, `marker-color`. Three landed on step 10 — `label-color`,
`placeholder-color`, `addon-color`.

Three jobs have more than one answer: secondary text (9 and 10), separator
(2, 3 and 5), edge (neutral 8 versus family 9).

`border` is two jobs. The commonest border in the library is `neutral-3`, ten
uses, two steps from the page and far under the 7-step floor — a separator that
must not assert itself. `--itx-<family>-border` at step 9 is an edge that must.

## Open decisions

1. How many text tiers — three or four.
2. Is `selected` distinct from `hover`. They are the same colour today, so a
   selected row and a hovered row are indistinguishable.
3. Is `separator` distinct from `edge`. The evidence says yes.
4. Are marks a tier, or a reuse of the text and edge tiers.
5. Does neutral get a solid, which would give `on-neutral-solid` a home.
6. Does scrim join the system or stay a literal.

1 through 4 change how things look and want a comparison harness rather than an
argument.

## Fixable without deciding any of that

- Consolidate the separator to one value.
- Decide `selected` versus `hover`.
- Unify secondary text on one step.
- Add the `solid` / `on-solid` pairing to `check-contrast-css.mjs`. It is the
  one shipped pairing neither check measures, and the solid sits outside the
  step ramp at `oklch(0.500 0.190 264)`, so the distance rule cannot reach it.

## Alpha for borders and rules

Considered and parked. One ink at varying opacity instead of a step per
prominence — `--itx-neutral-14 / 10%` for a muted border, the same pattern for
every family. Scoped to borders and rules; backgrounds are out.

**For.** It dissolves the depth limit, because a 10% ink over the surface holds
a constant relationship as the surface climbs. It is scheme-symmetric in one
declaration, since `--itx-neutral-14` is near-black in light and near-white in
dark. It works over unknown backgrounds. It collapses the separator's three
answers into one expression.

**Against.** Alpha stacks multiplicatively, so a border inside a tinted
container differs from the same border on the page — desirable for a separator,
a problem where an absolute value is needed. `forced-colors` drops translucent
edges, and borders are what that mode cares about. For the 3:1 edge,
`check-contrast-render.mjs` goes blind, because it reads literal values with no
DOM, so the context-free half of the guarantee is lost. A separator has no
floor and loses nothing.

**Two objections that do not apply at this scope**, recorded because they were
raised and are wrong here: Material's retreat from opacity was about text and
elevation overlays, and M2's dividers were alpha. The subpixel-rendering concern
is text-only.

`resolveRgb()` in `lib/dev/contrast.ts` already composites alpha against a
backdrop, so no tooling work is needed to measure it.

## The reframe worth keeping

Jobs split by whether they carry a contrast floor, and that line cuts across the
slot-based grouping above. A floored job needs a fixed value measurable without
a DOM. An unfloored job needs a relationship to whatever is behind it. That may
be a better organizing principle than slot, and it changes what the naming has
to describe.

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

Most systems answer the first well and the second not at all. Ours answers the
second best and the first worst, because the rule is relative and requires
knowing which step you stand on.
