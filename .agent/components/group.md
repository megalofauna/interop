# Group — Mental Model Card

A group holds controls that belong together and gives them one name, which a
screen reader says when focus enters. It lays them out in a row that wraps. It
adds no keys: every control stays a Tab stop. Research: the `interop-group`
questions in [prompts/TOOLBAR-REVIEW.md](../../prompts/TOOLBAR-REVIEW.md), and
the split button notes below.

For one Tab stop and arrow keys, use a [toolbar](toolbar.md). For one choice from
several, use a segmented radio group.

## Files

```
projects/interop/group/
  interop-group.structure.css   row layout and the attached look; names list at the top
  interop-group.base.css        the gap
  public-api.ts                 empty: CSS only
projects/interop/styles/fieldset.css   the shared fieldset layout, which fieldset[interop-group] takes in a row
```

The demo page is `projects/demo/src/app/components/group/`. The split button is
a pattern page, `projects/demo/src/app/patterns/split-button/`.

## Markup

The attribute form, decided 2026-10-23: no custom element.

```html
<div role="group" interop-group aria-label="Export">…buttons…</div>
<fieldset interop-group><legend>Notifications</legend>…buttons…</fieldset>
```

`interop-group="attached"` joins its buttons into one shape:

```html
<div role="group" interop-group="attached" aria-label="Save">
  <button interop-button type="button">Save</button>
  <button interop-button="icon" type="button" command="toggle-popover" commandfor="save-more"
          aria-label="More save options"><svg interop-icon name="tabler-chevron-down"></svg></button>
  <div interop-popover popover id="save-more">…buttons with command="hide-popover"…</div>
</div>
```

## Attached

- Neighbors overlap by one button border, so the edge between them is one line.
- The corners where they meet are square (`0px` on the logical corner longhands).
  The outer corners keep the button's radius.
- A hovered or pressed button comes in front, so its edge shows whole. A button
  with the focus ring comes in front of both.
- Each button keeps its own Tab stop, focus ring, size and `disabled`.

## Split button

An attached group of an action, the button that opens its other choices, and
the popover of choices, written inside the group. No script:

- The popover sits inside the group so CSS can see it open:
  `:has(> [popover]:popover-open)`. CSS cannot follow `commandfor` to a sibling.
- While it is open, the trigger keeps the button's hover fill and takes the
  popover's edge color, and its end-end corner is square. The popover takes the
  same fill, frosted like every popover (75% with a 5px blur, opaque when the
  user asks for less transparency and in forced colors), has no gap from the trigger, lines up its
  inline-end with the trigger's (`block-end span-inline-start`), and squares its
  start-end corner. One token pair holds the open look:
  `--itx-group-open-background-color` (the button's hover fill) and
  `--itx-group-open-border-color` (`neutral-500`, 3:1).
- Where it does not fit, the popover flips to the other side. Its squared corner
  then sits away from the trigger. An anchored container query
  (`@container anchored(fallback: flip-inline)`, Chrome 155) sees the flip, but it
  styles only the popover's contents, not its own corners.
- The popover's top edge runs under the trigger, so a line separates them.
- The choices are flat: no fill or edge until the pointer is over one, which
  takes the button's active fill. They stack as wide as the widest, text at the
  start, at the house radius. The popover's padding is equal on every side, and
  its corner is the house radius plus that padding and its border. Forced colors draw their transparent borders, so they still read
  as buttons there.
- The group CSS loads after the popover CSS, because it sets the popover's tokens.

- `command="toggle-popover"` opens and closes the list.
- Chrome 155 exposes `expanded` on the trigger from the popover's state, with no
  `aria-expanded`. It adds no `haspopup`, so nothing says "menu", which is right
  for a list of buttons.
- Escape closes it and returns focus to the trigger. A choice with
  `command="hide-popover"` runs its click, closes the list, and returns focus to
  the trigger.

Accessibility rules:

- Two Tab stops. No single-stop Alt+Down model: it cannot be discovered, and
  screen reader virtual cursors can swallow the key.
- Name the trigger for what it offers ("More save options"). Not "Open menu",
  and not the action's own name, which Fluent v9 copies by default.
- The trigger is at least 24px wide; `interop-button="icon"` makes it as wide as
  the button is tall.
- The list is plain buttons: a disclosure. `role="menu"` would commit to the full
  APG menu keyboard. A menu component, if one comes, is shared by menu buttons
  and split buttons, and the split button stays a composition around it. Open
  UI's `<menulist>` would slot in there; Chrome has only an intent to prototype.
- There is no ARIA `splitbutton` role (w3c/aria#1670 is open since 2022), and
  nothing maps to Windows UIA SplitButton. A screen reader always hears two
  buttons; their names carry the relationship.
- Use one when one action is clearly the usual choice. Otherwise show separate
  buttons, or one button for all of them: in testing most people press only the
  larger half (NN/g; Calabro, 2025).

## Dev audit rules

| Rule | Flags |
|---|---|
| `group-role` | `div[interop-group]` without `role="group"` |
| `group-label` | A `div` group with no name, or a fieldset group with no legend |
| `group-attached-name` | A button in an attached group with a generic name ("Open menu", "Toggle dropdown", "More options"…) or its neighbor's name |

## Tests

- `src/audit.spec.ts`: each rule.
- `styles/forced-colors.spec.ts`: exempt, layout only; the buttons keep their own
  borders.
- Chrome 155:
  - Tab, Enter, Tab, Enter: the chevron opens the list, focus enters it, the
    choice runs, the list closes, and focus is back on the chevron.
  - The chevron's ring draws whole, in front of Save.
  - The accessibility tree shows `group "Save"`.
  - The page checks pass on the button and group pages.
- Not yet tested: whether screen readers say the group name on entry today, and
  Firefox and Safari.

## Not built

- `itx-size` on the group to size its buttons, as a toolbar does. Set it on each
  button.
- A menu component with `role="menu"` and the APG keyboard.
