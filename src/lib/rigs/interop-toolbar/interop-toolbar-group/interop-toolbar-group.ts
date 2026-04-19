import {
  Component,
  input,
  computed,
  isDevMode,
  effect,
  signal,
  ChangeDetectionStrategy,
  AfterContentInit,
  Output,
  EventEmitter,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  InteropToolbarBase,
  KeyboardNavigationManager,
  DevWarningsManager,
  ComponentIdManager,
  CollectionProcessor,
} from "../shared/interop-toolbar-base";
import {
  RadioGroupManager,
  RadioGroupValidator,
  RadioGroupKeyboardHandler,
} from "../shared/radio-group-utils";
import { InteropCollectionInput } from "../../../../types/collection";

/**
 * InteropToolbarGroup - Semantic grouping component for toolbar items.
 *
 * This component automatically detects whether to behave as a regular group or radio group
 * based on the presence of radio inputs in its content. Radio groups support collection
 * inputs for dynamic option generation from data sources.
 *
 * Key features:
 * - Automatic detection of group type (regular vs. radio)
 * - Proper ARIA roles: `role="group"` or `role="radiogroup"`
 * - Collection support for radio groups (arrays, observables, promises)
 * - Native keyboard navigation and form integration
 *
 * @example Regular group (independent actions)
 * ```html
 * <interop-toolbar-group label="File Actions">
 *   <button interop-button>Save</button>
 *   <button interop-button>Print</button>
 * </interop-toolbar-group>
 * ```
 *
 * @example Radio group from collection data
 * ```html
 * <interop-toolbar-group
 *   label="Text Alignment"
 *   name="alignment"
 *   [items]="alignmentOptions">
 * </interop-toolbar-group>
 * ```
 */
