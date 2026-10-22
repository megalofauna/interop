# Interop — Agent Dispatcher

Interop is an accessibility-first component library: CSS on native elements, small framework-free helpers, and thin Angular 21 directives.
Primary working dir: `/Users/christophersalmon/repos/interop`

## Where to look

The canonical library is `projects/interop`. Prime, the deprecated library, is
`projects/interop_deprecated`; cards whose paths start `src/lib/` describe Prime.

| Topic | File |
|---|---|
| How the library is built: architecture, names, sizes, corners, guards, helpers | [playbook.md](playbook.md) |
| Stylesheets: the two files, selectors, tokens | [css-strategy.md](css-strategy.md) |
| Prose: comments, docs, commit messages | [writing.md](writing.md) |
| Reviewing a Prime component before rebuilding it | [workflows/prime-review.md](workflows/prime-review.md) |

### Components

| Component | Card |
|---|---|
| Badge | [components/badge.md](components/badge.md) |
| Button, invoker, pending action | [components/button.md](components/button.md) |
| Checkbox, radio group, switch, segmented, cards, chips | [components/control.md](components/control.md) |
| Code block | [components/code-block.md](components/code-block.md) |
| Dialog | [components/dialog.md](components/dialog.md) |
| Field: text input, textarea, hint, error, validation, password, count | [components/field.md](components/field.md) |
| Icon | [components/icon.md](components/icon.md) |
| Page nav | [components/page-nav.md](components/page-nav.md) |
| Popover, drawer | [components/popover.md](components/popover.md) |
| App shell recipe | [components/app-shell.md](components/app-shell.md) |
| Scroll area | [components/scroll-area.md](components/scroll-area.md) |
| Select | [components/select.md](components/select.md) |
| Steps: indicator, multi-step form | [components/steps.md](components/steps.md) |
| Table | [components/table.md](components/table.md) |
| Tabs | [components/tabs.md](components/tabs.md) |
| Tags, tag input | [components/tags.md](components/tags.md) |
| Toolbar | [components/toolbar.md](components/toolbar.md) |
| Tooltip | [components/tooltip.md](components/tooltip.md) |
| Tree | [components/tree.md](components/tree.md) |

### Retired Prime components, and why they are not rebuilt

[chip.md](components/chip.md), [listbox.md](components/listbox.md),
[segmented-control.md](components/segmented-control.md),
[stepper.md](components/stepper.md), [visimorph.md](components/visimorph.md).

### Prime components not yet reviewed

[indicator.md](components/indicator.md), [list.md](components/list.md),
[resizable.md](components/resizable.md), [slider.md](components/slider.md),
[toast.md](components/toast.md), and the `composites/` and `services/` cards.
They describe Prime's code. `composites/code-block.md`, `highlighter.md` and
`imports.md` describe Prime's code block, highlighter and icon paths; the
current ones are in [components/code-block.md](components/code-block.md) and
[components/icon.md](components/icon.md).

## Key paths

```
projects/interop/                 the library
  <name>/                         one folder per component, imported as interop/<name>
  styles/                         foundations, shared looks, focus ring, style guards
  src/                            framework-free helpers and the dev audit, imported as interop
  a11y/a11y.spec.ts               axe over every component
  interop.css                     every stylesheet, in order
projects/demo/src/app/            the demo app
  components/<name>/              one page per component
  foundations/                    radius, typography, app shell
scripts/cdp/probe.mjs             checks a page in headless Chrome
```

## Build

```
npm run demo              # serve the demo on port 1337
npx ng build interop      # build the library (npm run build is ambiguous here)
npm run test              # run the library's specs
npm run lint              # prettier, stylelint, token guards
```

## Style conventions

See [css-strategy.md](css-strategy.md) and [playbook.md](playbook.md).
