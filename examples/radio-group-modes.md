# InteropRadioGroup Mode Examples

This document demonstrates the different modes available with `InteropRadioGroup`.

## Structural Modes Overview

### Hands-off Mode (Recommended)
- **Selector**: `<interop-radio-group>`
- **Structure**: Complete fieldset with legend provided
- **Best for**: Standard forms, accessibility compliance, quick implementation

### Custom Mode (Advanced)
- **Selector**: `<any-element interop-radio-group>`
- **Structure**: User provides container, component provides logic only
- **Best for**: Complex layouts, design system integration, custom structures

## Content Modes Overview

### Declarative Mode
- Pass `RadioControl[]` array to `controls` input
- Component generates radio inputs automatically

### Content Projection Mode
- Use `<ng-content>` for custom radio layouts
- Full control over markup and styling

---

## Examples by Mode Combination

### 1. Hands-off + Declarative (Most Common)

**Perfect for standard forms with minimal setup:**

```typescript
// Component
export class SettingsComponent {
  selectedTheme = signal<string>('light');
  
  themeOptions: RadioControl[] = [
    { id: 'theme-light', value: 'light', label: 'Light Theme' },
    { id: 'theme-dark', value: 'dark', label: 'Dark Theme' },
    { id: 'theme-auto', value: 'auto', label: 'System Theme' }
  ];
}
```

```html
<!-- Template -->
<interop-radio-group
  [controls]="themeOptions"
  [groupName]="'theme'"
  [legend]="'Choose Theme'"
  [(value)]="selectedTheme">
</interop-radio-group>
```

**Generated HTML:**
```html
<interop-radio-group>
  <fieldset>
    <legend>Choose Theme</legend>
    <label class="radio-control" interop-radio id="theme-light" name="theme" value="light">
      <input type="radio" id="theme-light" name="theme" value="light">
      Light Theme
    </label>
    <label class="radio-control" interop-radio id="theme-dark" name="theme" value="dark">
      <input type="radio" id="theme-dark" name="theme" value="dark">
      Dark Theme
    </label>
    <label class="radio-control" interop-radio id="theme-auto" name="theme" value="auto">
      <input type="radio" id="theme-auto" name="theme" value="auto">
      System Theme
    </label>
  </fieldset>
</interop-radio-group>
```

---

### 2. Hands-off + Content Projection

**Perfect for custom radio layouts within standard fieldset:**

```html
<interop-radio-group
  [groupName]="'plan'"
  [legend]="'Select Plan'"
  [(value)]="selectedPlan">

  <label interop-radio id="basic" name="plan" value="basic" class="plan-card">
    <div class="plan-header">
      <h4>Basic Plan</h4>
      <span class="price">$9/month</span>
    </div>
    <ul class="features">
      <li>Up to 5 projects</li>
      <li>1GB storage</li>
      <li>Email support</li>
    </ul>
  </label>

  <label interop-radio id="premium" name="plan" value="premium" class="plan-card">
    <div class="plan-header">
      <h4>Premium Plan</h4>
      <span class="price">$19/month</span>
    </div>
    <ul class="features">
      <li>Unlimited projects</li>
      <li>10GB storage</li>
      <li>Priority support</li>
    </ul>
  </label>

</interop-radio-group>
```

---

### 3. Custom + Declarative

**Perfect for integrating into existing design systems:**

```html
<div class="settings-panel" interop-radio-group
     [controls]="notificationOptions"
     [groupName]="'notifications'"
     [(value)]="selectedNotification">

  <header class="panel-header">
    <h2>Notification Settings</h2>
    <p>Choose how you'd like to be notified</p>
  </header>

  <!-- Radio controls will be generated here by the component -->

  <footer class="panel-footer">
    <small>You can change this setting anytime in your profile.</small>
  </footer>
</div>
```

```typescript
// Component
export class NotificationComponent {
  selectedNotification = signal<string>('email');
  
  notificationOptions: RadioControl[] = [
    { id: 'notif-email', value: 'email', label: 'Email notifications' },
    { id: 'notif-push', value: 'push', label: 'Push notifications' },
    { id: 'notif-none', value: 'none', label: 'No notifications' }
  ];
}
```

---

### 4. Custom + Content Projection (Maximum Flexibility)

**Perfect for complex layouts with complete control:**

