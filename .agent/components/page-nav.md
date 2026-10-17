# Page nav — Mental Model Card

Links to the sections of the page, with the section in view marked. CSS on a
`<nav>` of plain links, in two orientations. The browser decides the current
section; `bindTargetCurrent()` fills what it leaves. Research:
[prompts/PAGE-NAV-REVIEW.md](../../prompts/PAGE-NAV-REVIEW.md).

| Part | What | TS |
|---|---|---|
| `nav[interop-page-nav]` | A sticky bar of links, wearing the underscore look | `bindTargetCurrent()` on its list; the `InteropPageNav` directive in Angular |
| `nav[interop-page-nav][itx-orientation="vertical"] > ul[interop-tree]` | A sticky list in a narrow column; sections nest | Same |

Page nav and tabs are both content navigation. Tabs show one section and hide
the others, and are selected. A page nav shows every section and reports
position. Never make page nav links tabs.

## Files

```
projects/interop/page-nav/
  interop-page-nav.structure.css   sticky, horizontal bar, vertical column; names list at the top
  interop-page-nav.base.css        token values; the root tokens the scroll padding reads
  page-nav.ts                      InteropPageNav directive
  public-api.ts                    exports InteropPageNav
projects/interop/src/bind-target-current.ts   aria-current, fallback, reveal
projects/interop/styles/underscore.css        the rule and bar, shared with tabs
```

The demo page is `projects/demo/src/app/components/page-nav/`.

## Markup

```html
<nav interop-page-nav aria-label="On this page">
  <ul role="list">
    <li><a href="#install">Install</a></li>
    <li><a href="#usage">Usage</a></li>
  </ul>
</nav>

<nav interop-page-nav itx-orientation="vertical" aria-label="On this page">
  <ul interop-tree interop-scroll-area role="list">
    <li><a href="#install">Install</a></li>
    <li><a href="#usage">Usage</a><ul role="list"><li><a href="#options">Options</a></li></ul></li>
  </ul>
</nav>
```

In Angular with `<base href="/">`, a bare `href="#x"` points at the site root.
Use `routerLink="." fragment="x"` and
`withInMemoryScrolling({ anchorScrolling: "enabled" })`.

## Behavior

| Concern | How |
|---|---|
| Scrolling to a section | The link. No script. `scroll-behavior` on the page makes it smooth |
| Current section | `scroll-target-group: auto` on the list; the browser matches `:target-current`. A section is current once its start reaches the top; at the end of the page the last one is |
| Screen readers | `bindTargetCurrent()` sets `aria-current="true"` on the `:target-current` link, read one frame after a scroll, when the browser has updated it. A link with its own `aria-current` keeps it |
| Firefox and Safari | No `:target-current`. The helper picks the last link whose section starts in the top half of the window, or the last at the end of the page. Checked in Chrome with the property off: same results as native |
| Overflowing bar | The helper scrolls the bar, never the page, to show the current link. Honors the bar's `scroll-padding` |
| Sticky | Both orientations. The bar always paints `Canvas`; `@container scroll-state(stuck: top)` adds a shadow once it sticks |
| Under the bar | `:root:has(nav[interop-page-nav]…)` sets `scroll-padding-block-start` to the bar's height plus `--itx-space-4`, so a section starts below it |
| Vertical | `align-self: start` so it can stick in its column; the list scrolls past `--itx-page-nav-max-block-size` |
| Vertical look | Quieter than the site navigation. The page nav restates the tree's tokens for its own tree: 28px rows, no fills, no weight change, links at rest neutral-500/400 (4.73:1 light, 6.71:1 dark, the dimmest that keep 4.5:1) that darken to 950/50 on hover and when current. One rail runs along the whole list and the current link's 2px bar lies over it; nested sections are indented text (`--itx-page-nav-indent`). In forced colors the bar sits beside the rail, so the resting bars cannot cover it |
| Rest color | Links in both orientations rest at neutral-500/400 and darken to 950/50 on hover and when current: the content navigation rest color, shared with tabs |
| Forced colors | The bar's `Highlight` comes from the underscore look or the tree |

`--itx-page-nav-inset-block-start`, `-link-min-block-size` and
`-scroll-padding-block-start` are declared on `:root`, because the page's scroll
padding reads them there. Set the inset on `:root` for a fixed header.

## Audit

| Rule | Fires on |
|---|---|
| `page-nav-name` | `nav[interop-page-nav]` with no name |
| `list-role` | Its `> ul` without `role="list"` |

## Tested

- `bind-target-current.spec.ts` (fallback, stubbed layout), audit specs, axe
  fixture with both orientations, style guards (contrast, target size, forced
  colors).
- Chrome 155, by hand: native tracking at top, middle and end; `aria-current`
  in step with `:target-current`; reveal at 360px; forced colors; stuck bar;
  the fallback path with `scroll-target-group: none`.
- `npm run test:pages`: the page nav page.

Not tested: screen reader output, Firefox and Safari themselves.
