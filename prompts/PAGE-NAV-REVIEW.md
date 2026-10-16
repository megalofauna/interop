# Page nav — Research Review

Review of Prime's `PageNav` composite (`itx-page-nav`) in
`projects/interop_deprecated`, against the canonical tabs, run against
[new-component-research.md](new-component-research.md).

## Decision

Retire Prime's composite. Ship a page nav as CSS on a `<nav>` of same-page
links, in two orientations from the start:

| Orientation | Use | Built from |
|---|---|---|
| Horizontal (default) | A bar under the page header that sticks to the top | `nav[interop-page-nav] > ul` with the underline look shared with tabs |
| Vertical, `itx-orientation="vertical"` | A narrow column, usually to the right of the content | `nav[interop-page-nav] > ul[interop-tree]`: the tree, which tracks the current section once it sets `scroll-target-group` |

The browser decides the current section (`scroll-target-group`,
`:target-current`). One helper patches what it leaves: the current state for
screen readers, a fallback for engines without it, and keeping the current
link visible in an overflowing bar.

Tabs and page nav form one family, content navigation, with tree and steps.
They share a look and a rule for "current". They do not share semantics, so
they stay separate components.

| Prime use | Really | Interop |
|---|---|---|
| Deprecated demo page sidebar ("on this page") | In-page navigation with scroll-spy fed by the page | Vertical page nav |
| Horizontal bar with `[sticky]` | In-page navigation that pins under the header | Horizontal page nav |

| Question | Decision |
|---|---|
| 1. Does Prime's PageNav do what it claims? | It renders links and reflects `activeHref` as `aria-current`. It has no scroll-spy: the deprecated demo fed `activeHref` from an IntersectionObserver (`demo-page.ts:66-80`). A quarter of its theme tokens were inert (`.agent/todo/page-nav-dead-levers.md`) |
| 2. Is it the thing its name says? | Yes: a `<nav>` of links |
| 3. What is each use really? | In-page navigation. One consumer, the deprecated demo |
| 4. What does the platform do now? | See §3. Chrome tracks the current section natively. Nothing reaches the accessibility tree |
| 5. What has to exist first? | See "Primitives for review" |
| 6. Invokers? | No. The links are links: the browser scrolls to a fragment with no script |
| 7. Accessibility | Prime's `aria-current` was right in kind; its value came from page code. The current value is `true` (Soueidan, ARIA WG resolution of 2026-01-29) |
| 8. Complexity | 471 lines. 186 of TypeScript, of which stuck detection and smooth scroll are now CSS, and the reveal carries over |
| 9. What carries over | The bounded reveal (`navScrollport`, `nearestDelta`), the "last visible section wins" rule, `scroll-padding` respected |

## 0. Names

| Name | Used by |
|---|---|
| table of contents | MDN, Starlight, Docusaurus |
| on this page | GOV.UK (contents list), GitHub Docs, MDN's heading |
| in-page navigation | USWDS |
| scroll-spy | Bootstrap |
| anchor navigation | Carbon (in docs) |
| scroll marker, scroll target group | CSS Overflow 5 |

Pick: page nav, the name Prime used. Also known as: table of contents, on this
page, in-page navigation, scroll-spy.

## 1. Prime

186 lines of TypeScript, a 56-line template, 228 lines of CSS. Two template
branches for two orientations, `scrollIntoView` for the scroll, a view
transition for `fade`, an IntersectionObserver for the stuck class, and a
bounded reveal that keeps the current link inside the bar's own scroller
without moving the page.

### What held

- `<nav>` with a name, links with `aria-current`.
- The reveal: it walks up only to the nav, and honors `scroll-padding`.
  `scrollIntoView({ block: "nearest" })` would scroll the page too.
- Reduced motion turned smooth scrolling into a jump without skipping it.

### Misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | No current section without page code; the demo wrote its own observer | 1.3.1 | Medium |
| 2 | Eight theme tokens read by nothing; a border drawn from an undocumented token family | — | Low |
| 3 | `fade` forced an instant scroll and a view transition on every click | 2.3.3 | Low |

## 2. Evidence

