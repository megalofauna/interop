# InteropChip — Mental Model Card

## Files

```
src/lib/components/interop-chip/
  interop-chip.token.ts                       InjectionToken + ChipFilterRef / ChipOptionRef interfaces
  public-api.ts                               barrel export
  interop-chip-filter/interop-chip-filter.ts  filter group (fieldset)
  interop-chip-option/interop-chip-option.ts  filter chip (label + hidden checkbox)
  interop-chip-list/interop-chip-list.ts      display chip list (ul)
  interop-chip-item/interop-chip-item.ts      individual display chip (li)
  interop-chip-badge/interop-chip-badge.ts    standalone inline chip (tag-agnostic)
  interop-chip-input/interop-chip-input.ts    free-form chip text entry (div)

src/lib/styles/components/chip.css                   structural rules (global)
src/lib/styles/themes/protocol/components/chip.css   token values (Protocol theme)
```

## Sub-components

### InteropChipFilter — `fieldset[interop-chip-filter]`

A semantically correct filter chip group built on a native `<fieldset>`. Filter chips are checkboxes — the group is `<fieldset>/<legend>`, each option is `<label>/<input type="checkbox">`. Zero custom ARIA, zero custom keyboard handling.

```html
<fieldset interop-chip-filter label="Size" [value]="sizes()" (valueChange)="sizes.set($event)">
  <label interop-chip-option value="xs">XS</label>
  <label interop-chip-option value="md">MD</label>
</fieldset>
```

Provides itself via `INTEROP_CHIP_FILTER` token so nested `InteropChipOption` instances can register and read selection state. Supports controlled mode via `[value]` + `(valueChange)`, or uncontrolled via internal `_selected` signal.

**Inputs:** `label` (required), `labelHidden`, `value`, `disabled`
**Outputs:** `valueChange`

### InteropChipOption — `label[interop-chip-option]`

The host **is** the `<label>`. A hidden `<input type="checkbox">` is projected inside it. All visual states are driven by data attributes (`data-checked`, `data-disabled`, `data-focused`) set from computed signals. Focus ring is applied to the host label via `:has(input:focus-visible)` — the input stays in the accessibility tree and receives native `:focus-visible`.

**Inputs:** `value` (required), `disabled`, `name`
**Injects:** `INTEROP_CHIP_FILTER` (optional) — notifies parent on change

### InteropChipList — `ul[interop-chip-list]`

Container for read-only display chips. The host **is** the `<ul>`. The VoiceOver + Safari strips `list` semantics from a `ul` with `list-style: none` — `role="list"` is explicitly restored in the host binding.

Requires `aria-label` or `aria-labelledby` (dev-mode warning if absent).

**Inputs:** `disabled`

### InteropChipItem — `li[interop-chip-item]`

Individual display chip. The host **is** the `<li>`. When `[removable]="true"`, a `<button type="button" aria-label="Remove [label]">` is projected inside the `<li>`. The chip text itself is not interactive.

**Inputs:** `label` (required), `removable`, `disabled`
**Outputs:** `removed`

**Data attributes on host:** `data-removable`, `data-disabled`

### InteropChipBadge — `[interop-chip-badge]`

A standalone, inline-friendly chip for single-use cases. The selector is **tag-agnostic** — the badge can sit on any inline-appropriate element (`<span>`, `<output>`, `<mark>`, `<div>`, etc.). Non-interactive by design: no remove button, no disabled state, no inputs. If you need a removable single chip, use a one-item `<ul interop-chip-list>` instead — that's *a list of one*, semantically distinct from *a badge*.

```html
<p>Build: <span interop-chip-badge>v0.1.0</span></p>
<h2>Cargo bay <span interop-chip-badge>operational</span></h2>
```

**Why not just use a one-item chip-list?**
- A `<ul>` is block-level; a badge needs to sit inline within prose.
- A one-item list announces "list, 1 item" — an *over*claim if the chip is just a status label, not a list.
- No `aria-label` required (nothing to label); no list wrapper required.
- Removes the "list of one" UX smell ("this could be more").

Visual paint reuses the shared `--itx-chip-*` family. The badge defaults to a smaller scale by overriding `--itx-chip-sizing-multiplier` to `1` on its own selector.

**Inputs:** none — presentational.

### InteropChipInput — `div[interop-chip-input]`

Free-form text entry that converts input into chips. Implements the Gmail To: field pattern. Implements `ControlValueAccessor` — usable with `ngModel` or `formControlName`.

**Backspace state machine:**
- Backspace + text → native delete character (not intercepted)
- Backspace + empty input → focus last chip remove button (do NOT delete)
- Backspace/Delete on chip button → remove chip, focus adjacent chip or input