@Component({
  selector: "interop-toolbar-group, [interop-toolbar-group]",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./interop-toolbar-group.html",
  styleUrl: "./interop-toolbar-group.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[attr.role]": "groupRole()",
    "[attr.aria-label]": "label()",
    "[attr.aria-labelledby]": "labelledby()",
    "[attr.aria-disabled]": "disabled()",
    "[attr.aria-required]": "required()",
    "(keydown)": "onKeydown($event)",
    "(focusin)": "onFocusIn($event)",
    "(change)": "onRadioChange($event)",
  },
})
export class InteropToolbarGroup
  extends InteropToolbarBase
  implements AfterContentInit
{
  // ARIA inputs implementation
  /**
   * Accessible label for the component.
   * Either this or labelledby should be provided for screen reader users.
   */
  label = input<string | null>(null);

  /**
   * ID of element that labels this component.
   * Alternative to label input.
   */
  labelledby = input<string | null>(null);

  /**
   * Whether the component is disabled.
   */
  disabled = input<boolean>(false);

  // Radio group specific inputs
  /**
   * Name attribute for radio inputs (auto-generated if not provided).
   * Only relevant when the group contains radio inputs.
   */
  name = input<string | null>(null);

  /**
   * Whether selection is required (for radio groups).
   */
  required = input<boolean>(false);

  /**
   * Current selected value (for radio groups).
   */
  value = input<string | null>(null);

  /**
   * Collection of items to generate radio group options dynamically.
   * Supports arrays, observables, promises, and other iterable data sources.
   * Only applies to radio groups - regular groups should use static content.
   *
   * @example Dynamic radio options from configuration
   * ```html
   * <interop-toolbar-group
   *   [items]="alignmentOptions"
   *   label="Text Alignment"
   *   name="alignment">
   * </interop-toolbar-group>
   * ```
   */
  items = input<InteropCollectionInput<any>>();

  // Outputs
  /**
   * Emitted when the selected value changes (radio groups only).
   */
  @Output() valueChange = new EventEmitter<string | null>();

  // Internal managers
  private keyboardNav = new KeyboardNavigationManager(this.elementRef);
  private radioManager?: RadioGroupManager;
  private radioKeyboardHandler?: RadioGroupKeyboardHandler;
  private collectionProcessor = new CollectionProcessor<any>();

  // Component state
  protected groupId = ComponentIdManager.generateId("interop-toolbar-group");
  private isRadioGroup = signal<boolean>(false);
  private hasInitialized = signal<boolean>(false);

  // Computed properties
  /**
   * Determine the appropriate ARIA role based on content
   */
  groupRole = computed(() => (this.isRadioGroup() ? "radiogroup" : "group"));

  /**
   * Generate group name for radio inputs
   */
  groupName = computed(() => this.name() || `${this.groupId}-radios`);

  /**
   * Computed items from the collection processor
   */
  collectionItems = computed(() => this.collectionProcessor.items());

  // InteropToolbarBase implementation
  get componentName(): string {
    return "InteropToolbarGroup";
  }

  get componentPurpose(): string {
    return this.isRadioGroup()
      ? 'Radio groups should describe their purpose (e.g., "Text Alignment", "View Mode")'
      : 'Groups should describe their purpose (e.g., "File Actions", "Text Style")';
  }

  constructor() {
    super();

    // Sync external value changes with radio manager
    effect(() => {
      const newValue = this.value();
      if (this.radioManager && this.hasInitialized()) {
        this.radioManager.setValue(newValue);
      }
    });

    // Update disabled state when it changes
    effect(() => {
      if (this.radioManager && this.hasInitialized()) {
        this.radioManager.updateDisabledState(this.disabled());
      }
    });

    // Process collection items when they change
    effect(() => {
      const itemsInput = this.items();
      this.collectionProcessor.processCollection(itemsInput);
    });
  }

  ngAfterContentInit() {
    // Detect group type and initialize appropriate behavior
    this.detectAndInitializeGroupType();

    // Set up mutation observer to track content changes
    const observer = new MutationObserver(() => {
      this.detectAndInitializeGroupType();
    });

    observer.observe(this.elementRef.nativeElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["type", "name", "value"],
    });

    this.hasInitialized.set(true);
  }

  /**
   * Detect whether this should be a radio group based on content
   */
  private detectAndInitializeGroupType(): void {
    const element = this.elementRef.nativeElement;
    const radioInputs = element.querySelectorAll('input[type="radio"]');
    const wasRadioGroup = this.isRadioGroup();
    const isRadioGroup = radioInputs.length > 0;

    this.isRadioGroup.set(isRadioGroup);

    if (isRadioGroup && (!this.radioManager || !wasRadioGroup)) {
      // Initialize radio group functionality
      this.initializeRadioGroup();
    } else if (!isRadioGroup && wasRadioGroup) {
      // Clean up radio group functionality
      this.cleanupRadioGroup();
    }

    // Always update keyboard navigation
    this.keyboardNav.updateFocusableElements();

    // Run validation
    this.validateGroupContent();
  }

  /**
   * Initialize radio group management
   */
  private initializeRadioGroup(): void {
    this.radioManager = new RadioGroupManager(
      this.elementRef,
      this.groupName(),
    );
    this.radioKeyboardHandler = new RadioGroupKeyboardHandler(
      this.radioManager,
    );

    this.radioManager.updateRadioInputs();
    this.radioManager.setValue(this.value());
    this.radioManager.updateDisabledState(this.disabled());
  }

  /**
   * Clean up radio group functionality
   */
  private cleanupRadioGroup(): void {
    this.radioManager = undefined;
    this.radioKeyboardHandler = undefined;
  }

  /**
   * Handle keyboard navigation
   */
  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    let handled = false;

    // Try radio group specific keys first
    if (this.radioKeyboardHandler) {
      handled = this.radioKeyboardHandler.handleRadioGroupKeys(
        event,
        this.valueChange,
      );
    }

    // Fall back to general keyboard navigation
    if (!handled) {
      this.keyboardNav.handleKeyboardNavigation(event, "horizontal");
    }
  }

  /**
   * Handle focus entering the group
   */
  onFocusIn(event: FocusEvent): void {
    if (this.disabled()) return;

    const target = event.target as HTMLElement;
    this.keyboardNav.updateFocusIndex(target);
  }

  /**
   * Handle radio change events
   */
  onRadioChange(event: Event): void {
    if (!this.radioManager || this.disabled()) return;
    this.radioManager.handleRadioChange(event, this.valueChange);
  }

  /**
   * Validate group content and provide development guidance
   */
  private validateGroupContent(): void {
    if (!isDevMode()) return;

    const element = this.elementRef.nativeElement;

    // Base validation from parent class
    super.validateAccessibilityLabels();

    if (this.isRadioGroup()) {
      // Radio group specific validation
      const radioInputs = this.radioManager?.getRadioInputs() || [];
      RadioGroupValidator.validateRadioGroup(
        this.componentName,
        element,
        radioInputs,
      );
    } else {
      // Regular group validation
      DevWarningsManager.warnNoInteractiveContent(this.componentName, element);

      // Helpful guidance about potential radio groups
      setTimeout(() => {
        const buttonsWithValues = Array.from(
          element.querySelectorAll("button[value]"),
        );

        if (buttonsWithValues.length > 1) {
          console.info(
            `${this.componentName}: Multiple buttons with 'value' attributes detected. ` +
              "If these represent exclusive choices, consider using radio inputs instead " +
              "for proper semantic HTML and native browser behavior.",
          );
        }
      }, 0);
    }
  }
}
