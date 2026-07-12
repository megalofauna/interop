# Workflow — Adding a Demo Page

How to add a complete demo page for a component. Captures the full set of files, conventions, and wiring so an agent (or human) can produce a consistent demo without reverse-engineering the existing pages.

## When to use

Whenever a new component lands in `src/lib/components/`, a demo page should accompany it. Existing components that are missing demo coverage follow this same workflow.

## Anatomy of a demo page

Every demo page consists of **3 source files** (page itself) + **2 wiring updates** (route + nav).

```
projects/demo/src/app/pages/<component>/
  <component>-page.ts       Component class (ChangeDetectionStrategy.OnPush, standalone)
  <component>-page.html     Template — header + sections + API tables + notes
  <component>-page.scss     Page-local styles for example layout (NOT for theming the component)
```

```
projects/demo/src/app/app.routes.ts                                 + add the route
projects/demo/src/app/components/demo-nav/demo-nav.ts              + add the nav entry
```

## Standard page structure

The page follows a fixed top-to-bottom rhythm. Every demo page mirrors this so users learn one shape and apply it to all:

1. **Header** — category, title, lead paragraph
2. **Usage** section — practical examples
3. *Optional component-specific sections* — placement, modes, sizes, keyboard, etc.
4. **API — Inputs** section — table of inputs
5. **API — Outputs** section — table of outputs (omit if no outputs)
6. **Notes** section — release/note items

```html
<article class="demo-page">
  <header class="demo-page__header">
    <p class="demo-page__category">Components</p>
    <h1 class="demo-page__title">{Component}</h1>
    <p class="demo-page__lead">One-paragraph description.</p>
  </header>

  <demo-section id="usage" heading="Usage">
    <demo-example label="Basic">...</demo-example>
    <demo-example label="With variant">...</demo-example>
  </demo-section>

  <!-- component-specific sections here -->

  <demo-section id="api-inputs" heading="API — Inputs">
    <interop-table [collection]="apiEntries" [columns]="apiColumns">
      <ng-template itxCell="name" let-entry>...</ng-template>
      <ng-template itxCell="type" let-entry>...</ng-template>
      <ng-template itxCell="default" let-entry>...</ng-template>
    </interop-table>
  </demo-section>

  <demo-section id="api-outputs" heading="API — Outputs">
    <interop-table [collection]="outputEntries" [columns]="outputColumns">...</interop-table>
  </demo-section>

  <demo-section id="notes" heading="Notes">
    <demo-notes [notes]="notes" />
  </demo-section>
</article>
```

## Demo helper components

The demo app provides a small set of layout components that every page composes. Don't reinvent these:

| Selector | Purpose |
|---|---|
| `<demo-section id heading>` | Numbered/anchored content section. Renders a heading with `#anchor` link and a body slot. |
| `<demo-example label>` | A bordered "canvas" for an example. The label appears above; children are the live UI. |
| `<demo-notes [notes]>` | List of typed notes (release / bugfix / breaking / deprecated / note). Pre-styled with icons. |
| `<demo-state>` / `<demo-state-item>` | Side panel within a `<demo-example>` that displays live state (signals, last event, etc.). |
| `<interop-table>` | Used for API tables — collection of `{ name, type, default, description }` entries. |

## Code blocks — required for every `<demo-example>`

Every `<demo-example>` must include a syntax-highlighted code block showing the minimal HTML (and TypeScript where relevant) that produces the example. The code block is projected into the `<demo-example>`'s `select="itx-code-block"` slot and rendered below the live UI.

**Imports required in the page component:**

```typescript
import { computed, inject, resource } from "@angular/core";
import { CodeBlock, type CodeFile } from "interop";
import { HighlightService } from "../../services/highlight.service";
```

Add `CodeBlock` to the component's `imports` array. `HighlightService` is `providedIn: 'root'` — inject it.

**One code string + one resource per example:**

```typescript
private readonly hl = inject(HighlightService);

readonly basicCode = `<interop-foo [bar]="baz" />`;

readonly basicTokens = resource({
  loader: () => this.hl.highlight(this.basicCode, "html"),
});
```

