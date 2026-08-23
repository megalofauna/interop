# Foundation fallbacks: scope

Raised 2026-08-23, from a concrete symptom: there is nowhere designated to set
the checkbox's corner radius. `--itx-control-radius` is read at
`styles/components/visimorph/visimorph.css:80` and declared by no theme, so it
appears neither in the theme file where its seventeen siblings live nor in the
globals file. It is listed in `interop.tokens.css`, commented out and marked
`/* (fallback) */` — the generator's flag for "no theme owns this".

It is not a visimorph quirk.

## The measurement

776 reads across the foundation carry a `var(--token, fallback)`. Sorted by
what the fallback actually is:

| kind | count | verdict |
| --- | --- | --- |
| chains to a more general token | 363 | by design — `--itx-button-focus-color` → `--itx-focus-color` |
| a state falling back to its own base | 51 | by design — `-hover` → the rest state |
| a bare literal | 316 | see below |
| a literal mixed into a var() chain | 46 | see below |

Of those last two groups:

- **148 reads (112 tokens) state a value the theme contradicts.** The
  foundation says buttons are `center`-justified; protocol says `flex-start`.
  Foundation says `--itx-button-disabled-opacity: 0.4`; protocol says `1`.
  Foundation says the toggle thumb is `#ccc`; protocol says `--itx-neutral-8`.
  Concentrated in stepper (59), table (21), segment (15), button (10).
- **96 reads (81 tokens) have no theme declaration at all.** For these the
  foundation is not a fallback, it *is* the value — the shipped product
  depends on a number parked in the file that is supposed to hold none.
  Concentrated in icon (9), toolbar (9), button (8), decoration (7).

## Why this is a defect and not a safety net

`interop.css` says so in its own header: *"It is intentionally incomplete on
its own — a theme must be imported."* Consumers are told to import a theme,
never the foundation directly. So under every supported configuration the
protocol theme declares the token and the fallback never fires.

The one case where a fallback IS reachable is a **custom theme** — the header
invites authors to import the foundation and build on top, and such a theme
may omit tokens. That is a real audience, and it is exactly the audience the
148 contradictions mis-serve: an incomplete custom theme silently gets a
different product from protocol, not a neutral floor.

The 81 homeless tokens are worse, because no theme can be blamed. They are
the shipped values, in the wrong file, invisible to anyone looking where the
architecture says to look.

## Correction: the 81 are not one thing

Written before looking at them individually. They split three ways, and only
one of the three should move.

**Structural defaults that belong in the foundation** — `--itx-icon-display:
inline-flex`, `--itx-icon-pointer-events: none`, `--itx-layout-direction:
column`, `--itx-toolbar-display: flex`, the seven `--itx-decoration-*`. A theme
decides colour, size and shape; it does not decide whether an icon is a flex
container. These are correctly placed and exposed as tokens only so a consumer
can escape them. Roughly half the list.

**Contextual chains that cannot move.** `--itx-control-radius` is the reported
symptom and the clearest case. Its fallback is
`var(--itx-inner-radius, var(--itx-radius))`, and `--itx-inner-radius` is
declared by segmented-control on itself so a nested checkbox gets
nesting-correct corners. A `var()` inside a custom property resolves where it
is DECLARED, so moving that chain into the theme freezes it at the nearest
layer boundary, where `--itx-inner-radius` is undefined. Measured, in a
four-line repro:

    no theme declaration, checkbox inside a segmented control:  4px
    theme declares it,    same checkbox:                       12px

The nesting breaks — **when declared at the root or on a layer block.** That
qualifier was missing when this was first written, and it was the whole
answer. `tokens/shape.css` had already said so: a component's theme default
belongs *on the component*, where it substitutes at the element and sees
whatever that element inherits. Measured again, all three placements:

    :where([interop-root], [itx-layer], [itx-sink])   12px — nesting lost
    :where(interop-visimorph)                          4px — correct

So contextual chains move perfectly well; they just have exactly one valid
destination. `--itx-control-radius` now lives on `:where(interop-visimorph)`
and the checkbox finally has a findable radius. See
`.agent/todo/token-placement.md` for the rule and the sweep it implies.

**Genuine theme values.** The remainder — sizes, insets, corner shapes. These
can and should move.

## The fix, in order of value

1. **Give the genuinely theme-shaped tokens a home.** Not all 81.
2. **Reconcile the 148 contradictions to the theme's value.** Also mechanical
   once decided, but it is 148 judgement calls about what an incomplete
   custom theme should get, so it wants review rather than a sweep.
3. **Decide whether fallbacks belong at all.** If a custom theme is expected
   to be complete, the contract's own rule applies — foundation reads
   `var(--token)` bare, theme owns every value — and all 776 go. If partial
   custom themes are supported, the fallbacks stay but should be generated
   from the theme so they cannot drift again.

