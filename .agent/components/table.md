# InteropTable — Mental Model Card

## Files

```
src/lib/components/interop-table/
  interop-table.ts             component, TableColumn, TableGroupRow, isTableGroupRow
  interop-table.html           template (scroll wrapper + table + state rows)
  interop-cell-def.ts          [itxCell] directive + InteropCellContext interface
  public-api.ts                barrel
src/lib/styles/components/table.css            structural rules (zero-specificity :where(), tokens)
src/lib/styles/themes/protocol/components/table.css  token values
projects/demo/src/app/pages/table/             demo page
```

## DOM structure

```html
<div class="interop-table__scroll" (scroll)="onScroll()">  <!-- scroll wrapper -->
  <table class="interop-table__table">
    <thead><tr><th>...</th></tr></thead>
    <tbody>
      <tr class="interop-table-row">
        <td class="interop-table-cell">...</td>
      </tr>
      <!-- group row sentinel -->
      <tr class="interop-table-group-row">
        <th class="interop-table-group-label" colspan="..." scope="rowgroup">Layout</th>
      </tr>
    </tbody>
  </table>
  <ng-content />  <!-- projected itxCell templates live here -->
</div>
```

## Public API

### Inputs

| Input | Type | Default | Effect |
|---|---|---|---|
| `collection` | `InteropCollectionInput<T>` | — | Data source. Resolved via the `interopCollection()` mechanism — accepts arrays, Signals, Observables, Promises, Iterables, Collection wrappers, or InteropCollection instances |
| `columns` | `TableColumn<T>[] \| null` | `null` | Explicit column defs. When omitted, columns auto-generate from the first item's keys |
| `autoColumns` | `boolean` | `true` | Master switch for auto-generation. Set false to force "no columns until provided" |
| `trackBy` | `TrackByFunction<T> \| 'auto' \| 'index'` | `'auto'` | Row tracking strategy |
| `trackByField` | `keyof T \| null` | `null` | Field to use for identity in `'auto'` mode |
| `showHeaders` | `boolean` | `true` | Render `<thead>` |
| `emptyText` | `string` | `'No data available'` | Default empty message |
| `loadingText` | `string` | `'Loading...'` | Default loading message |
| `maxRows` | `number \| null` | `null` | Hard cap on rendered rows |
| `scrollable` | `boolean` | `true` | Wraps the table in a horizontal-scroll container (overflow-x + touch-action). Set false to opt out entirely |
| `scrollRegionLabel` | `string \| null` | `null` | **Providing a label promotes the wrapper to an ARIA landmark** (`role="region"`, `tabindex="0"`, focus ring). Without a label the wrapper still scrolls but is not announced as a landmark |

No `(closed)`-style outputs — the table is read-only at this stage.

### Content children

```html
<table interop-table [collection]="users" [columns]="cols">
  <ng-template itxCell="email" let-item let-column="column" let-index="index">
    <a [href]="'mailto:' + item.email">{{ item.email }}</a>
  </ng-template>
</table>
```

`InteropCellDef` (selector `[itxCell]`) is collected via `contentChildren`. The directive's input value must match a column key. Templates receive `InteropCellContext<T>`: `{ $implicit: T, column: TableColumn<T>, index: number }`.

The fallback when no template matches a key: `getCellText()` reads `item[column.key]`, returns `''` for null/undefined, otherwise `String(value)`.

## Column definitions

```typescript
interface TableColumn<T = any> {
  key: keyof T | string;     // data property to read
  label?: string;            // header text; defaults to formatted key
  hidden?: boolean;          // omitted from resolvedColumns()
  sticky?: boolean;          // pin to inline-start during horizontal scroll
  stickyLeft?: number;       // explicit pixel offset; required only for the 2nd+ sticky column
}
```

Auto-generated columns format the key: `crewMember` → `'Crew member'`, `user_id` → `'User id'`, etc. (see `formatKeyAsLabel`).

`resolvedColumns()` is the canonical column list at runtime: explicit `columns` if provided, otherwise auto-generated, with hidden columns filtered out.

## Group rows

A sentinel row that spans all columns. Mix into the data array inline:

```typescript
entries = [
  { groupLabel: 'Layout' } as TableGroupRow,
  { property: '--itx-button-display', default: 'inline-flex' },
  { property: '--itx-button-padding', default: '0.5rem 1rem' },
  { groupLabel: 'Typography' },
  { property: '--itx-button-font-size', default: 'var(--itx-fs-label)' },
];
```

