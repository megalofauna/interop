import {
  inject,
  ElementRef,
  isDevMode,
  effect,
  signal,
} from "@angular/core";

/**
 * Base class for toolbar components with common ARIA functionality
 */
export abstract class InteropToolbarBase {
  protected elementRef = inject(ElementRef<HTMLElement>);

  // Abstract ARIA inputs that subclasses must implement
  /**
   * Accessible label for the component.
   * Either this or labelledby should be provided for screen reader users.
   */
  abstract label(): string | null;

  /**
   * ID of element that labels this component.
   * Alternative to label input.
   */
  abstract labelledby(): string | null;

  /**
   * Whether the component is disabled.
   */
  abstract disabled(): boolean;

  // Abstract properties that subclasses must implement
  abstract get componentName(): string;
  abstract get componentPurpose(): string;

  constructor() {
    // Development-time validation
    if (isDevMode()) {
      effect(() => {
        this.validateAccessibilityLabels();
      });
    }
  }

  /**
   * Common accessibility label validation
   */
  protected validateAccessibilityLabels(): void {
    if (!this.label() && !this.labelledby()) {
      console.warn(
        `${this.componentName}: Consider providing a label or labelledby for screen reader users. ` +
          `${this.componentPurpose}.`,
      );
    }
  }

  /**
   * Common element validation helper
   */
  protected validateElement(
    expectedTags: string[] = ["div", "section"],
    elementName: string = this.componentName.toLowerCase(),
  ): void {
    const element = this.elementRef.nativeElement;
    const tagName = element.tagName.toLowerCase();

    if (!expectedTags.includes(tagName) && !tagName.startsWith(elementName)) {
      console.info(
        `${this.componentName}: Using component on <${tagName}> element. ` +
          `Consider using ${expectedTags.map((tag) => `<${tag}>`).join(", ")} for generic containers.`,
      );
    }
  }
}

/**
 * Common host binding generators for ARIA attributes
 */
export const createAriaHostBindings = (role: string) => ({
  role,
  "[attr.aria-label]": "label()",
  "[attr.aria-labelledby]": "labelledby()",
  "[attr.aria-disabled]": "disabled()",
});

/**
 * Keyboard navigation utilities for toolbar components
 */
export class KeyboardNavigationManager {
  private focusableItems = signal<HTMLElement[]>([]);
  private currentFocusIndex = signal<number>(-1);

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  /**
   * Update the list of focusable elements
   */
  updateFocusableElements(): void {
    const element = this.elementRef.nativeElement;
    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      "a[href]:not([disabled])",
    ].join(", ");

    const elements = Array.from(
      element.querySelectorAll(focusableSelectors),
    ) as HTMLElement[];

    // Filter out hidden elements
    const visibleElements = elements.filter((element) => {
      return (
        !element.closest("[disabled]") &&
        getComputedStyle(element).display !== "none" &&
        getComputedStyle(element).visibility !== "hidden"
      );
    });

    this.focusableItems.set(visibleElements);
  }

  /**
   * Handle keyboard navigation for arrow keys, home, end
   */
  handleKeyboardNavigation(
    event: KeyboardEvent,
    orientation: "horizontal" | "vertical" = "horizontal",
  ): boolean {
    const items = this.focusableItems();
    const currentIndex = this.currentFocusIndex();
    let targetIndex = -1;
    let handled = false;

    const isHorizontal = orientation === "horizontal";

    switch (event.key) {
      case "ArrowLeft":
        if (isHorizontal) {
          event.preventDefault();
          targetIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          handled = true;
        }
        break;

      case "ArrowRight":
        if (isHorizontal) {
          event.preventDefault();
          targetIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          handled = true;
        }
        break;

      case "ArrowUp":
        if (!isHorizontal) {
          event.preventDefault();
          targetIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          handled = true;
        }
        break;

      case "ArrowDown":
        if (!isHorizontal) {
          event.preventDefault();
          targetIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          handled = true;
        }
        break;

      case "Home":
        event.preventDefault();
        targetIndex = 0;
        handled = true;
        break;

      case "End":
        event.preventDefault();
        targetIndex = items.length - 1;
        handled = true;
        break;
    }

    if (targetIndex >= 0 && targetIndex < items.length) {
      this.focusElement(targetIndex);
    }

    return handled;
  }

  /**
   * Focus element at specific index and update current focus
   */
  focusElement(index: number): void {
    const items = this.focusableItems();
    if (index >= 0 && index < items.length) {
      items[index].focus();
      this.currentFocusIndex.set(index);
    }
  }

  /**
   * Update current focus index based on focused element
   */
  updateFocusIndex(target: HTMLElement): void {
    const items = this.focusableItems();
    const index = items.indexOf(target);
    if (index >= 0) {
      this.currentFocusIndex.set(index);
    }
  }

  /**
   * Get current focusable items (readonly)
   */
  getFocusableItems(): readonly HTMLElement[] {
    return this.focusableItems();
  }
}

/**
 * Common development warnings utility
 */
export class DevWarningsManager {
  static warnNoInteractiveContent(
    componentName: string,
    element: HTMLElement,
    delay: number = 0,
  ): void {
    if (!isDevMode()) return;

    setTimeout(() => {
      const interactiveElements = element.querySelectorAll(
        "button, input, [tabindex], a[href]",
      );

      if (interactiveElements.length === 0) {
        console.warn(
          `${componentName}: No interactive controls found. ` +
            "Component should contain buttons or input controls for user interaction.",
        );
      }
    }, delay);
  }

  static warnInsufficientOptions(
    componentName: string,
    items: any[],
    minItems: number = 2,
    itemType: string = "options",
  ): void {
    if (!isDevMode()) return;

    if (items.length > 0 && items.length < minItems) {
      console.warn(
        `${componentName}: Found ${items.length} ${itemType}, but ${minItems} or more are recommended for meaningful choice.`,
      );
    }
  }
}

/**
 * Unique ID generator for component instances
 */
export class ComponentIdManager {
  private static counters = new Map<string, number>();

  static generateId(prefix: string): string {
    const current = ComponentIdManager.counters.get(prefix) || 0;
    const next = current + 1;
    ComponentIdManager.counters.set(prefix, next);
    return `${prefix}-${next}`;
  }
}

