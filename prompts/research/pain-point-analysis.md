# Pain-Point Analysis — Critical Review of an Incumbent

Companion to [`library-catalog.md`](library-catalog.md) for the
**Pain Points in Existing Implementations** phase of new-component research.
The catalog answers *where* to look; this file answers *what to look for and
how to structure the verdict*.

Apply it to a single incumbent at a time — usually the most direct comparison
(Angular Material first; then whichever Tier-2/3 libraries from the catalog
ship something the target component needs). The output is a markdown report
with two halves: **What it gets right** and **What it gets wrong**, each
backed by linked evidence.

---

## When to run this

- §1 (Semantic Correctness) is settled enough that you know what the
  *correct* shape looks like — you need that as a yardstick before judging
  the incumbent
- You're about to start §3/§4 (most-requested feature, killer
  differentiator) and need fuel from concrete failures, not vibes
- The incumbent is widely used by Interop's likely consumers — Angular
  Material almost always qualifies; everything else is judgment

Skip when: the component has no meaningful incumbent (genuinely novel
primitive), or the incumbent has already been reviewed in a recent §2 run
and nothing material has shipped since.

---

## Sources to mine

In rough order of signal density:

1. **The library's own issue tracker** — filter `is:issue` by the component
   label, then by `label:a11y`, `label:bug`, `label:has-pr`. Sort by
   reactions to surface what *consumers* care about, not what maintainers
   triaged first.
2. **Closed PRs that touched the component** — closed-without-merge PRs
   reveal designs the maintainers considered but rejected, and why.
3. **The component's source** — read the ARIA wiring, host bindings,
   keyboard handler, and state machine directly. Issue trackers describe
   symptoms; source reveals the structural choice that caused them.
4. **APG pattern page** for the component — compare role/attribute/keyboard
   contract against what the source actually does.
5. **axe-DevTools / WAVE / Accessibility Insights** on the library's
   official docs page for the component. The docs page is the
   maintainer's best foot forward; a11y failures there are not
   theoretical.
6. **Screen-reader reality** — search the issue tracker for `JAWS`,
   `VoiceOver`, `NVDA`, `TalkBack`. AT-specific bugs are the ones that
   spec-conformance audits miss.
7. **Stack Overflow / Reddit / Discord / GitHub Discussions** — search the
   component name plus `workaround`, `hack`, `why is`. Converging
   workarounds = missing primitive.

Capture every claim with a link. "Material's reset() marks controls
touched" without a URL is rumor.

---

## Analysis axes

Walk every axis. Not every axis will fire for every component, but
silence on an axis should be deliberate, not accidental.

### 1. Semantic correctness — is the chosen role *honest*?

The biggest, most-recurring incumbent failure: forcing a procedural or
relational UX into the wrong ARIA pattern (tabs for steppers, listbox
for command palettes, menu for popovers that aren't menus, etc.).

Triggering questions:
- What does the assistive-tech user *hear* when they encounter this
  component? Does it match what the component actually does?
- Does the chosen role imply behavior the component doesn't honor
  (e.g. `tablist` implies arrow-key roving + independent peers — does
  the stepper actually allow free movement between peers? No)?
- Is the role's required child structure respected? (`tablist` must
  contain `tab` children directly — putting `tabpanel` inside is a
  spec violation.)
- Would `<ol>` + `aria-current` / `<nav>` + landmarks / `role="group"`
  + labelled progress be a closer fit than the chosen role?
- Are ARIA attributes applied to elements that don't support them
  (e.g. `aria-expanded` on a `<div>` with no implicit/explicit role)?

### 2. API surface — bloat, coupling, undocumented matrices

Triggering questions:
- How many ways can a single state be expressed? (Material stepper:
  `stepControl` validity *vs* `completed` boolean, with silent
  precedence rules. This is a smell.)
- For inputs A, B, C that interact: does the docs page enumerate every
  (A × B × C) combination, or does it leave the consumer to guess?
- Which inputs silently no-op in which configurations? (e.g. Material's
  `labelPosition` does nothing in vertical orientation.)
- Is configuration split between per-instance inputs and global
  injection tokens? Why is each piece in the layer it's in?
- Are there directive companions (`*Next`, `*Previous`) that exist
  only to call methods the consumer could call directly?
- Is internationalization a heavyweight injectable class when a plain
  input would do?

### 3. State machine & validation behavior

Triggering questions:
- What triggers validation? Touch? Navigation? Both? Inconsistently?
- Does state mutate on read-only operations like `reset()`? (Material:
  yes — marks controls touched/dirty.)
- Are nested-component forms handled, or does the validity check stop
  at the immediate DOM children?
- Are there pre-filled / restore-from-server flows the state machine
  refuses to honor? (e.g. linear mode blocking skip-to-valid-step.)
- Is the state machine *invertible* in the ways consumers need? Can it
  go backwards, partially, with state preserved?

### 4. Fragility — magic numbers, brittle listeners, perf cliffs

Triggering questions:
- Are there hard-coded timeouts, delays, or animation durations whose
  values are unjustified? (200ms init flicker delays, etc.)
