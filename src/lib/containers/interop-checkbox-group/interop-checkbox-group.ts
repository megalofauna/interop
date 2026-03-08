import {
  Component,
  input,
  output,
  computed,
  signal,
  effect,
  inject,
  ElementRef,
  type TrackByFunction,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { InteropCheckbox } from "../../components/interop-checkbox/interop-checkbox";
import {
  InteropCollectionService,
  InteropCollection,
} from "../../services/interop-collection.service";
import type { InteropCollectionInput } from "../../../types/collection";
import { createComponentTrackByFn } from "../../utils/track-by";

export type CheckboxControl = {
  id: string;
  value: string | number | boolean;
  label: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
};

/**
 * InteropCheckboxGroup - Flexible container for managing groups of checkboxes.
 *
 * This component supports two **structural modes** and two **content modes**,
 * matching the pattern established by InteropRadioGroup.
 *
 * ## STRUCTURAL MODES
 *
 * ### 1. Hands-off Mode (Recommended)
 * Use `<interop-checkbox-group>` element selector. The component provides a complete,
 * accessible fieldset structure with legend support.
 *
 * ### 2. Custom Mode (Advanced)
 * Use `<your-element interop-checkbox-group>` attribute selector. You provide your own
 * container structure; the component only provides logic.
 *
 * ## CONTENT MODES
 *
 * ### 1. Declarative Mode
 * Pass an array of `CheckboxControl` objects via `controls` or an async data source
 * via `collection`. The component generates all checkbox inputs automatically.
 *
 * ### 2. Content Projection Mode
 * Use `<ng-content>` to project your own checkbox layouts.
 *
 * ## FEATURES
 * - Angular Forms integration (ControlValueAccessor emitting T[])
 * - Select-all checkbox with derived indeterminate state
 * - Data-driven rendering via InteropCollectionService
 * - Two-way data binding with selected values array
 * - Accessibility-first design with fieldset/legend in hands-off mode
 *
 * @example Hands-off + Declarative (pizza toppings)
 * ```html
 * <interop-checkbox-group
 *   [controls]="toppings"
 *   [legend]="'Choose your toppings'"
 *   [(value)]="selectedToppings">
 * </interop-checkbox-group>
 * ```
 *
 * @example With select-all
 * ```html
 * <interop-checkbox-group
 *   [controls]="permissions"
 *   [legend]="'Permissions'"
 *   [selectAll]="true"
 *   [selectAllLabel]="'Grant all'"
 *   [(value)]="grantedPermissions">
 * </interop-checkbox-group>
 * ```
 *
 * @example Content projection
 * ```html
 * <interop-checkbox-group [(value)]="selectedToppings">
 *   <label interop-checkbox id="cheese" value="cheese">Cheese</label>
 *   <label interop-checkbox id="pepperoni" value="pepperoni">Pepperoni</label>
 * </interop-checkbox-group>
 * ```
 *
 * @example Collection (async data source)
 * ```html
 * <interop-checkbox-group
 *   [collection]="toppingsFromApi$"
 *   [legend]="'Toppings'"
 *   [(value)]="selectedToppings">
 * </interop-checkbox-group>
 * ```
 *
 * @example Custom mode with attribute selector
 * ```html
 * <div class="settings-panel" interop-checkbox-group
 *      [controls]="featureFlags"
 *      [(value)]="enabledFlags">
 *   <h3>Feature Flags</h3>
 * </div>
 * ```
 *
 * @example Reactive forms
 * ```html
 * <form [formGroup]="orderForm">
 *   <interop-checkbox-group
 *     formControlName="toppings"
 *     [controls]="toppingOptions"
 *     [legend]="'Toppings'"
 *     [required]="true">
 *   </interop-checkbox-group>
 * </form>
 * ```
 */
@Component({
  selector:
    "interop-checkbox-group, [interop-checkbox-group]:not(interop-checkbox-group)",
  standalone: true,
  imports: [CommonModule, InteropCheckbox],
  templateUrl: "./interop-checkbox-group.html",
  styleUrl: "./interop-checkbox-group.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InteropCheckboxGroup,
      multi: true,
    },
  ],
})
export class InteropCheckboxGroup implements ControlValueAccessor {
  private hostElement = inject(ElementRef<HTMLElement>);
  private collectionService = inject(InteropCollectionService);

  // Content mode inputs

  /**
   * Array of checkbox control configurations for declarative mode.
   * When provided, the component generates checkbox inputs automatically.
   */
  controls = input<CheckboxControl[]>();

  /**
   * Data-driven collection input. Accepts arrays, observables, promises,
   * or InteropCollection instances. Resolved through InteropCollectionService.
   */
  collection = input<InteropCollectionInput<CheckboxControl>>();

  // Group config

  /**
   * Optional shared name attribute for form submission grouping.
   */
  groupName = input<string | null>(null);

  /**
   * Optional legend text for the fieldset.
   * Improves accessibility by describing the checkbox group's purpose.
   */
  legend = input<string>();

  /**
   * The currently selected values in the checkbox group.
   */
  value = input<(string | number | boolean)[]>([]);

  /**
   * Whether the entire checkbox group is disabled.
   */
  disabled = input<boolean>(false);

  /**
   * Whether at least one checkbox must be checked for form validation.
   */
  required = input<boolean>(false);

  /**
   * CSS class to apply to the fieldset container.
   */
  containerClass = input<string>("");

  // Collection rendering

  /**
   * Track-by strategy for rendered checkbox items.
   */
  trackBy = input<TrackByFunction<CheckboxControl> | "auto" | "index">("auto");

