# Expansion Panel — Research Review

Review of Prime's `InteropExpansionPanel`, `InteropExpansionTrigger`,
`InteropExpansionBody` and `InteropAccordion` in
`projects/interop_deprecated/src/lib/components/interop-expansion-panel/`, run
against [new-component-research.md](new-component-research.md).

## Decision

Retire Prime's expansion panel. It rebuilds `<details>` out of a button, a
`div` and two injection tokens, and gets three things wrong that the element
gets right. The canonical version is a look on the native element:

- `details[interop-disclosure]` is CSS only. The browser provides the toggle,
  Enter and Space, the expanded state, find-in-page (a search match opens a
  closed panel), and printing as it prints `<details>`.
- `<summary>` wears the chevron the tree already wears (`styles/disclosure.css`),
  in a full-width row with a hover fill and a 24px or taller target.
- `::details-content` animates its height to `auto` where the browser can
  (`interpolate-size`, Chrome 129+), and snaps open elsewhere.
- An accordion is a pattern, not a component: disclosures stacked under a
  heading, sharing a `name` when only one should be open. The browser enforces
  that: opening one closes the others.

About 70 lines of CSS, no TS, three audit rules. Prime has 532 lines of TS and
645 of CSS.

```html
<details interop-disclosure>
	<summary>Why can I set bounds in two places?</summary>
	<p>…</p>
</details>
```

| Prime use | Really | Interop |
|---|---|---|
| Resizable page, "Why can I set bounds in two places?" | A disclosure the reader seeks out (the disambiguation-note convention) | `details[interop-disclosure]` |
| Demo: standalone, default open | A disclosure | `details[interop-disclosure]`, `open` |
| Demo: exclusive and multi accordions | Disclosures in a group | The accordion pattern: `name` for one-at-a-time |
| Demo: controlled panel | State bound from outside | `[open]` and `(toggle)` on the element |
| Demo: peek ("show more") | Another pattern: a clipped preview | Not built |
| Demo: disabled | An anti-pattern, and broken in Prime | Not built |
| Canonical flow page, "Why space only goes above" (`flow-demo.html:154`) | A disclosure, unstyled today | `details[interop-disclosure]` |

| Question | Decision |
|---|---|
| What Prime claims, and does it? | "An accessible, standalone collapsible panel" on the APG accordion. Its ARIA wiring is right; hiding, disabled and exclusivity are broken. |
| Is it the thing its name says? | It is an APG disclosure built by hand. "Expansion panel" is Material's name; the platform's is details, APG's is disclosure. |
| Each use, really | One seek-out note, one unstyled canonical note, and a showcase. |
| The platform now | `<details name>` is exclusive, keyboard-operable, find-in-page searchable and animatable to `auto`, checked in Chrome 156 and Playwright WebKit 27.2. |
| Prerequisites | The chevron (`disclosure.css`), the focus ring, flow spacing. All exist. |
| Invokers | No. `<summary>` is already the declarative toggle. No built-in command targets `<details>`. |
| Accessibility | Prime keeps collapsed links focusable under `aria-hidden`, fakes disabled, and lets a trigger submit its form. |
| Complexity | About 90 of 532 TS lines do work; the rest is DI plumbing and comments. |
| What carries over | The Carbon row look, the shared-border stacking, the heading audit idea, DOM-order arrow navigation if anyone asks. |

## 0. Names

| Name | Used by |
|---|---|
| details / disclosure widget | HTML |
| Disclosure | ARIA APG (one panel), Apple HIG ("disclosure controls", SwiftUI `DisclosureGroup`), Spectrum and React Aria (`Disclosure`, `DisclosureGroup`) |
| Accordion | ARIA APG (a group), Fluent, Carbon, USWDS, GOV.UK, Radix, Base UI, Ark, Angular CDK, Angular Aria |
| Collapsible | Radix, Base UI, Ark, for one panel |
| Details | GOV.UK (one short section), Web Awesome (`wa-details`) |
| Expansion panel | Material 2, Angular Material (`mat-expansion-panel`); Material 3 no longer documents it |

The pick is **disclosure** for the component (`interop-disclosure`), the name
the platform, APG and Apple share and the name the existing chevron file
already has. **Accordion** names the pattern of several. "Expansion panel" goes
with Prime. Also known as: details, collapsible, expansion panel, accordion
item.