**Inputs:** `placeholder`, `value`, `disabled`, `separators`, `maxChips`
**Outputs:** `valueChange`

Blur commits pending text as a chip. Arrow keys navigate between chip remove buttons.

## CSS architecture

Follows the two-file split per `css-strategy.md`:

- **Structural** (`chip.css`): layout, display, state activation selectors, all inside `:where()` for zero specificity
- **Theme** (`protocol/components/chip.css`): token values only, scoped to `:where([interop-root])`

No per-component `styleUrl` — all rules are globally imported. Components have no Angular view encapsulation CSS.

## Shared token system

`--itx-chip-*` tokens are shared across chip-option, chip-item, and the chips inside chip-input. This means one set of token overrides styles all chip-shaped elements:

```css
.my-context {
  --itx-chip-bg:     var(--itx-surface-elevated);
  --itx-chip-radius: var(--itx-radius-md);
}
```

Sub-component-specific tokens (`--itx-chip-filter-*`, `--itx-chip-input-*`) override the shared tokens for that context only.

## State activation pattern

A single shared base rule paints every chip-shaped element using the public `--itx-chip-*` tokens. State rules on `chip-option` re-define those same cascading tokens — the base rule's `var(--itx-chip-*)` reads the new value automatically, so no private slots are needed.

```css
/* shared base: paint every chip from the public tokens */
:where(
  label[interop-chip-option],
  li[interop-chip-item],
  [interop-chip-badge],
  div[interop-chip-input] .itx-chip
) {
  background: var(--itx-chip-background, transparent);
  /* … border, color, padding, etc. */
}

/* hover: re-define cascading token; base picks up the new value */
:where(label[interop-chip-option]:hover:not([data-disabled])) {
  --itx-chip-background: var(--itx-chip-background-hover, var(--itx-surface-hover));
}

/* checked: same pattern */
:where(label[interop-chip-option][data-checked]) {
  --itx-chip-background: var(--itx-chip-background-selected, var(--itx-chip-accent));
}
```

The remove button on `chip-item` still uses a private `--_remove-border` slot because two distinct state rules (`hover` and `:has(:focus-visible)`) need to swap its value.

## Remove button — hover/focus state design (chip-item)

The remove button border is the one interactive affordance on the chip item. The correct hover/focus interaction:

| State | `--_remove-border` |
|---|---|
| Default | `var(--itx-chip-remove-border, var(--itx-border))` |
| Chip hovered, button NOT focused | `2px solid var(--itx-chip-accent)` |
| Button focused | `2px solid transparent` (outline ring is the indicator) |

The `--_remove-border` private slot is set on the `li` and inherited by the button. The hover rule uses `:not(:has(.itx-chip-remove:focus-visible))` to exclude the focused case — the two rules are mutually exclusive, but the focus rule is also placed after the hover rule in the CSS so it wins at equal zero specificity if both were to match.

The `li[interop-chip-item]` element itself is NOT focusable. Using `:focus-visible` or `:focus` on the `<li>` would never fire. `:has(.itx-chip-remove:focus-visible)` is the correct selector for detecting button focus.

## Sizing

Chips ship at a single fixed size. Padding is computed from `--itx-chip-padding-step × --itx-chip-sizing-multiplier` (theme defaults: `0.1875rem × 1.25`). `chip-badge` overrides the multiplier to `1` on its own selector for an intrinsically smaller inline-prose appearance.

To bypass the formula entirely, override `--itx-chip-padding` or `--itx-chip-radius` directly. Border-radius defaults to `var(--itx-radius-full)` (pill); set `--itx-chip-radius` locally to change it.

## Token reference

### Shared chip tokens (set on any ancestor, e.g. `[interop-root]`)

| Token | Default | Description |
|---|---|---|
| `--itx-chip-padding-step` | `0.1875rem` | Base unit for the padding formula |
| `--itx-chip-sizing-multiplier` | `1.25` | Multiplier; padding = step × mult, inline = block × 2 |
| `--itx-chip-background` | `transparent` | Background (all chip shapes) |
| `--itx-chip-color` | `inherit` | Text color |
| `--itx-chip-border` | `2px solid transparent` | Border |
| `--itx-chip-radius` | `var(--itx-radius-full)` | Border radius |
| `--itx-chip-padding` | *computed from multiplier* | Set to bypass the multiplier formula |
| `--itx-chip-font-size` | `var(--itx-font-size-caption)` | Font size |
| `--itx-chip-font-weight` | `inherit` | Font weight |
| `--itx-chip-line-height` | `1.4` | Line-box height (badge overrides to `1.2`) |
| `--itx-chip-gap` | `var(--itx-spacing-2)` | Internal gap |
| `--itx-chip-background-hover` | `var(--itx-surface-hover)` | Hover background |
| `--itx-chip-color-hover` | `inherit` | Hover text color |
| `--itx-chip-accent` | `var(--itx-colorway)` | Selected/checked background |
| `--itx-chip-on-accent` | `var(--itx-on-colorway)` | Text on selected background |
| `--itx-chip-disabled-opacity` | `0.4` | Disabled opacity |
| `--itx-chip-transition-duration` | `120ms` | Transition duration |
| `--itx-chip-transition-timing-function` | `ease` | Transition timing |
| `--itx-chip-list-gap` | `0.375rem` | Gap between chips in a chip-list |

