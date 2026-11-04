# List — Research Review

Review of Prime's `InteropList` in
`projects/interop_deprecated/src/lib/components/interop-list/`, with its CSS in
`styles/components/list.css` and `styles/themes/protocol/components/list.css`,
run against [new-component-research.md](new-component-research.md).

## Decision

Retire Prime's `InteropList`. It is an Angular renderer for a collection: an
input that takes arrays, signals, observables and promises, `trackBy`, item
templates, an attribute preset and layout axes, around `ul`, `ol` and `dl`. A
framework-free list needs none of that: the author writes the `li` elements.
What it styled is worth keeping, as CSS on native lists:

- Plain lists already work: native `ul`, `ol` and `dl`, spaced by `itx-flow`.
- The enclosed numbers become a CSS-only numbered list on `ol`: the numeral in
  a ring, or reversed out of a filled circle. Unlike Prime's, it keeps the `li`
  a list item, so `start`, `reversed` and `value` give the right numbers.
- An avatar group is its own component, not a list variant. Every design
  system that ships one ships it separately, on top of an avatar. It waits for
  an avatar and a consumer.

| Prime use | Really | Interop |
|---|---|---|
| Demo: unordered and ordered lists from a collection | Plain `ul` and `ol` | Native markup in `[itx-flow]` (`styles/flow.css`) |
| Demo: cargo rows from an item template, numbered by hand with `i + 1` | An ordered list of rich rows | `ol`, with the rows written in it |
| Demo: contained rows (`itx-list="contained"`) | A `ul` with a rule between rows | Not now: no consumer |
| Demo: enclosed markers (`itx-marker="enclosed"`) | An ordered procedure, numbers drawn in circles | The numbered list on `ol`, sharing the steps indicator's look |
| `dl[interop-list]` | Nominal: a collection puts `<li>` in a `<dl>` | Native `dl` in `[itx-flow]` |
| `<interop-list>` element | A `generic` element holding `li`s, `role="list"` only from script | Nothing: use `ul` or `ol` |

The only consumer is Prime's demo page. No other Prime component used it:
chip list, step list, tree, listbox and page nav each wrote their own list, and
each has a canonical replacement already.

| Question | Decision |
|---|---|
| Does it do what it claims? | It renders a collection. Three claims fail: `LayoutCapable` is a decorator that sets a marker nothing reads; `attrsPreset` is computed and never applied; CSS-only `<interop-list>` (which the CSS comment advertises) is a `generic` with orphaned `listitem`s |
| Is it the thing its name says? | The hosts are native lists and the directive leaves their roles alone. But `dl` gets `<li>` children from a collection, and `dt`/`dd` get `role="listitem"` from the semantics directive. The enclosed marker discards `start`, `reversed` and `value` |
| What is each use, really? | Plain lists, one ordered list of rich rows, a ruled list, and an ordered procedure. See the table above |
| What does the platform do now? | `::marker` takes no box, so a circle needs `::before`. In Chrome 156, `counter(list-item)` honors `start` but not `reversed` or `value`; four CSS rules restore both. WebKit 27.2 honors all three. See §3 |
| What has to exist first? | For the numbered list, nothing: flow, the steps indicator, the badge's circular count and the audit exist. For an avatar group: an avatar |
| Can an invoker replace script? | The list has no behavior. An avatar group's "+3" can open a popover with `commandfor`/`command="toggle-popover"`, no script. See §5 |
| Accessibility | Five misses, two medium-high. See §1 |
| Complexity | 788 lines of its own (155 TS, 34 template, 289 spec, 310 CSS), 1,817 more through its dependencies. About 120 lines, all CSS, are load-bearing without Angular |
| What carries over | The enclosed-numeral technique and its reasons, two audit rules, the "spacing inside the item" lesson, the tests Prime never wrote. No TS. See §6 |

## 0. Names

| Name | Used by |
|---|---|
| list (`ul`, `ol`, `li`) | HTML, ARIA (`list`, `listitem`), GOV.UK (`govuk-list`, `--bullet`, `--number`), USWDS (`usa-list`), Carbon (`OrderedList`, `UnorderedList`), Web Awesome (native styles) |
| description list (`dl`) | HTML; ARIA `term` and `definition` |
| process list | USWDS (`usa-process-list`: "step numbers in a circle"), VA |
| step by step navigation | GOV.UK publishing components: numbered, collapsible steps |
| avatar group | Atlassian, Fluent 2, Spectrum 2, MUI |
| avatar stack | Primer |
| facepile | Fluent UI v8 (replaced by AvatarGroup in v9) |