Step 3 is the real decision. Steps 1 and 2 are worth doing either way, since
both move values toward the theme, which is where every option ends up.

## Guardrail

Nothing currently detects this. `check-undefined-tokens` proves every read
resolves; it does not ask *where* the value lives. A check that fails when a
foundation fallback disagrees with the theme, or when a token has no theme
declaration, would keep the count at zero once it reaches zero.


## Done so far (2026-08-23)

- `--itx-spacing-6` was being shadowed by a literal `1.5rem` in `dialog.css`,
  the only case in the library where a fallback restates a global primitive.
  Rescaling `--itx-spacing-unit` would have moved the token and not the
  literal. Removed.
- Theme homes added for `--itx-control-corner-shape`,
  `--itx-control-focus-offset`, `--itx-control-label-corner-shape`,
  `--itx-control-touch-inset`, `--itx-stepper-menu-max-height`.
- `--itx-step-indicator-size` and `--itx-toolbar-border-radius` were
  *commented out* in the theme, at values (1.75rem, the pill) that were not
  what shipped — the foundation's fallback was supplying 2rem and 0. The theme
  now states what actually ships. This is a worse variant of the problem than
  a missing declaration: a reader sees a crossed-out number and believes it.

### A placement rule fell out of this

`visimorph` and `stepper` declare their theme tokens in the per-layer block,
`:where([interop-root], [itx-layer], [itx-sink])`. That block re-declares at
every boundary, which anything layer-sensitive needs — and which silently
wipes a consumer's override one layer down. Measured:

    override on a plain wrapper, no layer between:  squircle
    same override, one [itx-layer] below:           (wiped)
    same override, root-only declaration, 2 below:  squircle

So a static value put in the per-layer block becomes *less* overridable than
it was as a bare fallback. The additions above went into root-only blocks for
that reason. The seventeen static tokens already sitting in visimorph's
per-layer block have the same defect and are worth splitting out — that is the
next piece of work here, and it is a behaviour fix rather than tidying.

---

## The count was wrong four times over — 2026-08-23

The headline numbers in this file came from heuristics, and every successive
filter cut them down. Recording the sequence, because the lesson is about
measurement rather than tokens.

**Dead theme tokens: 73 → 1.** The detector matched `var(--token` as a literal
string, so it missed every read where `var(` and the token sit on different
lines — which is how prettier formats any long declaration — and it scanned only
`.css`, missing tokens read from TypeScript. The one real case was
`--itx-toast-focus-offset-tight`, now wired.

**Contradictions: 154 → 29.** Four classes of false positive, each of which
looked exactly like a defect until the case was read:

| filter | left | what it removed |
| --- | --- | --- |
| — | 156 | |
| fallback is a no-opinion default (`initial`, `none`, `auto`) | 76 | the foundation declining to have an opinion is correct |
| theme declares it only in a state or variant block | 60 | the base fallback IS the base value |
| state inherits its own base (`--x-completed` → `var(--x…)`) | 38 | by design; the name-list version missed `-completed`, `-skipped`, `-error`, `-reviewed`, `-locked` |
| declaration is contextual, from another component's block | 29 | the toolbar setting `--itx-button-height: auto` is not the button's base |

The general rule that replaced the name list is worth keeping: a fallback that
references a token which is a **prefix** of the one being read is a state
reading its base, whatever the suffix happens to be called.

## Done — the hardcoded colour fallbacks

Nine, removed. These were the unambiguous half: light-only literals that would
have been wrong in dark mode had they ever fired.

    var(--itx-neutral-2, #ffffff)              ×2   a PALETTE token with a hex fallback
    var(--itx-control-toggle-thumb-color, #ccc)
    var(--itx-tooltip-background, #333)
    var(--itx-tooltip-foreground, #fff)
    var(--itx-icon-missing-color, red)
    var(--itx-stepper-menu-background-color, white)
    var(--itx-dialog-background, Canvas)
    var(--itx-dialog-foreground, CanvasText)

Verified unreachable before removal by measuring each token at its read site,
and measured again after: byte-identical.

## Remaining — 29, and they want reading not sweeping

Every one of the 29 is a real second opinion, but they are not one job. Three
shapes:

- **Token-shadowing duplicates** — `--itx-table-cell-padding: 0.75rem 1rem`
  against `var(--itx-spacing-3) var(--itx-spacing-4)`. Same pixels today, and
  the literal cannot follow a rescale.
- **Competing design values** — `--itx-step-list-column-gap: 0px` against
  `48px`, `--itx-stepper-viewport-block-size: 24rem` against `32rem`. Someone
  has to decide what an incomplete custom theme should get.
- **Competing chains** — `--itx-indicator-border-radius` falling back to
  `var(--itx-inner-radius…)` while the theme says `var(--itx-radius)`. These
  interact with the placement rules and need reading in context.

Stepper (8) and table (6) are half the list.
