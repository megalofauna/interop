# Collapsible Tree — New-Component Research

Research output for `new-component-research.md` run on the **collapsible tree**
(a nested hierarchy of rows where branches expand and collapse: file explorers,
nav sidebars, category pickers, org data). Interop ethos: native elements before
ARIA, a11y non-negotiable, minimal styling, signal-based Angular 21, light DOM,
zero-specificity CSS.

**One-line verdict:** "tree" is two components wearing one name, and every
incumbent ships only the wrong one. Interop's win is to **fork the tier
explicitly** — a native nested-list *disclosure structure* by default, a real
`role=tree` *widget* on opt-in — and then use CSS that landed in 2025–26
(`content-visibility: auto`, `::details-content`, `hidden=until-found`, `:has()`,
subgrid) to ship **a tree that stays fast, findable and in the a11y tree at
50k nodes without a virtualizer**. Every virtualized incumbent trades away
Ctrl+F, Ctrl+A and honest item counts to get that speed. We don't have to.

**Direct answer to the CSS question:** anchor positioning is now Baseline, but it
is the *wrong tool for the hierarchy* — it's for out-of-flow overlays, and a tree
is an in-flow layout problem. It earns its place in the tree's *overlays* (row
context menu, truncated-label tooltip, collapsed-rail flyout), all of which
Interop already routes through `InteropPopover`. The heavy lifting is done by
five other things. See §CSS below.

---

## CSS — what the platform can now carry

The tree's real CSS jobs, and the current best tool for each:

| Job | Tool | Baseline status |
|---|---|---|
| Leaf vs branch styling without JS classes | `:has(> ul)` | **Widely available** (Jun 2026) |
| Cross-depth column alignment (twisty / icon / label / actions) | `subgrid` | **Widely available** (Mar 2026) |
| Perf at 10k+ rows without a virtualizer | `content-visibility: auto` + `contain-intrinsic-size` | **Newly available** (Sep 2025) |
| JS-free open/close animation incl. height | `::details-content` + `transition-behavior: allow-discrete` | **Newly available** (Sep 2025) |
| …the height-to-`auto` half of that | `interpolate-size` / `calc-size()` | **Not Baseline** — Chrome-led, gate behind `@supports` |
| Find-in-page into *collapsed* branches | `hidden="until-found"` + `beforematch` | **Not Baseline** — Safari blocking as of Feb 2026; pure progressive enhancement |
| Entry animation of newly-revealed rows | `@starting-style` | **Newly available** (2024) |
| Indent driven by the a11y attribute itself | `attr(aria-level type(<number>))` | **Not Baseline** — Chrome 133+; ship a `--itx-tree-level` custom property today, one-line swap later |
| Overlays anchored to a row | anchor positioning | **Baseline 2026** (Firefox 147 completed the set, Jan 2026) |

### 1. Indentation, and why nesting-padding is a trap

The reflex is `ul ul { padding-inline-start: 1rem }`. That is why so many trees
can't do the Finder/VS Code look: the row's hover/selection background starts at
the indent, so the highlight can't bleed to the container's full width.

Correct shape: nested `<ul>` carries the **semantics** and has zero padding;
indentation is `padding-inline-start` on the *row content*, driven by depth.
Depth is already computed — the component must emit `aria-level` for AT anyway.
So the accessibility attribute becomes the layout input:

```css
:where(li[interop-tree-item]) > :where(.interop-tree__row) {
  padding-inline-start: calc(var(--itx-tree-level, 1) * var(--itx-tree-indent));
}
/* Future, one-line swap — no style binding at all:
   padding-inline-start: calc(attr(aria-level type(<number>), 1) * var(--itx-tree-indent)); */
```

There is **no pure-CSS depth counter**. `--depth: calc(var(--depth) + 1)` looks
like it should read the inherited value; it does not. CSS Variables L1 treats a
custom property referencing itself as a dependency cycle regardless of
inheritance, so it goes invalid at computed-value time. Don't chase it — bind the
number once, in the same place you bind `aria-level`.

### 2. Guide lines — and the honest verdict on anchor positioning

`:has()` retires the `data-leaf` / `data-branch` attribute bookkeeping every
incumbent ships:

```css
:where(li[interop-tree-item]:has(> ul))     { /* branch */ }
:where(li[interop-tree-item]:not(:has(ul))) { /* leaf   */ }
```

The remaining hard part is the classic "the rail must stop at the last child's
centre, not run past it." You **can** solve it with anchor positioning:
`anchor-name` the parent's toggle and the last child's row, then stretch one
absolutely-positioned line between them with `anchor()` on both `top` and
`bottom`. It works and it is Baseline now.

**Recommend against it.** It forces the rail out of flow, and an out-of-flow
anchored element inside a scrolling tree lands squarely in the
anchor-in-a-scroll-clipping-ancestor trap — the exact class of bug that makes
anchored positioning flaky in scroll containers. The in-flow answer (a
`border-inline-start` on the group plus a per-item elbow `::before`, with
`:last-child` masking the overhang) is baseline, scroll-safe, and cheaper.

