import { CommonModule } from "@angular/common";
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  effect,
  input,
  isDevMode,
  QueryList,
} from "@angular/core";
import {
  DevWarningsManager,
  InteropToolbarBase,
  KeyboardNavigationManager,
} from "./shared/interop-toolbar-base";
/**
 * InteropToolbar - Context-driven rig for task-specific tools and actions.
 *
 * This component provides a semantic toolbar rig with proper ARIA roles and keyboard
 * navigation support. It's designed for quick access to tools and actions relevant to the
 * current context, not for app-wide navigation (use menubar for that).
 *
 * Key features:
 * - Automatic `role="toolbar"` with proper ARIA attributes
 * - Flexible selector support (element or attribute)
 * - Built-in accessibility guidance and validation
 * - Support for button grouping and exclusive selections via InteropToolbarGroup
 * - Keyboard navigation between focusable items
 *
 * @example Basic usage
 * ```html
 * <interop-toolbar label="Text Formatting">
 *   <button interop-button>Bold</button>
 *   <button interop-button>Italic</button>
 *   <button interop-button>Underline</button>
 * </interop-toolbar>
 * ```
 *
 * @example With attribute selector
 * ```html
 * <div interop-toolbar label="Image Tools">
 *   <button interop-button>Rotate</button>
 *   <button interop-button>Crop</button>
 * </div>
 * ```
 *
 * @example With groups and radio selections
 * ```html
 * <interop-toolbar label="Document Tools">
 *   <interop-toolbar-group label="File Actions">
 *     <button interop-button>Save</button>
 *     <button interop-button>Print</button>
 *   </interop-toolbar-group>
 *
 *   <interop-toolbar-group label="Text Alignment" name="alignment">
 *     <input type="radio" value="left" id="align-left">
 *     <label for="align-left">Left</label>
 *     <input type="radio" value="center" id="align-center">
 *     <label for="align-center">Center</label>
 *     <input type="radio" value="right" id="align-right">
 *     <label for="align-right">Right</label>
 *   </interop-toolbar-group>
 * </interop-toolbar>
 * ```
 */
@Component({
  selector: "interop-toolbar, [interop-toolbar]",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./interop-toolbar.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: "toolbar",
    "[attr.aria-orientation]": "orientation()",
    "[attr.aria-label]": "label()",
    "[attr.aria-labelledby]": "labelledby()",
    "(keydown)": "onKeydown($event)",
    "(focusin)": "onFocusIn($event)",
  },
})
export class InteropToolbar
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

  // Toolbar-specific inputs
  /**
   * Orientation of the toolbar for screen readers and keyboard navigation.
   * Affects arrow key behavior: horizontal uses left/right, vertical uses up/down.
   */
  orientation = input<"horizontal" | "vertical">("horizontal");

  // Internal managers
  private keyboardNav = new KeyboardNavigationManager(this.elementRef);

  /**
   * Query for toolbar groups to coordinate with them
   */
  @ContentChildren("interopToolbarGroup", { descendants: true })
  toolbarGroups!: QueryList<any>;

  // InteropToolbarBase implementation
  get componentName(): string {
    return "InteropToolbar";
  }

  get componentPurpose(): string {
    return 'Toolbars should describe their purpose (e.g., "Text Formatting", "Image Tools")';
  }

  constructor() {
    super();

    // Update focusable items when content changes
    effect(() => {
      this.keyboardNav.updateFocusableElements();
    });

    // Additional toolbar-specific validation
    if (isDevMode()) {
      effect(() => {
        this.validateToolbarUsage();
      });
    }
  }

  ngAfterContentInit() {
    // Initial scan for focusable items
    this.keyboardNav.updateFocusableElements();

    // Re-scan when toolbar groups change
    this.toolbarGroups.changes.subscribe(() => {
      this.keyboardNav.updateFocusableElements();
    });
  }

  /**
   * Handle keyboard navigation within the toolbar
   */
  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    this.keyboardNav.handleKeyboardNavigation(event, this.orientation());
  }

  /**
   * Handle focus entering the toolbar
   */
  onFocusIn(event: FocusEvent): void {
    if (this.disabled()) return;

    const target = event.target as HTMLElement;
    this.keyboardNav.updateFocusIndex(target);
  }

  /**
   * Toolbar-specific validation and helpful guidance
   */
  private validateToolbarUsage(): void {
    const element = this.elementRef.nativeElement;

    // Base validation from parent class
    super.validateAccessibilityLabels();

    // Check for interactive content
    DevWarningsManager.warnNoInteractiveContent(
      this.componentName,
      element,
      0, // No delay needed for toolbar
    );

    // Validate semantic usage
    super.validateElement(
      ["div", "section", "interop-toolbar"],
      "interop-toolbar",
    );
  }
}
