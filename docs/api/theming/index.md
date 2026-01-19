# Theming

Interop is themable using CSS custom properties, not Sass overrides, deep selectors, or component-level style rewrites.

Two simple ideas guide this:


## 1. Components handle styles; consumers supply values.

Components define how they look.

Consumers decide what values those styles use.

Another way to think about it: components know how to apply a theme; consumers provide the tokens that make up the theme.

## 2. Prefer real HTML + context over custom everything.
Interop favors native, semantic HTML elements (like buttons and inputs) and adapts them based on where they’re used (for example, inside an interop-toolbar).

This approach avoids custom “replacement” components that reinvent basic HTML controls, require lots of ARIA patchwork, and are harder to reason about, style, and maintain.

In short: Less plumbing, more paint. Always prefer to style what already works instead of rebuilding it.
