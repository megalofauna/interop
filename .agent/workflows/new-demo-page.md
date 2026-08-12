# Workflow — Adding a Demo Page

How to add a complete demo page for a component. Captures the full set of files, conventions, and wiring so an agent (or human) can produce a consistent demo without reverse-engineering the existing pages.

## When to use

Whenever a new component lands in `src/lib/components/`, a demo page should accompany it. Existing components that are missing demo coverage follow this same workflow.

## Anatomy of a demo page

Every demo page consists of **3 source files** (page itself) + **2 wiring updates** (route + nav).

```
projects/demo/src/app/pages/<component>/
  <component>-page.ts       Component class (ChangeDetectionStrategy.OnPush, standalone)
  <component>-page.html     Template — masthead + sections + API tables
  <component>-page.scss     Page-local styles for example layout (NOT for theming the component)
```

```
projects/demo/src/app/app.routes.ts                                 + add the route
projects/demo/src/app/components/demo-nav/demo-nav.ts              + add the nav entry
```

## Standard page structure

The page follows a fixed top-to-bottom rhythm. Every demo page mirrors this so users learn one shape and apply it to all:

1. **Masthead** — category, title, lead paragraph
2. **Usage** section — practical examples
3. *Optional component-specific sections* — placement, modes, sizes, keyboard, etc.
4. **CSS tokens** section — the component's public token surface
5. **API** section — one section holding every API table (Inputs, Outputs, Methods…)

```html
<demo-page>
  <demo-masthead category="Components" title="{Component}">
    One-paragraph description.
  </demo-masthead>

  <demo-section id="usage" heading="Usage">
    <p description class="demo-section__lede">What this section is for.</p>
    <demo-example label="Basic">...</demo-example>
    <demo-example label="With variant">...</demo-example>
  </demo-section>

  <!-- component-specific sections here -->

  <demo-section id="tokens" heading="CSS tokens">
    <interop-table [collection]="tokenEntries" [columns]="tokenColumns" [scrollable]="true">
      <ng-template itxCell="property" let-entry>...</ng-template>
      <ng-template itxCell="default" let-entry>...</ng-template>
    </interop-table>
  </demo-section>

  <demo-section id="api" heading="API">
    <h3 class="demo-page__api-heading">Inputs</h3>
    <interop-table [collection]="apiEntries" [columns]="apiColumns">
      <ng-template itxCell="name" let-entry>...</ng-template>
      <ng-template itxCell="type" let-entry>...</ng-template>
      <ng-template itxCell="default" let-entry>...</ng-template>
    </interop-table>

    <h3 class="demo-page__api-heading">Outputs</h3>
    <interop-table [collection]="outputEntries" [columns]="outputColumns">...</interop-table>
  </demo-section>
</demo-page>
```

### Wrap the page in `<demo-page>`, not a bare `<article>`

`<demo-page>` is the shell: it renders the `<article class="demo-page">`, drops
in an `<itx-page-nav>`, and runs the scroll-spy that highlights the current
section. `<demo-section>` registers itself with the enclosing shell on init, so
**the nav builds itself from the sections you already wrote** — no links array
to maintain and no second place for section names to drift.

A section used outside `<demo-page>` still renders; it just injects the
registry optionally and skips registering. That is why a page written with a
bare `<article class="demo-page">` looks fine and silently has no page nav —
the failure is invisible, so check for the nav rather than assuming.

Anchors default to a slug of the heading. Pass `id` explicitly where the anchor
is part of the documented surface (`id="api"`, `id="tokens"`).

### One API section, every table

Inputs and Outputs are one subject, so they get one section and one anchor
(`id="api"`). Split across two `demo-section`s they read as unrelated topics and
consume two slots in the page nav for what is really one destination.

`.demo-page__api-heading` (defined in `styles/_demo-page.scss`) labels each
table. It is deliberately quieter than a `demo-section` heading — it divides a
section rather than starting one. Omit a heading and its table entirely when
the component has nothing for it; don't render an empty table.

Inputs and Outputs are the common pair, but the section takes **whatever tables
the component's surface needs** — tree adds **Methods** for its imperative API
(`reveal()`, `collapseAll()`). Same section, same heading class, one more table.

