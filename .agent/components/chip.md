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
  --itx-chip-background: var(--itx-neutral-3);
  --itx-chip-radius: var(--itx-radius-md);
}
```

Sub-component-specific tokens (`--itx-chip-filter-*`, `--itx-chip-input-*`) override the shared tokens for that context only.

## Visual language

Proportions and paint are borrowed from IBM Carbon's Tag component, remapped onto Interop's 4px spacing scale. See `.agent/workflows/carbon-borrow.md` for the procedure and the Carbon → Interop conversion table.

Carbon's variant vocabulary maps onto the existing sub-components without renaming anything:

| Carbon / docs term | Interop shape |
|---|---|
| presentational (Carbon: "read-only") | `li[interop-chip-item]` without `[removable]`, or `[interop-chip-badge]` |
| dismissible | `li[interop-chip-item][removable]` |
| selectable | `label[interop-chip-option]` inside a `chip-filter` |

Carbon's fourth variant, *operational* (a tag that acts as a button opening a popover), has no Interop equivalent and was skipped. Colour variants are deferred — chips are neutral-only.

The three shapes differ in paint:

- **presentational / dismissible** — solid fill, **no border at all**. Dropping the border is most of what makes the shape read as Carbon.
- **selectable** — the one outlined variant: transparent fill with a hairline border, flipping to an inverse fill (`--itx-neutral-12` on `--itx-neutral-1`) when checked. Neutral by design; set `--itx-chip-background-selected` / `--itx-chip-color-selected` to brand it.

Focus rings keep `--itx-colorway` throughout — focus is the one place brand survives an otherwise neutral component.

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
  background: var(--itx-chip-background);
  /* … border, color, padding, etc. */
}

/* variant mapping — must come BEFORE the state rules */
:where(label[interop-chip-option]) {
  --itx-chip-background: var(--itx-chip-selectable-background);
  --itx-chip-background-hover: var(--itx-chip-selectable-background-hover);
}

/* hover: re-define cascading token; base picks up the new value */
:where(label[interop-chip-option]:hover:not([data-disabled])) {
  --itx-chip-background: var(--itx-chip-background-hover);
}

/* checked: same pattern */
:where(label[interop-chip-option][data-checked]) {
  --itx-chip-background: var(--itx-chip-background-selected);
}
```

### Why the variant paint lives in the foundation file

`interop.css` declares `@layer interop.foundation, interop.theme`, so **the theme outranks the foundation at any specificity**. If the theme wrote `--itx-chip-background` directly on `label[interop-chip-option]`, it would beat the foundation's `:hover` rule for that same token and hover would silently stop working.

The rule that keeps this safe: the theme only writes chip tokens on **`[interop-root]`** (an ancestor — elements inherit the value, and an inherited value always loses to a declaration on the element itself). Where a variant needs different base paint, the theme exposes a named ancestor-level token (`--itx-chip-selectable-*`) and the foundation maps it onto the element, ordered before the state rules. Element-level exceptions in the theme (`chip-badge`, `chip-input`, the size axis) are safe only because the foundation never writes those same tokens on those same elements.

## Remove button (dismissible)

**One rule set serves both dismissible hosts.** A `li[interop-chip-item][removable]` and a `.itx-chip` inside `chip-input` are the same variant on two different elements, so the foundation keys the rules off the *presence of a remove button* rather than a per-host attribute:

```css
:where(li[interop-chip-item], .itx-chip):where(:has(.itx-chip-remove)) { padding-inline-end: 0; }
:where(.itx-chip-remove) { /* … */ }
```

A chip that contains a remove button IS dismissible, wherever it lives. This replaced two hand-maintained copies that had drifted three separate times — a wrong class name (`humb`), a forked `--itx-chip-input-remove-font-size`, and a `--itx-chip-input-remove-radius` that was read but never declared (leaving square corners on an otherwise rounded chip). If you find yourself writing a chip-input-specific paint or layout rule, that's the smell: the rule almost certainly belongs to the shared dismissible set.

The unscoped `.itx-chip-remove` / `.itx-chip-label` / `.itx-chip` selectors are deliberate. Those classes are only ever emitted by chip components, and keeping them unscoped means a CSS-only consumer replicating the markup gets the styling for free — the same goal that motivates having no view encapsulation.

The button is a square of `var(--itx-chip-height)` sitting at the chip's inline end behind its own `--itx-chip-remove-margin`; the chip gives up its end padding so it lands flush. No border — the chip is already a solid fill, so the button announces itself by deepening its background on hover rather than by drawing an edge. Its focus ring is **inset** (`outline-offset: -2px`) so the indicator stays inside the chip instead of orbiting it.

