# Tabs — Mental Model Card

Tabs show one of several sections at a time. The consumer writes the markup
inside `<interop-tabs>`; importing `interop/tabs` defines the element, which
calls `bindTabs()` on itself. CSS draws it. It works the same in any framework
or none. Research: [prompts/TABS-RESEARCH.md](../../prompts/TABS-RESEARCH.md),
[prompts/TABS-SEGMENTED-RELATIONSHIP.md](../../prompts/TABS-SEGMENTED-RELATIONSHIP.md).

```html
<interop-tabs>
  <div role="tablist" aria-label="Station systems">
    <button type="button" role="tab" aria-controls="nav" aria-selected="true">Navigation</button>
    <button type="button" role="tab" aria-controls="eng" aria-selected="false" tabindex="-1">Engineering</button>
  </div>
  <section role="tabpanel" id="nav">…</section>
  <section role="tabpanel" id="eng" hidden="until-found">…</section>
</interop-tabs>
```

```ts
import "interop/tabs"; // once, anywhere: defines <interop-tabs>
```

Use tabs to show a different section. To choose a value or a view of the same
content, use the segmented control (`interop-radio-group="segmented"`). They can
look the same; they announce differently.

## Files

```
projects/interop/tabs/
  interop-tabs.structure.css   tabs, panels, vertical layout; names list at the top
  interop-tabs.base.css        token values and size steps
  tabs.ts                      InteropTabsElement, defined as <interop-tabs> on import
  public-api.ts                exports InteropTabsElement
projects/interop/src/bind-tabs.ts      the behavior, framework-free
projects/interop/styles/segmented.css  the segmented look, shared with the radio group
projects/interop/styles/underscore.css the rule and bar, shared with the page nav
```

The demo page is `projects/demo/src/app/components/tabs/`.

## Markup

| Element | Requirement |
|---|---|
| Wrapper | `<interop-tabs>`, holding the tab list and the panels. It has no role: ARIA has none for a tab list and its panels together, and the markup inside carries every role, so it reads right before the element upgrades. `itx-size`, `itx-variant`, `itx-activation` and `itx-hash` go here |
| Tab list | `[role="tablist"]`, a direct child of the wrapper, named with `aria-label` or `aria-labelledby`. It owns only tabs |
| Tab | `button[role="tab"]`, a direct child of the tab list, with `aria-controls` naming its panel. Mark the selected one `aria-selected="true"` |
| Panel | `[role="tabpanel"]` with an `id`, a direct child of the wrapper. **Required:** write `hidden="until-found"` on every panel but the selected one, so the page renders right before the element runs. In a framework's loop, bind it from the first index (`[attr.hidden]="first ? null : 'until-found'"` in Angular); the framework writes it again only when the first item changes. The dev audit flags markup that left a panel without it, even after the tabs have bound |

Tabs pair with panels through `aria-controls` only, never by order, so control
flow cannot misalign them. The consumer owns the buttons: icons, badges and
tooltips work as anywhere else. Actions go in a toolbar beside the tab list,
never inside it.

## Behavior: `bindTabs(root, { activation, hash })`

