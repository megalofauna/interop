# Scroll Area — Mental Model Card

A scroll area is any element with `interop-scroll-area`: `overflow: auto`,
and an inset shadow at each edge that has content beyond it. CSS draws the
shadows with scroll-driven animations. `bindScrollArea()`, or
`InteropScrollArea` in Angular, makes it reachable from the keyboard and gives
it a role when it has a name.

```html
<h2 id="release-notes">Release notes</h2>
<div interop-scroll-area aria-labelledby="release-notes">…</div>
```

## Files

```
projects/interop/scroll-area/
  interop-scroll-area.structure.css   overflow, the four edge shadows, right-to-left
  interop-scroll-area.base.css        token values
  scroll-area.ts                      InteropScrollArea directive
  public-api.ts
projects/interop/src/bind-scroll-area.ts   bindScrollArea(), framework-free
projects/interop/src/focusable.ts          focusables(), isFocusable()
```

The demo page is `projects/demo/src/app/components/scroll-area/`. The code
block's `<pre>` is a scroll area.

## Shadows

| Concern | How |
|---|---|
| Strength | Each edge has a registered number from 0 to 1, animated on `scroll(self block)` or `scroll(self inline)`. It rises over the first `--itx-scroll-area-shadow-range` of hidden content at that edge and falls over the last |
| Size | One strength sets the offset, the blur and the color mix, so a shadow grows as it darkens. At full strength it reaches `--itx-scroll-area-shadow-size` into the area |
| Layer | Inset box shadows, painted behind the content: they never cover text or a focus ring |
| Right-to-left | `:dir(rtl)` swaps the left and right shadows, since box shadows are physical |
| Support | Inside `@supports (animation-timeline: scroll())`. Firefox shows no shadows; scrolling and focus still work |
| Contrast | The shadow color is the darkest a background gets. In light it stays light enough that every code color keeps 4.5:1 on the code block under it (tested) |

## Behavior: bindScrollArea(element)

| Job | Behavior |
|---|---|
| Keyboard reach | While it overflows and nothing inside can take focus, it gets `tabindex="0"`. Chrome and Firefox do this on their own; Safari does not |
| Something inside can take focus | No `tabindex`: the control is the tab stop, and tabbing to it scrolls it into view. `focusables()` skips content that is hidden, `inert` or disabled, and `tabindex="-1"` |
| Stops overflowing while focused | Keeps `tabindex` until focus leaves, so focus is not lost |
| Author's `tabindex` | Left alone |
| Name | `aria-label` or `aria-labelledby` with no `role` adds `role="group"`, which carries the name without a landmark. Removing the name removes the role. With no name, no role |
| Updates | A `ResizeObserver` on the area and its children, checked in the next animation frame; a `MutationObserver` on content and on `hidden`, `inert`, `disabled`, `tabindex`, `href`, `contenteditable`, `aria-label`, `aria-labelledby`; `focusout` |
| Unbind | The returned function stops observing and removes the `tabindex` and `role` it added |

`InteropScrollArea` (selector `[interop-scroll-area]`) calls
`bindScrollArea()` after the first render and unbinds on destroy.

Focus shows the shared ring from `styles/outline.css`.

| Token | Default |
|---|---|
| `--itx-scroll-area-shadow-color` | black at 12% in light, black at 70% in dark |
| `--itx-scroll-area-shadow-size` | `--itx-space-8` |
| `--itx-scroll-area-shadow-range` | `--itx-space-12` |

## Dev audit rules

None of its own. `code-block-scroll-focusable` flags code in a `<pre>` that scrolls
with no `tabindex`: see [code-block.md](code-block.md).

## Tested

Style guards: code colors at 4.5:1 under the strongest shadow, light and dark;
motion. axe on a named scroll area. `bindScrollArea()` has 7 specs,
`focusables()` and `isFocusable()` 2.

Not recorded: browser runs, screen reader output.

## Not built

Custom scrollbars, a shadow for Firefox, a landmark role.
