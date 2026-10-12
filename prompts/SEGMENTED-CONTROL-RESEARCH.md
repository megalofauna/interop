# Segmented control — Research Review

Review of Prime's `InteropSegmentedControl` in `projects/interop_deprecated`,
run against [new-component-research.md](new-component-research.md).

## Decision

A segmented control is a radio group with a different skin. It ships as a
variant of the radio group: `fieldset[interop-radio-group="segmented"]` holding
plain labeled radios that share a `name`. It has its own demo page and nav
entry for now, to see whether it earns a separate identity.

| Question | Decision |
|---|---|
| Model | Native radio group |
| Attribute | `interop-radio-group="segmented"`, a variant on the identity attribute |
| Demo | Its own page, "Segmented control" |
| Sizes | `sm`, `md`, `lg`: 32, 40, 48px, matching buttons and fields |
| Home / End | An optional framework-free helper; not native to radios |
| Segments that own panels | The Tabs component, with a segmented skin if needed |
| Look | Carbon's high-contrast Content Switcher: a frame and a strong selected pill, in the same neutral pairs as the other controls |

## 0. Names

**Segmented control**: Apple (UIKit and AppKit), Primer, Spectrum 2, Mantine,
GitLab Pajamas, Chakra. Also known as segmented button (Material 3, eBay),
button toggle group (Angular Material), toggle group (Radix, PatternFly), toggle
button group (React Aria, Android), content switcher (Carbon), segment group
(Ark), segmented (Ant), SelectorBar (WinUI). Source:
[component.gallery](https://component.gallery/components/segmented-control).

## 1. Prime's rationale, tested

Prime's whole argument, from its card (commit `24609ad4`): "A segmented control
is a stateful command group, not a form input. `aria-pressed` on buttons matches
the OS-native segmented control. Radios would announce as a separate value
control, semantically wrong for view-mode toggles." No recorded weighing of
alternatives exists in git, `prompts/` or `.agent/`. Prime's own dev warning
recommends "a `<select>` or radio group" past five segments, and every demo use
sets a value.

| Claim | Finding |
|---|---|
| Matches the OS-native control | macOS names select-one mode "radio button" mode, with Finder's view switcher as the example, and calls the control "a compact alternative to a group of radio buttons" ([Apple](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/SegmentedControl/Articles/SegmentedControlBasics.html)). It is reported as `AXRadioGroup`/`AXRadioButton` ([third party](https://github.com/egoist/mygo/pull/43), unverified). iOS VoiceOver speaks "n of m" for segments ([Apple forums](https://developer.apple.com/forums/thread/676197)). Android's `MaterialButtonToggleGroup` reports `RadioButton` children in single-selection mode ([source](https://raw.githubusercontent.com/material-components/material-components-android/master/lib/java/com/google/android/material/button/MaterialButtonToggleGroup.java)). No platform exposes an exclusive segmented control as pressed toggles |
| A command group, not a form input | The command version is NSSegmentedControl's momentary mode, which holds no selection. A view switcher holds one value: a radio group. Form participation does not decide the role |
| Radios would be wrong | APG's toolbar example models an exclusive alignment set as `radiogroup`, and uses `aria-pressed` only for independent toggles ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/)) |
| Arrows move focus and select | That is the radio contract on toggle-button semantics. A fieldset is not a composite widget, so nothing announces the arrow keys |
| Avoids Angular Material's regression | Angular Material now uses roving tabindex with arrows that select |

### What other systems ship

| Library | Single-select model |
|---|---|
| Angular Material | `radiogroup`/`radio` since [#28548](https://github.com/angular/components/pull/28548) (2024), fixing [#15004](https://github.com/angular/components/issues/15004) |
| React Aria / Spectrum 2 | `radiogroup`/`radio` |
| Radix ToggleGroup | `radiogroup`/`radio` since [#1118](https://github.com/radix-ui/primitives/pull/1118) |
| Ark / Chakra, Mantine, Ant, Shoelace | Radio, most with native inputs |
| Carbon Content Switcher | `tablist` ([Carbon](https://carbondesignsystem.com/components/content-switcher/accessibility/)) |
| Primer, Pajamas, MUI, Base UI | `aria-pressed` buttons; Base UI disputed in [#3525](https://github.com/mui/base-ui/issues/3525) |

Every system that revisited the question moved to radio semantics.

## 2. Prime's accessibility misses

| # | Issue | WCAG | Severity |
|---|---|---|---|
| S1 | Dark mode: selected label on the pill about 1:1. The indicator's own theme beats the control's override; the fix is on an unmerged branch | 1.4.3 | Critical (derived from the cascade) |
| S2 | Light mode: pill against the page about 1.2:1 | 1.4.11 | High |
| S3 | Exclusive choice exposed as independent toggles; no set size; cannot un-press | 4.1.2 | High |
| S4 | Disabled segment not exposed (no `disabled`, no `aria-disabled`) | 4.1.2 | High |
| S5 | Disabled group not dimmed, and arrow keys still change its value | 4.1.2 | High |
| S6 | No forced-colors rules; selected and unselected look the same | 1.4.11 | High |
| S7 | Arrow keys inverted in right-to-left | 2.1.1 | Medium |
| S8 | Focus ring lost under `prefers-contrast: more` | 2.4.7 | Medium |
| S9 | Focus moves before `aria-pressed` updates | 4.1.2 | Medium |
| S10 | Index-based rover can fall off the list, leaving no tab stop | 2.1.1 | Medium |
| S11 | Icon segments named only after JS runs | 4.1.2 | Medium |
| S12 | Arrow keys swallowed with modifiers | — | Low |
| S13 | `md` measures about 50px, not 40 | — | Low |

## 3. Removed

The two components, the DI token and interfaces, `contentChildren` and its
`ready` workaround, the index-based rover, the controlled/uncontrolled hybrid
(three sources of truth), the `<interop-indicator>` element, the managed radii,
and most of 47 tokens. About 1,300 lines.

## 4. Carried over

The anchor-positioned sliding pill with a painted fallback, Carbon's
proportions, equal-width segments, no-wrap labels, dividers between unselected
segments, square icon segments, exact 32/40/48 heights, and the inset focus
ring.

Native radios do not provide Home/End or a re-fire on clicking the checked
segment. Home/End is an optional helper; re-fire is dropped.

## 5. Unverified

The macOS AX role mapping (third party), screen reader browse-mode handling of
arrow keys in a fieldset of buttons, and the pill-on-fieldset anchor approach,
which needs a harness in each engine.