Note that a `model()` input produces **both** an input and an output. If the
component exposes `foo = model<T>()`, document `foo` under Inputs *and*
`fooChange` under Outputs.

### CSS tokens section

Every component with a public `--itx-*` surface documents it, in its own
section before the API. Two columns — `property` and `default` — both rendered
as `<code>`:

```typescript
type TokenEntry = { property: string; default: string };

tokenEntries: TokenEntry[] = [
  { property: "--itx-foo-height", default: "var(--itx-spacing-8) — 32px" },
];
```

Give the resolved value alongside the token where the token alone says nothing
(`var(--itx-spacing-8) — 32px`, `30 (percent of track, unitless)`). A reader
scanning the table is trying to learn the *size*, not the indirection.

Keep it in sync with the theme file. A token table that lies is worse than no
table, and the drift is invisible — nothing fails when a default changes.

### Attributes are not inputs

A component may configure itself through plain attributes rather than Angular
inputs — `itx-size` on progress, `itx-marker` on list. These have no
`input()` declaration, so they belong in their own **Attributes** table under
the API section, not smuggled into Inputs. Columns match Inputs, with `type`
holding the accepted values (`"sm" | "md"`).

### No trailing Notes section

Demo pages no longer end with a page-level `<demo-section id="notes">`. Don't
add one to a new page, and drop it from pages you touch, along with the `notes`
array that fed it. It is being held for repurposing rather than removed.

**This is about the trailing block only.** `<demo-notes>` used *inside* a
section — a caveat attached to the thing it explains, like tree's "Tab order"
note under the navigate example — is a different tool and stays. The test is
placement, not the component: a note that belongs to a section lives in it, and
a pile of notes with no home was the thing that stopped earning its keep.

## Demo helper components

The demo app provides a small set of layout components that every page composes. Don't reinvent these:

| Selector | Purpose |
|---|---|
| `<demo-page>` | Page shell. Renders the `<article>`, the `<itx-page-nav>`, and the scroll-spy. Sections self-register with it. |
| `<demo-section id heading>` | Numbered/anchored content section. Renders a heading with `#anchor` link and a body slot. |
| `<demo-example label>` | A bordered "canvas" for an example. The label appears above; children are the live UI. |
| `<demo-masthead category title>` | Page header — category eyebrow, title, and a lead paragraph as projected content. |
| `<demo-state>` / `<demo-state-item>` | Side panel within a `<demo-example>` that displays live state (signals, last event, etc.). |
| `<interop-table>` | Used for API tables — collection of `{ name, type, default, description }` entries. |

## Code blocks — required for every `<demo-example>`

Every `<demo-example>` must include a syntax-highlighted code block showing the minimal HTML (and TypeScript where relevant) that produces the example. The code block is projected into the `<demo-example>`'s `select="itx-code-block"` slot and rendered below the live UI.

**Imports required in the page component:**

```typescript
import { CodeBlock, type CodeFile } from "interop";
```

Add `CodeBlock` to the component's `imports` array. Nothing else — `itx-code-block`
tokenizes a raw string itself whenever `language` is set and a highlighter is
registered. Pages do **not** inject `HighlightService` or wrap snippets in
`resource()`; the `[tokens]` input still exists for pre-tokenized content, but a
demo page has no reason to reach for it.

**One code string per example:**

```typescript
readonly basicCode = `<interop-foo [bar]="baz" />`;
```

**Template — single language (HTML):**

```html
<demo-example label="Basic">
  <interop-foo [bar]="baz" />
  <itx-code-block language="html" [code]="basicCode" />
</demo-example>
```

**Template — multi-file (HTML + TypeScript):**

Use the `[files]` input when the example requires TypeScript context (column definitions, signal setup, component class members) to be meaningful. Each file carries its own raw `code`:

```typescript
readonly sortFiles = computed<CodeFile[]>(() => [
  { label: "template.html", language: "html", code: this.sortHtml },
  { label: "component.ts",  language: "ts",   code: this.sortTs },
]);
```

```html
<demo-example label="Sortable columns">
  <interop-table [collection]="rows" [columns]="cols" itxSort />
  <itx-code-block [files]="sortFiles()" />
</demo-example>
```

