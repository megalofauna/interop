# Tree — Research Review

Review of Prime's `InteropTree` (`ul[interop-tree]`, `li[interop-tree-item]`,
`[interop-tree-toggle]`, `ul[interop-tree-group]`) in
`projects/interop_deprecated`, run against
[new-component-research.md](new-component-research.md).

## Decision

Retire Prime's tree. Rebuild its navigate tier as CSS on native markup: a
nested `<ul>` of links, with `<details>`/`<summary>` for each branch. That
markup needs no script and no ARIA. Chrome gives it list levels, a disclosure
with an expanded state, and find-in-page expansion at every depth. Do not
build the select tier (`role="tree"`) until a product needs hierarchical
selection. Nothing in Prime or canonical uses it today.

| Prime use | Really | Interop |
|---|---|---|
| Demo "Docs nav" (navigate tier) | Site navigation | `nav > ul` of links with `aria-current="page"`; `<details>`/`<summary>` per branch; CSS only |
| Demo "Project files" (select tier) | Hierarchical selection, file-browser style | Not built. When needed: a `bindTree()` built from shared roving-focus, typeahead and selection helpers |
| Principles page snippet | Illustration of the two tiers | The tier rule moves to the dev audit and the docs |

| Question | Decision |
|---|---|
| 1. Does Prime's tree do what it claims? | Partly. The two tiers exist and the roles are right. The claimed "full APG keyboard contract" is missing the multi-select keys, and the claimed checkbox trees are not implemented. A CSS regression draws a focus ring on every item at rest |
| 2. Is it the thing its name says? | The select tier is an APG tree view with gaps. The navigate tier is a nested list with disclosure buttons, which is correct, but it puts `aria-expanded` on `<li>`, which is invalid ARIA |
| 3. What is each use really? | Navigation (`<details>` in nested lists) and a file browser with no product consumer |
| 4. What does the platform do now? | Chrome 155: nested `<details>` gives list levels, disclosure state and find-in-page expansion with no script. `focusgroup` ships but has no tree behavior. No built-in invoker opens a `<details>` |
| 5. What has to exist first? | For the navigate tier: nothing. For a select tier: roving focus, typeahead, a selection model |
| 6. Can an invoker replace script? | For one branch, `<summary>` already does it with no script. "Expand all" needs a custom `--expand-all` and a small listener. Keyboard and selection: no |
| 7. Accessibility | Six misses, three high: the focus ring at rest, no current-page indicator in forced colors, and a twisty that does nothing on a disabled branch |
| 8. Complexity | 1,000 lines of TypeScript and 511 of CSS. The navigate tier needs about 10 lines of that logic (flip `aria-expanded` and `hidden`), and `<details>` replaces those too |
| 9. What carries over | The tier rule, RTL caret handling, the 24px twisty hit area, the narrow-container indent query, test ideas |

## 0. Names

| Name | Used by |
|---|---|
| tree, treeitem, group (roles); "Tree View" (pattern) | WAI-ARIA, APG |
| treegrid | WAI-ARIA; React Aria's `Tree` renders `row`/`gridcell` |
| Tree | Fluent 2, React Aria, Angular Aria (`ngTree`), Angular CDK/Material (`cdk-tree`, `mat-tree`) |
| Tree view / TreeView | Carbon, Ark/Zag, GitHub Primer, React Spectrum S2 |
| `<wa-tree>` | Web Awesome (formerly Shoelace `sl-tree`) |
| Outline view, disclosure triangle | Apple HIG, macOS `NSOutlineView` |
| Side navigation | USWDS (static nested lists) |
| Details, Accordion | GOV.UK (no tree) |
| none | Radix, Base UI |

App-oriented systems ship a "Tree". Content and government systems ship none
and use disclosure and side navigation. Keep "tree" as the name: it is what
people search for, and APG calls the navigation case a "navigation treeview".
Document it with "Also known as: tree view, outline view, nested navigation",
and state that it carries no `role="tree"`.

## 1. Prime

Six TypeScript files, 1,000 lines without the spec, about 200 of them doc
comments. 511 lines of CSS: 420 structural and the protocol theme. 28 tests in
497 lines. It arrived in `0fe78481` ("Itx 12 collapsible tree"). `c956f79e`
was a Carbon visual pass. `bf75191d`, the global focus refactor, introduced
bug 1.

