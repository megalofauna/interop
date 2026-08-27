# InteropTabs — Mental Model Card

## Files

```
src/lib/components/interop-tabs/
  public-api.ts                   barrel export
  interop-tabs-context.token.ts   INTEROP_TABS_CONTEXT + InteropTabsContext interface
  interop-tabs.ts                 the group — generates the tablist, owns keyboard + ARIA
  interop-tabs.html               tablist template + <ng-content /> for the panels
  interop-tabs.scss               ALL structure and values (see the stylesheet note below)
  interop-tab-panel.ts            one panel — render lifecycle, ARIA ids
  interop-tab-panel.html          @if (rendered()) { <ng-content /> }
  interop-tab-panel.scss          panel padding + focus ring
  interop-tab-label.directive.ts  marker directive for a rich tab label
  interop-tabs.spec.ts
  interop-tab-panel.spec.ts
```

Styles live in `styles/components/tabs.css` (structure) and
`themes/protocol/components/tabs.css` (values), both global and layered. Tabs
was the worked example for the `styleUrl` migration (`64002cda`); see
*Stylesheet debt, resolved* below for what the move fixed.

## Shape

Three directives. You write panels; the tab strip generates itself.

```html
<section interop-tabs aria-label="Station systems">
	<section interop-tab-panel label="Navigation">…</section>
	<section interop-tab-panel label="Engineering">…</section>
</section>
```

| Selector | Element | Role |
|---|---|---|
| `[interop-tabs]` | `<section>` | The group. Renders `div[role=tablist]` + one `button[role=tab]` per panel, then projects the panels below it. |
| `[interop-tab-panel]` | `<section>` | One panel. `role="tabpanel"`, `tabindex="0"`, `[hidden]` when inactive. |
| `[interop-tab-label]` | `<ng-template>` | Rich label. Beats the `label` string when both are present. |

Both `<section>` requirements are enforced by a dev-mode `console.warn`, not by
the type system.

### Panel identity

`key` seeds everything — the value `active` takes, `id` on the panel,
`aria-labelledby` on the panel, `aria-controls` on the tab. It auto-generates,
so it is optional until something else needs to refer to the panel; then it is
mandatory in practice.

### Render lifecycle — the part worth knowing

The default is **lazy once, then permanent**:

- before first visit — content is not projected. Zero DOM, zero cost.
- on first activation — rendered exactly once.
- on switch away — the host gains `hidden`. DOM intact, state preserved.
- on return — no re-render; the panel resumes from its exact state.

Two escape hatches, both on the panel: `destroyOnHide` (tear down on every
switch, for memory-sensitive content) and `preRender` (build at init, to warm
an expensive panel before it is selected).

### Driving the selection

Three ways, in order of coupling:

1. **Uncontrolled** — do nothing. The first panel is active; `(activeChange)`
   reports.
2. **Controlled** — `[(active)]="key"`. `active` is a `model()`, so it is both
   an input and an `activeChange` output.
3. **Detached** — `activationId="…"`, then
   `interopActivation.trigger(id, panelKey)` from anywhere. The payload *is*
   the key.

`resolvedActive` is the signal panels actually read. It validates the requested
key against the current panel set and falls back to the first panel, so a key
that disappears (a panel removed by `@if`) degrades instead of blanking.

### Keyboard

Arrows move, `Home`/`End` jump, roving tabindex keeps the strip to one tab
stop. `activationMode="auto"` (default) activates as focus moves;
`"manual"` moves focus only and commits on `Enter`/`Space`.

**Known bug:** arrow navigation steps from the *selected* tab, not the
*focused* one, so in `manual` mode focus cannot travel more than one tab from
the selection. See `.agent/todo/tabs-manual-mode-roving-focus.md`.

## Visual language — Carbon `line` tabs

Round 10 of the Carbon borrow (`.agent/workflows/carbon-borrow.md`). Only the
`line` flavour was taken; `contained` (filled slabs) and `icon-only` were
declined outright. The shape:

| Carbon | value | Interop |
|---|---|---|
| tab height (`layout.size('height')`, md) | 40px | `--itx-spacing-10` |
| label padding-inline (density normal) | 16px | `--itx-spacing-4` |
| label padding-block (`$spacing-03`) | 8px | `--itx-spacing-2` |
| `$body-compact-01` | 14 / 18 / 400 | `0.875rem` / `1.2857` / `400` |
| `$text-secondary` (rest label) | `#525252` | `--itx-neutral-9` |
| `$text-primary` (hover + selected label) | `#161616` | `--itx-neutral-12` |
| `$tab-underline-color` | 2px `$border-subtle` | 1px `--itx-neutral-7` |
| `$tab-underline-color-hover` | 2px `$border-strong` | 2px `--itx-neutral-10` |
| `$border-interactive` (selected bar) | blue-60 | 2px `--itx-colorway` |
| radius | none | `--itx-radius-none` |

