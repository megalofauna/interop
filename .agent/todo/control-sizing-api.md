# Plan — a standard sizing axis for Interop controls

**Status:** plan only, no code
**Raised:** 2026-08-18, from `interop-field`'s `itx-size` and the question of
which other controls should mirror it
**Depends on:** nothing. Independent of the color work.

---

## 1. What we already have

The height ladder is **already coherent** where it exists. That is the useful
surprise — this is not a rescue, it is a completion.

| component | steps | ladder | what the step varies |
|---|---|---|---|
| button | xs sm md lg xl | 24 / 32 / 40 / 48 / 64 | height, font-size, padding-inline |
| table | sm md lg xl | 32 / 40 / 48 / 64 | row-block-size, cell-padding, vertical-align |
| field (input + textarea) | sm md lg | 32 / 40 / 48 | height |
| segmented-control | sm md lg | — | padding-block, padding-inline |
| chip | sm md | — | height, padding-inline, **radius**, remove-radius |
| progress | sm md | — | thickness |
| rig (checkbox + radio) | sm only | — | gap, control-gap |

Every height lands on `--itx-spacing-6 / -8 / -10 / -12 / -16` = 24/32/40/48/64,
which is Carbon's ladder exactly. Nothing needs re-numbering.

**Four real inconsistencies, though:**

1. **`segmented-control` varies padding but not height.** So an `itx-size="md"`
   segmented control does not line up with an `itx-size="md"` field beside it —
   which is the entire promise of a shared size vocabulary.
2. **`chip` varies radius with size.** Shape is a different axis with its own
   global knob (`--itx-radius`). A size step that also changes corner rounding
   makes `itx-size` and `itx-radius` fight, and violates "one value, one home".
3. **`table`'s default is `lg`; everything else defaults to `md`.** Faithful to
   Carbon (its data table default is `lg`), but it means "the default" is not a
   fixed point in our own vocabulary.
4. **The shared rig shell ships only `sm`.** That is a modifier wearing a scale's
   clothes — there is no `md` to return to.

---

## 2. Precedent

### Carbon — verified from source, not from the docs site

Read from `carbon-design-system/carbon@main`, `packages/react/src/components/*`:

| component | `size` values |
|---|---|
| Button | `xs` `sm` `md` `lg` `xl` `2xl` |
| DataTable `Table` | `xs` `sm` `md` `lg` `xl` |
| TextInput / Select / Dropdown | `sm` `md` `lg` |
| Tag | `sm` `md` `lg` |
| ContentSwitcher | `sm` `md` `lg` |
| Accordion | `sm` `md` `lg` |
| TabList | `sm` `md` (line) · `sm` `md` `lg` (contained) |
| Toggle | `sm` `md` |
| ProgressBar | **`small` `big`** — off-vocabulary, see below |

**No `size` prop at all:** Checkbox, RadioButton, Slider, ToastNotification,
InlineNotification.

Two things worth lifting from that table beyond the values:

- **Carbon v11 standardized this deliberately.** v10 had `field` / `medium` /
  `short` as size names across different components; v11 collapsed them onto
  `sm`/`md`/`lg`/`xl` with `md` (40px) as the default. The migration guide
  treats the old names as a defect. We should not reintroduce that class.
- **ProgressBar still says `small`/`big`.** Carbon's own leftover. Interop
  already normalized progress to `sm`/`md`, so we are ahead of the precedent
  here — worth keeping and worth noting in the Carbon ledger.

### Angular Material — a different model entirely

Material does not put a `size` prop on components. It has one **global density
scale** (`0, -1, -2, -3, -4, -5`) set in the theme, read by components via
`get-theme-density`.

The rule attached to it is the most useful sentence in either system:

> Density customizations do not affect components that appear in task-based or
> pop-up contexts, such as the date picker — Material Design density guidance
> explicitly discourages density changes for such interactions, because they
> don't compete for space in the application's layout.

That is a **test**, not a taste. It is the argument this plan uses in §3.

