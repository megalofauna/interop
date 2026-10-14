# Field — Research Review

Review of Prime's `InteropField` in `projects/interop_deprecated`, run against
[new-component-research.md](new-component-research.md) with the
[prime-review workflow](../.agent/workflows/prime-review.md).

## Decision

Rebuild the field as CSS on native controls, plus one validation helper.

A field is four parts: a label, an optional hint, the control and an optional
error. The control is the native `<input>`, `<textarea>` or `<select>`, and
its attributes do the work: `type`, `name`, `autocomplete`, `inputmode`,
`required`, `minlength`. Interop adds three things:
- **One field box for every text-like control.** Select already has it.
- **A layout for the four parts.**
- **`bindValidation()`.** It reads the browser's own validity and shows
  Interop's messages in the page, at the right time, wired for screen readers.

| Prime piece | Really | Interop |
|---|---|---|
| `<interop-field-input>` | A label, an input, notes and errors, inside a custom element | `<label for>` + `<input interop-input>`, inside the field layout |
| `<interop-field-textarea autoResize>` | A textarea that grows | `<textarea interop-input>` with `field-sizing: content` |
| `FieldBase`, the value accessor, the error pipeline | Angular Forms plumbing | The browser's validity model. A small directive passes Angular validator errors into it |
| `INTEROP_ERROR_MESSAGES` | Message text per error | Messages per `ValidityState` key, merged over the defaults |
| `[interop-field-prefix]`, `[interop-field-suffix]` | Units beside the input | Visible units in the box, with the unit in the label |

| Question | Decision |
|---|---|
| What were we doing? | Building a Material-style form-field: a custom element that owns the label, the control and the errors, driven by Angular Forms. The TypeScript arrived in a bulk import with no rationale; the CSS history records a Carbon look borrowed in August |
| Does it do it? | No. Its central promise, a labeled control, fails: the `id` is written on the host and the inner input, so the input has no name in any demo. `required` written as a bare attribute does nothing. It has no tests |
| Is it a field? | It is the right unit, label, hint, control, error, built the wrong way: it hides the native control, so `name`, `autocomplete` and `inputmode` cannot reach it, and forms cannot submit it |
| How do hints and validation fit? | Hint above the control, error above the control below the hint, both in `aria-describedby`, hint first. Validity is the browser's; Interop shows the message on submit and after the user leaves a field they changed, and clears it as soon as the value is fixed |
| Varieties, and shared primitives | About 14 varieties. 11 are the same box and layout with a different native attribute. Three need a small helper: validation (shared by all), password reveal and character count |
| Prerequisites | Select (built), fieldset layout (built), steps validation rescue (built, must keep working). New: the field box shared with select, the layout, `bindValidation()` |
| Invokers | None built in. A password reveal or a clear button can be a custom `--command` handled by a helper. Open UI lists `step-up` and `show-picker` as ideas, not proposals |

## 0. Names

| Name | Used by |
|---|---|
| textbox | ARIA role for both `<input>` and `<textarea>` |
| input, textarea | HTML; Fluent, Base UI, Radix (the control) |
| field, form field | Fluent `Field`, Base UI `Field`, Radix `Form.Field`, Angular Material `mat-form-field` (the wrapper) |
| text field, text view | Apple HIG (single line, multiline), Material, React Aria and Spectrum `TextField` |
| text input, text area | GOV.UK, USWDS, Carbon |
| text box | Windows |

Fluent, Base UI and Radix separate the field, label and hint and control and
error, from the control. Interop already has that split: `select[interop-select]`
is a control. The field is the unit around any control.

## 1. Prime

983 lines of TypeScript and templates, 627 of CSS, no tests. `field-base.ts`
is 397 lines:

| Concern | Lines |
|---|---|
| Inputs and documentation | about 100 |
| Value accessor | about 40 |
| Error pipeline, including a signal bridge because Angular controls are not signals | about 110 |
| `aria-describedby` and `aria-errormessage` | about 40 |