## 1. Prime

Seven files, 532 lines of TS (about 55% doc comments): the panel, trigger,
body, accordion, two context-token files and the public API. CSS: 520
structural, 125 theme, about 50 tokens. No tests.

History: created in `2a8f6e2e` with a TODO to move to `<details>` "when heading
nesting constraints can be worked around" (`interop-expansion-panel.ts:64-65`).
It never moved.

### What held

- The trigger is a native `<button>` with `aria-expanded` and `aria-controls`.
- A dev warning asks for a heading around the trigger.
- Logical properties throughout; the chevron turns on the block axis in RTL.
- The Carbon look: a full-width 40px row, a hover fill, an inset focus ring,
  hairline rules, shared borders that collapse between stacked items.
- Arrow, Home and End move between triggers in an accordion, in DOM order.

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | A collapsed body is clipped and `aria-hidden`, but its links stay focusable: Tab lands on invisible content (`interop-expansion-body.ts:43`) | 2.4.7, 4.1.2 | High |
| 2 | `disabled` is opacity and `pointer-events` only: the button stays in the tab order, announced "button, collapsed", and Enter does nothing | 4.1.2 | Medium |
| 3 | Find-in-page lands on clipped text and opens nothing | 2.4.3 (usability) | Medium |
| 4 | The heading is left to the consumer and checked by a dev warning only | 1.3.1 | Low |
| 5 | No forced-colors block (the chevron survives by luck, through `currentColor`) | 1.4.11 | Low |

### Bugs

1. Collapsed content focusable under `aria-hidden` (above).
2. No `type="button"` on the trigger (`interop-expansion-trigger.ts:42-48`):
   inside a `<form>`, toggling a panel submits it.
3. A plain panel nested in an accordion's panel registers with the outer
   accordion (`interop-expansion-panel.ts:84`), so opening it closes its own
   parent (`interop-accordion.ts:80-84`).
4. Exclusivity runs only on clicks: two panels bound `[expanded]="true"` in an
   exclusive accordion both stay open.
5. Disabled panels stay in the accordion's arrow ring, which filters on a
   `disabled` the button never gets.
6. The demo promises "persist, log, or veto the change", but the model is set
   before the handler runs.
7. Documented tokens differ from the ones read (`-trigger-outline-*` against
   `-trigger-focus-*`); eight theme tokens are read by nothing.

There are no tests. A spec and an axe fixture would have caught bugs 1, 2 and 5.

## 2. Evidence