**The one relationship that matters: selection is a bar, never a fill.** The
list carries one hairline along its block-end edge; each tab's `::after` is
positioned to overlap that hairline, so a selected tab reads as the rule
turning colorway for that span rather than as a second line stacked on one.

Deviations from the literal conversion table, both deliberate:

- **1px rest rule, not Carbon's 2px.** Every structural rule in the library is
  a 1px hairline.
- **`--itx-neutral-7`, not the `$border-subtle` → `--itx-neutral-4` mapping.**
  Neutral-4 sits ~0.10 luminance from our page surface and reads as invisible
  — that is round 7's lesson, and what `--itx-border` already gets wrong.

Declined from Carbon, each with a one-value walk-back in the stylesheet's
header comment: the `contained` flavour, icon-only tabs, disabled paint (no
`disabled` input exists to paint), scroll-overflow buttons and gradients, the
1px inter-tab margin, and `$heading-compact-01`'s 600 weight on the selected
label (it re-measures a content-width tab, and reserving the bold width needs a
hidden text twin that cannot work for the `interop-tab-label` template branch).

### Tabs vs. the segmented control

The closest neighbour — both are a horizontal row of exclusive-choice labels —
and they mean different things: tabs navigate between views, a segmented
control filters one. They **share** the type ramp (0.875rem / 1.2857 / 400) and
the hover relationship (label to full strength, nothing painted). They are kept
apart by:

| | tabs | segmented control |
|---|---|---|
| selected | 2px colorway bar in the list rule | inverted near-black filled pill |
| container | one open rule on the block-end edge | closed 1px frame, four sides |
| width | content-width tabs | equal-width segments |
| radius | none | 4px |

The hover fill (`--itx-surface-above`) is deliberately **not** taken for tabs:
a filled hover on a squared, gapless row of labels is the segmented control's
shape. `--itx-tab-background-hover` exists so that is a lever, not an omission.

### Orientation

`orientation="vertical"` had always swapped the arrow keys and set
`aria-orientation`, and had **never had a single visual rule** — a vertical
group rendered as a horizontal strip. Round 10 fixed it: the component now
reflects `itx-orientation` on the host, the list becomes a column standing
beside its panels, the rule moves to the inline-end edge, and the selected bar
follows it there. Carbon splits the two in its own vertical flavour (rule on
one edge, marker on the other) because that flavour is a `contained`
derivative; with no fill there is nothing to anchor a far-edge marker to.

## Actions in the tab strip

Content marked `[interop-tabs-actions]` projects beside the tablist instead of
falling through to the panel area:

```html
<section interop-tabs ariaLabel="Report views">
  <div interop-tabs-actions interop-toolbar label="Report actions">…</div>
  <section interop-tab-panel label="Summary">…</section>
</section>
```

**It cannot go inside the tablist, and that is ARIA, not styling** — a tablist's
owned elements must be tabs, so a toolbar in there is a spec violation. The slot
is how a toolbar sits in the strip without joining the tab sequence: arrow keys
still traverse only the tabs, and the toolbar keeps its own single tab stop.

The template is `.itx-tabs__bar` → `[tablist][slot]`. The bar carries **no role**,
which is the whole point of it existing.

Two things about the layout are load-bearing:

- **The rule stays on the tablist, not the bar.** The selected tab's `::after`
  is positioned to sit *in* the rule, so a rule owned by the bar would drift
  away from the tabs the moment an action was taller than they are. The cost is
  that the rule stops where the actions begin, which is right — it is the seam
  between the *tabs* and the panels they control.
- **The tablist is `flex: 1` with `min-inline-size: 0`.** Without the grow it
  shrinks to its tabs and the rule stops under the last one; without the min it
  refuses to shrink and shoves the actions out of the box.

The default slot swallows anything the named one misses, so a mistyped
`interop-tabs-actions` renders the toolbar in the panel area, still perfectly
functional. Dev mode names any projected child that is neither a panel nor the
bar for exactly that reason.

## `ariaLabel`, not `aria-label`

The input is `ariaLabel`. Writing `aria-label="…"` sets a plain attribute, so
the input stays null, **the tablist gets no accessible name**, and the host
`<section>` quietly becomes a named `region` landmark instead. The two spellings
look interchangeable and are not.