```html
<section class="payment-section" interop-radio-group
         [groupName]="'payment'"
         [(value)]="selectedPayment">

  <div class="section-header">
    <h3>Payment Method</h3>
    <p>Select your preferred payment option</p>
  </div>

  <div class="payment-grid">
    <label interop-radio id="card" name="payment" value="card" 
           class="payment-option card-option">
      <div class="payment-icon">
        <svg><!-- Credit card icon --></svg>
      </div>
      <div class="payment-details">
        <span class="method-name">Credit Card</span>
        <span class="method-desc">Visa, MasterCard, Amex</span>
        <div class="security-badges">
          <img src="ssl-badge.svg" alt="SSL Secured">
        </div>
      </div>
      <div class="popular-badge">Most Popular</div>
    </label>

    <label interop-radio id="paypal" name="payment" value="paypal"
           class="payment-option paypal-option">
      <div class="payment-icon">
        <svg><!-- PayPal icon --></svg>
      </div>
      <div class="payment-details">
        <span class="method-name">PayPal</span>
        <span class="method-desc">Pay with your PayPal account</span>
      </div>
    </label>

    <label interop-radio id="crypto" name="payment" value="crypto"
           class="payment-option crypto-option">
      <div class="payment-icon">
        <svg><!-- Bitcoin icon --></svg>
      </div>
      <div class="payment-details">
        <span class="method-name">Cryptocurrency</span>
        <span class="method-desc">Bitcoin, Ethereum, etc.</span>
      </div>
      <div class="new-badge">New!</div>
    </label>
  </div>

  <div class="payment-footer">
    <p>All payments are processed securely and encrypted.</p>
  </div>
</section>
```

---

## Reactive Forms Integration

Works seamlessly with both modes:

```typescript
// Component
export class UserProfileComponent {
  profileForm = this.fb.group({
    theme: ['light', Validators.required],
    notifications: ['email'],
    privacy: ['private', Validators.required]
  });

  themeOptions: RadioControl[] = [
    { id: 'light', value: 'light', label: 'Light Mode' },
    { id: 'dark', value: 'dark', label: 'Dark Mode' }
  ];
}
```

```html
<form [formGroup]="profileForm">
  
  <!-- Hands-off mode with reactive forms -->
  <interop-radio-group
    formControlName="theme"
    [controls]="themeOptions"
    [groupName]="'theme'"
    [legend]="'Display Theme'">
  </interop-radio-group>

  <!-- Custom mode with reactive forms -->
  <div class="custom-section" interop-radio-group
       formControlName="privacy"
       [groupName]="'privacy'">
    <h3>Profile Visibility</h3>
    <label interop-radio id="public" name="privacy" value="public">
      🌍 Public - Anyone can see your profile
    </label>
    <label interop-radio id="private" name="privacy" value="private">
      🔒 Private - Only you can see your profile
    </label>
  </div>

</form>
```

---

## CSS Utility Classes

The component provides utility classes for custom mode:

```html
<!-- Horizontal layout -->
<div class="horizontal" interop-radio-group [groupName]="'size'">
  <label interop-radio id="small" name="size" value="small">Small</label>
  <label interop-radio id="medium" name="size" value="medium">Medium</label>
  <label interop-radio id="large" name="size" value="large">Large</label>
</div>

<!-- Compact spacing -->
<div class="compact" interop-radio-group [groupName]="'priority'">
  <label interop-radio id="low" name="priority" value="low">Low Priority</label>
  <label interop-radio id="high" name="priority" value="high">High Priority</label>
</div>
```

---

## Decision Matrix

| Use Case | Recommended Mode | Why |
|----------|------------------|-----|
| Standard form fields | Hands-off + Declarative | Quick setup, accessibility built-in |
| Custom styled radios | Hands-off + Content Projection | Fieldset accessibility + custom styling |
| Design system integration | Custom + Declarative | Your container + auto-generated radios |
| Complex layouts | Custom + Content Projection | Maximum control over structure |
| Rapid prototyping | Hands-off + Declarative | Fastest implementation |
| Production apps | Either, based on design needs | Both modes are production-ready |

---

## Accessibility Notes

### Hands-off Mode
- Automatically provides `<fieldset>` and `<legend>`
- Follows WCAG 2.1 guidelines out of the box
- Screen reader friendly
- Keyboard navigation works automatically

### Custom Mode
- **You are responsible for accessibility**
- Consider adding `role="radiogroup"` and `aria-labelledby` to your container
- Ensure proper focus management
- Test with screen readers
- Consider using semantic HTML like `<fieldset>` in your custom container

### Example of Accessible Custom Mode:
```html
<fieldset class="my-radio-group" interop-radio-group [groupName]="'options'">
  <legend>Choose an option</legend>
  <label interop-radio id="opt1" name="options" value="1">Option 1</label>
  <label interop-radio id="opt2" name="options" value="2">Option 2</label>
</fieldset>
```
