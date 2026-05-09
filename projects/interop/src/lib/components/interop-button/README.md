# InteropButton - Flexible Content Positioning

The `InteropButton` component provides enhanced button functionality with flexible content positioning, activation guardrails, and semantic HTML enforcement.

## Key Features

- **Flexible Icon Positioning**: Control icon placement through DOM source order
- **Activation Guardrails**: Built-in debounce, throttle, and reentrancy protection
- **Cross-Component Coordination**: Global activation management via `ActivationManagerService`
- **Loading States**: Automatic loading state management with custom content
- **Semantic HTML**: Enforces proper `<button>` element usage
- **Content Projection**: Multiple slots for flexible content composition

## Flexible Icon Positioning

The component uses **flexbox with column-gap** for internal layout, allowing you to control icon placement simply by changing the source order in your template.

### Icon Before Text (Traditional)

```html
<button interop-button [onActivate]="save">
  <span class="icon">💾</span>
  Save Document
</button>
```

### Icon After Text (Modern/Trailing)

```html
<button interop-button [onActivate]="save">
  Save Document
  <span class="icon">💾</span>
</button>
```

### Text Only (No Icon)

```html
<button interop-button [onActivate]="submit">
  Submit Form
</button>
```

## Layout System

The component uses CSS flexbox with the following properties:

- `display: inline-flex`
- `align-items: center`
- `column-gap: 0.5rem` (adjustable via CSS)

This ensures consistent spacing regardless of content configuration while preserving source order for natural reading flow.

## Content Projection

### Available Content Types

| Content Type | Purpose | When Visible |
|--------------|---------|--------------|
| Default content | All button content including icons and text | When not loading |
| `slot="loading"` | Custom loading content | When `loading=true` |

### Icon Styling

Icons can be styled using CSS classes or attributes. Common approaches:
- `class="icon"` for semantic icon styling
- Icon fonts or SVG elements
- Emoji or Unicode symbols

### Loading State Behavior

During loading (`loading=true`):
- **Hidden**: Icon slot and default content
- **Shown**: Loading slot content (or default loading text)

```html
<button interop-button 
        [onActivate]="process" 
        [loading]="isProcessing">
  <span class="icon">⚡</span>
  <span slot="loading">Processing...</span>
  Quick Action
</button>
```

## Complex Content Examples

### Multiple Elements with Icon

```html
<!-- Icon before multiple content elements -->
<button interop-button [onActivate]="complexAction">
  <span class="icon">🔔</span>
  <strong>Notifications</strong>
  <span class="badge">3</span>
</button>

<!-- Icon after multiple content elements -->
<button interop-button [onActivate]="navigate">
  <span class="badge">5</span>
  <strong>Messages</strong>
  <span class="icon">✉️</span>
</button>
```

### Keyboard Shortcuts and Labels

```html
<button interop-button [onActivate]="quickAction">
  <span class="icon">⚡</span>
  <strong>Quick Action</strong>
  <small>(Ctrl+Q)</small>
</button>
```

## Activation Patterns

### Local Activation (Component-Specific)

```html
<button interop-button [onActivate]="saveDocument">
  <span class="icon">💾</span>
  Save
</button>
```

### Global Activation (Cross-Component)

First, register a handler with `ActivationManagerService`:

```typescript
constructor(private activationManager: ActivationManagerService) {
  this.activationManager.register('save', () => this.saveDocument());
}
```

Then use it from multiple locations:

```html
<!-- Header -->
<button interop-button activationId="save">
  <span class="icon">💾</span>
  Save
</button>

<!-- Toolbar -->
<button interop-button activationId="save">
  Save
  <span class="icon">💾</span>
</button>
```

## Activation Options

Control activation behavior with guardrails:

```html
<button interop-button 
        [onActivate]="submit"
        [activationOptions]="{
          debounceMs: 250,
          throttleMs: 1000,
          reentrant: false,
          once: false
        }">
  <span class="icon">📤</span>
  Submit Form
</button>
```

### Available Options

- `debounceMs`: Delay execution until quiet period
- `throttleMs`: Limit execution frequency
- `reentrant`: Allow overlapping executions
- `once`: Execute only once, then disable

## Styling and Theming

The component provides minimal base styles and relies on CSS custom properties for theming:

```css
/* Override default gap */
button[interop-button] {
  column-gap: 0.75rem;
}

/* Icon-specific styling */
button[interop-button] .icon {
  font-size: 1.2em;
  opacity: 0.8;
}

/* Loading state styling */
button[interop-button] [slot="loading"] {
  font-style: italic;
  opacity: 0.9;
}
```

## Accessibility Considerations

### Semantic HTML
- Must be used on `<button>` elements
- Maintains native button semantics and behavior
- Preserves keyboard navigation and focus management

### Reading Order
- Content is projected in natural DOM source order
- Screen readers announce content in logical sequence
- Icon position follows document flow

### Loading States
- Loading content replaces main content
- Maintains button role and accessibility

## Best Practices

### 1. Icon Placement Guidelines

**Use icon before text for:**
- Actions (Save, Delete, Open)
- Clear visual metaphors (📁 Open, 💾 Save)
- Primary actions in forms

**Use icon after text for:**
- Navigation (Go to Settings →)
- External links (Visit Website 🔗)
- Expansion/disclosure (Show More ▼)

### 2. Loading States

```html
<!-- Good: Specific loading message -->
<button interop-button [loading]="isSaving">
  <span slot="loading">Saving changes...</span>
  Save Document
</button>

```html
<!-- Good: Preserve icon context during loading -->
<button interop-button [loading]="isUploading">
  <span class="icon">⬆️</span>
  <span slot="loading">Uploading file...</span>
  Upload
</button>
```

### 3. Content Organization

```html
<!-- Good: Logical content hierarchy -->
<button interop-button>
  <span class="icon">🔔</span>
  <strong>Notifications</strong>
  <span class="count">3 unread</span>
</button>

<!-- Avoid: Too much content -->
<button interop-button>
  <span class="icon">📧</span>
  <strong>Email</strong>
  <span>John Doe</span>
  <span>Subject: Meeting</span>
  <small>2 minutes ago</small>
</button>
```

## Migration from Standard Buttons

### Before (Standard Button)
```html
<button (click)="save()">
  <i class="icon-save"></i>
  Save Document
</button>
```

### After (InteropButton)
```html
<button interop-button [onActivate]="save">
  <span class="icon">💾</span>
  Save Document
</button>
```

## Testing

The component includes comprehensive tests for:
- Flexible positioning behavior
- Content projection in various configurations
- Loading state transitions
- Activation handling
- Accessibility compliance

Run tests with:
```bash
npm test -- --grep "InteropButton"
```

## API Reference

See the generated TypeDoc documentation for complete API details including all inputs, outputs, and method signatures.