The button sizes itself from `var(--itx-chip-height)` directly rather than owning a token, so it tracks the size axis for free. Note the `var()` resolution rule that forces this: `--a: var(--b)` resolves `--b` at the element where `--a` is *declared*, so a `--itx-chip-remove-size: var(--itx-chip-height)` declared on `[interop-root]` would freeze at 32px and ignore every downstream size override.

The `li[interop-chip-item]` element itself is NOT focusable. Using `:focus-visible` or `:focus` on the `<li>` would never fire; `:has(.itx-chip-remove:focus-visible)` is the correct selector for detecting button focus.

## Sizing

Chips ship two steps on the `itx-size` axis. Height is stated, not derived — a chip is a fixed-height pill whose label rides centred, so `padding-block` is zero and `--itx-chip-height` alone drives the axis.

| `itx-size` | Height | Padding-inline | Radius | Carbon equivalent |
|---|---|---|---|---|
| `md` (default) | 32px (`--itx-spacing-8`) | 12px (`--itx-spacing-3`) | 12px (`--itx-radius-lg`) | large |
| `sm` | 24px (`--itx-spacing-6`) | 12px (`--itx-spacing-3`) | 8px (`--itx-radius-md`) | medium |

A step is a **bundle** — height, inline padding, radius, and the remove button's matching radius. `chip-badge` and `chip-input` join the `sm` selector list with `:not([itx-size])` rather than re-declaring anything, so a shape can't pick up three of the four values when the bundle grows.

### Vocabulary vs. assignment

`md` has **two legitimate declaration sites**, and both are load-bearing:

| Site | Why it exists |
|---|---|
| `[interop-root]` | The *inherited* default. A bare chip must declare no size of its own — otherwise it shadows the container trying to size it, and `<ul interop-chip-list itx-size="sm">` stops reaching its `<li>`s. |
| the `[itx-size="md"]` rule | The *explicit* override — so `chip-badge`/`chip-input` can opt up from their `sm` default, and so a chip can re-assert `md` inside an `sm` container. |

Neither is removable, and the second can't reference the first (`--itx-chip-padding-inline: var(--itx-chip-padding-inline)` is a cycle). So the values live under their own names and every assignment site points at them:

```css
:where([interop-root]) {
  --itx-chip-md-padding-inline: var(--itx-spacing-3);   /* vocabulary — stated once */
  --itx-chip-padding-inline: var(--itx-chip-md-padding-inline);   /* default assignment */
}
:where(… [itx-size="md"]) {
  --itx-chip-padding-inline: var(--itx-chip-md-padding-inline);   /* override assignment */
}
```

**No size rule ever states a literal.** Assignment can still drift; values cannot. This is what stopped `md` from silently ending up on `--itx-spacing-4` at the root while the size rule said `--itx-spacing-3`.

The step tokens double as the retuning seam. Setting `--itx-chip-md-padding-inline` on any ancestor retunes every `md` chip beneath it; setting `--itx-chip-padding-inline` there does nothing, because the size rules declare that one *on the element* and an inherited value always loses. Same for `-height` and `-radius`. Tokens outside the bundle (`--itx-chip-min-width`, `--itx-chip-gap`, all paint) stay ancestor-tunable as normal.

The label is `0.75rem` at both steps — Carbon holds `$label-01` across all sizes, so the axis moves the box and never the type. It is a fixed rem, not an `--itx-font-size-*` role token, because those are fluid `clamp()` values and a fluid label inside a fixed-height box overflows it (`button.css` set the same precedent).

Carbon's third step (18px) was skipped: it lands off the 4px grid, and it puts dismissible and selectable chips under the WCAG 2.2 SC 2.5.8 minimum target size of 24×24 CSS px.

The attribute works on a chip **or on any chip container** — `chip-list`, `chip-filter`, `chip-input` — because the size tokens cascade to every chip inside. Always put it on the container, never on a descendant selector like `div[interop-chip-input][itx-size="sm"] .itx-chip`: tokens set on a child can't be read by the parent, so the container's own chrome would be left behind.

Border-radius defaults to `var(--itx-radius-full)` (pill); set `--itx-chip-radius` locally to change it.

### Truncation — deferred

