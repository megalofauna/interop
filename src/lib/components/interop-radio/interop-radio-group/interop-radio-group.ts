import {
  Component,
  input,
  output,
  computed,
  signal,
  effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { InteropRadioControl } from "../interop-radio-control/interop-radio-control";
import { ElementRef, inject } from "@angular/core";

export type RadioControl = {
  id: string;
  name?: string;
  value: string | number | boolean;
  label: string;
  disabled?: boolean;
  required?: boolean;
};

/**
 * InteropRadioGroup - Flexible container component for managing groups of radio inputs.
 *
 * This component supports two **structural modes** and two **content modes**, giving you
 * maximum flexibility while encouraging accessibility best practices.
 *
 * ## STRUCTURAL MODES
 *
 * ### 1. Hands-off Mode (Recommended)
 * Use `<interop-radio-group>` element selector. The component provides a complete,
 * accessible fieldset structure with legend support. This is the recommended approach
 * as it follows WCAG guidelines for radio group accessibility.
 *
 * ### 2. Custom Mode (Advanced)
 * Use `<your-element interop-radio-group>` attribute selector. You provide your own
 * container structure, giving you complete control over markup and styling. The component
 * only provides the logic - no structural opinions.
 *
 * ## CONTENT MODES
 *
 * ### 1. Declarative Mode
 * Pass an array of `RadioControl` objects via the `controls` input. The component
 * generates all radio inputs automatically.
 *
 * ### 2. Content Projection Mode
 * Use `<ng-content>` to project your own radio button layouts. Mix and match with
 * custom HTML structures, activation handlers, and complex styling.
 *
 * ## FEATURES
 * - Angular Forms integration (ControlValueAccessor)
 * - Automatic name coordination for radio groups
 * - Flexible container structure (fieldset provided or user-defined)
 * - Two-way data binding with selected value tracking
 * - Integration with InteropRadio components
 * - Accessibility-first design with WCAG compliance in hands-off mode
 * - Support for complex custom layouts in custom mode
 *
 * @example HANDS-OFF + DECLARATIVE: Complete fieldset with auto-generated radios
 * ```html
 * <interop-radio-group
 *   [controls]="sizeOptions"
 *   [groupName]="'size'"
 *   [legend]="'Choose your size'"
 *   [(value)]="selectedSize">
 * </interop-radio-group>
 * ```
 *
 * ```typescript
 * export class MyComponent {
 *   selectedSize = signal<string>('medium');
 *
 *   sizeOptions: RadioControl[] = [
 *     { id: 'size-small', value: 'small', label: 'Small' },
 *     { id: 'size-medium', value: 'medium', label: 'Medium' },
 *     { id: 'size-large', value: 'large', label: 'Large' }
 *   ];
 * }
 * ```
 *
 * @example HANDS-OFF + CONTENT PROJECTION: Fieldset with custom radio layouts
 * ```html
 * <interop-radio-group
 *   [groupName]="'plan'"
 *   [legend]="'Select your plan'"
 *   [(value)]="selectedPlan">
 *
 *   <label interop-radio id="basic" name="plan" value="basic" class="plan-option">
 *     <span class="plan-name">Basic Plan</span>
 *     <span class="plan-price">$9/month</span>
 *     <span class="plan-features">Up to 10 projects</span>
 *   </label>
 *
 *   <label interop-radio id="premium" name="plan" value="premium" class="plan-option">
 *     <span class="plan-name">Premium Plan</span>
 *     <span class="plan-price">$19/month</span>
 *     <span class="plan-features">Unlimited projects</span>
 *   </label>
 * </interop-radio-group>
 * ```
 *
 * @example CUSTOM + DECLARATIVE: Your container with auto-generated radios
 * ```html
 * <div class="settings-panel" interop-radio-group
 *      [controls]="themeOptions"
 *      [groupName]="'theme'"
 *      [(value)]="selectedTheme">
 *   <header>
 *     <h2>Theme Preferences</h2>
 *     <p>Choose your preferred appearance</p>
 *   </header>
 *   <!-- Radio controls will be generated here -->
 * </div>
 * ```
 *
 * @example CUSTOM + CONTENT PROJECTION: Complete control over structure
 * ```html
 * <section class="payment-section" interop-radio-group
 *          [groupName]="'payment'"
 *          [(value)]="selectedPayment">
 *
 *   <div class="section-header">
 *     <h3>Payment Method</h3>
 *     <p>How would you like to pay?</p>
 *   </div>
 *
 *   <div class="payment-grid">
 *     <label interop-radio id="card" name="payment" value="card" class="payment-card">
 *       <div class="payment-icon">💳</div>
 *       <div class="payment-details">
 *         <span class="payment-title">Credit Card</span>
 *         <span class="payment-desc">Visa, MasterCard, Amex</span>
 *       </div>
 *     </label>
 *
 *     <label interop-radio id="paypal" name="payment" value="paypal" class="payment-card">
 *       <div class="payment-icon">💰</div>
 *       <div class="payment-details">
 *         <span class="payment-title">PayPal</span>
 *         <span class="payment-desc">Pay with your PayPal account</span>
 *       </div>
 *     </label>
 *   </div>
 * </section>
 * ```
 *
 * @example REACTIVE FORMS INTEGRATION: Works with both modes
 * ```html
 * <form [formGroup]="settingsForm">
 *   <!-- Hands-off mode with reactive forms -->
 *   <interop-radio-group
 *     formControlName="notifications"
 *     [controls]="notificationOptions"
 *     [groupName]="'notifications'"
 *     [legend]="'Email Notifications'"
 *     [required]="true">
 *   </interop-radio-group>
 *
 *   <!-- Custom mode with reactive forms -->
 *   <fieldset class="custom-fieldset" interop-radio-group
 *             formControlName="privacy"
 *             [groupName]="'privacy'">
 *     <legend>Privacy Settings</legend>
 *     <label interop-radio id="public" name="privacy" value="public">
 *       Public Profile
 *     </label>
 *     <label interop-radio id="private" name="privacy" value="private">
 *       Private Profile
 *     </label>
 *   </fieldset>
 * </form>
 * ```
 *
 * ## WHEN TO USE WHICH MODE
 *
 * **Use Hands-off Mode When:**
 * - You want accessibility best practices out of the box
 * - You need a standard radio group with minimal customization
 * - You're building forms quickly and don't need complex layouts
 * - You want semantic HTML (fieldset/legend) without thinking about it
 *
 * **Use Custom Mode When:**
 * - You need complex custom layouts (grids, cards, etc.)
 * - You're integrating with existing design systems
 * - You have specific accessibility requirements beyond fieldset/legend
 * - You need to embed radio groups within other complex structures
 * - You want complete control over the DOM structure
 */
@Component({
  selector:
    "interop-radio-group, [interop-radio-group]:not(interop-radio-group)",
  standalone: true,
  imports: [CommonModule, InteropRadioControl],
  templateUrl: "./interop-radio-group.html",
  styleUrl: "./interop-radio-group.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InteropRadioGroup,
      multi: true,
    },
  ],
})
export class InteropRadioGroup implements ControlValueAccessor {
  private hostElement = inject(ElementRef<HTMLElement>);
  /**
   * Array of radio control configurations for declarative mode.
   * When provided, the component will generate radio inputs automatically.
   */
  controls = input<RadioControl[]>();