The pick is **list**, the name in HTML, ARIA and every system above. A styled
ordered list is still a list; "process list" names one use of it (USWDS: "high
level steps"), and the circled numbers also suit ranked items and
instructions. The overlapping avatars are an **avatar group**, the name in
three of the four systems that ship one.

## 1. Prime

788 lines in five files: `interop-list.ts` (155), `interop-list.html` (34),
`interop-list.spec.ts` (289), `styles/components/list.css` (215) and the
Protocol theme's `list.css` (95). Through its dependencies it pulls in the
collection resolver (462), `utils/track-by.ts` (165),
`NormalizeSemanticsDirective` (215, a MutationObserver with a 16ms debounce),
the layout directory (632) and the attribute service (343, unused here).

Git history: the collection input dates to the first commit (`cdefcf407`) and
later moved to `interopCollection()`. The enclosed marker came in `57bb5be65`
(2026-07-12) with no commit body; its reasons are in the card ("`::marker`
cannot take a box"). Contained rows and the `~=` selectors came in
`d13ec4463`; spacing moved inside the item in `dcb8581ef`.

### What held

- The hosts are native `ul`, `ol` and `dl`, and the semantics directive never
  adds a role to them.
- The numeral is text and passes 1.4.1 and 1.4.3: the ring numeral is
  `text-quieter` (4.5:1 tier), the filled numeral `role-text` on
  `background-control` (9.69:1 at worst). The ring takes the numeral's color,
  so it passes 1.4.11.
- Logical properties throughout; the marker flips in RTL.
- Forced colors: the ring is forced to CanvasText and stays visible; filled
  becomes the same as the ring, which is acceptable.
- The marker technique is reasoned and written down: why not `::marker`, why
  not `@counter-style`, why the pseudo-element sits outside `:where()`.

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | Every `[interop-list]` gets `list-style: none` and no `role="list"`, so Safari with VoiceOver announces no list. Prime's own chip list adds the role; this does not | 1.3.1 | Medium |
| 2 | The enclosed marker turns the `li` into a flex container and counts with a named counter, so `<ol start="5">`, `reversed` and `<li value>` show 1, 2, 3. The numbers are wrong for everyone, and screen readers read the drawn numerals too | 1.3.1 | Medium-high when used |
| 3 | `<interop-list>` without script is a `generic` with `listitem` children (invalid HTML: `li` belongs in `ol`, `ul` or `menu`) | 1.3.1 | Medium |
| 4 | `dl[interop-list]` with a collection renders `<li>` inside `<dl>`; the semantics directive gives `dt` and `dd` `role="listitem"`, which ARIA in HTML forbids on `dd`. Chrome kept term and definition; other engines untested | 1.3.1 | Medium |
| 5 | Row layout is `flex-wrap: nowrap`, and `--itx-layout-direction` inherits, so a list inside any row-laid ancestor becomes a row that overflows at 320px | 1.4.10 | Medium |

Two more without a criterion: non-interactive rows paint a focus-style
outline on `:active` and a hover fill, which promise an action that is not
there; and the marker centres on a wrapped item's paragraph, not its first
line.

### Bugs

1. `interopLayout="row gap-2"` doubles the gap: `gap` on the list and
   `margin-inline-end` on each item. The comment says "unless a layout gap is
   already in effect"; nothing checks (`list.css:59, 90-93`).
2. `trackBy="auto"` gives duplicate keys for mixed shapes:
   `[{ id: 1 }, { name: "B" }]` tracks as 1 and 1, because the second falls
   back to its index (`utils/track-by.ts:83-90`).
3. `trackByField` is dropped when its value equals the index
   (`track-by.ts:118`), and the documented precedence (field before function)
   is the reverse of the code's (`track-by.ts:160`).
4. The `listItemTemplate` JSDoc example puts an `<li>` in the template, which
   renders `li > li` (`interop-list.ts:94-95`).
5. `getItemText()` shows raw JSON for an object with no `name`, `title` or
   `label`, and "null" for `{ name: null }` (`interop-list.ts:149-153`).
6. A collection that errors or is loading shows an empty list, with no
   `aria-busy` and no message.
7. Roman ordinals (`--itx-list-marker-style: upper-roman`) overflow the fixed
   `2em` circle: "VIII" spills out.
8. Docs drift: the card's colorway stroke and `--itx-list-marker-border` are
   now neutral split tokens; the header names `--itx-list-row-outline-*`, the
   code reads `--itx-list-row-focus-*`; the demo marks `collection` required.

The spec (289 lines) retests the collection resolver, `trackByFn` and
`getItemText`. It never asserts that an `li` renders, and does not cover
templates, static content, roles, `dl` or any CSS. Its host renders the
collection twice (four `li` for two items) and asserts only that an attribute
exists.

## 2. Evidence

- **Safari drops list semantics under `list-style: none`, on purpose.**
  [O'Hara](https://www.scottohara.me/blog/2019/01/12/lists-and-safari.html):
  add `role="list"` and ignore the redundant-role lint. WebKit closed
  [bug 304137](https://bugs.webkit.org/show_bug.cgi?id=304137) on 2026-02-23
  as a duplicate of [122320](https://bugs.webkit.org/show_bug.cgi?id=122320),
  where James Craig calls it "by design based on user feedback". Canonical
  steps, tags, tree and page nav already add the role.
- **Number only when order matters.** GOV.UK uses numbered lists when "the
  order of the items is relevant"
  ([lists](https://design-system.service.gov.uk/styles/lists/)). USWDS's
  [process list](https://designsystem.digital.gov/components/process-list)
  is for high-level steps; a step indicator is for a wizard's current
  position; plain lists for simple sequences. USWDS lets teams turn the
  circles off if testing shows they are not needed.
- **An avatar group is a separate component everywhere it ships**: Primer
  [AvatarStack](https://primer.style/components/avatar-stack), Atlassian
  [AvatarGroup](https://atlassian.design/components/avatar-group/usage), Fluent 2
  [AvatarGroup](https://fluent2.microsoft.design/components/web/react/core/avatargroup/usage),
  Spectrum 2 [AvatarGroup](https://react-spectrum.adobe.com/AvatarGroup).
  Atlassian renders a labelled list, with "N more people" on the overflow;
  Fluent and Spectrum use `role="group"`; Fluent's overflow is a button that
  opens a popover holding a `ul role="list"`. Primer advises it only when
  space is short, not for four or fewer. Fluent and Atlassian show five, the
  fifth slot being "+N".
- **Overlapping avatars and target size.** [Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html):
  "the overlapping area should not be included in the measurement", except
  when the overlapping targets do the same thing. Avatars that each link
  somewhere and overlap fail unless each visible part is 24 by 24. Either the
  group is one target (Primer), or linked avatars spread out (Fluent
  "spread").
- **Description lists** are well supported, VoiceOver the outlier
  ([Roselli, 2025](https://adrianroselli.com/2025/01/updated-brief-note-on-description-list-support.html)).

## 3. The platform, checked in Chrome 156

Chrome 156.0.8078.74, headless, `scripts/cdp/probe.mjs`; numbers read from the
accessibility tree and screenshots. WebKit 27.2 through Playwright 1.64.

| Feature | Result |
|---|---|
| `::marker` with `border`, `background`, `padding` | Ignored; `color` applies. A circle cannot be drawn on the marker |
| `li { display: flex }` or `grid` | The `list-item` counter stops: `<ol start="3">` shows 2, 2, 2 |
| `display: flex list-item` | Invalid (the grammar allows `list-item` only with `flow`/`flow-root`); `block list-item` valid |
| `li` kept a list item, `list-style: none`, `::before { content: counter(list-item) }` | `start` ✓, nesting ✓; `reversed` ✗ (0, −1, −2); `<li value="10">` ✗ (1, 2, 3) |
| `::marker { content: counter(list-item) }` | The same two failures |
| Native markers | `start`, `reversed`, `value` all ✓ |
| Four patch rules (below) | `reversed`, `reversed start="10"`, `value`, `start`, `reversed` with `value`: all ✓ |
| The same rules in WebKit 27.2 | Unchanged correct output (WebKit honors all three natively) |
| `sibling-index()`, `sibling-count()` | Supported |
| Typed `attr()` (`attr(value type(<integer>))`) | Supported |
| `text-box: trim-both cap alphabetic` | Supported |
| `@counter-style` | Supported |
| `counter-reset: reversed(list-item)` | Not supported |
| `interestfor` | Supported |
| Anchor positioning | Supported |
| `ul` with `list-style: none`, no role | Chrome keeps `list` |

The patch rules:

```css
ol[reversed] > li { counter-increment: list-item -1; }
ol[reversed] > li:first-child { counter-set: list-item sibling-count(); }
ol[reversed][start] > li:first-child { counter-set: list-item attr(start type(<integer>)); }
ol > li[value] { counter-set: list-item attr(value type(<integer>)); }
```

Other browsers, from sources: `sibling-count()` Chrome 138, Safari 26.2,
Firefox 154 (Baseline 2026-08-18); `text-box` Chrome 133, Safari 18.2, no
Firefox; typed `attr()` in Firefox and stable Safari unconfirmed;
`counter-reset: reversed()` Firefox 96 only; `interestfor` Chromium only
([web-features](https://web-platform-dx.github.io/web-features-explorer/)).
I found no Chromium bug for `counter(list-item)` ignoring `reversed` and
`value`.

## 4. Prerequisites in Interop

| Piece | Status |
|---|---|
| Running-text list spacing | Exists: `styles/flow.css` spaces lists without a `role` |
| A numeral in a ring, and filled | Exists in `ol[interop-steps]` (future steps ringed, current filled), with its own tokens |
| A count that is a circle for one digit and grows for more | Exists in the badge |
| Dev audit | Exists; no list rules yet |
| Avatar | Missing |
| Tooltip, popover | Exist (`bindTooltip`, `[popover]` CSS) |

## 5. Invokers

| Job | Invoker? |
|---|---|
| Numbering, layout, the circles | No: CSS, no behavior |
| An avatar group's "+3" showing the rest | Yes: `<button commandfor="more" command="toggle-popover">` on a `[popover]` holding a list. Baseline |
| An avatar's name on hover or focus | `interestfor` with `popover="hint"` in Chromium only; the name must already be in the accessible name |

## 6. What carries over

1. The enclosed-numeral technique, with its reasons: `::marker` cannot take a
   box, so the numeral is drawn in `::before`. Changed: the `li` stays a list
   item and the numeral reads `counter(list-item)`, with the four patch
   rules, so the author's `start`, `reversed` and `value` hold.
2. One look with the steps indicator: a ring for the numbered list's default,
   the filled circle for reversed out, from the same values.
3. The badge's sizing: a circle for one digit, a pill that grows for more, so
   "10" and "VIII" fit (Prime's bug 7).
4. The numeral aligned to the item's first line, not centred on a wrapped
   paragraph.
5. Audit rules: a numbered list without `role="list"`; a numbered list on a
   `ul`.
6. "Spacing inside the item" (`dcb8581ef`): if ruled rows return, painted rows
   abut.
7. Tests Prime never had: the drawn numbers for `start`, `reversed`, `value`
   and nesting in Chrome and WebKit, `role="list"`, axe, and the style guards.

Dropped: the collection input, `trackBy`, item templates, `getItemText`,
`NormalizeSemanticsDirective`, `LayoutCapable`, `attrsPreset`, the
`<interop-list>` element, the `--itx-layout-*` axes and contained rows.

## Questions for you

1. **Build the numbered list now?** CSS only, on `ol`, in a ring by default
   and reversed out of a filled circle as a variant, shipping in
   `interop.css`. Recommend yes: you want it, it needs nothing new, and steps
   already proves the look.
2. **Its name?** `ol[interop-list]`, with `interop-list="filled"` for reversed
   out, or a more specific `ol[interop-numbered]`. Recommend
   `ol[interop-list]`: "list" is the name everywhere, and the variant sits on
   the identity attribute by the naming rule. `ul[interop-list]` would mean
   nothing yet, and the audit would say so.
3. **One look with the steps indicator?** The same ring, fill, sizes and
   numeral, each component reading its own tokens set to the same values.
   Recommend yes.
4. **Honor `start`, `reversed` and `value`?** With the four patch rules for
   Chrome's bug, checked in Firefox before shipping; or document them as
   unsupported and let the audit warn. Recommend the rules: the numbers are
   the content.
5. **Optional import or the main bundle?** Recommend the bundle: the rules
   apply only under the attribute, so they cost nothing where unused. Opt-in
   imports (`styles/reset.css`) are for rules that restyle elements nobody
   marked.
6. **The avatar group?** Recommend its own component, not a list variant, and
   later: build an avatar first, when a page needs one. Then the group: a
   labelled `ul role="list"`, overlap by `sibling-index()`, a "+N" button
   opening a popover, and linked avatars only when spread, for 2.5.8.
7. **Contained rows** (Prime's ruled `ul`)? Recommend leaving them out until a
   page needs them.

## Unverified

- Firefox: the patch rules, typed `attr()`, and whether Firefox's native
  `list-item` counter already honors `reversed` and `value` (it is documented
  to).
- Stable Safari: the probes ran in Playwright's WebKit 27.2, not Safari.
- VoiceOver output for the numbered list with `role="list"`.
- Prime's demo on port 1338 was not driven; the audit reproduced its bugs on
  scratch pages in Chrome 156, and I checked the cited source lines for bugs
  1, 2 and the dead `LayoutCapable` and `attrsPreset`.
