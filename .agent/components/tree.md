# Tree — Mental Model Card

Navigation through a hierarchy of pages: nested lists of links, with a
`<details>` for each branch. CSS only, no roles, no script. Research:
[prompts/TREE-REVIEW.md](../../prompts/TREE-REVIEW.md).

| Part | What | TS |
|---|---|---|
| `ul[interop-tree]` | The outer list. Nested `<ul>`s inside it are styled too | None |

A file browser that selects items with arrow keys is an ARIA tree
(`role="tree"`), with one Tab stop, roving focus and typeahead. Interop does
not ship one; it waits for a product that needs it and for shared roving-focus,
typeahead and selection helpers. One level of show and hide is a plain
`<details>`.

## Files

```
projects/interop/tree/
  interop-tree.structure.css   lists, rails, rows, current page; names list at the top
  interop-tree.base.css        token values
  public-api.ts                empty
```

The demo page is `projects/demo/src/app/components/tree/`. The demo's site
navigation in `app.html` is a tree too.

## Markup

```html
<nav aria-label="Docs">
  <ul interop-tree role="list">
    <li>
      <details open>
        <summary>Guides</summary>
        <ul role="list">
          <li><a href="/guides">Overview</a></li>
          <li><a href="/guides/install" aria-current="page">Install</a></li>
        </ul>
      </details>
    </li>
    <li><a href="/changelog">Changelog</a></li>
  </ul>
</nav>
```

| Concern | How |
|---|---|
| Branch | `<details>`/`<summary>`. The browser exposes the summary as a disclosure with its expanded state and opens a closed branch for a find-in-page match, at any depth |
| Branch with its own page | The summary is a label. The page is the branch's first child link. A link inside `<summary>` is a control inside a control |
| Levels | From the nesting: Chrome reports `listitem level=N`. No `aria-level` |
| Marker | The browser's `::marker` on the summary, which points the right way in RTL. Kept by leaving the summary `display: list-item` |
| Indent | Nested `<ul>` margin and padding, with a 1px rail on its inline-start under the parent's marker |
| Rows | Links and summaries, 32px minimum, text wraps |
| Current | `aria-current="page"`: a 2px inline-start bar (`--itx-border-width-strong`), weight 600 and a fill |
| One branch open | Same `name` on the `<details>` of one level |
| Focus | `outline.css`, inside the row (offset −2px), because rows are gapless |
| Forced colors | A transparent border renders as CanvasText there, so rest bars are set to `Canvas` and the current bar to `Highlight` |
| Safari | `role="list"` on every `<ul>`, because markers are removed |

## Audit

| Rule | Fires on |
|---|---|
| `tree-summary-control` | A link, button, field or `[tabindex]` inside a tree's `<summary>` |
| `list-role` | `ul[interop-tree]` or a `<ul>` inside it without `role="list"` |

## Tested

- Style guards: target size (row), contrast (text on page and fills, the
  current bar on page and fill), forced colors (block and Highlight).
- axe in `a11y.spec.ts`; audit rules in `audit.spec.ts`.
- Chrome 155, by hand: Tab order, Enter and Space toggle a branch, ring at
  every stop, a text fragment opens both levels, forced colors, 320px.
- `npm run test:pages`: the tree page and every page with the site nav.

Not tested: screen reader output, Safari and Firefox.

## Declined

- A depth number (`--itx-tree-level` or `attr(aria-level)`). Nesting does it.
- Full-width row highlights. The `border-image` bleed works in Chrome, but its
  outset is physical, so it points the wrong way in RTL.
- Expand all and collapse all. Not built; see the review.

## Prime

Prime's `InteropTree` (four directives, 1,000 lines) is retired. Its source is
in `projects/interop_deprecated/src/lib/components/interop-tree/`. Its select
tier had no consumer. Its navigate tier put `aria-expanded` on `<li>`, drew a
focus ring on every item at rest, and lost the current page in forced colors.
