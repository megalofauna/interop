# Tabs — Research Review

Review of Prime's `interop-tabs` in `projects/interop_deprecated`, run against
[new-component-research.md](new-component-research.md). Builds on
[TABS-SEGMENTED-RELATIONSHIP.md](TABS-SEGMENTED-RELATIONSHIP.md).

## Decision

Tabs are consumer-written markup, a framework-free `bindTabs()` helper, and
CSS. A thin Angular directive calls the helper.

```html
<div interop-tabs>
  <div role="tablist" aria-label="Station systems">
    <button type="button" role="tab" aria-controls="nav" aria-selected="true">Navigation</button>
    <button type="button" role="tab" aria-controls="eng" aria-selected="false" tabindex="-1">Engineering</button>
  </div>
  <section role="tabpanel" id="nav">…</section>
  <section role="tabpanel" id="eng" hidden="until-found">…</section>
</div>
```

| Question | Decision |
|---|---|
| Name | Tabs. Attribute `interop-tabs` on the wrapper, the smallest element that holds a complete control (tab list and panels) |
| Who writes the strip | The consumer. Tabs pair with panels through `aria-controls` only |
| Variants | Underline look by default; `interop-tabs="segmented"` through a layer shared with the segmented radio group |
| Shared layer | `styles/segmented.css`, extracted from the radio group, tokens `--itx-segmented-*` |
| Change event | `interop-tabs-change` on the tab list, carrying the selected tab and panel |
| Deep links | Opt-in (`{ hash: true }`): read the initial `#id`, follow `hashchange`; history writes only when asked |
| Removed selected tab | A `MutationObserver` on the tab list selects a neighbor |
| No-JavaScript fallback | Not promised. The markup carries the initial state, so server output is correct |
| Disabled tabs | Native `disabled`, skipped by the arrow keys |
| Activation | Automatic by default; manual as an option |

## 0. Names

**Tabs** is the ARIA term and the majority name (Carbon, Material, Spectrum,
Radix, React Aria, Ark, Chakra, Mantine, MUI, Ant, PatternFly, GOV.UK,
Atlassian). Also known as tab list (Fluent v9), tab group (Shoelace, Angular
Material), tab strip (Kendo), pivot (Fluent v8), segmented tabs (SwiftUI
`TabsPickerStyle`). Primer's underline nav and iOS tab bars are navigation, a
different pattern.

## 1. Who writes the tab strip

| Model | Verdict |
|---|---|
| A. Consumer writes the tab list | Chosen. Every surveyed system with panels does this: Carbon, React Aria, Radix, Ark/Zag, Material Web, Shoelace, Spectrum WC, Primer UnderlinePanels, the APG examples |
| B. Consumer writes sections; a helper builds the strip | Rejected. No surveyed system does it. Generated tabs cannot carry consumer attributes, tooltips or badges; `@for`/`@if` changes need regeneration; the strip is missing from server output, and Angular's [hydration guide](https://angular.dev/guide/hydration) says native DOM insertion causes mismatch errors |
| GOV.UK links upgraded by script | Rejected for Angular: with `<base href="/">`, `href="#panel"` resolves to `/#panel` |
| C. `scroll-marker-group: tabs` | Later, as a separate `interop-tabs="scroll"` variant. Chrome 154 only ([release notes](https://developer.chrome.com/release-notes/154)); no Firefox ([#1161](https://github.com/mozilla/standards-positions/issues/1161)) or WebKit ([#447](https://github.com/WebKit/standards-positions/issues/447)) position; marker names unspecified ([css-aam#18](https://github.com/w3c/css-aam/issues/18)); labels are CSS strings, so no rich labels and poor translation ([csswg #12269](https://github.com/w3c/csswg-drafts/issues/12269)); it requires a scrolling layout. No markup converts to it losslessly |

`hidden="until-found"` with `beforematch`: Chrome 102, Firefox 139 (scrolls to
the match from 148), Safari 26.2 (partial) ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden)).
No surveyed system uses it.

GOV.UK repeats the tab label as a heading at the top of each panel, for small
screens and screen reader users ([GOV.UK](https://design-system.service.gov.uk/components/tabs/)).
Headings are optional here.

## 2. Prime's accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| T1 | No forced-colors rules; the selected bar is a background, so selection disappears | 1.4.11 | High |
| T2 | The `ariaLabel` input also names the host `<section>`: every tab group, including every code block's, becomes a duplicate `region` landmark | 1.3.1 | High |
| T3 | Tab back into the list lands on an unselected tab in manual mode; APG puts it on the active tab | 2.1.1 | Medium |
| T4 | Every panel has `tabindex=0`, even one that starts with something focusable | 2.4.3 | Low |
| T5 | Arrows not flipped in right-to-left | 2.1.1 | Medium |
| T6 | Focus moves before `aria-selected` updates | 4.1.2 | Medium (unverified) |
| T7 | An empty tab list renders with zero panels | 4.1.2 | Low |
| T8 | No overflow handling; tabs spill under the actions | 1.4.10 | Medium |
| T9 | Hidden panels are not found by find-in-page | — | Low |
| T10 | Focus ring 2.87:1 on the dark page | 1.4.11 | Medium |
| T11 | Focus ring sits outside each tab in a gapless strip, overlapping its neighbors | 2.4.7 | Low |
| T12 | Arrows with modifiers swallowed | — | Low |
| T13 | No disabled tabs | — | Low |
| T14 | `activationId` registration leaks when it changes | — | Low |
| T15 | Under `prefers-contrast` the rule matches the bar's width | — | Low |

Label contrast passes in Prime (rest 8.3:1, selected 17.5:1 light).

## 3. Removed

Three selection drivers (`model`, the `activationId` service, internal state);
lazy, destroy-on-hide and pre-render panel options (`@defer`/`@if` inside a
panel replace them); label templates; the generated strip; the `<section>`
requirement; the projected actions slot (the consumer places a toolbar beside
the tab list); `itx-orientation` (CSS reads `aria-orientation`); about 45
tokens.

## 4. Carried over

The keyboard model, auto and manual activation, the Carbon underline look,
vertical orientation, actions beside the tab list, and the rule that a tab list
owns only tabs.

## 5. What `bindTabs(root, options)` does

1. Listens once on `root` and reads tabs fresh on every event.
2. On bind: exactly one selected tab (the first enabled if none), `tabindex` 0
   on it and -1 on the rest, inactive panels `hidden="until-found"`, a tab `id`
   and panel `aria-labelledby` filled in when missing.
3. Arrows by `aria-orientation`, stepping from the focused tab, wrapping,
   flipped in right-to-left; Home and End; disabled tabs skipped; keys with
   modifiers ignored.
4. Automatic activation on arrow, or manual (the native button click handles
   Enter and Space). Clicks always select.
5. Writes `aria-selected` and `hidden` before moving focus. Returns the tab stop
   to the selected tab when focus leaves the list.
6. `tabindex=0` only on a panel with nothing focusable. `beforematch` selects
   the panel's tab.
7. Dispatches `interop-tabs-change`.
8. Selects a neighbor when the selected tab is removed.
9. Optionally follows `#panel-id`.
10. Returns a function that unbinds.

## Unverified

Prime's announcement race (T6); whether `hidden="until-found"` counts as
Baseline; Chrome's scroll-marker naming from `content: attr()`; whether Angular
tolerates foreign nodes after hydration (moot under model A).