| Concern | Behavior |
|---|---|
| Selection | Exactly one tab selected: on bind, the one the markup marked, or the first enabled. After that the helper holds the selection itself. It holds the tab list's only tab stop |
| Panels | The selected panel shows. The others are `hidden="until-found"`; find-in-page fires `beforematch`, which selects the panel's tab |
| Keys | Arrows by `aria-orientation` and writing direction, wrapping; Home and End; disabled tabs skipped; keys with a modifier left alone |
| Activation | `automatic` (default) selects on arrow. `manual` moves focus; the button's click on Enter or Space selects |
| Focus | State is written before focus moves. Leaving the tab list returns its tab stop to the selected tab |
| Wiring | Fills in a missing tab `id` and panel `aria-labelledby`. Panels are found by `id` in the document or shadow root that holds the tabs. The shown panel gets `tabindex="0"` when nothing in it is focusable, marked `data-tabs-reachable` so a later binding, after a move or a changed attribute, can remove it. A hidden panel is never a tab stop: a consumer's `tabindex` on it waits in `data-tabs-tabindex` and comes back when the panel shows. Attributes are written only when their value changes |
| Change | `interop-tabs-change` on the tab list, detail `{ tab, panel }`, when the selection changes. Not on bind |
| Removal | A `MutationObserver` reconciles at once when a tab, tab list or panel is added or removed, or the tab list changes. A removed selected tab passes the selection to a neighbor. A tab inserted already marked `aria-selected="true"` takes the selection, as streamed or rendered markup chose it; a tab already in place carries only what the helper wrote, so its attribute is not read as a choice. A change inside the shown panel's content rechecks whether that panel needs to be a tab stop, at most once a frame, and only when the helper owns its `tabindex`; the check reads layout, and looks at the first focusable candidate before collecting the rest. Changes inside hidden panels, and inside a tab's own content, do nothing. Measured: content changes cost the same bound as unbound, within a quarter of a millisecond a frame, in Chromium and WebKit |
| Hash | With `hash: true`, the tab whose panel matches the URL fragment is selected on bind and on `hashchange`. It never writes the URL |

The helper only sets attributes. It never inserts or moves nodes, so a
framework's renderer, control flow and hydration keep the DOM.

### What the helper owns and what it follows

| | Attributes | Who writes them |
|---|---|---|
| Inputs, which the helper watches | Tabs and panels added or removed; a tab's `disabled`, `hidden`, `aria-controls` and `id`; a panel's `id`. The markup's `aria-selected` and `hidden` as first written: on bind, and on a tab inserted already marked selected | The author or framework |
| Outputs, which the helper owns | `aria-selected` and `tabindex` on tabs; `hidden` and `tabindex` on panels | The helper, from its state. It does not watch them: a write by anyone else is out of contract, and the dev audit reports the result (`tabs-selected`, `tabs-panel-hidden`). Watching them to write them back would let two writers fight forever |
| Choosing from code | `select(tab)` on the element, or on the binding `bindTabs()` returns; the element also takes a panel id | Code that changes the selection. It fires `interop-tabs-change` |

The state is the selected tab and the tab holding the tab stop, which under
manual activation follows focus, and a structural change leaves it there. Every
output is derived from those two and written only when it differs, and each
panel is decided once per pass, so two tabs sharing a panel cannot undo each
other (sharing is still out of contract; the audit flags it as
`tabs-panel-shared`). A disabled or hidden tab cannot be chosen: when the
selected tab becomes one, or is removed, the selection passes to the next
available tab after it, else the one before. Changing a tab's `aria-controls`
shows the new panel and hides the old one; any panel no tab controls any more
is hidden again. A panel's `aria-labelledby` written by the helper is marked
`data-tabs-labelledby` and follows its tab's `id`. With `itx-hash`, the fragment
chooses on the element's first bind only.

Follow the selection through the event, and change it with `select()`. A
framework template writes `hidden` on panels from a value that does not change
after the first render (the panel shown at first), so it writes it once and the
helper owns it after that. A template that binds from the first index rewrites
`hidden` when the first item is removed. `bindTabs()` called again on a bound
root returns the same binding.

The element binds in `connectedCallback` and unbinds in `disconnectedCallback`,
so markup parsed, rendered by a framework or set with `innerHTML` binds itself.
On unbind the listeners and observer go, and so does the helper's own panel
`tabindex`; the selection, ids, `aria-labelledby` and a consumer's `tabindex`
parked on a hidden panel stay, so a later binding picks them up. A changed `itx-activation` or
`itx-hash` rebinds. A `moveBefore()` move keeps the binding
(`connectedMoveCallback`); other moves disconnect and connect, which rebinds. A framework that inserts the element before its children
gets them bound one microtask later, through the helper's own observer, before
the next paint. Angular needs `CUSTOM_ELEMENTS_SCHEMA` in a component that uses
the element. Importing `interop/tabs` is a side effect, so `package.json` lists
the entry under `sideEffects`; without it a bundler drops the import.

## Look