**Template — single language (HTML):**

```html
<demo-example label="Basic">
  <interop-foo [bar]="baz" />
  <itx-code-block language="html" [tokens]="basicTokens.value() ?? null">
    <pre><code [textContent]="basicCode"></code></pre>
  </itx-code-block>
</demo-example>
```

**Template — multi-file (HTML + TypeScript):**

Use the `[files]` input when the example requires TypeScript context (column definitions, signal setup, component class members) to be meaningful:

```typescript
readonly sortFiles = computed<CodeFile[]>(() => [
  { label: "template.html", language: "html",  tokens: this.sortHtmlTokens.value() ?? null },
  { label: "component.ts",  language: "ts",    tokens: this.sortTsTokens.value() ?? null },
]);
```

```html
<demo-example label="Sortable columns">
  <interop-table [collection]="rows" [columns]="cols" itxSort />
  <itx-code-block [files]="sortFiles()" />
</demo-example>
```

**Rules:**
- Code strings must be literal template strings defined on the component class — never computed or dynamic. `HighlightService.highlight()` takes a plain string.
- The code shown must match what the live example actually renders — keep them in sync.
- **Default to `[files]` (multi-tab).** Use single-language `language="html"` only when the template uses no bound properties, or when every bound value is a self-evident literal (a plain string, a boolean flag). If the template binds to *any* TypeScript value a reader couldn't reconstruct — a `TableColumn[]` definition, a data interface, a signal, an event handler — show the TypeScript tab too. The goal is directly transferable code: a developer should be able to copy both tabs and have a working example with no guesswork.
- HTML tab: show only the template markup, trimmed to the minimum needed to reproduce the output.
- TypeScript tab: show the data interface, column/config arrays, signal declarations, and event handlers that make the HTML make sense. Omit imports, boilerplate constructors, and lifecycle hooks.
- Omit import statements from all code snippets; they add noise without adding value.

## Component class shape

```typescript
import { Component, ChangeDetectionStrategy, computed, inject, resource, signal } from "@angular/core";
import {
  /* component imports */
  InteropTable, InteropCellDef, type TableColumn,
} from "src/public-api";
import { CodeBlock, type CodeFile } from "interop";
import { HighlightService } from "../../services/highlight.service";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";

interface ApiEntry {
  component?: string;       // present when documenting multi-directive surfaces
  name: string;
  type: string;
  default: string;
  description: string;
  required?: boolean;
}

@Component({
  selector: "<component>-page",
  standalone: true,
  imports: [
    /* component being demoed */,
    InteropTable, InteropCellDef,
    DemoSection, DemoExample, DemoNotes,
  ],
  templateUrl: "./<component>-page.html",
  styleUrl: "./<component>-page.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <Component>Page {
  apiColumns: TableColumn<ApiEntry>[] = [
    { key: "name", label: "Input" },
    { key: "type", label: "Type" },
    { key: "default", label: "Default" },
    { key: "description", label: "Description" },
  ];

  apiEntries: ApiEntry[] = [
    { name: "...", type: "...", default: "...", description: "..." },
  ];

  outputColumns: TableColumn<ApiEntry>[] = [
    { key: "name", label: "Output" },
    { key: "type", label: "Type" },
    { key: "description", label: "Description" },
  ];

  outputEntries: ApiEntry[] = [];

  notes: DemoNote[] = [
    { type: "release", label: "v0.1.x", title: "...", body: "..." },
    { type: "note", label: "...", body: "..." },
  ];
}
```

## Multi-directive components

When the component surface includes multiple directives (e.g. `[interop-popover]` + `[interop-popover-trigger]` + `[interop-popover-arrow]`), the API table should include a leading `component` (or `directive`) column marked `sticky: true`. Pattern lifted from the stepper demo.

```typescript
apiColumns: TableColumn<ApiEntry>[] = [
  { key: "component", label: "Directive", sticky: true },
  { key: "name", label: "Input" },
  /* ... */
];
```

