# Authoring content

Protocol pages are markdown files. Write them in iA Writer (or any editor that
saves plain `.md`), and they render through the design system at runtime.

## Workflow

1. In iA Writer, add a Library location pointing at:
   `projects/protocol/src/content/`
2. Create or edit a `.md` file there. The filename is the route — `pricing.md`
   serves at `/pricing`.
3. Save. The file is now in the repo; commit it with your normal git flow.
   (No build step or export — the dev server serves `content/` as a static
   asset under `/content`, and the app fetches and renders it.)

## File shape

```
---
title: Pricing
description: Optional — used for meta, not yet rendered.
order: 3
---

# Pricing

Body prose...
```

- The frontmatter block (`---` fenced) is optional. Keep it to flat
  `key: value` lines — the parser does not handle nested YAML.
- `title` sets the browser tab. `description` and `order` are captured for
  later use (nav ordering, meta tags) but not yet surfaced.

## What's styled, and what isn't (yet)

Wrapped in `[interop-typography-root]`, these inherit the type scale with zero
wiring: headings, paragraphs, lists, blockquotes, and code blocks.

Still rendering as bare HTML — the first candidates to map onto real interop
components: **tables**, **inline code**, **links**, and **horizontal rules**.

## Architecture notes

- Loader + frontmatter parser: `src/app/content/content.ts`
- Route component: `src/app/content/content-page.ts` (binds `:slug`)
- Parser dependency: `marked` (markdown → HTML). Swapping to an AST walk that
  emits interop components is the planned upgrade and touches only `content.ts`
  — the route, asset convention, and this workflow stay the same.
- Rendered HTML is injected via Angular's `[innerHTML]`, so its sanitizer runs.
  Content is first-party (authored in this repo), but the sanitizer still
  strips `id`/`style`; if you need heading anchors later, that's where to look.
