# Checkbox — Research Review

Review of Prime's `interop-checkbox` and `interop-checkbox-rig` in
`projects/interop_deprecated`, run against
[new-component-research.md](new-component-research.md). Supersedes
[CHECKBOX-COMPETITIVE-ANALYSIS.md](CHECKBOX-COMPETITIVE-ANALYSIS.md) where they
disagree. Design: [`.agent/components/control.md`](../.agent/components/control.md).

## Decision

A single checkbox is a complete control, so Interop ships
`label[interop-checkbox]`. Same-`name` checkboxes already submit as a
multi-value field. A group is a `<fieldset>`. `fieldset[interop-checkbox-group]`
adds the shared group layout and gives the dev audit and `bindSelectAll()`
something to attach to. It has no behavior of its own.

| Question | Decision |
|---|---|
| Name | Checkbox. Group: checkbox group |
| Group component | None. `interop-checkbox-group` is a layout attribute |
| Select-all | `bindSelectAll(parent, group)`, a framework-free helper |
| "At least one" required | A `setCustomValidity` recipe; an Angular form-model validator; a dev audit rule for the every-box-required mistake |
| Check and dash | `mask-image` on `::before`, with `forced-color-adjust: none` |
| Box size | 20px. The label is the click target and is measured |

## 0. Names

| Source | Name |
|---|---|
| HTML / ARIA | checkbox; APG [Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/) covers mixed state |
| Apple | A toggle style on macOS only ([HIG](https://developer.apple.com/design/human-interface-guidelines/toggles)) |
| WinUI | CheckBox; "check box" in prose ([MS Learn](https://learn.microsoft.com/en-us/windows/apps/design/controls/checkbox)) |
| Material, Fluent, Carbon, Angular Material, PrimeNG, Radix, MUI | Checkbox |
| Groups | CheckboxGroup: [React Aria](https://react-spectrum.adobe.com/react-aria/CheckboxGroup.html), Chakra, [Ant](https://ant.design/components/checkbox/), Mantine, Radix Themes |
| GOV.UK | Checkboxes |
| Bootstrap | [Checks](https://getbootstrap.com/docs/5.3/forms/checks-radios/) |
| Other | tick box (unverified), tri-state / mixed checkbox |

## 1. Platform

| Feature | Effect |
|---|---|
| `:indeterminate` | Draws the dash |
| Indeterminate in the AX tree | HTML-AAM maps it to mixed ([html-aam](https://www.w3.org/TR/html-aam-1.0/)) |
| `aria-checked` on a native checkbox | ARIA in HTML: MUST NOT ([html-aria](https://www.w3.org/TR/html-aria/)) |
| `required` | Applies to that box only. No native "at least one" |
| `setCustomValidity()` | The native route to "at least one" |
| `mask-image` | Baseline 2023. Draws the check and dash |
| Angular `[indeterminate]` | Binds the DOM property directly |
| Signal Forms | `[formField]` on a native checkbox binds a boolean. No array contract |

## 2. Accessibility remediation (Prime)

| # | Issue | WCAG | Severity |
|---|---|---|---|
| C1 | Stale `aria-checked="mixed"` after a click; also forbidden on a native checkbox | 4.1.2 | High |
| C2 | Visimorph desync on one-way binding, reset, bfcache, autofill, disabled fieldset | 1.3.1, 4.1.2 | High |
| R1 | Rig `required` makes every box required | 3.3.2 | High |
| C3 | Duplicate IDs: the host label and the input share an `id` | 4.1.2 | Medium |
| R2 | Duplicate IDs across rigs; `aria-labelledby` can name the wrong group | 1.3.1 | Medium |
| R3 | Legend optional; attribute mode renders no group semantics | 1.3.1 | Medium |
| R4 | `setDisabledState` is a no-op | 4.1.2 | Medium |
| R5 | No description or error path; consumers cannot add attributes to the input | 3.3.1 | Medium |
| C4 | Focus on a 1px clipped input | 2.4.7 | Medium |
| C5 | Focus ring sampled once; focus shrinks the box | 2.4.7, 2.4.13 | Low |
| R6 | `aria-controls` on the label, not the input | 4.1.2 | Low |
| R7 | Select-all reads "all" while a disabled box is unchecked | 1.3.1 | Low |
| R9 | Redundant `role="group"` on a fieldset with a legend | — | Low |
| C6 | No forced-colors rule; the checked fill disappears | 1.4.11 | Low |
| C7 | Contrast never measured | 1.4.11 | Verify |
| C8 | `user-select: none` on the label | — | Low |

## 3. Removed

The component (its stated reason, that `.indeterminate` cannot be bound, is
false), required `id`, `attrsPreset`, `valueChange`, `indeterminateChange`,
`getInputElement`, the dead label dev check, the rig's four render paths,
`interopCollection`, `trackBy`, `rigClass`, `groupName`, the value mirror,
`--itx-rig-*`, the label `::before` surface tokens, `.inline`/`.block`/`.reverse`.

## 4. Where TS is needed

| Need | Covered by |
|---|---|
| Indeterminate | Angular `[indeterminate]`; one line of script in plain HTML |
| Select-all sync | `bindSelectAll()`. Angular with a signal model can bind the parent in the template instead |
| "At least one" | Recipe and form-model validator |
| Single checkbox in forms | `CheckboxControlValueAccessor`; Signal Forms |
| Array value | Not needed: one boolean per option |

## 5. Carried over

The label as hit target; select-all acting on enabled boxes only and showing the
parent truthfully across all boxes; test ideas for reset and disabled fieldsets.
