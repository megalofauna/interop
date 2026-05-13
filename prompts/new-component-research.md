# New Component Research Prompt

Use this prompt when evaluating and planning any new Interop component.
Replace `[COMPONENT]` with the target component name before executing.

Companion files (load as needed during the relevant phase):

- [research/semantics-a11y-checklist.md](research/semantics-a11y-checklist.md) —
  expansive checklist for section 1 (host element, ARIA, keyboard, focus,
  labeling, form participation, spec divergence)
- [research/library-catalog.md](research/library-catalog.md) — representative
  set of libraries/design systems to consult for section 2, grouped by tier
- [research/pain-point-analysis.md](research/pain-point-analysis.md) —
  optional substep for section 2: axes, sources, and output format for a
  full critical review of a single incumbent (run once per incumbent that
  warrants depth — Angular Material almost always does)

Repo conventions (don't restate, reference):

- [`.agent/playbook.md`](../.agent/playbook.md) — architecture, conventions, patterns
- [`.agent/css-strategy.md`](../.agent/css-strategy.md) — structural vs theme CSS split
- [`.agent/README.md`](../.agent/README.md) — dispatcher with per-component deep-dives

---

## The Brief

We are building **[COMPONENT]** for the Interop Angular component library.

Interop's core ethos:
- Semantic correctness first — native elements before ARIA roles
- Accessibility is non-negotiable, not a feature
- Minimal opinionated styling — consumers own the look
- Signal-based Angular 21, standalone, OnPush, light-DOM
- Structural CSS at zero specificity (`:where()`); values-only theme layer

Before a single line of implementation is written, answer the following.

---

## 1. Semantic Correctness & Accessibility

What is the most correct, industry-standard way to mark up **[COMPONENT]**
using native HTML elements and ARIA?

**Walk the full checklist in
[research/semantics-a11y-checklist.md](research/semantics-a11y-checklist.md).**
At minimum, the output of this section must include:

- Chosen host element(s) and the reasoning (why not the obvious alternatives)
- ARIA role + required/optional properties + states + relationships
- Keyboard interaction table per [ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/)
- Focus management decisions (initial focus, trap policy, return target,
  roving vs `aria-activedescendant`)
- Accessible name + description sources, and which devMode warnings apply
- Reduced-motion, forced-colors, RTL, and touch-target plan
- Form participation decision: `ControlValueAccessor`, ElementInternals
  (form-associated custom element), both, or neither
- **An explicit divergence section** — where the W3C spec letter, ARIA APG,
  AT reality, and mainstream design systems disagree, state the camps and
  recommend a path with reasoning

Cite source URLs inline as you go (APG pattern URL, MDN, WCAG SC numbers,
Open UI explainers, AAM mappings).

---

## 2. Pain Points in Existing Implementations

Research complaints, issues, and limitations in extant implementations.
Primary target: **Angular Material** (Interop's most direct comparison).

**Consult the relevant tiers from
[research/library-catalog.md](research/library-catalog.md).** Don't reread
the whole catalog — pick the libraries most relevant to the target component
and dive into their issue trackers, source, and docs.

The output should answer:

- What do developers consistently complain about across these libraries?
- What accessibility failures recur (focus management, missing announcements,
  keyboard gaps, name-computation surprises)?
- What customization walls do consumers hit (CSS specificity, locked DOM,
  hardcoded structure, theming limits)?
- What keyboard or focus management bugs appear repeatedly in issue trackers?
- What unmet needs are visible in GitHub issues, StackOverflow, Discord,
  Reddit (`r/Angular2`, `r/reactjs`), and similar?
- Where do *patterns* (not products) consistently fail in real apps?

For each finding, **link the source** — issue URL, PR URL, blog post,
mailing-list thread, etc. Pattern: "Angular Material #12345 — focus returns
to body instead of trigger after dialog close."

### Optional substep — deep critical review of a single incumbent

When an incumbent warrants more than a bullet list — almost always
Angular Material, sometimes one Tier-2 library that's structurally
representative — run a full critical review of it before moving on.

Walk [research/pain-point-analysis.md](research/pain-point-analysis.md).
It defines the seven analysis axes (semantic correctness, API surface,
state machine, fragility, motion/contrast/focus, customization walls,
*and* what the incumbent gets right), the source-mining order, and the
output format. The resulting report folds back into this section as
linked evidence and seeds the §3/§4 differentiator argument.

Run once per incumbent that warrants depth. Skip when the broad bullet
sweep above already exposed the structural failures, or when no single
incumbent is dominant enough to justify the focus.

---

## 3. The Single Most-Requested Feature

Pain points (§2) cover *what's broken*. This section names *what consumers
want that none of the existing libraries ship well*. The two often
correlate but are not the same — a feature can be missing without anything
being technically broken, and a library can have many bugs without anyone
asking for a new feature.

Signals to mine:

- Issue titles tagged `enhancement` / `feature request` / `RFC`, ranked by
  upvotes and reactions
- The same idea filed across multiple libraries (recurrence across
  ecosystems is the strongest signal — it means it's a pattern-level gap,
  not a library-level miss)
- Long-running discussions on a single repo that never landed a PR
  (years-old threads with high engagement)
- Stack Overflow questions that converge on the same workaround
- *Workarounds and shims consumers ship on top of the library* — when a
  community keeps re-implementing the same thing, that's a missing
  primitive

The output of this section should:

- **Name the feature in one sentence.** Crisp. No hedging. If you can't
  name a single most-requested feature, name the top 2 — but justify why
  there's no clear winner
- Quantify when possible: issue counts across libraries, total reactions,
  age of the longest-running thread, frequency in SO questions
- Cite at least three independent sources (issues, threads, blog posts,
  RFCs) — link each
- Note where this feature *does* already exist. Sometimes the demand is
  concentrated in one ecosystem because another ecosystem already solved
  it (e.g. React has X built-in; Angular consumers keep asking for it)
- State whether shipping this aligns with Interop's ethos (semantic
  correctness, native-first, light DOM, zero-specificity CSS). If it
  would *not* align, say so explicitly — the answer here can be "the
  most-requested feature is X; we deliberately decline it because Y"

This output frequently feeds the §4 Killer Differentiator decision; when
it does, calling it out here strengthens the differentiator argument.
When it doesn't, name the gap explicitly so the choice is recorded
rather than implicit.

---

## 4. Killer Differentiator

Given everything above, what is the one (or two) highest-value features or
design decisions that would make an Interop implementation of **[COMPONENT]**
meaningfully better than the alternatives?

- "We do it accessibly" is **table stakes for Interop, not a differentiator.**
- Think: what would make a developer who has been burned by Material's
  implementation sit up and say "finally"?
- Anchor on Interop's structural advantages:
  - **Semantic correctness** — native element where competitors went `role=`
  - **Zero-specificity CSS** — consumers override without `::ng-deep` or `!important`
  - **Token system integration** — structural rules in `styles/components/X.css`,
    values in `styles/themes/protocol/components/X.css`
    (see [`.agent/css-strategy.md`](../.agent/css-strategy.md))
  - **Composability** — host directives, child components, content projection
  - **Form participation** done right (FACE + CVA in tandem where warranted)
  - **devMode warnings** that catch a11y mistakes at dev time
  - **Activation guardrails** — debounce/throttle/reentrancy via
    `InteropActivation` service for components where double-fire is a real bug
- One sharp differentiator beats five vague ones. State it crisply.

---

## 5. Summary & Implementation Plan

Once satisfied with the above, produce:

- **Decision summary:** what was chosen and why, in 5–10 bullets
- **Component tree:** host element(s), child directives/components, content
  projection slots, host directives applied
- **Angular architecture:** selector strategy, injection token pattern,
  `ControlValueAccessor` / ElementInternals decisions, signal inputs/outputs,
  any service dependencies (`InteropActivation`, `InteropAttribute`,
  `InteropCollection`). Reference [`.agent/playbook.md`](../.agent/playbook.md)
  for conventions — don't restate them
- **CSS plan:** what tokens the theme layer needs, what the structural layer
  owns vs what the consumer controls. Reference
  [`.agent/css-strategy.md`](../.agent/css-strategy.md)
- **devMode warnings:** specific runtime guards (missing accessible name,
  invalid parent, required directive missing, conflicting attributes)
- **Demo page outline:** examples to ship in
  `projects/demo/src/app/pages/[component]/` — golden path + edge cases
- **Open questions:** anything that needs user input before implementation
  begins. Be specific — "should X default to Y or Z?" beats "API shape TBD."

---

*Prompt template for the Interop component library.*
*Execute with a specific component name before beginning any implementation work.*