The two templates are near copies. Prefix and suffix take 103 lines to set
`aria-hidden` and a class. Nothing in the new library or its demo uses the
field.

### What held

- The four-part anatomy, and `aria-describedby` built in order, hint then error,
  only while an error shows.
- `aria-invalid` only while an error shows.
- Messages that resolve per field, per app, then default.
- Heights of 32, 40 and 48px, logical properties, rem sizing.

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | `id` is written on the host and the input, so the label points at the host: the input has no name and clicking the label does nothing | 1.3.1, 4.1.2, 2.5.3 | High |
| 2 | `name`, `autocomplete`, `inputmode`, `minlength`, `pattern` and `spellcheck` cannot reach the input. Input purpose cannot be identified, and native forms cannot submit it | 1.3.5 | High |
| 3 | Every error is a `role="alert"` inserted on blur: it talks over the next field's label, and with "immediate" every field alerts on page load | 4.1.3, 3.3.1 | High |
| 4 | In forced colors the invalid icon disappears, and an invalid field's ring looks the same as the focus ring | 1.4.1, 1.4.11, 2.4.7 | High |
| 5 | Submitting shows nothing unless the app marks every control touched; no error summary, no focus to the first error | 3.3.1 | High |
| 6 | The asterisk is generated content, so it is read as part of the name, and nothing explains it | 1.3.1 | Medium |
| 7 | Prefix and suffix are always hidden from screen readers, and the demo hides the unit "credits" | 1.3.1 | Medium |
| 8 | The error is referenced by both `aria-describedby` and `aria-errormessage`, so some screen readers read it twice | — | Low |
| 9 | The asterisk color is a fill role measured at 2.86:1 as text | 1.4.3 | Medium |
| 10 | A read-only field's underline is a divider color, likely under 3:1 | 1.4.11 | Medium |
| 11 | The focus ring is drawn on a wrapper from a script-set class; the input has `outline: none` | 2.4.7 | Low |

### Bugs

1. `<interop-field-input required>`: `required` is `""`, read as false. No
   asterisk and no `required`, while Angular's own `required` validator still
   runs, so a field that looks optional fails as required. The same goes for
   `disabled` and `readonly`.
2. An app's message map replaces the defaults instead of merging, so a
   `minlength` error reads "Validation error: minlength".
3. `[fieldErrors]="[]"`, used to clear server errors, hides every other error
   for good.
4. `type="number"` with "1e" typed: the value reads as empty, the field says
   "This field is required", and the model is always a string.
5. `control.disable()` does nothing; the user can type into a disabled control.
6. A textarea with `autoResize` never resizes for a value set from code, and
   snaps back after a manual resize.

## 2. Evidence

