# TODO — page-nav's theme file is a quarter inert

**Status:** open, not started. Investigated 2026-08-18 and deliberately rolled
back — the work was done while chasing a complaint that turned out to be about
`interop-command-palette`, not page-nav. The findings below are real and were
verified against the source; the fix was reverted, not the diagnosis.

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