The design rests on one rule, in the card and in `interop-tree.context.ts:16`:
`role="tree"` is a behavior contract. One tab stop, roving focus, typeahead,
and arrows that expand and collapse. Navigation does none of that, so the
navigate tier has no tree roles. The rule is correct, and APG's own navigation
example says the same.

About 300 lines exist only for Angular: the DI context and tokens (94), a
registry that re-sorts items into DOM order (45), the CVA (20), signals and
`model()`. The card also has a section on why nested items must render through
a component and not `ngTemplateOutlet`.

### What held

- Two tiers, with roles only in the select tier.
- The navigate-tier twisty is a real `<button type="button">` with
  `aria-expanded` and `aria-controls` (`interop-tree-toggle.ts:45-81`).
- Select-tier keyboard: Up/Down, Right/Left mirrored in RTL
  (`interop-tree.ts:383`), Home/End, `*`, typeahead with a 500 ms reset, Enter,
  Space. Disabled items stay focusable and refuse selection, as APG asks.
- `hidden="until-found"` on collapsed groups, with `beforematch` turned into a
  real expand (`interop-tree-group.ts:46-58`).
- RTL: the caret is a logical-property border triangle, its rotation mirrors,
  and the rails and accent bar flip.
- A 24px twisty hit area kept apart from the glyph size, and a container query
  that shrinks the indent below 320px.

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | Every `li[interop-tree-item]` draws the focus outline at rest (`tree.css:147-151`). Nested items draw concentric rings. Focus cannot be told apart from rest | 2.4.7 | High |
| 2 | In forced colors, `box-shadow` and gradients compute to `none`. The `aria-current` row loses its tint and bar, and nothing else marks it. The CanvasText rails rule (`tree.css:410-416`) is dead | 1.4.1, 1.4.11 | High |
| 3 | On a disabled branch the twisty `<button>` stays enabled and announces "collapsed", and `open()` returns early (`interop-tree-item.ts:168`, `interop-tree-toggle.ts:89-91`). A control that does nothing | 4.1.2 | High |
| 4 | Navigate tier puts `aria-expanded`, `aria-level` and `aria-disabled` on a plain `<li>` (`interop-tree-item.ts:56-59`). `aria-expanded` is not allowed on `listitem` | 4.1.2 | Medium |
| 5 | Multi-select keys are missing: Shift+Up/Down, Shift+Space, Ctrl+Shift+Home/End, Ctrl+A. Enter in a multi-select tree replaces the whole selection (`interop-tree.ts:360-363`) | 2.1.1 | Medium |
| 6 | Link labels are `nowrap` with an ellipsis (`tree.css:283-290`) and no way to read the full text | 1.4.10 | Medium |

### Bugs

1. The focus ring at rest (miss 1).
2. Programmatic collapse of the focused item's ancestor (`item.close()` or a
   two-way `[expanded]` write) drops focus to `<body>`. `focusedKey` still
   names the hidden item, so it keeps the only `tabindex="0"` and the tree
   leaves the tab order (`interop-tree.ts:197`).
3. Find-in-page inside a disabled branch: the browser removes `hidden`,
   `open()` refuses, and `aria-expanded` stays `false` while the children show.
   Angular never re-applies `hidden`, because the computed value did not change.
4. Ctrl-click to deselect still emits `activated` (`interop-tree.ts:221`).
5. Before first focus the tab stop is the first visible item
   (`interop-tree.ts:196-200`). APG puts it on the selected item.
6. The `@starting-style` fade never runs in the default until-found mode. The
   browser hides until-found content with `content-visibility`, not `display`.
7. `NG_VALUE_ACCESSOR` is provided in both tiers, so `formControlName` on a
   navigate tree binds silently. The CVA has no `setDisabledState`.
8. The JSDoc examples use `<span class="row">`. The CSS styles only
   `[interop-tree-row]`, so the documented markup renders unstyled.
9. The card and `principles/ethos.md:100` promise checkbox trees
   (`indeterminate`, `aria-checked`). None exist.

