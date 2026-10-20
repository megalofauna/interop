# InteropToolbar — Retired

Not rebuilt. Research:
[prompts/TOOLBAR-REVIEW.md](../../prompts/TOOLBAR-REVIEW.md). The deprecated
source is in `projects/interop_deprecated/src/lib/rigs/interop-toolbar/`, with
CSS in `styles/rigs/toolbar.css` and `styles/themes/protocol/rigs/toolbar.css`.

| Prime use | Now |
|---|---|
| Code block Wrap and Copy buttons | Plain `button[interop-button]` |
| Actions beside a tab list | Buttons beside the tab list |
| A named set of related controls | `interop-group`: `role="group"` + a name, no keyboard change |
| One choice from a few (alignment) | `fieldset[interop-radio-group="segmented"]` |

## Why it is not rebuilt

- It announced a toolbar but never managed `tabIndex`, so every item stayed a
  Tab stop. A toolbar's contract is one Tab stop and arrow keys.
- Its arrows took the caret keys from text inputs and did not flip in RTL.
- Its group added arrow keys to a `group`, and re-implemented native radios.
- No use had three or more controls acting on one object.

A toolbar returns when a consumer has three or more controls acting on one
object, such as an editor. The markup is `role="toolbar"`,
`focusgroup="toolbar"` and a name. A fallback helper runs only where
`'focusGroup' in HTMLElement.prototype` is false. Do not put `role="toolbar"`
on one or two buttons, on a page's actions, or on anything without arrow-key
navigation. Do not put native radios inside one: their arrows check each radio
and cannot leave the set.