`isTableGroupRow(item)` is the type guard. The template branches on it to render `<th class="interop-table-group-label" scope="rowgroup">` instead of a normal row. Used heavily by the demo's API tables.

## State machine

The body branches on the resolved collection's signals:

| Condition | Renders |
|---|---|
| `isLoading()` | `<tbody class="interop-table-loading">` with `loadingText()` |
| `hasError()` && !loading | `<tbody class="interop-table-error">` with `<ng-content select="[slot=error]">` |
| `isEmpty()` && !loading && !error | `<tbody class="interop-table-empty">` with `<ng-content select="[slot=empty]">` |
| else | header + body rows |

```html
<table interop-table [collection]="data$">
  <div slot="error">Couldn't load. <button (click)="retry()">Retry</button></div>
  <div slot="empty">No matches. Try a different filter.</div>
</table>
```

## Scroll wrapper

`scrollable` defaults to `true`. The wrapper applies `overflow-x: auto` + `touch-action: pan-x`; the inner table gets `width: max-content; min-width: 100%` so it expresses its natural column widths and the wrapper handles the overflow. `(scroll)="onScroll()"` writes `[data-scrolled]` once `scrollLeft > 1`.

### Landmark promotion

The wrapper is **only** exposed as an ARIA landmark when `scrollRegionLabel` is provided. The naming-as-opt-in is deliberate:

- AT contract: a landmark region must have an accessible name to be useful. An unnamed `region` pollutes the screen reader's landmark list.
- Authors who want a generic "scrollable table" don't need landmark semantics — they get the responsive overflow without the noise.
- Authors who want to expose the table as a navigable region pass a meaningful label and earn `role="region"`, `tabindex="0"`, and the focus ring automatically.

The component derives this via the `hasScrollRegion` computed signal: `scrollable() && scrollRegionLabel() != null && scrollRegionLabel() !== ""`. When false, no role/aria-label/tabindex attributes are emitted — the wrapper is just a plain scroll container.

### Opting out of scrolling entirely

`[scrollable]="false"` removes the `--active` class. The wrapper becomes a passthrough (no overflow, no touch-action, no landmark regardless of `scrollRegionLabel`). Use when a parent already manages overflow, or the table is guaranteed to fit.

### Sticky columns

Set `sticky: true` on the leftmost column(s):

```typescript
columns = [
  { key: 'id', label: 'ID', sticky: true },
  { key: 'description', label: 'Description' },
  { key: 'qty', label: 'Qty' },
];
```

Header sticky cells get `z-index: 2`, body sticky cells get `z-index: 1` (header floats over body during cross-axis scroll).

For multiple consecutive sticky columns, declare `stickyLeft` explicitly — there's no automatic offset accumulation. The first sticky column is always `left: 0`; the second must declare its `stickyLeft` as the width of the first; etc.

### Sticky shadow

When the scroll wrapper has `[data-scrolled]`, sticky cells gain a shadow indicating there's content scrolled out of view. The shadow is a single token (`--itx-table-sticky-shadow`) so themes can replace the entire declaration; the default combines an inline-end-edge hairline with a soft offset blur.

### Touch-swipe behavior

The active scroll wrapper sets `touch-action: pan-x`. Horizontal pans are claimed by the table; vertical pans pass through to the page so the rest of the document remains scrollable on touch devices.

## Performance characteristics

- **OnPush + signals** — only the items signal flipping triggers a re-render
- **Single rAF batching** for scroll updates (`onScroll` queues one rAF; subsequent scroll events while it's pending are dropped)
- **Track-by chain** — `createComponentTrackByFn` from `src/lib/utils/track-by.ts` resolves `trackBy` mode + `trackByField` in priority order; minimizes DOM churn on data updates
- **Auto-generated column signal** — recomputes only when items become non-empty AND no explicit columns are set
- **Resolved collection** — single `interopCollection<T>(this.collection)` instance lives for the component's lifetime; setSource() re-dispatches in place when `[collection]` flips

## Tokens

24 public tokens, all set on `[interop-root]` by Protocol. Categories: typography (3), body (6), header (4), borders (1), sticky (2), state (1), focus (1), group label (6).

The `--itx-table-empty-color` token from the previous component-scoped CSS was renamed to `--itx-table-state-color` (it covers loading, error, AND empty — the old name was misleading).

## Notes

### Cell template microsyntax

Templates use `let-item let-column="column" let-index="index"`. The implicit binding is the row item; the named bindings access the rest of the context. The cell-def directive's input is `string` — a key, not a column ref — so renaming a column requires updating the `itxCell` value in the template too.
