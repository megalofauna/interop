# Interop


Welcome to Interop — a TypeScript-first Angular library focused on interoperability. It embraces “accept anything, convert gracefully, work everywhere,” so your components and services can consume arrays, Observables, Promises, Sets, generators, and more without friction.

Key features:
- Works with any data source: arrays, Observables, Promises, Sets, generators, NodeLists, and more
- Angular-friendly: directives, components, and services designed for Angular 17+
- Strong TypeScript types and utilities
- Extensible patterns for pagination, filtering, sorting, and interactivity
- Auto-generated API docs with TypeDoc, integrated into this docs site

Quick links:
- API Reference: See the sidebar under “API Reference”

Getting started

- Install (when published)
```bash
npm install interop
```

Interop requires Angular 17+ and RxJS 7+. If you’re using the demo locally, your workspace already satisfies these peer dependencies.

- Import the module (optional for standalone components)
```ts
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { InteropModule } from 'interop';

@NgModule({
  imports: [BrowserModule, InteropModule],
  bootstrap: [/* AppComponent */]
})
export class AppModule {}
```

- Use a component (example: InteropList)
```html
<!-- Works with arrays -->
<ul interop-list [collection]="['Apple', 'Banana', 'Cherry']"></ul>

<!-- Works with Observables -->
<ul interop-list [collection]="users$"></ul>

<!-- Works with Promises -->
<ul interop-list [collection]="productsPromise"></ul>

<!-- Auto trackBy (id/_id) or provide your own -->
<ul
  interop-list
  [collection]="users$"
  [trackBy]="(i, u) => u.id">
</ul>
```

- Provide data from your component
```ts
import { Component } from '@angular/core';
import { of } from 'rxjs';

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html'
})
export class ExampleComponent {
  users$ = of([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]);

  productsPromise = Promise.resolve([
    { sku: 'ABC123', title: 'Headphones' },
    { sku: 'DEF456', title: 'Coffee Mug' }
  ]);
}
```

Docs and API reference

This site is built with Docusaurus and TypeDoc:
- The API Reference is generated directly from the TypeScript source.
- You can run and iterate locally using the scripts below.

Local docs workflow

- Start the docs site in dev mode
```bash
npm run docs:dev
```

- Build the static site (generate API docs first)
```bash
npm run docs
```

- Preview the built site locally
```bash
npm run docs:serve
```

- Generate markdown API stubs with TypeDoc
```bash
npm run docs:api
```

Project scripts of interest

- docs:dev — starts Docusaurus in dev mode at interop/docs
- docs:build — builds the site (TypeDoc plugin runs automatically)
- docs:serve — serves the built site locally
- docs:api — emits Markdown API docs to docs/api using TypeDoc directly

What’s next?

- Explore the API Reference for types like InteropCollection, normalizeCollection, and utilities for pagination, sorting, and filtering.
- Check out the InteropList component for drop-in list rendering from any data source.
- Add your own directives, components, and services — the docs will grow automatically from source.

Interop ethos

- Interoperability first: accept diverse inputs without forcing conversions.
- Progressive enhancement: start simple, scale up with advanced features only when you need them.
- Type-safety: leverage TypeScript for accurate, discoverable API docs and strong tooling.

Contributing

- Keep public APIs documented with TSDoc comments.
- Prefer re-exporting in src/public-api.ts so API surfaces stay organized and discoverable.
- Run the docs locally to validate changes to content and API signatures.

Happy shipping!