# Tabs and the segmented control

Research report, held for later discussion. Not yet reviewed or decided.

## Summary

1. **Same look and keys, different promise.** Both pick one of many, with one tab stop and arrow keys. A radio says "this is a value". A tab says "this shows a panel". Native radios already move with the keys the way auto-activated tabs do.
2. **The platform is turning semantics into a mode.** Apple's `TabsPickerStyle` and Chrome's `scroll-marker-group: links | tabs` keep one visual and one selection model, and switch only what assistive tech hears.
3. **Tabs cannot be native radios.** ARIA in HTML allows only `menuitemradio` on `input[type=radio]` (from memory, not re-fetched). Radio-based CSS-only tabs give screen reader users no panel relationship.
4. **Platform tabs are coming, not ready.** `scroll-marker-group` tabs mode is Chromium-only, with no Gecko or WebKit signal and open accessible-name questions. `<details name>` is an accordion. Open UI tabs work looks dormant.
5. **Industry agrees on the line.** Carbon, Material 3 (via a community quote), eBay, Workday, Fluent iOS and Apple: segmented changes the view of the same content; tabs move between distinct sections. Carbon's content switcher uses tab semantics anyway.
6. **Recommendation:** two components, two kinds of markup, one shared "selected segment" CSS layer. Rebuild Tabs as light-DOM markup plus a framework-free `bindTabs()` helper, with a `line` skin by default and an opt-in `segmented` skin that matches the radio group's. Plan for `scroll-marker-group` tabs mode as the eventual engine.

## 1. Semantics

| | Tabs | Radio group |
|---|---|---|
| Announces | "Tab, Overview, selected, 1 of 3" ([APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)) | "Radio button, List, checked, 1 of 3" ([APG Radio](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)) |
| State | `aria-selected` | Native `:checked` |
| Link to content | Required: `aria-controls`, `tabpanel` labelled by its tab | None |
| Keyboard | One stop; arrows move; Home/End optional; automatic or manual activation | One stop; arrows move and check; no Home/End; no manual mode |
| Next Tab | Into the panel | Past the group |
| Form | None | `name`, `required`, reset, bfcache |

**Where the line falls.** A value (radio) when the choice changes how the same content is shown or filtered: List/Grid, All/Read/Unread, Day/Week/Month on one calendar. Navigation (tabs) when each option owns a distinct section: Overview / Settings / Members. Practical test: if each option could sensibly `aria-controls` a different panel labelled by the option's text, it is tabs. If every option controls the same region, it is a radio.

Carbon's usage page puts its content switcher on the "alternate views of related content" side ([usage](https://carbondesignsystem.com/components/content-switcher/usage/)), yet its accessibility page gives it tab semantics ([a11y](https://carbondesignsystem.com/components/content-switcher/accessibility/)). By Carbon's own use cases, Interop's radio reading is the more consistent one.

