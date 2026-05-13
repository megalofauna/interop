# Presentation: How We Built the Stepper

A 15–30 minute talk on the research → design → iteration loop, ending
with a live demo of the stepper. Targeted at developers.

---

## Framing

The talk is not "look what we built" — every audience has seen that
deck. It's *"here's a method, here's how it changed as we used it, and
here's what fell out the other end."* Process is the through-line;
the stepper is the proof.

**The single big idea:** the research artifact is a working tool, not a
deliverable. We used it on the stepper; it told us things nobody else
seems to have noticed; we kept refining the artifact as we hit
decisions. That's the loop you can take home.

Pick the right title to set this up:

- *"The Stepper Nobody Wrote: A Research-Driven Component Story"*
- *"Steppers, ARIA, and the Patterns You'll Never Find in the Spec"*
- *"Research as a Component"* — short, leans into the process angle

---

## Audience contract

By the end of the talk they will be able to:

1. Explain why steppers are a *non-trivial* design problem despite
   looking simple (one slide of evidence, no hand-waving)
2. Describe the research artifact and how it's used as a working tool
3. Recount the three biggest surprises and the design decisions they
   forced
4. Point at the open opportunity (form integration) and explain why
   it's still unsolved across the industry
5. See the result running and recognise it as the *thing the research
   asked for*

Set the contract on the second slide. "By the end of this talk you'll
know X, Y, Z. If you only remember one thing, let it be the iteration
loop."

---

## Time allocation (use the one that matches your slot)

### 15-minute version (tight)

| Time | Section | Purpose |
|---|---|---|
| 0–2 | Hook + framing | Earn attention; set the contract |
| 2–5 | The research artifact | Show what the tool looks like |
| 5–9 | Three findings | The substance — concrete, defensible |
| 9–13 | Live demo | The thing |
| 13–15 | Take-aways + Q&A buffer | Hand off + invitation |

### 30-minute version (richer)

| Time | Section | Purpose |
|---|---|---|
| 0–3 | Hook + framing | Earn attention; set the contract |
| 3–7 | Why steppers are interesting | The APG gap + the consequences |
| 7–11 | The research artifact + how it evolved | The method + iteration story |
| 11–18 | Findings (three surprises + most-requested) | Substance |
| 18–22 | Research → code | Concrete examples of design decisions |
| 22–28 | Live demo | Proof |
| 28–30 | Open questions + invitation + Q&A | Hand off |

I'll outline the 30-minute version below. Trim to the 15-minute
allocation by collapsing §3 and §5 and dropping the longer demo
beats.

---

## Section-by-section script

### 1. Hook (3 min) — *"Try this on your phone"*

Open with a live demo of something **already shipped, by a major
library**, that fails on iOS in a way the audience will recognise.

> *"Open the Angular Material stepper docs on an iPhone. Turn on
> VoiceOver. Tab through a form field inside one of the steps. You will
> hear something like: 'name, text field, tab'. Every field announces
> with 'tab' as a suffix. That's not what your user expected. It's not
> a Material bug — Material is doing exactly what the tabs ARIA pattern
> says. The bug is in the choice of pattern."*

