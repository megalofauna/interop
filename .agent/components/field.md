# Field — Mental Model Card

A field is a label, an optional hint, an optional error and a native control,
in that order. The control is `<input interop-input>`, `<textarea
interop-input>` or `select[interop-select]`, so its own attributes do the work.
CSS, plus `bindValidation()` for errors. Research:
[prompts/FIELD-REVIEW.md](../../prompts/FIELD-REVIEW.md).

```html
<div interop-field>
  <label for="email">Email address</label>
  <p interop-hint id="email-hint">We send the receipt here</p>
  <p interop-error hidden></p>
  <input interop-input id="email" type="email" name="email" autocomplete="email" spellcheck="false"
    aria-describedby="email-hint">
</div>
```

## Files

```
projects/interop/field/
  interop-field.structure.css   the box, states, layout, hint, error, units, summary; names list at the top
  interop-field.base.css        token values and size steps
  field.ts                      InteropForm, InteropCustomValidity, InteropPasswordToggle, InteropCharacterCount
  public-api.ts
projects/interop/src/bind-validation.ts        bindValidation(), defaultValidationMessages
projects/interop/src/bind-password-toggle.ts   bindPasswordToggle()
projects/interop/src/bind-character-count.ts   bindCharacterCount()
```

The demo page is `projects/demo/src/app/components/field/`.

## Parts

| Part | Rule |
|---|---|
| `[interop-field]` | Stacks its parts with `--itx-field-gap`. Its `itx-size` sizes the control and its units. The box tokens come from the field when there is one, else from the control |
| `<label for>` | Visible, above the control, always. A placeholder is not a label |
| `[interop-hint]` | Above the control, wired with `aria-describedby` in the markup, so it works without script. No links in it: they are not announced as links inside a description |
| `[interop-error]` | Above the control, below the hint, `hidden` and empty in the markup. `bindValidation()` fills it and adds it to `aria-describedby` while it shows. Its icon reads "Error:", from `--itx-error-content` (translate it on `:root:lang(…)`) |
| The control | `input`, `textarea` or `select[interop-select]` with `interop-input` or `interop-select`. Fills its container up to `--itx-field-max-inline-size`; `size` asks for an expected length |
| `[interop-unit]` | Beside the input, in a `<div>` inside the field. `aria-hidden="true"`, with the unit in the label |
| A button beside the input | In the same `<div>`, a gap away: "Show password" |
| `[interop-count]` | Below the control, filled by `bindCharacterCount()`. Hint-colored; error-colored and bold with `data-over` |
| Fieldset | A radio group, or a date as three fields, takes the hint and error after its legend; both go in the fieldset's `aria-describedby` |
| `[interop-error-summary]` | A heading and an empty `<ul>`, `hidden`. Filled and focused on a failed submit |

Optional fields say "(optional)" in their label; required ones have `required`
and no asterisk.

## Box

Shared by select, text inputs and textareas: one look, one set of
`--itx-field-*` tokens. Heights are the button's: 32, 40, 56px.

| State | Look |
|---|---|
| Hover | Fill and border one step stronger |
| Focus | The shared focus ring |
| Invalid | 2px border in `--itx-role-text-danger`; `aria-invalid="true"`, or `:user-invalid` where `bindValidation()` is not used |
| Read-only | Dashed border, a fill; still focusable and submitted |
| Disabled | 50% opacity |
| Placeholder | 4.5:1 against the field |
| Textarea | `field-sizing: content` from three lines; resizes vertically |

## bindValidation(form, { summary, messages })

The browser checks the constraints (`required`, `type`, `minlength`, `pattern`,
`setCustomValidity()`); this decides when and how errors show.

| When | What shows |
|---|---|
| Untouched | Nothing. Every control is `aria-invalid="false"`, which also stops `setCustomValidity()` announcing an untouched field invalid |
| Leaving a changed field with a wrong format | Its error |
| Leaving an empty required field | Nothing until submit |
| Typing in a field whose error shows | The error updates, and clears when fixed |
| Submit with errors | Every error; submit is stopped before other listeners; focus to the summary, else the first invalid field |
| `reportValidity()` (`bindSteps`, `bindTagInput`) | The same message in the page, no bubble |
| `interop-validity-change` on a control | Its error updates |
| Reset | Everything clears |

