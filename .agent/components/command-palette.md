# InteropCommandPalette — Retired

Not rebuilt as a component. Research:
[prompts/COMMAND-PALETTE-REVIEW.md](../../prompts/COMMAND-PALETTE-REVIEW.md).
The deprecated source is in
`projects/interop_deprecated/src/lib/components/interop-command-palette/`, with
CSS in `styles/components/command-palette.css` and
`styles/themes/protocol/components/command-palette.css`, and the hotkey in
`directives/interop-hotkey.directive.ts`.

| Prime use | Now |
|---|---|
| Demo ⌘K "Search pages" | `<dialog interop-dialog>` + `<input type="search">` + a `<nav>` of links, filtered by `bindFilter()`, opened by `bindHotkey()` (proposed, not built) |
| Commands that are actions | No consumer. The filtering combobox in [listbox.md](listbox.md), when one is needed |

## Why it is not rebuilt

- Its one use was going to a page, which is a link. Links work with every screen
  reader, on phones, and in a new tab; options in a combobox do not.
- The browser already does the modal, the focus return after a hotkey, and, in
  Chrome 155, the two-stage Escape in a search field.
- Its active option was a fill at about 1.1:1, Enter on open ran a hidden
  command, and `aria-expanded` was true over a hidden list.

Do not reintroduce: the `InteropCollection` adapter, the aside slot, the
`--itx-cmdp-*` tokens, a fill-only active cue, active tracking by index, or a
focus restore that repeats the browser's.
