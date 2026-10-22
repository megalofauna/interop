# Table — Mental Model Card

A table holds data in rows and columns. It is the native `<table>` with
`interop-table`, and it is CSS only: the consumer writes the table, including
their own `@for`, and Interop styles it. Research:
[prompts/TABLE-REVIEW.md](../../prompts/TABLE-REVIEW.md).

```html
<table interop-table>
  <caption>Crew</caption>
  <thead>
    <tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col" itx-numeric>Hours</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">Ada</th><td>Pilot</td><td itx-numeric>1,204</td></tr>
  </tbody>
</table>
```

## Files

```
projects/interop/table/
  interop-table.structure.css   layout, caption, headers, groups, numeric cells
  interop-table.base.css        --itx-table-* tokens and the itx-size steps
  public-api.ts                 empty
projects/demo/src/app/components/table/
  table-stacked.css             a consumer's narrow layout, shown on the page
```

## Markup

- `<caption>` names the table. Without one, `aria-labelledby` points at a heading.
- `th scope="col"` for column headers; `th scope="row"` for the cell that names
  each row, such as the name column of a reference table.
- Groups: one `<tbody>` per group, its first row a `th scope="rowgroup"` with a
  `colspan`. A rowgroup header labels every row in its `<tbody>`, so groups
  sharing one `<tbody>` mislabel each other.
- `itx-numeric` on a `<th>` or `<td>`: end-aligned, tabular figures. A `<col>`
  cannot set `text-align`, so the cell carries it.
- `itx-size` on the table: sm, md (default), lg.
- Empty: keep the caption and headers; one row, one cell with `colspan`, saying why.

## Layout

- The table fills its container (`inline-size: 100%`) and its cells wrap.
- It never scrolls. A table too wide goes in `div[interop-scroll-area]` named by
  the caption (`aria-labelledby`). `bindScrollArea()` makes it a Tab stop and a
  named `group` only while it overflows.
- An `overflow-x` scroller stops a sticky header sticking to the page, so a
  scroll area and a page-sticky header are exclusive.
- Rows have no height. Line height plus cell padding make 32, 40 and 56px (plus
  the 1px rule), so a consumer's narrow layout can make rows and cells blocks.
- Table semantics survive `display: block` and `grid` on table parts (checked in
  Chrome 155; Firefox and Safari 17 per Roselli). `display: contents` drops them.
- A `<table>` cannot be a size container; a container query needs a wrapper.
- The caption takes the table's font size unless it has `itx-font`. The opt-in
  reset sizes captions at 12px, in `@layer itx-reset`, which unlayered rules beat.
- The table paints no background, so a scroll area's edge shadows show.

## Looks

Only the default ships. A narrow layout is the consumer's, on a wrapper with a
container query: the demo's `table-stacked.css` stacks rows into cards below
30rem with `data-label` and `content: attr(data-label) / ""`. It must keep the
caption and header cells (hide `thead` visually, not with `display: none`), avoid
`display: contents`, and keep labels matching the headers.

## Dev audit rules

| Rule | Flags |
|---|---|
| `table-name` | No caption text, `aria-label` or `aria-labelledby` |
| `table-headers` | No `<th>` |
| `table-rowgroup` | A `th scope="rowgroup"` not alone in the first row of its own `<tbody>` |
| `table-overflow` | Wider than its nearest non-inline ancestor, outside a scroll area |

## Tests

- `styles/contrast.spec.ts`: cell, header and caption text on the page; group text on its band.
- `src/audit.spec.ts`: each rule.
- `a11y/a11y.spec.ts`: axe on a grouped reference table and a numeric table in a scroll area.
- `styles/forced-colors.spec.ts`: exempt; text and borders map.

## Not built

Sorting (`bindTableSort()` planned: `aria-sort` on the sorted header only,
`announce()`, an event; plain HTML calls an exported `sortRows()`), sticky
header, sticky first column, a shipped stacked look, selection, pagination,
column hiding. `role="grid"` and cell navigation are out.

## Prime

Prime's `interop-table` was a data-mode element (collections, column
definitions, cell templates). It had no caption or row headers, put every group
in one `<tbody>`, made every labeled table a landmark, and kept cells on one
line inside a default scroller. Do not reintroduce any of it.
