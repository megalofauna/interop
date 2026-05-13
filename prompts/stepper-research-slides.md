# Stepper Research — Keynote Slide Segments

Copy-paste source. Each `---` block is one slide. Slide titles are `##` so
they're easy to lift into a "Title + Bullets" Keynote layout. Anything
under `### Speaker notes` is for the presenter only — paste into the
notes pane, not the slide body.

The narrative arc is roughly: *Premise → Standards gap → Pattern survey →
Pain points → The missing feature → What we'd ship → Self-critique →
Decisions*.

Trim or merge as you wire it into Keynote. Tables that span more than
~7 rows are split across two slides on purpose; merge if the audience
is technical enough to read them in one shot.

---

## Stepper

A semantic-first wizard primitive for Angular

### Speaker notes
Five-minute pitch. We're going to walk a research workflow we use for every
new Interop component, applied to a component we *already* shipped — so
this doubles as a critique of our own work.

---

## The twist

Interop already ships `InteropStepper`.

This doc is research **and** review.

### Speaker notes
We followed the same `new-component-research.md` workflow we'd run for a
green-field component. Section 6 turns the same checklist back on
ourselves.

---

## What we shipped

- Native `<ol>` / `<li>` / `<button>` / `<section>` — no synthetic ARIA
- Scroll-snap viewport with gesture + programmatic scroll
- Monotonic completion frontier — irreversible by navigation
- Focus moves to active panel's first heading after scroll settles
- Action bar with Back/Next/Finish + popover menu
- devMode warnings for wrong host tags and missing panel headings

### Speaker notes
The architecture-card lives at `.agent/components/stepper.md`. The
headline is: native semantics over ARIA roles wherever possible.

---

## §1 — Semantic correctness

What is the *right* way to mark up a stepper?

### Speaker notes
Section 1 of every research run. Before we look at incumbents, we need
the yardstick: what does correct look like?

---

## The first finding

**ARIA APG has no stepper pattern.**

32 patterns. None is "Stepper," "Wizard," or "Multi-step form."

### Speaker notes
The Authoring Practices Guide is the de-facto bible for these decisions.
There's no canonical stepper recipe. Every library has had to pick a
pattern — and they disagree.

---

## Who picked what

| Library | Step list | Panel |
|---|---|---|
| Angular Material | `tablist` / `tab` | `tabpanel` |
| PrimeNG | `tablist` / `tab` | `tabpanel` |
| MUI (React) | none | none |
| Radix / React Aria | — no stepper primitive — | |
| GOV.UK | **no step indicator at all** | |

### Speaker notes
Material and PrimeNG defaulted to tabs. MUI shipped no role at all.
Radix and React Aria ducked the question. GOV.UK actively recommends
against step indicators for multi-step forms.

---

## Why "tabs" is the wrong pattern

- Tabs APG requires **roving tabindex** + arrow-key navigation
- Tabs are **peer alternatives** — order doesn't matter
- A stepper has **order**, **lock semantics**, **persistent completion**
- `aria-selected` is the wrong state model
- Step 2 *depends on* step 1; tabs imply independence

### Speaker notes
When you slap `tablist` on a stepper, you import the entire tabs
interaction contract — and that contract actively lies about what your
component does.

---

## The W3C had the answer already

```
aria-current="step"
```

> "...intended for the current step within a process."

