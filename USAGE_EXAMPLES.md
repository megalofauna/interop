# InteropIcon Usage Examples

This document provides comprehensive examples for using the InteropIcon component with Phosphor icons in your Angular application.

## Table of Contents

- [Global Registration](#global-registration)
- [Component-Scoped Registration](#component-scoped-registration)  
- [Template-Scoped Registration](#template-scoped-registration)
- [Icon Showcase](#icon-showcase)
- [Best Practices](#best-practices)

## Global Registration

Register commonly used icons at the application bootstrap level to make them available throughout your entire app.

### main.ts
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { 
  provideGlobalPhosphorIcons,
  provideAllPhosphorIcons,
  provideCommonPhosphorIcons,
  PhUser, PhSettings, PhHome, PhBell, PhSearch 
} from 'interop';

// Option 1: Register specific icons (recommended)
bootstrapApplication(AppComponent, {
  providers: [
    provideGlobalPhosphorIcons(
      PhUser, PhSettings, PhHome, PhBell, PhSearch
    ),
    // ... other providers
  ]
});

// Option 2: Register all icons (async - increases bundle size)
async function bootstrapWithAllIcons() {
  const iconProviders = await provideAllPhosphorIcons();
  bootstrapApplication(AppComponent, {
    providers: [
      ...iconProviders,
      // ... other providers
    ]
  });
}
// bootstrapWithAllIcons();

// Option 3: Register common icons (async - good balance)
async function bootstrapWithCommonIcons() {
  const iconProviders = await provideCommonPhosphorIcons();
  bootstrapApplication(AppComponent, {
    providers: [
      ...iconProviders,
      // ... other providers
    ]
  });
}
// bootstrapWithCommonIcons();
```

## Component-Scoped Registration

Register icons that are specific to a component or feature area. These icons are only available within that component's tree.

### user-profile.component.ts
```typescript
import { Component } from '@angular/core';
import { InteropIconComponent, provideScopedPhosphorIcons } from 'interop';
import { PhUserCircle, PhEdit, PhTrash, PhCamera } from 'interop';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [InteropIconComponent],
  providers: [
    // These icons are only available within this component tree
    provideScopedPhosphorIcons(PhUserCircle, PhEdit, PhTrash, PhCamera)
  ],
  template: `
    <div class="user-profile">
      <div class="avatar">
        <interop-icon 
          name="user-circle" 
          [size]="64"
          color="#6366f1"
          [decorative]="true">
        </interop-icon>
        
        <button class="edit-avatar">
          <interop-icon 
            name="camera" 
            [size]="16"
            ariaLabel="Change profile picture">
          </interop-icon>
        </button>
      </div>
      
      <div class="actions">
        <button class="edit-btn">
          <interop-icon name="edit" [size]="20"></interop-icon>
          Edit Profile
        </button>
        
        <button class="delete-btn">
          <interop-icon 
            name="trash" 
            [size]="20" 
            color="#ef4444"
            ariaLabel="Delete account">
          </interop-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .user-profile {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
    }
    
    .avatar {
      position: relative;
      margin-bottom: 1rem;
    }
    
    .edit-avatar {
      position: absolute;
      bottom: 0;
      right: 0;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 50%;
      padding: 0.5rem;
      cursor: pointer;
    }
    
    .actions {
      display: flex;
      gap: 1rem;
    }
    
    .edit-btn, .delete-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      cursor: pointer;
    }
    
    .delete-btn:hover {
      background: #fef2f2;
      border-color: #fca5a5;
    }
  `]
})
export class UserProfileComponent { }
```

## Template-Scoped Registration

Use the `iconScope` directive to register icons for specific DOM subtrees, providing fine-grained control over icon availability.

### navigation.component.ts
```typescript
import { Component } from '@angular/core';
import { InteropIconComponent, IconScopeDirective } from 'interop';
import { 
  PhHouse, PhGear, PhBell, PhUser, PhSignOut,
  PhChartBar, PhFolder, PhMessage
} from 'interop';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [InteropIconComponent, IconScopeDirective],
  template: `
    <!-- Main navigation with globally registered icons -->
    <nav class="main-nav">
      <interop-icon name="home" [size]="24"></interop-icon>
      <interop-icon name="settings" [size]="24"></interop-icon>
      <interop-icon name="bell" [size]="24"></interop-icon>
      <interop-icon name="user" [size]="24"></interop-icon>
    </nav>
    
    <!-- Admin section with scoped icons -->
    <div iconScope [icons]="adminIcons" class="admin-section">
      <h3>Admin Tools</h3>
      <nav class="admin-nav">
        <a href="/admin/analytics">
          <interop-icon name="chart-bar" [size]="20"></interop-icon>
          Analytics
        </a>
        <a href="/admin/files">
          <interop-icon name="folder" [size]="20"></interop-icon>
          File Manager
        </a>
        <a href="/admin/messages">
          <interop-icon name="message" [size]="20"></interop-icon>
          Messages
        </a>
      </nav>
    </div>
    
    <!-- Dynamic icon loading by name -->
    <div iconScope [iconNames]="['house', 'sign-out']" class="footer">
      <button>
        <interop-icon name="house" [size]="16"></interop-icon>
        Home
      </button>
      <button>
        <interop-icon name="sign-out" [size]="16"></interop-icon>
        Sign Out
      </button>
    </div>
  `,
  styles: [`
    .main-nav {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .admin-section {
      margin: 2rem 0;
      padding: 1rem;
      background: #fef7ff;
      border: 1px solid #e879f9;
      border-radius: 0.5rem;
    }
    
    .admin-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .admin-nav a {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      text-decoration: none;
      color: #7c3aed;
      border-radius: 0.25rem;
    }
    
    .admin-nav a:hover {
      background: #f3e8ff;
    }
    
    .footer {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      cursor: pointer;
    }
  `]
})
export class NavigationComponent {
  // Icons for the admin section (template-scoped)
  adminIcons = [PhChartBar, PhFolder, PhMessage];
}
```

## Icon Showcase

Comprehensive example showing all InteropIcon properties and features.

### icon-showcase.component.ts
```typescript
import { Component } from '@angular/core';
import { InteropIconComponent, provideScopedPhosphorIcons } from 'interop';
import { PhHeart, PhStar, PhWarning, PhCheck } from 'interop';

