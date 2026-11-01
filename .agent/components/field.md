# Field — Mental Model Card

A field is a label, an optional hint, an optional error and a native control,
in that order. The control is `<input interop-input>`, `<textarea
interop-input>` or `select[interop-select]`, so its own attributes do the work.
CSS, plus `<interop-validation>` for errors. Research:
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
  password.ts                   <interop-password>, defined on import
  character-count.ts            <interop-character-count>, defined on import
  validation.ts                 <interop-validation>, defined on import
  public-api.ts
projects/interop/src/bind-validation.ts        bindValidation(), defaultValidationMessages
projects/interop/src/bind-password-toggle.ts   bindPasswordToggle()
projects/interop/src/bind-character-count.ts   bindCharacterCount()
projects/interop/src/bind-children.ts          bindChildren(): binds once an element's children are in place
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
| A button beside the input | In the same `<div>`, a gap away. "Show password" goes in `<interop-password>`, which is the row |
| `[interop-count]` | Below the control, both inside `<interop-character-count>`, which fills it. Hint-colored; error-colored and bold with `data-over` |
| Fieldset | A radio group, or a date as three fields, takes the hint and error after its legend; both go in the fieldset's `aria-describedby`. Invalid radios and checkboxes get a 2px danger border |
| `[interop-error-summary]` | A heading and an empty `<ul>`, `hidden`, a direct child of `<interop-validation>`. Filled and focused on a failed submit |

Optional fields say "(optional)" in their label; required ones have `required`
and no asterisk.

## Box

Shared by select, text inputs and textareas: one look, one set of
`--itx-field-*` tokens. The look is the segmented control's frame: a filled
channel (neutral-200/800) with an edge 3:1 against the page (neutral-500/400).
Heights are the button's: 32, 40, 56px.

| State | Look |
|---|---|
| Hover | Fill and border one step stronger |
| Focus | The shared focus ring, with the border dimmed under it (`neutral-350`/`600`) so the field shows one strong edge. An invalid field's ring is its danger color (set in `styles/outline.css`, Highlight in forced colors) and its red border dims to 40%. Tokens: `--itx-field-border-color-focus-visible`, `-invalid-focus-visible` |
| Invalid | 2px border in `--itx-role-text-danger`; `aria-invalid="true"`, or `:user-invalid` where `bindValidation()` is not used |
| Read-only | Dashed border and no fill, so it does not look like a place to type; still focusable and submitted |
| Disabled | 50% opacity |
| Placeholder | 4.5:1 against the fill at rest and hovered |
| Textarea | `field-sizing: content` from three lines; resizes vertically |

## Validation

`<interop-validation>`, defined by importing `interop/field`, holds the error
summary and the `<form>`, both direct children, and calls
`bindValidation(form, { summary, messages })` once the form is in place (and
again if a framework replaces it, through `bindChildren()`). It is a block with
no role; its children need their own `itx-flow`.

```html
<interop-validation>
  <div interop-error-summary hidden><h2>There is a problem</h2><ul></ul></div>
  <h1>Your details</h1>
  <form action="/details" method="post">…</form>
</interop-validation>
```

The page heading can go inside too, so the summary sits above it, as GOV.UK
places it. Without script the form keeps the browser's own validation: the
element adds `novalidate`, and removing it takes `novalidate` away again.

The browser checks the constraints (`required`, `type`, `minlength`, `pattern`,
`setCustomValidity()`); this decides when and how errors show.

| When | What shows |
|---|---|
| Untouched | Nothing. Every control is `aria-invalid="false"`, which also stops `setCustomValidity()` announcing an untouched field invalid |
| Leaving a field, changed or not | Nothing until submit. An error shown then would move what is below it, and a click on Submit straight from the field would miss the button |
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

`messages` is a property (Angular `[messages]`, React 19 a prop); one set
before the element upgrades is taken.

A rule the browser cannot check (a username taken, an Angular-only validator)
is the control's own `setCustomValidity()`. Called in the control's `input`
listener, the error follows it with nothing more: that listener runs before
the form's. A result that comes later, such as a server's answer, also fires
`interop-validity-change` on the control (bubbling), so its error updates:

```js
control.setCustomValidity(message);
control.dispatchEvent(new Event("interop-validity-change", { bubbles: true }));
```

No directive or attribute for it; an `itx-custom-validity` attribute may come
later. No value accessor: native attributes
drive Angular's validators and the browser alike. `interop/field` has no
Angular in it.

## Password

`<interop-password>`, defined by importing `interop/field`, holds the input and
a button aimed at it with `commandfor` and `command="--toggle-password"`. The
button shows or hides the password: a custom invoker command, so no click
handler. The element calls `bindPasswordToggle(root)`.

```html
<interop-password>
  <input interop-input id="password" type="password" autocomplete="current-password"
    autocapitalize="off" spellcheck="false">
  <button interop-button type="button" commandfor="password" command="--toggle-password" aria-pressed="false">
    Show password
  </button>
</interop-password>
```

- The element is the row in place of the `<div>`, and has no role.
- The label stays "Show password", and `aria-pressed` says whether it is
  showing: "Show password, toggle button, pressed". One way, not both, so the
  label and the state cannot disagree.