One error per `[interop-field]`, or per fieldset that holds an
`[interop-error]`: a group's error shows its first failing control the user
has reached, and only those controls are `aria-invalid="true"`.

Messages are keyed by the first failing `ValidityState` key, built from the
label: "Enter email address", "Select delivery", "Enter an email address like
name@example.com". A label that is a question gets "Enter an answer" or
"Select an option". `messages` merges over `defaultValidationMessages`; a
function receives the control and its label, so one field can have its own
wording.

Angular: `form[interop-form]` binds it (inputs `summary`, `messages`).
`[interopCustomValidity]` sets a control's custom validity from a message and
fires `interop-validity-change`; use it for server checks and Angular-only
validators. No value accessor: native attributes drive Angular's validators and
the browser alike.

## Password

`bindPasswordToggle(input)`, or `input[interop-password-toggle]` in Angular. A
button aimed at the input with `commandfor` and `command="--toggle-password"`
shows or hides the password: a custom invoker command, so no click handler.

```html
<div>
  <input interop-input interop-password-toggle id="password" type="password" autocomplete="current-password"
    autocapitalize="off" spellcheck="false">
  <button interop-button type="button" commandfor="password" command="--toggle-password" aria-pressed="false" hidden>
    Show password
  </button>
</div>
```

- The label stays "Show password", and `aria-pressed` says whether it is
  showing: "Show password, toggle button, pressed". One way, not both, so the
  label and the state cannot disagree.
- The button is `hidden` in the markup and unhidden by the helper, so it never
  shows where script does not run.
- Submit and reset hide the password again, so the browser does not save it as
  plain text.

## Character count

`bindCharacterCount(control, { limit, count, status, threshold, message,
tooLong })`, or `[interop-character-count]` with `[characterLimit]` in Angular
(not `maxlength`, which stops typing, and not `max`, the input's own
attribute).

- The user can type past the limit. `count` says how many are left or how many
  too many, on every keystroke, and is `aria-hidden`.
- `status`, a visually hidden `role="status"`, gets the same text once typing
  pauses for one second, so a screen reader is not interrupted on every key.
- Over the limit the control's custom validity says "<label> must be <limit>
  characters or fewer", and `interop-validity-change` tells `bindValidation()`.
- Characters are counted as people see them: an emoji or an accented letter is
  one (`Intl.Segmenter`).
- Put the limit in the hint: "You can enter up to 200 characters".
- `threshold` hides the count until that share of the limit is used.

## Dev audit rules

| Rule | Flags |
|---|---|
| `field-label` | A control with no label, or only a placeholder; also a label pointing at a duplicate id |
| `field-describedby` | `aria-describedby` naming an id that does not exist |
| `field-number` | `type="number"` (advisory: use `inputmode`) |
| `field-autocomplete` | `type="email"` or `"tel"` with no `autocomplete` |
| `hint-link` | A link inside a hint |
| `error-summary-list` | An error summary with no `<ul>` |

## Tested

Style guards: contrast (text, placeholder, hint, error, borders at rest, hover
and invalid), target size, radius, motion. axe on a field with a shown error,
units, a read-only textarea and a summary. `bindValidation()` has 12 specs, `bindPasswordToggle()` 3,
`bindCharacterCount()` 5.

In Chrome 155 with real keys: no error on leaving an empty field; the format
error on leaving a changed field, clearing as it is fixed; a failed submit
filling and focusing the summary, each link moving to its field; a date's
shared error flagging only the field reached; the required tag input; forced
colors; the password toggle's state in the accessibility tree; the count going
over the limit and the error on submit.

Not tested: Safari, Firefox, screen reader output, iOS and Android keyboards.

## Not built

A search clear button (Chrome and Safari have their own), number steppers, a
combobox, an invalid border on radio groups.