| Variant | Look |
|---|---|
| default | The underscore look from `styles/underscore.css`, shared with the page nav: the tab list sits on a rule; the selected tab carries a bar on it |
| `itx-variant="segmented"` | The segmented look from `styles/segmented.css`: frame, pill, dividers. Horizontal only |
| `itx-variant="segmented icon"` | Square segments; name each with visually hidden text |

The element is a grid of two named areas, `tabs` and `panels`, stacked; every
panel sits in the one `panels` area, so the panels overlap and only the shown
one sets the height. `aria-orientation="vertical"` on the tab list puts the two
areas side by side, with the rule and bar on the tab list's inline-end edge.
CSS reads the ARIA attribute directly. A segmented tab list keeps the width of
its segments (`justify-self: start`); the underscore tab list spans the
element.

The tab list scrolls when its tabs overflow. A scroll container clips its
children to its padding box, so the bar sits on the rule rather than over it.

The focus ring sits inside each tab. On a segmented pill it takes the selected
text color.

| Size | Tab height | Text |
|---|---|---|
| `sm` | 32px | `p-sm` |
| default | 40px | `p` |
| `lg` | 56px | `p-lg` |

| Token | Default |
|---|---|
| `--itx-tabs-tab-min-block-size`, `-tab-padding-inline` | `--itx-space-10`, `--itx-space-4` |
| `--itx-tabs-tab-font-size`, `-tab-line-height` | the `p` role |
| `--itx-tabs-tab-color[-hover\|-selected]` | neutral-500/400 (4.73:1, 6.71:1: the content navigation rest color, shared with the page nav), 950/50, 950/50 |
| `--itx-tabs-tab-cursor[-disabled]`, `-tab-opacity-disabled` | default, not-allowed, 0.5 |
| `--itx-tabs-tab-border-radius` | the house radius; the segmented frame grows around it |
| `--itx-tabs-panel-padding-block`, `--itx-tabs-column-gap` | `--itx-space-4`, `--itx-space-6` |

The rule and the bar are the underscore look's, set on the tab list:

| Token | Default |
|---|---|
| `--itx-underscore-bar-size` | 2px; 3px under `prefers-contrast: more`, so it stays thicker than the rule |
| `--itx-underscore-bar-background-color[-hover\|-current]` | transparent, neutral-300/700, neutral-900/50 |
| `--itx-underscore-rule-border-width`, `-rule-border-color` | 1px, neutral-300/700 |

`--itx-underscore-bar-size` is the bar's thickness: its block size, or its
inline size when vertical. It names no single CSS property because the property
changes with orientation. `-current` is the selected tab here, and the current
link in a page nav.

Forced colors paint the selected bar `Highlight` and the hover bar `CanvasText`.

## A hidden panel keeps its box

`hidden="until-found"` hides with `content-visibility: hidden`, not
`display: none`, so find-in-page can reach the content. The panel keeps a box:
its content is skipped, but its own border, padding and background still draw,
and it stays focusable. In the shared `panels` area a hidden panel takes no
height, and `opacity: 0` with `pointer-events: none` hides its box and passes
clicks through; find-in-page still reaches it, and revealing it removes
`hidden` and both rules with it. Checked in Chromium and Playwright WebKit with
panels given a border, padding and background. Outside the element:

- A page's flow-spacing rule (`* + *` margins) gives every hidden panel a
  margin, which stacks into a gap. Skip `[hidden]` in such rules.
- A `tabindex` on a hidden panel makes an invisible tab stop. The helper gives
  `tabindex` only to the shown panel.

The structure file pads only the shown panel for the same reason.

## Dev audit rules

| Rule | Flags |
|---|---|
| `tabs-name` | A tab list with no name. axe does not flag this |
| `tabs-empty` | A tab list with no tabs |
| `tabs-children` | Something other than a tab inside the tab list |
| `tabs-panel` | A tab whose `aria-controls` names no tab panel |
| `tabs-selected` | A tab list without exactly one selected tab |
| `tabs-panel-hidden` | More than one panel showed before the tabs bound: the markup left a panel without `hidden`. The helper records this when it binds, so the rule fires after binding too |

## Tests

