# Callout — Research Review

Review of Prime's `InteropCallout` in
`projects/interop_deprecated/src/lib/components/interop-callout/`, run against
[new-component-research.md](new-component-research.md).

## Decision

Retire Prime's component. Rebuild the callout as styles on an authored
`<div role="note">`, with no script:

- `div[interop-callout][role="note"]` is CSS only. The author writes the
  status word, the title and the body as markup, so the heading level and the
  wording stay theirs.
- `itx-color` picks the status (`info`, `success`, `warning`, `danger`), the
  same attribute and values as the toast and the badge. No `itx-color` is a
  neutral note.
- The status reaches every reader in three ways: an `aria-hidden` icon in the
  status color (shape), a status word in the text (a visible title such as
  "Warning", or `<span itx-visually-hidden>Warning:</span>`), and the color.
  Prime has only the color.
- The look follows the toast: a bordered panel with a thicker status edge at
  the inline start, a real border so it survives forced colors and the house
  radius.
- A callout is static. It never takes `role="alert"` or `role="status"`, never
  takes focus, and is never dismissed. A message that appears after an action
  is a toast or `announce()`.

The rebuild needs about 60 lines of CSS, no TS, and two audit rules. Prime has
44 lines of TS and 178 of CSS.

```html
<div interop-callout role="note" itx-color="warning">
	<svg interop-icon="tabler-alert-triangle" aria-hidden="true"></svg>
	<p><strong>Warning:</strong> Deleting a project deletes its runs.</p>
</div>
```

| Prime use | Really | Interop |
|---|---|---|
| Callout demo page, each status | A static note in running content | `div[interop-callout]` |
| Checkbox page, "The group component supports…" (`checkbox-page.html:42-46`) | Section intro prose | A plain `<p>` |
| Docs "callout" tier for disambiguation notes (memory) | A short must-see note | `div[interop-callout]` |
| Canonical dialog demo, `<p role="alert">You have unsaved changes…` | A live warning | Stays `role="alert"`; may borrow nothing |
| Prime's dropped "swap in `role=alert`" advice | A dynamic message | Toast or `announce()` |

| Question | Decision |
|---|---|
| What Prime claims, and does it? | A "semantic status callout". The colors work; the status is paint only, the heading is a `<strong>`, and nothing styles it outside `[interop-root]`. |
| Is it the thing its name says? | Its `role="note"` is the right role for a static aside to the text. Its status is not conveyed to screen readers or in forced colors. |
| Each use, really | One self-demo, one misuse (plain intro prose), and the docs tier the memory names. |
| The platform now | `role="note"` and its `aria-labelledby` name are exposed in Chrome 155. An unnamed `<aside>` in `<main>` is a landmark; in an `<article>` it is generic. Forced colors make all statuses identical. |
| Prerequisites | Icons, `itx-visually-hidden`, the toast's status colors and border pattern all exist. |
| Invokers | No. A callout has no behavior. Dismissal belongs to a notification, not a callout. |
| Accessibility | Status by color alone (1.4.1, 1.3.1), lost in forced colors, a fake heading, overflow on long strings (1.4.10). |
| Complexity | 44 lines of TS, all of it Angular templating for two inputs and a static role. |
| What carries over | The role, the edge at the inline start, logical properties, first and last child margin trims, the usage rule "short and strict". |

## 0. Names

| Name | Used by |
|---|---|
| Callout | Carbon (static, non-dismissible), Radix Themes, Web Awesome `wa-callout`, Pleo |
| Inline alert / alert | Spectrum InlineAlert, USWDS Alert, Shoelace `sl-alert` |
| MessageBar | Fluent v9 |
| Inset text, warning text | GOV.UK |
| Admonition | Docusaurus, MkDocs |
| Alert (GitHub Markdown `> [!WARNING]`) | GitHub |
| note | ARIA role |

The pick is **callout**: the name most systems give the static,
non-announcing box, and the name Prime used. "Alert" names a live region in
ARIA and APG, which a callout is not. Also known as: admonition, inline alert,
notice, inset text.

## 1. Prime

`interop-callout.ts` is 44 lines (about 15 of code): `role: "note"` on the
host, `type` written to `data-type`, and an optional `heading` rendered as
`<strong class="interop-callout__heading">`. CSS: `styles/components/callout.css`
(74) and the protocol theme (104, about half of it comments). No tests.