- Tabs hide content and are selected; a page nav leaves everything shown and
  reports position. Chrome 154 encodes the split as two modes of one feature,
  `scroll-marker-group: links | tabs`
  ([release notes](https://developer.chrome.com/release-notes/154)).
- A table of contents marks the section in view with `aria-current="true"`
  ([Soueidan](https://sarasoueidan.com/blog/css-scrollspy/)). The ARIA WG
  resolved that the current scroll marker maps like `aria-current="true"`
  ([minutes](https://www.w3.org/2026/01/29-aria-minutes.html)).
- CSS-only tabs (`tabs` mode) are not ready: Chrome only, WebKit's position is
  labeled "concerns: accessibility"
  ([#447](https://github.com/WebKit/standards-positions/issues/447)), and
  Soueidan and Roselli call them not ready for production. Generated markers
  cannot hold the consumer's icons, badges or buttons.

## 3. The platform, checked in Chrome 155.0.8059.80

| Feature | Result |
|---|---|
| `scroll-target-group: auto` on a `<ul>` of `<a href="#…">`, page scrolling the root | `:target-current` follows the section in view; the short last section is current at the end of the scroll |
| Nested lists, a closed `<details>`, a link to another page | Nested links are tracked; the closed branch's link stays current; the other-page link is ignored |
| Keyboard on those links | Unchanged: each a Tab stop, Enter scrolls to the section |
| Accessibility tree | Links stay links. No current state was visible. CDP did not report `aria-current` even where the author set it, so exposure is unverified |
| Overflowing horizontal `scroll-target-group` list | The current link is not scrolled into view (`scrollLeft` 0, "Section six" off-screen) |
| `container-type: scroll-state` + `@container scroll-state(stuck: top)` | Matches once the sticky bar pins |
| `scroll-marker-group: before tabs` | `tablist` / `tab` / `selected`; inactive panels' content left out of the tree; one Tab stop, arrows move |
| `scroll-marker-group: before` (links) | `navigation` / `link` |

Other engines (caniuse, standards positions): Firefox and Safari ship no
scroll markers, no `scroll-target-group` and no `:target-current`. Not in
Interop 2026.

## 4. Primitives for review

None of these exists in Interop. Each is raised before it is built.

| # | Primitive | What | Why it is needed |
|---|---|---|---|
| A | Underline look, `styles/underline.css` | The rule under a strip and the bar on its current item, moved out of `interop-tabs.structure.css`. Tabs (selected) and the horizontal page nav (current) wear it, as `styles/segmented.css` is worn by tabs and the radio group | One look for "this one" across content navigation. Without it the page nav copies 60 lines of tabs CSS |
| B | `bindTargetCurrent(list)` | Writes `aria-current="true"` on the current link, read from `:target-current` where it exists and from an IntersectionObserver where it does not; keeps the current link visible in the list's own scroller | Screen readers get no current state from CSS; Firefox and Safari have no `:target-current`; an overflowing bar does not reveal its current link |
| C | Sticky bar with a stuck state | `position: sticky` on the nav and `container-type: scroll-state`; `@container scroll-state(stuck: top)` adds the bar's edge | Nothing in Interop sticks today. The app shell header may want it next |
| D | `itx-orientation` beyond the segmented radio group | The page nav reads `itx-orientation="vertical"` | Exists as a system axis; this is its second user |

Existing pieces it uses: `ul[interop-tree]` (vertical), `interop-scroll-area`
and `bindScrollArea()` (a vertical nav taller than its column).

## 5. Invokers

| Job | Invoker? |
|---|---|
| Scroll to a section | No: a fragment link does it natively |
| Mark the current section | No: it follows scrolling, not a command |
| Reveal the current link in the bar | No |

## 6. What carries over

1. The bounded reveal: walk up only to the nav; honor `scroll-padding`; scroll
   with no `behavior`, so CSS `scroll-behavior` and reduced motion decide.
2. "Last visible section wins" for the fallback observer.
3. `aria-current` on the link, now `true`.
4. Dropped: the `PageNavLink[]` data API (the consumer writes the list), the
   view-transition `fade`, the stuck IntersectionObserver, the two template
   branches, the inert tokens.

## Unverified

- Whether Chrome exposes `:target-current` as `aria-current`.
- Screen reader output.
- `scroll-state` queries in Firefox and Safari.
