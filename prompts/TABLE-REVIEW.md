# Table — Research Review

Review of Prime's `InteropTable`, `InteropCellDef` (`[itxCell]`) and `InteropTableSort` (`[itxSort]`)
in `projects/interop_deprecated/src/lib/components/interop-table/`, run against
[new-component-research.md](new-component-research.md).

## Decision

Rebuild the table as CSS on the native element, `table[interop-table]`, with no script. The
consumer writes the table: `<caption>`, `<thead>`, `<th scope>`, one `<tbody>` per group, and
their own `@for`. Prime's data mode (collections, column definitions, auto columns, cell templates,
track-by) is not rebuilt.

Overflow is not the table's job. A table lays out as a table and its cells wrap. A table too wide
for its container goes in the existing `div[interop-scroll-area]`, named by the caption, and the
dev audit warns when a table is wider than its container and not in one. Prime's default
horizontal scroll is retired: it forced cells onto one line (`max-content`), and an `overflow-x`
scroller stops a sticky header from sticking to the page (§3).

Sorting is a separate opt-in helper, built only if you want it in v1 (Questions 3).

| Prime use | Really | Interop |
|---|---|---|
| ~105 API tables in the Prime demo (inputs, outputs, attributes, tokens) | Reference tables: a name column and prose | `table[interop-table]` with `<caption>` and `<th scope="row">` on the name column; prose wraps |
| Two-column token tables (property, default) | Key-value lists | `<dl>`, or the table when it lines up with sibling tables |
| Group sentinel rows (`{ groupLabel }`) | Row groups | One `<tbody>` per group, its first row a `<th scope="rowgroup">` |
| Button availability matrix | A comparison table | `table[interop-table]` with row headers |
| Sticky "component" columns | A fix for `max-content` | Nothing: cells wrap |
| Cargo manifest, sortable | A data table | `table[interop-table]` in `interop-scroll-area`, plus the sort helper if built |
| Five plain tables in the canonical demo, with four copies of the same CSS | Tables with no shared style | `table[interop-table]`; the four copies go |

| Question | Decision |
|---|---|
| Does Prime's table do what it claims? | It renders arrays as tables, sorts and pins columns. It names no table (no caption), cannot make a row header, puts every group under every earlier group header, adds a landmark to every labeled table, and keeps prose on one line. Its README and card are wrong about its selector, its tokens and its touch behavior |
| Is it a table? | Its output is `<table>` markup with correct column headers and `aria-sort` on the `th`. It is a data-mode component: about 1,250 of its lines turn arrays into markup |
| What is each use, really? | Reference tables, key-value lists and one sortable data table. See above |
| What does the platform do now? | Tables keep their semantics with `display: block` and `grid`. Chrome makes an overflowing scroller a Tab stop but gives it no name. CSS detects overflow with `scroll-state(scrollable)`, Chromium only. A `<table>` cannot be a size container. `focusgroup` has no grid. See §3 |
| What has to exist first? | All of it exists: scroll area, focus ring, button, `announce()`, visually hidden, caption type |
| Can an invoker replace script? | No. A custom `--sort` command lets a control outside the table ask for a sort, but a listener still sorts |
| Accessibility | Seven misses, three high. See §1 |
| Complexity | 1,877 lines with the CSS. About 40 lines of sort logic and the CSS are about tables; the rest is data mode |
| What carries over | The density model, the base rules the demo copies, the sort comparator rewritten, and the lessons. See §6 |

## 0. Names

| Name | Used by |
|---|---|
| table | HTML, ARIA, APG, GOV.UK, USWDS, Radix Themes, Web Awesome (styles the native table), Angular CDK and Material (`cdk-table`, `mat-table`, on a native `<table>`), React Aria (`Table`) |
| data table | Carbon, Material 2, USWDS ("data table" in prose) |
| table view | Spectrum, Apple |
| lists and tables | Apple HIG |
| data grid | Fluent v9 (`DataGrid`), MUI X: an interactive widget with cell navigation |
| grid | ARIA `role="grid"`: an application widget, not a table |

Content and government design systems ship a static table. Application toolkits ship a data grid.
Interop is the first kind. The pick is **table**: it is the element.

## 1. Prime

| File | Lines |
|---|---|
| `interop-table.ts` | 352 |
| `interop-table.html` | 168 |
| `interop-table-sort.ts` | 196 |
| `interop-table-sort.token.ts` | 49 |
| `interop-cell-def.ts` | 68 |
| `interop-table.spec.ts` | 250 |
| `README.md` | 306 |
| `styles/components/table.css` | 324 |
| `themes/protocol/components/table.css` | 164 |

It also uses the collection service (about 460 lines) and the track-by utilities (165). Git history
gives no rationale: the files arrive in "Last chaos push" and "remove stale code". One later commit
(`6f43d2fb`) found the spec wrote `<table interop-table>`, a form the component never had: its
selector is the element `interop-table`. The README calls the table "unstyled by design" beside 488
lines of CSS, lists sorting and templates as "future" though both exist, and uses the wrong
selector. The card puts the tokens on `[interop-root]`; they are on `:where(interop-table)`.

