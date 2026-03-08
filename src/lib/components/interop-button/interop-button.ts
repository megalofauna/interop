import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  signal,
} from "@angular/core";
import {
  InteropActivation,
  type ActivationRegistration,
} from "../../services/interop-activation.service";
import {
  InteropAttribute,
  PresetKey,
  SetAttrsConfig,
} from "../../services/interop-attribute.service";
import {
  createActivationHandler,
  type ActivationHandler,
  type ActivationOptions,
  type ManagedActivation,
} from "../../utils/activation";

/**
 * InteropButton - Enhanced button component with activation guardrails and coordination.
 *
 * This component provides robust activation management, state handling, and cross-component
 * coordination while enforcing semantic HTML practices. It must be used on `<button>` elements
 * to ensure proper accessibility and form integration.
 *
 * Key features:
 * - Activation guardrails (debounce, throttle, reentrancy prevention)
 * - Cross-component coordination via InteropActivation
 * - Built-in loading and disabled state management
 * - Content projection slots for icons and loading states
 * - Semantic conformity presets for edge cases
 *
 * @example Basic usage
 * ```html
 * <button interop-button [onActivate]="save">Save</button>
 * ```
 *
 * @example With guardrails and loading state
 * ```html
 * <button interop-button
 *         [onActivate]="submit"
 *         [activationOptions]="{ throttleMs: 500, reentrant: false }"
 *         [loading]="submitting">
 *   <span class="icon">💾</span>
 *   <span slot="loading">Submitting...</span>
 *   Submit Form
 * </button>
 * ```
 *
 * @example Flexible icon positioning (based on DOM source order)
 * ```html
 * <!-- Icon before text -->
 * <button interop-button>
 *   <span class="icon">📁</span>
 *   Open File
 * </button>
 *
 * <!-- Icon after text -->
 * <button interop-button>
 *   Save Document
 *   <span class="icon">💾</span>
 * </button>
 * ```
 *
 * @example Cross-component coordination
 * ```html
 * <button interop-button activationId="save">Save from Header</button>
 * <button interop-button activationId="save">Save from Footer</button>
 * ```
 */
@Component({
  selector: "button[interop-button]",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./interop-button.html",
  styleUrl: "./interop-button.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropButton {
  private elementRef = inject(ElementRef<HTMLButtonElement>);
  private activationManager = inject(InteropActivation);
  private attrsManager = inject(InteropAttribute);

  // Core activation inputs

  /**
   * Local activation handler for this button instance.
   * Use this for simple, component-specific actions.
   *
   * @example
   * ```html
   * <button interop-button [onActivate]="() => save(item)">Save Item</button>
   * ```
   */
  onActivate = input<ActivationHandler<unknown> | null>(null);

  /**
   * Global activation ID for cross-component coordination.
   * When set, this button triggers a handler registered with InteropActivation.
   * Prefer this for actions that might be triggered from multiple places in the app.
   *
   * @example
   * ```html
   * <button interop-button activationId="save">Save</button>
   * ```
   */
  activationId = input<string | null>(null);

  /**
   * Payload passed to the activation handler when triggered.
   *
   * @example
   * ```html
   * <button interop-button [onActivate]="save" [payload]="item">Save</button>
   * ```
   */
  payload = input<unknown>(undefined);

  /**
   * Activation options for guardrails such as debounce, throttle, and reentrancy prevention.
   * Only applied to local `onActivate` handlers; global handlers configure options during registration.
   *
   * @example
   * ```html
   * <button interop-button
   *         [onActivate]="save"
   *         [activationOptions]="{ debounceMs: 250, reentrant: false }">
   *   Save
   * </button>
   * ```
   */
  activationOptions = input<ActivationOptions>({});

  // State management inputs

  /**
   * Whether the button is in a loading state.
   * When true, the button is automatically disabled and loading content is shown.
   */
  loading = input<boolean>(false);

  /**
   * Whether the button is disabled.
   * Takes precedence over loading state.
   */
  disabled = input<boolean>(false);

  /**
   * Button type for form integration.
   * Standard HTML button types: button, submit, reset.
   */
  type = input<"button" | "submit" | "reset">("button");

  // Content projection inputs

  /**
   * Text to display when in loading state (alternative to loadingTemplate).
   */
  loadingText = input<string>("Loading...");

  // Semantic conformity

  /**
   * Optional preset key for semantic conformity attributes.
   * Rarely needed since this component enforces button[interop-button] selector,
   * but available for edge cases or custom styling scenarios.
   */
  attrsPreset = input<PresetKey | null>(null);

  // Computed properties

  /**
   * Whether the button should be disabled (loading OR explicitly disabled).
   */
  isDisabled = computed(() => this.disabled() || this.loading());

  /**
   * Whether the button can be activated (not disabled and has a handler).
   */
  canActivate = computed(() => {
    if (this.isDisabled()) return false;
    return !!(this.onActivate() || this.activationId());
  });

  /**
   * Resolved preset config for ManageAttributesDirective if needed.
   */
  attrsPresetResolved = computed<SetAttrsConfig | null>(() => {
    const key = this.attrsPreset();
    return key ? this.attrsManager.Presets[key] : null;
  });

  // Internal state
  private localActivation = signal<ManagedActivation<unknown> | null>(null);
  private activationRegistration = signal<ActivationRegistration | null>(null);
  private loadingSlotPresent = signal(false);

  /**
   * Whether a loading slot has been projected into this button.
   * Useful for deciding between slot content and loadingText fallback.
   */
  hasLoadingSlot = computed(() => this.loadingSlotPresent());

  constructor() {
    // Validate semantic usage in development
    if (isDevMode()) {
      const element = this.elementRef.nativeElement;
      if (element.tagName !== "BUTTON") {
        console.warn(
          "InteropButton must be used on <button> elements for semantic correctness. " +
            "Found on: " +
            element.tagName.toLowerCase(),
        );
      }
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
          `InteropButton: activationId "${id}" specified, but no corresponding activation handler has been registered with Interop. ` +
            "Register an activation event handler with the InteropActivation service first, so Interop knows how to handle this interaction.",
        );
      }
    });

    // Detect projected loading slot content (for loadingText fallback decisions)
    effect(() => {
      this.loading();
      const host = this.elementRef.nativeElement;
      const hasLoadingSlot = !!host.querySelector("[slot='loading-spinner']");
      this.loadingSlotPresent.set(hasLoadingSlot);
    });
  }

  /**
   * Handle button activation (click, keyboard, programmatic).
   * Delegates to local handler or global activation manager based on configuration.
   */
  @HostListener("click", ["$event"])
  onButtonActivate(event: Event): void {
    if (!this.canActivate()) {
      event.preventDefault();
      return;
    }

    const payload = this.payload();

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

    // No handler configured - this shouldn't happen if canActivate is correct
    console.warn("InteropButton: No activation handler configured");
  }
}
