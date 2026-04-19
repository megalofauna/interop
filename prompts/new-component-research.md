# New Component Research Prompt

Use this prompt when evaluating and planning any new Interop component.
Replace `[COMPONENT]` with the target component name before executing.

---

## The Brief

We are building **[COMPONENT]** for the Interop Angular component library.
Interop's core ethos: semantic correctness first, accessibility non-negotiable,
minimal opinionated styling, signal-based Angular 21, standalone + OnPush.

Before a single line of implementation is written, answer the following:

---

## 1. Semantic Correctness & Accessibility

What is the most correct, industry-standard way to mark up **[COMPONENT]**
using native HTML elements and ARIA?

- Which native element(s) are the right host(s)?
- What ARIA roles, properties, and states apply?
- What is the keyboard interaction model per ARIA Authoring Practices Guide (APG)?
- Note any meaningful disagreements in the literature — W3C vs ARIA APG vs
  real-world browser/AT support vs what major design systems actually ship.
  Where the spec and pragmatism diverge, say so explicitly and recommend a path.

---

## 2. Pain Points in Existing Implementations

Research complaints, issues, and limitations in extant implementations.
Primary target: **Angular Material**. Also cover React (MUI, Radix, Headless UI),
Vue (Vuetify, PrimeVue), and any other libraries with notable implementations.

- What do developers consistently complain about?
- What accessibility failures recur across libraries?
- What customization walls do consumers hit?
- What keyboard or focus management bugs appear repeatedly?
- What do the GitHub issues and StackOverflow questions reveal about unmet needs?

---

## 3. Killer Differentiator

Given everything above, what is the one (or two) highest-value features or
design decisions that would make an Interop implementation of **[COMPONENT]**
meaningfully better than the alternatives?

- Not "we do it accessibly" — that's table stakes for Interop.
- Think: what would make a developer who has been burned by Material's
  implementation sit up and say "finally"?
- Consider: semantic correctness advantages, token system integration,
  composability, form participation, keyboard model, animation approach.

---

## 4. Summary & Implementation Plan

Once satisfied with the above, produce:

- A concise summary of the decisions made and why
- A proposed component tree (host element(s), child directives/components)
- The Angular architecture: selector strategy, injection token pattern,
  ControlValueAccessor if applicable, signal inputs/outputs
- CSS approach: what the token system needs, what the component owns vs
  what the consumer controls
- A note on what devMode warnings are appropriate
- Identify any open questions that need user input before implementation begins

---

*Prompt template authored for the Interop component library.*
*Execute with a specific component name before beginning any implementation work.*
