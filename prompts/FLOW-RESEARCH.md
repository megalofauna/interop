# Flow — Research

How the vertical space between blocks of running content is set, and why.
Built as `styles/flow.css`, opted into with `itx-flow`.

## Decision

| Question | Decision |
|---|---|
| Direction | Space above a block, only between direct siblings: `[itx-flow] > * + *` |
| Scope | An opt-in container, `itx-flow`. No global element margins |
| Components | No outer margin. Inside a component, `gap` |
| Units | `--itx-space-*` tokens on the 4px grid. Not `em`: the type scale is fixed, so `em` only produces off-grid values |
| Headings | More space above than below; the space after a heading wins over what the next block asks for. Trimmed with `text-box: trim-both cap alphabetic` |
| Non-text blocks | Tables, figures, code and media 32px either side; hr 48px |

## Where practice has settled

- The browser's block margins are reset away: Comeau
  ([reset](https://www.joshwcomeau.com/css/custom-css-reset/)), Andy Bell,
  Open Props, Bootstrap (top margins only).
- Components carry no outer margin; the parent spaces its children
  ([Stoiber](https://mxstbr.com/thoughts/margin),
  [Braid](https://seek-oss.github.io/braid-design-system/foundations/layout)).
  Stacks use `gap` (Chakra since 2.7, Primer).
- Prose spacing is scoped to a container: Tailwind's `.prose`, GitHub's
  `.markdown-body`, USWDS's `.usa-prose`, Bell's `.flow`.
- Headings take more space above than below (Zell Liew, USWDS 1.5em/1em,
  Tailwind h2 48/24px, GitHub 24/16px).

## Where it still differs

| Question | Camps |
|---|---|
| Direction | Top-only through `* + *`: Every Layout, Bell, USWDS. Bottom-only: Bootstrap, GOV.UK, GitHub, Pico, Tailwind v4's `space-y`. Both sides with collapse: Tailwind Typography |
| Units | `em`: Pickering, Bell, Tailwind, USWDS. `rem`/px: Bootstrap, GitHub. `lh`: WebKit |
| Non-text blocks | Tailwind gives tables, code and media more space (28–32px); GitHub gives them the same 16px and lets their box separate them |

Top-only suits Interop: nothing trails the last block, so no `:last-child`
cleanup and no `margin-trim` (Safari only); light-DOM content does not know
what comes last; and with one side set, margins never collapse unexpectedly.
GOV.UK shows the cost of bottom-only: it adds `padding-top` through sibling
rules to get more space above a heading.

## Sources

- Heydon Pickering, [Axiomatic CSS and Lobotomized Owls](https://alistapart.com/article/axiomatic-css-and-lobotomized-owls/) (2014)
- Every Layout, [The Stack](https://every-layout.dev/layouts/stack/)
- Andy Bell, [My favourite 3 lines of CSS](https://piccalil.li/blog/my-favourite-3-lines-of-css/) (2023)
- Harry Roberts, [Single-direction margin declarations](https://csswizardry.com/2012/06/single-direction-margin-declarations/) (2012)
- Richard Rutter, [Compose to a Vertical Rhythm](https://24ways.org/2006/compose-to-a-vertical-rhythm/) (2006)
- Zell Liew, [Why is vertical rhythm important](https://zellwk.com/blog/wrong-about-vertical-rhythm/) (2016)
- Butterick, [Space between paragraphs](https://practicaltypography.com/space-between-paragraphs.html)
- Josh Comeau, [The Rules of Margin Collapse](https://www.joshwcomeau.com/css/rules-of-margin-collapse/)
- [Tailwind Typography styles](https://raw.githubusercontent.com/tailwindlabs/tailwindcss-typography/main/src/styles.js), [GitHub markdown CSS](https://raw.githubusercontent.com/sindresorhus/github-markdown-css/main/github-markdown.css)
- [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide) (`space-y` change)
- WCAG 2.2 [1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html): no constraint on the values; content must not clip when users add spacing
- `text-box`: Chrome 133, Safari 18.2, Firefox 154 ([Chrome](https://developer.chrome.com/blog/css-text-box-trim), [MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/154))

Not checked at the source: Rutter's and Latin's books, Kevin Powell's flow
pattern, GOV.UK's pixel values, Tailwind's `not-prose`.
