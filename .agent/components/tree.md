# InteropTree — Retired

Not rebuilt as directives. Research:
[prompts/TREE-REVIEW.md](../../prompts/TREE-REVIEW.md). The deprecated source
is in `projects/interop_deprecated/src/lib/components/interop-tree/`, with CSS
in `styles/components/tree.css` and
`styles/themes/protocol/components/tree.css`. Earlier research:
[`.agent/explorations/tree-research.md`](../explorations/tree-research.md).

| Prime use | Now |
|---|---|
| Navigate tier (docs nav) | `nav > ul` of links with `aria-current="page"`, `<details>`/`<summary>` per branch. CSS only, no roles |
| Select tier (file browser) | Not built. No consumer. Needs roving focus, typeahead and a selection model first |

## Why it is not rebuilt

- Navigation is not a tree. APG, Roselli and Carbon all say so. Nested
  `<details>` in a list gives list levels, disclosure state and find-in-page
  expansion in Chrome 155 with no script.
- 1,000 lines of TypeScript, about 300 of them only for Angular. The navigate
  tier needed about 10 of them, and `<details>` replaces those.
- It drew a focus ring on every item at rest, lost the current-page cue in
  forced colors, left a dead twisty on disabled branches, and put
  `aria-expanded` on `<li>`.

Do not put `role="tree"` on navigation. Do not add `aria-expanded` to an
`<li>`. Do not reintroduce a depth number for indentation: nested padding with
a `border-image` bleed gives full-width rows.