The spec covers tier roles, levels, expandability, recursive rendering,
until-found with a synthetic `beforematch`, both toggle forms, the main keys,
single and multi selection, `reveal()`, `expandAll()` and `collapseAll()`. It
does not cover the CVA, disabled items, RTL, Space in multi-select, Ctrl-click,
the typeahead reset, the dev warnings, invalid ARIA in the navigate tier, or
focus after a programmatic collapse. It has no axe run and no CSS guard, which
is why bugs 1 and miss 2 shipped.

## 2. Evidence

- **APG navigation treeview**
  ([example](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-navigation/)).
  The example says a correct tree needs "complex functionality that is not
  needed for typical site navigation", and that disclosure fits better.
- **Roselli.** A tree "should not be used for site navigation". The APG demo
  "works poorly for touch and AT users" in human testing
  ([2023](https://adrianroselli.com/2023/05/be-careful-using-menu.html)).
  For navigation he recommends a link plus a disclosure button
  ([2019](https://adrianroselli.com/2019/06/link-disclosure-widget-navigation.html)).
- **Carbon.** Tree view is not for primary navigation, single-level nesting or
  show/hide content
  ([usage](https://carbondesignsystem.com/components/tree-view/usage/)).
- **GitHub (Eric Bailey, 2025-01-28)**
  ([write-up](https://github.blog/engineering/user-experience/considerations-for-making-a-tree-view-component-accessible/)).
  - Roving tabindex beat `aria-activedescendant` in VoiceOver on macOS and iOS.
  - Explicit `aria-level` was needed for screen readers to report depth.
  - Treeitems are not links, so middle-click and Ctrl+Enter had to be
    rebuilt in script.
  - A treeitem supports one action.
- **Screen readers.** NVDA and JAWS switch to focus mode on a tree, so browse
  mode cannot read it. iOS VoiceOver has open expanded/collapsed bugs
  ([284804](https://bugs.webkit.org/show_bug.cgi?id=284804),
  [230408](https://bugs.webkit.org/show_bug.cgi?id=230408)).
- **Touch.** Arrow keys do not exist on touch, so every branch needs a tappable
  toggle. On a phone a tree works only as nested disclosures.

## 3. The platform, checked in Chrome 155.0.8059.40

| Feature | Result |
|---|---|
| Nested `<details>` in `<ul>` | Accessibility tree: `listitem level=1`, `level=2` from nesting alone; `<summary>` is a `DisclosureTriangle` with `expanded=true` when open; collapsed children are absent |
| Tab order through `<details>` nav | Summary, link, nested summary, link. Collapsed content is skipped |
| Find-in-page into a closed nested `<details>` (text fragment) | Both levels open, inner first; `toggle` fires on each |
| `hidden="until-found"` + `beforematch` | `beforematch` fires once, `hidden` clears |
| Full-width row highlight on nested-padding lists | Works with `border-image: conic-gradient(c 0 0) fill 0 // 0 0 0 100vw` under an `overflow: clip` container. No depth number needed (screenshot) |
| Typed `attr()`: `attr(aria-level type(<number>))` | Works: `aria-level="3"` × 10px = 30px |
| `sibling-index()` | `CSS.supports` true |
| `::details-content`, `interpolate-size`, `calc-size()` | Supported |
| `details[name]` | Supported |
| `content-visibility: auto` | Supported |
| `focusgroup="toolbar"` | Works: arrows move between items; one tab stop. Attribute only, no IDL property. No `tree` token |
| `command="toggle"`, `open`, `show`, `hide` | Rejected (`button.command` reads empty); a `<details>` does not open |
| Custom `command="--expand"` targeting `<details>` | `command` event fires on the `<details>` with `--expand` |

Other browsers, from MDN browser-compat-data:

| Feature | Firefox | Safari |
|---|---|---|
| `<details>` opens on find-in-page | 148 (partial 139–147) | 26.2 partial, does not scroll to the match |
| `hidden="until-found"` | 148 | 26.2 partial, same scroll bug ([304174](https://webkit.org/b/304174)) |
| `::details-content` | 143 | 18.4 |
| `interpolate-size` | no | no |
| Typed `attr()` | 155 | Technology Preview |
| Invoker commands | 144 | 26.2 |
| `focusgroup` | not found | not found |

Open UI lists `toggle`, `open` and `close` for `<details>` as future ideas, not
shipped ([explainer](https://open-ui.org/components/future-invokers.explainer)).
No native tree element is proposed.

## 4. Prerequisites in Interop

| Piece | Status |
|---|---|
| Navigation tree: `<details>` styling, caret, indent, full-width rows, `aria-current`, forced colors | Not built. CSS only |
| Disclosure (`<details>` on its own) | Not built. The nav tree's branch styles are the same work |
| Roving focus helper | Not built. `focusgroup` covers flat composites in Chrome only; a tree needs Right/Left hierarchy on top |
| Typeahead helper | Not built. Also needed by listbox, combobox and menu |
| Selection model (single, multiple, range) | Not built. Shared with listbox and grid |
| Tri-state checkbox | `input.indeterminate` and `bindSelectAll()` exist for flat groups |
| Live-region announcer | `src/announce.ts` exists |

## 5. Invokers

| Job | Invoker? |
|---|---|
| Open or close one branch | Not needed. `<summary>` does it with no script and no ARIA |
| Expand all, collapse all | Only as a custom `--expand-all`/`--collapse-all`, with a listener that sets `open` on each `<details>`. Build only if asked for |
| Reveal a branch from outside (deep link) | A text fragment opens it natively. A future `command="open"` would cover a button; not shipped |
| Arrow keys, typeahead, `*`, selection | No. Commands have no keyboard model |
| A parent that is also a page (link + twisty) | `<button command="--toggle">` is declarative, but still needs about 15 lines to flip `aria-expanded` and `hidden` and to sync on `beforematch`. That is a `bind*()`, not zero script |

## 6. What carries over

1. The tier rule: no `role="tree"` for navigation. Enforce it in the dev
   audit:
   - warn on `role="tree"` that contains a link or a form control;
   - warn on `aria-expanded` on an `<li>`.
2. RTL caret: the logical-property border triangle, which survives forced
   colors, and the mirrored rotation (`tree.css:351-372`). On `<details>`,
   style `summary::marker` or replace it with this caret.
3. The 24px twisty hit area separate from the glyph, and the narrow-container
   indent query (`tree.css:382-386`).
4. Selected and current marked by shape as well as tint (the 4px bar), with a
   forced-colors rule for each. Prime only did selected.
5. If a select tier ships:
   - the nearest-scroller scroll helper (`interop-tree.ts:294-315`);
   - the focus-after-collapse rule;
   - the RTL key mirroring;
   - the test list in §1, plus axe and the style guards.
6. Dropped:
   - the DI registry and the CVA;
   - the checkbox claim;
   - the `@starting-style` fade;
   - the rails gradient, which forced colors removes;
   - `--itx-tree-level` as a style binding. Nested padding plus a
     `border-image` bleed gives full-width rows without a depth number.

## Questions for you

1. **Retire Prime's tree and build no select tier now?** Recommend yes. Nothing
   uses the select tier, and its proper build depends on three shared helpers
   that do not exist yet.
2. **Branch shape for the nav tree.** (a) Parents are labels: `<summary>` holds
   the label, and a parent with its own page lists that page as its first
   child. No script. (b) Parents are links with a twisty button beside them,
   handled by a small `bindDisclosure()`. Recommend (a). Add (b) only when a
   real menu needs a parent that is a page.
3. **Name and hook.** Recommend `ul[interop-tree]` on the outer list, CSS only,
   no roles. Document it as a navigation tree, with "Also known as: tree view,
   outline view, nested navigation", and say plainly that it is not
   `role="tree"`.
4. **Build now or wait for a consumer?** The canonical demo nav is a flat list
   in a drawer. Recommend building it now only if you want that nav grouped;
   otherwise wait.
5. **Expand all / collapse all.** Recommend leaving it out until someone asks.
   When asked, add a custom `--expand-all` command and its listener.

Answered 2026-10-14: 1 yes; 2 (a) only; 3 yes; 4 built now, and the demo's
site navigation uses it; 5 open.

## Unverified

- Screen reader output for nested `<details>` in lists (NVDA, JAWS,
  VoiceOver), including whether depth is announced without `aria-level`.
- Forced-colors rendering of the `border-image` row highlight; `summary::marker`
  in forced colors.
- Safari and Firefox behavior of the full-width `border-image` bleed.
- Contrast of Prime's theme values.
- Apple HIG, Material and Radix entries in §0 (from memory).
- Sarah Higley, Scott O'Hara and NN/g positions: none found.