Keep anchor positioning for the tree's overlays. That's where it's the right
tool, and Interop already has `InteropPopover` + `INTEROP_POSITION_STRATEGY`
owning that seam.

### 3. Expand/collapse animation without a measurement pass

`::details-content` is Baseline newly available (Sep 2025) and is the whole
answer *if* the disclosure is a real `<details>`:

```css
:where(details[interop-tree-item])::details-content {
  opacity: 0;
  block-size: 0;
  overflow: clip;
  transition: opacity 200ms, block-size 200ms, content-visibility 200ms allow-discrete;
}
:where(details[interop-tree-item][open])::details-content { opacity: 1; }

@supports (interpolate-size: allow-keywords) {
  :where([interop-root]) { interpolate-size: allow-keywords; }
  :where(details[interop-tree-item][open])::details-content { block-size: auto; }
}
```

`interpolate-size`/`calc-size()` are **not** Baseline (MDN is explicit: "not
Baseline because it does not work in some of the most widely-used browsers"), so
the height half is gated. The opacity/`content-visibility` half works today
across all three engines. Either way there is **no JS measurement path** — which
deletes the entire bug class that Material-style trees hit by keying state off
`transitionend` filtered by property name.

Note the coupling: this only applies in the `<details>` variant. See §1 —
`<details>` is a genuine third host option, not a footnote.

### 4. Performance — `content-visibility: auto` instead of a virtualizer

This is the sleeper, and it's the differentiator's foundation.

```css
:where(li[interop-tree-item]) {
  content-visibility: auto;
  contain-intrinsic-size: auto var(--itx-tree-row-block-size);
}
```

Off-screen subtrees stop being laid out and painted, giving virtual-scroll-class
rendering wins — web.dev measured ~7× on initial render for chunked content —
but unlike a JS virtualizer the content **stays in the DOM, stays in the
accessibility tree, and stays findable by find-in-page**. Every incumbent that
reaches for `cdk-virtual-scroll` or `@rc-component/virtual-list` gives up all
three, and then has to fake `aria-setsize`/`aria-posinset` to paper over the
hole.

### 5. Findability — `hidden="until-found"`

Collapsed branches marked `hidden="until-found"` are searchable by Ctrl+F; the
browser reveals them and fires `beforematch`, which the component listens to in
order to sync its `expanded` signal. Not Baseline — Chrome 102, Firefox 139
(May 2025), Safari still outstanding as of Feb 2026 — but it degrades to plain
`hidden` with zero downside, so it is a free progressive enhancement.

The `<details>` variant gets this behaviour natively: Chrome auto-expands
`<details>` on find-in-page and on fragment navigation.

### 6. Subgrid — and its collision with nested semantics

`subgrid` (Widely available, Mar 2026) is the only real answer to "align the
twisty, icon, label and trailing actions into true columns across every depth."
Declare the columns once on the tree root; every row is
`display: grid; grid-template-columns: subgrid`.

**The catch, stated honestly:** subgrid requires the row to be a grid *item of
the root grid*. With nested `<ul>`/`<li>` it isn't — you'd need `display:
contents` on the intermediate elements to flatten them, and those elements carry
`role="group"` / `role="treeitem"`. Engines have largely fixed the
`display: contents` semantics-removal bug, but betting a11y on that fix is not
an Interop-shaped bet.

So: **subgrid is free in flat-DOM mode and expensive in nested mode.** In nested
mode, get ~90% of the alignment from a shared `--itx-tree-gutter` and
token-sized columns. This is one more consequence of the flat-vs-nested fork,
which is §1's central decision.

---

## 1. Semantic Correctness & Accessibility

### The fork nobody ships

`role="tree"` is a **behaviour contract**: one tab stop for the whole widget,
roving tabindex, typeahead, arrow keys that expand/collapse, and a selection
model. Most things people call a "tree" — docs sidebars, nav menus, file
browsers where clicking navigates — honour none of it. Signing that contract and
then not honouring it is worse than not signing it.

The rule, per Roselli and GitHub's own write-up: **`role="tree"` is for when the
user operates on the hierarchy itself** (select, check, expand, move nodes).
Links that navigate want a nested list of links with disclosure buttons — a
pattern that is battle-tested, works without JavaScript, and matches what screen
reader users expect.

Three viable hosts, and Interop should ship the first two:

| Tier | Host | Role | Tab stops | When |
|---|---|---|---|---|
| **A — default** | `ul` / `li` / `a` + `button[aria-expanded]` | none (native list) | many | Nav sidebars, docs TOC, browse-and-click file lists |
| **B — opt-in** | `ul[role=tree]` / `li[role=treeitem]` / `ul[role=group]` | `tree` | one (roving) | Select / check / reorder nodes |
| **C — no-JS** | nested `details` / `summary` | `group` + `button` | many | Static content, prose docs, zero-JS pages |

Naming per the playbook's identity/config split (variant is definitional, so it
rides the identity attribute):

```html
<ul interop-tree>          <!-- Tier A: disclosure navigation, the default -->
<ul interop-tree="select"> <!-- Tier B: real treeview widget -->
```