@Component({
  selector: 'app-icon-showcase',
  standalone: true,
  imports: [InteropIconComponent],
  providers: [
    provideScopedPhosphorIcons(PhHeart, PhStar, PhWarning, PhCheck)
  ],
  template: `
    <div class="showcase">
      <h2>Icon Showcase</h2>
      
      <!-- Different sizes -->
      <section class="size-demo">
        <h3>Sizes</h3>
        <interop-icon name="heart" [size]="16"></interop-icon>
        <interop-icon name="heart" [size]="24"></interop-icon>
        <interop-icon name="heart" [size]="32"></interop-icon>
        <interop-icon name="heart" [size]="48"></interop-icon>
        <interop-icon name="heart" [size]="64"></interop-icon>
      </section>
      
      <!-- Different colors -->
      <section class="color-demo">
        <h3>Colors</h3>
        <interop-icon name="star" [size]="32" color="#fbbf24"></interop-icon>
        <interop-icon name="star" [size]="32" color="#ef4444"></interop-icon>
        <interop-icon name="star" [size]="32" color="#22c55e"></interop-icon>
        <interop-icon name="star" [size]="32" color="#3b82f6"></interop-icon>
        <interop-icon name="star" [size]="32" color="#8b5cf6"></interop-icon>
      </section>
      
      <!-- Different stroke weights -->
      <section class="stroke-demo">
        <h3>Stroke Weights</h3>
        <interop-icon name="warning" [size]="32" [strokeWidth]="1"></interop-icon>
        <interop-icon name="warning" [size]="32" [strokeWidth]="1.5"></interop-icon>
        <interop-icon name="warning" [size]="32" [strokeWidth]="2"></interop-icon>
        <interop-icon name="warning" [size]="32" [strokeWidth]="2.5"></interop-icon>
      </section>
      
      <!-- Accessibility examples -->
      <section class="a11y-demo">
        <h3>Accessibility</h3>
        
        <!-- Decorative icon (no screen reader announcement) -->
        <div class="item">
          <interop-icon 
            name="check" 
            [size]="20" 
            color="#22c55e"
            [decorative]="true">
          </interop-icon>
          <span>Task completed</span>
        </div>
        
        <!-- Interactive icon with aria-label -->
        <button class="icon-button">
          <interop-icon 
            name="heart" 
            [size]="20"
            ariaLabel="Add to favorites">
          </interop-icon>
        </button>
        
        <!-- Icon not found (shows fallback) -->
        <interop-icon name="non-existent-icon" [size]="24"></interop-icon>
      </section>
    </div>
  `,
  styles: [`
    .showcase {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .showcase section {
      margin-bottom: 2rem;
      padding: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
    }
    
    .showcase h3 {
      margin: 0 0 1rem 0;
      color: #374151;
    }
    
    .size-demo, .color-demo, .stroke-demo {
      display: flex;
      flex-direction: column;
    }
    
    .size-demo > interop-icon,
    .color-demo > interop-icon,
    .stroke-demo > interop-icon {
      margin-right: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .size-demo {
      align-items: flex-start;
    }
    
    .color-demo, .stroke-demo {
      flex-direction: row;
      align-items: center;
    }
    
    .a11y-demo .item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .icon-button {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      cursor: pointer;
      margin-bottom: 1rem;
    }
    
    .icon-button:hover {
      background: #f9fafb;
    }
  `]
})
export class IconShowcaseComponent { }
```

## App Component Integration

### app.component.ts
```typescript
import { Component } from '@angular/core';
import { UserProfileComponent } from './user-profile.component';
import { NavigationComponent } from './navigation.component';
import { IconShowcaseComponent } from './icon-showcase.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    UserProfileComponent,
    NavigationComponent,
    IconShowcaseComponent
  ],
  template: `
    <div class="app">
      <app-navigation></app-navigation>
      <main>
        <app-user-profile></app-user-profile>
        <app-icon-showcase></app-icon-showcase>
      </main>
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
    }
    
    main {
      padding: 2rem;
    }
  `]
})
export class AppComponent { }
```

## Best Practices

### Icon Registration Strategy

1. **Global Icons**: Register 5-10 most commonly used icons globally (home, user, settings, search, etc.)
2. **Component-Scoped**: Register feature-specific icons at the component level
3. **Template-Scoped**: Use for admin panels, dashboards, or specialized UI sections
4. **Dynamic Loading**: Use `iconNames` array for icons loaded based on user roles or permissions

### Accessibility Guidelines

```typescript
// ✅ Good: Decorative icon with descriptive text
<interop-icon name="star" [decorative]="true"></interop-icon>
<span>Premium Feature</span>