**Rules:**
- Code strings must be literal template strings defined on the component class — never assembled at runtime from the live example's state. A snippet that can drift from what it documents is worse than no snippet.
- The code shown must match what the live example actually renders — keep them in sync.
- **Default to `[files]` (multi-tab).** Use single-language `language="html"` only when the template uses no bound properties, or when every bound value is a self-evident literal (a plain string, a boolean flag). If the template binds to *any* TypeScript value a reader couldn't reconstruct — a `TableColumn[]` definition, a data interface, a signal, an event handler — show the TypeScript tab too. The goal is directly transferable code: a developer should be able to copy both tabs and have a working example with no guesswork.
- HTML tab: show only the template markup, trimmed to the minimum needed to reproduce the output.
- TypeScript tab: show the data interface, column/config arrays, signal declarations, and event handlers that make the HTML make sense. Omit imports, boilerplate constructors, and lifecycle hooks.
- Omit import statements from all code snippets; they add noise without adding value.

## Component class shape

```typescript
import { Component, ChangeDetectionStrategy, computed, signal } from "@angular/core";
import {
  /* component imports */
  InteropTable, InteropCellDef, type TableColumn,
  CodeBlock, type CodeFile,
} from "interop";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";

interface ApiInputRow {
  component?: string;       // present when documenting multi-directive surfaces
  name: string;
  type: string;
  default: string;
  description: string;
  required?: boolean;
}

interface ApiOutputRow {
  component?: string;
  name: string;
  type: string;
  description: string;
}

@Component({
  selector: "<component>-page",
  standalone: true,
  imports: [
    /* component being demoed */,
    InteropTable, InteropCellDef, CodeBlock,
    DemoPage, DemoSection, DemoExample, DemoMasthead,
  ],
  templateUrl: "./<component>-page.html",
  styleUrl: "./<component>-page.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <Component>Page {
  readonly basicCode = `<interop-foo [bar]="baz" />`;

  apiColumns: TableColumn<ApiInputRow>[] = [
    { key: "name", label: "Input" },
    { key: "type", label: "Type" },
    { key: "default", label: "Default" },
    { key: "description", label: "Description" },
  ];

  apiEntries: ApiInputRow[] = [
    { name: "...", type: "...", default: "...", description: "..." },
  ];

  outputColumns: TableColumn<ApiOutputRow>[] = [
    { key: "name", label: "Output" },
    { key: "type", label: "Type" },
    { key: "description", label: "Description" },
  ];

  outputEntries: ApiOutputRow[] = [];
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
- [ ] `<component>-page.html` is wrapped in `<demo-page>` (bare `<article class="demo-page">` renders fine but has no page nav)
- [ ] `<component>-page.html` follows the masthead → usage → tokens → API rhythm
- [ ] `<component>-page.scss` exists (even if minimal)
- [ ] Route added in `app.routes.ts`
- [ ] Nav entry added in `demo-nav.ts` (alphabetically placed)
- [ ] At least one `<demo-example>` per major usage variant — walk the component's
      inputs and confirm each one is shown somewhere
- [ ] Every `<demo-example>` has an `<itx-code-block>` with matching code
- [ ] `id="tokens"` section documenting the public `--itx-*` surface, matching the theme file
- [ ] Attribute-driven configuration (`itx-*`) documented in an Attributes table, not as Inputs
- [ ] One `id="api"` section containing every API table (Inputs, Outputs, and
      Methods where the component has an imperative surface); omit any with no rows
- [ ] Every `model()` input documented in *both* tables (`foo` and `fooChange`)
- [ ] API tables use the standard `name` / `type` / `default` cell templates
- [ ] No trailing `id="notes"` section or `notes` array (in-section `<demo-notes>` is fine)
- [ ] `tsc --noEmit` clean
- [ ] `ng build demo` succeeds
- [ ] Manual smoke test in the browser

## Reference implementations

When in doubt, look at these existing demo pages — they all conform to this workflow:

- `pages/dialog/` — simple two-example page with state panel
- `pages/stepper/` — multi-directive component with `sticky: true` column
- `pages/resizable/` — two examples, multi-section custom layout
- `pages/popover/` — multi-directive, includes a placement grid section