Tier C is the same directives applied to `details`/`summary` hosts — it's what
unlocks the `::details-content` animation and native find-in-page, and it is the
right answer for the docs site itself.

**Why not `<details>` everywhere?** `<summary>` has implicit `role="button"`, and
`<details>` is not a list. You lose list semantics and item counts, and
overriding `<summary>` with `role="treeitem"` is exactly the kind of native-
semantics override that breaks in VoiceOver. Fine as Tier C, wrong as the base.

### ARIA matrix

**Tier A (default).** No tree roles at all. Nested `<ul>`/`<li>`. The twisty is a
real `<button>` with `aria-expanded` and `aria-controls` pointing at the child
`<ul>`'s id. The current page is `aria-current="page"` on the `<a>` — *not*
`aria-selected`. Wrap in `<nav aria-label>` when it is site navigation.

**Tier B (opt-in).**
- **tree:** `role=tree`; `aria-label`/`-labelledby` **required**;
  `aria-multiselectable=true` when multi-select.
- **treeitem:** `role=treeitem`; `aria-expanded` on branch nodes **only** (never
  on leaves — a leaf with `aria-expanded=false` is announced as a collapsed
  branch); `aria-selected` *or* `aria-checked`, consistently, never both;
  `aria-level` **always** (see divergence); `aria-labelledby` → the row's text
  node id (see divergence); `aria-disabled` where applicable.
- **group:** `role=group` on the nested `<ul>`.
- `aria-setsize` / `aria-posinset`: emit **only** in flat-DOM / virtualized mode,
  where APG genuinely requires them.
- Never `aria-owns`. Never `aria-hidden` on a collapsed branch — use `hidden`
  (which the `until-found` enhancement extends) or `inert`.

### Keyboard model

Tier A: **none authored.** Native tab order, Enter on links, Enter/Space on
disclosure buttons. That's the point of Tier A — no key handler to fight, no
`preventDefault` to get wrong.

Tier B, per [APG treeview](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):

| Key | Action |
|---|---|
| `→` | Closed node → open it, focus stays. Open node → focus first child. End node → nothing. |
| `←` | Open node → close it. Child/end node → focus parent. Root end node → nothing. |
| `↓` / `↑` | Move focus to next/previous *visible* node. Never expands or collapses. |
| `Home` / `End` | First / last visible node. |
| `Enter` | Activate the node (open/close, or select in single-select trees). |
| `Space` | Multi-select only: toggle selection. |
| `Shift`+`↑`/`↓` | Multi-select: extend selection. |
| Typeahead | Focus next node whose label starts with the typed buffer. |
| `*` (optional) | Expand all siblings at the current level. |

**RTL:** `→`/`←` swap meaning. Resolve against computed `direction`, not
hardcoded.

### Focus management

- **Roving tabindex, not `aria-activedescendant`.** GitHub tested both and
  shipped roving because `aria-activedescendant` had VoiceOver bugs on macOS and
  iOS. Follow that.
- No focus trap — a tree is not modal.
- Focused node scrolls into view with `element.scrollTo()` computed from
  `getBoundingClientRect()`, per the playbook — never `scrollIntoView()`, which
  walks scrollable ancestors and drags the page.
- Collapsing a branch that contains DOM focus must move focus to the branch's
  toggle **before** the subtree is hidden, or focus falls to `<body>`.
- Focus survives filter/expand-all: track the focused node by **key**, not by
  index or element reference.
- `:focus-visible` CSS pseudo-class on the toggle button and row (buttons, per
  `feedback_focus_visible.md`).

### Name, description, devMode

- Tier B tree **requires** an accessible name → devMode warning when neither
  `aria-label` nor `aria-labelledby` resolves.
- Treeitem name comes from `aria-labelledby` → the row's text-node id. This is
  an AT-reality concession, not spec letter: content-derived naming is correct
  per AccName, but VoiceOver needed the explicit pointer.

### Visual / sensory

- **Reduced motion:** disable the expand transition and twisty rotation
  entirely; never merely shorten them. The `@supports (interpolate-size)` block
  nests inside the non-reduced-motion branch.
- **Forced colors:** guide rails must use system colour keywords (`CanvasText`,
  `Highlight`, `HighlightText`) or they vanish. The twisty must not be a
  background-image. Semantic `<ul>`/`<li>` is itself a forced-colors asset —
  Forced Color Mode heuristics recognise native elements without extra CSS.
- **RTL:** logical properties throughout; the twisty glyph mirrors.
- **Touch:** the toggle button must hit 24×24 CSS px minimum (WCAG 2.2 SC
  2.5.8), which means the twisty's *hit area* is decoupled from its glyph size.
- **Reflow:** a deeply-indented tree at 400% zoom overflows fast. Indent must be
  a token so it can be clamped or zeroed at narrow container widths — a
  `@container` rule, not a media query.

### Form participation

**Neither CVA nor FACE on the tree itself by default.** A nav tree is not a form
control.

Two additions where it *is*:

1. **Selection variant → `ControlValueAccessor`**, binding an array of selected
   node keys. Angular forms only; no FACE (a tree's value is not meaningfully
   URL-encodable and native form submission of a hierarchy has no convention).
