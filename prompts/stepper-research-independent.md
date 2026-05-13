# The Stepper, Reconsidered

A vendor-neutral research report on the multi-step "stepper" / "wizard"
UI pattern. Covers semantic correctness, accessibility, recurring pain
points across the major frontend libraries, the single most-requested
feature, and design recommendations for anyone building a new stepper
primitive.

No library is endorsed here. The conclusions apply equally to any
framework — Angular, React, Vue, Web Components, Svelte — and to any
team writing one from scratch.

---

## 1. The thing nobody told you about steppers

**There is no "Stepper" pattern in the ARIA Authoring Practices Guide.**

The W3C's [ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) documents
32 design patterns: Accordion, Alert, Alert Dialog, Breadcrumb, Button,
Carousel, Checkbox, Combobox, Dialog (Modal), Disclosure, Feed, Grid,
Landmarks, Link, Listbox, Menu/Menubar, Menu Button, Meter, Radio Group,
Slider, Slider (Multi-Thumb), Spinbutton, Switch, Table, Tabs, Toolbar,
Tooltip, Tree View, Treegrid, Window Splitter.

Stepper is not on the list. Neither is "wizard." Neither is "multi-step
form."

Yet every major design system ships one. Material Design has it. iOS
guidelines describe it. Government design systems debate whether to use
it. It's everywhere in production, with no spec to ground the
implementation. So every team picks a pattern — and they pick differently.

This vacuum is the single most important thing to know before you write
a stepper. The remainder of this document is what we found when we
researched it carefully.

---

## 2. Semantic correctness & accessibility

### 2.1 What everyone disagrees about

The most common pattern choice is to model a stepper as a **tablist**:
the step indicators become `role="tab"`, the content panels become
`role="tabpanel"`, the indicator strip is `role="tablist"`. Angular
Material does this. PrimeNG does this. Most React steppers built on
Radix's Tabs primitive inherit it.

The choice is wrong, and you can prove it with a single live bug.