Carbon caps a tag at 208px (13rem, exactly `--itx-spacing-52`) and ellipsises the overflow. `--itx-chip-max-width` exists and defaults to `none`. Enabling ellipsis on `chip-item` needs a `<span class="itx-chip-label">` wrapper in its template — its content currently projects as a bare text node, which becomes an anonymous flex item that `text-overflow` cannot target. `chip-input` already has that wrapper and already truncates.

## Token reference

### Shared chip tokens (set on any ancestor, e.g. `[interop-root]`)

| Token | Default | Description |
|---|---|---|
| `--itx-chip-md-height` | `var(--itx-spacing-8)` — 32px | md step vocabulary; retune here, not on `--itx-chip-height` |
| `--itx-chip-md-padding-inline` | `var(--itx-spacing-3)` — 12px | md step vocabulary |
| `--itx-chip-md-radius` | `var(--itx-radius-lg)` — 12px | md step vocabulary |
| `--itx-chip-sm-height` | `var(--itx-spacing-6)` — 24px | sm step vocabulary |
| `--itx-chip-sm-padding-inline` | `var(--itx-spacing-2)` — 8px | sm step vocabulary |
| `--itx-chip-sm-radius` | `var(--itx-radius-md)` — 8px | sm step vocabulary |
| `--itx-chip-height` | `var(--itx-chip-md-height)` | Assigned by the size axis; `padding-block` is always `0` |
| `--itx-chip-padding-inline` | `var(--itx-chip-md-padding-inline)` | Assigned by the size axis |
| `--itx-chip-min-width` | `var(--itx-spacing-8)` — 32px | Carbon's floor; keeps 1–2 char chips from collapsing |
| `--itx-chip-max-width` | `none` | Carbon caps at `13rem`; see *Truncation — deferred* |
| `--itx-chip-gap` | `var(--itx-spacing-4)` — 16px | Internal gap; zeroed on the dismissible hosts, where the remove button's own margin does the spacing |
| `--itx-chip-radius` | `var(--itx-chip-md-radius)` | Assigned by the size axis |
| `--itx-chip-font-size` | `0.75rem` | Carbon `$label-01`; fixed, not fluid |
| `--itx-chip-font-weight` | `400` | Font weight |
| `--itx-chip-line-height` | `1.3333` | 16/12 — Carbon `$label-01` |
| `--itx-chip-background` | `var(--itx-colorway-6)` | Fill (presentational + dismissible) |
| `--itx-chip-color` | `var(--itx-colorway-12)` | Text color |
| `--itx-chip-border` | `none` | Border — Carbon's filled tags have none |
| `--itx-chip-background-hover` | `var(--itx-neutral-5)` | Hover background |
| `--itx-chip-color-hover` | `var(--itx-neutral-12)` | Hover text color |
| `--itx-chip-disabled-opacity` | `0.4` | Disabled opacity |
| `--itx-chip-transition-duration` | `120ms` | Transition duration |
| `--itx-chip-transition-timing-function` | `ease` | Transition timing |
| `--itx-chip-list-gap` | `var(--itx-spacing-2)` — 8px | Gap between chips in a chip-list |

### chip-option tokens (selectable)

The `--itx-chip-selectable-*` family is read on `[interop-root]` and mapped onto the element by the foundation — see *Why the variant paint lives in the foundation file*.

| Token | Default | Description |
|---|---|---|
| `--itx-chip-selectable-background` | `var(--itx-neutral-5)` | Rest fill |
| `--itx-chip-selectable-color` | `var(--itx-neutral-12)` | Rest text color |
| `--itx-chip-selectable-border` | `2px solid transparent` | Reserves the border box so checking doesn't shift layout |
| `--itx-chip-selectable-background-hover` | `var(--itx-neutral-6)` | Hover fill |
| `--itx-chip-selectable-color-hover` | `var(--itx-neutral-12)` | Hover text color |
| `--itx-chip-background-selected` | `var(--itx-colorway-6)` | Checked background |
| `--itx-chip-color-selected` | `var(--itx-colorway-12)` | Checked text color |
| `--itx-chip-border-selected` | `2px solid var(--itx-colorway-10)` | Checked border |
| `--itx-chip-font-weight-selected` | `400` | Checked font weight |
| `--itx-chip-outline-color` | `var(--itx-colorway)` | Focus ring color |
| `--itx-chip-outline-width` | `2px` | Focus ring width |
| `--itx-chip-outline-style` | `solid` | Focus ring style |
| `--itx-chip-outline-offset` | `2px` | Focus ring offset |

### Remove button tokens (both dismissible hosts)

