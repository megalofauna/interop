import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  isDevMode,
} from "@angular/core";

import { PhosphorIconRegistry } from "../../iconsets/phosphor/helpers/phosphor-icon.registry";

/**
 * InteropIcon - Generic icon component for displaying iconsets.
 *
 * This component provides a flexible way to display icons from various iconsets,
 * starting with Phosphor Regular Icons. It supports dynamic sizing, styling,
 * and accessibility features.
 *
 * Key features:
 * - Dynamic icon loading from registry
 * - Pixel-based sizing (no units needed)
 * - Customizable stroke width and colors
 * - Built-in accessibility support
 * - SVG-based rendering for scalability
 *
 * @example Basic usage
 * ```html
 * <interop-icon name="user" />
 * ```
 *
 * @example With custom styling
 * ```html
 * <interop-icon
 *   name="arrow-right"
 *   [size]="32"
 *   [strokeWidth]="2"
 *   color="blue"
 * />
 * ```
 *
 * @example With accessibility
 * ```html
 * <interop-icon
 *   name="warning"
 *   [decorative]="false"
 *   ariaLabel="Warning: Check your input"
 * />
 * ```
 */
@Component({
  selector: "interop-icon",
  standalone: true,
  imports: [],
  templateUrl: "./interop-icon.html",
  styleUrl: "./interop-icon.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropIcon {
  private elementRef = inject(ElementRef<HTMLElement>);
  private registry = inject(PhosphorIconRegistry);

  /**
   * Icon name to display from the registered iconset.
   * This should match the name of an icon in the current iconset.
   *
   * @example
   * ```html
   * <interop-icon name="user" />
   * <interop-icon name="arrow-left" />
   * ```
   */
  name = input.required<string>();

  /**
   * Icon size in pixels. No unit suffix needed.
   * Defaults to 24px which is standard for most UI contexts.
   *
   * @example
   * ```html
   * <interop-icon name="user" [size]="16" />  <!-- 16px -->
   * <interop-icon name="user" [size]="32" />  <!-- 32px -->
   * ```
   */
  size = input<number>(24);

  /**
   * Override stroke width for the icon.
   * If not provided, uses the icon's default stroke width.
   * Most Phosphor icons use stroke-width of 1 or 2.
   *
   * @example
   * ```html
   * <interop-icon name="heart" [strokeWidth]="1.5" />
   * ```
   */
  strokeWidth = input<number | undefined>(undefined);

  /**
   * Icon color. Can be any valid CSS color value.
   * If not provided, uses 'currentColor' to inherit from parent.
   *
   * @example
   * ```html
   * <interop-icon name="star" color="gold" />
   * <interop-icon name="error" color="#ff0000" />
   * <interop-icon name="success" color="var(--success-color)" />
   * ```
   */
  color = input<string | undefined>(undefined);

  /**
   * Whether this icon is decorative (purely visual) or semantic.
   * Decorative icons are hidden from screen readers.
   * Set to false for icons that convey important information.
   *
   * @default true
   *
   * @example
   * ```html
   * <!-- Decorative icon next to text -->
   * <interop-icon name="star" [decorative]="true" />
   * <span>Premium Feature</span>
   *
   * <!-- Semantic icon without text -->
   * <interop-icon name="warning" [decorative]="false" ariaLabel="Warning" />
   * ```
   */
  decorative = input<boolean>(true);

  /**
   * Accessible label for screen readers.
   * Required when decorative is false.
   * Ignored when decorative is true.
   *
   * @example
   * ```html
   * <interop-icon
   *   name="close"
   *   [decorative]="false"
   *   ariaLabel="Close dialog"
   * />
   * ```
   */
  ariaLabel = input<string | undefined>(undefined);

  /**
   * Resolved icon definition from the registry.
   * Returns null if the icon is not found.
   */
  icon = computed(() => this.registry.get(this.name()));

  /**
   * Computed pixel size string for CSS.
   */
  sizeInPx = computed(() => `${this.size()}px`);

  constructor() {
    // Development-time validation
    if (isDevMode()) {
      // Warn about missing accessibility labels
      this.validateAccessibility();
    }
  }

  private validateAccessibility(): void {
    // This will run in effect-like context when inputs change
    setTimeout(() => {
      const isDecorative = this.decorative();
      const hasAriaLabel = !!this.ariaLabel();
      const iconName = this.name();

      if (!isDecorative && !hasAriaLabel) {
        console.warn(
          `InteropIcon: Icon "${iconName}" is marked as non-decorative but has no ariaLabel. ` +
            "Provide an ariaLabel for screen readers or set decorative=true if this icon is purely visual.",
        );
      }

      // Warn about missing icons
      const iconDef = this.icon();
      if (!iconDef) {
        console.warn(
          `InteropIcon: Icon "${iconName}" not found in registry. ` +
            "Make sure the icon is imported and registered with PhosphorIconRegistry.",
        );
      }
    });
  }
}