// ✅ Good: Semantic icon with aria-label
<interop-icon 
  name="warning" 
  [decorative]="false"
  ariaLabel="Warning: Invalid input">
</interop-icon>

// ❌ Bad: Non-decorative icon without aria-label
<interop-icon name="error" [decorative]="false"></interop-icon>
```

### Performance Tips

1. **Tree Shaking**: Only import icons you actually use
2. **Bundle Splitting**: Use dynamic imports for large icon sets
3. **Component Scoping**: Avoid registering all icons globally
4. **Lazy Loading**: Use `iconNames` for conditional icon loading

### Naming Conventions

- Icon names use kebab-case: `user-circle`, `chart-bar`, `sign-out`
- Export names use PascalCase with Ph prefix: `PhUserCircle`, `PhChartBar`, `PhSignOut`
- Component registration automatically converts between formats

## Key Features Demonstrated

1. **Multiple Registration Patterns**: Global, component-scoped, and template-scoped
2. **Dynamic Loading**: Loading icons by name strings
3. **Size Control**: Pixel-based sizing (16, 24, 32, 48, 64)
4. **Color Customization**: CSS color values and currentColor
5. **Stroke Weight Control**: Adjusting line thickness
6. **Accessibility Support**: Proper use of `decorative` and `ariaLabel`
7. **Fallback Behavior**: Graceful handling of missing icons
8. **Modern Angular**: Uses new control flow syntax (@if, @for, @switch)

This comprehensive example demonstrates a production-ready implementation covering all major use cases for the Phosphor icon integration with the InteropIcon component.