### What held

- A `<button>` inside the `<th>` for sorting, and `aria-sort` on the `<th>`, as in the APG example.
- Sort direction shown by glyph shape, not by color.
- The density model: a row height floor on the `<tr>`, with cell padding as the gutter when text wraps.
- `text-align: start`, hairline row rules and a declared `line-height`.

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | No caption or other name for the table; the scroll label names the wrapper | 1.3.1, 4.1.2 | High |
| 2 | Every body cell is a `<td>`: no row headers, so a reference table's name column does not label its row | 1.3.1 | High |
| 3 | Group headers are `scope="rowgroup"` in one shared `<tbody>`, so each group header labels every later row | 1.3.1 | High |
| 4 | Every labeled table becomes a `role="region"` landmark with `tabindex="0"`, overflowing or not, and focusable sort buttons inside or not | 2.4.1, 2.4.3 | Medium |
| 5 | Sort glyphs are `::after` text with no alternative, so a button is named "Name ⇅" | 4.1.2 | Medium |
| 6 | Loading, empty and error states replace the body and drop the header, with no `aria-busy` and no announcement | 4.1.3 | Medium |
| 7 | Sticky columns pin to the physical left and the seam is a shadow, which forced colors remove | 1.4.11, 1.3.2 | Medium |

### Bugs

1. Inside the scroll wrapper the table is `inline-size: max-content`, so description cells never
   wrap and every API table with prose scrolls sideways on a desktop.
2. Every sortable header gets `aria-sort="none"`; only the sorted header should carry `aria-sort`.
3. Descending order reverses the ascending array, which moves empty values to the top and reverses ties.
4. Text compares without `{ numeric: true }`, so "10" sorts before "9".
5. Sorting moves every group sentinel row to one end of the table.
6. `touch-action: pan-x` on the wrapper keeps a swipe that starts on the table from scrolling the
   page vertically, against its own comment (unverified on a device).
7. With a group row first, auto columns build one "Group label" column.
8. In RTL, `scrollLeft` is negative, so the scroll seam never shows, and `[style.left]` pins sticky
   columns to the wrong edge.
9. Sticky cells paint their own background, so row hover and stripes stop at the sticky column.
10. The collection keeps `hasError` after an array replaces a failed Observable, and a late Promise
    overwrites newer data.

The spec covers auto columns, labels, track-by, Observable states and `maxRows`. Nothing tests sort,
group rows, sticky columns, the scroll region, `aria-sort`, RTL or templates, and there is no axe check.

## 2. Evidence

- APG sortable table: a `<button>` in the `<th>`, `aria-sort` on the sorted header only, the arrow
  hidden from the name. <https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/>
- Roselli: one `aria-sort` at a time. A sort change is announced by NVDA with Firefox, JAWS with
  Chrome, Narrator and VoiceOver on iPadOS, and not by VoiceOver on macOS or TalkBack (retest August
  2024). <https://adrianroselli.com/2021/04/sortable-table-columns.html>
- Roselli, "Under-Engineered Responsive Tables": a named, focusable region around a semantic table.
  <https://adrianroselli.com/2020/11/under-engineered-responsive-tables.html>
- WCAG 1.4.10 exempts content that needs two dimensions, such as data tables; prose in cells is not
  exempt. <https://www.w3.org/WAI/WCAG22/Understanding/reflow.html>
- Higley: a table for reading, a grid only for app-like editing or management.
  <https://sarahmhigley.com/writing/grids-part1/>
- Roselli: a clickable row does not make a table a grid.
  <https://adrianroselli.com/2023/11/dont-turn-a-table-into-an-aria-grid-just-for-a-clickable-row.html>
- Roselli: Chromium, Gecko and WebKit (Safari 17) keep table semantics with `display: block`, `flex`
  or `grid`; `display: contents` still breaks them.
  <https://adrianroselli.com/2018/02/tables-css-display-properties-and-aria.html>
- Stacked tables duplicate the header text in every cell and lose comparison across rows. USWDS and
  the CMS design system offer them as an opt-in variant, never the default.
  <https://designsystem.digital.gov/components/table/>
- GOV.UK: reduce or split the data first; it has no scrolling or stacking guidance.
  <https://design-system.service.gov.uk/components/table/>
- Size containment has no effect on a box whose inner display type is table.
  <https://www.w3.org/TR/css-contain-2/>

## 3. The platform, checked in Chrome 155.0.8059.80

| Feature | Result |
|---|---|
| `display: block` on a table and all its parts | Still `table "Blocky"`, rowgroup, columnheader, cell |
| `display: grid` on a table | Still a table with column headers and cells |
| An overflowing `overflow-x: auto` scroller, no `tabindex` | A Tab stop. Its role is `generic` with no name |
| The same scroller when it does not overflow | Not a Tab stop |
| An overflowing scroller with a link inside | Not a Tab stop; the link is |
| `@container scroll-state(scrollable: inline)` | Matches the overflowing scroller only |
| `thead th { position: sticky; top: 0 }`, page scrolled 500px | In an `overflow-x: auto` wrapper: 398px above the viewport, not stuck. With `overflow-x: clip` or no wrapper: stuck at 0 |
| `container-type: inline-size` on a `<table>` | No effect: a `@container` rule inside does not match. On a wrapping `<div>`: matches |
| `focusgroup="grid"` on a table of buttons | No arrow-key movement |
| `moveBefore` | In `Element.prototype` |
| Typed `attr()` (`attr(data-w type(<length>))`) | Supported |