### chip-option tokens

| Token | Description |
|---|---|
| `--itx-chip-background-selected` | Checked background (default: `--itx-chip-accent`) |
| `--itx-chip-color-selected` | Text color when checked (default: `--itx-chip-on-accent`) |
| `--itx-chip-border-selected` | Border when checked (default: base border) |
| `--itx-chip-font-weight-selected` | Font weight when checked |
| `--itx-chip-outline-color` | Focus ring color (default: `--itx-chip-accent`) |
| `--itx-chip-outline-width` | Focus ring width (default: `2px`) |
| `--itx-chip-outline-style` | Focus ring style (default: `solid`) |
| `--itx-chip-outline-offset` | Focus ring offset (default: `2px`) |

### chip-item tokens (set on `li[interop-chip-item]`)

| Token | Description |
|---|---|
| `--itx-chip-item-gap` | Gap between label text and remove button |
| `--itx-chip-padding-removable` | Padding when remove button is present (asymmetric). Defaults to the multiplier formula; override for absolute values. |
| `--itx-chip-remove-background` | Remove button background |
| `--itx-chip-remove-border` | Remove button border (rest state) |
| `--itx-chip-remove-border-hover` | Remove button border when chip is hovered |
| `--itx-chip-remove-radius` | Remove button border radius |
| `--itx-chip-remove-font-size` | Remove button icon size (default: `0.875rem`) |
| `--itx-chip-remove-padding` | Remove button padding |
| `--itx-chip-remove-width` | Remove button width |
| `--itx-chip-remove-outline-color` | Focus ring color on remove button |
| `--itx-chip-remove-outline-width` | Focus ring width on remove button (default: `3px`) |
| `--itx-chip-remove-outline-offset` | Focus ring offset on remove button (default: `3px`) |

### chip-filter tokens (set on `fieldset[interop-chip-filter]`)

| Token | Description |
|---|---|
| `--itx-chip-filter-background` | Filter container background |
| `--itx-chip-filter-border` | Filter container border |
| `--itx-chip-filter-radius` | Filter container border radius |
| `--itx-chip-filter-padding` | Filter container padding |
| `--itx-chip-surface` | Semantic fallback for filter background |

### chip-badge tokens

The badge has **no per-component tokens** — it expresses its smaller default by overriding `--itx-chip-sizing-multiplier` to `1` and `--itx-chip-line-height` to `auto` on its own selector. Reuses the shared `--itx-chip-*` family for everything else.

### chip-input tokens (set on `div[interop-chip-input]`)

| Token | Description |
|---|---|
| `--itx-chip-input-background` | Container background |
| `--itx-chip-input-border` | Container border |
| `--itx-chip-input-radius` | Container border radius |
| `--itx-chip-input-gap` | Gap between chips and text input |
| `--itx-chip-input-padding` | Container padding |
| `--itx-chip-input-min-height` | Minimum container height |
| `--itx-chip-input-outline-color` | Focus ring color (`focus-within`) |
| `--itx-chip-input-outline-width` | Focus ring width (default: `2px`) |
| `--itx-chip-input-outline-style` | Focus ring style (default: `solid`) |
| `--itx-chip-input-outline-offset` | Focus ring offset (default: `1px`) |
| `--itx-chip-input-chip-gap` | Gap inside individual chips in the input |
| `--itx-chip-input-remove-font-size` | Remove button icon size inside chip-input |

## Known design decisions

- **Why checkboxes, not ARIA listbox**: Every major library uses ARIA listbox/grid and ships custom keyboard handling + known AT inconsistencies. Native checkboxes solve focus, keyboard (Tab+Space), form submission, and AT announcement for free with zero JS.
- **Why no view encapsulation**: Follows the Interop CSS strategy — global CSS is the styling engine, components carry no styles. CSS-only consumers get chip styling without importing Angular components.
- **Chip-input vs chip-list/item**: The chips rendered inside `div[interop-chip-input]` are internal implementation detail (not `li[interop-chip-item]` elements). They reuse the `--itx-chip-*` token family but have different markup and a smaller remove button.
