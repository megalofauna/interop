---
title: Getting Started
description: How content flows from iA Writer into the Protocol app.
order: 1
---

# Getting Started

This page is a plain markdown file living in `projects/protocol/src/content/`.
Edit it in **iA Writer**, save, and the dev server serves it at `/getting-started`.

## The loop

1. Write markdown in iA Writer, pointed at the `content/` folder.
2. Save — the file lands in the repo, ready to commit.
3. The app fetches `/content/<slug>.md` and renders it through the design system.

The filename is the route: `getting-started.md` becomes `/getting-started`.

## Frontmatter

The block fenced by `---` at the top sets the page `title` (used for the browser
tab) and an optional `description` and `order`. Keep it to simple `key: value`
lines — no nested YAML.

Everything below the frontmatter is ordinary prose. Write headings, lists, and
paragraphs the way you would anywhere, and the type scale styles them.
