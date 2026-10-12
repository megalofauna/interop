# Radio group — Research Review

Review of Prime's `interop-radio` control and `interop-radio-rig` in
`projects/interop_deprecated`, run against
[new-component-research.md](new-component-research.md). Design:
[`.agent/components/control.md`](../.agent/components/control.md).

## Decision

The unit is the group. A lone radio cannot be unchecked by the user, and every
spec and system treats radios as a set. Prime's own rig docs end by telling
users to skip the rig and put radios in their own `<fieldset>`
(`rigs/interop-radio-rig/interop-radio-rig.ts:64-66`).

The platform splits the group's jobs three ways:

| Unit | Owns |
|---|---|
| Same `name` | Exclusivity, one tab stop, arrow keys, group `required`, reset, `RadioNodeList` |
| `<fieldset>` + `<legend>` | Group semantics and the group's name |
| The `<input>` | Drawing, with `appearance: none` and `::before` |

Interop ships `fieldset[interop-radio-group]` holding plain
`<label><input type="radio" name="…"> …</label>` items. The identity attribute
goes on the smallest element that is a complete control: the label for a switch
or a checkbox, the fieldset for radios. No TS.

| Question | Decision |
|---|---|
| Name | Radio group. Attribute `interop-radio-group`, folder `radio-group/` |
| Item attribute | None. A descendant selector scopes item styles |
| `role="radiogroup"` | Not by default. Fieldset + legend is the robust path. Allowed |
| Token prefix | `--itx-radio-group-*`, matching the attribute |
| Group layout | Shared with checkbox groups in `styles/fieldset.css` |
| Target size | Measured on the label, which is the click target |

## 0. Names

| Source | Name |
|---|---|
| HTML | Radio Button state; "radio button group" |
| ARIA / APG | `radio`, `radiogroup`; [Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) |
| Fluent | v8 ChoiceGroup; v9 RadioGroup; [`fluent-radio-group`](https://learn.microsoft.com/en-us/fluent-ui/web-components/components/radio-group) |
| Carbon | Radio button; React `RadioButtonGroup` ([Carbon](https://carbondesignsystem.com/components/radio-button/accessibility/)) |
| Spectrum | [`sp-radio-group`](https://developer.adobe.com/xd/uxp/uxp/reference-spectrum/user-interface/sp-radio-group) |
| Calcite | [radio button group](https://developers.arcgis.com/calcite-design-system/components/radio-button-group) |
| GOV.UK | [Radios](https://design-system.service.gov.uk/components/radios/) |
| MUI, Radix, Chakra, Atlassian, Angular Material, Ant | RadioGroup / Radio.Group (unverified) |
| Office / VBA | option buttons (unverified) |

## 1. Platform

| Feature | Effect |
|---|---|
| `appearance: none` + `::before` on radio | The dot lives on the input. Firefox needs `appearance: none` |
| Group `required` | Any one `required` radio makes the group required. No TS |
| `change` | Fires on the newly checked radio only, and bubbles. One listener on the fieldset reads the value. Siblings get no event, the root of Prime's desync |
| `form.elements[name].value` | Group value in plain JS |
| ARIA in HTML | `aria-checked` forbidden on `input[type=radio]` ([html-aria](https://www.w3.org/TR/html-aria/)) |
| Posinset / setsize | Computed by browsers for native radios |
| Fieldset/legend in screen readers | NVDA and VoiceOver macOS read the legend; VoiceOver iOS does not; blank legends break many combinations ([htmhell](https://htmhell.dev/adventcalendar/2024/21/), [GOV.UK](https://accessibility.blog.gov.uk/2016/07/22/using-the-fieldset-and-legend-elements/)) |
| `:user-invalid` | Invalid styling with no script. Deferred until a form-error pattern exists |

## 2. Accessibility remediation (Prime)

| # | Issue | WCAG | Severity |
|---|---|---|---|
| R1 | `checked` is an `input()` mirrored into Visimorph. Unbound clicks show no dot; stale after reset, bfcache, autofill | 1.3.1, 4.1.2 | High |
| R2 | Rig projection mode is unwired: `value`, `valueChange` and the CVA are dead | functional | High |
| R3 | No forced-colors rule; the dot is `background-color` and disappears | 1.4.11 | High |
| R4 | Legend optional, so groups can be unnamed | 1.3.1 | High |
| R5 | `setDisabledState` is a no-op | 4.1.2 | Medium |
| R6 | A per-radio `name` can leave the group | 1.3.1 | Medium |
| R7 | Focus on a 1px clipped input | 2.4.7 | Medium |
| R8 | Focus ring depends on parent wiring | 2.4.7 | Medium |
| R9 | No hint or error path; touched fires on change, not blur | 3.3.1 | Medium |
| R10 | Focus shrinks the dot (`scale(0.875)`) | 2.4.13 | Low |
| R11 | Contrast never measured | 1.4.11 | Verify |
| R12 | Disabled opacity stacks three times | — | Low |

## 3. Removed

Activation guardrails, `activationId`, `payload`, `attrsPreset`, required `id`,
`checkedChange` (its `false` branch is unreachable), the label dev check (the
selector makes it impossible), `getInputElement`, the whole rig and its CVA
(Angular's `RadioControlValueAccessor` covers native radios), the `controls`
data mode, `--itx-rig-*`.

## 4. Where TS would be needed

| Need | Covered by |
|---|---|
| Angular forms | Built-in `RadioControlValueAccessor`. It never writes `name` to the DOM, so the consumer must. The dev audit flags a missing or mismatched `name` |
| Signal Forms | `[formField]` writes `checked` and `name` |
| Plain signals | `[checked]` per input, one `(change)` on the fieldset |
| Required, keyboard, reset | Platform |
| Hint or error | `aria-describedby` on the fieldset |
| Authoring mistakes | Dev audit rules: legend, shared `name`, at least two radios |

No component.

## 5. Follow-up

The deprecated segmented control hand-rolls single-select with `aria-pressed`
buttons and its own roving tabindex. When it is rebuilt, it is a radio group
with a different skin.