**iOS VoiceOver announces every form field inside a Material stepper
panel with a "tab" suffix** — because the panel has `role="tabpanel"`,
and iOS surfaces that role to AT-users with every announcement inside.
[Filed as angular/components#31559](https://github.com/angular/components/issues/31559),
still open. This is not Material's bug; it's the tabs model's bug. Any
stepper using `role="tabpanel"` will hit it eventually.

The tabs model imports more friction than the iOS one:

- Tabs APG requires *roving tabindex* + *arrow-key navigation between
  tabs* + *automatic activation on focus*. None of that fits a wizard,
  where steps have **order**, **lock semantics**, and **persistent
  completion state**. Tabs are peer alternatives; steps are a sequence.
- `aria-selected` (required on `role="tab"`) is the wrong state model.
  A step is not "selected"; it is *active* in a sequence. Two different
  concepts.
- Tabs are usually all visible at once (you tab between them); steps
  are usually one-at-a-time. The tabs pattern presumes peer panels,
  which is exactly what a wizard violates.

### 2.2 What you should do instead

Use native semantics and the `aria-current="step"` ARIA token —
which exists in the spec
([WAI-ARIA 1.2 §6.6.6](https://www.w3.org/TR/wai-aria-1.2/#aria-current))
*precisely* for this case. Its allowed values include `step`, defined
as "the current step within a process."

Almost nobody uses it. The major libraries reach for `tablist` instead.
You shouldn't.

Concrete recommendation:

| Element | Markup |
|---|---|
| Container | A custom element or `<div>` — no native equivalent |
| Step list | `<ol>` — ordered sequence with meaningful order |
| Step item | `<li>` containing a `<button>` |
| Active step indicator | `aria-current="step"` on the active step |
| Step panels viewport | `<div>` — not a landmark |
| Step panel | `<section>` with `aria-labelledby` to its heading |
| Action bar (Back/Next) | `<div>` — not `role="toolbar"` unless arrow nav is shipped |

The form is **not** the host. A stepper may contain a form, or several
forms, but is not itself a submittable form. Form participation happens
inside panels.

### 2.3 Wiring you should not forget

- **`aria-controls`** on each step button → the panel's `id`. The one
  a11y requirement [MUI documents explicitly](https://mui.com/material-ui/react-stepper/),
  and the one most libraries miss.
- **Single `aria-current="step"`** on the indicator — *not* duplicated
  on the panel. Two `aria-current`s cause double-announcement on some
  screen readers.
- **`aria-orientation`** on the step list when vertical.
- **Don't** apply `role="region"` to every panel. Multiple landmarks
  named "Step 1 / Step 2 / ..." pollute landmark navigation.
- **Visually-hidden status suffix** inside the step button —
  "Completed" / "Error" / "Skipped" — rather than `aria-label` that
  replaces the visible name. The latter desynchronises what sighted
  and AT-users hear.
- **Make the panel's first heading the focus target** when the step
  changes — see §4 below.

### 2.4 Keyboard

There is no canonical keyboard model because there is no APG pattern.
Two camps:

- **Tabs-style** (Material, PrimeNG): roving tabindex, Left/Right
  arrows move focus between step buttons. Imports the tabs UX problems.
- **Independent-button** (MUI, the model recommended here): each step
  button is independently focusable; Tab traverses; Enter/Space
  activates. Simpler. Slower for many-step flows but rare in practice.

Recommendation: ship independent-button by default. Document it as the
explicit contract. Add roving tabindex as an opt-in if a consumer
actually needs it.

### 2.5 Focus management

The single most under-served accessibility behaviour in shipped
steppers: **moving focus to the active panel's content when the user
navigates between steps.** Most libraries focus *nothing*, leaving
screen-reader users with no signal that the panel changed. Some focus
an empty `tabpanel` wrapper, which announces nothing useful.

Recommended pattern:

1. User activates a step (click / Enter / Space / swipe)
2. Panel scrolls into view
3. After the scroll settles (`scrollend`, with a `setTimeout` fallback
   for browsers without `scrollend`), move focus to the panel's first
   heading (`<h1>`–`<h6>`)
4. Use `{ preventScroll: true }` on `.focus()` so the page doesn't shift

When there's no heading in the panel, fall back to focusing the panel
itself with a *temporary* `tabindex="-1"` that's removed on blur — so
the panel is never a permanent tab stop. Angular Material's
[#19574](https://github.com/angular/components/issues/19574) was a
violation of this rule (tabpanel had `tabindex="0"` and became a
no-op focus stop) — read that issue before shipping yours.

### 2.6 Visual / sensory / responsive

- **`prefers-reduced-motion: reduce`** — `scroll-behavior: smooth`
  becomes `auto`, transitions short-circuit, animations don't *speed up*
- **`prefers-contrast: high` / `forced-colors: active`** — indicators
  must remain distinguishable when borders / backgrounds collapse;
  outline on the active state is a safe pick
- **RTL** — use logical properties (`inline-start` / `block-end`); test
  on Safari (historical RTL scroll-position quirks
  [CSSWG-drafts#5984](https://github.com/w3c/csswg-drafts/issues/5984))
- **Touch target size** — WCAG 2.2 SC 2.5.8 requires min 24×24 CSS px
- **Reflow** — content must reflow at 320 CSS px at 400% zoom
  (WCAG 1.4.10)

### 2.7 Spec divergence — make it explicit

| Topic | W3C / spec | APG | Mainstream libs | Recommendation |
|---|---|---|---|---|
| Role for step list | none specified | not patterned | `tablist` | `<ol>` + nav landmark; no `tablist` |
| Active step marker | `aria-current="step"` is the canonical token | n/a | `aria-current` (some); `aria-selected` (when tablist) | `aria-current="step"` |
| Role for panel | none specified | `tabpanel` (under tabs) | `tabpanel` mostly | `<section>` with `aria-labelledby`; no role |
| Keyboard | n/a | tabs APG when tablist used | tabs APG | Independent buttons |
| Inactive panel | n/a | `hidden` | `hidden` or conditional render | `hidden` (preserves state, fast switch) |

---

## 3. Pain points across surveyed libraries

The libraries surveyed: Angular Material, Material UI (React), PrimeNG,
PrimeVue, Headless UI, Radix UI, React Aria / React Spectrum, Ariakit,
shadcn/ui, MUI Base UI, GOV.UK Design System.

Recurring failures, with sources:

- **Tabs semantics imposed on non-tabs interactions** — iOS announces
  panel content with "tab" suffix. See
  [angular/components#31559](https://github.com/angular/components/issues/31559).
- **Focus management on step change is missing or broken** — the
  user activates a step, focus goes nowhere visible, AT-users have no
  signal. Material's
  [#19574](https://github.com/angular/components/issues/19574) was
  a focus-related bug in the same vein.
- **JAWS announces icons inside non-active steps** — indicator graphics
  need to be `aria-hidden`. Material historically didn't —
  [#19009](https://github.com/angular/components/issues/19009).
- **Custom indicators require copying the whole component** — most
  libraries don't expose a template slot for the indicator content,
  forcing fork-and-modify customisation.
- **Animation-engine coupling** — Material's stepper broke when
  Angular 20 changed its animations module
  ([#32147](https://github.com/angular/components/issues/32147)).
  Material-3 theming migration churned the CSS surface again.
- **Linear/non-linear toggle bugs** — runtime changes to `[linear]`
  didn't propagate in Material until recently
  ([#32964](https://github.com/angular/components/issues/32964)).
- **Orientation change re-renders content** — Material's
  [#32641](https://github.com/angular/components/issues/32641): flipping
  horizontal/vertical caused unnecessary content re-renders.
- **DOM lock-in for custom layouts** — consumers can't restructure the
  step list, the indicator, or the action bar without hacks.
- **MUI documents only one a11y requirement explicitly** — each
  `StepButton` requires `aria-controls` pointing at the content section
  ([MUI Stepper](https://mui.com/material-ui/react-stepper/)). Most
  consumer code does not wire it.
- **GOV.UK explicitly does not recommend step indicators on multi-step
  forms** ([GOV.UK patterns](https://design-system.service.gov.uk/patterns/check-answers/)).
  Their research finds: one-thing-per-page + back link + "check your
  answers" page beats numbered steps. Visible step counters increase
  abandonment. This is worth quoting back to product when a stepper is
  being added unnecessarily.

What this list adds up to: **the existing implementations treat
steppers as styled containers, not as accessible interaction patterns.**
The result is that every team writes a wrapper around the wrapper.

---

## 4. The single most-requested feature

### 4.1 The pattern

Filter Angular Material's issue tracker for `stepper + validation` and
the list reads like a single, decade-long conversation:

| # | Filed | Theme |
|---|---|---|
| [#29781](https://github.com/angular/components/issues/29781) | 2024 | `reset()` incorrectly marks form controls as touched/dirty |
| [#29178](https://github.com/angular/components/issues/29178) | 2024 | Feature request: nested stepper inside a step |
| [#25830](https://github.com/angular/components/issues/25830) | 2022 | Custom input validation messages don't surface inside a stepper |
| [#20114](https://github.com/angular/components/issues/20114) | 2020 | Min/max validation on datepicker doesn't refresh on step change |
| [#17355](https://github.com/angular/components/issues/17355) | 2019 | Stepper validates optional/unrequired forms unnecessarily |
| [#17056](https://github.com/angular/components/issues/17056) | 2019 | `mat-error` doesn't trigger on Next-click |
| [#16554](https://github.com/angular/components/issues/16554) | 2019 | `updateValueAndValidity` doesn't propagate state change |
| [#15859](https://github.com/angular/components/issues/15859) | 2019 | `FormControlLike` isn't compatible with `FormGroup` |
| [#14026](https://github.com/angular/components/issues/14026) | 2018 | Navigation prematurely triggers validation on untouched fields |
| [#8645](https://github.com/angular/components/issues/8645)  | 2017 | Steps with pending async validators are still completed |

Earliest 2017, most recent 2024 — **seven-plus years of the same
friction.** Different concrete failures, one underlying gap.

### 4.2 The feature, named

**First-class, reactive form-aware navigation gating — including
reliable async-validator handling, opt-in optional-step semantics, and
stable reset behaviour.**

Plain English: *"I have a form on each step. The stepper should know
when that form is invalid, pending, or untouched, and gate Next/Finish
accordingly — without me re-implementing the gating in every consumer."*

Components of the full feature:

- **Validity gating** — invalid forms block forward navigation
- **Async / pending gating** — pending async validators block forward
  navigation while resolving, with a surfaced pending state
- **Untouched / dirty awareness** — don't show validation errors until
  the user has actually interacted, *and* don't mark fields touched
  when the user merely navigates between steps
- **Optional-step semantics** — declared-optional steps don't gate
- **Reset stability** — `reset()` clears state without forging
  touched/dirty/invalid signals

### 4.3 Where the gap shows up

- **Angular Material** — `[stepControl]` exists. The 12-issue history
  above is the gap.
- **MUI Stepper** — does not ship form integration; consumers wire it
  manually with whichever form library is in scope. Dozens of
  third-party tutorials fill the gap.
- **PrimeNG Stepper** — `[linear]` blocks via a per-step predicate, not
  validity. Consumers wire validity into the predicate themselves.
- **Headless React libraries (Radix, React Aria, Headless UI, Ariakit)**
  — no stepper primitive at all. The form-integration question never
  surfaces because the abstraction is missing.

### 4.4 Why the demand persists

Multi-step forms are **the most common reason developers reach for a
stepper.** Onboarding, checkout, KYC, settings flows, multi-page
surveys, application forms. Yet none of the surveyed libraries provide
a primitive that makes the form-integration part feel done. Consumers
re-implement the gating wiring on every project. That's the signal.

---

## 5. Design recommendations for a new stepper

Pulling §2–§4 together into specific guidance:

### 5.1 Semantics & a11y

1. Use **native ordered-list semantics** (`<ol>`, `<li>`, `<button>`,
   `<section>`). Avoid `tablist`/`tab`/`tabpanel`.
2. Mark the active step with **`aria-current="step"`** on the indicator
   — *only* on the indicator, not duplicated elsewhere.
3. Wire **`aria-controls`** from each step button to its panel id.
4. Auto-wire **`aria-labelledby`** on each panel to its first heading.
5. Hide **indicator graphics** with `aria-hidden="true"`.
6. Communicate step status (Completed / Error / Skipped) via a
   **visually-hidden suffix** inside the button — don't override the
   accessible name with `aria-label`.
7. Apply **`aria-orientation`** to the step list when vertical.
8. Add **`aria-disabled="true"`** to locked steps; render them with a
   native `[disabled]` button so they're focusable-when-disabled if
   needed (don't `aria-disabled` a non-interactive list item host).

### 5.2 Focus management

1. **Move focus to the active panel's first heading** after the
   scroll-into-view settles. With `preventScroll: true`.
2. Fall back to the panel itself with a **temporary** `tabindex="-1"`
   that's removed on blur if there's no heading.
3. Emit a **dev-mode warning** when a panel has no heading — that's
   the focus target by convention.
4. **Don't move focus on mount.** Initial render should not steal focus.

### 5.3 State model

1. Maintain a **monotonic frontier** — the highest index the user has
   ever advanced to. Going back doesn't decrease it. This makes
   "completion is irreversible by navigation" a single source of
   truth, not five scattered booleans. Reset is the only rollback.
2. **Derive auto-status** (`pending` / `active` / `completed`) from
   `activeIndex` + `frontier`. Don't store per-step status.
3. Let consumers **override status** with `error` / `skipped` for
   external validation states.
4. Maintain a separate **`finished`** flag for the terminal state
   (Finish clicked, flow complete). This is what makes the *last
   step* visually complete — frontier-based logic alone can't
   express it, because the frontier equals the active index on the
   last step.

### 5.4 Form integration (the most-requested feature)

1. Expose a **`[stepControl]`-equivalent input** per step, accepting
   the form library's primary control type (`FormGroup`,
   `react-hook-form` `useForm` ref, etc.).
2. **Drive `status`** from the control's invalid / pending / touched /
   dirty / disabled flags.
3. **Gate forward navigation automatically** when the active step's
   control is invalid or pending.
4. **Preserve untouched state** when the user navigates without
   interacting — never silently mark a step's form as touched/dirty.
5. **Reset cleanly** — `reset()` should not synthesise validation
   signals on the forms inside.
6. Distinguish **required gating** from **optional steps** — optional
   steps don't gate.

### 5.5 Layout & customisation

1. **Structural CSS at zero specificity** (`:where(...)` selectors,
   or equivalent) so consumers can override without `!important`.
2. **Token-driven theme layer** separate from structure — values live
   in CSS custom properties, not in selectors.
3. **Indicator template slot** — let consumers replace the indicator
   content without forking the component. The label and status text
   continue to render alongside.
4. **Composable subcomponents** — step list, step item, panel are
   separately reusable.

### 5.6 Demo / docs

1. Linear wizard
2. Non-linear free-navigation
3. Vertical orientation
4. Many-step flow demonstrating horizontal overflow
5. Form-driven status (error / pending)
6. Custom indicator template
7. Reduced-motion comparison
8. Screen-reader walkthrough showing heading focus and
   `aria-current="step"` announcements

### 5.7 What *not* to ship

- **Tabs roles** (`tablist` / `tab` / `tabpanel`)
- **`role="region"` on every panel**
- **Arrow-key roving between step buttons** *as the default* — make it
  opt-in
- **Heavy animation-engine coupling** — native CSS transitions and
  scroll-snap are enough; don't pull in framework-specific animation
  modules
- **A step-counter UI when GOV.UK's research suggests it harms
  abandonment** — document the case where *no* stepper is the right
  answer, and link to GOV.UK's check-answers pattern as the
  alternative

---

## 6. Sources

### Standards

- [W3C WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [ARIA APG patterns index](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [APG Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [`aria-current` definition (WAI-ARIA 1.2 §6.6.6)](https://www.w3.org/TR/wai-aria-1.2/#aria-current)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [HTML Accessibility API Mappings](https://www.w3.org/TR/html-aam-1.0/)
- [Open UI](https://open-ui.org/)

### Design-system references

- [Angular Material Stepper](https://material.angular.dev/components/stepper/overview)
- [Material UI (React) Stepper](https://mui.com/material-ui/react-stepper/)
- [PrimeNG Stepper](https://primeng.org/stepper)
- [Radix UI primitives](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [GOV.UK Design System patterns](https://design-system.service.gov.uk/patterns/)
- [GOV.UK Check your answers pattern](https://design-system.service.gov.uk/patterns/check-answers/)

### Angular Material issues cited

- [#8645 — pending validators don't block step completion](https://github.com/angular/components/issues/8645)
- [#14026 — premature validation on navigation](https://github.com/angular/components/issues/14026)
- [#15859 — `FormControlLike` vs `FormGroup` incompatibility](https://github.com/angular/components/issues/15859)
- [#16554 — `updateValueAndValidity` doesn't propagate state](https://github.com/angular/components/issues/16554)
- [#17056 — `mat-error` doesn't trigger on Next-click](https://github.com/angular/components/issues/17056)
- [#17355 — stepper validates optional forms unnecessarily](https://github.com/angular/components/issues/17355)
- [#19009 — JAWS announces icons in non-active steps](https://github.com/angular/components/issues/19009)
- [#19574 — `tabpanel` should not have `tabindex="0"`](https://github.com/angular/components/issues/19574)
- [#20114 — datepicker validation doesn't refresh on step change](https://github.com/angular/components/issues/20114)
- [#25830 — custom validation messages don't surface](https://github.com/angular/components/issues/25830)
- [#29178 — feature request: nested stepper](https://github.com/angular/components/issues/29178)
- [#29781 — `reset()` marks fields touched/dirty](https://github.com/angular/components/issues/29781)
- [#31559 — iOS announces panel content with "tab" suffix](https://github.com/angular/components/issues/31559)
- [#32147 — animations broken in Angular 20](https://github.com/angular/components/issues/32147)
- [#32641 — orientation change re-renders panel content](https://github.com/angular/components/issues/32641)
- [#32964 — dynamic `[linear]` doesn't propagate](https://github.com/angular/components/issues/32964)
- [#33130 — aria-label support added in v21](https://github.com/angular/components/issues/33130)

### Other

- [CSSWG-drafts#5984 — RTL scroll-position quirks](https://github.com/w3c/csswg-drafts/issues/5984)
