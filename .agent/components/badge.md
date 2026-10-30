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
| `announce` | Speaks each change of a count above zero with `announce()`, from the badge. Off by default. Not the first value, and not zero. The badge holds no live region, so its count stays in the surrounding control's name. Give it to one badge per count: two announcing badges say every change twice |
| `itx-color` | A role (`danger`, `warning`, `success`, `info`) or any CSS color |

| Attribute | Does |
|---|---|
| `interop-badge="dot"` | A dot. Its content is spoken, not shown |
| `interop-badge="count"` | A count in plain HTML: drawn solid. A badge with `[count]` sets `data-count` and is drawn solid without it |
| `itx-badge-position` | `top-start`, `top-end`, `bottom-start`, `bottom-end`: placed on that corner of its parent, half outside it |
| `itx-size` | `sm`, default, `lg` |

Numbers use the page locale and equal-width digits, so a changing count keeps its
width.

## Look

Chosen in the badge lab (`/labs/badge`), which stays in the demo.

- Every color comes from one status color, `--itx-badge-accent-color`: the
  toast's and callout's status edge (`neutral-500` with no `itx-color`), 3:1
  against the page. A custom `itx-color` sets it.
- **Text** (the default): a 1px border in the status color, a 12% see-through
  tint of it behind the text, and text in the status color pulled 30% toward
  the text color. Pure status-colored text fails 4.5:1 on neutral, success and
  warning; 30% is the least pull that passes every status in both schemes,
  page and panel (lowest 4.71:1, neutral on the dark panel).
- **Count** (`[count]`, or `interop-badge="count"`): solid, with white text.
  It sets `color-scheme: light`, so its status color is the light scheme's in
  both schemes: 4.73–6.82:1 with white on every role, where the dark scheme's
  lighter colors would need black. The text is `contrast-color()`, so a pale
  custom color still gets black. A filled count is what readers expect of an
  unread number.
- **Dot**: the status color, solid.
- Type: caption (12px) at sm, label (14px) at md, p (16px) at lg. Heights 20,
  24, 28px. Text badges pad 40% of the height. A count pads so one digit
  fills the height: a single digit is a circle, and more digits grow a pill.
  Weight 400.
- Forced colors keep a border on every badge, so a dot and a count keep their
  shape.
- `styles/contrast.spec.ts` measures the tinted text, the solid count text and
  the border against the page, and checks the status colors are the toast's.

## Dev audit rules

| Rule | Flags |
|---|---|
| `badge-text` | A badge with no text for assistive technology |
| `badge-count-label` | A count with nothing saying what it counts |
| `badge-live-region-name` | A live-region badge inside a control, which drops the count from its name |

## Not built

A remove button in a badge, and a badge link.
