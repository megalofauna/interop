# Branch salvage — what to keep before the cleanup

Triage of 36 unmerged local branches (~118 commits, 2026-07-12 → 08-17) against
`main` at `7b6d2404`. Done 2026-08-21.

**The shape of it:** almost everything landed under different SHAs, because PRs
merge as new commits and the source branches were never deleted. Feature-existence
checks alone would have thrown away real work — the Tailwind demo below sits on a
branch whose component *does* exist on main and whose ticket has no trace in the
log. Commit subjects were the signal.

29 of 36 branches carry nothing not already on `main`. The other 7 are listed here.

---

## A. Code worth lifting

### 1. Tailwind + Angular Material button clones — `ITX-25-button-variants`

Two `<demo-example>` blocks, "Borrowed vocabulary: Tailwind" and "Borrowed
vocabulary: Angular Material", reproducing each framework's button using only
`--itx-button-*` tokens and the source framework's own literal values. Tailwind
resolved against the v4 default theme; Material read off `@angular/material`'s
own source with the compiled Material colours. Both schemes. No component code.

Survives the ITX-40 colour rewrite untouched, because it never references the
system colour vocabulary — unlike everything else of that vintage.

It even documents its departures: *"Tailwind Plus declares these focus utilities
on the primary button only … A ring on every variant is a floor we keep."*

**Why it matters:** it is the most direct answer available to "this token system
is abstruse and unyielding." Here is someone else's button, in our levers.

**Lift, do not merge.** The branch's copy of `button-page.ts` also carries a
hand-maintained token-defaults table still citing `--itx-neutral-5/6/7/12` and
`--itx-colorway-7`; main's version of that table is already current. Take:
- the two `<demo-example>` blocks from `button-page.html`
- `tailwindHtml`, `tailwindCss`, `materialHtml`, `materialCss`
- the `tailwindFiles` / `materialFiles` `CodeFile[]` arrays

The branch's other commit (remove `InteropButtonPrefix`/`Suffix`) already landed
via `itx-51-button-addons`.

### 2. Ratio-first resizable — `ITX-11-aspect-ratio-first-resizable` ✅ DONE

`main` has `aspectLocked` (a boolean). This branch adds `[aspectRatio]` — a
*declared* ratio (`'16/9'`), authoritative, with one axis projected onto the
driving one so the ratio cannot be clamped out of shape. Plus two fixes that
read as real bugs:

- `fix(resizable): measure and report one box, not two`
- `fix(resizable): resolve min/max bounds the way CSS does`

Backed by a cross-engine probe (below) that drove Blink, WebKit and Gecko with
real dispatched input against each UA's own resizer control.

**Ported 2026-08-21.** It cherry-picked after all: `main` had touched resizable
only with the repo-wide prettier run, so the branch was a clean superset —
identical counts for `aria-orientation`, `keyboardLargeStep` and the dragging
class, plus `aspectRatio`. Taken with its 338-line spec (601 tests, up from
583), the `box-sizing: border-box` fix, and the mental-model card.

Two things deliberately NOT taken: the branch regressed `resizable.css`'s
transition from `var(--itx-duration-fast)` to a literal `96ms`, which `main`
already does correctly; and the demo example, because that diff spans 149 files
against a demo that has since been rebuilt. A ratio-first example can be written
fresh against the current page.

---

## B. Documents that exist nowhere else

Deleting these branches destroys these files. Rescue first.

| file | branch | note |
| --- | --- | --- |
| `.agent/imports.md` | `ITX-7-toast-chi` | **The import-hygiene convention doc.** The rule is followed on main — `public-api.ts` carries the icon-barrel warning — and a stored memory cites this path, but the file is not on `main`. |
| `.agent/explorations/resize-aspect-ratio/` (8 files) | `ITX-11` | The cross-engine probe: README, `probe.html/mjs`, `integration*.mjs`, `gecko-check.html`, `zen.mjs`. Measured evidence for a design claim. |
| `.agent/explorations/acrylic-panel.html` | `ITX-8` | A single `wip` commit. Exploration artifact only. |
| `.agent/todo/styleurl-components-migration.md` | `ITX-29` | Check against `.agent/records/styleurl-migration.md`, which may supersede it. |

---

## C. Ideas worth keeping, code not worth taking

The commits are too far behind to merge; the observations still hold.

1. **Aero toast palette + frosted-glass viewport** (`ITX-7`) — a third status
   palette beyond seventies/eighties, and a translucent toast tray with sheen
   and backdrop blur. Neither is on main; `--itx-status-palette` already supports
   adding a set. Pairs with the deferred work in the toast-followups memory.
2. **Square off the code-block tablist** (`ITX-13`, and `itx-20-chaos-commit`
   independently) — main still has `--itx-cb-tablist-border-radius: var(--itx-radius-full)`.
   Two separate attempts wanted it square. A preference, but a twice-held one.
3. **Drop the trailing "Notes" block from demo pages** (`ITX-32`) — still present
   on **13 pages**.

---

## D. Delete

The other 29 unmerged branches, plus 29 fully-merged local and 20 fully-merged
remote branches. Nothing in them is absent from `main`.

Two worth naming because they look alarming and are not:

- `ITX-40-colorscale-rewrite` (9 commits) — the entire colour system. Landed as
  PR #22; this is the pre-merge original.
- `itx-20-chaos-commit` — adds `primary`/`secondary`/`tertiary` (already on main),
  removes the `fancy`/`buttz` joke variants (already removed), and is written
  against `--itx-colorway-5/7/8` and `--itx-neutral-12`, **none of which exist on
  main**. Merging it would fail `check-undefined-tokens` on contact.