**WCAG 3.2.2.** A change of content is not a change of context ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html)). A radio that re-renders a nearby region is fine; one whose arrow-key selection navigates the page is not. Primer says not to use a segmented control when the selection changes the URL ([Primer](https://primer.style/product/components/segmented-control/guidelines)).

## 2. Structural kinship

Both are a one-of-many strip with one selected indicator. Prime saw this: `.agent/components/indicator.md:13` lists tab strips as anticipated consumers of the anchor-positioned pill. Prime's Tabs did not use it; it kept a bar in the list rule on purpose (`.agent/components/tabs.md:110-147`).

Visual state is a selector, so one CSS layer can serve all of them: `label:has(> input:checked)`, `[role=tab][aria-selected=true]`, and later `::scroll-marker:target-current`. The default looks should still differ: a bar for tabs, a pill for the segmented control. The segmented skin for tabs is opt-in.

**Radios as tabs: no.** Radios cannot take `role=tab`, the panel relationship is lost, and JAWS users in testing found radio state gave no idea of the next action ([Roselli](https://adrianroselli.com/2023/03/css-only-widgets-are-inaccessible.html)). It is acceptable only when the thing really is a radio: options are values and the "panels" are renderings of one region. That is the segmented variant.

### Platform primitives

| Primitive | Status | Exposed as | For Interop Tabs |
|---|---|---|---|
| `::scroll-marker-group` default | Chrome 135+ only ([Chrome](https://developer.chrome.com/blog/carousels-with-css), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-marker-group)) | Navigation of links | No |
| `scroll-marker-group: tabs` | Chrome 154 release notes ([154](https://developer.chrome.com/release-notes/154)); [spec](https://drafts.csswg.org/css-overflow-5/#scroll-marker-modes); no Gecko/WebKit signal | tablist, tab, implicit tabpanel | Not yet. Naming undefined ([css-aam#18](https://github.com/w3c/css-aam/issues/18)); needs a scroll container; labels from CSS `content` |
| `scroll-target-group` | `none \| auto` only | Links | Scroll-spy, not tabs |
| `<details name>` | Baseline ([MDN](https://developer.mozilla.org/en-US/blog/html-details-exclusive-accordions)) | Disclosure | No; the right no-JS fallback shape |
| Open UI tabs | Dormant ([Rupert](https://daverupert.com/2021/10/native-html-tabs)) | — | — |
| `commandfor` | Baseline | — | Wiring for a helper only |

## 3. Industry practice

| System | Guidance |
|---|---|
| Carbon | Content switcher for alternate views of related content; tabs for distinct areas. A switcher can sit inside a tab |
| Apple | `.segmented` picker for values; `TabsPickerStyle` (iOS/macOS 27) is "segmented tabs", announced as tabs ([docs](https://developer.apple.com/documentation/swiftui/tabspickerstyle.md)). One `Picker` API; semantics are a style |
| Material 3 | Segmented buttons "are not a replacement nor substyle of tabs" (community quote, [thread](https://slack-chats.kotlinlang.org/t/16404622/what-is-difference-between-tabs-and-segmentedbutton?t=v2)) |
| eBay | "Does the selection change content panels? Use tabs" ([eBay](https://playbook.ebay.com/design-system/components/segmented-button)) |
| Workday Canvas | Segmented for alternate views of similar content; tabs for unrelated content ([Canvas](https://canvas.workday.com/components/buttons/segmented-control)) |
| Fluent iOS | Segmented for states or views in one context, not navigation ([Fluent](https://fluent2.microsoft.design/components/ios/segmentedcontrol/usage)) |
| GOV.UK | Tabs sparingly; without JS they become stacked sections ([GOV.UK](https://design-system.service.gov.uk/components/tabs/)) |

## 4. Recommendation

Separate markup and semantics, one shared selected-indicator CSS layer, and a Tabs engine that can later move to `scroll-marker-group` tabs mode.

Tabs rebuild, high level:

- Consumer-written light-DOM markup: a named `[role=tablist]` of `button[role=tab]`, and sibling `[role=tabpanel]` labelled by their tabs. No generated strip.
- A framework-free `bindTabs(root)`: roving tabindex that steps from the focused tab, arrows, Home/End, right-to-left, automatic activation by default and manual as an option, `aria-selected` and `hidden="until-found"` on panels, `tabindex=0` on panels with nothing focusable, a change event, an unbind function.
- No-JS fallback: panels as stacked sections with headings.
- Dev audit: unnamed tablist, tab with no panel, panel not labelled by its tab, non-tab inside the tablist.
- Skins: `line` by default; `segmented` opt-in, pixel-identical to `interop-radio-group="segmented"` through the shared layer.
- Shared layer: frame, anchor-positioned pill with painted fallback, dividers, inset focus ring, forced-colors mapping, `prefers-contrast`, size steps. Tokens named for the shared part, not either component.
- A disambiguation note in the docs: a value or view mode of the same content is a radio group; a different section is tabs.

## Unverified

Chrome 154 stable date; Material 3 and Apple HIG wording (secondary sources); Spectrum 2 page (404); exact screen reader output; Open UI dormancy; the html-aria radio role rule (from memory); whether Carbon's implementation omits `aria-controls`.
