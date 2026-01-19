# Interop Angular Library

An Angular library focused on interoperable components and data patterns. Built with the philosophy of maximum compatibility without forced conversions.

## Overview

The Interop library provides Angular components, services, and utilities that work seamlessly with different data sources, patterns, and workflows. Components use `Interop*` class names, `interop-*` selectors, and CSS custom properties with the `--ntr-*` prefix.

## Key Features

- **Flexible Data Sources**: Work with arrays, observables, promises, and iterables without conversion
- **Gradual Complexity**: Start simple and add features as needed
- **Type Safety**: Full TypeScript support with intelligent type guards
- **Angular Best Practices**: Built following Angular library standards
- **Zero Dependencies**: No external dependencies beyond Angular and RxJS

## Installation

```bash
npm install interop
```

## Quick Start

```typescript
import { InteropModule } from 'interop';

@NgModule({
  imports: [InteropModule],
  // ...
})
export class AppModule { }
```

## Basic Usage

```typescript
import { CollectionInput } from 'interop';

@Component({
  selector: 'app-example',
  template: `
    <interop-list [items]="data"></interop-list>
  `
})
export class ExampleComponent {
  // Works with any of these data types:
  data: CollectionInput<any> = [1, 2, 3]; // Array
  // data = of([1, 2, 3]); // Observable
  // data = Promise.resolve([1, 2, 3]); // Promise
  // data = { items: [1, 2, 3], loading: false }; // Collection object
}
```

## Architecture

### Core Types

The library starts with minimal, flexible types in `collection.ts`:

- `SimpleIterable<T>` - Handles arrays, iterables, promises, and observables
- `BasicCollection<T>` - Simple collection with items and optional loading state
- `CollectionInput<T>` - Union type for component inputs

### Component Naming

All components use `Interop*` class names, `interop-*` selectors, and CSS custom properties with the `--ntr-*` prefix:

- Components: `interop-list`, `interop-grid`, `interop-card`
- Services: `InteropCollectionService`, `InteropDataService`
- Directives: `interopCollection`, `interopTrackBy`
- Pipes: `interopAsync`, `interopSafe`

## Development Approach

This library is built with a "start small, grow gradually" philosophy:

1. **Phase 1**: Basic collection types and simple components
2. **Phase 2**: Add pagination, filtering, sorting as needed
3. **Phase 3**: Advanced features like virtualization, accessibility
4. **Phase 4**: Complex interop scenarios and optimizations

The complete feature set is preserved in `collection-full.ts` for future migration.

## Building the Library

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Build and watch for changes
npm run build:watch

# Run tests
npm test

# Lint code
npm run lint

# Lint styles (Stylelint). Enforces `--ntr-*` custom property naming via .stylelintrc.json
npx stylelint "src/**/*.scss" "projects/**/*.scss"

# Codemod: normalize CSS custom properties to `--ntr-*`
# Dry run:
node tools/codemods/rename-css-vars.js --dry-run --paths src lib projects
# Apply changes (with backups):
node tools/codemods/rename-css-vars.js --backup --paths src lib projects
```

## Project Structure

```
src/
├── lib/
│   ├── components/          # interop-* selectors, Interop* classes
│   ├── services/            # Interop* services
│   ├── directives/          # interop* directives
│   ├── pipes/               # interop* pipes
│   ├── utils/               # Utility functions
│   └── interop.module.ts    # Main module
├── types/
│   ├── collection.ts        # Current minimal types
│   └── collection-full.ts   # Complete feature set (future)
└── public-api.ts           # Library exports
```

## Contributing

1. Follow the naming convention: `Interop*` class names, `interop-*` selectors, and `--ntr-*` CSS custom properties
2. Start with minimal implementations and add complexity gradually
3. Maintain compatibility with the `CollectionInput<T>` interface
4. Include comprehensive type guards for runtime checking
5. Write tests for all components and services

## Philosophy

### Interoperability First

Components should accept data in any reasonable format without forcing specific implementations. The library adapts to your data, not the other way around.

### Progressive Enhancement

Start with simple use cases and add features as needed. Complex features are available but optional.

### Type Safety

Leverage TypeScript's type system for development-time safety while providing runtime guards for dynamic scenarios.

### Angular Native

Built specifically for Angular with proper integration for services, change detection, and the Angular CLI.

## Roadmap

- [x] Basic list component (`interop-list`)
- [ ] Collection service (`InteropCollectionService`)
- [ ] Async data handling utilities
- [ ] Pagination support
- [ ] Filtering and sorting
- [ ] Grid component (`interop-grid`)
- [ ] Virtual scrolling
- [ ] Accessibility features
- [ ] Performance optimizations

## License

MIT License - see LICENSE file for details.