- The button is hidden by CSS until the element is defined
  (`interop-password:not(:defined)`), so it never shows where script does not
  run. Don't write `hidden` on it: nothing removes it.
- Submit and reset hide the password again, so the browser does not save it as
  plain text. The listener bubbles, so a submit `bindValidation()` stops leaves
  it shown while the user fixes the errors.
- Nothing is set up when the element connects: the input and buttons are found
  when the command arrives, so a framework can render them after the element.
- The element owns the input's `type` and the button's `aria-pressed`.

## Character count

`<interop-character-count itx-limit="200">`, defined by importing
`interop/field`, holds the control and its `[interop-count]`. Not `maxlength`,
which stops typing and cuts pasted text short without saying so.

```html
<interop-character-count itx-limit="200" itx-threshold="0.75">
  <textarea interop-input id="summary" name="summary" aria-describedby="summary-hint"></textarea>
  <p interop-count></p>
</interop-character-count>
```

- The element is `display: contents`, with no role: the control and the count
  stack in the field as if it were not there.
- The user can type past the limit. The count says how many are left or how many
  too many, on every keystroke, and is `aria-hidden`.
- The same text is announced with `announce()` once typing pauses for one
  second, so a screen reader is not interrupted on every key. A visually hidden
  `role="status"` child is only for browsers without `ariaNotify()`.
- Over the limit the control's custom validity says "<label> must be <limit>
  characters or fewer", and `interop-validity-change` tells `bindValidation()`.
  A prefilled value already over is invalid from the start.
- Characters are counted as people see them: an emoji or an accented letter is
  one (`Intl.Segmenter`).
- Put the limit in the hint: "You can enter up to 200 characters". The count is
  hidden until the element is defined, so without script the hint is all there
  is, and the server checks the length.
- `itx-threshold` hides the count until that share of the limit is used, and
  keeps the announcement quiet until then too.
- `message` and `tooLong` are properties, for translations. One set before the
  element is defined is taken when it upgrades.
- It binds through `bindChildren()`: once the control is a direct child, and
  again if a framework replaces it. Angular inserts the element before its
  children.
- Not handled: a value set by code (`control.value = ""`, Angular's
  `setValue()`) fires no event, so the count waits for the next keystroke. The
  control's custom validity is shared with any `setCustomValidity()` the app
  calls.

## Dev audit rules

| Rule | Flags |
|---|---|
| `field-label` | A control with no label, or only a placeholder; also a label pointing at a duplicate id |
| `field-describedby` | `aria-describedby` naming an id that does not exist |
| `field-number` | `type="number"` (advisory: use `inputmode`) |
| `field-autocomplete` | `type="email"` or `"tel"` with no `autocomplete` |
| `field-hint-link` | A link inside a hint |
| `validation-parts` | An `<interop-validation>` with no `<form>` child, or an error summary that is not its direct child |
| `error-summary-list` | An error summary with no `<ul>` |
| `character-count-limit` | An `<interop-character-count>` with no `itx-limit`, or a counted control with `maxlength` |
| `password-toggle` | A "Show password" button that is `hidden`, or not inside `<interop-password>` |

## Tested

Style guards: contrast (text, placeholder, hint, error, borders at rest, hover
and invalid), target size, radius, motion. axe on a field with a shown error,
units, a read-only textarea and a summary. `bindValidation()` has 12 specs, `bindPasswordToggle()` 6, `<interop-password>` 2,
`bindCharacterCount()` 5, `<interop-character-count>` 8, `bindChildren()` 5, `<interop-validation>` 5.

`npm run test:browser` clicks `<interop-password>`'s real invoker in Chromium
and WebKit: the button hidden while the script is blocked, beside the input once
defined, the toggle, and the password hidden on submit and reset. The element is
558 B gzip. It types into `<interop-character-count>` there too: the count hidden
while the script is blocked, the control as wide as a plain field's, over and
back under the limit. That element is 1.3 kB gzip, with `announce()`. A failed submit there, in
`<interop-validation>`, clicked straight from the field: the browser's own validation while the script is
blocked, then no bubble, the summary filled and focused, its link moving to
the field, and the password left shown. That element is 2.3 kB gzip.

In Chrome 155 with real keys: no error on leaving a field; a failed submit
filling and focusing the summary, each link moving to its field; a date's
shared error flagging only the field reached; the required tag input; forced
colors; the password toggle's state in the accessibility tree; the count going
over the limit and the error on submit.

Not tested: Safari, Firefox, screen reader output, iOS and Android keyboards.

## Not built

A search clear button: Chrome and Safari have their own, and one for Firefox
alone would only empty the field. Number steppers, a combobox. Invalid looks
for the segmented, chips and cards templates: they show the group's message
only.

An `<interop-field>` element in place of `div[interop-field]`. A field is a
role-less group of parts, like tabs, and a `<div>` has no semantics to lose,
so it could be one. It isn't, because behavior is opted into by naming it:
`<interop-password>` and `<interop-character-count>` each wrap only what they
touch and cost a plain field nothing. A field element would have to detect
each behavior from its children: either every field carries the password
listeners, or the toggle becomes a document-wide delegated listener, and
`itx-limit` moves onto the field. What it would save is one wrapper on
counted fields. The label's `for` and the hint's `aria-describedby` stay in
the markup either way, since they must work before script runs.
