# Toolbar — Research Review

Review of Prime's `InteropToolbar` and `InteropToolbarGroup` in
`projects/interop_deprecated/src/lib/rigs/interop-toolbar/`, run against
[new-component-research.md](new-component-research.md).

## Decision

Retire Prime's toolbar. Build a CSS-only named group, `interop-group`, now.
Build a toolbar only when a consumer has three or more controls acting on one
object. When that happens, the markup is the platform's `focusgroup="toolbar"`,
and a small fallback helper covers browsers without it.

The work separates three things that Prime merged:

| Thing | Markup | Keyboard |
|---|---|---|
| Named group | `<div role="group" aria-label="…">` | Unchanged: every control is a Tab stop |
| Form question | `<fieldset>` + `<legend>` | Unchanged; `disabled` reaches every control inside |
| Toolbar | `<div role="toolbar" focusgroup="toolbar" aria-label="…">` | One Tab stop; arrow keys move between items |

| Prime use | Really | Interop |
|---|---|---|
| Prime code block: Wrap toggle + Copy | One or two independent buttons | Plain `button[interop-button]`. The canonical code block already ships one copy button with no toolbar |
| Prime tabs demo: Refresh, Download beside the tabs | Actions beside a tab list | Buttons beside the tab list; `interop-group` if they need a shared name |
| Group JSDoc: "File Actions" | A named group | `interop-group` |
| Group JSDoc: alignment radios | One choice from three | `fieldset[interop-radio-group="segmented"]` |

No consumer in Prime needs a toolbar.

| Question | Decision |
|---|---|
| Does Prime's toolbar do what it claims? | It sets the role, name and orientation, and moves focus with the arrows, Home and End. It never writes `tabIndex`, so every item stays a Tab stop. A toolbar exists to give one Tab stop |
| Is it the thing its name says? | Partly a toolbar: roles and arrows pass APG; Tab order, RTL, text inputs and re-entry memory fail. The group is three things: a `group`, a `radiogroup` and a radio re-implementation. It also adds arrow keys, which a named group must not do |
| What is each use, really? | Plain buttons, a named group and a segmented radio group. See the table above |
| What does the platform do now? | Chrome 155 ships `focusgroup`: one Tab stop, arrows, Home/End, wrap, memory, RTL, disabled items skipped, an implicit `toolbar` role. Firefox and Safari do not. See §3 |
| What has to exist first? | Button, focus ring and the segmented radio group exist. Only the audit rules and `interop-group` are new. A toolbar later needs an `aria-disabled` button state and the fallback helper |
| Can an invoker replace script? | For what toolbar buttons open: popovers, dialogs, an overflow menu. Never for moving focus between items |
| Accessibility | Five misses, two high. See §1 |
| Complexity | 1,333 lines; about 85 are load-bearing (the arrow handling), and `bindTabs()` already has a better version with RTL. 585 lines (the group and radio utilities) are unexported and unused |
| What carries over | The key model, the arrow-consuming-controls rule, audit rules and a theme lesson. No code. See §6 |

## 0. Names

| Name | Used by |
|---|---|
| group | WAI-ARIA, USWDS (advice for a non-list button group), Web Awesome (`wa-button-group` sets `role="group"`), Base UI `Toolbar.Group`, React Aria `Group` |
| fieldset, legend | HTML |
| toolbar | WAI-ARIA, APG, HTML `focusgroup="toolbar"`, Angular Aria `ngToolbar`, React Aria, Radix, Base UI, Fluent, Material 3, Apple HIG |
| button group | GOV.UK and Carbon (layout only, no role), Web Awesome (`group`), USWDS (a list), Spectrum `ButtonGroup` (no role) |
| action group | Spectrum (`toolbar`, or `radiogroup` with single selection) |
| action bar | Spectrum: a bulk-selection bar |
| segmented | Apple HIG, Material, Carbon ("content switcher"): one choice, radio semantics |

"Button group" means a layout to some systems and a role to others, so Interop
does not use it. The pick is **group** for the named group: it is the ARIA
role and needs no translation. **Toolbar** keeps its ARIA meaning.

## 1. Prime

1,072 lines of TypeScript, 261 of HTML and CSS, two "should create" tests.
`InteropToolbar` (194 lines) extends `InteropToolbarBase` (268).
`InteropToolbarGroup` (342) and `radio-group-utils.ts` (224) are not exported
from `rigs/public-api.ts`, and nothing imports them.

Git history gives no rationale. The files arrive in "first commit", "wtf" and
"Last chaos push". The one reasoned commit, `a0f5f8af` ("fix the toolbar"),
replaced an effect that ran once with `contentChildren("interopToolbarGroup")`.
That string query matches a template reference `#interopToolbarGroup`. No
template in the repo declares one, so the query is always empty and the item
list is still scanned once.

### What held

- The role, the name inputs and a dev warning when both are missing.
- Arrow keys on the orientation axis, Home and End, wrap.
- The group's radio key model matches the APG example: arrows move focus
  without checking, and Space or Enter checks.

### Accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| 1 | Every item is a Tab stop, while screen readers announce a toolbar, whose contract is one Tab stop and arrows | 2.1.1, 4.1.2 | High |
| 2 | A text input inside loses Left, Right, Home and End to the toolbar, so its caret cannot move | 2.1.1 | High |
| 3 | Arrow keys do not flip in RTL | 2.1.1 | Medium |
| 4 | No forced-colors rules; hover and pressed states are background fills only | 1.4.11 | Medium |
| 5 | No `flex-wrap`; a long toolbar overflows at 320px | 1.4.10 | Medium |

### Bugs

1. A toolbar with Wrap and Copy: Tab stops on both buttons. The `.agent/composites/code-block.md:224`
   claim that "the rig handles roving-tabindex" is false.
2. A button added after first render (the code block's `wrapToggle` turning on)
   never joins the arrow order, because of the empty query above.
3. The group and the toolbar both handle the same `keydown`. Neither checks
   `defaultPrevented`, so ArrowRight moves two items.
4. The group calls `setValue(null)` on init (`interop-toolbar-group.ts:251`),
   which unchecks a radio marked `checked` in the markup.
5. Without `[name]`, every radio's `name` is overwritten with a generated one,
   which changes what the form submits.
6. `item.value || item.id || item` renders `[object Object]` for a value of `0`
   or `""`.
7. The group's `MutationObserver` is never disconnected.
8. The toolbar's `disabled` input stops key handling but never sets
   `aria-disabled`, so its disabled CSS never applies.

The two spec files only check that the components construct. Nothing tests
keys, roles, radios or disabled items.

## 2. Evidence

- APG Toolbar: "Use toolbar as a grouping element only if the group contains 3
  or more controls." Avoid controls that need the arrow keys. If unavoidable,
  include only one and put it last.
  <https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/>
- ARIA: a toolbar MUST have a label when a page has more than one.
  `aria-disabled` on a group applies to its focusable descendants in the
  accessibility tree. It does not stop them being operated.
  <https://w3c.github.io/aria/#toolbar>
- WebAIM: toolbar is "reserved for complex application toolbars, not basic
  groups of links or buttons." <https://webaim.org/blog/aria-cause-solution/>
- Higley, on composite widgets: "just about everyone knows how to mash the tab
  key"; composites have "a steeper learning curve." <https://sarahmhigley.com/writing/grids-part1/>
- A toolbar earns its place beside a large focus target, so users do not Tab
  through every control to reach the editor.
  <https://github.com/slab/quill/discussions/4560>
- `aria-label` on a generic `div` is ignored by JAWS 2026, NVDA 2026.1.1 and
  VoiceOver iOS (Matuzović, May 2026). A name needs a role.
  <https://www.matuzo.at/blog/2026/aria-label-generic-elements>
- Fieldset legends: NVDA reads one on entry, JAWS on every input, and VoiceOver
  iOS not at all for inputs. <https://pauljadam.com/demos/fieldsetlegend.html>
  GOV.UK advises against nesting fieldsets, because the end of a group is not
  announced.
  <https://accessibility.blog.gov.uk/2016/07/22/using-the-fieldset-and-legend-elements/>
- `focusgroup` shipped in Chrome 150 after an origin trial in 146–149. Firefox
  is positive. WebKit has no position and raises device independence: macOS
  turns keyboard navigation off by default.
  <https://chromestatus.com/feature/5637601087193088>,
  <https://github.com/WebKit/standards-positions/issues/171>,
  <https://open-ui.org/components/scoped-focusgroup.explainer/>
- Angular Aria and Base UI keep disabled toolbar items focusable by default.
  React Aria demotes a toolbar nested in a toolbar to `group`.

## 3. The platform, checked in Chrome 155.0.8059.80

Headless, no feature flags.

| Feature | Result |
|---|---|
| `focusgroup="toolbar"` on a `div` | Implicit role `toolbar`, `orientation=horizontal`; the name comes from `aria-label` |
| Tab in, arrows, Tab out | One Tab stop. ArrowRight and ArrowLeft move; Tab leaves the group |
| Home, End | Move to the first and last item |
| Native `disabled` item | Skipped by the arrows |
| `aria-disabled="true"` item | Focusable by the arrows |
| `hidden` item | Skipped |
| `wrap` | Wraps both ways; without it, the arrows stop at the ends |
| Memory | On by default: Shift+Tab back in lands on the last focused item |
| Off-axis arrow (ArrowDown in a horizontal group) | No move |
| `dir="rtl"` | ArrowLeft moves to the next item |
| `focusgroup="toolbar block"` | Up and Down move; Left and Right do not. The tree still reports `orientation=horizontal`, so a vertical toolbar needs `aria-orientation="vertical"` |
| Text input inside | Arrows enter it and then move the caret. Tab from the input moves to the next toolbar item, not out of the toolbar |
| Native radios inside | Arrows enter them, then the radios' own arrows take over, checking each in turn. The arrows cannot leave the radios |
| Feature detection | `'focusGroup' in HTMLElement.prototype` is `true`; `'focusgroup'` (lowercase) is `false`. The research source that gave the lowercase test is wrong |
| `role="group"` + `aria-label` | `group "Alignment"` |
| `role="group"` without a name | `group ""` |
| `role="group"` on a `ul` | `group`; the list role and the item count are gone |
| `aria-disabled="true"` on a group | The child button shows `disabled=true` in the tree, stays focusable, and still fires `click` |
| Nested `fieldset` | `group "Checkout"` contains `group "Shipping"` |
| `command`, `interestfor`, anchor positioning, `reading-flow`, scroll-state queries, `text-box` | All supported |

Other browsers, from MDN BCD 8.1.6 (2026-10-15): `focusgroup` is in neither
Firefox nor Safari. Invokers are Baseline (Chrome 135, Firefox 144, Safari
26.2). `reading-flow` and scroll-state queries are Chromium only.

## 4. Prerequisites in Interop

| Piece | Status |
|---|---|
| Focus ring (`styles/outline.css`) | Exists |
| `button[interop-button]` | Exists |
| `fieldset[interop-radio-group="segmented"]` | Exists |
| `focusables()` (`src/focusable.ts`) | Exists |
| Roving keys with RTL (`bindTabs()`) | Exists; the source for a fallback |
| Dev audit (`src/audit.ts`) | Exists; needs group and toolbar rules |
| `interop-group` | New, CSS only |
| `aria-disabled` button state that stays focusable | Needed for a toolbar, not for a group |
| Overflow menu (popover + anchor + container query) | Later, only for a toolbar that needs one |

## 5. Invokers

| Job | Invoker? |
|---|---|
| Open an overflow menu, a popover or a dialog from a toolbar button | Yes: `commandfor` with `toggle-popover` or `show-modal` |
| Close a dialog from a toolbar inside it | Yes: `command="close"` |
| A toolbar button's own action (copy, wrap) | No gain: a custom `--command` still needs a listener on the target |
| Move focus between items, Tab stop, memory | No. `focusgroup` does this natively; the fallback helper elsewhere |

## 6. What carries over

1. The key model for a fallback helper, written as the `focusgroup` attribute's
   vocabulary (`inline`/`block`, `wrap`, `nomemory`). The helper does nothing
   when `'focusGroup' in HTMLElement.prototype`. `bindTabs()` supplies the
   roving and RTL code.
2. The rule for arrow-consuming controls: at most one text input, and it comes
   last. Radios do not go inside a toolbar; a segmented radio group sits beside
   it, or toggle buttons with `aria-pressed` replace the radios.
3. Audit rules: `role="group"` or `role="toolbar"` with no name; `role="group"`
   on an element with its own role (`ul`, `ol`, `nav`, `table`); a toolbar with
   fewer than three controls; `role="toolbar"` with no `focusgroup` and no
   helper; a text input that is not the last toolbar item.
4. Theme lesson: token values that equal their fallback are deleted, and a
   container's button tokens target the button.
5. Corrections: `audit.ts:356` advises "Put actions in a toolbar beside it".
   That is wrong for one or two actions; the advice becomes buttons beside the
   tab list.

Nothing else carries over: not the base class, the group, the radio
re-implementation or the string content query.

## Questions for you

1. **Retire Prime's toolbar and write a retired card?** Recommend yes. No
   consumer needs a toolbar, and the code is wrong where it matters (Tab order).
2. **`interop-group`: which elements?** Recommend `div[interop-group]` with
   `role="group"` and a name the author writes, plus `fieldset[interop-group]`
   for the same layout around a form question. One layout, two semantics. The
   audit warns when the name or the role is missing.
3. **What does `interop-group` look like?** Recommend layout only: an inline
   flex row, `gap` from the existing tokens, `flex-wrap: wrap`, no border, no
   background. A joined "attached buttons" look stays out until a use needs it,
   because the segmented look already covers one-of-many.
4. **Build the toolbar now or wait?** Recommend wait for a consumer of three or
   more controls on one object. When it comes: `focusgroup="toolbar"` +
   `role="toolbar"` + a name in the markup, and a `bindToolbar()` fallback of
   about 40 lines that steps aside in Chromium.
5. **Fix the tabs audit advice now?** Recommend yes, in the `interop-group`
   build: "Move it out of the tab list. Put actions beside it."

## Unverified

- Screen reader announcement of `role="group"` + `aria-label` on VoiceOver iOS
  and TalkBack today; the last matrix is about 2.5 years old.
- Nested-fieldset verbosity in current JAWS and NVDA.
- Whether NVDA switches to focus mode on entering a toolbar.
- `focusgroup` behavior in a real screen reader.
- Material 3 and Apple HIG terminology (pages not read).
- Toolbar-specific positions from Roselli, O'Hara, Watson, Bailey and NN/g:
  none found.
- The contrast of Prime's pressed fill; moot if retired.
