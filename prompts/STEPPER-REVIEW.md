# Stepper — Research Review

Review of Prime's `interop-stepper` in `projects/interop_deprecated`, run
against [new-component-research.md](new-component-research.md). Supersedes the
earlier `stepper-research*.md` and `stepper-presentation.md` where they
disagree.

## Decision

"Stepper" is not one component. Interop ships:

| Part | What | TS |
|---|---|---|
| Step indicator | `ol[interop-steps]`: an ordered list with `aria-current="step"`, numbered and drawn by CSS | None |
| Multi-step form | A recipe: one `<form>`, one `<fieldset>` per step, plain `hidden` on the inactive steps | — |
| `bindSteps(form, options)` | Shows one step, gates Next on the step's validity, rescues an invalid field in a hidden step on submit, focuses the new step's heading, keeps the indicator in step, optional history | Small helper + thin Angular directive |

| Question | Decision |
|---|---|
| Names | `interop-steps`, `bindSteps`. Aliases: stepper, wizard, progress indicator, step indicator, progress tracker, multi-step form |
| Links in the indicator | Allowed on completed steps, never on future ones |
| History | Opt-in `{ history: true }`: a history entry per step, same URL; Back and Forward move between reached steps |
| Angular forms | Document `ngNativeValidate`: `FormsModule` adds `novalidate` |

Do not build: tab roles, clickable navigation to future steps, a carousel or
scroll viewport, a pop-up step menu, a built-in action bar, optional or
skippable flags, step error icons, or anything named "stepper".

## 0. Names

| Term | Means | Use |
|---|---|---|
| stepper | Apple ([UIStepper](https://developer.apple.com/documentation/uikit/uistepper)) and Spectrum: a +/− number control. MUI: a step sequence | Alias only; the name collides |
| step indicator | USWDS ([link](https://designsystem.digital.gov/components/step-indicator/)) | Doc name for `interop-steps` |
| progress indicator, progress tracker, progress steps | Carbon, Atlassian, Red Hat | Aliases |
| multi-step form, wizard | W3C WAI [Multi-page forms](https://www.w3.org/WAI/tutorials/forms/multi-page/) | Recipe name |
| task list, step by step navigation | GOV.UK | Different patterns, out of scope |

## 1. What Prime built

About 2,950 lines (1,737 TS and HTML, 1,209 CSS) and no unit tests, fusing a
step header, tab-like panels, a scroll-snap carousel, a popover listbox menu
and a Back/Next/Cancel bar. About 150 lines are stepper-specific: the frontier,
locking, `blockOn`, finish and status.

| Prime part | Really |
|---|---|
| Step header with status | `<ol>` + `aria-current="step"` |
| Panel registration and wiring | What `bindTabs` does |
| Scroll-snap viewport and swipe | A carousel, the wrong pattern for a form |
| Popover with a listbox | A menu button over the same list |
| Action bar | Buttons the consumer writes |

## 2. Prime's accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| A1 | Focus never reaches the new step: `focus()` on a heading with no `tabindex` does nothing; nothing is announced. The prior research says it works | 2.4.3, 4.1.3 | High |
| A2 | Reached panels are never hidden: screen readers read all of them, Tab enters off-screen steps, and a scroll from Tab or find-in-page can switch steps past the gate | 1.3.2, 2.4.3, 3.2.1 | High |
| A3 | Panel heading ids repeat across steppers, so panels are labelled by another stepper's headings | 1.3.1, 4.1.2 | High |
| A4 | A blocked Next is silent: nothing announced, no error linked | 3.3.1, 4.1.3 | High |
| A5 | No forced-colors rules; step states differ by color only | 1.4.11, 1.4.1 | Medium |
| A6 | Every reached named `<section>` is a region landmark | 1.3.1 | Medium |
| A7 | The menu trigger's name replaces its visible "Step 1 of 3" | 2.5.3 | Medium |
| A8 | `aria-haspopup="menu"` on a trigger whose popup is a listbox | 4.1.2 | Medium |
| A10 | Right-to-left connectors and swipe broken | 1.3.2 | Medium |
| A11 | Swipe bypasses the gate | 3.3.4 | Medium |
| — | Steps added or removed with `@if` misalign every later index | functional | Medium |

## 3. Semantics

There is no ARIA stepper role and no APG pattern. `aria-current="step"`
("the current step within a process", [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current))
on an ordered list is the semantics that exist; the WCAG 3 draft tests for it
([W3C](https://www.w3.org/WAI/WCAG3/informative/layout/user-orientation/current-step-indicated/)).

The W3C tutorial, USWDS and GOV.UK agree: an `<ol>`, the current step marked,
visually hidden status text, "Step N of M" in the title and heading, and focus
on the new step's heading after Next or Back. GOV.UK: try the form without an
indicator first, and avoid indicators that list every step and allow clicking
between them ([question pages](https://design-system.service.gov.uk/patterns/question-pages/)).

Most libraries use tab roles (Angular Material, PrimeNG, Ark/Chakra, MUI with
`StepButton`). The tab model leaks into announcements: Angular Material
[#31559](https://github.com/angular/components/issues/31559) (open) has iOS add
"tab" to every field in a step.

## 4. Relationships

| Neighbor | Relationship |
|---|---|
| Tabs | Free order, no completion: that is tabs. Ordered, dependent steps are not |
| Radio group | None; a step is not a value |
| Breadcrumb, pagination | The structural cousin: an ordered list with `aria-current`, completed items linking back |
| Progress | `<progress>` only when the step count varies |
| `<details name>` | Cannot gate forward movement; wrong for a linear form |
| Carousel (`scroll-marker-group`) | Wrong pattern, Chromium only |

## 5. Platform findings (tested in Chrome 156)

- A hidden step with an invalid field blocks submit silently: "An invalid form
  control is not focusable". Same for `hidden`, `display:none`,
  `hidden="until-found"` and `inert`. The `invalid` event fires on the hidden
  control, so a helper can reveal the step and report again.
- `fieldset.checkValidity()` always returns `true`. A step is checked field by
  field.
- A `disabled` fieldset avoids validation but drops its values from the
  submission. Never disable a step to hide it.
- `hidden="until-found"` would let find-in-page reveal future steps. Steps use
  plain `hidden`.
- One `<form>` keeps every value across steps (WCAG 3.3.7).
- `li:has(~ [aria-current="step"])` draws completed steps with no extra state.

Firefox and Safari validation behavior is unverified.

## 6. What `bindSteps` does

1. Shows one step (`hidden` on the rest, never `disabled`).
2. On Next, reports the current step's first invalid field and stays; otherwise
   advances.
3. On submit, catches `invalid` from a hidden step, reveals that step, reports
   the field, and updates the indicator.
4. Focuses the new step's heading, giving it `tabindex="-1"`.
5. Keeps `aria-current` and the hidden status text on the indicator.
6. Fires `interop-steps-change`.
7. With `{ history: true }`, adds a history entry per step on the same URL and
   follows Back and Forward between reached steps.
8. Returns a function that unbinds.
