import {
  Directive,
  Input,
  OnInit,
  OnDestroy,
  inject,
  Injector,
  ViewContainerRef,
} from "@angular/core";
import { PhIconDefinition } from "../../iconsets/phosphor/helpers/phosphor-icon.types";
import { PhosphorIconRegistry } from "../../iconsets/phosphor/helpers/phosphor-icon.registry";

/**
 * Directive to register icons at component scope.
 * Icons registered through this directive are only available to child components
 * and will override any parent-scoped icons with the same name.
 *
 * @example Basic usage
 * ```html
 * <div iconScope [icons]="myIcons">
 *   <interop-icon name="user" /> <!-- Uses scoped icon -->
 *   <child-component></child-component> <!-- Can access scoped icons -->
 * </div>
 * ```
 *
 * @example With dynamic loading
 * ```typescript
 * @Component({
 *   template: `
 *     <div iconScope [icons]="loadedIcons">
 *       <interop-icon name="dynamic-icon" />
 *     </div>
 *   `
 * })
 * export class MyComponent implements OnInit {
 *   loadedIcons: PhIconDefinition[] = [];
 *
 *   async ngOnInit() {
 *     const { PhUser, PhHome } = await import('@your-org/interop');
 *     this.loadedIcons = [PhUser, PhHome];
 *   }
 * }
 * ```
 */
@Directive({
  selector: "[iconScope]",
  standalone: true,
  providers: [PhosphorIconRegistry], // Creates new registry instance for this scope
})
export class IconScopeDirective implements OnInit, OnDestroy {
  private registry = inject(PhosphorIconRegistry);
  private viewContainer = inject(ViewContainerRef);

  /**
   * Icons to register in this scope.
   * These icons will be available to child components and will
   * override parent-scoped icons with the same names.
   */
  @Input() icons: PhIconDefinition[] = [];

  /**
   * Optional: Load icons asynchronously by name.
   * This will attempt to dynamically import icons by their names.
   */
  @Input() iconNames: string[] = [];

  /**
   * Whether to inherit icons from parent scopes.
   * When false, only locally registered icons are available.
   * @default true
   */
  @Input() inherit: boolean = true;

  ngOnInit() {
    // Register provided icons
    if (this.icons.length > 0) {
      this.registry.register(this.icons);
    }

    // Load icons by name if specified
    if (this.iconNames.length > 0) {
      this.loadIconsByName();
    }
  }

  ngOnDestroy() {
    // Cleanup is automatic when the registry instance is destroyed
  }

  /**
   * Dynamically load icons by their names.
   * This attempts to import icons from the standard icon exports.
   */
  private async loadIconsByName() {
    try {
      const iconPromises = this.iconNames.map(async (iconName) => {
        try {
          // Convert kebab-case to PascalCase with Ph prefix
          const iconExportName = this.toPascalCase(iconName);

          // Try to dynamically import the icon
          const iconModule = await import(
            `../../iconsets/phosphor/${iconName}`
          );
          return iconModule[iconExportName];
        } catch (error) {
          console.warn(`Failed to load icon: ${iconName}`, error);
          return null;
        }
      });

      const loadedIcons = (await Promise.all(iconPromises)).filter(Boolean);

      if (loadedIcons.length > 0) {
        this.registry.register(loadedIcons);
      }
    } catch (error) {
      console.error("Failed to load icons by name:", error);
    }
  }

  /**
   * Convert kebab-case icon name to PascalCase export name.
   * Example: "arrow-left" -> "PhArrowLeft"
   */
  private toPascalCase(kebabName: string): string {
    return (
      "Ph" +
      kebabName
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")
    );
  }

  /**
   * Programmatically register additional icons in this scope.
   * Useful for dynamic icon registration after initialization.
   */
  registerIcons(icons: PhIconDefinition[]): void {
    this.registry.register(icons);
  }

  /**
   * Get an icon from this scope (local only, no inheritance).
   */
  getLocalIcon(name: string): PhIconDefinition | undefined {
    return this.registry.getLocal(name);
  }

  /**
   * Get all icon names registered in this scope and parent scopes.
   */
  getAllRegisteredIcons(): string[] {
    return this.registry.getAllRegistered();
  }
}