— [WAI-ARIA 1.2 §6.6.6](https://www.w3.org/TR/wai-aria-1.2/#aria-current)

### Speaker notes
The exact token exists. Every major library reaches past it for
`tablist`. This is the foundational mistake the rest of the deck builds
on.

---

## Interop's choice

- `<ol>` of `<li>` containing `<button>`
- `<section>` for panels with `aria-labelledby` to first heading
- `<nav aria-label>` wrapping the step list
- `aria-current="step"` on the active step
- **No `tablist`. No `tab`. No `tabpanel`.**

### Speaker notes
We use what HTML already gave us. This is one of the moments where
"semantic correctness first" cashes out as a concrete decision.

---

## Keyboard — two camps

**Camp A** — treat steps like tabs
roving tabindex, arrow keys between steps (Material, PrimeNG)

**Camp B** — each step is an independent button
Tab traverses, Enter/Space activates (MUI, Interop)

### Speaker notes
We picked Camp B because:
- Linear steppers mostly have *disabled* future steps; arrow nav over a
  list of disabled buttons is unhelpful
- The panel is the work surface, not the step list
- Going from B to A is non-breaking. A to B is not.

---

## Focus management

Three navigation events, one rule:

**Move focus to the active panel's first heading after scroll settles.**

`preventScroll: true` so the scroll itself stays smooth.

### Speaker notes
This is the only behaviour the panel directive's docstring describes as
"missing from every major stepper implementation." More on that in §4.

---

## Spec divergence — Interop's positions

| Topic | Mainstream | Interop |
|---|---|---|
| Step list role | `tablist` | `<ol>` + `<nav>` |
| Active step | `aria-selected` | `aria-current="step"` |
| Panel role | `tabpanel` | `<section>` + `aria-labelledby` |
| Keyboard | tabs APG | Independent buttons |
| `aria-controls` step→panel | partial | **add** (currently missing) |

### Speaker notes
The last row is a finding from §6 of our self-review — we don't yet do
the one thing MUI explicitly documents as required.

---

## §2 — Pain points in the wild

What burns developers using existing steppers?

### Speaker notes
Section 2 mines issue trackers for patterns. We focus on Angular
Material because it's our most direct comparison.

---

## Angular Material — the greatest hits

- **#19574** — `tabpanel` had `tabindex="0"`, a meaningless tab stop
- **#19009** — JAWS reads aria-labels of icons in non-active steps
- **#31559** — iOS announces every field with "tab" suffix *(open)*
- **#33130** — couldn't set `aria-label` on the stepper container until v21
- **#32964** — toggling `[linear]` at runtime didn't update the UI

### Speaker notes
The iOS bug is the strongest argument against the tabs model: it's
*actively misleading* screen-reader users. Material can't fix it
without abandoning `tablist`.

---

## Angular Material — more issues

- **#32641** — orientation change re-rendered `matStepContent`
- **#32147** — animation engine broke in Angular 20
- **#31788** — locked-step hover affordances inconsistent

### Speaker notes
The pattern: every architectural shortcut compounds. Animation engine
dependency, ngIf-driven content, runtime-static inputs.

---

## The rest of the landscape

- **MUI** — documents `aria-controls` as required; unmounts panels by default
- **PrimeNG** — also `tablist`/`tab`/`tabpanel`; per-step "linear function"
- **Radix, React Aria, Headless UI, Ariakit** — no stepper primitive
- **Shadcn** — community variants on top of Radix Tabs (same problems)

### Speaker notes
The headless ecosystem ducked the problem. Composing one on top of Radix
Tabs inherits every issue we just listed.

---

## The principled minimalist

GOV.UK Design System: **no step indicator at all.**

Research found:
- One-thing-per-page beats progress indicators
- Back link + "check your answers" beats numbered steps
- Visible step counters increase abandonment

### Speaker notes
Worth pairing in Interop docs as a counterpoint. Not every multi-step
flow should use a stepper. Steppers are appropriate when steps are
long, when reviewing earlier steps matters, or when the flow is
non-linear.

---

## Recurring complaints across libraries

- Tabs semantics applied to a non-tabs interaction
- No focus management on panel change
- Form integration friction
- DOM lock-in for custom indicators
- Animation engine coupling
- Linear-mode toggles that don't react at runtime

### Speaker notes
Six themes. Five of the six trace back to *one* architectural choice:
treating the stepper as tabs.

---

## §3 — The single most-requested feature

What do consumers want that no library ships well?

### Speaker notes
Pain points cover what's broken. This section names what consumers
*ask for* — a different signal.

---

## The 12-issue pattern

Filter Material issues for "stepper + validation."

**Twelve issues. 2017 → 2024. Same conversation.**

- #29781 — reset() incorrectly marks controls touched/dirty
- #14026 — navigation prematurely triggers validation
- #8645 — async-pending steps treated as completed
- ...and nine more

### Speaker notes
Seven-plus years of friction, all pointing at the same gap.

---

## The feature, named

> First-class, reactive form-aware navigation gating —
> with reliable async-validator handling, opt-in optional-step semantics,
> and stable reset behaviour.

### Speaker notes
In plain language: "I have a form on each step. The stepper should know
when it's invalid, pending, or untouched, and gate Next accordingly —
without me re-implementing the wiring every project."

---

## What it actually comprises

- **Validity gating** — invalid forms block forward navigation
- **Async gating** — pending validators block while resolving
- **Untouched/dirty awareness** — no errors before interaction
- **Optional-step semantics** — declared-optional steps don't gate
- **Reset stability** — clearing doesn't forge touched/dirty/invalid

### Speaker notes
The full feature isn't one boolean. Material's `[stepControl]` is the
*primitive* — but the surrounding details are what the 12 issues are
about.

---

## Where it's filed

- **Material** — `[stepControl]` exists, unreliably
- **MUI** — no form integration at all
- **PrimeNG** — `[linear]` is a per-step function, not validity-aware
- **Radix / React Aria / Headless UI / Ariakit** — no stepper at all

### Speaker notes
No incumbent ships this well. Material gets closest and is the most
complained about. Interop has `[blockOn]` and `[status]` today — the
surface, not the full feature.

---

## Recommendation

**Highest-priority follow-up after current a11y fixes.**

Not a current Interop strength. Worth elevating from "convenience" to
"primary surface for form-based wizards."

### Speaker notes
This is the team's next stepper milestone if we want to claim the
form-wizard niche.

---

## §4 — Killer differentiator

What makes Interop's stepper meaningfully different?

### Speaker notes
"We do it accessibly" is table stakes, not a differentiator. We need
something a Material refugee would call "finally."

---

## The bet — focus the heading

When a panel becomes active, focus moves to its first `<h1>`–`<h6>`.

**No major library does this.**

Material focuses nothing. MUI focuses nothing. PrimeNG focuses a wrapper.

### Speaker notes
Screen-reader users in every shipping stepper have no idea the panel
changed. We're the only ones who fix it. This is the differentiator
that ships now.

---

## The second bet — honest semantics

`aria-current="step"` on a real `<ol>`. No tabs.

Pair with Material's iOS bug (#31559) and the marketing line writes
itself:

> "Material's stepper makes iOS announce every form field with 'tab'.
> Interop does not, because Interop is not a tablist."

### Speaker notes
The headline argument for a comparison post when we're ready to publish.

---

## Secondary differentiators

- Monotonic frontier — completion irreversible by navigation
- Scroll-snap viewport with gesture support
- Heading-based panel labelling — no separate label prop
- `[indicatorTemplate]` swaps indicator without losing ARIA wiring

### Speaker notes
Nice, not killer. They strengthen the story but the heading-focus and
honest-semantics pair is what people will copy.

---

## §5 — Implementation plan

(Already shipped — included for the workflow's sake.)

### Speaker notes
This is what the workflow would produce for a green-field component.
Skim it; the interesting section is the next one.

---

## Decision summary

- Host: `<interop-stepper>` custom element
- Step list: `<ol>` of `<li>` containing `<button>`
- Panels: `<section>` with `aria-labelledby` to first heading
- Roles: no `tablist`/`tab`/`tabpanel`; `aria-current="step"`
- Keyboard: independent buttons (Tab + Enter/Space)
- Focus: active panel's heading, after scroll settles
- State: monotonic frontier + auto-status + overridable `[status]`

### Speaker notes
Seven decisions. Each one falls out of §1 or §4.

---

## Component tree (shape)

```
<interop-stepper>
  <nav aria-label>
    <ol interop-step-list>
      <li interop-step>
        <button>…</button>
      </li>
    </ol>
  </nav>
  <div #viewport scroll-snap>
    <section interop-step-panel>…</section>
  </div>
  <div actions-bar>…</div>
</interop-stepper>
```

### Speaker notes
Native everything. The only custom-element-only piece is the container
itself, because no native equivalent exists.

---

## §6 — Critiquing our own work

Same checklist. Different target. Us.

### Speaker notes
Section 6 is why this doc exists. The workflow that finds Material's
flaws also finds Interop's.

---

## 🔴 Fix — missing `aria-controls`

The step button has no `aria-controls` pointing at its panel.

MUI documents this as the *one required* a11y relationship.

**Fix:** stable id on each panel; `[attr.aria-controls]` on the button.

### Speaker notes
Embarrassing because MUI calls it out explicitly. Cheap fix.

---

## 🔴 Fix — accessible name overrides

Today: `aria-label="Step 1: Profile — Completed"` *replaces* visible content.

Sighted users see "1 Profile." SR users hear "Step 1: Profile — Completed."

**Fix:** drop the override. Use visible content + visually-hidden status node.

### Speaker notes
Visible label should *be* the accessible name. Status communicated via
visually-hidden span — works on every AT.

---

## 🔴 Fix — duplicate `aria-current`

`aria-current="step"` is on both the `<li>` and the `<section>`.

Spec says: one element identifies the current item.

**Fix:** keep on the step indicator only.

### Speaker notes
Risks double announcement. Easy to remove.

---

## 🟡 Consider

- Drop explicit `role="region"` on every panel (or scope to active)
- Drop `aria-disabled` from `<li>` host — native `[disabled]` suffices
- Add `aria-orientation` to step list
- Add RTL smoke test
- Document `[indicatorTemplate]` + label interaction

### Speaker notes
Lower severity. None are actively broken; all are noise reduction.

---

## 🟢 Confirm

- Indicator graphics correctly hidden from AT (avoids Material #19009)
- Panel fallback focus correct (avoids Material #19574)
- Linear/non-linear is signal-driven (avoids Material #32964)
- `[hidden]` on locked panels prevents swipe-past-frontier
- Default `aria-label="Progress"` retained — consumer's job to disambiguate

### Speaker notes
Things we got right. Worth documenting so we don't regress.

---

## Recommended changes

| # | Severity | Change |
|---|---|---|
| 5.1 | 🔴 | Add `aria-controls` step → panel |
| 5.2 | 🔴 | Drop `aria-label` override; use visible content + hidden status |
| 5.3 | 🔴 | Remove `aria-current` from panel |
| 5.4 | 🟡 | Drop `role="region"` from panel |
| 5.5 | 🟡 | Drop `aria-disabled` from `<li>` |
| 5.6 | 🟡 | Add `aria-orientation` |
| 5.12 | 🟡 | RTL smoke test |
| 5.13 | 🟡 | Document indicator-template + label |

### Speaker notes
Three red, five yellow. Net effect: less ARIA, not more.

---

## §7 — Open questions, resolved

1. Keyboard model — independent buttons (Camp B). Locked in.
2. `[status]="error"` does **not** block by default. Opt-in via `blockOn`.
3. `reset()` clears frontier; does **not** clear consumer `[status]`.
4. `finish` only fires when `linear=true` and on the last step.
5. Multiple steppers per page — no warning; consumer's job to disambiguate.

### Speaker notes
Five decisions that close the design loop. Two require code changes
(blockOn input, finish gating); three are doc-only.

---

## Closing — the workflow worked

- Found a foundational pattern mistake in incumbents (tabs ≠ stepper)
- Found a 7-year unsolved demand (form-aware gating)
- Named two differentiators (heading focus, honest semantics)
- Found three real bugs in our own shipped component

### Speaker notes
Same workflow on a different component would find different things —
that's the point. The checklist is the value, not any one finding.

---

## Sources

- ARIA APG patterns — https://www.w3.org/WAI/ARIA/apg/patterns/
- WAI-ARIA `aria-current` — https://www.w3.org/TR/wai-aria-1.2/#aria-current
- GOV.UK patterns — https://design-system.service.gov.uk/patterns/
- MUI Stepper — https://mui.com/material-ui/react-stepper/
- Material Stepper — https://material.angular.dev/components/stepper/overview
- Material #31559 (iOS "tab") — https://github.com/angular/components/issues/31559
- Material #19574 (tabpanel tabindex) — https://github.com/angular/components/issues/19574
- Material #14026 (premature validation) — https://github.com/angular/components/issues/14026

### Speaker notes
Full list in `prompts/stepper-research.md` §8. These are the load-bearing
links for anyone who wants to verify the claims.