History: `2a8f6e2e` created it and told authors to "swap in role=alert via the
host binding or a wrapper" for critical alerts, with no API for it. `511bdc54`
added status palettes shared with alerts and toasts. `5668e811` moved it to
the two-file CSS and changed the edge from the status fill to the border rung.
`7dee7b65` moved it onto role tokens.

### What held

- `role="note"` is the right role: "a section whose content is parenthetic or
  ancillary to the main content". It is not a landmark.
- The status edge is `border-inline-start`, so it moves to the right in RTL.
- Logical padding throughout.
- The body trims its first child's top margin and last child's bottom margin.
- Text on the tint measures 6.72:1 or better and the edge 4.49:1 or better
  against the tint, in both schemes (calculated from Prime's tokens).

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | Status is color only: no icon, no status word, no name. A screen reader hears "note" and the text | 1.4.1, 1.3.1 | High |
| 2 | Forced colors drop the tint and map the edge to `CanvasText`: all four statuses look identical. Verified in Chrome 155 | 1.4.1 | High |
| 3 | The title is a `<strong>`: not in the heading list, not the note's name, and set smaller than the body (`--itx-font-size-label` against `-body`) | 1.3.1, 2.4.6 | Medium |
| 4 | No `overflow-wrap`: a long URL overflows at 320px | 1.4.10 | Medium |
| 5 | No styles without an `[interop-root]` ancestor: bare text, no edge | 1.3.1 (structure shown visually) | Medium |

### Bugs

1. Outside `[interop-root]` every token resolves to nothing
   (`themes/protocol/components/callout.css:54`): no padding, no border, no tint.
2. A one-sided border with a radius tapers the 3px edge into the corners. At
   the canonical 8px house radius it is worse.
3. `type="error"` writes `data-type="error"` and draws as info, with no warning.
4. Stale comments and docs: "Squared by default because `--itx-radius` is"
   (`callout.css:35-40`), the demo's token table lists `--itx-<type>-tint`,
   `-border`, `-on-tint`, retired in `7dee7b65`.
5. The only consumer outside its own page (`checkbox-page.html:42-46`) wraps
   intro prose in an info callout, and calls the data mode "declarative".

There are no tests: no contrast pair, no semantics check, no forced colors, no
axe fixture.

## 2. Evidence

- Roselli, "ARIA note" (2024): every browser exposes `note`, but only JAWS with
  Chrome announced it. NVDA with Firefox and VoiceOver announced nothing.
  Narrator and TalkBack announced it only when it had a name.
  [adrianroselli.com](https://adrianroselli.com/2024/02/aria-note.html). The role
  is honest and harmless; the status word does the work.
- APG Alert: screen readers do not announce alerts present before load
  completes, and alerts must not move focus.
  [APG](https://www.w3.org/WAI/ARIA/apg/patterns/alert/). `role="alert"` on a
  static box either says nothing or, inserted by a router or `@if`, interrupts
  on every navigation.
- Carbon: a callout "loads with page content", is not dismissible, has no
  action, and has no `aria-live`.
  [Carbon](https://carbondesignsystem.com/components/notification/accessibility/)
- GOV.UK: inset text is easy to miss, so important information uses warning
  text, which pairs an `aria-hidden` icon with
  `<span class="govuk-visually-hidden">Warning</span>`. All three of its
  patterns say "don't overuse".
  [inset text](https://design-system.service.gov.uk/components/inset-text/),
  [warning text](https://design-system.service.gov.uk/components/warning-text/)
- USWDS: the text starts with a word naming the type; the heading level is the
  author's. [USWDS](https://designsystem.digital.gov/components/alert/)
- GitHub: alerts only when crucial, one or two per article, never back to back.
  [GitHub docs](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- NN/g: passive notifications are easily missed, and "if something always looks
  the same, it's not an indicator". Place a note next to what it qualifies.
  [NN/g](https://www.nngroup.com/articles/indicators-validations-notifications/)
- Web Awesome split Shoelace's `sl-alert` (live, dismissible) into a static
  `wa-callout` with no role, and a toast. Fluent's MessageBar announces on mount,
  which is the opposite choice.

## 3. The platform, checked in Chrome 155.0.8059.85

| Feature | Result |
|---|---|
| `role="note"` on a custom element or a `div` | Exposed as `note` |
| `role="note"` with `aria-labelledby` to an `h3` | `note "Note title"`, and the heading stays in the outline |
| Prime's `<strong>` title | `strong`, not a heading, no name for the note |
| Unnamed `<aside>` in `<main>` | `complementary` landmark |
| Unnamed `<aside>` in `<article>` or a named `<section>` | `generic` |
| Named `<aside>` in `<article>` | `complementary "Named"` |
| `::before { content: "Warning: " }` | Read as text |
| `::before { content: "⚠" / "Warning: " }` | Alt text "Warning: " read |
| Forced colors, warning and info boxes with a tint and a 3px inline-start border | Both drawn identically: `CanvasText` edge on `Canvas`, tint gone |

Other browsers, from sources: `role="note"` is exposed in Chrome, Firefox,
Edge and Safari (Roselli). Firefox 125 made an unnamed scoped `<aside>` generic;
WebKit's behavior is unverified. CSS alt text works in Chrome 77+, Safari 17.4+,
Firefox 128+, but generated text is not translated, selected or copied, so the
status word goes in the DOM.

## 4. Prerequisites in Interop

| Piece | Status |
|---|---|
| Status icons (`tabler-info-circle`, `-circle-check`, `-alert-triangle`, `-alert-circle`) | Exist; the toast uses them (`src/toast.ts:34-39`) |
| `itx-visually-hidden` | Exists (`styles/visually-hidden.css`) |
| Status edge colors, measured | Exist on the toast (`--itx-toast-accent-color` per `itx-color`); move or share |
| Bordered panel with a thicker inline-start edge | Exists on the toast (`interop-toast.structure.css:45-51`) |
| `drawIcons()` for icons in plain HTML | Exists |
| Typography roles for a title | Exist (`itx-font`) |

## 5. Invokers

| Job | Invoker? |
|---|---|
| Show the callout | No. It is always in the page |
| Dismiss it | No. `hide-popover` needs a popover, which leaves the flow. A custom `--dismiss` still needs a listener to hide it and move focus. A dismissible message is a notification |
| Expand a long note | No invoker needed: `<details>` |

## 6. What carries over

1. `role="note"` as the role.
2. The status edge on `border-inline-start`, now with a full border, like the
   toast, so the radius does not taper it.
3. Logical padding and the first and last child margin trims.
4. The usage rule: short and strict, always visible, a few sentences.
5. The four status values, renamed from `type` to `itx-color`.
6. New: an `aria-hidden` status icon and a status word, `overflow-wrap:
   anywhere`, a forced-colors block that keeps the icon in its shape.
7. Audit rules: `callout-status` (an `itx-color` callout with no status word in
   its text) and `callout-live` (`role="alert"` or `role="status"`, or no
   `role="note"`).

## Questions for you

1. **CSS only, authored markup, no component.** The author writes the role, the
   icon, the status word and the title. Recommend: yes. A component cannot
   know the heading level, and the toast and badge already take `itx-color`.
2. **The look.** Prime tints the whole panel in the status color. The toast is
   a neutral panel with a status edge and icon. Recommend: the toast's look, so
   a callout and a toast of one status read as one family, and the contrast
   pairs are the toast's, already measured.
3. **The status word.** Visible ("Warning:" in bold, or a title), or visually
   hidden? Recommend: let the author choose; document both; the audit requires
   one of them.
4. **The icon.** Required, or optional? Recommend: required with `itx-color`,
   since it carries the status in forced colors; optional on a neutral note.
5. **A neutral note.** Ship no-`itx-color` as a plain note with a neutral edge?
   Recommend: yes, for asides that are not a status.
6. **Dismissal.** Recommend: never on a callout.
7. **The demo's own notes.** Use the callout for the disambiguation notes the
   docs tier names, and nowhere else for now. Recommend: yes; leave `.aka` and
   `.built-from` as prose.

## Unverified

- Screen reader output today: Roselli's 2024 results are not re-tested.
- WebKit's mapping of a scoped unnamed `<aside>`.
- Safari and Firefox accessibility trees for `role="note"` with a name, checked
  here only in Chrome.
- Contrast of links and inline `<code>` inside a callout: depends on the look
  chosen in question 2.
