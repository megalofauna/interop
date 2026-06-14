---
title: Markdown Kitchen Sink
description: Every common markdown construct, for eyeballing the render.
order: 2
---

# Markdown Kitchen Sink

A spread of common constructs so you can see what the type scale styles for free
and what still needs wiring.

## Headings carry the scale

### Third level

#### Fourth level

##### Fifth level

###### Sixth level reads as an overline

## Prose and emphasis

A paragraph with **bold**, *italic*, and `inline code`. Text wrap is set to
pretty, so ragged edges stay tidy. Here is a [link to the home page](/).

> A blockquote, for pulling a line out of the flow.

## Lists

- Unordered item
- Another item
  - Nested item
- Back to the top level

1. Ordered item
2. Second item
3. Third item

## Code block

```ts
export function greet(name: string): string {
	return `Hello, ${name}`;
}
```

## Table

| Construct   | How it's styled                       |
| ----------- | ------------------------------------- |
| Headings    | Type scale (bare element)             |
| Paragraphs  | Type scale (bare element)             |
| Lists       | Type scale (bare element)             |
| Tables      | interop-table skeleton (upgrade pass) |
| Inline code | itx-inline-code chip (upgrade pass)   |

This very table is rewritten into the `interop-table` class skeleton by the
upgrade pass — markup only, no component instance, so there's no sorting or
sticky-column behaviour. Likewise `inline code` becomes an `itx-inline-code`
chip but without the copy button.

---

The code block above is now a real `itx-code-block` instance (Layer 2): the
fence is replaced by an instantiated component, so it has shiki highlighting and
a working copy button — behaviour that markup alone can't provide. Its `code`
arrives as a component input and the language comes from the fence's
`language-*` class.
