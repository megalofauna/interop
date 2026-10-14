# Workflow — Reviewing a Prime Component

How to decide what becomes of a component in Prime (`projects/interop_deprecated`)
before anything is built in `projects/interop`. The output is a review document
with a decision table and a list of questions for the user. Building starts
only after the user answers them.

Run it with `/prime-review <component>`. It follows
[prompts/new-component-research.md](../../prompts/new-component-research.md),
including §0 Names, and [.agent/playbook.md](../playbook.md).

## Questions every review answers

1. What does Prime's component claim to be, and does the code do it?
2. Is it the thing its name says? Check it against the HTML element or the APG
   pattern it claims, not against its own docs.
3. What is each of its uses in Prime really? A use often maps to a native
   element or an Interop control that already exists.
4. What does the platform do now, checked in a browser, not only in sources?
5. What has to exist in Interop first?
6. Can an invoker (`command`/`commandfor`, built-in or a custom `--command`)
   replace script? Say where invokers do not fit.
7. Accessibility: what Prime misses, with WCAG numbers and severity.
8. Complexity: lines per concern, and which are there only for Angular.
9. What carries over: ideas, tests, CSS, lessons.

## Steps

### 1. Branch and read

- Check the branch. On `main`, stop and offer to branch.
- Read the component's card in `.agent/components/`, if any, and any earlier
  review in `prompts/` (check names case-insensitively: the file system
  ignores case).
- List Prime's files: `find projects/interop_deprecated -ipath "*<name>*" -not -path "*/iconsets/*"`.
- Note which Interop pieces might already cover it: `ls projects/interop projects/interop/src`.

### 2. Two agents in parallel, in the background

Launch both in one message. Fill the brackets.

**Code audit** (general-purpose, read-only):

> Read-only audit, do not edit files. Repo: /Users/christophersalmon/repos/interop. "Prime" is the
> deprecated Angular library in projects/interop_deprecated. We are deciding whether and how to bring
> its [COMPONENT] into the canonical library projects/interop (CSS-first, light DOM, native elements
> over ARIA, framework-free `bind*()` helpers in projects/interop/src/ with thin Angular directives,
> invoker commands where they fit, a dev audit in src/audit.ts).
>
> Audit fully: [PRIME FILES], its CSS (styles/components/[name].css and the protocol theme file), its
> demo page, any .agent/ or prompts/ docs that mention it, and every consumer in projects/ (grep the
> selector and class names). git archaeology: `git log --follow --oneline` on the main files; read the
> key commits to recover the stated rationale.
>
> Answer with file:line citations:
> 1. What it claims to be and intends (docs, comments, commits). Does the code do it?
> 2. Does it conform to [THE SPEC: HTML element / APG pattern URL]? Roles, states, naming, keyboard,
>    focus on open and close, disabled, forms, forced colors.
> 3. Bugs: concrete input → wrong behavior. What the spec file covers and misses.
> 4. Complexity: lines per concern; load-bearing vs there only for Angular.
> 5. CSS: WCAG 1.4.1, 1.4.3, 1.4.10, 1.4.11, 2.4.7, 2.4.11, 2.5.8; forced colors; reduced motion; RTL.
> 6. Each consumer: what is it really, and which native element or existing Interop piece replaces it?
> 7. Could invoker commands replace any of its script? Be honest where they don't fit.
> 8. What is worth carrying over.
> Return a structured report, 1200–1800 words, short code quotes.

**Outside research** (general-purpose, web):

> Web research, no repo edits. Today is [DATE]. A platform-native, accessibility-first component library
> (CSS over native elements, light DOM, small framework-free helpers, invoker commands where they fit)
> is deciding how to ship [COMPONENT]. Cite URLs inline; mark anything unverified.
> 1. Names (§0): what specs, platform guidelines and design systems call it (HTML, ARIA/APG, Apple HIG,
>    Material, Fluent, Carbon, Spectrum/React Aria, Radix, Base UI, Ark, Angular CDK/Aria, Web Awesome,
>    GOV.UK, USWDS). Which use which.
> 2. The spec and APG essentials: roles, states, keyboard, focus, naming.
> 3. When it is the right choice and when another pattern is: expert opinion and usability evidence
>    (Roselli, Higley, O'Hara, Watson, GOV.UK, NN/g), screen reader and mobile realities.
> 4. Current platform features and browser support for this component as of today, with versions.
>    [LIST THE FEATURES TO CHECK.]
> 5. Can invoker commands (built-in or custom `--command`) express any of its behavior?
> 6. Prerequisites a library would build first.
> Return a dense report, 1500–2000 words.

While they run, tell the user what is running in one or two sentences.

### 3. Verify

- Spot-check the audit's top findings against the source (`sed -n` the cited
  lines). Report a finding only once checked.
- Check every platform claim the decision depends on in Chrome with
  `scripts/cdp/probe.mjs`: support (`CSS.supports`, `'x' in HTMLElement.prototype`),
  behavior (`--keys`), the accessibility tree (`--ax`), forced colors
  (`--media`). Record the Chrome version.
- Where sources conflict, the browser wins; say which source was wrong.

### 4. Write the review

`prompts/<NAME>-REVIEW.md`, in the shape below. Follow
[.agent/writing.md](../writing.md): present tense, numbers, no metaphors.

```
# <Component> — Research Review
Review of Prime's `<Class>` …, run against new-component-research.md.

## Decision
One paragraph, then a table: Prime use | Really | Interop.
Then: Question | Decision, answering the questions above.

## 0. Names
Name | Used by. The pick and why.

## 1. Prime
Size and shape (lines, files, tests). What git history says.
### What held
### Accessibility misses   # | Issue | WCAG | Severity
### Bugs                   numbered, concrete
Test coverage in one paragraph.

## 2. Evidence             experts, usability data, support data, with links
## 3. The platform, checked in Chrome <version>   Feature | Result; then sources for other browsers
## 4. Prerequisites in Interop                    Piece | Status
## 5. Invokers                                    Job | Invoker?
## 6. What carries over                           numbered
## Questions for you                              numbered, each with a recommendation
## Unverified
```

### 5. Cards and commit

- Rebuilding: leave the old card until the build replaces it.
- Retiring: rewrite the card as a short "Retired" card (Prime use → Now,
  why, what not to reintroduce), like `listbox.md` and `chip.md`.
- Commit the review and card together: "Review Prime's <name>".
  No co-author trailers.

### 6. Report to the user

Lead with the decision. Then the answers to the questions above, briefly. Then
the numbered questions with recommendations. Then what was not verified.
Keep it short; the document holds the detail.

## After the user answers

Build per the playbook: CSS first; a `bind*()` helper only for what the
platform cannot do; a directive only to bind it in Angular. Add the component's
files to the style guards (target size, contrast, radius, forced colors,
motion), an a11y fixture, audit rules with specs, a demo page with code blocks
and an "Also known as" line, and a card. Verify in Chrome with real keys;
list what was not verified.
