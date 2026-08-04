# Tree — Mental Model Card

> `src/lib/components/interop-tree/` — four directives on native elements.
> Research behind the design: [`.agent/explorations/tree-research.md`](../explorations/tree-research.md).

## The one idea

**`role="tree"` is a behaviour contract, not a label.** One tab stop for the
whole widget, roving focus, typeahead, arrow keys that expand and collapse, a
selection model. Nav sidebars, docs contents and browse lists honour none of it.
Every incumbent applies the role to both jobs and pays for it in every audit.

So the tier is explicit:

| | `<ul interop-tree>` | `<ul interop-tree="select">` |
|---|---|---|
| Tier | **navigate** (default) | **select** |
| Roles | none — nested list | `tree` / `treeitem` / `group` |
| Tab stops | many (links, twisties) | one (roving tabindex) |
| Keyboard | none authored | full APG treeview |
| Current node | `aria-current` on the link | `aria-selected` on the item |
| Twisty | `<button>` — real disclosure | `<span>` — `aria-hidden` affordance |
| Checkboxes | real `<input>` + `indeterminate` | `aria-checked` |

The tier decides the downstream questions rather than leaving them as traps.
Putting a link, form control, or `<button>` twisty in a select-tier row makes it
unreachable for screen-reader users — devMode warns and points at the other tier.

## Files

```
src/lib/components/interop-tree/
  interop-tree.context.ts     INTEROP_TREE / INTEROP_TREE_ITEM tokens + interfaces
  interop-tree.ts             ul[interop-tree]        — registry, roving focus, keyboard, CVA
  interop-tree-item.ts        li[interop-tree-item]   — depth, expansion, ARIA
  interop-tree-toggle.ts      [interop-tree-toggle]   — twisty, two forms
  interop-tree-group.ts       ul[interop-tree-group]  — child list, until-found hiding
  interop-tree.spec.ts
styles/components/tree.css                      structural
styles/themes/protocol/components/tree.css      values
```

## Markup shape

`[interop-tree-row]` is a plain attribute (no directive) marking the row box.
The group must be a **direct child** of the item.

```html
<ul interop-tree>
  <li interop-tree-item key="guide">
    <span interop-tree-row>
      <button interop-tree-toggle></button>
      <a href="/guide">Guide</a>
    </span>
    <ul interop-tree-group>
      <li interop-tree-item key="install">…</li>
    </ul>
  </li>
</ul>
```

## Three decisions worth remembering

**1. Depth is one number, used twice.** The item derives its depth from the
ancestor chain and publishes it as *both* `aria-level` and `--itx-tree-level`.
The accessibility attribute is the layout input. When `attr(aria-level
type(<number>))` reaches Baseline the style binding deletes and the CSS reads
the ARIA attribute directly.

Indent lives on the **row**, never on nested `<ul>` padding. That is what lets
the row box span the full width so hover and selection bleed to both edges at
any depth — the Finder/VS Code look that nesting-padding makes impossible.

There is no pure-CSS depth counter: `--depth: calc(var(--depth) + 1)` is a
self-reference, which CSS treats as a dependency cycle regardless of
inheritance, so it goes invalid at computed-value time. Don't chase it.

**2. No virtualizer.** `content-visibility: auto` +
`contain-intrinsic-size: auto` skips layout and paint for offscreen subtrees
while leaving them in the DOM, in the a11y tree, selectable by Ctrl+A, and
findable by find-in-page. Item counts come from real list semantics, so there is
no `aria-setsize`/`aria-posinset` bookkeeping to get wrong.

*Honest limit:* it skips rendering, not Angular component instantiation. One
directive instance per node is still created up front. Good to the low
thousands; past that, render branches lazily inside `@if` and set
`[expandable]` on the item (the item otherwise infers expandability from a
group being present, and a group inside a false `@if` is not present).

**3. Collapsed is not gone.** Collapsed groups use `hidden="until-found"`.
Supporting browsers reveal a find-in-page match and fire `beforematch`, which
the group turns into a real expand so component state matches what the user is
looking at. Non-supporting browsers treat any `hidden` value as hidden — there
is nothing to feature-detect and no fallback to write.

## Anchor positioning — considered, declined

For the hierarchy itself. You *can* `anchor-name` a parent's toggle and the last
child's row and stretch a guide rail between them, and it is Baseline now
(Firefox 147, Jan 2026). But it forces the rail out of flow, straight into the
anchor-in-a-scroll-clipping-ancestor trap inside a scrolling tree.

The rails are instead a `repeating-linear-gradient` on the row, sized to the
indent region by `--itx-tree-level` — one rule per ancestor, any depth, no
pseudo-element per level. Anchor positioning stays for the tree's *overlays*
(row context menu, truncated-label tooltip, collapsed-rail flyout), which route
through `InteropPopover` as usual.

## API surface

Inputs — tree: `interop-tree` (`"" | "select"`), `multiselectable`, `selected`
(two-way, always an array), `findable`. Item: `key`, `expanded` (two-way),
`disabled`, `label`, `expandable`. Toggle: `label`.

Outputs — `expandedChange` (`{key, expanded}`, fires for browser reveals too),
`activated`.

Methods — `reveal(key)` (expand every ancestor, then focus — the primitive that
filtering, deep-linking and "reveal in tree" all reduce to), `expandAll()`,
`collapseAll()` (moves focus out to the root rather than losing it to `<body>`).

CVA is provided on the tree; meaningful only in the select tier.

## Not built yet

- **Tier C** — nested `<details>`/`<summary>` for a zero-JS tree, with
  `::details-content` + `@supports (interpolate-size)` height animation. Cheap
  (~60 lines + CSS) but a distinct host shape; `<details>` is not a list, so it
  wants `<details interop-tree-branch>` *inside* the `<li>` to keep list
  semantics. Only valid in the navigate tier — `<summary>` is focusable and
  would break the select tier's single tab stop.
- **Keyboard-first move model** (mark → `Cmd/Ctrl+X` → `Cmd/Ctrl+V`, or a
  "Move to…" action, with live-region announcements). This is the §3/§4
  differentiator from the research: drag-and-drop reordering is the
  most-requested tree feature everywhere and is inaccessible everywhere. Ship
  the keyboard path as primary; pointer drag becomes a thin adapter.
- **Filter directive** — trivial once `reveal()` exists.
- **Async children on expand** — wants `InteropActivation` for the reentrancy
  guard, plus `aria-busy` and a live-region announcement.
