import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  isDevMode,
  signal,
  afterNextRender,
} from "@angular/core";
import { InteropVisimorph } from "../../interop-visimorph/interop-visimorph";
import {
  InteropActivation,
  type ActivationRegistration,
} from "../../../services/interop-activation.service";
import {
  InteropAttribute,
  PresetKey,
  SetAttrsConfig,
} from "../../../services/interop-attribute.service";
import {
  createActivationHandler,
  type ActivationHandler,
  type ActivationOptions,
  type ManagedActivation,
} from "../../../utils/activation";

/**
 * InteropRadioControl - Enhanced radio input component with activation guardrails and coordination.
 *
 * This component provides robust radio input management, state handling, and cross-component
 * coordination while enforcing semantic HTML practices. It must be used on `<label>` elements
 * and automatically generates the radio input within the label for proper accessibility.
 *
 * Key features:
 * - Activation guardrails (debounce, throttle, reentrancy prevention)
 * - Cross-component coordination via InteropActivation
 * - Built-in disabled state management
 * - Proper radio group coordination via name attribute
 * - Form integration with value and checked state management
 * - Semantic conformity presets for edge cases
 * - Automatic input generation within label for clean DOM structure
 *
 * @example Basic usage
 * ```html
 * <label interop-radio
 *        [id]="'option-1'"
 *        [name]="'size'"
 *        [value]="'small'">
 *   Small Size
 * </label>
 * ```
 *
 * @example With activation handler and form integration
 * ```html
 * <label interop-radio
 *        [id]="'option-premium'"
 *        [name]="'plan'"
 *        [value]="'premium'"
 *        [checked]="selectedPlan() === 'premium'"
 *        [onActivate]="handlePlanSelection"
 *        [activationOptions]="{ throttleMs: 200 }">
 *   Premium Plan - $19/month
 * </label>
 * ```
 *
 * @example Cross-component coordination
 * ```html
 * <label interop-radio
 *        [id]="'theme-dark'"
 *        [name]="'theme'"
 *        [value]="'dark'"
 *        activationId="themeChange">
 *   Dark Theme
 * </label>
 * ```
 *
 * @example Custom styling with input positioning
 * ```html
 * <label interop-radio
 *        [id]="'custom-option'"
 *        [name]="'style'"
 *        [value]="'custom'"
 *        class="custom-radio-label">
 *   <span class="radio-text">Custom Option</span>
 *   <span class="radio-description">With additional details</span>
 * </label>
 * ```
 */
