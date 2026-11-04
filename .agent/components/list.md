# List — Mental Model Card

An ordered list with its numbers drawn in circles. CSS only, on a native
`<ol>`. Research: [prompts/LIST-REVIEW.md](../../prompts/LIST-REVIEW.md), which
also retires Prime's `InteropList` (an Angular collection renderer).

```html
<ol interop-list="outlined" role="list">
  <li>Check the cargo manifest</li>
  <li>Seal the hold</li>
</ol>
```

## Files

```
projects/interop/list/
  interop-list.base.css        tokens: the step indicator's values
  interop-list.structure.css   layout, the number, Chrome's counter fixes
```

Ships in `interop.css` (763 B gzip). The demo page is
`projects/demo/src/app/components/list/`.

## Variants

| Markup | Draws |
|---|---|
| `ol[interop-list]` | Nothing: the browser's numbers stay. The consumer opts in to drawn numbers by naming one |
| `ol[interop-list="outlined"]` | Each number in a ring |
| `ol[interop-list="filled"]` | Each number reversed out of a disc |

The two are named explicitly and relative to each other; neither is a default.
They draw on `<ol>` only.

## How it works

- `::marker` takes no border, background or box, so the number is the `li`'s
  `::before`, absolutely placed a gap before the text, as the browser's
  numbers hang. The list's start padding is the room for it.
- The `li` stays `display: list-item`. A flex or grid `li` stops the
  `list-item` counter, which is why Prime's numbers ignored `start`.
- The number reads `counter(list-item)`. Chrome 156's counter ignores
  `reversed` and `<li value>` (its own numbers do not), so four rules set it:
  `counter-increment: list-item -1` on a reversed list's items,
  `counter-set: list-item sibling-count()` on its first, `attr(start
  type(<integer>))` when it has a start, and `attr(value type(<integer>))` on
  an item with a value. WebKit counts right already and reaches the same
  numbers.
- One digit is a circle, more grow a pill: the badge's rule, `padding-inline:
  (size − 1ch) / 2 − border`, with `tabular-nums`.
- Every drawn list has the same start padding (one circle and a gap), so
  lists and both variants align. A wider number ends at the same place and
  grows toward the start, as the browser's own "10." hangs past "9.". Don't
  widen the padding per list: lists with `start` or ten items would stop
  lining up with the rest.
- The number centers on the item's first line. The item's `1lh` reaches the
  smaller number through a registered `@property` (`--itx-list-line-height`);
  a line shorter than the number pads the item to it.
- Items space themselves (`--itx-list-gap`): `itx-flow` spaces only lists
  without a role.

## role="list"

Hiding the browser's numbers makes Safari drop the list from VoiceOver on
purpose (WebKit bug 122320, "by design"). A drawn list carries
`role="list"`, as tags, steps, tree and page nav do. Not checked in Safari
with VoiceOver: WebKit may count visible `::before` content as markers, which
would make the role redundant here. Bare `ol[interop-list]` keeps its markers
and needs no role.

## Tokens

| Token | Value |
|---|---|
| `--itx-list-gap` | Between items, `space-3` |
| `--itx-list-marker-gap` | Number to text, `space-3` |
| `--itx-list-marker-size` | 24px, the step indicator's |
| `--itx-list-marker-font-size` | Caption |
| `--itx-list-marker-border-width` | The house border |
| `--itx-list-marker-border-color` | The ring, 3:1 against the page |
| `--itx-list-marker-color` | The outlined number, 4.5:1 |
| `--itx-list-marker-background-color-filled` | The disc, 3:1 |
| `--itx-list-marker-color-filled` | The filled number, 4.5:1 on the disc |

## Dev audit rules

| Rule | Flags |
|---|---|
| `list-role` (shared) | A drawn list without `role="list"` |
| `list-numbers-on-ul` | `outlined` or `filled` on a `<ul>` |

## Tested

Contrast guard (ring, disc and both numbers, both schemes), forced-colors
guard (exempt: text and borders; a disc becomes a ring), axe fixture,
audit specs. `npm run test:browser` checks the drawn numbers in Chromium
from the accessibility tree (`start`, `reversed`, `reversed start`,
`value`, `reversed` with `value`, ten items) and, in Chromium and WebKit, a
circle for one digit, a pill for two, the number centered on the first line,
one text start and one number end across every list, and RTL. Removing the four counter rules fails the
Chromium numbers.

Not tested: Firefox, stable Safari, VoiceOver.

## Not built

An avatar group: its own component, on an avatar, when a page needs one.
Ruled rows (Prime's "contained"): pending a shared row look across the
disclosure, the accordion and the table.
