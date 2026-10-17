# Tabs — Mental Model Card

Tabs show one of several sections at a time. The consumer writes the markup;
`bindTabs()` adds the behavior; CSS draws it. In Angular, the `InteropTabs`
directive calls the helper. Research: [prompts/TABS-RESEARCH.md](../../prompts/TABS-RESEARCH.md),
[prompts/TABS-SEGMENTED-RELATIONSHIP.md](../../prompts/TABS-SEGMENTED-RELATIONSHIP.md).

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

Use tabs to show a different section. To choose a value or a view of the same
content, use the segmented control (`interop-radio-group="segmented"`). They can
look the same; they announce differently.

## Files

```
projects/interop/tabs/
  interop-tabs.structure.css   tabs, panels, vertical layout; names list at the top
  interop-tabs.base.css        token values and size steps
  tabs.ts                      InteropTabs directive
  public-api.ts                exports InteropTabs
projects/interop/src/bind-tabs.ts      the behavior, framework-free
projects/interop/styles/segmented.css  the segmented look, shared with the radio group
projects/interop/styles/underscore.css the rule and bar, shared with the page nav
```

The demo page is `projects/demo/src/app/components/tabs/`.

## Markup

| Element | Requirement |
|---|---|
| Wrapper | `[interop-tabs]`, holding the tab list and the panels. `itx-size` and the variant go here |
| Tab list | `[role="tablist"]`, a direct child of the wrapper, named with `aria-label` or `aria-labelledby`. It owns only tabs |
| Tab | `button[role="tab"]`, a direct child of the tab list, with `aria-controls` naming its panel. Mark the selected one `aria-selected="true"` |
| Panel | `[role="tabpanel"]` with an `id`, a direct child of the wrapper. Write `hidden="until-found"` on every panel but the selected one, so the page renders right before the helper runs |

Tabs pair with panels through `aria-controls` only, never by order, so control
flow cannot misalign them. The consumer owns the buttons: icons, badges and
tooltips work as anywhere else. Actions go in a toolbar beside the tab list,
never inside it.

## Behavior: `bindTabs(root, { activation, hash })`

| Concern | Behavior |
|---|---|
| Selection | Exactly one tab selected: the one marked, or the first enabled. It holds the tab list's only tab stop |
| Panels | The selected panel shows. The others are `hidden="until-found"`; find-in-page fires `beforematch`, which selects the panel's tab |
| Keys | Arrows by `aria-orientation` and writing direction, wrapping; Home and End; disabled tabs skipped; keys with a modifier left alone |
| Activation | `automatic` (default) selects on arrow. `manual` moves focus; the button's click on Enter or Space selects |
| Focus | State is written before focus moves. Leaving the tab list returns its tab stop to the selected tab |
| Wiring | Fills in a missing tab `id` and panel `aria-labelledby`. The shown panel gets `tabindex="0"` when nothing in it is focusable; hidden panels never do. A consumer's `tabindex` is left alone |
| Change | `interop-tabs-change` on the tab list, detail `{ tab, panel }`, when the selection changes. Not on bind |
| Removal | A `MutationObserver` reconciles when tabs or panels are added or removed. A removed selected tab passes the selection to a neighbor |
| Hash | With `hash: true`, the tab whose panel matches the URL fragment is selected on bind and on `hashchange`. It never writes the URL |

The helper only sets attributes. It never inserts or moves nodes, so Angular's
renderer, control flow and hydration keep the DOM. Do not bind `aria-selected`
or `hidden` yourself as well; follow the selection through the event.

The directive selector is `[interop-tabs]`, with inputs `activation` and
`hash`. It binds in `afterRenderEffect`, so it runs only in the browser, and
rebinds when an input changes.

## Look

| Variant | Look |
|---|---|
| default | The underscore look from `styles/underscore.css`, shared with the page nav: the tab list sits on a rule; the selected tab carries a bar on it |
| `interop-tabs="segmented"` | The segmented look from `styles/segmented.css`: frame, pill, dividers. Horizontal only |
| `interop-tabs="segmented icon"` | Square segments; name each with visually hidden text |

`aria-orientation="vertical"` on the tab list stands it beside the panels with
the rule and bar on its inline-end edge. CSS reads the ARIA attribute directly.

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
| `--itx-tabs-tab-border-radius` | the house radius; the nested radius when segmented |
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
`display: none`, so find-in-page can reach the content. The panel keeps a box
of zero height, and that box keeps its margins and stays focusable:

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
| `tabs-panel-hidden` | The panel of an unselected tab is not hidden |

## Tests

- `src/bind-tabs.spec.ts`: keyboard, activation, the tab stop, panels,
  find-in-page, removal, the hash, and that a tab is selected before it takes
  focus, so it is announced as selected.
- `tabs/tabs.spec.ts`: the directive.
- `a11y/a11y.spec.ts`: axe on written markup, inside unselected panels (a
  second pass reveals them, since jsdom hides `hidden="until-found"`), and on
  the minimal markup after `InteropTabs` binds it.
- `styles/contrast.spec.ts` (text 4.5:1, selected bar 3:1),
  `target-size.spec.ts`, `radius.spec.ts`, `forced-colors.spec.ts`,
  `motion.spec.ts`, and `src/audit.spec.ts`.

## Not built

- A scrolling variant on `scroll-marker-group: tabs` (Chrome 154 only), for
  plain-text tabs once Firefox or WebKit move.
- A stacked no-JavaScript fallback. The markup carries the initial state, so
  server output is right.

## Why the strip is not generated

Prime's `<interop-tabs>` generated its tab strip from `<interop-tab-panel>`
children (deprecated source:
`projects/interop_deprecated/src/lib/components/interop-tabs/`). A generated
strip cannot carry the consumer's attributes, tooltips or badges, needs
regenerating when control flow changes the panels, and is missing from server
output. Its `ariaLabel` input also named the host `<section>`, making every tab
group a duplicate landmark. Every surveyed design system has the consumer
write the tabs. Do not reintroduce a generated strip.
