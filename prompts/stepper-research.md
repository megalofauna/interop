# Stepper — New Component Research

Generated against the `new-component-research.md` workflow with the
companion checklists ([`semantics-a11y-checklist.md`](research/semantics-a11y-checklist.md)
and [`library-catalog.md`](research/library-catalog.md)).

**Twist:** Interop already ships `InteropStepper`. This document doubles as
a review of the existing implementation — see §5.

---

## 0. Existing implementation snapshot

Files (see [`.agent/components/stepper.md`](../.agent/components/stepper.md)
for the full mental-model card):

```
projects/interop/src/lib/components/interop-stepper/
  interop-stepper.ts              container; owns frontier, scroll-snap, action bar
  interop-stepper.html
  interop-stepper.token.ts        IInteropStepper, StepperNavContext, StepPanelRef
  interop-step.ts                 component on li[interop-step]
  interop-step-list.directive.ts  directive on ol[interop-step-list]
  interop-step-panel.directive.ts directive on section[interop-step-panel]
```

Headlines:

- Native `<ol>` + `<li>` for the step list, native `<button>` per step,
  native `<section>` per panel — no synthetic ARIA roles imposed where the
  element already conveys the semantic
- Scroll-snap viewport with gesture + programmatic scroll coordination
- Monotonic completion frontier (irreversible by navigation; only `reset()`
  clears it)
- Focus moves to the active panel's **first heading** after scroll settles
  (currently a rare behaviour across libraries — see §3)
- Auto-status derived (`pending`/`active`/`completed`); consumer can
  override with `error`/`skipped`
- Built-in action bar with Back/Next/Finish + optional Cancel and a shared
  popover menu (compact nav-trigger on narrow, action-bar trigger on wide)
- DevMode warnings for missing parent, wrong host tag (`<ol>`/`<section>`),
  and panel without heading

---

## 1. Semantic correctness & accessibility

### 1.1 Stepper is not an APG pattern

