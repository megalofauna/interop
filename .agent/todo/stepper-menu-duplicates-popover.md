# TODO — the stepper's menu duplicates the popover's surface vocabulary

**Status:** open, diagnosed and measured 2026-08-23. Not started.
**Raised:** while adding the listbox container surface, from the report that
"the popover.css theme file doesn't have any efficacy, either".

## The popover theme is fine

Measured in isolation against the real stylesheet, on both an open
`[popover=manual]` and a bare `[interop-popover]`:

    token --itx-popover-padding      calc(0.25rem * 4)
    rendered padding                 16px
    rendered background-color        oklch(0.202 0.006 250)
    rendered max-width               368px

Its theme block and its structural block carry the identical selector,
`:where([interop-popover])`, and every token the theme declares is read. Nothing
shadows the family: `--itx-popover-*` is declared in exactly one file.

## The consumer repaints it

`styles/components/stepper.css:556`:

```css
:where(.interop-stepper__menu[interop-popover]) {
	padding: var(--itx-stepper-menu-padding, var(--itx-spacing-1));
	background: var(--itx-stepper-menu-background-color);
	border-color: var(--itx-stepper-menu-border-color, transparent);
	border-width: var(--itx-stepper-menu-border-width, …);
	border-style: solid;
	border-radius: var(--itx-stepper-menu-border-radius, var(--itx-radius));
}
```

Five CSS properties re-declared with a parallel `--itx-stepper-menu-*` family.
So editing `popover.css` while looking at the stepper's menu does nothing, and
the popover's own levers are unreachable in the one place the library uses a
popover most visibly.

## Why it matters beyond this component

This is the third instance of one shape, and the other two are already fixed:

| parent | child | how it was wrong |
| --- | --- | --- |
| toolbar | button | set `--itx-button-*` on itself, stopped reaching after the placement sweep |
| segmented-control | indicator | set `--itx-indicator-*` on itself, beaten by the pill's own declaration |
| **stepper** | **popover** | does not configure the child at all — duplicates its vocabulary |

The first two were fixed by having the parent TARGET the child. The third needs
the parent to stop re-declaring properties and set the child's tokens instead:

```css
:where(.interop-stepper__menu[interop-popover]) {
	--itx-popover-padding: …;
	--itx-popover-background: …;
}
```

That deletes the `--itx-stepper-menu-*` family, or reduces it to the values
that genuinely differ from a popover.

## Watch for

Whether any `--itx-stepper-menu-*` token is a real difference rather than a
restatement. `--itx-stepper-menu-max-height: 60vh` against the popover's
`70vh` is a real one; the rest look like duplication. The check that the
listbox work used applies here too — measure the menu before and after and
require it identical, because a contrast sweep will not see a surface painted
twice.
