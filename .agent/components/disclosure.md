# Disclosure — Mental Model Card

A disclosure shows and hides the content after its summary. It is the native
`<details>`, styled, with no script. Several in a row are the accordion
pattern. Research: [prompts/EXPANSION-PANEL-REVIEW.md](../../prompts/EXPANSION-PANEL-REVIEW.md).

For content most readers need, use a page with headings. For a few views of
one thing, use [tabs](tabs.md). For a menu, a popover; for a dialog, a dialog.

## Files

```
projects/interop/disclosure/
  interop-disclosure.structure.css   summary row, content, height animation, row look; names list at the top
  interop-disclosure.base.css        token values, the row
  public-api.ts                      empty: CSS only
projects/interop/styles/disclosure.css   the chevron, shared with the tree
```

The demo pages are `components/disclosure/` and `patterns/accordion/`.

## Markup

```html
<details interop-disclosure>
  <summary>Why can I set bounds in two places?</summary>
  <p>…</p>
</details>

<section aria-labelledby="shipping">
  <h2 id="shipping">Shipping questions</h2>
  <details interop-disclosure="row" name="shipping">
    <summary><h3>When does an order ship?</h3></summary>
    <p>…</p>
  </details>
  …
</section>
```

- **Native.** The browser opens it on click, Enter and Space, exposes the
  expanded state, opens a closed one when find-in-page matches inside it, and,
  for disclosures that share a `name`, keeps one open at a time.
- **The summary is text,** worded as what it shows or as the reader's question.
  A heading inside it is allowed in the accordion pattern; screen reader
  support for it is partial (a11ysupport.io), so the accordion's own heading
  above the stack names the group.
- **Never a role on `summary`:** Safari on macOS then drops its expanded state
  and any heading inside.
- In Angular, bind `[open]` and listen for `(toggle)`. There is no directive.

## Look

- The chevron is the shared disclosure look (`styles/disclosure.css`): a mask
  over the text color, turned 90° when open, mirrored in RTL, `CanvasText` in
  forced colors, its turn on the shared duration.
- Quiet (default): the summary is 24px tall at least (WCAG 2.5.8); the content
  is indented past the chevron.
- `interop-disclosure="row"`: a 40px full-width summary with a 12px inset, a
  hover fill (`neutral-100`/`800`, behind `any-hover`), and a 1px hairline
  (`neutral-200`/`700`) above and below; stacked rows share one hairline. Its
  focus ring is inset, as in the other gapless rows (`styles/outline.css`).
- The summary's first line is centered in its minimum height with padding, so a
  long label wraps and the chevron stays on its first line.
- `::details-content` eases its height from 0 to `auto` (`interpolate-size`) and
  back (`content-visibility` with `allow-discrete`), on the shared duration.
  Chrome 129+ animates; Safari and Firefox open and close at once.
- Children of the content lose their margins and are spaced by a 12px gap.

## Dev audit rules

| Rule | Flags |
|---|---|
| `disclosure-summary` | No `<summary>` as the first child |
| `disclosure-summary-role` | A `role` on the summary |
| `disclosure-summary-control` | A link or control inside the summary |

## Tests

- `src/audit.spec.ts`: each rule, and a text summary, a heading summary and a row.
- `a11y/a11y.spec.ts`: axe on a lone, an open, and a stacked accordion.
- `styles/target-size.spec.ts` (both summary heights), `forced-colors.spec.ts`
  (exempt: the chevron's block is in `styles/disclosure.css`), `motion.spec.ts`,
  `preferences.spec.ts`.
- Chrome 156, on the demo: Enter opens a row and closes the open one in its
  `name` group; Space closes it; the ring is inset; forced colors keep the
  chevron, hairlines and text; the page checks pass on disclosure, accordion,
  flow and tree.
- Playwright WebKit 27.2: `name`, `::details-content` and `:open` work; no
  height animation.
- Not yet tested: screen reader speech for a heading inside a summary; Firefox;
  real Safari; find-in-page opening a closed one; print.

## Not built

- Disabled: a summary that cannot open is text.
- Peek (a clipped preview with "show more"): a different pattern.
- Expand all / collapse all: it needs script and conflicts with `name`.
- Arrow-key movement between summaries: APG lists it as optional.
- A print helper: a closed disclosure is left out of print.

## Prime

Prime's `InteropExpansionPanel` rebuilt `<details>` from a button, a `div` and
two injection tokens. Collapsed content stayed focusable under `aria-hidden`,
`disabled` only dimmed the button, the trigger had no `type="button"` and
submitted forms, a nested panel closed its parent, and find-in-page opened
nothing. Do not reintroduce the button-and-region rebuild, `disabled`, or the
injection tokens.