Set on `[interop-root]` so both dismissible contexts read them. The button's box is always `var(--itx-chip-height)` square — it has no size token of its own.

| Token | Default | Description |
|---|---|---|
| `--itx-chip-remove-background` | `var(--itx-colorway-5)` | Rest background |
| `--itx-chip-remove-background-hover` | `var(--itx-neutral-5)` | Hover background |
| `--itx-chip-remove-border` | `none` | Border |
| `--itx-chip-remove-radius` | `var(--itx-chip-radius)` | Tracks the chip's own radius through the size bundle |
| `--itx-chip-remove-margin` | `0 0 0 var(--itx-spacing-2)` | Separates the button from the label; replaces an internal chip gap |
| `--itx-chip-remove-font-size` | `var(--itx-spacing-4)` — 16px | Glyph size — Carbon's icon size |
| `--itx-chip-remove-outline-color` | `var(--itx-colorway)` | Focus ring color |
| `--itx-chip-remove-outline-width` | `2px` | Focus ring width |
| `--itx-chip-remove-outline-offset` | `-2px` | Inset, so the ring stays inside the chip |

### Dismissible host tokens (`li[interop-chip-item]`, `div[interop-chip-input]`)

| Token | Default | Description |
|---|---|---|
| `--itx-chip-gap` | `0` | Overrides the shared gap — the remove button's margin does the spacing instead |

### chip-filter tokens (set on `fieldset[interop-chip-filter]`)

| Token | Default | Description |
|---|---|---|
| `--itx-chip-filter-background` | `transparent` | Filter container background |
| `--itx-chip-filter-border` | `none` | Filter container border |
| `--itx-chip-filter-radius` | `0` | Filter container border radius |
| `--itx-chip-filter-padding` | `0` | Filter container padding |
| `--itx-chip-filter-gap` | `var(--itx-spacing-2)` — 8px | Gap between options |

### chip-badge tokens

The badge has **no tokens of its own**. It expresses its inline-prose smallness by joining the `sm` selector list as `[interop-chip-badge]:not([itx-size])` — the same bundle every other `sm` chip gets, not a private copy. An explicit `itx-size` still wins. Everything else comes from the shared `--itx-chip-*` family.

### chip-input tokens (set on `div[interop-chip-input]`)

The container joins the `sm` step the same way the badge does, so the field stays 40px tall and its chips are indistinguishable from dismissible chip-items. Only the field's own chrome lives here — **the chips inside own no tokens at all**.

| Token | Default | Description |
|---|---|---|
| `--itx-chip-input-background` | `transparent` | Container background |
| `--itx-chip-input-border` | `1px solid var(--itx-border)` | Container border |
| `--itx-chip-input-radius` | `var(--itx-chip-radius)` | Container border radius — tracks its own chips |
| `--itx-chip-input-gap` | `var(--itx-spacing-1)` | Gap between chips and text input |
| `--itx-chip-input-padding` | `var(--itx-spacing-1) var(--itx-spacing-2)` | Container padding |
| `--itx-chip-input-min-height` | `var(--itx-spacing-10)` — 40px | Minimum container height |
| `--itx-chip-input-outline-color` | `var(--itx-colorway)` | Focus ring color (`focus-within`) |
| `--itx-chip-input-outline-width` | `2px` | Focus ring width |
| `--itx-chip-input-outline-style` | `solid` | Focus ring style |
| `--itx-chip-input-outline-offset` | `1px` | Focus ring offset |

## Known design decisions

- **Why checkboxes, not ARIA listbox**: Every major library uses ARIA listbox/grid and ships custom keyboard handling + known AT inconsistencies. Native checkboxes solve focus, keyboard (Tab+Space), form submission, and AT announcement for free with zero JS.
- **Why no view encapsulation**: Follows the Interop CSS strategy — global CSS is the styling engine, components carry no styles. CSS-only consumers get chip styling without importing Angular components.
- **Chip-input vs chip-list/item**: The chips rendered inside `div[interop-chip-input]` are internal implementation detail (not `li[interop-chip-item]` elements). They reuse the `--itx-chip-*` token family and the same flush remove button, but have their own markup and keyboard handling.
- **Why the sizing formula was deleted**: The old `--itx-chip-padding-step × --itx-chip-sizing-multiplier` model could not express "height 32, padding-inline 12" — the shape Carbon states directly — and the theme had already begun routing around it. Height is now stated, not derived. This was the one structural change the Carbon borrow required; see `.agent/workflows/carbon-borrow.md`.