2. **Checkbox trees → real `<input type="checkbox">`, not `aria-checked`.**
   Native gives free form participation and free tri-state via the
   `indeterminate` *property*. **But only in Tier A.** In Tier B, interactive
   descendants inside a `treeitem` are hostile to the composite-widget contract —
   that is precisely Material's
   [#22419](https://github.com/angular/components/issues/22419). Tier B uses
   `aria-checked="mixed"` on the treeitem.

That the checkbox decision *falls out of the tier* rather than being a trap the
consumer discovers in an audit is a good sign the fork is cutting at a real
joint.

### Divergence — where the camps disagree

1. **`aria-level` / `setsize` / `posinset`.** APG: optional, required only when
   the complete set isn't in the DOM. GitHub: shipped `aria-level` unconditionally
   because screen readers could not reliably infer depth from nested groups, and
   skipped setsize/posinset. **Interop follows GitHub** — always `aria-level`;
   setsize/posinset only in flat/virtualized mode.
2. **Selection state in a nav tree.** APG's tree assumes `aria-selected`. Nav
   wants `aria-current="page"`. **Resolved by the tier fork** — this disagreement
   is only irreconcilable if you force one role onto both jobs, which is the
   root incumbent error.
3. **Where `aria-expanded` lives.** APG puts it on the `treeitem`. Roselli's
   link-plus-disclosure pattern puts it on a separate button beside the link,
   because in a nav tree the row's primary action is *navigate*, not *expand*.
   **Interop: Tier B on the treeitem, Tier A on the button.** Same fork again.
4. **Roving vs `aria-activedescendant`.** Spec permits both; APG is neutral; AT
   reality is not. **Roving.**
5. **Name from content vs `aria-labelledby`.** AccName says content suffices.
   VoiceOver disagreed for GitHub. **Explicit `aria-labelledby`**, accepting the
   id-generation cost.
6. **`<details>` as a treeitem.** Some CSS-only tree guides put `role="treeitem"`
   on `<summary>`. **Decline** — overriding `<summary>`'s native button role is a
   documented source of state-announcement loss.

---

## 2. Pain Points in Existing Implementations

### Angular Material `mat-tree` — critical review

#### What it gets right

- Clean **CDK/Material split**: `cdk-tree` is usable without Material's visuals.
- `levelAccessor` acknowledges that **real data is often already flat** — a
  concession most libraries never make.
- **`TreeKeyManager`** centralises the keyboard model instead of leaving it to
  each consumer ([#29062](https://github.com/angular/components/pull/29062)).
- `trackBy` on the tree, matching `ngFor` semantics, for stable re-render.
- `(activation)` output separates "keyboard-activated a node" from "toggled it."
- `[matTreeNodeToggleRecursive]` ships expand-all-descendants as a first-class
  input rather than a recipe.
- A genuine, documented a11y migration — they treated the old tree as broken and
  said so.

#### What it gets wrong

**1. One role for two jobs.** `mat-tree` applies `role="tree"` to everything,
including nav trees that honour none of the tree contract. Downstream of that
choice: `matTreeNodeToggle` is a `<button>` *inside* a `treeitem`, which is the
interactive-content-inside-composite-widget trap —
[#22419](https://github.com/angular/components/issues/22419), "MatTree with
interactive elements in each row is not keyboard accessible using a
screenreader." The bug isn't the button; it's that the row was declared a
treeitem in the first place.

**2. Three generations of API in one component.** `TreeControl` /
`FlatTreeControl` / `NestedTreeControl` are all deprecated in favour of
`levelAccessor` **or** `childrenAccessor` — pick exactly one, and picking wrong
is silent. Worse, the new accessors flipped the default: nodes are
**non-expandable unless `isExpandable` is set**, the inverse of TreeControl
behaviour ([#29062](https://github.com/angular/components/pull/29062)). The
canonical example still needs two `matTreeNodeDef` templates with a `when`
predicate, duplicating the row markup for leaf and branch — duplication that
exists only because the API can't express "same row, plus a toggle if it has
children."

**3. Expansion state lives in your data source.** In flat mode the data source
must respond to expand/collapse by splicing nodes into and out of the emitted
array — index juggling the consumer owns and gets wrong. In nested mode, adding a
child to an existing parent simply doesn't update the view
([#11381](https://github.com/angular/components/issues/11381)); the workaround is
resetting the whole datasource. Consumers arrive with an array; the component
demands an RxJS `DataSource` with `connect()`.

**4. Keyboard is all-or-nothing.** `TreeKeyManager` cannot be disabled, so
consumer key handling collides with it
([#31357](https://github.com/angular/components/issues/31357)). Before it landed,
there was no APG keyboard model at all
([#13018](https://github.com/angular/components/issues/13018)), and NVDA's
browse-mode interaction disabled tab / arrow navigation outright
([#13635](https://github.com/angular/components/issues/13635)).

**5. No virtualization.** "Integrate virtual scroll with relevant existing
components," including tree, has been open since 2018
([#10122](https://github.com/angular/components/issues/10122)). The tree is the
component that needs it most. And where drag-drop and virtual scroll *are*
combined elsewhere in the CDK, they interfere
([#19003](https://github.com/angular/components/issues/19003)).

**6. Customization walls.** `matTreeNodeOutlet` fixes intermediate DOM the
consumer cannot restructure; theming is SCSS mixins, which is where `::ng-deep`
comes from.

**Bottom line.** Material's tree is a *data-source engine that happens to render
a tree*, when consumers want a *rendering-and-interaction primitive over data
they already hold*. And it answers "what role is this?" once, globally, for two
different jobs. Interop should invert both: own interaction and semantics, own
nothing about where the data came from, and make the role a per-instance
decision.

### Across the wider field

- **MUI X TreeView** — drag & drop is a **paid Pro feature**
  ([#9686](https://github.com/mui/mui-x/issues/9686),
  [#10231](https://github.com/mui/mui-x/issues/10231)), and its own design review
  flags drag lag and scroll problems
  ([#14129](https://github.com/mui/mui-x/issues/14129)). A core hierarchy
  operation is behind a paywall in the largest React DS.
- **shadcn/ui** — has no tree at all; requested repeatedly
  ([#4642](https://github.com/shadcn-ui/ui/issues/4642), following #1875 and
  #355). The React ecosystem's default component catalog declines the component
  outright.
- **Ant Design** — `filterTreeNode` "doesn't work as expected"
  ([#27197](https://github.com/ant-design/ant-design/issues/27197)); drag is
  aborted by autoscroll
  ([#31057](https://github.com/ant-design/ant-design/issues/31057)).
- **PrimeNG** — filtering doesn't fire `onNodeExpand` for auto-expanded matches
  ([#8518](https://github.com/primefaces/primeng/issues/8518)); "expand search
  result" filed separately
  ([#7417](https://github.com/primefaces/primeng/issues/7417)).
- **The recurring workaround** — every ecosystem's answer to "filter my tree" is
  the same StackOverflow-shaped snippet: walk the data, collect matching keys,
  push their ancestors into `expandedKeys`. When a community re-implements the
  same 20 lines in five libraries, that's a missing primitive.
- **The strongest signal of all** — `react-complex-tree` was rewritten as
  **`@headless-tree/core`**, framework-agnostic, with the React binding reduced
  to ~50 LOC. Someone who shipped a successful tree library concluded the
  valuable part is the *state machine*, not the rendering, and that it should not
  live inside a framework. Every point in that conclusion is one Interop already
  holds ([`project_angular_waystation`](../../memory)).

### The a11y failure that recurs everywhere

Drag-and-drop reordering. Across MUI, Ant, Clarity and the CDK the same shape
repeats: pointer-drag ships, keyboard-move doesn't, and screen reader users get
no pickup/move/drop feedback. That's a straight WCAG 2.1.1 failure and, since
2.2, a
[2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
failure too.

---

## 3. The Single Most-Requested Feature

**Drag-and-drop node reordering.** Filed and upvoted across every major
ecosystem: MUI X ([#9686](https://github.com/mui/mui-x/issues/9686),
[#10231](https://github.com/mui/mui-x/issues/10231),
[#14129](https://github.com/mui/mui-x/issues/14129)), shadcn/ui
([#4642](https://github.com/shadcn-ui/ui/issues/4642), the third such request),
Angular ([#10122](https://github.com/angular/components/issues/10122)), VMware
Clarity ([#1821](https://github.com/vmware/clarity/issues/1821)), Ant Design
([#31057](https://github.com/ant-design/ant-design/issues/31057)). It is the
banner feature of `@headless-tree/core` and the reason `react-sortable-tree`
exists as a standalone package. It is *paywalled* in MUI X — the clearest
possible market signal.

Runner-up, close behind: **filter/search that reveals matching branches**
(Ant [#27197](https://github.com/ant-design/ant-design/issues/27197), PrimeNG
[#7417](https://github.com/primefaces/primeng/issues/7417) /
[#8518](https://github.com/primefaces/primeng/issues/8518), plus the ubiquitous
`expandedKeys` workaround).

**Interop's position: ship the primitive, invert the priority.**

Interop should not make pointer-drag the headline, for two reasons. First, it's
orthogonal — reordering is a `cdk-drag-drop`-shaped concern that happens to be
pointed at a tree, and building it in couples the tree to a gesture system.
Second, and decisively: **every shipped implementation of it is inaccessible**,
so "we shipped tree DnD" would mean shipping the industry's worst a11y record
into a library whose premise is the opposite.

What Interop ships instead is the thing pointer-drag is a *skin over*: a
**keyboard-first move model** — mark node(s), then move via
`Ctrl/Cmd+X` → `Ctrl/Cmd+V`, or a "Move to…" action, with a live-region
announcement at pickup, at each candidate drop target, and at drop. Pointer drag
then becomes a thin adapter over that same model rather than a parallel
implementation. That satisfies SC 2.5.7 by construction (the non-drag path is the
*primary* path, not the fallback) and makes Interop the only library where the
most-requested tree feature is accessible.

Filtering-with-reveal is cheap once the tree owns expansion state and ships
in v1.

---

## 4. Killer Differentiator

> **A tree that is fast at scale without a virtualizer — so its collapsed
> branches are still findable by Ctrl+F, still in the accessibility tree, and
> still selectable by Ctrl+A.**

Every incumbent that made trees fast did it by deleting nodes from the DOM. That
purchase has a price they all pay and none advertise: find-in-page misses
everything off-screen, Ctrl+A copies a window instead of a tree, screen reader
item counts become a fiction maintained by hand-authored
`aria-setsize`/`aria-posinset`, and browser-native features like fragment
navigation stop reaching most of the document.

Interop doesn't pay it, because the platform stopped charging in 2025:

- `content-visibility: auto` + `contain-intrinsic-size` skips layout and paint
  for off-screen subtrees while **keeping them in the DOM and the a11y tree**.
- `hidden="until-found"` + `beforematch` makes *collapsed* branches findable,
  with the component syncing its `expanded` signal from the browser's own reveal.
- Nested `<ul>`/`<li>` means item counts are computed by the browser, correctly,
  for free — no setsize/posinset bookkeeping to get wrong.

The demo writes itself: a large, mostly-collapsed tree. Ctrl+F a leaf buried
several levels down. The browser finds it, expands the path, and scrolls to it —
and the component's state signal is already correct. Nothing else in the Angular
ecosystem does that.

**Correction after building it (2026-08-04).** The shipped demo is ~3,300 nodes,
not the 50,000 first sketched here. `content-visibility` skips *layout and
paint*, not Angular's component instantiation — one directive instance per node
is still created up front, and that is the binding cost. The trade is therefore
narrower than stated: a virtualizer wins on instantiation and loses find-in-page,
Ctrl+A and honest item counts; keeping the DOM wins the reverse, and is the
better trade into the low thousands. Past that the answer is lazy `@if` branches
plus `[expandable]`, not a bigger claim.

**The premise it rests on** (worth naming, since it's the part that generalises):
`role="tree"` is opt-in, not the default. `interop-tree` is a native nested-list
disclosure structure; `interop-tree="select"` is a real treeview widget. Every
incumbent forces one role onto both jobs, and pays for it in every audit.

Both differentiators are pure structure — no runtime, no gesture layer, no
virtualizer dependency. They're available precisely *because* Interop went
light-DOM and native-first.

---

## 5. Summary & Implementation Plan

### Decision summary

1. **Two tiers, one component family.** `interop-tree` = nested-list disclosure
   navigation (default, no tree roles, multiple tab stops).
   `interop-tree="select"` = `role=tree` widget (roving tabindex, typeahead,
   arrow expand/collapse, selection). `<details>`-hosted Tier C for zero-JS.
2. **Nested `<ul>`/`<li>` DOM, not flat.** Correct list semantics, free item
   counts, forced-colors resilience, sticky-ancestor support. Accept losing
   subgrid alignment; a flat mode can land later behind the same directives if a
   consumer genuinely needs virtualization.
3. **`aria-level` always; setsize/posinset only in flat mode.** Follows GitHub's
   AT findings over APG's letter.
4. **Roving tabindex, never `aria-activedescendant`.**
5. **No virtualizer.** `content-visibility: auto` + `contain-intrinsic-size`.
6. **`hidden="until-found"` + `beforematch`** on collapsed groups.
7. **Expansion state owned by the component**, exposed as signals, keyed by node
   key. Never delegated to a data source. Never index-based.
8. **Checkboxes are native `<input>` in Tier A, `aria-checked` in Tier B.**
9. **Keyboard-first move model**; pointer drag is an optional adapter, not v1.
10. **Data-agnostic.** Declarative markup first; a data-driven mode composes
    `InteropCollection` and stays optional.

### Component tree

Directives on native elements — no wrapper components, per the playbook.

```html
<nav aria-label="Files">                          <!-- consumer-owned, Tier A -->
  <ul interop-tree>                               <!-- ul[interop-tree] -->
    <li interop-tree-item>                        <!-- li[interop-tree-item] -->
      <span class="interop-tree__row">            <!-- the full-bleed row -->
        <button interop-tree-toggle></button>     <!-- aria-expanded + aria-controls -->
        <interop-icon name="folder" />
        <a href="/src">src</a>
      </span>
      <ul interop-tree-group>                     <!-- role=group in Tier B -->
        <li interop-tree-item>…</li>
      </ul>
    </li>
  </ul>
</nav>
```

| Directive | Host | Owns |
|---|---|---|
| `ul[interop-tree]` | `<ul>` | Registry, tier, roving tabindex, typeahead, selection model, container query root, `provideInteropIcons` for the default twisty |
| `li[interop-tree-item]` | `<li>` | `aria-level`, expanded signal, `--itx-tree-level`, `content-visibility`, key registration |
| `button[interop-tree-toggle]` | `<button>` | `aria-expanded`, `aria-controls`, activation via `InteropActivation` (reentrancy guard for async child loading) |
| `ul[interop-tree-group]` | `<ul>` | `role=group` (Tier B), `hidden`/`until-found`, id for `aria-controls` |
| `interop-tree-filter` (later) | directive | Predicate in, reveal-matching-ancestors out |

### Angular architecture

- `INTEROP_TREE` injection token; `ul[interop-tree]` provides itself via
  `useExisting`. Items inject optionally and walk up for depth.
- All state as signals: `expandedKeys`, `selectedKeys`, `focusedKey`,
  `typeaheadBuffer`. Depth is `computed()` from the injected parent chain — never
  manually synced.
- `InteropActivation` on the toggle: async child loading makes double-fire a real
  bug, which is exactly the guardrail's purpose.
- `InteropAttribute` for the ARIA presets, one preset per tier.
- `InteropCollection` only in the optional data-driven mode.
- CVA on `ul[interop-tree="select"]` only, binding selected keys.
- **Portability note** ([`project_angular_waystation`](../../memory)): the
  directive-on-native-element shape ports to custom elements almost directly. A
  recursive-`ng-template` data mode would not — keep it optional and clearly
  quarantined.

### CSS plan

Structural (`styles/components/tree.css`) owns: grid/flex row layout, indent
`calc()`, `content-visibility`, guide-rail pseudo-elements, twisty rotation,
`:focus-visible`, `:has()` branch/leaf rules, `@container` indent clamping,
`@media (prefers-reduced-motion)` and `(forced-colors)` trailers, the
`@supports (interpolate-size)` block.

Theme (`themes/protocol/components/tree.css`) — custom properties only:

```
--itx-tree-indent               --itx-tree-row-block-size
--itx-tree-row-gap              --itx-tree-row-padding-inline
--itx-tree-row-radius           --itx-tree-row-background
--itx-tree-row-background-hover --itx-tree-row-background-selected
--itx-tree-row-background-current
--itx-tree-row-color            --itx-tree-row-color-hover / -selected / -current
--itx-tree-guide-color          --itx-tree-guide-width
--itx-tree-toggle-size          --itx-tree-toggle-color / -hover
--itx-tree-toggle-hit-area      (≥24px, decoupled from glyph)
--itx-tree-focus-color / -width / -offset
--itx-tree-transition-duration
```

Every state token falls back to base per `css-strategy.md`. Add both imports to
`interop.css` and `protocol.css` — neither is auto-discovered.

### devMode warnings

1. `interop-tree="select"` with no computable accessible name.
2. `interop-tree-toggle` whose `aria-controls` target doesn't resolve.
3. `interop-tree-item` with `aria-expanded` but no `interop-tree-group` child
   (a leaf announced as a collapsed branch).
4. **Interactive descendants inside a Tier B row** — `<a href>`, `<input>`,
   `<button>` other than the toggle. This is Material
   [#22419](https://github.com/angular/components/issues/22419) caught at dev
   time, with the message pointing at Tier A.
5. `<a href>` rows inside `interop-tree="select"` — navigation semantics inside a
   selection widget.
6. Duplicate node keys (breaks focus-survives-filter and expansion state).
7. `interop-tree-item` with no `interop-tree` ancestor.
8. Flat mode without `aria-setsize`/`aria-posinset`.

### Demo page — `projects/demo/src/app/pages/tree/`

Golden path first, then the edges:

1. **Nav sidebar** (Tier A) — the default, with `aria-current="page"`. The
   "you probably want this one" example.
2. **File picker** (Tier B) — `role=tree`, roving focus, typeahead, single
   select. Full keyboard table beside it.
3. **Checkbox tree** — native `<input>` + `indeterminate` tri-state, inside a
   `<form>`, showing the submitted `FormData`.
4. **Zero-JS tree** (Tier C) — nested `<details>`, `::details-content`
   animation, live `@supports` readout of what the current browser is doing.
5. **50,000 nodes** — the differentiator demo. Ctrl+F prompt in the page,
   `content-visibility` on, no virtualizer, with a rendering-time readout.
6. **Filter with reveal** — type to filter; matching branches expand, ancestors
   persist, focus survives.
7. **Async children** — lazy load on expand, with `aria-busy`, a live-region
   announcement, and the `InteropActivation` reentrancy guard visible.
8. **Explainer disclosure** — "Do I want `interop-tree` or
   `interop-tree='select'`?" as an expansion-panel whose summary is the question,
   per `project_disambiguation_notes`. This component has >1 lever for one
   outcome, so this is required, not optional.

### Open questions

1. **Tier default.** Is `interop-tree` (bare) Tier A, with `="select"` opting
   into the widget — or should the tier be a required, explicit choice with no
   default, forcing consumers to think? The former is friendlier; the latter is
   more Interop.
2. **Expansion state ownership.** Uncontrolled (component owns `expandedKeys`,
   emits changes) vs controlled (`[expandedKeys]` + `(expandedKeysChange)`) vs
   both via a two-way `model()`. `model()` is the modern Angular answer; confirm
   before wiring.
3. **Node keys.** Require the consumer to supply a `key` per item, or derive one?
   Derived keys break under reorder; required keys are one more thing to author
   in the declarative form. Leaning: required in data mode, auto-generated in
   declarative mode.
4. **Guide rails on by default?** VS Code ships them off, Finder has none, most
   docs sidebars use them. Default on (`--itx-tree-guide-width: 0` to disable) or
   default off?
5. **Does Tier C need its own directives**, or do the same directives detect a
   `<details>` host and adapt? Same-directive is more elegant; two hosts with
   different implicit roles inside one directive is where subtle bugs live.
6. **Scope of v1.** Does the keyboard move model (§3) land in v1, or does v1 ship
   navigation + selection + filter and the move model follow? It's the
   differentiating a11y story but it's also the largest single piece.

---

## Sources

**Spec & pattern**
- [ARIA APG — Tree View pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)
- [MDN — `treeitem` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/treeitem_role)
- [WCAG 2.2 — Understanding SC 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)

**Practitioner guidance**
- [GitHub Blog — Considerations for making a tree view component accessible](https://github.blog/engineering/user-experience/considerations-for-making-a-tree-view-component-accessible/)
- [Primer — TreeView accessibility](https://primer.style/product/components/tree-view/accessibility/)
- [Adrian Roselli — Link + Disclosure Widget Navigation](https://adrianroselli.com/2019/06/link-disclosure-widget-navigation.html)
- [Adrian Roselli — Disclosure Widgets](https://adrianroselli.com/2020/05/disclosure-widgets.html)
- [Scott O'Hara — The details and summary elements, again](https://www.scottohara.me/blog/2022/09/12/details-summary.html)
- [Kate Rose Morley — Tree views in CSS](https://iamkate.com/code/tree-views/)

**Platform / CSS**
- [web.dev — `content-visibility` is now Baseline Newly available](https://web.dev/blog/css-content-visibility-baseline)
- [web.dev — `content-visibility`](https://web.dev/articles/content-visibility)
- [MDN — `::details-content`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::details-content)
- [MDN — `interpolate-size`](https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size)
- [MDN — `calc-size()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/calc-size)
- [Chrome for Developers — Making collapsed content accessible with `hidden=until-found`](https://developer.chrome.com/docs/css-ui/hidden-until-found)
- [MDN — `beforematch` event](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforematch_event)
- [web-features explorer — `hidden="until-found"`](https://web-platform-dx.github.io/web-features-explorer/features/hidden-until-found/)
- [web-features explorer — subgrid](https://web-platform-dx.github.io/web-features-explorer/features/subgrid/)
- [web.dev — March 2026 Baseline digest](https://web.dev/blog/baseline-digest-mar-2026)
- [MDN — `position-anchor`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-anchor)
- [OddBird — Anchor Positioning updates, Fall 2025](https://www.oddbird.net/2025/10/13/anchor-position-area-update/)
- [Chrome for Developers — CSS `attr()` gets an upgrade](https://developer.chrome.com/blog/advanced-attr)

**Incumbents**
- [angular/components #29062 — levelAccessor, childrenAccessor, TreeKeyManager](https://github.com/angular/components/pull/29062)
- [angular/components #22419 — MatTree with interactive elements not keyboard accessible](https://github.com/angular/components/issues/22419)
- [angular/components #13018 — mat-tree keyboard interaction per WAI-ARIA](https://github.com/angular/components/issues/13018)
- [angular/components #13635 — NVDA disables keyboard navigation in mat-tree](https://github.com/angular/components/issues/13635)
- [angular/components #31357 — no way to prevent keyboard navigation](https://github.com/angular/components/issues/31357)
- [angular/components #11381 — nested tree doesn't update when adding a child](https://github.com/angular/components/issues/11381)
- [angular/components #10122 — integrate virtual scroll with existing components](https://github.com/angular/components/issues/10122)
- [angular/components #19003 — drag-drop + virtual scroll position loss](https://github.com/angular/components/issues/19003)
- [Angular Material — tree.md source](https://github.com/angular/components/blob/main/src/cdk/tree/tree.md)
- [mui-x #9686 — add drag & drop support (Pro)](https://github.com/mui/mui-x/issues/9686)
- [mui-x #10231 — TreeView Drag Drop](https://github.com/mui/mui-x/issues/10231)
- [mui-x #14129 — Drag & Drop design review](https://github.com/mui/mui-x/issues/14129)
- [shadcn-ui #4642 — tree view component with drag & drop](https://github.com/shadcn-ui/ui/issues/4642)
- [ant-design #27197 — filter treeNodes on search](https://github.com/ant-design/ant-design/issues/27197)
- [ant-design #31057 — can't scroll tree while dragging](https://github.com/ant-design/ant-design/issues/31057)
- [primeng #7417 — tree filter, expand search result](https://github.com/primefaces/primeng/issues/7417)
- [primeng #8518 — onNodeExpand not fired when filtering](https://github.com/primefaces/primeng/issues/8518)
- [clarity #1821 — Tree View drag and drop design spec](https://github.com/vmware/clarity/issues/1821)
- [Lukas Bach — Headless-Tree, and the future of react-complex-tree](https://medium.com/@lukasbach/headless-tree-and-the-future-of-react-complex-tree-fc920700e82a)
- [lukasbach/headless-tree](https://github.com/lukasbach/headless-tree)
- [Salesforce UX — dnd-a11y-patterns](https://github.com/salesforce-ux/dnd-a11y-patterns)
