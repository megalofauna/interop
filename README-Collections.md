# Interop Collections: True Interoperability in TypeScript

> **Ethos**: Accept anything, convert gracefully, work everywhere.

## Philosophy

The Interop Collection system embodies true interoperability—not just technical compatibility, but a philosophical commitment to seamless integration across different data sources, patterns, and workflows. Instead of forcing developers to convert their data into specific formats, we accept data as it naturally exists and handle the complexity internally.

## The Interoperability Promise

### What We Accept
- **Arrays**: `['a', 'b', 'c']`
- **Observables**: `this.http.get<Item[]>('/api/items')`
- **Promises**: `fetch('/api/data').then(r => r.json())`
- **Sets**: `new Set([1, 2, 3])`
- **Maps**: `new Map([['key', 'value']])`
- **Generators**: `function* numbers() { yield 1; yield 2; }`
- **NodeLists**: `document.querySelectorAll('.items')`
- **Custom Iterables**: Any object with `Symbol.iterator`
- **Async Iterables**: Streams, WebSocket data, real-time feeds

### What We Provide
- **Consistent Interface**: Same API regardless of data source
- **Reactive Streams**: Everything becomes `Observable<T[]>`
- **Error Handling**: Graceful degradation, no breaking changes
- **Performance**: Optimized for each source type
- **Type Safety**: Full TypeScript support with intelligent inference

## Quick Start

```typescript
import { CollectionInput, normalizeCollection } from '@interop/collections';

// Your component accepts any data source
@Component({
  selector: 'data-list',
  template: `
    <div *ngFor="let item of items$ | async; trackBy: trackBy">
      {{ item.name }}
    </div>
  `
})
export class DataListComponent<T> {
  @Input() collection: CollectionInput<T> = [];
  
  items$ = normalizeCollection(this.collection);
  trackBy = createUniversalTrackBy('id');
}
```

```html
<!-- Works with arrays -->
<data-list [collection]="['Apple', 'Banana', 'Cherry']"></data-list>

<!-- Works with observables -->
<data-list [collection]="userService.getUsers()"></data-list>

<!-- Works with promises -->
<data-list [collection]="fetchProducts()"></data-list>

<!-- Works with anything iterable -->
<data-list [collection]="new Set([1, 2, 3])"></data-list>
```

## Core Types

### `CollectionInput<T>`
The universal input type that accepts any iterable data source:

```typescript
type CollectionInput<T> = 
  | T[]                           // Static arrays
  | Observable<T[]>               // Reactive streams
  | Promise<T[]>                  // Async data
  | Set<T>                       // Unique collections
  | Iterable<T>                  // Any iterable
  | InteropCollection<T>;        // Full-featured collections
```

### `InteropCollection<T>`
Enhanced collections with built-in state management:

```typescript
interface InteropCollection<T> {
  items: InteropIterable<T>;          // The data source
  transform?: (item: any) => T;       // Optional transformation
  trackBy?: (index: number, item: T) => any;  // Performance tracking
  loading$?: Observable<boolean>;     // Loading state
  error$?: Observable<Error | null>;  // Error handling
}
```

### `InteropAdvancedCollection<T>`
Full-featured collections with pagination, filtering, and sorting:

```typescript
interface InteropAdvancedCollection<T> extends InteropCollection<T> {
  pagination?: {
    current?: number;
    total?: number;
    size?: number;
    hasMore?: boolean;
  };
  
  filter?: any;
  onFilter?: (filter: any) => void;
  
  sort?: {
    field?: string | keyof T;
    direction?: 'asc' | 'desc';
  };
  onSort?: (sort: any) => void;
  
  selection?: {
    selected?: Set<any>;
    mode?: 'single' | 'multiple' | 'none';
    onSelect?: (item: T, selected: boolean) => void;
  };
}
```

## Real-World Examples

### 1. Multi-Source Data Component