---

## 3. The case against sizing — per component, on evidence

The question is not "can this be made smaller" (anything can) but "does this
control compete for space in the layout, such that a consumer trading comfort
for density is a legitimate design act?"

### Should NOT gain a size axis

| component | why not |
|---|---|
| **checkbox, radio, visimorph** | Carbon gives neither a `size`. The binding reason is the hit target: WCAG 2.2 SC 2.5.8 sets a 24×24 CSS px minimum, and the visimorph box is already near it. A `sm` step either breaks the floor or is a lie (a smaller box with the same padded target), and a `lg` step buys nothing since the label carries the width. The **row spacing** is the real density lever, and that is the rig shell.s job — see §5. |
| **slider** | No `size` in Carbon. The track is a measurement instrument, not a control surface; the thumb is a drag target governed by the same 24px floor. Thickness is already a theme token for anyone who wants it. |
| **toast** | No `size` in Carbon. Fails Material's test outright — a toast is in the top layer and competes for space with nothing. |
| **tooltip, popover, dialog** | Pop-up context, the exact exclusion Material names. Dialog *width* is a separate axis (Carbon sizes modals by width, not height) and should not be spelled `itx-size` if we ever add it. |
| **badge, indicator, callout, scroll-area** | Not controls. Badge and indicator size off the type they sit in; a callout is a block of prose; a scroll-area is a viewport. |
| **terminal, code-renderer, content** | Content-driven. The meaningful axis is font-size, which typography already owns. |
| **tree, stepper** | Carbon gives neither a size. Both are navigational structures whose row height should follow the global rhythm, not a per-instance knob. Revisit only if a real cramped-sidebar case appears. |

### Should gain a size axis

| component | precedent | steps |
|---|---|---|
| **listbox** | Carbon Dropdown / ComboBox `sm md lg` | `sm md lg` |
| **expansion-panel** | Carbon Accordion `sm md lg` | `sm md lg` |
| **tabs** | Carbon TabList `sm md` | `sm md` |
| **toggle** | Carbon Toggle `sm md` | `sm md` |

Each of these is a control that sits in a form or a dense panel next to a field
or a button, which is precisely when a shared step matters.

### And the case against doing any of this

Worth stating plainly, because it is not obviously wrong:

Every size step is a permanent combinatorial cost — it multiplies with variant,
state, colorway, and `prefers-contrast`, and it is a public API we cannot
withdraw. Four new components × three steps is twelve new documented
configurations to keep visually true. The counter-argument is that the ladder
**already exists** and is already coherent, so the marginal cost here is a
handful of token declarations rather than a new system; and the failure mode of
*not* doing it is worse and already visible — a `md` segmented control that does
not line up with the `md` field next to it. Completing a half-built axis is
cheaper than living with it half-built.

---

## 4. The standard API surface

### Vocabulary

`xs` `sm` `md` `lg` `xl` — and nothing else. No `small`, no `big`, no `compact`,
no `dense`. Carbon's v11 migration exists because those names were allowed once.

### The ladder is shared and fixed

| step | height | token |
|---|---|---|
| `xs` | 24px | `--itx-spacing-6` |
| `sm` | 32px | `--itx-spacing-8` |
| `md` | 40px | `--itx-spacing-10` |
| `lg` | 48px | `--itx-spacing-12` |
| `xl` | 64px | `--itx-spacing-16` |

A component picks a **contiguous subrange**. No gaps, ever — `sm` + `lg` without
`md` is not a scale.

### Six rules

1. **`md` is always the default**, and always identical to the no-attribute
   rendering. A component whose natural default is not 40px does not get to
   redefine `md`; it declares the subrange that contains its default.
   *(Consequence: `table` needs a decision — see §6.)*
2. **A size step may vary only: the primary metric (height / row-height /
   thickness), padding, and font-size.** Never radius, color, border-width,
   motion, or elevation. Those are other axes with their own knobs.
   *(Consequence: `chip` must stop varying radius.)*