Six usages in the demo were written the wrong way and shipped anonymous
tablists. Dev mode now warns when neither `ariaLabel` nor `ariaLabelledBy` is
set, and says so explicitly when it finds a misplaced `aria-label` on the host.

## Token surface

All of these are read from the component stylesheets' `var()` fallback slots —
there is no theme file to override, so set them on any ancestor.

**Tablist** — `--itx-tabs-tablist-display`, `--itx-tabs-tablist-flex-wrap`,
`--itx-tabs-gap`, `--itx-tabs-rule-width`, `--itx-tabs-rule-color`

**Tab, box** — `--itx-tab-min-block-size`, `--itx-tab-gap`,
`--itx-tab-padding-block`, `--itx-tab-padding-inline`,
`--itx-tab-border-width`, `--itx-tab-border-color`, `--itx-tab-border-radius`

**Tab, type** — `--itx-tab-font-family`, `--itx-tab-font-size`,
`--itx-tab-font-weight`, `--itx-tab-line-height`, `--itx-tab-letter-spacing`

**Tab, state** — `--itx-tab-background`, `--itx-tab-foreground`,
`--itx-tab-background-hover`, `--itx-tab-foreground-hover`,
`--itx-tab-active-background`, `--itx-tab-active-foreground`,
`--itx-tab-font-weight-selected`

**Tab, indicator** — `--itx-tab-indicator-size`,
`--itx-tab-indicator-color-hover`, `--itx-tab-active-indicator-color`

**Tab, focus + motion** — `--itx-tab-focus-outline-width` / `-style` /
`-color` / `-offset`, `--itx-tab-transition-duration`

**Panel** — `--itx-tab-panel-padding-block`, `--itx-tab-panel-padding-inline`,
`--itx-tab-panel-focus-outline-width` / `-style` / `-color` / `-offset`

Type is written as **fixed rem**, never `--itx-font-size-*`: those are fluid
`clamp()` values and a label that grows with the viewport overflows a pinned
40px tab.

### Removed in round 10

Four shorthand tokens, each of which was also wrong at rest. A shorthand token
cannot be partially overridden, which is why they go:

| Was | Problem | Now |
|---|---|---|
| `--itx-tabs-border-bottom: 1px solid currentColor` | the list rule painted at full **text** strength — a near-black line under every group | `--itx-tabs-rule-width` + `--itx-tabs-rule-color` |
| `--itx-tab-font: inherit` | `font` also resets variant/stretch, and cannot say "inherit the family, pin the size" | four discrete type tokens |
| `--itx-tab-focus-outline: 2px solid currentColor` | focus ring was black, not brand | `-width` / `-style` / `-color` |
| `--itx-tab-active-indicator-height` | the bar is no longer selected-only, and it is a thickness on both axes | `--itx-tab-indicator-size` |

## Stylesheet debt, resolved (2026-08-17)

Tabs *was* styled from component `styleUrl`s, with two consequences:

1. **A CSS-only consumer got no tab styling at all** — the one thing the
   global stylesheet exists to provide.
2. **Angular injects component styles unlayered**, and unlayered rules beat
   layered ones at any specificity. A consumer who correctly declared
   `@layer interop, …` could not override tabs. That inverted the contract in
   `css-strategy.md` for exactly this component.

Both are fixed. The move also corrected three colour rungs that the port would
otherwise have carried across intact — the rule at `contrast-3` where a divider
is rank 2, hover reaching for `surface-below` (elevation used as a mark), and
the selected indicator painting `colorway-solid`, a FILL rung, on an edge.
That pattern — a mechanically faithful port preserving a category error —
is why the remaining twelve sheets were migrated as *conformance* passes.

Full migration plan: `.agent/records/styleurl-migration.md`.

## Gotchas

- The panel host carries `tabindex="0"` **unconditionally**, so it is always in
  the tab order. That is intentional (a panel whose content has nothing
  focusable must still be reachable) and it is why the panel needs its own
  visible focus ring — it had none before round 10, which was a WCAG 2.4.7
  failure for one Tab press.
- Prose does **not** leak into the tab strip: the tablist is a `div` and the
  tabs are `button`s, and `prose.css` targets neither. This is the rare
  list-shaped component that does not need `interop-typography-isolate` —
  which is just as well, since the attribute applies to the whole subtree and
  would have stripped prose from the projected panel content too.
- `--itx-radius-0` does not exist. Use `--itx-radius-none`; the other silently
  invalidates the declaration.

## Demo

`projects/demo/src/app/pages/tabs/` — usage, `[(active)]`, `activationId`,
rich labels, vertical orientation, panel lifecycle, manual activation, CSS
tokens, full API.