- O'Hara, "The details and summary elements, again" (2022): `summary` is
  announced as "disclosure triangle", "button" or "summary" depending on the
  pairing; adding `role="button"` to it makes macOS Safari drop the heading and
  the state. Never add a role to `summary`.
  [scottohara.me](https://www.scottohara.me/blog/2022/09/12/details-summary.html)
- Roselli, "Details / summary are not [insert control here]": not an APG
  accordion (no heading semantics), not tabs, not menus, not dialogs.
  [adrianroselli.com](https://adrianroselli.com/2019/04/details-summary-are-not-insert-control-here.html)
- a11ysupport.io rates a heading inside `summary` as partial.
  [a11ysupport.io](https://a11ysupport.io/tests/tech__html__details-summary)
- GOV.UK splits Details (one or two short sections only some users need) from
  Accordion (many sections, frequent users, only where research shows it
  helps). Accordion content became find-in-page searchable in Frontend 4.5.0.
  [Details](https://design-system.service.gov.uk/components/details/),
  [Accordion](https://design-system.service.gov.uk/components/accordion/),
  [GOV.UK blog](https://insidegovuk.blog.gov.uk/2021/10/29/how-we-made-the-gov-uk-accordion-component-more-accessible)
- NN/g: accordions raise interaction cost; when readers need most of the
  content, one long page with headings is better.
  [NN/g](https://www.nngroup.com/articles/accordions-on-desktop/)
- Base UI deprecated roving arrow focus in its accordion, following the APG
  note that arrow keys are optional.
  [Base UI](https://base-ui.com/react/components/accordion)
- Support (MDN browser-compat-data, today): `details[name]` Chrome 120, Firefox
  130, Safari 17.2. `::details-content` Chrome 131, Firefox 143, Safari 18.4.
  Find-in-page opens closed details in Chrome 97, Firefox 148, Safari 26.2
  (partial: no scroll). `interpolate-size`: Chrome 129 only.

## 3. The platform, checked in Chrome 156

| Feature | Result |
|---|---|
| `details[name]`, `::details-content`, `:open`, `interpolate-size`, `calc-size()`, `beforematch` | All supported |
| Enter and Space on a focused `summary` | Toggle the panel |
| Two `details` with one `name`; open the closed one | The other closes |
| `::details-content` from `block-size: 0` to `auto` | Animates: 18, 35, 38 … 50px over frames |
| Heading inside `summary` | Kept: `heading level=3` inside the disclosure in the accessibility tree |
| `details[name]` | Exposed as a grouped disclosure |
| Closed panel | Exposed with its expanded state |

Playwright WebKit 27.2 (not real Safari): `name`, `::details-content`, `:open`
and `beforematch` supported, exclusivity works; no `interpolate-size` or
`calc-size()`, so it opens without animating. Firefox: not run here; per
sources it lacks `interpolate-size` and the `content-visibility` transition, so
it opens and closes without animating.

## 4. Prerequisites in Interop

| Piece | Status |
|---|---|
| Chevron on `summary`, RTL, forced colors, reduced motion | Exists (`styles/disclosure.css`), scoped to the tree |
| `summary[interop-button]` with an open state | Exists, for a disclosure that looks like a button |
| Focus ring | Exists (`styles/outline.css`) |
| Flow spacing for the content | Exists (`styles/flow.css`) |
| Audit rule against a control inside `summary` | Exists for the tree only (`tree-summary-control`) |

## 5. Invokers

| Job | Invoker? |
|---|---|
| Open or close one panel | No: `summary` already does it, without script |
| One open at a time | No: `name` |
| Expand all / collapse all | Only as a custom `--expand-all` command with a listener; it conflicts with `name`. Not built |
| Open on find-in-page | No: the browser does it |

## 6. What carries over

1. The Carbon row: full width, 40px default, hover fill, hairline rules,
   shared borders collapsed between stacked items.
2. The chevron, from `disclosure.css`, extended to `details[interop-disclosure]`.
3. The `::details-content` height animation, reading the shared duration.
4. Audit rules: `disclosure-summary-role` (a `role` on `summary`),
   `disclosure-summary-control` (a link or control inside `summary`,
   generalizing the tree's rule), `disclosure-summary` (a `details` with no
   `summary` first).
5. From Prime's accordion, DOM-order Arrow/Home/End, only if a consumer asks.
6. The disambiguation-note convention: a seek-out note is a disclosure whose
   summary is the reader's question.

## Questions for you

1. **CSS only on native `<details>`, retire Prime's component.** Recommend: yes.
2. **Name.** `details[interop-disclosure]`, with the accordion as a pattern
   page. Recommend: yes.
3. **Headings.** A heading inside `summary` is valid HTML and Chrome keeps it,
   but screen reader support is partial. Options: (a) allow it and document the
   caveat, (b) heading before the disclosure, (c) an APG accordion built as
   heading > button with a helper. Recommend: (a) for the accordion pattern,
   plain text for a lone disclosure; (c) only if a consumer needs reliable
   heading navigation.
4. **Look.** The Carbon row (full-width, hover fill, hairline rules) for every
   disclosure, or a quiet inline look (chevron and text only) for notes, with
   the row for the accordion? Recommend: quiet by default, the row as
   `interop-disclosure="row"`, worn by the accordion pattern. A lab can settle it.
5. **Animation.** The height animation in Chrome only, instant elsewhere.
   Recommend: yes.
6. **Not built:** disabled, peek, expand all, arrow keys, a print helper.
   Recommend: agree; each waits for a real use.

## Unverified

- Screen reader output today for `summary` and for a heading inside it (the
  evidence is 2022 testing and a11ysupport.io).
- Find-in-page opening a closed panel, in a real browser: only `beforematch`
  support was checked.
- Firefox, and real Safari.
- Forced colors and print with the planned look.
