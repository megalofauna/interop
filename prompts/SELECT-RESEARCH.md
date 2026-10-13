# Select — Research

Research for `select[interop-select]`, run against
[new-component-research.md](new-component-research.md). It follows
[LISTBOX-REVIEW.md](LISTBOX-REVIEW.md), which found a styled `<select>` the
cheapest listbox Interop can offer. Prime had no select.

## Decision

| Question | Decision |
|---|---|
| Element | A native `<select>`, CSS only |
| Name | `select[interop-select]` |
| Closed look | A field, like a text input: GOV.UK, USWDS and Bootstrap draw it this way. Heights match the button's |
| Text fields | Not built yet. When they are, they match the select's field, with shared values if the two drift |
| Picker look | The popover's tokens, read directly |
| Width | A 12rem minimum, because base-select sizes the field to its chosen option and cannot be told not to |
| `multiple` | Styled, with an advisory audit rule pointing to checkboxes |
| Invokers | None apply |

## 0. Names

| Name | Used by |
|---|---|
| select | HTML; GOV.UK, USWDS, Bootstrap (`.form-select`), Web Awesome, Material, Radix, Base UI |
| drop-down box, list box | HTML's names for its two renderings |
| select-only combobox | APG |
| combo box | Windows |
| pop-up button | Apple. Apple calls a button that shows commands a pull-down button |
| dropdown, dropdown list | Carbon, Fluent, Office |
| picker | Spectrum; Chrome's customizable select calls the list a picker |
| select menu | Primer |

## 1. The platform

Customizable select: `appearance: base-select` on the select and on
`::picker(select)`, `::picker-icon`, `::checkmark`, `:open`,
`<selectedcontent>` inside a first-child `<button>`, `<legend>` in
`<optgroup>`, `<hr>`.

| Browser | Popup | `size`, `multiple` in the page |
|---|---|---|
| Chrome, Edge | 135 | 145; plain clicks toggle in `multiple` (checked in 155) |
| Safari | 27 | No source says |
| Firefox | Behind a pref | Behind a pref |

The browser's base styles differ between engines: Chrome gives a 0.5em radius,
Safari 4px and a shadow. Interop sets every property it relies on.
`field-sizing: content !important` is in the browser's styles and wins over
any author rule.

Sources: the HTML rendering section
(https://html.spec.whatwg.org/multipage/rendering.html#the-select-element-2),
MDN (https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select),
the Chrome blog (https://developer.chrome.com/blog/a-customizable-select),
WebKit's golden rule (https://webkit.org/blog/18117/the-golden-rule-of-customizable-select/),
and the Firefox bug (https://bugzilla.mozilla.org/show_bug.cgi?id=1974787).

## 2. Accessibility

| Concern | Finding | Interop |
|---|---|---|
| Option text | Browsers without base-select keep only text; screen readers read text (WebKit) | Audit rule `select-option-text` |
| `selectedcontent` | A `cloneNode()` copy of the chosen option | Avoid `id`s in options |
| Groups | `label` is shown and named in both layers; in Chrome a group's name is computed once the picker opens | Recommend `label` |
| Multiple | 25.3% task success against 100% for a single select (Higley, https://www.24a11y.com/2019/select-your-poison-part-2/) | Audit rule `select-multiple` |
| Forced colors | Gradients are removed; background fills become Canvas | Native arrow in the classic layer; `Highlight` for the hovered or focused option; the check is text |
| Field edge | WCAG 1.4.11 | Border of 3:1 against the page, tested |
| Reflow | Long options | Option text wraps |
| Target size | WCAG 2.5.8 | Every field and option row is 24px or taller, tested |

## 3. How others style a native select

| System | Arrow | Forced colors | Right-to-left |
|---|---|---|---|
| Bootstrap 5.3 | SVG background, swapped for dark mode | None | RTLCSS build |
| USWDS | SVG background | `appearance: listbox` and no background image | None |
| Pico | SVG background | None | `[dir=rtl]` position |
| GOV.UK | Native | Native | Native |
| Open Props | Native | Native | Native |
| Web Awesome | SVG background, blended | None | None |

None ships base-select styles in the files read. Interop's gradient arrow uses
`currentColor`, so it needs no dark-mode swap, and follows USWDS for forced
colors.

## Unverified

- Safari 27 rendering of `size` and `multiple` with base-select.
- iOS and Android behavior with base-select.
- Screen reader output for options with rich content.
- Carbon, Primer and Office names.
