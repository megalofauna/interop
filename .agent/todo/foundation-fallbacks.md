# Foundation fallbacks: scope

Raised 2026-08-23, from a concrete symptom: there is nowhere designated to set
the checkbox's corner radius. `--itx-control-radius` is read at
`styles/components/visimorph/visimorph.css:80` and declared by no theme, so it
appears neither in the theme file where its seventeen siblings live nor in the
starter. It is listed in `interop.tokens.css`, commented out and marked
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

## The fix, in order of value

1. **Give the 81 homeless tokens a theme home.** Mechanical, low risk, and it
   is the whole of the reported symptom. `--itx-control-radius` goes in
   `themes/protocol/components/visimorph/visimorph.css` beside its siblings,
   mirroring `--itx-control-label-radius` in the sibling `label.css` which
   already does this correctly. The value does not change; it moves.
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
