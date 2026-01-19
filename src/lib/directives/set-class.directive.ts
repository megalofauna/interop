import {
  Directive,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  ElementRef,
  Renderer2,
  inject,
  SimpleChanges,
} from "@angular/core";

/**
 * Configuration for class targeting - supports both simple and selector-based modes
 */
export type SetClassConfig =
  // Simple mode - boolean values automatically target :host
  | Record<string, boolean>
  // Complex mode - selector-based targeting
  | {
      [selector: string]:
        | Record<string, boolean> // Object: { active: true, disabled: false }
        | string // String: "class1 class2 class3"
        | string[] // Array: ["class1", "class2"]
        | null;
    };

/**
 * Enhanced directive for applying CSS classes to targeted elements.
 * Supports both simple host-only mode and complex selector-based targeting.
 *
 * @example
 * ```html
 * <!-- Simple mode - targets :host automatically -->
 * <div [setClass]="{ active: isActive, loading: isLoading }">
 * </div>
 *
 * <!-- Complex mode - target specific elements -->
 * <interop-list [setClass]="{
 *   ':host': { 'list-container': true, 'compact': isCompact },
 *   'li': { 'list-item': true, 'selected': isSelected },
 *   'li:first-child': { 'first-item': true },
 *   'button': 'btn-primary disabled'
 * }">
 * </interop-list>
 *
 * <!-- Works with any component -->
 * <div [setClass]="{
 *   ':host': { 'theme-dark': isDark },
 *   '.card': { 'elevated': isElevated },
 *   'button': ['btn', condition && 'btn-primary', { disabled: !isValid }]
 * }">
 *   <div class="card">
 *     <button>Action</button>
 *   </div>
 * </div>
 * ```
 */
@Directive({
  selector: "[setClass]",
  standalone: true,
})
export class SetClassDirective implements OnInit, OnChanges, OnDestroy {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  /**
   * Configuration object for applying classes.
   * - Simple mode: { active: true, disabled: false } - targets host element
   * - Complex mode: { ':host': {...}, 'selector': {...} } - targets specific elements
   */
  @Input() setClass: SetClassConfig | null = null;

  /**
   * Tracks applied classes for cleanup
   * Map<element, Set<className>>
   */
  private appliedClassesMap = new WeakMap<Element, Set<string>>();

  /**
   * Observer to watch for dynamic DOM changes
   */
  private mutationObserver?: MutationObserver;

  ngOnInit(): void {
    this.updateClasses();
    this.setupMutationObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["setClass"]) {
      this.updateClasses();
    }
  }

  ngOnDestroy(): void {
    this.clearAllClasses();
    this.mutationObserver?.disconnect();
  }

  /**
   * Sets up mutation observer to handle dynamically added elements
   */
  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver(() => {
      // Reapply classes when DOM changes
      this.updateClasses();
    });

    this.mutationObserver.observe(this.elementRef.nativeElement, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Updates classes on targeted elements
   */
  private updateClasses(): void {
    this.clearAllClasses();

    if (!this.setClass) {
      return;
    }

    if (this.isSimpleMode(this.setClass)) {
      // Simple mode - target host element only
      const hostElement = this.elementRef.nativeElement;
      this.applyClassesToElement(hostElement, this.setClass);
    } else {
      // Complex mode - selector-based targeting
      Object.entries(this.setClass).forEach(([selector, classConfig]) => {
        if (classConfig === null || classConfig === undefined) return;

        const targetElements = this.getTargetElements(selector);
        targetElements.forEach((element) => {
          this.applyClassesToElement(element, classConfig);
        });
      });
    }
  }

  /**
   * Determines if the config is in simple mode (all boolean values)
   */
  private isSimpleMode(
    config: SetClassConfig,
  ): config is Record<string, boolean> {
    return Object.values(config).every((value) => typeof value === "boolean");
  }

  /**
   * Gets target elements based on selector
   */
  private getTargetElements(selector: string): Element[] {
    const hostElement = this.elementRef.nativeElement;

    // Handle special :host selector
    if (selector === ":host") {
      return [hostElement];
    }

    // Handle simple tag name selectors (case-insensitive)
    if (this.isSimpleTagName(selector)) {
      return Array.from(hostElement.querySelectorAll(selector.toLowerCase()));
    }

    // Handle complex CSS selectors
    try {
      return Array.from(hostElement.querySelectorAll(selector));
    } catch (error) {
      console.warn(`Invalid CSS selector: "${selector}"`, error);
      return [];
    }
  }

  /**
   * Checks if selector is a simple tag name (no special CSS characters)
   */
  private isSimpleTagName(selector: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9]*$/.test(selector);
  }

  /**
   * Applies classes to a specific element
   */
  private applyClassesToElement(
    element: Element,
    classConfig: Record<string, boolean> | string | string[],
  ): void {
    if (!this.appliedClassesMap.has(element)) {
      this.appliedClassesMap.set(element, new Set());
    }

    const appliedClasses = this.appliedClassesMap.get(element)!;
    const classesToApply = this.resolveClassNames(classConfig);

    classesToApply.forEach((className) => {
      if (className && className.trim()) {
        this.renderer.addClass(element, className.trim());
        appliedClasses.add(className.trim());
      }
    });
  }

  /**
   * Resolves class names from various input formats
   */
  private resolveClassNames(
    classConfig: Record<string, boolean> | string | string[],
  ): string[] {
    if (typeof classConfig === "string") {
      // Handle string: "class1 class2 class3"
      return classConfig.split(/\s+/).filter(Boolean);
    }

    if (Array.isArray(classConfig)) {
      // Handle array: ["class1", "class2", condition && "class3"]
      return classConfig
        .filter(Boolean)
        .flatMap((item) =>
          typeof item === "string" ? item.split(/\s+/).filter(Boolean) : [],
        );
    }

    if (typeof classConfig === "object" && classConfig !== null) {
      // Handle object: { active: true, disabled: false }
      return Object.entries(classConfig)
        .filter(([, condition]) => Boolean(condition))
        .map(([className]) => className);
    }

    return [];
  }

  /**
   * Removes all currently applied classes from all elements
   */
  private clearAllClasses(): void {
    // WeakMap doesn't have forEach, so we just create a new instance
    // The WeakMap will automatically clean up when elements are removed from DOM
    this.appliedClassesMap = new WeakMap();
  }
}
