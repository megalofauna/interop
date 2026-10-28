# Callout — Mental Model Card

A callout sets a short note apart from the text around it: a warning before a
destructive step, a tip, a fact the reader should not miss. It is static and
always visible. Research: [prompts/CALLOUT-REVIEW.md](../../prompts/CALLOUT-REVIEW.md).

For a message that appears after an action, use the [toast](toast.md) or
`announce()`. For a field's error, use the field's error. For a long note a
reader may skip, use `<details>`. For content tangential to the page, `<aside>`.

## Files

```
projects/interop/callout/
  interop-callout.structure.css   panel, status bar, icon, small print; names list at the top
  interop-callout.base.css        token values and status colors
  public-api.ts                   empty: CSS only
```

The demo page is `projects/demo/src/app/components/callout/`.

## Markup

```html
<div interop-callout role="note" itx-color="warning">
  <div>
    <small><svg interop-icon name="tabler-alert-triangle"></svg> Warning</small>
    <p>Deleting a project deletes its runs.</p>
  </div>
</div>
```

- **Author-written.** The role, the icon, the status word, a title and the
  paragraphs are markup. There is no component: a component cannot know the
  heading level.
- **`role="note"`**, always. Never `alert` or `status`: a live region present
  at load is not announced, and one a route inserts interrupts on every visit.
- **`itx-color`**: `info`, `success`, `warning`, `danger`, as on the toast and
  badge. None is a neutral note.
- **Icons**, from Tabler: `tabler-note` (neutral), `tabler-info-circle`,
  `tabler-circle-check`, `tabler-alert-triangle`, `tabler-alert-circle`, the
  toast's set. The icon leads the label, inside `<small>`. Every example
  includes one; a neutral note may leave it out. `drawIcons()` hides it from
  assistive technology.
- **The status word**, the author's choice:
  - visible in small print: `<small><svg …></svg> Warning</small>` as the first
    line. Every reader sees it, in forced colors too.
  - hidden: `<small><svg …></svg><span itx-visually-hidden>Warning:</span></small>`.
    Screen readers hear it; sighted readers rely on the icon, so keep it.
  - a title (`<h2>`–`<h6>`) or a bold lead (`<p><strong>Done:</strong> …`)
    also counts.
- **A title** is a real heading at the level that fits the outline. Point
  `aria-labelledby` at it to name the note: Narrator and TalkBack announce a
  note only when it has a name.
- **No close button.** A callout explains content beside it and stays as long
  as it does. A dismissible message is a notification (toast). The demo page
  says why, with links.

## Look

The toast's panel, without its shadow; `styles/contrast.spec.ts` fails if their
color tokens differ.

- A bordered panel (`neutral-50`/`800`, edge `neutral-500`, 3:1 against the
  page) with the house radius. The status bar is a `::before`, the first flex item: 2px wide
  (`--itx-border-width-strong`, 3px with `prefers-contrast: more`), round-ended,
  in the status color, 8px in from the start edge and stretched to the content,
  so it follows the writing direction.
- The label (`<small>`) is a row: the icon (`--itx-icon-size-sm`) in the status
  color, 3:1 against the panel and the page, then the word at the caption size,
  weight 600, 6px apart (`--itx-callout-label-gap`).
- Text in the body size.
- Children of the content `div` lose their margins and are spaced by a 4px gap.
- `overflow-wrap: anywhere`, so a long URL wraps at 320px.
- Forced colors: the bar takes `CanvasText` (`forced-color-adjust: none`);
  the borders map to one color, and the icon and the status word still tell
  the statuses apart.

## Dev audit rules

| Rule | Flags |
|---|---|
| `callout-role` | `role="alert"` or `role="status"`, or no `role="note"` |
| `callout-status` | An `itx-color` callout with no status word: no text, shown or visually hidden, in its `<small>`, a heading or a leading `<strong>` |
| `callout-icon` | An `itx-color` callout whose status word is only visually hidden and whose label has no icon |

## Tests

- `src/audit.spec.ts`: each rule, and the accepted forms.
- `a11y/a11y.spec.ts`: axe on visible, hidden, titled and neutral callouts.
- `styles/contrast.spec.ts`: text 4.5:1 on the panel, edge 3:1 against the
  page, status bars and icons 3:1 against the panel and the page, and the
  toast's colors.
- Chrome 155, on the demo: `note "Before you export"` from `aria-labelledby`
  with the heading kept in the outline; forced colors keep the icons and words;
  the page checks pass (axe light and dark, 320px, focus rings).
- Not yet tested: screen reader speech (Roselli's 2024 results are the
  evidence), Firefox and Safari.

## Not built

- Dismissal. See above.
- A tinted panel. The toast's neutral panel was chosen so a callout and a toast
  of one status match.

## Prime

Prime's `InteropCallout` was a component with `type` and `heading` inputs. Its
status was color only, all statuses looked identical in forced colors, its
heading was a `<strong>` set smaller than the body, it drew nothing outside
`[interop-root]`, and its one consumer wrapped intro prose. Do not reintroduce
the component, the `heading` input, a tint as the only status cue, or a
`role="alert"` option.