@Component({
  selector: "label[interop-radio]",
  standalone: true,
  imports: [CommonModule, InteropVisimorph],
  template: `
    <input
      #radioInput
      type="radio"
      class="interop-sr-only"
      [id]="id()"
      [name]="name()"
      [value]="value()"
      [checked]="checked()"
      [disabled]="disabled()"
      [required]="required()"
      (change)="onRadioChange($event)"
      (focus)="focused.set(radioInput.matches(':focus-visible'))"
      (blur)="focused.set(false)"
    />
    <interop-visimorph
      [type]="'radio'"
      [checked]="checked()"
      [disabled]="disabled()"
      [focused]="focused()"
    />
    <ng-content></ng-content>
  `,
  styleUrl: "./interop-radio-control.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropRadioControl {
  @ViewChild("radioInput", { static: true })
  private inputElement!: ElementRef<HTMLInputElement>;

  private labelElement = inject(ElementRef<HTMLLabelElement>);
  private activationManager = inject(InteropActivation);
  private attrsManager = inject(InteropAttribute);

  // Core radio input properties

  /**
   * Unique identifier for the radio input.
   * Used for accessibility and form integration.
   */
  id = input.required<string>();

  /**
   * Radio group name attribute for coordinating related radio inputs.
   * All radios with the same name form a mutually exclusive group.
   */
  name = input.required<string>();

  /**
   * The value this radio input represents when selected.
   */
  value = input.required<string | number | boolean>();

  /**
   * Whether this radio input is currently selected/checked.
   */
  checked = input<boolean>(false);

  /**
   * Whether the radio input is disabled.
   */
  disabled = input<boolean>(false);

  /**
   * Whether the radio input is required for form validation.
   */
  required = input<boolean>(false);

  // Activation inputs

  /**
   * Local activation handler for this radio input instance.
   * Called in addition to normal radio selection behavior.
   * Use this for component-specific actions when the radio is selected.
   *
   * @example
   * ```html
   * <label interop-radio
   *        [onActivate]="(value) => trackSelection(value)"
   *        [value]="'premium'">
   *   Premium Option
   * </label>
   * ```
   */
  onActivate = input<ActivationHandler<unknown> | null>(null);

  /**
   * Global activation ID for cross-component coordination.
   * When set, this radio triggers a handler registered with InteropActivation.
   * Prefer this for actions that might be triggered from multiple places in the app.
   *
   * @example
   * ```html
   * <label interop-radio activationId="themeChange" [value]="'dark'">
   *   Dark Theme
   * </label>
   * ```
   */
  activationId = input<string | null>(null);

  /**
   * Payload passed to the activation handler when triggered.
   * Defaults to the radio's value if not specified.
   */
  payload = input<unknown>(undefined);

  /**
   * Activation options for guardrails such as debounce, throttle, and reentrancy prevention.
   * Only applied to local `onActivate` handlers; global handlers configure options during registration.
   *
   * @example
   * ```html
   * <label interop-radio
   *        [onActivate]="handleSelection"
   *        [activationOptions]="{ throttleMs: 200, debounceMs: 100 }">
   *   Throttled Option
   * </label>
   * ```
   */
  activationOptions = input<ActivationOptions>({});

  // Semantic conformity

  /**
   * Optional preset key for semantic conformity attributes.
   * Available for edge cases or custom styling scenarios.
   */
  attrsPreset = input<PresetKey | null>(null);

  // Outputs

  /**
   * Emitted when the radio's checked state changes.
   */
  checkedChange = output<boolean>();

  /**
   * Emitted when the radio is selected, providing its value.
   */
  valueChange = output<string | number | boolean>();

  // Computed properties

  /**
   * Whether the radio can be activated (not disabled and has a handler).
   */
  canActivate = computed(() => {
    if (this.disabled()) return false;
    return !!(this.onActivate() || this.activationId());
  });

  /**
   * Resolved preset config for ManageAttributesDirective if needed.
   */
  attrsPresetResolved = computed<SetAttrsConfig | null>(() => {
    const key = this.attrsPreset();
    return key ? this.attrsManager.Presets[key] : null;
  });

  /**
   * The payload to use for activation handlers.
   * Defaults to the radio's value if no explicit payload is provided.
   */
  effectivePayload = computed(() => {
    const explicitPayload = this.payload();
    return explicitPayload !== undefined ? explicitPayload : this.value();
  });

  // Internal state
  readonly focused = signal(false);
  private localActivation = signal<ManagedActivation<unknown> | null>(null);
  private activationRegistration = signal<ActivationRegistration | null>(null);

  constructor() {
    // Validate semantic usage in development
    if (isDevMode()) {
      afterNextRender(() => {
        const element = this.labelElement.nativeElement;
        if (element.tagName !== "LABEL") {
          console.warn(
            "InteropRadioControl must be used on <label> elements for semantic correctness. " +
              `Found on: ${element.tagName.toLowerCase()}`,
          );
        }
      });
    }

    // Set up local activation handler when onActivate changes
    effect(() => {
      const handler = this.onActivate();
      const options = this.activationOptions();

      // Clean up previous local handler
      this.localActivation.set(null);

      // Create new local handler if provided
      if (handler) {
        const managed = createActivationHandler(handler, options);
        this.localActivation.set(managed);
      }
    });

    // Set up global activation registration when activationId changes
    effect(() => {
      const id = this.activationId();

      // Clean up previous registration
      const prevReg = this.activationRegistration();
      if (prevReg) {
        prevReg.unregister();
        this.activationRegistration.set(null);
      }

      // Register with global manager if ID provided
      if (id && !this.onActivate()) {
        // Only register globally if no local handler
        console.warn(
          `InteropRadioControl: an activationId has been specified ("${id}"), but no corresponding activation handler has been registered with Interop. ` +
            "Register an activation event handler with the InteropActivation service first, so Interop knows how to handle this interaction.",
        );
      }
    });
  }

  /**
   * Handle radio input change events.
   * Emits appropriate outputs and triggers activation handlers.
   */
  onRadioChange(event: Event): void {
    const element = event.target as HTMLInputElement;
    const isChecked = element.checked;

    // Emit checked state change
    this.checkedChange.emit(isChecked);

    // If radio is now selected, emit value change and handle activation
    if (isChecked) {
      this.valueChange.emit(this.value());
      this.handleActivation();
    }
  }

  /**
   * Handle radio activation (selection + optional additional actions).
   * Delegates to local handler or global activation manager based on configuration.
   */
  private handleActivation(): void {
    if (!this.canActivate()) {
      return;
    }

    const payload = this.effectivePayload();

    // Prefer local handler over global
    const localHandler = this.localActivation();
    if (localHandler) {
      localHandler(payload);
      return;
    }

    // Fall back to global activation manager
    const globalId = this.activationId();
    if (globalId) {
      this.activationManager.trigger(globalId, payload);
      return;
    }
  }

  /**
   * Get reference to the generated radio input element.
   * Useful for form integration or direct DOM manipulation.
   */
  getInputElement(): HTMLInputElement {
    return this.inputElement.nativeElement;
  }
}