- **Hint and error placement.** GOV.UK puts the hint between the label and the
  input, and the error between the hint and the input: label, hint, error,
  control. Text below a field is covered by autocomplete lists and mobile
  pickers (Roselli, [Avoid Messages Under Fields](https://adrianroselli.com/2017/01/avoid-messages-under-fields.html)).
  Hints hold no links, which screen readers do not announce inside a
  description ([GOV.UK text input](https://design-system.service.gov.uk/components/text-input/)).
- **Error text** starts with a visually hidden "Error:", says how to fix it,
  and the input keeps what was typed ([GOV.UK error message](https://design-system.service.gov.uk/components/error-message/)).
- **`aria-errormessage`** passes 18 of 22 tests; it fails in VoiceOver on macOS with Chrome and Firefox, and in TalkBack
  ([a11ysupport](https://a11ysupport.io/tech/aria/aria-errormessage_attribute)).
  Django declined it in 2025 for that reason. `aria-describedby` with
  `aria-invalid` is the broad-support choice.
- **When to validate.** GOV.UK validates on submit and not on blur
  ([validation](https://design-system.service.gov.uk/patterns/validation/)).
  Wroblewski's 2009 study, with 22 participants, found that inline validation
  gave 22% more completions and 42% faster completion, mostly on hard fields
  ([A List Apart](https://alistapart.com/article/inline-validation-in-web-forms/)).
  Baymard and Smashing agree on "reward early, punish late":
  - no error on focus or on an empty field before submit;
  - a format error once the user leaves a field they changed;
  - the error clears on the keystroke that fixes it.
- **Error summary** on submit, at the top, focused, linking to each field
  ([GOV.UK error summary](https://design-system.service.gov.uk/components/error-summary/)).
- **Required.** GOV.UK marks the optional fields with "(optional)" and never uses asterisks.
- **Placeholder** is forgotten, mistaken for a value, overlooked and low in
  contrast ([NN/g](https://www.nngroup.com/articles/form-design-placeholders/)).
- **`type="number"`:**
  - Dragon could not dictate into it.
  - NVDA read unlabeled spin buttons.
  - Chrome dropped letters silently.
  - The scroll wheel changed values.

  Use `inputmode="numeric"` on a text input
  ([GOV.UK blog](https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers/)).
- **Dates people know** are three text fields in a fieldset, not a date picker
  ([GOV.UK date input](https://design-system.service.gov.uk/components/date-input/)).
- **Native error bubbles** do not zoom, can be hidden by autofill, and screen
  readers never announce when the field becomes valid
  ([Roselli](https://adrianroselli.com/2019/02/avoid-default-field-validation.html)).
  Radix, Base UI and React Aria keep the browser's validity and render their
  own messages.
- **Character count** does not block typing, and announces the count after the
  user stops typing ([GOV.UK character count](https://design-system.service.gov.uk/components/character-count/)).
- **Password reveal.** Use a button that either keeps its label and uses
  `aria-pressed`, or changes its label, but never both. Set it back to
  `password` on submit
  ([GOV.UK password input](https://design-system.service.gov.uk/components/password-input/)).

## 3. The platform, checked in Chrome 155

| Feature | Result |
|---|---|
| `:user-invalid`, `field-sizing: content`, `:autofill` | Supported |
| An empty `required` email | `:invalid`, but not `:user-invalid`, and the accessibility tree reports it valid |
| "abc" typed in an email field, then Tab | `:user-invalid`, and invalid in the accessibility tree, with no `aria-invalid` written |
| `setCustomValidity("…")` on an untouched field | Invalid in the accessibility tree at once, before the user does anything |
| `aria-describedby="hint error"` | Description read as "We send the receipt here. Error: Enter an email address like name@example.com" |
| `aria-errormessage` with `aria-invalid` | Exposed as the error message |
| Submit with an invalid field | Focus goes to it; the message is the browser's, in the browser's language: "Please include an '@'…" |

The `setCustomValidity` row matters now: `bindTagInput` with `required` sets
it on bind, so a required tag input is announced as invalid before the user
types. It needs to wait for the user, as `:user-invalid` does.

From sources:
- `:user-invalid` has been Baseline since 2023.
- `field-sizing: content` is in Chrome 123, Safari 26.2 and Firefox 152.

## 4. Varieties

| Variety | Built from | Extra |
|---|---|---|
| Text | `<input>` | — |
| Email, phone, URL | `type` + `autocomplete` | — |
| Number, reference number | `type="text" inputmode="numeric"` | — |
| Search | `type="search"` | The browser's clear button; Firefox has none |
| One-time code | `autocomplete="one-time-code" inputmode="numeric"`, one input | — |
| Multiline | `<textarea>` + `field-sizing: content` | — |
| Choice from a list | `select[interop-select]` | Built |
| Amount with a unit | Input + visible unit, unit in the label | Box around both |
| Date people know | Three inputs in a fieldset, `bday-*` autocomplete | Widths |
| Phone with country | Select + input in a fieldset | — |
| Tags | `ul[interop-tags]` + input | Built (`bindTagInput`) |
| Password | `type="password"`, `autocomplete`, `spellcheck="false"` | Reveal button: helper |
| Text with a limit | Input or textarea + count | Count: helper |
| Every field | — | Errors: `bindValidation()` |

11 of 14 are the box and the layout. Three need script, one of them shared by all.

## 5. Prerequisites in Interop

| Piece | Status |
|---|---|
| `select[interop-select]`, a field box | Built, with `--itx-select-*` tokens |
| Fieldset layout for groups | Built |
| `bindSteps` validation rescue, `bindTagInput` validity | Built; both use the browser's validity, so a validation helper must too |
| A box shared by input, textarea and select | New |
| The label, hint, control, error layout | New |
| `bindValidation()` and default messages | New |
| Audit rules for fields | New |

## 6. Invokers

| Job | Invoker? |
|---|---|
| Show or hide a password | No built-in command. A custom `--toggle-password` handled by a helper |
| Clear a search field | The browser's own button in Chrome and Safari. Otherwise a custom command |
| Step a number | Not offered: GOV.UK's evidence is against number spinners. Open UI lists `step-up` as an idea |
| Open a picker | `showPicker()` from script; `show-picker` is an Open UI idea |
| Submit, reset | `type="submit"`, `type="reset"`, native |

## 7. What carries over

1. The four-part anatomy and the `aria-describedby` order.
2. The default messages, rekeyed to `ValidityState`: `valueMissing`,
   `typeMismatch`, `tooShort`, `tooLong`, `rangeUnderflow`, `rangeOverflow`,
   `patternMismatch`, `badInput`. Overrides merge over the defaults.
3. Message resolution, framework-free.
4. Size steps, aligned with select and button.
5. Lessons:
   - Never wrap the native control in a custom element.
   - Never use an alert per field.
   - Never use a focus ring set from script.
   - Never show an error state only as a fill or a mask.

## Questions for you

1. **One box.** Text inputs take select's outlined box, not Prime's Carbon
   underline. The box's values move to shared `--itx-field-*` tokens read by
   `select[interop-select]`, `input[interop-input]` and
   `textarea[interop-input]`. Select keeps `--itx-select-*` for its picker and
   options only. Recommended.
2. **Names.** Decided: the hint and error are `[interop-hint]` and
   `[interop-error]`, usable in a field or a fieldset, and `bindValidation()`
   wires the error, so the author writes no error `id`. As first proposed:
   - The control: `input[interop-input]` and `textarea[interop-input]`.
   - The unit: `[interop-field]` around the label, the hint
     (`[interop-field-hint]`), the error (`[interop-field-error]`) and the
     control.

   Recommended. The alternative is `interop-text-field` on the control, with no wrapper.
3. **Validation timing.** Interop's messages, not the browser's bubbles:
   - The form is `novalidate`.
   - An error shows on submit, or when the user leaves a field they changed.
   - It updates as they type, and clears when the value is fixed.
   - An empty required field is flagged only on submit.

   Recommended.
4. **Error summary.** `bindValidation(form, { summary })`: on a failed submit,
   fill a summary at the top with a link to each field and focus it. Without a
   summary, focus the first invalid field. Recommended, with the summary
   optional.
5. **Angular Forms.** No value accessor. The browser's validity is the only
   model. Native attributes (`required`, `minlength`) drive both Angular and the
   browser. A directive passes custom Angular validator errors into
   `setCustomValidity`. Recommended.
6. **Required marking.** Native `required` on the control, and "(optional)" in
   the label of optional fields, no asterisks, as GOV.UK does. Recommended.
7. **v1 scope.** The box, the layout, `bindValidation()`, textarea auto-grow,
   units, and `bindTagInput`'s required timing fixed. Password reveal and
   character count follow as their own helpers. Recommended.
8. **Width.** Fields fill their container up to a maximum. The native `size`
   attribute, or a `--itx-field-inline-size` override, sets an expected
   length, since a field's width hints at what goes in it. Recommended.

## Unverified

- Screen reader output for the hint, error and summary pattern with real
  assistive technology.
- Whether `aria-describedby` and `aria-errormessage` together are read twice.
- `field-sizing` in Safari and Firefox.
- Whether the native `size` attribute and the box's width rules combine as
  intended.
- Adam Silver's and O'Hara's positions; Carbon's names.
