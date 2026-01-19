# Phosphor Icons Integration

A comprehensive icon system for Angular applications using the beautiful [Phosphor Icons](https://phosphoricons.com/) iconset. This integration provides a type-safe, tree-shakeable, and accessible way to use Phosphor icons in your Angular projects.

## Features

- 🎯 **Type-safe** - Full TypeScript support with icon name validation
- 🌳 **Tree-shakeable** - Only bundle the icons you actually use
- ♿ **Accessible** - Built-in ARIA support and screen reader compatibility  
- 🔧 **Flexible** - Multiple registration strategies for different use cases
- 📦 **Lightweight** - Minimal runtime overhead with SVG-based rendering
- 🎨 **Customizable** - Full control over size, colors, and stroke width

## Quick Start

### 1. Convenient Multi-Icon Import

Import any number of Phosphor icons from a single location:

```typescript
// main.ts - Import multiple icons from one location
import { 
  bootstrapApplication 
} from '@angular/platform-browser';
import { 
  registerGlobalPhosphorIcons,
  PhUser,
  PhHome,
  PhGear,
  PhHeart,
  PhStar,
  PhBell,
  PhCalendar,
  PhClock,
  PhTrash,
  PhCopy,
  PhDownload,
  PhUpload
} from '@your-org/interop';

bootstrapApplication(AppComponent, {
  providers: [
    registerGlobalPhosphorIcons(
      PhUser, PhHome, PhGear, PhHeart, PhStar, 
      PhBell, PhCalendar, PhClock, PhTrash, 
      PhCopy, PhDownload, PhUpload
    ),
  ]
});
```

**Key Benefits:**
- ✅ **Single Import Location**: All icons available from one import
- ✅ **Tree-shaking Ready**: Only icons you import are bundled
- ✅ **TypeScript IntelliSense**: Full autocomplete and type checking
- ✅ **No Deep Imports**: Simple, clean import statements

### 2. Basic Usage

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { 
  registerGlobalPhosphorIcons, 
  PhUser, 
  PhHouse, 
  PhGear,
  PhHeart,
  PhStar,
  PhBell 
} from '@your-org/interop';

bootstrapApplication(AppComponent, {
  providers: [
    registerGlobalPhosphorIcons(PhUser, PhHouse, PhGear, PhHeart, PhStar, PhBell),
    // other providers...
  ]
});
```

```html
<!-- app.component.html -->
<interop-icon name="user" />
<interop-icon name="house" [size]="32" />
<interop-icon name="gear" color="blue" [strokeWidth]="2" />
```

### 2. Component Template

```html
<!-- Basic usage -->
<interop-icon name="user" />

<!-- With custom styling -->
<interop-icon 
  name="arrow-right" 
  [size]="32" 
  [strokeWidth]="2" 
  color="blue" />

<!-- With accessibility -->
<interop-icon 
  name="warning" 
  [decorative]="false" 
  ariaLabel="Warning: Check your input" />
```

## Registration Strategies

### 1. Global Registration (Recommended)

Register icons globally at application bootstrap. These icons are available throughout your entire app.

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { 
  registerGlobalPhosphorIcons, 
  PhUser, 
  PhHome, 
  PhSettings,
  PhBell,
  PhHeart,
  PhStar,
  PhGear 
} from '@your-org/interop';

bootstrapApplication(AppComponent, {
  providers: [
    registerGlobalPhosphorIcons(PhUser, PhHome, PhSettings, PhBell, PhHeart, PhStar, PhGear),
  ]
});
```

### 2. Scoped Registration

Register icons only for specific components or modules. Useful for feature-specific icons that aren't needed globally.

```typescript
// feature.component.ts
import { Component } from '@angular/core';
import { 
  registerScopedPhosphorIcons, 
  PhChart, 
  PhGraph, 
  PhTrendUp,
  PhCalendar,
  PhClock 
} from '@your-org/interop';

@Component({
  selector: 'app-analytics',
  providers: [registerScopedPhosphorIcons(PhChart, PhGraph, PhTrendUp, PhCalendar, PhClock)],
  template: `
    <interop-icon name="chart" />
    <interop-icon name="graph" />
    <interop-icon name="trend-up" />
    <interop-icon name="calendar" />
    <interop-icon name="clock" />
  `
})
export class AnalyticsComponent {}
```

### 3. Async Registration (Large Icon Sets)

For loading many icons asynchronously to avoid blocking the initial bundle:

```typescript
// main.ts - Async bootstrapping
import { registerCommonPhosphorIcons } from '@your-org/interop';

async function bootstrap() {
  const iconProviders = await registerCommonPhosphorIcons();
  
  bootstrapApplication(AppComponent, {
    providers: [
      ...iconProviders,
      // other providers...
    ]
  });
}

bootstrap();
```

### 4. Template-Level Registration (Advanced)

Register icons at the template level using the `iconScope` directive:

```html
<div iconScope="acorn,tree,leaf">
  <interop-icon name="acorn" />
  <interop-icon name="tree" />
  <interop-icon name="leaf" />
</div>
```

## Available Registration Functions

### Primary API (Recommended)

- `registerPhosphorIcons(...icons)` - Register specific icons globally
- `registerGlobalPhosphorIcons(...icons)` - Same as above (explicit naming)
- `registerScopedPhosphorIcons(...icons)` - Register icons for component/module scope
- `registerCommonPhosphorIcons()` - Async: Register 30+ common icons
- `registerAllPhosphorIcons()` - Async: Register ALL Phosphor icons (use carefully!)

### Async Functions

```typescript
// Register common icons (good balance of functionality vs bundle size)
const commonProviders = await registerCommonPhosphorIcons();

// Register ALL icons (large bundle - use only if needed)
const allProviders = await registerAllPhosphorIcons();

// Register common icons in component scope
const scopedCommonProviders = await registerScopedCommonPhosphorIcons();
```

## Icon Component API

### Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | required | Icon name from registered iconset |
| `size` | `number` | `24` | Icon size in pixels |
| `strokeWidth` | `number` | `undefined` | Override icon's default stroke width |
| `color` | `string` | `undefined` | Icon color (CSS value, defaults to currentColor) |
| `decorative` | `boolean` | `true` | Whether icon is decorative (hidden from screen readers) |
| `ariaLabel` | `string` | `undefined` | Accessible label (required when decorative=false) |

### Examples

```html
<!-- Basic icon -->
<interop-icon name="user" />

<!-- Large icon with custom stroke -->
<interop-icon name="heart" [size]="48" [strokeWidth]="1.5" />

<!-- Colored icon -->
<interop-icon name="star" color="gold" />

<!-- Semantic (non-decorative) icon -->
<interop-icon 
  name="warning" 
  [decorative]="false" 
  ariaLabel="Warning: Invalid input" />

<!-- Icon inheriting color from parent -->
<span style="color: red;">
  <interop-icon name="x" /> <!-- Will be red -->
</span>
```

## Tree-Shaking & Bundle Optimization

### Import Multiple Icons from Single Location

```typescript
// ✅ Recommended: Import multiple icons from common index
import { 
  registerGlobalPhosphorIcons,
  PhUser,
  PhHome,
  PhGear,
  PhHeart,
  PhStar,
  PhBell,
  PhCalendar 
} from '@your-org/interop';

bootstrapApplication(AppComponent, {
  providers: [registerGlobalPhosphorIcons(PhUser, PhHome, PhGear, PhHeart, PhStar, PhBell, PhCalendar)]
});
```

```typescript
// ✅ Also good: Tree-shakeable individual imports (if preferred)
import { PhUser } from '@your-org/interop/phosphor/user';
import { PhHome } from '@your-org/interop/phosphor/home';
import { registerGlobalPhosphorIcons } from '@your-org/interop';

bootstrapApplication(AppComponent, {
  providers: [registerGlobalPhosphorIcons(PhUser, PhHome)]
});
```

### Common Icons Set

For convenience, we provide a curated set of ~30 commonly used icons:

```typescript
import { registerCommonPhosphorIcons } from '@your-org/interop';

// Includes: user, house, gear, magnifying-glass, plus, minus, x, check,
// arrows, heart, star, bell, envelope, calendar, clock, and more...
const iconProviders = await registerCommonPhosphorIcons();
```

## Accessibility

### Decorative vs Semantic Icons

```html
<!-- Decorative: Icon next to text (hidden from screen readers) -->
<button>
  <interop-icon name="plus" [decorative]="true" />
  Add Item
</button>

<!-- Semantic: Icon without text (needs aria-label) -->
<button>
  <interop-icon 
    name="plus" 
    [decorative]="false" 
    ariaLabel="Add new item" />
</button>
```

### Screen Reader Support

- **Decorative icons** (`decorative="true"`) get `aria-hidden="true"` and `role="presentation"`
- **Semantic icons** (`decorative="false"`) get `role="img"` and require `ariaLabel`
- The component warns in development mode about missing accessibility labels

## Advanced Usage

### Custom Icon Registry

```typescript
import { inject } from '@angular/core';
import { 
  PhosphorIconRegistry,
  registerScopedPhosphorIcons,
  PhUser,
  PhGear,
  PhHeart 
} from '@your-org/interop';

@Component({
  providers: [registerScopedPhosphorIcons(PhUser, PhGear, PhHeart)],
  // ...
})
export class MyService {
  private iconRegistry = inject(PhosphorIconRegistry);
  
  // Check if icon exists
  hasIcon(name: string): boolean {
    return !!this.iconRegistry.get(name);
  }
  
  // Get all registered icon names
  getAllIcons(): string[] {
    return this.iconRegistry.getAllRegistered();
  }
}
```

### Hierarchical Icon Scoping

Icons registered in child components override parent icons with the same name:

```typescript
// Parent component
@Component({
  providers: [registerScopedPhosphorIcons(PhUserRegular)],
  template: '<app-child></app-child>'
})
export class ParentComponent {}

// Child component - overrides 'user' icon
@Component({
  providers: [registerScopedPhosphorIcons(PhUserBold)],
  template: '<interop-icon name="user" />' // Uses bold version
})
export class ChildComponent {}
```



## Common Patterns

### Icon Button

```html
<button class="icon-button">
  <interop-icon 
    name="gear" 
    [decorative]="false" 
    ariaLabel="Open settings" />
</button>
```

### Icon with Text

```html
<div class="menu-item">
  <interop-icon name="house" />
  <span>Home</span>
</div>
```

### Conditional Icons

```html
<interop-icon 
  [name]="isExpanded ? 'caret-up' : 'caret-down'" />
```

### Dynamic Sizing

```html
<interop-icon 
  name="star" 
  [size]="rating * 8" 
  [color]="rating > 3 ? 'gold' : 'gray'" />
```

## Troubleshooting

### Icon Not Displaying

1. **Check if icon is registered:**
   ```typescript
   console.log(iconRegistry.get('your-icon-name'));
   ```

2. **Verify import path:**
   ```typescript
   // ✅ Correct
   import { PhUser } from '@your-org/interop/phosphor/user';
   
   // ❌ Might not exist
   import { PhUser } from '@your-org/interop/phosphor/User';
   ```

3. **Check provider registration:**
   ```typescript
   // Make sure icon is in the provider
   registerGlobalPhosphorIcons(PhUser) // PhUser must be imported
   ```

### Development Warnings

- **"Icon not found"** - Icon name doesn't match any registered icons
- **"Missing ariaLabel"** - Non-decorative icon needs accessibility label


### Performance Issues

- Use `registerCommonPhosphorIcons()` instead of `registerAllPhosphorIcons()`
- Import individual icons rather than barrel exports
- Register icons at appropriate scope (global vs scoped)

## TypeScript Support

All icon names are type-checked when using individual imports:

```typescript
import { PhUser } from '@your-org/interop/phosphor/user';

// ✅ Type-safe - 'user' matches PhUser.name
<interop-icon name="user" />

// ❌ TypeScript error if icon not registered
<interop-icon name="nonexistent-icon" />
```

## Browser Support

- **Modern browsers**: Full support (Chrome 60+, Firefox 55+, Safari 12+)
- **SVG rendering**: Universal browser support
- **Tree-shaking**: Requires modern bundler (Webpack 4+, Rollup, Vite)

## Performance Metrics

- **Runtime overhead**: ~2KB for core registry + icon component
- **Individual icon**: ~0.5-1KB each (varies by complexity)
- **Common icons set**: ~15-20KB total
- **All icons**: ~200KB+ (use carefully!)

## Contributing

When adding new icons or features:

1. Follow the existing naming conventions
2. Add proper TypeScript types
3. Include accessibility considerations
4. Update documentation and examples
5. Test tree-shaking behavior

## License

This icon integration follows the same license as the Phosphor Icons project. Check [phosphoricons.com](https://phosphoricons.com) for the most current license terms.