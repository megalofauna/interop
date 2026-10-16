# PageNav — Retired

Not rebuilt as a composite. Research:
[prompts/PAGE-NAV-REVIEW.md](../../prompts/PAGE-NAV-REVIEW.md). The deprecated
source is in `projects/interop_deprecated/src/lib/composites/page-nav/`, with
CSS in `styles/composites/page-nav.css` and
`styles/themes/protocol/composites/page-nav.css`.

| Prime use | Now |
|---|---|
| Horizontal bar, `[sticky]` | `nav[interop-page-nav]`: links that wear the underline look shared with tabs, sticky, with a stuck state from a scroll-state query |
| Vertical sidebar | `nav[interop-page-nav][itx-orientation="vertical"] > ul[interop-tree]` |
| `activeHref` fed by page code | `scroll-target-group` and `:target-current`, with `bindTargetCurrent()` for `aria-current` and other engines |

## Why it is not rebuilt

- The browser now decides the current section, and links scroll to fragments
  with no script.
- Its data API (`PageNavLink[]`) rendered markup the consumer can write.
- Its stuck detection and `fade` are CSS now, or dropped.

Do not make page-nav links tabs. Tabs hide content and are selected; a page
nav shows everything and reports position.