(Source: [angular/components#31559](https://github.com/angular/components/issues/31559)
— still open at time of writing.)

Then the punch:

> *"That bug exists because nobody at the W3C ever wrote a 'Stepper'
> pattern. ARIA APG has 32 patterns. Stepper isn't one of them. Every
> design system that ships a stepper picked a pattern themselves —
> and most of them picked wrong."*

Pause. That's the moment that earns attention.

### 2. Framing & audience contract (1 min)

State what they'll know by the end (the 5 bullets from "Audience
contract" above). Tell them the through-line is *the method*, not the
component.

### 3. Why steppers are interesting (4 min)

Three slides. Move fast.

- **Slide A — The APG list.** Show the actual 32 patterns. Point at the
  gap. "Tabs is there. Stepper isn't. Wizard isn't. Multi-step form
  isn't."
- **Slide B — Where everyone disagrees.** A four-column table: library,
  step-list role, panel role, keyboard model. Material and PrimeNG
  picked tablist. MUI picked nothing. Radix doesn't ship one. GOV.UK
  recommends *no stepper at all*. Five libraries, four different
  answers.
- **Slide C — Why the disagreement matters.** Tabs APG demands roving
  tabindex + arrow nav + auto-activation. None of that fits a wizard:
  steps have *order*, *lock semantics*, and *persistent state*. Tabs
  are peers; steps are a sequence. `aria-selected` is the wrong
  state for "active in a process". `aria-current="step"` exists in
  the spec for this case — almost nobody uses it.

Cite [WAI-ARIA 1.2 §6.6.6](https://www.w3.org/TR/wai-aria-1.2/#aria-current)
on the screen as authority.

### 4. The research artifact + how it evolved (4 min)

Pull up `prompts/new-component-research.md` in a code editor (or as
formatted Markdown). Don't read it; describe its shape.

> *"This is the artifact. Five sections: semantic correctness, pain
> points, most-requested feature, killer differentiator, implementation
> plan. Every new component starts by walking it. The outputs become a
> research report we file alongside the code."*

Then tell the iteration story — this is the *method* part of the talk:

1. **v1** — One file. Everything inline. Decent.
2. **v2** — As we ran it more, we noticed two sections kept growing:
   the a11y walk-through and the library survey. So we split them out
   into [research/semantics-a11y-checklist.md](research/semantics-a11y-checklist.md)
   and [research/library-catalog.md](research/library-catalog.md).
   The orchestrator stayed short; the checklists got expansive enough
   to *be reference docs in their own right.*
3. **v3** — While building the stepper, we noticed the report was good
   at "what's broken" but didn't surface "what's missing." So we added
   a new §3: **The Single Most-Requested Feature.** Strict scope:
   name one feature; cite at least three sources; quantify; say whether
   it aligns with the ethos.

Highlight: **the artifact evolves as it's used.** It's not a template
you write once. You build it, you use it, you find a gap, you patch
the artifact, you ship. That's the loop.

### 5. Findings — three surprises (7 min)

Take the longest single block on this. The whole rest of the talk
hangs off these.

#### Surprise 1: There is no APG pattern (1.5 min)

You've already set this up in §3. Re-emphasise the consequence:
**"Every team has to make a position on something the spec doesn't
address."** Show the slide where you state Interop's position:
native `<ol>` / `<li>` / `<button>` / `<section>`, `aria-current="step"`,
no `tablist`. Document the divergence loudly so consumers know.

#### Surprise 2: Nobody is moving focus to the panel (2 min)

Walk through the focus-management story:

- User clicks a step. The panel changes. Screen reader users have *no
  signal*.
- Material focuses an empty wrapper.
- MUI focuses nothing.
- Radix doesn't have a stepper.
- The fix: after the scroll-snap settles, move focus to the panel's
  first `<h1>`–`<h6>` with `preventScroll: true`.

Show the code snippet. ~12 lines. Cite Material's
[#19574](https://github.com/angular/components/issues/19574) as
prior-art-gone-wrong.

#### Surprise 3: The most-requested feature is *still* unsolved (3 min)

This is the showstopper. Pull up the Angular Material issue tracker
filtered for `stepper + validation`. Read the dates:

- #8645 — 2017
- #14026 — 2018
- #15859 — 2019
- #17056 — 2019
- #17355 — 2019
- #16554 — 2019
- #20114 — 2020
- #25830 — 2022
- #29781 — 2024

> *"This is one conversation, told in twelve issues across seven
> years. Every one is a symptom of the same underlying gap: nobody
> ships first-class, reactive, form-aware navigation gating with
> reliable async-validator handling. MUI doesn't ship form integration
> at all. PrimeNG makes you write a predicate. Radix doesn't ship a
> stepper. This is the ask the industry has not delivered on for a
> decade."*

Land the punchline:

> *"We didn't solve this either — yet. We shipped a foundation:
> `[blockOn]` and `[status]` overrides. The full feature is the next
> milestone. The research artifact named it; the code roadmap accepts
> it."*

This is honest *and* compelling: you don't pretend to have solved a
decade-old problem in a sprint.

### 6. Research → code (4 min)

Pick three or four specific design decisions and show how the research
directly produced them. Keep each beat tight (under 60 seconds):

1. **`role="region"` dropped from panels.** Why: the semantics-a11y
   checklist says multiple landmarks with similar names pollute
   landmark nav. Tell the audience this was a *one-line removal* in
   `interop-step-panel.directive.ts`.
2. **`aria-controls` wired from each step → its panel id.** Why: MUI's
   docs document this as the one explicit a11y wire and most consumers
   don't even know. Show the `getPanelId(index)` API we added to make
   it stable across multiple steppers on a page.
3. **`InteropScrollArea` wrapping the step list.** Why: the popover
   menu was bundling `FloatingUI + InteropListbox + position strategy`
   on every page. The scroll-area is one component. Mobile UX gets a
   shadow-faded scrollable strip; the popover is now an opt-in via
   `menu="always"`. Smaller bundle, more honest UX.
4. **The `_finished` flag.** Why: the monotonic-frontier state model
   alone can't express "the last step is done." A user saw the demo and
   said "the last step never completes." We added a flag, clears on
   navigation, drops the `--active` class so the completed colourway
   wins. **Mention that the *user spotted this* during a demo, not a
   test.** That's part of the loop.

The frame to repeat: **the research said this; we built that; the
audience can do the same thing on their own components.**

### 7. Live demo (5 min)

Open the demo. Walk through the four examples in this order:

1. **Linear wizard (Docking procedure)** — Next through all three.
   When you land on Secure, click Finish. *Show that step 3 indicator
   now goes to completed.* (This is the user-feedback moment from §6.)
2. **Non-linear free navigation (Vessel checklist)** — Click around.
   Show the popover anchoring correctly on the action-bar menu button.
   (Mention that this was a bug last week — `display:none` triggers
   from two registrations confused the position strategy. Three-line
   fix.)
3. **Many steps — horizontal scroll on narrow containers (Launch
   sequence)** — Resize the dev-tools width, scroll the strip
   horizontally, show the edge fade shadows. Toggle to a phone
   viewport to demonstrate.
4. **Vertical orientation (Setup wizard)** — Open the popover menu;
   the step list lives in there for vertical mode. Click a step.

If time permits, **open the page in DevTools with the accessibility
tree visible.** Show the absence of `tablist` / `tabpanel`. Show
`aria-current="step"` on the active step. Show the panel's
`aria-labelledby` pointing at its heading id.

If a screen reader is set up, toggle it on for ten seconds and let
the audience hear the heading-focus behaviour.

### 8. Take-aways + Q&A (2 min)

Three slides max. Keep it terse.

- **The loop.** Research the prompt → use it on a real component →
  patch the prompt when it falls short → ship. The prompt is a working
  artifact.
- **The opportunity.** Form integration is unsolved. We've named it;
  we haven't built it. Anyone in this room could ship the patch.
- **The artifacts.** Point at:
  - `prompts/new-component-research.md` — the orchestrator
  - `prompts/research/semantics-a11y-checklist.md` — the a11y walk
  - `prompts/research/library-catalog.md` — the survey set
  - `prompts/stepper-research-independent.md` — the vendor-neutral
    report (good handout)

Invite Q&A. Keep an eye on the clock — leave 3 minutes.

---

## Practical staging notes

### Don't do these

- **Do not show the prompt source** for more than one slide. The
  artifact looks like a long markdown file. Audience eyes glaze.
  Describe its shape, don't read it.
- **Do not narrate the iteration story in chronological order.** Group
  by *category* — first the split (a11y + library), then the new §3
  (most-requested). Chronology is for the speaker; narrative is for
  the audience.
- **Do not paste large code blocks.** Show one screenshot per beat in
  §6, max ~10 lines each.
- **Do not skip the iOS demo at the opening.** That bug is the single
  best attention-earner. If you can't physically run iOS, record a
  10-second video.

### Do these

- **Rehearse the demo cold.** Walk every example, in order, twice.
  Make sure DevTools and the accessibility tree are pre-pinned.
- **Pin a phone-sized viewport in DevTools** before you start —
  switching live is laggy and breaks momentum.
- **Run the dev server on a wired connection** if you're presenting
  in a venue with shared Wi-Fi. A 3-second reload kills a demo.
- **Have the closed-tab fallback ready** — `dist/demo/browser/` served
  by `npx serve` works without the dev-server reload step if something
  goes sideways.
- **Print the source-references page** from
  `stepper-research-independent.md` as a backup handout. People want
  to read the GitHub links later.
- **Open `npm run demo` ~5 minutes before** so HMR is warm.

### Equipment

- Laptop primary, iPhone (or iPhone simulator) secondary for the
  opening hook
- A second monitor or HDMI for the audience-facing view
- Working internet (for the live GitHub-issues citations)
- A way to enable VoiceOver / NVDA / TalkBack on demand (Cmd+F5 on
  macOS for VoiceOver)
- Slides: I'd build these in Keynote / PowerPoint / Slidev — whichever
  the audience is used to. Avoid Markdown-only slide tools that lose
  the audience attention when the type is too dense

### Two slide skeletons

**Slide: "The APG list" (§3, slide A)**
- Title: *"32 patterns. Stepper isn't one."*
- Two-column grid showing the 32 patterns, with "Stepper", "Wizard",
  and "Multi-step form" called out below the grid as crossed-out
  pseudo-entries
- Source link at the bottom

**Slide: "Seven years, one conversation" (§5, surprise 3)**
- Title quotes the line above
- Three columns: issue #, year, the actual issue title
- Sorted oldest → newest (2017 → 2024)
- Caption underneath: *"Same gap. Different symptoms. No solution."*

---

## Cuts to make for the 15-min version

If you only have 15 minutes, cut in this order:

1. Drop §3 (Why steppers are interesting) — open straight from the
   iOS hook into the artifact
2. Collapse §4 to two minutes — the iteration story is one sentence:
   *"We split it, then we added §3."*
3. Cut Surprise 1 from §5 (you've already made the point in the hook)
4. Cut §6 (Research → code) to one example — the `_finished` fix is
   the most relatable because it's user-driven
5. Demo is still 5 minutes — that's the proof, don't cut it
6. Take-aways stays as a single slide

The 15-minute talk is: hook → artifact → focus + form integration
gap → demo → take-aways. Roughly 5 minutes of substance on either
side of a 5-minute demo.

---

## What to send people home with

A single page link or QR code to the repo:

- `prompts/stepper-research-independent.md` (the report)
- `prompts/new-component-research.md` (the prompt orchestrator)
- The two checklists in `prompts/research/`

If you can spare 5 minutes after the talk, offer to walk anyone through
how to start their *own* `new-component-research.md` run. The artifact
travels.