- `src/bind-tabs.spec.ts`: keyboard, activation, the tab stop, panels,
  find-in-page, removal, the hash, and that a tab is selected before it takes
  focus, so it is announced as selected.
- `tabs/tabs.spec.ts`: the element on plain DOM: upgrade of inserted HTML, no
  role of its own, find-in-page, manual activation and its rebind, children
  added after connection, unbinding on removal.
- `a11y/a11y.spec.ts`: axe on written markup, inside unselected panels (a
  second pass reveals them, since jsdom hides `hidden="until-found"`), and on
  the minimal markup after `<interop-tabs>` binds it.
- `styles/contrast.spec.ts` (text 4.5:1, selected bar 3:1),
  `target-size.spec.ts`, `radius.spec.ts`, `forced-colors.spec.ts`,
  `motion.spec.ts`, and `src/audit.spec.ts`.

## Not built

- A scrolling variant on `scroll-marker-group: tabs` (Chrome 154 only), for
  plain-text tabs once Firefox or WebKit move.
- A stacked no-JavaScript fallback. The markup carries the initial state, so
  server output is right.

## Spike record

Tabs are the first component built as a custom element (branch
`itx-custom-elements-00`), checked in Chromium in the Angular demo, a plain HTML
page and React 19 (`scripts/browser/`). The entry is 6.3 kB minified, 2.6 kB
gzip, everything it pulls from `interop` included. A version where the element was the tab list
itself, with the panels as siblings, was dropped after review: hidden panels
added gaps in flex and grid parents, the fix painted them over the tabs, late
panels went unobserved, the markup had no tab list role before upgrade, and an
author's own role disabled it. The wrapper has none of those problems; a tab
list and its panels need a role-less parent because ARIA has no role for the
pair.

`npm run test:browser` checks, in Chromium and WebKit and in CI: layout, paint
and clicks with decorated panels, no layout shift at the upgrade with decorated
panels, find-in-page through a text fragment, the Tab order with panels the
author made tab stops, an animation and an opacity transition on panels, a
`[hidden] { display: none !important }` reset, print, tabs inside a shadow root,
React 19 rendering, adding and removing tabs, and server rendering with `@angular/platform-server` followed by hydration, with no
mismatch and the tabs working afterwards (`scripts/browser/`).

In print every panel shows, stacked in order: paper has no tabs to choose
with. The element prints as a block, every panel takes the same spacing, and
the author's own panel styles apply. Printed panels carry no tab name.

On screen a hidden panel's box is emptied (padding, border, margin, minimum
height) and made transparent, without transitions, all `!important`, so neither
author styles nor a transition can show it or shift the layout. One rule with
real specificity, not `:where()`, gives hidden panels back their display under a
`[hidden] { display: none !important }` reset, which Bootstrap ships.

Panels overlap in the shared area only once the element is defined. Before
that, and without JavaScript, they stack: a panel the author left visible, or
one find-in-page reveals, reads in turn rather than over another. The author's
`hidden="until-found"` is what makes the page right before the script runs; with
it, the height before and after the upgrade is the same. Hidden panels' opacity
and pointer events are `!important`, so an author's opacity or an animation on
panels cannot paint a hidden one over the shown one.

The tab list is the wrapper's direct child (`:scope > [role="tablist"]`), so a
tab list nested inside a panel belongs to its own tabs. The dev audit accepts
`presentation` and `none` elements between a tab list and its tabs, as ARIA
does.

Checked by hand in Safari (2026-10-31): find-in-page on a hidden panel's text,
a text-fragment link, the arrow keys and the layout, on the plain page and in the
Angular demo. All pass.

## Why the strip is not generated

Prime's `<interop-tabs>` generated its tab strip from `<interop-tab-panel>`
children (deprecated source:
`projects/interop_deprecated/src/lib/components/interop-tabs/`). A generated
strip cannot carry the consumer's attributes, tooltips or badges, needs
regenerating when control flow changes the panels, and is missing from server
output. Its `ariaLabel` input also named the host `<section>`, making every tab
group a duplicate landmark. Every surveyed design system has the consumer
write the tabs. Do not reintroduce a generated strip.
