# TODO — components styled from `styleUrl` instead of the two-file split

**Status:** deferred, architectural (not mechanical — read the caveats)
**Raised:** 2026-08-12 by the round 5 (Progress) Carbon borrow
**Re-raised:** 2026-08-13 by rounds 10–14 — badge, field, slider and tabs all
hit it independently in the same sweep, which is how the count reached fifteen.
**Nine remain** — the field pair migrated 2026-08-15, then `interop-progress`
and the three slider files 2026-08-17. See below.
**Nine remain** — the field pair migrated 2026-08-15; badge, callout,
scroll-area and composites/terminal migrated 2026-08-17, see below.
**Ten remain** — the field pair migrated 2026-08-15; listbox, segmented-control
and code-renderer on 2026-08-17. See below.

## The debt

`css-strategy.md` says every component has exactly two CSS files, both imported
globally:

```
src/lib/styles/components/X.css                  structure
src/lib/styles/themes/protocol/components/X.css  values
```

Fifteen components didn't. They carry a component-local `styleUrl`, so all
their structure *and* all their values live in one file behind Angular's view
encapsulation:

```
interop-badge            interop-scroll-area
interop-callout          interop-segmented-control  (partially — has a theme file too)
interop-code-renderer    interop-tabs
interop-listbox          interop-tab-panel
composites/terminal
interop-code-renderer    interop-slider
interop-listbox          interop-slider-range
interop-progress         interop-slider-thumb
interop-segmented-control (partially — has a theme file too)
interop-tabs             interop-tab-panel

DONE — interop-badge, interop-callout, interop-scroll-area and
composites/terminal (2026-08-17). Migrated as a conformance pass, not a port —
four of the values that looked fine in the source were wrong against a system:

  - The callout's accent rule read --itx-<type>-solid, the status FILL, on an
    EDGE. The status families carry mark rungs the generator names for exactly
    that job ("border — Ring, rule, accent bar", 3:1), so it is
    --itx-<type>-border now. Same category error the tabs migration found on its
    selection bar. interop-toast still paints its status bar with -solid.
  - The terminal's plain scrollbar thumb was rank 2 (a 1.5:1 hairline). A thumb
    is a UI component boundary, which WCAG 2.2 SC 1.4.11 puts at 3:1 — rank 3.
  - Neither the terminal nor the callout reached the radius knob. The callout
    fell back to var(--itx-radius-none) inline, so it ignored --itx-radius and
    itx-radius="…" outright; the terminal's theme pinned
    --itx-term-radius: var(--itx-radius), which follows the knob but swallows
    the per-instance attribute. Both read the three-tier chain and pin nothing
    now.
  - The scroll area's focus ring pinned outline-offset: 2px, which is what
    --itx-focus-offset already is; the literal only stopped it following the
    system.

It also removed the library's only `!important` — see the note in
styles/components/scroll-area.css. A `scroll-behavior: auto !important` in an
UNLAYERED sheet was the highest-priority declaration Interop shipped; layered,
the flag would be worse, because important declarations invert layer order and
an important rule in interop.foundation outranks everything a consumer writes.
interop-badge            interop-slider
interop-callout          interop-slider-range
interop-progress         interop-slider-thumb
interop-scroll-area      interop-tabs
composites/terminal      interop-tab-panel

DONE — interop-listbox, interop-segmented-control, interop-code-renderer
(2026-08-17), migrated together as one conformance pass. Four things worth
carrying forward:

  - `interop-listbox` was the ViewEncapsulation.None case: already global, just
    unlayered — the worst combination, since it leaked `.interop-option` into
    every document AND outranked the whole interop layer. Removing the
    encapsulation line is the last step, not the first.
  - It was also the counter-example to "none of these files uses a SCSS
    feature": `&--active#{&}--selected` is interpolation, which native nesting
    has no equivalent for. Check before assuming.
  - `interop-segmented-control`'s structure went into the EXISTING
    `components/segment.css` rather than a new file, so the pre-existing
    `themes/protocol/components/segmented-control.css` finally faces one
    structural file instead of half of one.
  - A component must never write a shared vocabulary. That theme wrote
    `--itx-rule-color` / `--itx-rule-width` — the public pair of the global
    `[itx-rule]` utility — on the fieldset, so every `<hr itx-rule>` a consumer
    placed inside a segmented control silently took the control's divider paint.
    Aliased to `--itx-segmented-control-rule-*`, read as
    `var(--itx-segmented-control-rule-width, var(--itx-rule-width, 0))`.

