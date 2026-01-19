import {
  signal,
  computed,
  inject,
  ElementRef,
  isDevMode,
  EventEmitter,
} from "@angular/core";

/**
 * Utilities specifically for radio group functionality within toolbar components
 */

/**
 * Manager for radio input elements within a group
 */
export class RadioGroupManager {
  private radioInputs = signal<HTMLInputElement[]>([]);
  private selectedValue = signal<string | null>(null);

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private groupName: string
  ) {}

  /**
   * Scan for radio inputs and ensure they have the correct name attribute
   */
  updateRadioInputs(): void {
    const element = this.elementRef.nativeElement;
    const radios = Array.from(
      element.querySelectorAll('input[type="radio"]')
    ) as HTMLInputElement[];

    // Ensure all radios have the correct name attribute
    radios.forEach(radio => {
      if (!radio.name || radio.name !== this.groupName) {
        radio.name = this.groupName;
      }
    });

    this.radioInputs.set(radios);
    this.syncRadioStates();
  }

  /**
   * Update radio button checked states based on current value
   */
  private syncRadioStates(): void {
    const selectedValue = this.selectedValue();
    const radios = this.radioInputs();

    radios.forEach(radio => {
      const shouldBeChecked = radio.value === selectedValue;
      if (radio.checked !== shouldBeChecked) {
        radio.checked = shouldBeChecked;
      }
    });
  }

  /**
   * Set the selected value and update radio states
   */
  setValue(value: string | null): void {
    this.selectedValue.set(value);
    this.syncRadioStates();
  }

  /**
   * Get the currently selected value
   */
  getValue(): string | null {
    return this.selectedValue();
  }

  /**
   * Handle radio change events
   */
  handleRadioChange(event: Event, valueChange: EventEmitter<string | null>): void {
    const target = event.target as HTMLInputElement;
    if (target.type === 'radio' && target.checked) {
      const newValue = target.value;
      this.selectedValue.set(newValue);
      valueChange.emit(newValue);
    }
  }

  /**
   * Set disabled state on all radio inputs
   */
  updateDisabledState(disabled: boolean): void {
    const radios = this.radioInputs();
    radios.forEach(radio => {
      radio.disabled = disabled;
    });
  }

  /**
   * Get all radio inputs (readonly)
   */
  getRadioInputs(): readonly HTMLInputElement[] {
    return this.radioInputs();
  }

  /**
   * Find radio input associated with an element (radio itself or its label)
   */
  findRadioForElement(element: HTMLElement): HTMLInputElement | null {
    // If it's already a radio input
    if (element.tagName === "INPUT" && (element as HTMLInputElement).type === "radio") {
      return element as HTMLInputElement;
    }

    // If it's a label, find its associated radio input
    if (element.tagName === "LABEL") {
      const label = element as HTMLLabelElement;
      if (label.htmlFor) {
        return document.getElementById(label.htmlFor) as HTMLInputElement;
      }
      // Check for nested radio input
      const nestedRadio = label.querySelector('input[type="radio"]') as HTMLInputElement;
      if (nestedRadio) return nestedRadio;
    }

    return null;
  }
}

/**
 * Development-time validation specific to radio groups
 */
export class RadioGroupValidator {
  static validateRadioGroup(
    componentName: string,
    element: HTMLElement,
    radioInputs: readonly HTMLInputElement[]
  ): void {
    if (!isDevMode()) return;

    setTimeout(() => {
      // Check for radio inputs
      if (radioInputs.length === 0) {
        console.warn(
          `${componentName}: No radio inputs found. ` +
          'Add <input type="radio"> elements with corresponding <label> elements.'
        );
        return;
      }

      // Check minimum options
      if (radioInputs.length < 2) {
        console.warn(
          `${componentName}: Radio groups should contain at least 2 options to be meaningful.`
        );
      }

      // Check for proper labels
      const radiosWithoutLabels = Array.from(radioInputs).filter(radio => {
        if (!radio.id) return true;
        const label = element.querySelector(`label[for="${radio.id}"]`);
        return !label;
      });

      if (radiosWithoutLabels.length > 0) {
        console.warn(
          `${componentName}: All radio inputs should have associated label elements. ` +
          "Use id/for attributes to connect them: <input id='option1'><label for='option1'>Option 1</label>"
        );
      }

      // Check for missing values
      const radiosWithoutValues = Array.from(radioInputs).filter(radio => !radio.value);
      if (radiosWithoutValues.length > 0) {
        console.warn(
          `${componentName}: All radio inputs should have value attributes for proper form integration.`
        );
      }
    }, 0);
  }
}

/**
 * Enhanced keyboard handling for radio groups
 * Extends base keyboard navigation with radio-specific behavior
 */
export class RadioGroupKeyboardHandler {
  constructor(private radioManager: RadioGroupManager) {}

  /**
   * Handle keyboard events specific to radio groups
   * Returns true if the event was handled, false otherwise
   */
  handleRadioGroupKeys(event: KeyboardEvent, valueChange: EventEmitter<string | null>): boolean {
    const target = event.target as HTMLElement;
    const radio = this.radioManager.findRadioForElement(target);

    if (!radio) return false;

    // Handle space and enter for radio selection
    if (event.key === " " || event.key === "Enter") {
      if (!radio.checked) {
        radio.checked = true;
        radio.dispatchEvent(new Event("change", { bubbles: true }));
        event.preventDefault();
        return true;
      }
    }

    return false;
  }
}
