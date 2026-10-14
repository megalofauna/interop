# Badge — Mental Model Card

A badge is non-interactive text: a count, a status, or a category. It shows
content, or a number with what it counts, on any element.

```html
<span interop-badge>Beta</span>
<span interop-badge itx-color="success">Operational</span>
<button interop-button type="button">
  Inbox
  <span interop-badge itx-badge-position="top-end" [count]="unread()" [label]="{ one: 'unread message', other: 'unread messages' }"></span>
</button>
<span interop-badge="dot" itx-badge-position="top-end">New activity</span>
```

## Badge, chip, tag

A badge is never interactive and never holds a control. Prime grouped anything
pill-shaped as a "chip", so a non-interactive label became
`[interop-chip-badge]`, a chip component; the badge now covers it. The split is
by meaning, not shape:

| It is | Use |
|---|---|
| A count, status or category the user only reads | Badge |
| A value the user removes | A tag: `ul[interop-tags]`, see [tags.md](tags.md) |
| An option the user selects | A checkbox or radio, with the `chips` template: see [control.md](control.md) |
| An action | `button[interop-button]` |

A remove button inside a badge would make it a control, so a removable value is
a tag. Research: [prompts/CHIPS-REVIEW.md](../../prompts/CHIPS-REVIEW.md).

## Files

```
projects/interop/badge/
  badge.ts                       InteropBadge, on [interop-badge]
  interop-badge.structure.css    shape, placement, hidden
  interop-badge.base.css         token values, size steps, color roles, the dot, forced colors
  public-api.ts
```

## Behavior

| Input | Does |
|---|---|
| none | Shows its own content |
| `count` | Shows the number, capped at `max` (`99+`), and speaks the real count with `label`, e.g. "120 unread messages". A count of zero hides the badge |
| `max` | The largest number shown. The spoken count is never capped |
| `label` | What the count counts: a string, or plural forms keyed by `Intl.PluralRules` |
| `announce` | Speaks each change through a visually hidden `role="status"` inside the badge. Off by default. At zero the badge is visually hidden instead of `hidden`, so the region exists before the count changes; a region that appears with its text already in it is often not read. A live region's text is left out of the surrounding control's name, so the count is said once |
| `itx-color` | A role (`danger`, `warning`, `success`, `info`) or any CSS color |

| Attribute | Does |
|---|---|
| `interop-badge="dot"` | A dot. Its content is spoken, not shown |
| `itx-badge-position` | `top-start`, `top-end`, `bottom-start`, `bottom-end`: placed on that corner of its parent, half outside it |
| `itx-size` | `sm`, default, `lg` |

Numbers use the page locale and equal-width digits, so a changing count keeps its
width. Forced colors give it a border, so it keeps its shape.

## Dev audit rules

| Rule | Flags |
|---|---|
| `badge-text` | A badge with no text for assistive technology |
| `badge-count-label` | A count with nothing saying what it counts |
| `badge-live-region-name` | A live-region badge inside a control, which drops the count from its name |

## Not built

A remove button in a badge, a badge link, an outline look for categories (add
`interop-badge="outline"` when someone needs it).
