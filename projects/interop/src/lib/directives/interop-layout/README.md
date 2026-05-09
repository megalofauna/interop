# InteropLayout Directive

Universal layout control for Interop components via CSS custom properties. Provides constrained flexbox vocabulary to prevent "CSS prop soup" while maintaining design system consistency.

## Key Features

- **Constrained vocabulary**: Prevents raw CSS exposure with curated layout options
- **Token-based spacing**: Gap values map to design system tokens (`--itx-sz-*`)
- **Shorthand syntax**: Simple string format for common use cases
- **Explicit object syntax**: Structured configuration for complex layouts
- **Component opt-in**: Only affects components that consume layout variables
- **Dev mode validation**: Warnings for potentially problematic configurations

## Basic Usage

### Shorthand Syntax (Recommended)

```html
<!-- Horizontal toolbar with spaced items -->
<interop-toolbar interopLayout="row center between">
  <button>Save</button>
  <button>Cancel</button>
</interop-toolbar>

<!-- Vertical stack with consistent gap -->
<interop-list interopLayout="column start gap-4">
  <interop-card>Card 1</interop-card>
  <interop-card>Card 2</interop-card>
</interop-list>

<!-- Button group with small spacing -->
<div interopLayout="row center gap-2">
  <button interop-button>Edit</button>
  <button interop-button>Delete</button>
</div>
```

### Object Syntax

```html
<interop-stack [interopLayoutConfig]="{ 
  direction: 'column', 
  align: 'stretch', 
  gap: 6 
}">
  <interop-card>Content</interop-card>
</interop-stack>
```

## Supported Properties

| Property | Values | CSS Mapping | Description |
|----------|--------|-------------|-------------|
| `direction` | `row`, `column`, `row-reverse`, `column-reverse` | `flex-direction` | Primary axis direction |
| `justify` | `start`, `end`, `center`, `between`, `around`, `evenly` | `justify-content` | Main axis alignment |
| `align` | `start`, `end`, `center`, `stretch`, `baseline` | `align-items` | Cross axis alignment |
| `wrap` | `nowrap`, `wrap`, `wrap-reverse` | `flex-wrap` | Flex wrapping behavior |
| `gap` | `0`, `1`, `2`, `3`, `4`, `6`, `8`, `12`, `16`, `24` | `gap` | Space between items (design tokens) |

## Gap Values & Design Tokens

Gap values map to your existing `--itx-sz-*` tokens:

- `gap-0` → `0`
- `gap-1` → `var(--itx-sz-1)` (0.25rem)
- `gap-2` → `var(--itx-sz-2)` (0.5rem)
- `gap-4` → `var(--itx-sz-4)` (1rem)
- `gap-8` → `var(--itx-sz-8)` (2rem)
- etc.

## Layout-Capable Components

Components must opt into layout support by:

1. **Using the decorator**: `@LayoutCapable(['direction', 'justify', 'align', 'wrap', 'gap'])`
2. **Consuming CSS variables**: Include layout styles that read `--itx-layout-*` variables

### Built-in Layout-Capable Components

- `interop-list`
- `interop-toolbar` (when available)
- `interop-stack` (when available)
- `interop-button-group` (when available)

### Making Your Component Layout-Capable

```typescript
import { LayoutCapable } from 'interop';

@LayoutCapable(['direction', 'justify', 'align', 'gap'])
@Component({
  selector: 'my-container',
  // ...
})
export class MyContainerComponent {
  // Component implementation
}
```

```scss
@use 'interop/layout' as layout;

:host {
  @include layout.layout-capable;
  
  // Override defaults if needed
  flex-direction: var(--itx-layout-direction, column);
}
```

## Advanced Usage

### Combining Multiple Layout Tokens

```html
<!-- Complex layout with multiple properties -->
<div interopLayout="row-reverse center between wrap gap-6">
  <button>Action 1</button>
  <button>Action 2</button>
  <button>Action 3</button>
</div>
```

### Responsive Layouts

Use CSS custom properties for responsive behavior:

```scss
.my-responsive-container {
  --itx-layout-direction: column;
  
  @media (min-width: 768px) {
    --itx-layout-direction: row;
    --itx-layout-gap: var(--itx-layout-gap-8);
  }
}
```

### Dynamic Layout Configuration

```typescript
export class MyComponent {
  layoutConfig = computed(() => ({
    direction: this.isVertical() ? 'column' : 'row',
    gap: this.spacing(),
    justify: this.alignment()
  }));
}
```

```html
<div [interopLayoutConfig]="layoutConfig()">
  <!-- Content -->
</div>
```

## CSS Variables Reference

The directive sets these CSS custom properties:

- `--itx-layout-direction`: flex-direction value
- `--itx-layout-justify`: justify-content value  
- `--itx-layout-align`: align-items value
- `--itx-layout-wrap`: flex-wrap value
- `--itx-layout-gap`: gap value (using design tokens)

## Development Warnings

In development mode, InteropLayout provides helpful warnings:

- **Non-layout-capable elements**: When applied to elements that don't consume layout variables
- **Potentially problematic combinations**: E.g., `justify="between"` with `direction="column"` but no gap
- **Missing layout support**: When components haven't opted into layout capability

## Integration with Existing Styles

InteropLayout works alongside existing component styles:

```scss
// Component can provide defaults
:host {
  display: flex;
  flex-direction: column;
  gap: var(--itx-sz-2);
  
  // Layout directive can override these
  flex-direction: var(--itx-layout-direction, column);
  justify-content: var(--itx-layout-justify, flex-start);
  align-items: var(--itx-layout-align, flex-start);
  flex-wrap: var(--itx-layout-wrap, nowrap);
  gap: var(--itx-layout-gap, var(--itx-sz-2));
}
```

## Common Patterns

### Toolbar Layouts
```html
<header interopLayout="row center between">
  <h1>Title</h1>
  <nav interopLayout="row center gap-4">
    <button>Home</button>
    <button>About</button>
  </nav>
</header>
```

### Card Grids
```html
<div interopLayout="row start wrap gap-6">
  <interop-card>Card 1</interop-card>
  <interop-card>Card 2</interop-card>
  <interop-card>Card 3</interop-card>
</div>
```

### Form Layouts
```html
<form interopLayout="column stretch gap-4">
  <input type="text" placeholder="Name">
  <input type="email" placeholder="Email">
  <div interopLayout="row end gap-2">
    <button type="submit">Save</button>
    <button type="button">Cancel</button>
  </div>
</form>
```

## API Reference

### Inputs

| Input | Type | Description |
|-------|------|-------------|
| `interopLayout` | `string \| null` | Shorthand layout string |
| `interopLayoutConfig` | `LayoutConfig \| null` | Explicit configuration object |

### Types

```typescript
interface LayoutConfig {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'stretch' | 'baseline';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 | 24;
}
```
