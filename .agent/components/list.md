# InteropList — Retired

Not rebuilt. Research:
[prompts/LIST-REVIEW.md](../../prompts/LIST-REVIEW.md). The deprecated source
is in `projects/interop_deprecated/src/lib/components/interop-list/`, with CSS
in `styles/components/list.css` and `styles/themes/protocol/components/list.css`.

| Prime use | Now |
|---|---|
| A list from a `[collection]` | The author writes the `li` elements; the framework renders them |
| Plain `ul`, `ol`, `dl` | Native markup in `[itx-flow]`: see `styles/flow.css` |
| Enclosed markers (`itx-marker="enclosed"`) | A CSS-only numbered list on `ol`, pending the review's questions |
| `<interop-list>` element | `ul` or `ol` |
| Contained rows | Not now |

## Why it is not rebuilt

- Its TS is an Angular renderer: collection, `trackBy`, templates, an
  attribute preset that was never applied and layout axes that nothing read.
- It hid list semantics from Safari (`list-style: none` without
  `role="list"`), showed wrong numbers for `start`, `reversed` and `value`,
  put `<li>` in `<dl>`, and made `<interop-list>` a `generic` without script.

Do not reintroduce: a list component that renders data, a flex or grid `li`
under drawn numbers (the `list-item` counter stops), or an avatar group as a
list variant (it is its own component, on an avatar).