The sticky leftmost column keeps the directive context visible while horizontally scrolling on narrow viewports.

## Custom cell templates

API tables should always project custom templates for `name`, `type`, and `default` columns so values render as `<code>`. The standard pattern:

```html
<interop-table [collection]="apiEntries" [columns]="apiColumns">
  <ng-template itxCell="name" let-entry>
    <code class="demo-page__api-name">{{ entry.name }}</code>
    @if (entry.required) {
      <span class="demo-page__required">*</span>
    }
  </ng-template>
  <ng-template itxCell="type" let-entry>
    <code class="demo-page__api-type">{{ entry.type }}</code>
  </ng-template>
  <ng-template itxCell="default" let-entry>
    <code class="demo-page__api-default">{{ entry.default }}</code>
  </ng-template>
</interop-table>
```

The demo app's global stylesheet (`projects/demo/src/app/styles/_demo-page.scss`) defines `.demo-page__api-name`, `__api-type`, `__api-default`, `__required`. Use those classes; don't restyle.

## Notes section — types and conventions

`DemoNote` is a discriminated union:

| `type` | Icon | Use for |
|---|---|---|
| `release` | rocket | New version / new component / new feature |
| `bugfix` | bug | Fix announcement |
| `breaking` | bolt | Breaking API change |
| `deprecated` | archive | Deprecation notice |
| `note` | info-circle | General guidance, gotchas, mental-model context |

Each note: `{ type, label, title?, body }`. `label` is short ("v0.1.x", "Performance", "Keyboard contract"). `title` is optional bold heading; `body` is the prose.

## SCSS scope

The page's `.scss` is for **example-page-local layout only** — grids of buttons, alignment of demo rows, spacing of state panels, etc. Never use it to theme the component being demoed. If a token override is needed for a demo, set it as an inline style or via a class on the example container.

```scss
.<component>-page__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--itx-spacing-3);
  align-items: center;
}
```

## Wiring — route + nav

Both updates are needed; one without the other leaves the page either unreachable (no route) or invisible (no nav).

**`projects/demo/src/app/app.routes.ts`** — alphabetical by path within the components group:

```typescript
{
  path: "components/<component>",
  title: "<Component> — Interop",
  loadComponent: () =>
    import("./pages/<component>/<component>-page").then((m) => m.<Component>Page),
},
```

**`projects/demo/src/app/components/demo-nav/demo-nav.ts`** — alphabetical by `label` within the appropriate group (`Components` / `Directives` / `Primitives`):

```typescript
{ label: "<Component>", route: "/components/<component>" },
```

## Verification

After all files exist + wiring is in place:

```bash
npx tsc --noEmit -p tsconfig.json | grep -v "interop-button.spec"   # should be empty
npx ng build demo                                                    # should succeed
```

Then visit `/components/<component>` in the demo app and walk through each example.

## Checklist

- [ ] `<component>-page.ts` exists with the standard imports and structure
- [ ] `<component>-page.html` follows the header → usage → API inputs → API outputs → notes rhythm
- [ ] `<component>-page.scss` exists (even if minimal)
- [ ] Route added in `app.routes.ts`
- [ ] Nav entry added in `demo-nav.ts` (alphabetically placed)
- [ ] At least one `<demo-example>` per major usage variant
- [ ] Every `<demo-example>` has an `<itx-code-block>` with matching code
- [ ] API tables use the standard `name` / `type` / `default` cell templates
- [ ] Notes section includes a `release`-type note and at least one `note`-type for guidance
- [ ] `tsc --noEmit` clean
- [ ] `ng build demo` succeeds
- [ ] Manual smoke test in the browser

## Reference implementations

When in doubt, look at these existing demo pages — they all conform to this workflow:

- `pages/dialog/` — simple two-example page with state panel
- `pages/stepper/` — multi-directive component with `sticky: true` column
- `pages/resizable/` — two examples, multi-section custom layout
- `pages/popover/` — multi-directive, includes a placement grid section