  /**
   * The name attribute for the radio group.
   * All radio inputs in the group will share this name.
   */
  groupName = input.required<string>();

  /**
   * Optional legend text for the fieldset.
   * Improves accessibility by describing the radio group's purpose.
   */
  legend = input<string>();

  /**
   * The currently selected value in the radio group.
   */
  value = input<string | number | boolean | null>(null);

  /**
   * Whether the entire radio group is disabled.
   */
  disabled = input<boolean>(false);

  /**
   * Whether the radio group is required for form validation.
   */
  required = input<boolean>(false);

  /**
   * CSS class to apply to the fieldset container.
   */
  containerClass = input<string>("");

  // Outputs

  /**
   * Emitted when the selected value changes.
   */
  valueChange = output<string | number | boolean | null>();

  // Internal state for ControlValueAccessor
  private internalValue = signal<string | number | boolean | null>(null);
  private onChangeFn: (value: any) => void = () => {};
  private onTouchedFn: () => void = () => {};

  /**
   * Whether the component is in hands-off mode (using element selector).
   * In hands-off mode, the component provides the complete fieldset structure.
   * In custom mode, the user provides their own container element.
   */
  isHandsOffMode = computed(() => {
    const element = this.hostElement.nativeElement;
    return element.tagName.toLowerCase() === "interop-radio-group";
  });

  /**
   * Whether the component is in declarative mode (has controls input).
   */
  isDeclarativeMode = computed(() => {
    const controls = this.controls();
    return Array.isArray(controls) && controls.length > 0;
  });

  /**
   * The effective value to use (input value or internal value).
   */
  effectiveValue = computed(() => {
    return this.value() ?? this.internalValue();
  });

  constructor() {
    // Sync input value changes with internal state
    effect(() => {
      const inputValue = this.value();
      if (inputValue !== this.internalValue()) {
        this.internalValue.set(inputValue);
      }
    });

    // Emit value changes
    effect(() => {
      const currentValue = this.effectiveValue();
      this.valueChange.emit(currentValue);
      this.onChangeFn(currentValue);
    });
  }

  /**
   * Handle radio selection from child components.
   */
  onRadioChange(selectedValue: string | number | boolean): void {
    this.internalValue.set(selectedValue);
    this.onTouchedFn();
  }

  /**
   * Check if a specific value is currently selected.
   */
  isSelected(value: string | number | boolean): boolean {
    return this.effectiveValue() === value;
  }

  // ControlValueAccessor implementation

  writeValue(value: any): void {
    this.internalValue.set(value);
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // This would typically update a disabled signal
    // For now, we rely on the disabled input
  }
}