3. **The attribute lands on the component host**, and the theme block is scoped
   to that host — the shape `field.css` already uses. Not the bare root: a size
   is per-instance by definition, so a root declaration is meaningless and
   would bake.
4. **Size never breaches the touch-target floor.** The coarse-pointer floor
   button already applies (`--itx-button-touch-target`) generalizes to every
   sized control; an `xs` or `sm` step must still meet 24×24 under a coarse
   pointer.
5. **Attribute, not Angular input.** `itx-*` is system configuration and stays
   framework-free, per the naming convention. A CSS-only consumer gets sizing
   from markup alone, and it survives the eventual move off Angular.
6. **Every sized component documents its subrange in one table**, generated —
   not prose per component page.

### Enforcement

A guard (`scripts/check-size.mjs`) can mechanically check 1, 2 and the ladder:
parse every `[itx-size="…"]` block, assert the value is in the vocabulary, the
subrange is contiguous, the declared tokens fall in the allowed set, and any
height reads a ladder token rather than a literal. This is the same shape as
`check-shape.mjs` and would have caught chip's radius drift.

---

## 5. Density is a separate question — do not conflate

Material's model (one global knob) and Carbon's (per-component prop) are not
rivals; they answer different questions. Per-component `itx-size` is right for
"this toolbar's buttons are small." A global knob is right for "this whole
application is dense."

We already have the mechanism for the second one — `[itx-scale-scope]`, which
rescales the radius and motion ramps for a subtree. A parallel
`[itx-size-scope="sm"]` that sets the *default* step for every control beneath it
is the natural extension, and it is what `choice-rig`'s row spacing actually
wants rather than a `sm`-only modifier.

**Deliberately deferred.** It needs the co-declaration treatment (the default
would have to be re-declared at every scope boundary, exactly like `--itx-radius`
on `[itx-scale-scope]`), and it should not be designed until the per-component
axis is consistent. Recorded here so it is not reinvented.

---

## 6. Decisions — settled 2026-08-18

1. **`table` defaults to `md`.** SETTLED: re-map so `md` (40px) is the default,
   consistent with every other control. Carbon's data table defaults to `lg`;
   we deviate deliberately, because a fixed default is worth more than fidelity
   to one Carbon component. Breaking visual change to every table — every row
   gets 8px shorter. If it reads badly in practice, adjust then.

2. **`chip` radius — likely moot.** Chips are planned to become pills, which
   makes radius a fixed property of the shape rather than a size step, and rule
   2 stops being a constraint anyone notices. HOLD until the pill work lands;
   if it slips, remove radius from the size step on its own.

3. **`segmented-control` conforms fully.** SETTLED: it takes height on the
   shared ladder like its compatriots, not padding alone. This is the whole
   point of the axis — a `md` segmented control must line up with a `md` field
   and a `md` button. Breaking visual change.

4. **`choice-rig`'s `sm`.** OPEN, and blocked on a prior question: "choice rig"
   is a name a migration agent coined for the shared checkbox/radio-rig
   stylesheet on 2026-08-17. It is not a component, appears in no public
   documentation, and yet now owns 32 token declarations and 19 rows of the
   public token reference. Decide whether to keep the name, rename the tokens
   to the two element names that actually exist, or leave it — before deciding
   what its size axis means. Its `sm` is row-density anyway, which belongs to
   the `[itx-size-scope]` question in §5.

Items 1 and 3 are breaking visual changes and should land in one pass.

## 7. Sequence, when approved

1. Land the standard (this document, promoted to `.agent/sizing.md`) and the
   `check-size.mjs` guard **against the current tree** — it should report the
   chip-radius and segmented-control deviations as its first output.
2. Fix the four inconsistencies in §1, one commit each (they are independently
   reviewable and independently revertible).
3. Add the four new subranges in §3, one commit per component.
4. Regenerate the token reference; add the sizing table to the demo.
5. Revisit `[itx-size-scope]` as its own plan.