DONE — interop-field-input + interop-field-textarea (2026-08-15). The pair
migrated together, as this file said they had to: they were ~90% byte-identical
and the duplication only collapses when both move. 875 lines of SCSS became one
structural file plus one theme file, and the shared surface is now typed once.
Two things worth carrying to the next component:

  - The field's control declares `itx-sink`, so tokens reading --itx-contrast-*
    could NOT all be declared on [interop-root]: a custom property substitutes
    where it is declared, so those would have resolved rank N against the PAGE
    and inherited a finished colour past the recess. Surface-relative tokens are
    declared on `interop-field-control` instead. Any component that declares a
    layer has this problem.
  - Prefix/suffix had to match the ATTRIBUTE as well as the class. The class
    only exists because the Angular directive's host adds it, so matching the
    class alone would have left the CSS-only consumer — the entire point of the
    migration — with unstyled addons.

DONE — interop-progress + the slider trio (2026-08-17). The three slider files
became ONE pair, as this file predicted they had to: interop-slider.css was
shared by two components and interop-slider-range.css re-typed the same values a
third time, and only a global sheet lets all three read one declaration. Four
things worth carrying forward:

  - `:where(…)::-webkit-slider-runnable-track` DOES reach the UA pseudo, and a
    layered zero-specificity rule reaches it identically to a plain selector.
    Verified in ChromeHeadless against a control rather than assumed, because
    the failure mode (silently dropped rule) looks exactly like "the component
    is unstyled".
  - The private `--_` slots stayed. States on this component have to reach the
    UA pseudo-elements, and those inherit custom properties from the host — the
    per-state-token pattern would need a ::-webkit- and a ::-moz- rule per
    state instead.
  - progress's theme block sat on `:where([interop-root])`, which BAKED
    `--itx-contrast-3` at the root: a contrast rank is solved against the
    current surface and re-declared at every layer boundary, so a bar inside a
    raised card kept layer 0's grey. Scoping the block to the element is the
    fix, and it is the colour-axis twin of the baked-alias bug check-shape.mjs
    catches for radius and duration. Check any theme block still on the bare
    root for this.
  - Conform, don't port. Two literal Carbon values (110ms, a cubic-bezier) had
    opted the slider out of prefers-reduced-motion entirely, and the progress
    track was one contrast rank stronger than the comment above it described.
