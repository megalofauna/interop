# Steps — Mental Model Card

A process split into ordered steps has two parts: a **step indicator** that
shows where you are, and the **steps** themselves. Research:
[prompts/STEPPER-REVIEW.md](../../prompts/STEPPER-REVIEW.md).

| Part | What | TS |
|---|---|---|
| `ol[interop-steps]` | The step indicator: an ordered list, the current step `aria-current="step"` | None |
| `form[interop-steps-form]` | A multi-step form: one `<form>`, a `<fieldset>` per step | `bindSteps()`; the `InteropStepsForm` directive in Angular |

Free order with no completion is tabs, not steps. A +/− number control, which
Apple and Spectrum call a stepper, is `input type="number"`.

## Files

```
projects/interop/steps/
  interop-steps.structure.css   the indicator; names list at the top
  interop-steps.base.css        token values
  steps.ts                      InteropStepsForm directive
  public-api.ts                 exports InteropStepsForm
projects/interop/src/bind-steps.ts   the multi-step form, framework-free
```

The demo page is `projects/demo/src/app/components/steps/`.

## Step indicator

```html
<ol interop-steps aria-label="Application progress">
  <li><a href="/apply/details">Your details</a> <span itx-visually-hidden>completed</span></li>
  <li aria-current="step">Documents</li>
  <li>Sign <span itx-visually-hidden>not completed</span></li>
</ol>
```

| Concern | How |
|---|---|
| Numbers | `counter(list-item)` in each item's `::before` disc |
| Current | `aria-current="step"`: a filled disc and a heavier label |
| Completed | Every step before the current one, from `li:has(~ li[aria-current="step"])`: a filled disc with a check cut out by a mask. No attribute of its own |
| Future | A ring. 3:1 against the page |
| Connectors | Each item's `::after`, solid behind the current step |
| Links | Completed steps may link back to review. Future steps never link and never hold a button |
| Status | Write it in visually hidden text: some screen readers do not announce `aria-current` on a list item |
| Narrow | Below a 36rem container only the current step keeps its label on screen; the others keep it for assistive technology |
| Forced colors | Rings `CanvasText`, current `Highlight`/`HighlightText`, completed `CanvasText` |

Put "Step N of M" in the page title and the step's heading as well. GOV.UK's
advice stands: try the process without an indicator first.

| Token | Default |
|---|---|
| `--itx-steps-gap`, `-font-size`, `-line-height`, `-font-weight-current` | `--itx-space-2`, the `label` role, 600 |
| `--itx-steps-color[-current]` | neutral-700/300, 950/50 |
| `--itx-steps-indicator-size`, `-indicator-font-size`, `-indicator-border-width` | `--itx-space-6`, the `caption` role, 1px |
| `--itx-steps-indicator-border-color`, `-indicator-background-color`, `-indicator-color` | neutral-500/400, transparent, neutral-700/300 |
| `--itx-steps-indicator-background-color-current`, `-indicator-color-current` | neutral-900/50, 50/900 |
| `--itx-steps-indicator-color-completed`, `-indicator-mask-image-completed` | neutral-900/50, an SVG check |
| `--itx-steps-connector-block-size`, `-connector-min-inline-size` | 1px, `--itx-space-4` |
| `--itx-steps-connector-background-color[-completed]` | neutral-300/700, 900/50 |

## Multi-step form: `bindSteps(form, options)`

```html
<form id="apply" interop-steps-form>
  <ol interop-steps aria-label="Application progress">
    <li>Your details <span itx-visually-hidden data-step-status></span></li>
    <li>Address <span itx-visually-hidden data-step-status></span></li>
  </ol>
  <fieldset id="details">
    <legend><h2>Your details (step 1 of 2)</h2></legend>
    …
    <button type="button" command="--next" commandfor="apply">Next</button>
  </fieldset>
  <fieldset id="address" hidden>
    <legend><h2>Address (step 2 of 2)</h2></legend>
    …
    <button type="button" command="--back" commandfor="apply">Back</button>
    <button type="submit">Send</button>
  </fieldset>
</form>
```

Each direct child `<fieldset>` is a step and holds its own buttons. They drive
the steps with invoker commands aimed at the form, so a hidden step hides its
buttons too.

| Command | Does |
|---|---|
| `--next` | Reports the current step's first invalid field and stays, or moves on |
| `--back` | Moves back |
| `--show-step` | Shows the step whose `id` is the button's `value`, if it has been reached. For "Change" links on a review step |

| Concern | Behavior |
|---|---|
| Hiding | One step shows; the others are `hidden`, never `disabled`, so every value submits. Without script every step shows: a long form |
| Validity | `fieldset.checkValidity()` always returns `true`, so the helper checks the current step's fields one by one |
| Enter | In a field of any step but the last, Enter means Next, not submit |
| Hidden invalid field | On submit the browser cannot show or focus an invalid field in a hidden step, and the submit fails silently ("An invalid form control is not focusable"). The helper catches the `invalid` event, shows that step, and reports the field |
| Focus | After a step change, focus moves to the step's first `legend` or heading, which gets `tabindex="-1"` |
| Indicator | `aria-current="step"` follows. Elements marked `data-step-status` get "completed", "current" or "not completed", replaceable through `options.status` for translation. Status is positional: every step before the current one is completed |
| Change | `interop-steps-change` on the form, detail `{ step, index }` |
| History | `{ history: true }` adds a history entry per step on the same URL. Back and Forward move between reached steps. It never writes the URL, so it does not involve a router, and there are no deep links to a step |

The helper sets attributes and the text of marked status elements. It never
inserts or moves nodes.

`InteropStepsForm` on `form[interop-steps-form]` takes `indicator` (when the
indicator is outside the form) and `history`, binds in `afterRenderEffect`, and
rebinds when an input changes. With `FormsModule` imported, add
`ngNativeValidate`: Angular otherwise adds `novalidate`, which turns off the
validation the steps rely on.

Tested in Chrome: invoker commands, Next gating, focus on the legend, history
Back, the hidden-invalid-field rescue, and submission of every value. Firefox
and Safari validation behavior is unverified.

## Dev audit rules

| Rule | Flags |
|---|---|
| `steps-name` | An indicator with no name |
| `steps-current` | An indicator without exactly one current step |
| `steps-control` | A button or tab in a step, or a link ahead of the current step |
| `steps-form-heading` | A step with no legend or heading |
| `steps-form-hidden` | A step hidden by `disabled` or `hidden="until-found"` |

## Not built

Tab roles, clickable navigation to future steps, a carousel, a pop-up step
menu, a built-in action bar, optional or skippable flags, step error icons,
deep links to a step, a vertical indicator.
