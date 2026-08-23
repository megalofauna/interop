# TODO — page-nav's theme file is a quarter inert

**Status:** the dead levers are FIXED, 2026-08-23. The sticky-offset bug below
is still UNRESOLVED and is the remainder of this file. Original note: investigated
2026-08-18 and deliberately rolled back — the work was done while chasing a
complaint that turned out to be about `interop-command-palette`, not page-nav.
The findings below were verified against the source; the fix was reverted, not
the diagnosis, and every one of them still held five days later.

**Why it matters:** the theme file's own header says *"the structural foundation
references every one of these; there are no fallbacks there, so this file is the
single source of truth."* That sentence is false for eight of its declarations.
Editing them does nothing, which is exactly how this was noticed.

---

## Dead: declared by the theme, read by nothing

| token | what the structure does instead |
|---|---|
| `--itx-pn-padding-block` / `-inline` | the bar has no padding rule; the `<ul>` carries `padding: unset` |
| `--itx-pn-radius` | no `border-radius` anywhere on the bar |
| `--itx-pn-border-width` / `-color` | the rule is drawn from an undocumented `--itx-pn-nav-rule-*` family |
| `--itx-pn-link-radius` | links paint hover and current backgrounds with no corner |
| `--itx-pn-label-color` | `.itx-pn__label` sets `font-weight` and `text-transform`, never `color` |
| `--itx-pn-background-opacity` | `background-color` builds its own `color-mix()` percentages |

Two of these are worse than merely dead:

- **The stuck block re-declares `--itx-pn-border-color`** to keep the bottom
  rule in step with the revealed background, and carries a comment explaining
  the reasoning. The border it aims at is drawn from `--itx-pn-nav-rule-color`,
  so that whole mechanism has never executed.
- **Two token families for one border.** `--itx-pn-border-*` is documented and
  dead; `--itx-pn-nav-rule-*` is undocumented and live.

## Read but never declared

`--itx-pn-focus-color` / `-width` / `-style` / `-offset` fall through to
`tokens/focus.css` by design, and `--itx-pn-link-background-image-current` is a
deliberate consumer lever (it is in `check-undefined-tokens.mjs`'s allowlist).
Both fine.

`--itx-pn-sticky-top` is the interesting one. The structure reads
`top: var(--itx-pn-sticky-top, 0)`, so the lever works — but nothing declares it
and the documented surface never listed it, so the only way to discover it is to
read the structural file.

## The sticky offset does not appear to apply — UNRESOLVED

The demo sets `--itx-pn-sticky-top: var(--header-h)` on a shell ancestor
(`app.scss`), the component is mounted with `[sticky]="true"`, the host binding
`[class.itx-pn--sticky]` looks correct, `--itx-spacing-*` resolves, and
`page-nav.ts` only READS `getComputedStyle(el).top` (for the observer's
rootMargin) — it never writes it. Nothing else in the demo positions the nav and
no competing `inset-block` targets it.

Yet on inspection no `top` value is computed and the nav sits at offset 0,
pegged to the top whether the page is scrolled or not. The scroll container is
`.shell__content` (`overflow-y: auto`).

Next step is to read the nav's computed `position` in the running app. If it is
not `sticky`, the class binding is the problem; if it IS sticky, the offset is
being measured from a container edge that already sits where the nav appears.

Related: `top` is the one physical inset in a file that otherwise uses logical
properties throughout (`min-block-size`, `padding-block`, `border-block-end`).
Worth switching to `inset-block-start` for consistency regardless of the bug.

## A trap worth naming

Composites scope their theme block to the element — `:where([interop-root]
itx-page-nav)`, and the same for `itx-terminal` and `itx-code-block` — while
components co-declare on `:where([interop-root], [itx-layer], [itx-sink])`.

A declaration on the element beats any value a consumer inherits from an
ancestor, so an element-scoped theme is unreachable from above. That is the same
trade-off the colour review rejected for component-scoped blocks (see
`.agent/todo/color-cast-model.md` §8), sitting in three composite files today.

It bites concretely: adding a `--itx-pn-sticky-top: 0` default to the theme
silently killed the demo's ancestor override. Any token whose PURPOSE is
consumer configuration must not be declared in an element-scoped theme block —
its default belongs in the structural `var()` fallback, where absence is the
default and nothing is blocked.

---

## Fixed, 2026-08-23 — the dead levers

Zero `--itx-pn-*` declarations are now unread. Four were removed and four wired:

**Removed.** `--itx-pn-radius`, `--itx-pn-padding-block`, `--itx-pn-padding-inline`
— the bar has no radius or padding rule to attach them to, and inventing one to
justify a token would be changing the layout to fit the documentation. Spacing
comes from the links' own padding and `--itx-pn-gap`. `--itx-pn-background-opacity`
went too: the rest and stuck states each build their own `color-mix()`
percentage, which one opacity token cannot express.

**Wired.** `--itx-pn-link-radius` — hover and current backgrounds were painting
square corners under a house radius that is not square; they now read 4px.
`--itx-pn-label-color` — a section label inherited body colour and sat at the
same weight as the links it groups; now `neutral-9`.

**Reconciled.** The two families for one border are one family. The documented
names won and the live values came with them, so the rest state renders
identically — `2px solid neutral-3`, measured before and after.

That last one has a consequence worth watching. The stuck block re-declares
`--itx-pn-border-color: var(--itx-pn-background-color)` with a comment
explaining that the stuck rule is the last row of the bar's own background
rather than a mark. The border it aimed at was drawn from the other family, so
**that mechanism had never once executed**. It does now: measured, the stuck
rule resolves to exactly its background colour, so the hairline disappears when
the bar pins. That is what the comment always intended and nobody has ever
seen. If a visible edge under a stuck bar is wanted, the fix is one line in the
stuck block, not a revert of the reconciliation.

The demo was lying in both directions and is fixed too: its token table
advertised `--itx-pn-padding-*` (dead) and used `--itx-pn-nav-rule-*`
(undocumented). It now lists the real names, plus `--itx-pn-sticky-top`, which
had no documented home at all.

## The same disease elsewhere — 73 tokens

Measured while closing this out: **73 theme declarations across 15 files are
read by nothing.** Worst are stepper (20), expansion-panel (8),
segmented-control (7), button (6) and toolbar (6).

A `check-dead-tokens` guard is the obvious answer and cannot land until those
are worked down, since it would open with 73 violations. Worth pairing with the
foundation-fallbacks sweep — both are "the theme says something the structure
does not read", from opposite ends.