- Are animation completion events keyed off `transitionend` filtered
  by CSS property name? (Theme changes break these.)
- Is content rendered eagerly for every panel/step/tab/route, or is
  lazy-rendering opt-in / default-on?
- What's the `@ContentChildren({descendants: true})` cost as content
  grows? Does the component scale linearly or worse?
- Are there event listeners on `document` / `window` that don't clean
  up in every code path?

### 5. Motion, contrast, focus

Triggering questions:
- Does the default animation respect `prefers-reduced-motion`? (Most
  incumbents don't — they expose a duration input as the escape hatch,
  which is not the same thing.)
- Do the default colors pass WCAG AA contrast against the library's
  default theme — *especially* the disabled, inactive, and hover
  states? (Linear-mode step headers in Material famously don't.)
- Where does focus go after each interaction? Is there a focus loss
  between component regions (header → content, trigger → panel)?
- Is `:focus-visible` used to distinguish keyboard vs pointer focus,
  or is the focus ring always-on or never-on?
- Forced-colors / Windows High Contrast Mode — does the component
  remain usable, or do icons/separators disappear?

### 6. Customization walls

Triggering questions:
- What does a consumer have to do to restyle the component? `::ng-deep`?
  Override deeply-nested compound selectors? Fork the template?
- Is the DOM structure stable enough that consumers can rely on it, or
  does it churn between majors?
- Are slots / content projection points sufficient for the realistic
  variations consumers want, or do power users end up reimplementing?
- Can icons / labels / separators be replaced without forking?

### 7. What it gets right

Mandatory section. Two reasons:
- It calibrates the review — pure complaint reads as bias.
- It surfaces patterns Interop should *keep*, not just patterns to avoid.

Look for: lazy-rendering opt-ins, orientation flexibility, reactive-form
hooks, CDK/Material splits, i18n hooks, two-way bindings, explicit reset
methods, animation kill switches, customizable icons with context.

---

## Output format

A single markdown report, suitable for pasting into the §2 results of
`new-component-research.md`. Shape:

```markdown
# {Incumbent} {Component}: Critical Review

## What it gets right
- {Bulleted list, 4–8 items, each one sentence}

## What it gets wrong

### 1. {Axis name — the biggest failure first}
{Two-sentence framing of the failure.}
- {Specific bug / spec violation / API smell with linked evidence}
- {…}

### 2. {Next axis}
{…}

## Bottom line
{One paragraph: what the foundational mistake is, and what the lessons
are for an Interop rebuild. Two or three sentences max.}

## Sources
- [{Issue title}]({URL})
- […]
```

Rules:
- Lead with semantic correctness if it fired — it usually cascades into
  every other axis and frames the rest of the review.
- Every specific claim links a source. Issue numbers as inline links:
  `([#26444](https://github.com/angular/components/issues/26444))`.
- Sort axes by severity in *this incumbent's* review, not by the order
  in this checklist.
- Don't write more than ~800 words of body before the sources list. If
  you're writing more, you're either inventorying source code (move it
  to a separate file) or padding.
- The **Bottom line** paragraph should be reusable as the §3/§4
  springboard — what does the incumbent's foundational mistake imply
  Interop should *do differently*?

---

## Anti-patterns in your own review

- **Vagueness without a link** — "users complain about validation" is
  not a finding; "Material #14026: navigation triggers validation on
  untouched fields" is.
- **Surface-level paraphrasing of the issue tracker** — read enough of
  the thread to understand the *cause*, not just the title. A title
  describes the symptom; the structural defect lives in the comments
  and the linked PR.
- **Treating maintainer rebuttals as resolution** — many APG-violating
  designs are defended in issue threads as "working as intended." That
  defense is the data point, not the answer. Interop's job is to
  decide whether the design itself was wrong.
- **Ignoring "what it gets right"** — every review that omits this
  section reads as motivated reasoning and loses credibility with
  future readers (including future-you).
- **Recommending a fix inside the incumbent** — this is competitive
  analysis for Interop, not a contribution to the incumbent. The
  bottom line should point at what Interop does, not what Material
  should do.

---

## Example

See the Angular Material stepper review (May 2026 chat output) for a
worked example of this format applied end-to-end. Key takeaways from
that review that illustrate the playbook:

- Axis 1 (semantic correctness) fired and cascaded into every ARIA
  bug — `tablist`/`tab`/`tabpanel` was the wrong pattern, and every
  child-structure / attribute-placement / disabled-announcement bug
  downstream of that choice
- Axis 2 (API surface) surfaced the `stepControl` vs `completed`
  precedence trap and the global-vs-instance config split
- Axis 3 (state machine) surfaced six distinct linked issues about
  validation timing, reset() side-effects, and skip-valid-step
- The "what it gets right" section preserved lazy `matStepContent`,
  CDK/Material split, and reactive-forms hook as patterns to keep

The bottom line ("model a sequential procedure as a procedure, not as
tabs") became the §1 semantic premise for `InteropStepper`.
