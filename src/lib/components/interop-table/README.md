# InteropTable - Bedrock Functionality

An **unstyled** table component focused on core functionality: semantic HTML structure, collection integration, and type safety. You provide all styling.

## Philosophy

InteropTable follows the **bedrock approach**:
- ✅ **Unstyled by design** - Complete styling freedom
- ✅ **Semantic HTML** - Proper `<table>` structure for accessibility
- ✅ **Type safety** - Full TypeScript generics support
- ✅ **Signal-based** - Modern Angular reactivity patterns
- ✅ **Collection integration** - Works with `InteropCollectionService`
- ✅ **Zero dependencies** - No CSS frameworks or themes

## Bedrock Features

### Core Functionality
- Auto-generated columns from data
- Custom column definitions with labels
- Loading, error, and empty states (unstyled)
- TrackBy optimization for performance
- Collection service integration

### What's NOT Included (By Design)
- ❌ CSS styling or themes
- ❌ Custom templates (future iteration)
- ❌ Advanced formatting (future iteration) 
- ❌ Sorting/filtering (future iteration)
- ❌ Responsive layouts (you handle this)

## Basic Usage

### Auto-Generated Columns (Zero Config)

```html
<table interop-table [collection]="users"></table>
```

```typescript
export class MyComponent {
  users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', active: true },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', active: false }
  ];
}
```

### Custom Column Definitions

```html
<table interop-table 
       [collection]="users"
       [columns]="userColumns">
</table>
```

```typescript
export class MyComponent {
  userColumns: TableColumn<User>[] = [
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'active', label: 'Status' }
  ];
}
```

### With Collection Service

```html
<table interop-table [collection]="usersCollection"></table>
```

```typescript
export class MyComponent {
  private collectionService = inject(InteropCollectionService);
  
  usersCollection = this.collectionService.create({
    source: this.http.get<User[]>('/api/users')
  });
}
```

## API Reference

### Component Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `collection` | `InteropCollectionInput<T>` | - | Data source (arrays, observables, promises, collections) |
| `columns` | `TableColumn<T>[]` | `null` | Column definitions (auto-generated if not provided) |
| `trackBy` | `TrackByFunction<T> \| "auto" \| "index"` | `"auto"` | Row tracking strategy |
| `trackByField` | `keyof T \| null` | `null` | Field to use for tracking |
| `showHeaders` | `boolean` | `true` | Whether to show table headers |
| `emptyText` | `string` | `"No data available"` | Text for empty state |
| `loadingText` | `string` | `"Loading..."` | Text for loading state |
| `autoColumns` | `boolean` | `true` | Auto-generate columns from data |

### TableColumn Interface (Bedrock)

```typescript
interface TableColumn<T> {
  key: keyof T | string;    // Property key from data object
  label?: string;           // Display label (defaults to formatted key)
  hidden?: boolean;         // Whether column is hidden
}
```

## Generated HTML Structure

InteropTable outputs semantic HTML that you can style:

```html
<table class="your-styles">
  <!-- Loading state -->
  <tbody class="interop-table-loading">
    <tr>
      <td class="interop-table-loading-cell" colspan="3">
        <div class="interop-table-loading-content">Loading...</div>
      </td>
    </tr>
  </tbody>
  
  <!-- Headers -->
  <thead class="interop-table-header">
    <tr class="interop-table-header-row">
      <th class="interop-table-header-cell" data-column-key="name">
        <span class="interop-table-header-text">Name</span>
      </th>
      <!-- ... more headers -->
    </tr>
  </thead>
  
  <!-- Data rows -->
  <tbody class="interop-table-body">
    <tr class="interop-table-row" data-row-index="0">
      <td class="interop-table-cell" data-column-key="name" data-cell-index="0">
        <span class="interop-table-cell-text">John Doe</span>
      </td>
      <!-- ... more cells -->
    </tr>
  </tbody>
  
  <!-- Empty state -->
  <tbody class="interop-table-empty">
    <tr>
      <td class="interop-table-empty-cell" colspan="3">
        <div class="interop-table-empty-content">No data available</div>
      </td>
    </tr>
  </tbody>
</table>
```

## Styling Examples

Since the component is unstyled, you have complete control:

### Basic Styling

```css
table[interop-table] {
  width: 100%;
  border-collapse: collapse;
}

table[interop-table] th,
table[interop-table] td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

table[interop-table] th {
  background: #f5f5f5;
  font-weight: 600;
}
```

### State Styling

```css
.interop-table-loading-cell {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.interop-table-empty-cell {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.interop-table-error-cell {
  text-align: center;
  padding: 2rem;
  color: #dc2626;
}
```

### Data Attribute Targeting

```css
/* Style specific columns */
td[data-column-key="price"] {
  text-align: right;
  font-weight: 600;
}

td[data-column-key="status"] {
  text-align: center;
}

/* Style specific rows */
tr[data-row-index="0"] {
  font-weight: 600; /* First row bold */
}
```

## Comparison with mat-table

| Feature | InteropTable (Bedrock) | mat-table |
|---------|------------------------|-----------|
| **Setup** | Zero config works | Requires displayedColumns + dataSource |
| **TypeScript** | Full generics | Limited type safety |
| **HTML** | Semantic `<table>` | Custom elements |
| **Styling** | Completely unstyled | Heavy default styling |
| **Bundle size** | Minimal | Large |
| **Data binding** | Any iterable | MatTableDataSource required |
| **States** | Built-in (unstyled) | Manual implementation |
| **Learning curve** | Minimal | Steep |

## Advantages of Bedrock Approach

### 🚀 **Performance**
- Smaller bundle size
- No unused CSS
- Signal-based reactivity
- Efficient TrackBy functions

### 🎨 **Styling Freedom**
- No CSS to override
- Use any framework (Tailwind, Bootstrap, custom)
- Complete design control
- Easy theming

### 🛠️ **Developer Experience**
- Minimal API surface
- Type-safe column definitions
- Auto-generated columns work immediately
- Semantic HTML structure

### ♿ **Accessibility**
- Proper table semantics
- Screen reader friendly
- Keyboard navigation ready
- High contrast compatible

## Future Iterations

The bedrock component will be expanded iteratively:

1. **Phase 2**: Custom cell templates
2. **Phase 3**: Advanced formatting functions
3. **Phase 4**: Sorting capabilities
4. **Phase 5**: Filtering integration
5. **Phase 6**: Pagination support

Each addition will maintain the unstyled philosophy and not break existing usage.

## Migration from mat-table

```typescript
// Before (mat-table)
@Component({
  template: `
    <mat-table [dataSource]="dataSource">
      <ng-container matColumnDef="name">
        <mat-header-cell *matHeaderCellDef>Name</mat-header-cell>
        <mat-cell *matCellDef="let user">{{user.name}}</mat-cell>
      </ng-container>
      <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
      <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
    </mat-table>
  `
})
export class OldComponent {
  displayedColumns = ['name', 'email'];
  dataSource = new MatTableDataSource(this.users);
}

// After (InteropTable)
@Component({
  template: `<table interop-table [collection]="users"></table>`
})
export class NewComponent {
  users = [...]; // Just your data, no wrapper needed
}
```

**Result**: 90% less boilerplate, better TypeScript support, complete styling control.