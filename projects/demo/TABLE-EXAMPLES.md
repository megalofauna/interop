# InteropTable Demo Examples

This document showcases the InteropTable component examples available in the demo app, demonstrating the superior developer experience compared to Angular Material's mat-table.

## Available Examples

### 1. Auto-Generated Columns
**Location**: First demo card
**Description**: Pass data and get a working table with zero configuration
```html
<table interop-table [collection]="users()"></table>
```
**Features**:
- Automatic column generation from object properties
- Smart key-to-label formatting (camelCase → "Camel Case")
- No boilerplate required

### 2. Custom Columns
**Location**: Second demo card
**Description**: Define column labels, formatting, and styling
```typescript
basicEmployeeColumns: TableColumn<Employee>[] = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "department", label: "Department" },
  {
    key: "active",
    label: "Status",
    format: (value: boolean) => (value ? "Active" : "Inactive"),
  },
];
```
**Features**:
- Custom column labels
- Value formatting functions
- Type-safe column definitions

### 3. Advanced Formatting
**Location**: Third demo card
**Description**: Custom formatting, width control, and alignment
```typescript
detailedEmployeeColumns: TableColumn<Employee>[] = [
  { key: "id", label: "ID", width: "60px", class: "interop-table-center" },
  {
    key: "firstName",
    label: "Full Name",
    getValue: (emp: Employee) => `${emp.firstName} ${emp.lastName}`,
  },
  {
    key: "salary",
    label: "Salary",
    format: (value: number) => `$${value.toLocaleString()}`,
    class: "interop-table-numeric",
  },
];
```
**Features**:
- Custom value extraction with `getValue`
- Number formatting with locale support
- CSS class application for alignment
- Column width control
- Row limiting with `maxRows`

### 4. Observable Data
**Location**: Fourth demo card
**Description**: Seamless async data handling with loading states
```typescript
productsObservable = timer(1500).pipe(
  map(() => [
    { id: "p1", name: "Laptop Pro", price: 1299, category: "Electronics", inStock: true, rating: 4.5 },
    // ... more products
  ])
);
```
**Features**:
- Automatic loading state display
- Observable data source support
- Custom loading text
- Error state handling

### 5. Custom Templates
**Location**: Fifth demo card
**Description**: Full template flexibility for complex layouts
```html
<ng-template #nameTemplate let-value let-item="item">
  <div class="employee-name">
    <strong>{{ item.firstName }} {{ item.lastName }}</strong>
    <small>{{ item.email }}</small>
  </div>
</ng-template>
```
**Features**:
- Rich HTML content in cells
- Template context with value, item, index, column
- Interactive elements (buttons, forms, etc.)
- Custom styling within cells

### 6. Collection Integration
**Location**: Sixth demo card
**Description**: Works seamlessly with InteropCollectionService
```typescript
employeeCollection = this.collectionService.create({
  source: [] as Employee[],
  loading: false,
});
```
**Features**:
- Real-time data updates
- Collection state management
- Dynamic add/remove operations
- Reactive data binding

### 7. Empty & Error States
**Location**: Seventh demo card
**Description**: Built-in states with customization options
```html
<table interop-table [collection]="[]" emptyText="No employees found">
  <div slot="empty" class="custom-empty">
    <h4>🏢 No employees yet</h4>
    <p>Start by adding your first employee</p>
    <button interop-button (click)="addEmployee()">Add First Employee</button>
  </div>
</table>
```
**Features**:
- Custom empty state content
- Slot-based content projection
- Interactive empty states
- Default fallback messages

### 8. Responsive Design
**Location**: Eighth demo card
**Description**: Mobile-friendly with stack layout option
```html
<table interop-table 
       class="mobile-stack interop-table-striped"
       [collection]="employees()"
       [columns]="detailedEmployeeColumns()">
</table>
```
**Features**:
- Automatic responsive behavior
- Mobile stack layout option
- Zebra striping theme
- CSS custom property theming

## Key Advantages Over mat-table

### Developer Experience
| Feature | InteropTable | mat-table |
|---------|--------------|-----------|
| Column definition | Simple object array | Complex displayedColumns + templates |
| Data binding | Any iterable | MatTableDataSource required |
| TypeScript support | Full generics | Limited, lots of `any` |
| Loading states | Built-in | Manual implementation |
| Empty states | Built-in with slots | Manual implementation |
| Boilerplate | Minimal | Extensive |

### Code Comparison

**InteropTable**:
```html
<table interop-table [collection]="users" [columns]="columns"></table>
```

**mat-table**:
```html
<mat-table [dataSource]="dataSource">
  <ng-container matColumnDef="name">
    <mat-header-cell *matHeaderCellDef>Name</mat-header-cell>
    <mat-cell *matCellDef="let user">{{user.name}}</mat-cell>
  </ng-container>
  <!-- Repeat for each column... -->
  <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
  <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
</mat-table>
```

### Performance Benefits
- Signal-based reactivity for fine-grained updates
- Efficient collection handling with InteropCollectionService
- Optimized TrackBy functions for minimal DOM manipulation
- Lazy loading support for large datasets

### Accessibility Features
- Semantic HTML table structure
- Proper ARIA attributes
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support

## Interactive Demo Features

The demo includes several interactive examples:

1. **Add/Remove Employees**: Test dynamic data updates
2. **Toggle Status**: Interactive cell content with state management  
3. **Real-time Updates**: Collection service integration
4. **Responsive Testing**: Resize browser to see mobile layout
5. **Loading Simulation**: Observable data with delay
6. **Error Handling**: Built-in error state display

## Running the Demo

```bash
# Build the library
npm run build

# Serve the demo
ng serve demo

# Open browser to http://localhost:4200
```

The demo showcases how InteropTable provides a significantly better developer experience while maintaining all the functionality needed for professional data display applications.