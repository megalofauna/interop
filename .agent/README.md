# Interop — Agent Dispatcher

Interop is an Angular 21 component library of standalone, OnPush, signal-based UI components.
Primary working dir: `/Users/christophersalmon/repos/interop`

## Where to look

| Topic | File |
|---|---|
| Architecture, conventions, patterns | [playbook.md](playbook.md) |
| CSS split (structural vs theme) | [css-strategy.md](css-strategy.md) |
| Dialog directive deep-dive | [components/dialog.md](components/dialog.md) |
| Popover directive deep-dive | [components/popover.md](components/popover.md) |
| Stepper component deep-dive | [components/stepper.md](components/stepper.md) |
| Table component deep-dive | [components/table.md](components/table.md) |
| Resizable directive deep-dive | [components/resizable.md](components/resizable.md) |
| Scroll-area component deep-dive | [components/scroll-area.md](components/scroll-area.md) |
| Tooltip component deep-dive | [components/tooltip.md](components/tooltip.md) |
| Indicator component deep-dive | [components/indicator.md](components/indicator.md) |
| Segmented-control deep-dive | [components/segmented-control.md](components/segmented-control.md) |
| Visimorph (faux-control surface) deep-dive | [components/visimorph.md](components/visimorph.md) |
| Collection service deep-dive | [services/collection.md](services/collection.md) |
| Adding a demo page (workflow) | [workflows/new-demo-page.md](workflows/new-demo-page.md) |
| Terminal composite deep-dive | [composites/terminal.md](composites/terminal.md) |
| InlineCode composite deep-dive | [composites/inline-code.md](composites/inline-code.md) |
| CodeBlock composite deep-dive | [composites/code-block.md](composites/code-block.md) |
| Highlighter contract + Shiki adapter | [highlighter.md](highlighter.md) |

## Key paths

```
src/lib/                          library source
  components/                     one dir per component
    public-api.ts                  barrel for each component
  styles/
    components/X.css               structural rules (zero-specificity :where())
    themes/protocol/components/X.css  token values only
  iconsets/                       Tabler outline icons + provideInteropIcons()
src/public-api.ts                 top-level library barrel
projects/demo/src/app/            demo app
  pages/X/                        one page per component
  components/demo-*/              shared demo chrome (nav, section, example, notes)
```

## Build

```
npm run demo     # serve demo (--open)
npm run build    # build library
npm run test     # run tests
```

## Style conventions

- All components: `standalone: true`, `ChangeDetectionStrategy.OnPush`, signal inputs/outputs
- CSS: structural rules in `styles/components/`, values-only in `styles/themes/protocol/components/`
- `:where()` on every selector for zero specificity — consumer overrides always win
- Do NOT put pseudo-elements inside `:where()` — use `:where(selector)::pseudo` instead