  /**
   * Field name to use for track-by identity.
   */
  trackByField = input<keyof CheckboxControl | null>(null);

  // Select-all support

  /**
   * Whether to show a built-in select-all checkbox.
   */
  selectAll = input<boolean>(false);

  /**
   * Label text for the select-all checkbox.
   */
  selectAllLabel = input<string>("Select all");

  // Outputs

  /**
   * Emitted when the selected values array changes.
   */
  valueChange = output<(string | number | boolean)[]>();

  // Internal state
  private internalValue = signal<(string | number | boolean)[]>([]);
  private resolvedCollection = signal<InteropCollection<CheckboxControl> | null>(null);
  private onChangeFn: (value: any) => void = () => {};
  private onTouchedFn: () => void = () => {};

  /**
   * Whether the component is in hands-off mode (using element selector).
   */
  isHandsOffMode = computed(() => {
    const element = this.hostElement.nativeElement;
    return element.tagName.toLowerCase() === "interop-checkbox-group";
  });

  /**
   * Resolved items from either controls input or collection input.
   */
  resolvedItems = computed(() => {
    const controls = this.controls();
    if (controls?.length) return controls;

    const col = this.resolvedCollection();
    return col?.items() ?? [];
  });

  /**
   * Whether the component is in declarative mode (has renderable items).
   */
  isDeclarativeMode = computed(() => {
    return this.resolvedItems().length > 0;
  });

  /**
   * The effective selected values.
   * Always reads from internalValue, which is kept in sync with the value input.
   */
  effectiveValue = computed(() => {
    return this.internalValue();
  });

  /**
   * Whether all enabled items are selected.
   */
  isAllSelected = computed(() => {
    const items = this.resolvedItems();
    const selected = this.effectiveValue();
    const enabledItems = items.filter((c) => !c.disabled);
    return (
      enabledItems.length > 0 &&
      enabledItems.every((c) => selected.includes(c.value))
    );
  });

  /**
   * Whether some (but not all) enabled items are selected.
   */
  isPartialSelected = computed(() => {
    const items = this.resolvedItems();
    const selected = this.effectiveValue();
    const enabledItems = items.filter((c) => !c.disabled);
    const selectedCount = enabledItems.filter((c) =>
      selected.includes(c.value),
    ).length;
    return selectedCount > 0 && selectedCount < enabledItems.length;
  });

  /**
   * Space-separated list of all controlled checkbox IDs.
   * Used for aria-controls on the select-all checkbox (WAI-ARIA requirement).
   */
  controlledIds = computed(() => {
    return this.resolvedItems()
      .map((c) => c.id)
      .join(" ");
  });

  /**
   * ID for the select-all checkbox.
   */
  selectAllId = computed(() => {
    const name = this.groupName();
    return name ? `${name}-select-all` : "select-all";
  });

  /**
   * Track-by function for template rendering.
   */
  trackByFn = createComponentTrackByFn<CheckboxControl>(
    () => this.trackBy(),
    () => this.trackByField(),
  );

  constructor() {
    // Sync input value changes with internal state
    effect(() => {
      const inputValue = this.value();
      if (!inputValue) return;

      // Avoid unnecessary updates that could trigger loops with two-way binding
      const current = this.internalValue();
      if (
        current.length === inputValue.length &&
        current.every((v, i) => v === inputValue[i])
      ) {
        return;
      }

      this.internalValue.set([...inputValue]);
    });

    // Resolve collection input through InteropCollectionService
    effect(() => {
      const col = this.collection();
      if (col) {
        this.resolvedCollection.set(this.collectionService.resolve(col));
      } else {
        this.resolvedCollection.set(null);
      }
    });
  }

  /**
   * Notify consumers and forms of a value change.
   */
  private emitValueChange(): void {
    const currentValue = this.effectiveValue();
    this.valueChange.emit(currentValue);
    this.onChangeFn(currentValue);
  }

  /**
   * Handle checkbox toggle from a child control.
   */
  onCheckboxToggle(controlValue: string | number | boolean, checked: boolean): void {
    const current = [...this.internalValue()];

    if (checked) {
      if (!current.includes(controlValue)) {
        current.push(controlValue);
      }
    } else {
      const index = current.indexOf(controlValue);
      if (index > -1) {
        current.splice(index, 1);
      }
    }

    this.internalValue.set(current);
    this.emitValueChange();
    this.onTouchedFn();
  }

  /**
   * Check if a specific value is currently selected.
   */
  isSelected(value: string | number | boolean): boolean {
    return this.effectiveValue().includes(value);
  }

  /**
   * Toggle all enabled items on or off.
   * When all are selected, deselects all. Otherwise, selects all.
   */
  toggleAll(): void {
    const items = this.resolvedItems();
    const enabledValues = items.filter((c) => !c.disabled).map((c) => c.value);

    if (this.isAllSelected()) {
      // Deselect all enabled items, keep disabled items' selection
      const disabledSelected = this.effectiveValue().filter(
        (v) => !enabledValues.includes(v),
      );
      this.internalValue.set(disabledSelected);
    } else {
      // Select all enabled items, keep existing disabled items' selection
      const disabledSelected = this.effectiveValue().filter(
        (v) => !enabledValues.includes(v),
      );
      this.internalValue.set([...disabledSelected, ...enabledValues]);
    }

    this.emitValueChange();
    this.onTouchedFn();
  }

  // ControlValueAccessor implementation

  writeValue(value: any): void {
    this.internalValue.set(Array.isArray(value) ? value : []);
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Disabled state is driven by the [disabled] input
  }
}