The first material finding: **the ARIA Authoring Practices Guide does not
document a "Stepper", "Wizard", or "Multi-step form" pattern.** The 32 APG
patterns are: Accordion, Alert, Alert Dialog, Breadcrumb, Button, Carousel,
Checkbox, Combobox, Dialog (Modal), Disclosure, Feed, Grid, Landmarks, Link,
Listbox, Menu/Menubar, Menu Button, Meter, Radio Group, Slider, Slider
(Multi-Thumb), Spinbutton, Switch, Table, Tabs, Toolbar, Tooltip, Tree View,
Treegrid, Window Splitter.
([source — APG patterns index](https://www.w3.org/WAI/ARIA/apg/patterns/))

Consequently every major library has had to *pick* a pattern, and they
disagree.

| Library | Role chosen for step list | Role chosen for panel |
|---|---|---|
| Angular Material | `role="tablist"` + `role="tab"` | `role="tabpanel"` (post-fix; see #19574) |
| MUI (React) | No `role` on stepper; `aria-controls` on `StepButton` | None documented; recommends `aria-controls` link |
| PrimeNG | `role="tablist"` / `role="tab"` / `role="tabpanel"` (variant-dependent) |  |
| Radix / React Aria | No "stepper" primitive ships |  |
| GOV.UK | **No step indicator at all** — one-thing-per-page + back link + check-answers pattern ([source](https://design-system.service.gov.uk/patterns/check-answers/)) |  |

The `tablist`/`tab`/`tabpanel` choice (Material, PrimeNG) is the most
common, but it imports the **tabs interaction contract** that doesn't
actually fit a wizard:

- Tabs APG requires roving tabindex + arrow-key navigation between tabs,
  and "tabs activate automatically when they receive focus as long as their
  associated tab panels are displayed without noticeable latency"
  ([source](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)).
- A stepper has **order**, **lock semantics**, and **persistent completion
  state**. Tabs explicitly do not. Steps 1 and 2 are not peer alternatives;
  step 2 *depends on* step 1.
- `aria-selected` (required on `role=tab`) is the wrong state model — a
  step is not "selected", it is "active in a sequence".

The W3C-defined `aria-current="step"` token *exists specifically for this
case* — its allowed values include `step`, intended for "the current step
within a process"
([WAI-ARIA 1.2 §6.6.6 aria-current](https://www.w3.org/TR/wai-aria-1.2/#aria-current)).
Yet most libraries don't use it; they reach for `tablist` instead.

**Recommended path:** use native semantics (`<ol>` of `<li>` containing
`<button>`s; `<section>`s for panels) and `aria-current="step"` on the
active step button. Do **not** apply `role="tablist"`. This is what
Interop already does. Document this divergence prominently — consumers
migrating from Material will expect tabs semantics and need to be told why
we don't ship them.

### 1.2 Host element & DOM (per [semantics-a11y-checklist §1](research/semantics-a11y-checklist.md#1-host-element--dom))

| Region | Element | Why |
|---|---|---|
| Container | `<interop-stepper>` (custom element) | No native equivalent; needs a coordinating root |
| Step list | `<ol interop-step-list>` | Ordered sequence with meaningful order; native list semantics + numbering |
| Step item | `<li interop-step>` containing `<button>` | List item is the unit; button is the interactive control |
| Step panels viewport | `<div #viewport>` | Scroll-snap container; not a landmark |
| Step panel | `<section interop-step-panel>` | A self-contained part of the document; ideal for `aria-labelledby` to its heading |
| Action bar | `<div class="interop-stepper__actions">` | Plain region; not `role="toolbar"` unless arrow-key navigation is shipped |

`<form>` is **not** the host — a stepper may contain a form, or several,
but is not itself a submittable form. Form participation happens *inside*
panels.

### 1.3 ARIA — roles, properties, states

- **`aria-current="step"`** on the active step's button (or the `<li>`
  per spec-letter — the value is on whichever element identifies the
  current step in the sequence). InteropStepper applies it on both the
  `<li>` host and the panel (see §5 — likely should not be on both).
- **`aria-label`** on the navigation landmark (`<nav>`) wrapping the step
  list. Default "Progress" is OK; consumers should override when multiple
  steppers coexist on a page (multiple navs with the same label collapse
  into "Progress, Progress" in landmark navigation).
- **`aria-disabled`** vs native `[disabled]`: native disabled on the
  `<button>` is correct for locked steps in linear mode. `aria-disabled`
  on the `<li>` host is redundant when the inner button is disabled and
  arguably misleading (the `<li>` is not interactive).
- **`aria-controls`** on each step's button pointing at the panel id:
  **missing today** ([see §5 review](#5-review-of-existing-interopstepper)).
  MUI explicitly calls this out as a requirement
  ([MUI Stepper docs](https://mui.com/material-ui/react-stepper/)). Adding
  it is cheap and meaningful.
- **`aria-orientation`** on the step list when vertical: signal layout to
  AT-users navigating with directional keys. Default `horizontal`.
- **No `role="region"` on every panel.** Multiple landmarks named "Step 1
  / Step 2 / Step 3" pollute landmark navigation. Either:
  - Drop the role entirely (panel is just a labelled `<section>`,
    `aria-labelledby` to its heading), or
  - Apply `role="region"` *only* to the active panel
  - Current Interop default applies it to every panel — see §5

### 1.4 Keyboard interaction

There is no canonical keyboard model for steppers because there is no APG
pattern. Two camps:

**Camp A — Treat the step list like tabs (Material, PrimeNG):**
roving tabindex, Left/Right arrows move focus between step buttons,
Home/End jump to first/last. Inherits tabs UX baggage.

**Camp B — Treat each step button as an independent button (Interop today,
MUI):** Tab traverses each step button in order; Enter/Space activates.
Simpler, more discoverable, but slower to navigate many steps.

For Interop, Camp B is correct *by default* because:
- Linear-mode steps are mostly *disabled*; arrow navigation over a list of
  mostly-disabled buttons is unhelpful UX
- The step list is not the primary work surface — the panel is. Focusing
  the active panel's heading on entry is the more valuable behaviour
- Consumers who want arrow navigation between steps can opt into it (or
  it can be added later) — going from Camp B to Camp A is non-breaking;
  the reverse is not

Recommend documenting "step buttons are independent buttons; Tab
traverses, Enter/Space activates" as the explicit keyboard contract, and
listing the Action Bar keyboard model separately:

| Key | Action |
|---|---|
| Tab | Move to next focusable (step button, action bar control, panel content) |
| Enter / Space | Activate focused control |
| Escape (on popover menu open) | Dismiss menu, return focus to trigger |
| Arrow keys (inside listbox menu) | Native listbox roving |

### 1.5 Focus management

Three distinct focus events:

1. **Step button activated (click/Enter/Space)** → scroll panel into view
   → on scroll settle, move focus to the panel's first heading. Currently
   implemented; behaviour is correct.
2. **Action bar Back/Next/Finish** → same path as above. Currently correct.
3. **Gesture swipe** → on scroll settle (`scrollend`), update activeIndex
   and move focus to the destination panel's heading. Currently correct,
   but worth verifying behaviour on iOS (see #31559 below — Material's
   stepper has had recent issues with iOS announcement quirks in panels).

The panel-heading focus model is *unusually good* — see §3.

**Initial focus on mount:** the stepper does NOT move focus on init —
correct. Mounting a component should not steal focus.

**Focus return:** after the popover menu closes (programmatically via
`menuPopover.close()` after step select), focus return is handled by the
popover. Worth a behavioural test that focus lands on a sensible target
after menu-driven navigation (likely: the destination panel's heading,
not back on the menu trigger).

**`:focus-visible`:** Interop's convention applies. Step buttons should
show focus rings via the CSS pseudo-class.

### 1.6 Accessible name & description

- **Step button name source today:** `aria-label="Step N: Label —
  Completed"` *overrides* the visible content (indicator + label).
  Concern: AT users hear "Step 1: Profile — Completed" but the visible
  text reads "1 Profile". The visible label is not the accessible name.
  Best-practice is to make the visible text be the accessible name, and
  add status context via a visually-hidden status node or
  `aria-describedby`. ([See §5.](#5-review-of-existing-interopstepper))
- **Panel name source:** auto-wired `aria-labelledby` to the panel's
  first heading, with a generated id when the heading lacks one.
  Correct. DevMode warning for missing heading is correct.
- **Navigation landmark name:** `<nav aria-label>` — fine; default could
  be more unique than "Progress" when multiple steppers exist on a page.

### 1.7 Visual / sensory / responsive

- **`prefers-reduced-motion`:** scroll-snap programmatic scroll honours
  it (`behavior: 'instant'`). Good. Verify CSS-side animations on
  indicator state changes also honour it.
- **`forced-colors` / high-contrast:** indicators rely on
  `border-color`/`background-color` differences — must hold up in
  forced-colors mode. SVG icons should use `currentColor`.
- **RTL:** scroll-snap on the inline axis must flip — `scrollLeft`
  computations assume LTR. The current code uses
  `elRect.left - vpRect.left` which works for both LTR and RTL because
  it's a delta in client coordinates, but **needs explicit testing**
  given Safari's historical RTL scroll quirks
  ([CSSWG-drafts#5984](https://github.com/w3c/csswg-drafts/issues/5984)).
- **Touch target size:** WCAG 2.2 SC 2.5.8 requires 24×24 CSS px
  minimum. Step buttons in horizontal orientation can be tight in narrow
  containers — verify minimum sizes in the theme layer.
- **Reflow / zoom (WCAG 1.4.10):** horizontal stepper with many steps
  must not require horizontal page scroll at 320 CSS px. The compact
  nav-trigger pattern (popover menu when narrow) handles this — verify
  the container-query breakpoint.

### 1.8 Form participation

Interop's stepper does **not** participate in any form on its own. Each
panel may contain a form (or fragments). The stepper exposes
`stepAttempt` and `finish` outputs so the consumer can gate progression
on form validity. Consumers wire `[status]` per step to surface error
states from external validation.

This is the correct choice — making the stepper itself a form-associated
custom element would conflate "container of forms" with "form control".

### 1.9 Spec divergence — explicit positions

| Topic | W3C / spec | APG | Mainstream DS | Interop position |
|---|---|---|---|---|
| Role for step list | none specified | not patterned | `tablist` (Material, PrimeNG); none (MUI) | `<ol>` + `<nav aria-label>`, no `tablist` |
| Role for active step | `aria-current="step"` is the canonical token | n/a | `aria-current` (some); `aria-selected` (when `tablist` used) | `aria-current="step"` |
| Role for panel | none specified | `tabpanel` (under tabs model) | `tabpanel` (Material, PrimeNG); none (MUI) | `<section>` with `aria-labelledby`; consider dropping or scoping `role="region"` |
| Keyboard model | n/a | tabs APG when `tablist` used | mostly tabs APG | Independent buttons (Camp B); document explicitly |
| `aria-controls` step→panel | best practice when relationship matters | n/a | partial; MUI calls it out | Add (currently missing) |
| Inactive panel state | n/a | `hidden` if not active | `hidden` (Material), conditional render (others) | Active = visible in scroll-snap; locked = `[hidden]` |

---

## 2. Pain points in existing implementations

References by library — issue IDs link to source so future-you can verify.

### 2.1 Angular Material

The primary comparison. Issues filed against `mat-stepper`:

- **[#19574 — `tabpanel` should not have `tabindex="0"`](https://github.com/angular/components/issues/19574)**
  Fixed. Material previously made the tabpanel itself a tab stop,
  inserting a meaningless focusable container between step button and
  first input. *Lesson:* don't make the panel container keyboard-focusable
  unless there's no other focus target. Interop's panel directive uses
  `tabindex=-1` only as a fallback when no heading is present, and
  removes it on blur. Correct.
- **[#19009 — JAWS reads `aria-label` for icons in non-active steps](https://github.com/angular/components/issues/19009)**
  Fixed. The indicator icons inside non-active steps had `aria-label`s
  that JAWS surfaced redundantly. *Lesson:* indicator graphics inside
  step buttons should be `aria-hidden="true"`. Interop does this
  (`<span class="interop-step__indicator" aria-hidden="true">`). Correct.
- **[#31559 — iOS announces panel content with "tab" suffix](https://github.com/angular/components/issues/31559)**
  Open. iOS VoiceOver pronounces every label/field inside a panel with
  "...tab" because the panel has `role="tabpanel"`. *Lesson:* the
  tablist/tab/tabpanel model is *actively misleading screen-reader users*
  in Material. This is the strongest direct argument against the tabs
  model for steppers. **Interop avoids this entirely by not using the
  role.**
- **[#33130 — aria-label support on mat-stepper](https://github.com/angular/components/issues/33130)**
  Recently closed. Until v21 you could not set an accessible name on the
  stepper itself without DOM hackery. *Lesson:* always expose
  `aria-label`/`aria-labelledby` on the container from day one. Interop
  does (defaulted to "Progress").
- **[#32964 — dynamic [linear] input does not update UI](https://github.com/angular/components/issues/32964)**
  Recently closed. Toggling linear mode at runtime didn't propagate. In
  Interop the linear flag is a signal input — derived state reacts
  automatically. Worth verifying with a demo test.
- **[#32641 — orientation change re-renders matStepContent](https://github.com/angular/components/issues/32641)**
  Recently closed. Performance regression on orientation flip. Interop
  uses CSS-driven orientation rearrangement (same DOM, different layout)
  — no re-render needed. Correct.
- **[#32147 — animations broke in Angular 20](https://github.com/angular/components/issues/32147)**
  Material's heavy animation framework dependency. Interop relies on
  native CSS transitions and `scrollTo({ behavior })` — no Angular
  animations engine dependency. Correct.
- **[#31788 — unclear hover behaviour in linear mode](https://github.com/angular/components/issues/31788)**
  Open, low-priority. Locked steps in Material show inconsistent hover
  affordances. Interop relies on native `:hover` and the `--locked`
  class — verify the theme layer makes locked vs reachable visually
  distinct.

### 2.2 MUI (Material UI / React)

- Documents **one** a11y requirement explicitly: "each `StepButton`
  requires an `aria-controls` attribute pointing at the content section
  element" ([source](https://mui.com/material-ui/react-stepper/)).
- Content unmounts when step closes by default; consumers must opt into
  `unmountOnExit: false` to preserve state. *Lesson:* Interop's panels
  stay mounted (and `[hidden]` when locked); state preservation is
  free for the consumer. Correct.
- Three variants — Horizontal, Vertical, Mobile (text/dots/progress).
  Useful taxonomy; the Mobile variant is essentially what Interop's
  compact nav-trigger collapses to.

### 2.3 PrimeNG

PrimeNG ships two stepper APIs (the older "Steps" + "StepperPanel"
composite, and a newer composable Stepper). Both use
`tablist`/`tab`/`tabpanel` — see §1.1 for the inherent problem with this.
PrimeNG is also a recurring source of "the DOM is locked, I can't
restructure" customization complaints on its issue tracker (general
PrimeNG critique, not stepper-specific).

### 2.4 Headless landscape — what's missing entirely

- **Radix UI:** No stepper primitive.
  [Radix primitives list](https://www.radix-ui.com/primitives/docs/overview/introduction)
  covers Accordion, Dialog, Tabs, Toolbar, etc. — no Stepper. Composing
  one from Radix Tabs imports the tabs UX problems described above.
- **React Aria / React Spectrum:** No stepper hook. The closest is
  `useTabList` — same problem.
- **Headless UI (Tailwind Labs):** No stepper.
- **Ariakit:** No stepper.
- **Shadcn:** No stepper component. Community-built variants exist on
  top of Radix Tabs (see e.g. [`shadcn-stepper` projects on
  GitHub](https://github.com/search?q=shadcn+stepper&type=repositories))
  — all inherit Tabs semantics.

**This is the gap.** A stepper-as-stepper headless primitive does not
exist in the major React ecosystem. Interop has an opportunity to be
*the* canonical implementation of a non-tabs stepper.

### 2.5 GOV.UK — the principled minimalist position

[GOV.UK Design System patterns](https://design-system.service.gov.uk/patterns/)
explicitly does **not** recommend a step indicator for multi-step forms.
Their research finds:
- One-thing-per-page beats a wizard-with-progress
- Back link + "check your answers" page beats numbered steps
- Visible step counters increase abandonment when users see how many
  steps remain

This is worth quoting in the Interop docs as a counterpoint: *not every
multi-step flow should use a stepper.* The stepper is appropriate when
steps are non-trivially long, when reviewing earlier steps matters, or
when the process is fundamentally non-linear. For short linear forms,
prefer no stepper.

### 2.6 Recurring complaints across libraries

- **Tabs semantics applied to a non-tabs interaction** — every
  Material-derived implementation has this; iOS exposes it most loudly
  (#31559)
- **No or fragile focus management on panel change** — most libraries
  focus nothing (so SR users miss the context switch) or focus a wrapper
- **Form integration friction** — libraries that bake form-state
  assumptions in conflict with apps that use external validation libs
- **DOM lock-in for custom indicators** — most libraries do not let
  consumers replace the indicator without copying the whole component
- **Animation engine coupling** — Material 20 broke stepper animations;
  Material 3 migration churned theming
- **Linear/non-linear toggles don't react at runtime** — recurring bug
  (#32964) when the property isn't signal-based

---

## 3. Killer differentiator

Two, both partially in place; one needs to land.

### 3.1 Focus moves to the active panel's heading after navigation

**This is the bet.** Most libraries focus nothing when the user
activates a step — the screen reader user has no idea the panel changed.
Some libraries focus a tabpanel wrapper that's invisible. Interop moves
focus to the *content's* first `<h1>`–`<h6>` after the scroll-snap
settles, with `preventScroll: true` so the scrolling stays smooth.

This is correct, accessible, and **rare**. It's also the behaviour the
panel directive's docstring already claims:

> *"When a panel becomes active (scroll settles on it, or programmatic
> nav), focus is moved to its first heading. The accessibility behaviour
> missing from every major stepper implementation."*

Document this prominently. Demo it on the live demo page with a
screen-reader-readable example. Write a comparison post that names
names (Material, MUI, PrimeNG: focus nowhere; Interop: focus the
heading).

### 3.2 No tabs roles — `aria-current="step"` on a real ordered list

The semantically correct choice the major libraries didn't make. Pair
this with the iOS bug report (#31559) and the message writes itself:
"Material's stepper makes iOS announce every form field with 'tab'.
Interop does not, because Interop is not a tablist."

Together those two — heading focus + no tabs imposture — make Interop's
stepper meaningfully different from every shipping alternative.

### 3.3 Secondary differentiators (nice, not killer)

- **Monotonic frontier model** — completion is irreversible by
  navigation; only `reset()` clears it. Eliminates a whole class of
  "should completed turn back into pending if I go back?" bugs that
  Material has shipped variations of
- **Scroll-snap viewport with gesture support** — most steppers are
  click-only; Interop's also responds to touch swipe
- **Heading-based panel labelling** — auto-wires `aria-labelledby` to
  the consumer's existing `<h2>`, no separate label prop required
- **Indicator template override** without losing default behaviour —
  `[indicatorTemplate]` swaps just the indicator content while keeping
  status logic, focus, and ARIA wiring

---

## 4. Implementation plan (for net-new components, applied retroactively to InteropStepper)

### 4.1 Decision summary

- **Host:** `<interop-stepper>` custom element (no native equivalent
  available)
- **Step list:** `<ol interop-step-list>` of `<li interop-step>` containing
  `<button>`
- **Panels:** `<section interop-step-panel>` with `aria-labelledby` to
  first heading
- **Role choices:** no `tablist`/`tab`/`tabpanel`; `aria-current="step"`
  on the active step; reconsider `role="region"` on panels (drop or
  scope to active panel)
- **Keyboard:** each step button is an independent button (Tab traversal,
  Enter/Space activation); no roving tabindex by default
- **Focus on navigation:** active panel's first heading, after scroll
  settles, with `preventScroll: true`
- **Form participation:** none at the stepper level; panels contain
  forms; `stepAttempt`/`finish` outputs let consumers gate progression
- **State model:** monotonic frontier, derived auto-status,
  consumer-overridable `[status]`

### 4.2 Component tree

```
<interop-stepper>                     // container, owns state
  <nav aria-label>                    // navigation landmark wrapping the step list / nav trigger
    [compact nav-trigger button]      // narrow viewports — opens popover menu
    <ol interop-step-list>            // wide viewports — full step list
      <li interop-step>               // host: aria-current="step" when active
        <button>                      // step trigger, [disabled] when locked
          <span aria-hidden indicator>...
          <span step label>...
        </button>
      </li>
    </ol>
  </nav>
  <div #menuPopover interop-popover>  // shared popover (compact + action-bar triggers)
    <ul interop-listbox>...</ul>
    -- OR --
    <ng-template stepListTemplate>    // vertical orientation: rich step list inside popover
  </div>
  <div #viewport scroll-snap>
    <section interop-step-panel>      // aria-labelledby={panel heading}, [hidden] when locked
      <h2>...</h2>
      ...
    </section>
    ...
  </div>
  <div actions-bar>                   // optional; replaceable via [interop-stepper-actions]
    <button back>...
    <button next-or-finish>...
    [menu trigger | cancel | spacer]
  </div>
</interop-stepper>
```

Reference [`.agent/playbook.md`](../.agent/playbook.md) for the host
directive / standalone / OnPush / signal-input conventions — not
restated here.

### 4.3 CSS plan

Reference [`.agent/css-strategy.md`](../.agent/css-strategy.md) for the
structural vs theme split. Specifics for stepper:

- Structural (`styles/components/stepper.css`): scroll-snap viewport
  geometry, container queries that swap full step list vs compact
  trigger, action-bar layout (`margin-inline-start: auto` on first
  child, `order: -1` on `n+3`)
- Theme (`styles/themes/protocol/components/stepper.css`): indicator
  sizing, connector colours per status (`--locked`, `--reviewed`,
  `--active`, `--completed`, `--error`, `--skipped`), focus ring colour,
  hover affordances per state
- `:where()` everywhere; pseudo-elements outside the `:where()` per
  Interop convention

### 4.4 devMode warnings

Already present and correct:

- `interop-step-list: expected <ol>, got <X>`
- `interop-step-panel: expected <section>, got <X>`
- `interop-step-panel (panel N): no heading found`
- `interop-step / interop-step-list / interop-step-panel: must be used inside <interop-stepper>`

Recommended additions:

- Warn when two panels both contain `<h1>` (panel heading should not
  outrank the page heading — but this is a soft warning)
- Warn when the same `[status]` value is forced for multiple steps and
  could conflict with auto-status (e.g. multiple "active" overrides)
- Warn when `<nav aria-label="Progress">` appears more than once in the
  same document and no consumer override is set

### 4.5 Demo page outline

In `projects/demo/src/app/pages/stepper/`:

- Linear wizard (default)
- Non-linear settings (free navigation)
- Vertical orientation with custom step-list template
- Status overrides (form-driven error/skipped)
- Custom indicator template
- Replacing the action bar via `[interop-stepper-actions]`
- Many-step flow demonstrating compact nav-trigger + popover menu
- Reduced-motion demo (compare with motion enabled)
- **Accessibility demo:** scripted screen-reader walkthrough showing
  heading focus and `aria-current="step"` announcements

---

## 5. Review of existing InteropStepper

Applying the checklist findings to what's currently shipped. Severity:
🔴 fix • 🟡 consider • 🟢 confirm/document.

### 🔴 5.1 Missing `aria-controls` from step button to panel

The step button has no `aria-controls` pointing at its panel. MUI
explicitly documents this as the one required a11y relationship for
their Stepper. Each panel already gets a stable id (auto-wired
`aria-labelledby` generates an id on the heading; the panel element
itself does not currently have an id, but should).

**Fix:** assign a stable id to each `section[interop-step-panel]` on
registration (e.g. `itx-step-panel-${index}`), and bind
`[attr.aria-controls]` on the step button to the corresponding panel id.

### 🔴 5.2 Step `aria-label` overrides visible content

`interop-step.ts` line 195–206:

```ts
protected readonly ariaLabel = computed(() => {
  const n = this.index + 1;
  const lbl = this.label();
  const opt = this.optional() ? " (optional)" : "";
  const status = this.effectiveStatus();
  const statusSuffix = status === "completed" ? " — Completed"
    : status === "error"   ? " — Error"
    : status === "skipped" ? " — Skipped" : "";
  return `Step ${n}: ${lbl}${opt}${statusSuffix}`;
});
```

This is applied as `[attr.aria-label]` on the inner `<button>`, which
*replaces* the accessible name computed from the visible content. The
visible label is the visible name; an explicit `aria-label` displaces
it. Per the AccName spec the override is allowed, but doing so when the
visible content already conveys the name is an anti-pattern — it
desynchronises what sighted and non-sighted users hear.

**Fix:** drop the `aria-label` on the inner button. Let the visible
content (`<span class="interop-step__number">N</span>` + label text) be
the accessible name. Communicate status via either:

- A visually-hidden `<span class="visually-hidden"> Completed</span>`
  inside the button (so SR users hear "1 Profile, Completed"), or
- `aria-describedby` pointing at a status node

The visually-hidden suffix is simpler and works on every AT.

### 🔴 5.3 Two competing `aria-current="step"` attributes

Both `interop-step.ts` (host on `<li>`) and
`interop-step-panel.directive.ts` (host on `<section>`) set
`aria-current="step"` when their index is active. Per
[WAI-ARIA 1.2 §6.6.6](https://www.w3.org/TR/wai-aria-1.2/#aria-current),
`aria-current` should appear on a single element that represents the
current item in the set — the step indicator. Putting it on the panel
too is non-standard and risks double-announcement.

**Fix:** keep `aria-current="step"` on the step indicator only. Remove
from `section[interop-step-panel]`. The panel is identified by
`aria-labelledby` and `[hidden]`/visibility; that's enough.

### 🟡 5.4 `role="region"` on every panel

`interop-step-panel.directive.ts` line 47–48:

```ts
host: {
  ...
  role: "region",
}
```

`<section>` with an accessible name (via `aria-labelledby`) already
becomes a region landmark. Explicitly setting `role="region"` is
redundant but harmless. The real concern is that **every panel** becomes
a region — many landmarks named "Step 1 / Step 2 / Step 3" clutter
landmark navigation, even though only one is visible at a time. With
`[hidden]` removing locked panels, the `[hidden]` panels disappear from
the a11y tree, so in linear mode only "visited so far" panels remain in
the tree — but in non-linear mode all panels are tree-visible.

**Recommend:** drop the explicit `role="region"`. The `<section>`
element already does what's needed. If the goal is to *guarantee*
landmark exposure across browser quirks, do so only on the *active*
panel via `[attr.role]="isActive() ? 'region' : null"`.

### 🟡 5.5 `aria-disabled` on `<li>` host duplicates native `[disabled]`

`interop-step.ts` line 86:

```ts
"[attr.aria-disabled]": "isLocked() ? 'true' : null",
```

The inner `<button>` already has `[disabled]="isLocked()"`. The native
disabled state on the button is what AT consumes; `aria-disabled` on
the non-interactive `<li>` host adds no signal. (It's not actively
wrong, just noise.)

**Recommend:** drop `aria-disabled` from the `<li>` host. Keep the
`interop-step--locked` class for styling.

### 🟡 5.6 No `aria-orientation` on the step list

The `<ol interop-step-list>` does not expose orientation to AT. When the
stepper is vertical, AT users navigating with directional keys benefit
from knowing the list is laid out vertically.

**Recommend:** on `interop-step-list.directive.ts`, add
`[attr.aria-orientation]` bound to the parent stepper's `orientation()`.

### 🟢 5.7 Default `aria-label="Progress"` retained

`ariaLabel = input<string>("Progress", { alias: "aria-label" });`

Two steppers on a page both default to `<nav aria-label="Progress">`,
which AT users hear as two indistinguishable "Progress" landmarks. The
prior recommendation here was a devMode warning when multiple steppers
share the default — **explicitly rejected** as a decision. The default
stays as-is; the burden falls on the consumer who composes multiple
steppers in one view to pass unique labels. Document this in the
`aria-label` input's docstring.

### 🟢 5.8 Panel fallback focus is correct

`requestFocus()` (panel directive lines 119–140): focuses the first
`<h1>`–`<h6>`; falls back to the panel with `tabindex=-1` removed on
blur. This is the correct pattern and avoids Material's #19574 mistake
of leaving a permanent tab stop on the panel.

### 🟢 5.9 Indicator graphics correctly hidden from AT

`<span class="interop-step__indicator" aria-hidden="true">` in
`interop-step.ts` line 51 — avoids Material's #19009 problem of icons
being announced redundantly.

### 🟢 5.10 Linear/non-linear is signal-driven

`linear = input<boolean>(true)` flows into `isStepLocked()` as a derived
computed — no Material #32964 bug here. Worth a demo test to lock this
in.

### 🟢 5.11 `[hidden]` on locked panels prevents swipe past frontier

Hard lock via `[hidden]` removes the panels from layout — gesture
scroll-snap physics cannot reach them. This is a genuinely good
implementation choice for the gesture story.

### 🟡 5.12 Scroll-snap RTL not explicitly tested

The scroll math (`elRect.left - vpRect.left`) is delta-based and should
work in RTL, but Safari has historically had RTL scroll-position quirks
([CSSWG-drafts#5984](https://github.com/w3c/csswg-drafts/issues/5984)).

**Recommend:** add an RTL smoke test in the demo page and a CSS
container with `direction: rtl` to verify.

### 🟡 5.13 Step button accessible name does not survive
`[indicatorTemplate]` override well

When a consumer provides `[indicatorTemplate]`, the button content
becomes the template's output. If the template doesn't include the
label, the visible button has no label — and (after fix 5.2) no
fallback accessible name. The label-as-suffix is currently outside the
template; the indicator template only replaces the indicator span. So
this is OK *today* — but worth a docstring callout in
`StepIndicatorContext` reminding template authors that the visible
label is still rendered alongside.

### Summary of recommended changes

| # | Severity | Change |
|---|---|---|
| 5.1 | 🔴 | Add `aria-controls` from step button to panel id |
| 5.2 | 🔴 | Drop `aria-label` override on step button; use visible content + visually-hidden status |
| 5.3 | 🔴 | Remove `aria-current="step"` from panel host (keep on step indicator only) |
| 5.4 | 🟡 | Drop explicit `role="region"` from panel host (or scope to active) |
| 5.5 | 🟡 | Drop `aria-disabled` from `<li>` host (button's native `[disabled]` suffices) |
| 5.6 | 🟡 | Add `aria-orientation` to step list, bound to stepper orientation |
| 5.12 | 🟡 | Explicit RTL smoke test |
| 5.13 | 🟡 | Document indicator-template + label interaction |

---

## 6. Decisions on open questions

Resolved after review:

1. **Keyboard model — keep the established pattern.** Step buttons remain
   independent buttons; Tab traverses, Enter/Space activates. No roving
   tabindex, no arrow-key navigation between step indicators. Document
   this as the explicit contract.
2. **`[status]="error"` does NOT block forward navigation by default.**
   `status=locked` remains the only status that actively blocks
   progression via `goTo()`/`next()`. **Consumers must be able to opt
   into error-blocking trivially** — implementation should expose a
   simple flag or pattern (e.g. a `blockOn` input listing the statuses
   that should block, defaulting to `['locked']`; or expose a predicate
   hook). Design this so wiring "block on error" is one input, not a
   manual `(stepAttempt)` subscription.
3. **`reset()` behaviour:** clears the frontier and returns to step 0,
   but does **not** clear consumer-provided `[status]` overrides. The
   form's validity state is the source of truth for `error`/`skipped`
   — the stepper shouldn't second-guess it. Document this in
   `reset()`'s docstring.
4. **`finish` semantics — gated to `linear=true`.** Non-linear steppers
   have no canonical "last" step; firing `finish` from the highest-index
   panel in free-navigation mode is incidental, not intentional. Update
   `onNextOrFinish()` so the Finish action only triggers when
   `linear()` is true *and* the active index is the last step. In
   non-linear mode, the action stays "Next" on every step (or the next
   button disables on the last index — the natural fallback). Consumers
   driving non-linear flows are expected to wire their own completion
   button outside the action bar.
5. **Multiple steppers per page:** no warning. Default
   `aria-label="Progress"` is retained; the responsibility falls on
   consumers composing multiple steppers to set unique labels. Note
   this in the input's docstring.

### Implications for the next implementation pass

| Decision | Code change |
|---|---|
| 6.2 — `blockOn` opt-in for status-based blocking | New input on `<interop-stepper>` (e.g. `blockOn = input<StepStatus[]>(['locked'])`); `goTo()` consults it via `isStepLocked` + status check |
| 6.4 — `finish` linear-only | Tighten `isOnLastStep` (or add `canFinish`) and gate the `finish.emit()` branch in `onNextOrFinish()` to `linear()` |
| 6.1, 6.3, 6.5 | Doc-only — no code change |

---

## 7. Source references

External:
- ARIA APG patterns index — https://www.w3.org/WAI/ARIA/apg/patterns/
- ARIA APG Tabs pattern — https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- WAI-ARIA 1.2 `aria-current` — https://www.w3.org/TR/wai-aria-1.2/#aria-current
- GOV.UK Design System patterns — https://design-system.service.gov.uk/patterns/
- GOV.UK Check your answers — https://design-system.service.gov.uk/patterns/check-answers/
- MUI Stepper — https://mui.com/material-ui/react-stepper/
- Angular Material Stepper component — https://material.angular.dev/components/stepper/overview
- PrimeNG Stepper — https://primeng.org/stepper
- Radix primitives — https://www.radix-ui.com/primitives/docs/overview/introduction

Angular Material issues cited:
- #19574 tabpanel tabindex — https://github.com/angular/components/issues/19574
- #19009 JAWS icon labels — https://github.com/angular/components/issues/19009
- #31559 iOS "tab" suffix — https://github.com/angular/components/issues/31559
- #33130 aria-label support — https://github.com/angular/components/issues/33130
- #32964 dynamic linear input — https://github.com/angular/components/issues/32964
- #32641 orientation re-render — https://github.com/angular/components/issues/32641
- #32147 v20 animations — https://github.com/angular/components/issues/32147
- #31788 linear hover behaviour — https://github.com/angular/components/issues/31788

Internal:
- [`.agent/components/stepper.md`](../.agent/components/stepper.md) — implementation mental model
- [`.agent/playbook.md`](../.agent/playbook.md) — conventions
- [`.agent/css-strategy.md`](../.agent/css-strategy.md) — CSS split
- [`prompts/research/semantics-a11y-checklist.md`](research/semantics-a11y-checklist.md)
- [`prompts/research/library-catalog.md`](research/library-catalog.md)