In other browsers, from the research: Firefox makes overflowing scrollers focusable; Safari does not
(WebKit bug 277290), which `bindScrollArea()` covers. `scroll-state()` queries are Chromium only.
`moveBefore()` is in Firefox 144 and not Safari. Typed `attr()` is Chromium only; string
`content: attr()` works everywhere.

## 4. Prerequisites in Interop

| Piece | Status |
|---|---|
| `div[interop-scroll-area]` + `bindScrollArea()`: Tab stop only while overflowing with nothing focusable inside, `role="group"` with a name, Safari covered, edge shadows | Exists |
| Focus ring (`styles/outline.css`) | Exists |
| `button[interop-button]` | Exists, for sort buttons if built |
| `announce()` | Exists, for sort announcements if built |
| `[itx-visually-hidden]` | Exists |
| Caption type (`reset.css`) | Exists |
| `itx-flow` spacing around tables (`flow.css`) | Exists |
| Base table CSS | New |
| Audit rules | New |
| Sort helper | New, if built |

## 5. Invokers

| Job | Invoker? |
|---|---|
| Sort from a header button | No gain: a click listener in the helper does it |
| Sort from a control outside the table ("Sort by" menu) | A custom `--sort` command with `commandfor` on the table decouples the control; a listener still sorts. Later, if wanted |
| Show a column-options popover from a header | `popovertarget`, if column menus ever exist |
| Row order, `aria-sort`, announcement | No |

## 6. What carries over

1. Base rules on `table[interop-table]`: `border-collapse: collapse`, `text-align: start`, hairline
   row rules, cell padding, header weight, caption at the inline start. They replace the four demo
   copies.
2. The density model on `itx-size` (`sm`, `md`, `lg`), with heights on the canonical ladder
   (lg = 56px).
3. Group headers on one `<tbody>` per group, styled from `tbody > tr:first-child > th[scope="rowgroup"]`.
4. Numeric cells: end-aligned with `tabular-nums`, by an attribute on the cell (Questions 4).
5. For a sort helper: the toggle, and a comparator rewritten as a pure function with
   `Intl.Collator` (`numeric: true`), direction applied in the comparison, empty values last in both
   directions, and `data-sort-value` for dates and money. `aria-sort` on the sorted header only, the
   glyph with empty alternative text (`content: "↑" / ""`), and an `announce()` call.
6. Audit rules: a table with no caption or `aria-labelledby`; a table with no `<th>`; `aria-sort` on
   more than one header, or `aria-sort="none"`; `display: contents` on a table part; a table wider
   than its container outside a scroll area.
7. Corrections in the Prime card are moot once the card is replaced.

Nothing else carries over: not the data mode, the column definitions, the cell templates, the
collection, the track-by utilities, the scroll wrapper or the sticky columns.

## Questions for you

1. **Retire Prime's data mode and rebuild as CSS on `table[interop-table]`?** Recommend yes. Every
   use has static data the consumer can write as markup, and the data mode is where the bugs are.
2. **Overflow: the table does nothing, wide tables go in `interop-scroll-area`, and the audit warns
   when a table outgrows its container outside one?** Recommend yes. Also: the table fills its
   container's width by default (GOV.UK, USWDS), so reference tables line up and prose wraps.
3. **Sorting in v1?** Recommend a second step after the base table, as `bindTableSort()`. The open
   part is who orders the rows. In plain HTML the helper can move them. In Angular the consumer's
   `@for` owns them, so the helper would set `aria-sort`, announce, and fire an event the
   consumer's `computed()` sorts from. Recommend the event for both, with an exported
   `sortRows(tbody, column, direction)` that plain HTML calls in its listener: one behavior, no mode.
4. **The numeric-cell hook: `itx-numeric` on `<th>` and `<td>`?** Recommend yes. A `<col>` cannot set
   `text-align`, so the cell carries it.
5. **Looks: ship the default (hairline row rules) only, and add words such as
   `interop-table="striped"` later?** Recommend yes, following the toolbar's pick, tune and own
   levels: tokens and the consumer's class cover the rest until a look is asked for twice.
6. **Defer sticky header, sticky first column, stacked layout, selection, pagination and column
   hiding?** Recommend yes. A sticky header cannot stick to the page inside a horizontal scroller,
   and the sticky column existed to work around one-line cells.

## Unverified

- Prime's `touch-action: pan-x` blocking vertical page scroll on a touch device.
- `scope="rowgroup"` support in current screen readers.
- `aria-busy` support across screen readers.
- Safari keeping table semantics under `display: block` today; the last test cited is Safari 17.
- Material 3's table terminology and whether React Aria's `Table` sets `role="grid"`.