```typescript
@Component({
  selector: 'user-dashboard',
  template: `
    <user-list [collection]="currentUsers"></user-list>
    <button (click)="switchSource()">Switch Data Source</button>
  `
})
export class UserDashboardComponent {
  currentUsers: CollectionInput<User> = [];
  
  constructor(
    private userService: UserService,
    private cache: CacheService
  ) {}
  
  switchSource() {
    // Seamlessly switch between different data sources
    const sources = [
      this.userService.getUsers(),           // Observable
      this.userService.getUsersAsync(),      // Promise
      this.cache.getCachedUsers(),           // Array
      this.userService.getRealtimeUsers(),   // BehaviorSubject
      new Set(this.getUniqueUsers())         // Set
    ];
    
    this.currentUsers = sources[Math.floor(Math.random() * sources.length)];
  }
}
```

### 2. Legacy Migration

```typescript
// Before: Traditional Angular approach
class LegacyComponent {
  users: User[] = [];
  loading = false;
  error: string | null = null;
  
  loadUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: users => {
        this.users = users;
        this.loading = false;
      },
      error: error => {
        this.error = error.message;
        this.loading = false;
      }
    });
  }
}

// After: Interop approach
class ModernComponent {
  collection: InteropCollection<User> = createInteropCollection(
    this.userService.getUsers()
  );
  
  // Loading, error handling, and state management are built-in
  // No manual subscription management needed
}
```

### 3. Advanced Features

```typescript
@Component({
  selector: 'product-catalog',
  template: `
    <search-input (search)="collection.onSearch?.($event)"></search-input>
    <sort-controls (sort)="collection.onSort?.($event)"></sort-controls>
    <product-grid [collection]="collection"></product-grid>
    <pagination [pagination]="collection.pagination"></pagination>
  `
})
export class ProductCatalogComponent {
  collection: InteropAdvancedCollection<Product> = {
    items: this.productService.getProducts(),
    transform: raw => new Product(raw),
    trackBy: createUniversalTrackBy('sku'),
    
    // Pagination
    pagination: { current: 1, size: 20 },
    loadMore: () => this.productService.loadMore(),
    
    // Filtering
    filter: { category: 'all' },
    onFilter: filter => this.productService.setFilter(filter),
    
    // Sorting
    sort: { field: 'name', direction: 'asc' },
    onSort: sort => this.productService.setSort(sort),
    
    // Selection
    selection: {
      selected: new Set(),
      mode: 'multiple',
      onSelect: (product, selected) => this.handleSelection(product, selected)
    }
  };
}
```

## Utility Functions

### `normalizeCollection<T>(collection)`
Converts any collection input to `Observable<T[]>`:

```typescript
// All of these become Observable<string[]>
const array$ = normalizeCollection(['a', 'b', 'c']);
const promise$ = normalizeCollection(Promise.resolve(['x', 'y', 'z']));
const set$ = normalizeCollection(new Set(['1', '2', '3']));
const obs$ = normalizeCollection(of(['foo', 'bar']));
```

### `createUniversalTrackBy(keyPath?)`
Creates performance-optimized tracking functions:

```typescript
// Track by index (default)
const trackByIndex = createUniversalTrackBy();

// Track by property
const trackById = createUniversalTrackBy('id');

// Track by nested property
const trackByUserId = createUniversalTrackBy('user.id');

// Track by custom function
const trackByCustom = createUniversalTrackBy(item => `${item.type}-${item.id}`);
```

### `mergeCollections(...sources)`
Combines multiple data sources:

```typescript
const combined$ = mergeCollections(
  staticUsers,           // Array
  liveUsers$,           // Observable
  fetchUsers(),         // Promise
  cachedUsers          // Set
);
// Result: Observable<User[]> with all sources merged
```

### `InteropCollectionAdapter<T>`
Bridge for legacy code migration:

```typescript
const adapter = new InteropCollectionAdapter<User>();

// Use with existing code
existingService.getUsers().subscribe(users => {
  adapter.updateItems(users);
});

// Use with new code
const collection = adapter.collection; // InteropCollection<User>
```

## Performance Considerations

### Virtual Scrolling
```typescript
const largeCollection = createInteropCollection(hugeDataset, {
  config: {
    performance: {
      virtualScroll: true,
      lazy: true
    }
  }
});
```

