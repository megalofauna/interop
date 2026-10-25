# App shell — Recipe Card

An app's primary navigation: a sidebar when its container is wide enough, and
behind a Menu button when it is not. It is a recipe, not a component: a grid and
a container query over platform elements and existing Interop pieces. The demo
app's own shell (`projects/demo/src/app/app.html` and `app.css`) is the example,
in the drawer mode.

## Two modes, one wide layout

| | Disclosure (default) | Drawer |
|---|---|---|
| Narrow | The navigation opens in the page and pushes the content down | It slides over the page, with a backdrop |
| Built from | `<details>` with `<summary interop-button>` | `<nav popover interop-popover="drawer">` and a `command="toggle-popover"` button |
| Script | None | `bindDrawer()`, or `InteropDrawer` |
| Wide | The summary hides and `::details-content` shows the nav | The closed popover is shown in place: the browser hides a closed popover only with `display: none` |

Both announce the button as "Menu, button, collapsed" or "expanded" with no ARIA
written by hand.

## Layout

- The app's root is the size container: `container: shell / inline-size`. The
  layout follows the space the app has, not the window.
- A grid on a child of the container. A container query cannot style the
  container itself.
- One column narrow; from 48rem, a 16rem navigation column beside the main
  column. A container query's size cannot come from a custom property, so 48rem
  is written once, in the query.
- `main` gets `min-inline-size: 0`, so wide content cannot widen the grid.
- The content is at most 80rem wide, centered. The gutter is
  `max(0px, (100cqi - 80rem) / 2)`: container units, so it follows the app's
  width, not the window. Wide, the grid has a gutter column either side of the
  nav and main columns. The header and footer span all four columns, so their
  rules run edge to edge, and add the gutter to their inline padding, so their
  contents line up with the columns. No wrapper element.

## Drawer details

- An open drawer is in the top layer. When the sidebar shows in the page, the
  demo closes it with a `matchMedia` listener at the same width.
- Following a link closes it; tabbing out closes it; Escape and a click outside
  close it. See [popover.md](popover.md).
- Do not put `autofocus` in the navigation: at wide sizes it is in the page, and
  `autofocus` would take focus on load. `bindDrawer()` moves focus on opening.

## Disclosure details

- `::details-content` is how the nav shows at wide sizes while the disclosure is
  closed. Both rules sit in `@supports selector(::details-content)`, so browsers
  without it keep the summary at wide sizes and the nav can still be opened.
- An open disclosure's summary takes the button's pressed look.