```

## Why it matters

Three distinct consequences. The first is the obvious one, the second is the
one people forget, and the third is the one that actually inverts the contract:

1. **CSS-only consumers get nothing.** Someone writing the markup without
   importing the Angular component gets an unstyled control — which is the one
   thing the global stylesheet exists to provide, and the stated reason the
   library has no view encapsulation anywhere else.
2. **The values can't be re-themed.** A theme is a stylesheet; if the values
   aren't in one, shipping an alternative theme cannot reach them. The inline
   `var(--itx-x, <default>)` fallback chain becomes the only seam, which is
   also why these files are full of fallbacks that the foundation contract
   explicitly forbids.
3. **The injected sheet is UNLAYERED, so it outranks the whole `interop`
   layer.** Angular writes component styles into `<head>` with no `@layer`, and
   unlayered rules beat layered ones regardless of specificity. A consumer who
   correctly declares `@layer interop, …` and overrides a value on one of these
   these components **cannot reach it**. The layer exists to guarantee that
   consumers win; for these components it guarantees the opposite. This is the
   consequence that makes the debt a contract violation rather than an
   inconvenience — see `css-strategy.md`.

## The migration, per component

1. `:host` → the element/attribute selector the component actually matches
   (`interop-badge`, `progress[interop-progress]`, …), wrapped in `:where()`.
2. Layout, display, pseudo-elements, state selectors → `styles/components/X.css`.
3. Every literal → `styles/themes/protocol/components/X.css`, as a custom
   property on `:where([interop-root])`, with the inline fallback **removed**
   at the point of use.
4. Register both in `interop.css` / `protocol.css` **with their `layer()`** —
   an import without one lands unlayered and silently outranks every consumer
   stylesheet.
5. Delete `styleUrl` from the `@Component`.

## Caveats — this is not purely mechanical

- **The cascade constraint applies the moment you split.** Theme outranks
  foundation at any specificity. A value that was safely inline on the element
  becomes a state-killer the moment the theme writes it on that same element.
  See `carbon-borrow.md` § "The cascade constraint".
- **Unscoped class selectors are load-bearing.** `.interop-badge__indicator`,
  `.interop-sr-only`, `.itx-chip-remove` and friends are deliberately not
  scoped so replicated markup picks them up. Don't scope them on the way past.
- **Several of these files duplicate `.interop-sr-only` locally** (badge,
  segmented-control) precisely *because* they can't rely on the global sheet.
  Those copies delete themselves as part of the migration; until then they are
  correct, not redundant.
- **`interop-progress` is a hybrid** — it has a theme file *and* a local
  `styleUrl`, so only the structural half is still component-scoped. It is the
  cheapest win left on the list. `interop-segmented-control` was the same shape
  and is done.
- **The theme declares values ON the component, so ancestor overrides stop
  reaching them.** That is the whole point of the split, and it breaks
  consumers who were setting the token on a wrapper — the demo's
  `.demo-example__code` was setting `--itx-cr-body-padding-*` on a div around
  the renderer, and had to move to `.demo-example__code [interop-code-renderer]`.
  Grep the demo for every token you are about to declare before you declare it.
- **Wrap migrated selectors in `:where()` for zero specificity, but keep
  pseudo-elements OUTSIDE it** — `:where(section[interop-tabs])::after`, not
  `:where(section[interop-tabs]::after)`.
- **A component family moves together.** The field pair and the three slider
  files each did.
  Their shared values are currently typed twice, once per file, because two
  component stylesheets cannot share a declaration without a global sheet. The
  migration is what collapses that duplication — which also means migrating one
  half of a pair leaves the values in two places with only one of them
  authoritative.

## Worked step list — tabs, as the reference case

The generic steps above, made concrete for the smallest multi-file instance:

1. `styles/components/tabs.css` — `:host` → `section[interop-tabs]`,
   `:host([itx-orientation="vertical"])` →
   `section[interop-tabs][itx-orientation="vertical"]`, panel `:host` →
   `section[interop-tab-panel]`.
2. `themes/protocol/components/tabs.css` — move the defaults out of each
   `var()`'s fallback slot onto `:where([interop-root])`, and drop the
   fallbacks.
3. Register both in `interop.css` and `themes/protocol.css` **with their
   `layer()`** — an import without one lands unlayered and reintroduces
   consequence 3 exactly.
4. Delete `styleUrl` from both components and delete the two `.scss` files.

Step 3 is why none of this happened during the borrow rounds: it touches two
index files, which is the one guaranteed merge conflict when borrows run
concurrently.

## Sequencing

Do them one at a time, each in its own commit, verifying in the browser. This
is the kind of change where five at once produces one unattributable
regression. Badge is now the smallest remaining and the best next candidate;
`interop-segmented-control` is the other half-migrated hybrid, the same shape
progress was.

## Free win while you're in there

Every `.scss` file on this list was checked during rounds 10–14 — badge, both
field files, both tabs files — and **not one uses a single SCSS feature.** No
`@use`, no `$variables`, no mixins, no parent-selector tricks beyond `&`, which
is native CSS nesting now. They are plain CSS wearing a `.scss` extension. The
migration renames them for free.

The one thing SCSS *would* buy — a shared partial for the values the field pair
and the slider trio duplicate — is precisely what the theme file provides
instead.

## Related

- `.agent/css-strategy.md` — the contract being violated
- `.agent/workflows/carbon-borrow.md` § "Write theme values only" — why the
  borrow rounds keep bumping into this
- `.agent/components/badge.md` § "CSS architecture" — a worked description of
  one instance