### Chunked Processing
```typescript
const chunked$ = InteropPerformance.createChunkedCollection(
  massiveDataSource,
  1000 // chunk size
);
```

### Debounced Updates
```typescript
const debounced$ = InteropPerformance.createDebouncedCollection(
  rapidUpdates$,
  300 // debounce ms
);
```

## TypeScript Integration

### Type Inference
The system provides intelligent type inference:

```typescript
// Type is automatically inferred as CollectionInput<User>
const users = getUsers(); 

// Type is inferred as Observable<User[]>
const users$ = normalizeCollection(users);

// Full type safety maintained
users$.subscribe(userArray => {
  // userArray is typed as User[]
  userArray.forEach(user => {
    // user is typed as User
    console.log(user.name); // ✓ Type-safe
  });
});
```

### Generic Constraints
```typescript
function createTypedCollection<T extends { id: any }>(
  source: CollectionInput<T>
): InteropCollection<T> {
  return createInteropCollection(source, {
    trackBy: createUniversalTrackBy('id') // Type-safe: T has id
  });
}
```

## Error Handling

### Graceful Degradation
```typescript
// If any source fails, the system continues with empty array
const safeCollection$ = normalizeCollection(unreliableSource);
safeCollection$.subscribe(items => {
  // items is never null/undefined, always T[]
  console.log(`Received ${items.length} items`);
});
```

### Error Streams
```typescript
const collection = createInteropCollection(dataSource);

collection.error$.subscribe(error => {
  if (error) {
    console.error('Collection error:', error);
    // Handle error gracefully
  }
});
```

## Testing

### Mock Collections
```typescript
// Easy mocking for tests
const mockCollection: CollectionInput<User> = [
  { id: 1, name: 'Test User', email: 'test@example.com' }
];

const component = new UserListComponent();
component.collection = mockCollection;
// Component works identically with mock or real data
```

### Async Testing
```typescript
it('should handle async collections', async () => {
  const asyncCollection = Promise.resolve([user1, user2]);
  component.collection = asyncCollection;
  
  const items = await extractItems(asyncCollection);
  expect(items).toEqual([user1, user2]);
});
```

## Migration Guide

### Step 1: Update Inputs
```typescript
// Before
@Input() users: User[] = [];

// After
@Input() users: CollectionInput<User> = [];
```

### Step 2: Normalize in Component
```typescript
// Before
ngOnInit() {
  this.userService.getUsers().subscribe(users => {
    this.users = users;
  });
}

// After
users$ = normalizeCollection(this.users);
```

### Step 3: Update Templates
```html
<!-- Before -->
<div *ngFor="let user of users">{{ user.name }}</div>

<!-- After -->
<div *ngFor="let user of users$ | async">{{ user.name }}</div>
```

## Best Practices

### 1. Use CollectionInput for @Input Properties
```typescript
@Input() items: CollectionInput<T> = []; // ✓ Flexible
@Input() items: T[] = [];                // ✗ Restrictive
```

### 2. Normalize Early
```typescript
// ✓ Normalize in component initialization
items$ = normalizeCollection(this.items);

// ✗ Normalize in template (performance impact)
// {{ (normalizeCollection(items) | async)?.length }}
```

### 3. Leverage TrackBy Functions
```typescript
// ✓ Use universal track-by for performance
trackBy = createUniversalTrackBy('id');

// ✗ Skip tracking (performance impact in large lists)
```

### 4. Handle Loading States
```typescript
// ✓ Use built-in loading state
collection.loading$.subscribe(loading => {
  this.showSpinner = loading;
});

// ✗ Manual loading state management
```

## Philosophy in Action

The Interop Collection system represents more than just technical interfaces—it's a commitment to true interoperability:

- **No Forced Conversions**: Your data stays in its natural format until the last possible moment
- **Graceful Adaptation**: Components adapt to your data, not the other way around
- **Future-Proof**: New data sources integrate seamlessly without breaking changes
- **Developer-Friendly**: Less boilerplate, more functionality
- **AI-Optimized**: Clear patterns that both humans and AI tools can understand and work with

This is interoperability as an ethos: building systems that work together naturally, without friction, and without forcing artificial constraints on how you structure your code or data.