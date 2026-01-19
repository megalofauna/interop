/**
 * Interactive Extensions for Interop Collections
 *
 * Optional enhancement layers that build on top of the core collection system
 * to support interactive UI scenarios while maintaining clean separation of concerns.
 *
 * Philosophy: The collection remains a data conduit. These extensions provide
 * optional metadata and interaction patterns that components can choose to use.
 */

import { Observable } from "rxjs";
import { InteropCollectionInput, Collection } from "./collection";
import { InteropCollection } from "./collection-full";

/**
 * Core interactive item wrapper
 * Separates data from interaction metadata
 */
export interface InteractiveItem<TData = any, TMeta = any> {
  /** The core data payload */
  data: TData;

  /** Optional interaction metadata - component-specific */
  meta?: TMeta & {
    /** Visual state hints */
    disabled?: boolean;
    selected?: boolean;
    hidden?: boolean;
    focused?: boolean;

    /** Styling hints */
    cssClass?: string;
    variant?: string;

    /** Accessibility */
    ariaLabel?: string;
    ariaDescribedBy?: string;
    tabIndex?: number;

    /** Generic extensibility */
    [key: string]: any;
  };
}

/**
 * Item with optional callback
 * Enables item-level interaction handlers while preserving parent control
 */
export interface CallbackItem<TData = any, TMeta = any> extends InteractiveItem<
  TData,
  TMeta
> {
  /** Optional item-specific interaction handler */
  onInteract?: (
    data: TData,
    event?: Event,
    context?: any,
  ) => void | Promise<void>;
}

/**
 * Form-specific item for form control collections
 */
export interface FormItem<TData = any> extends InteractiveItem<TData> {
  meta?: InteractiveItem<TData>["meta"] & {
    /** Form-specific metadata */
    required?: boolean;
    invalid?: boolean;
    pristine?: boolean;
    touched?: boolean;

    /** Validation */
    errors?: string[];
    validators?: ((value: any) => boolean | string | null)[];

    /** Form control binding */
    formControlName?: string;
    ngModel?: any;
  };
}

/**
 * Selectable item for collections that support selection
 */
export interface SelectableItem<TData = any> extends InteractiveItem<TData> {
  meta?: InteractiveItem<TData>["meta"] & {
    /** Selection state */
    selectable?: boolean;
    multiSelect?: boolean;

    /** Selection callbacks */
    onSelect?: (data: TData, selected: boolean) => void;
    onToggle?: (data: TData) => void;
  };
}

/**
 * Union type for flexible item handling
 * Components can accept any of these formats
 */
export type FlexibleItem<TData = any> =
  | TData
  | InteractiveItem<TData>
  | CallbackItem<TData>
  | FormItem<TData>
  | SelectableItem<TData>;

/**
 * Flexible collection that accepts enhanced items
 */
export type InteropInteractiveCollection<TData = any> = InteropCollectionInput<
  FlexibleItem<TData>
>;

/**
 * Enhanced collection with interaction coordination
 */
export interface InteropCoordinatedCollection<TData = any> extends Collection<
  FlexibleItem<TData>
> {
  /** Collection-level interaction handlers */
  onItemSelect?: (data: TData, selected: boolean, index: number) => void;
  onItemInteract?: (data: TData, event: Event, index: number) => void;
  onItemFocus?: (data: TData, index: number) => void;

  /** Selection coordination */
  selection?: {
    mode: "none" | "single" | "multiple";
    selected: Set<any> | any[];
    onChange: (selected: any[]) => void;
  };

  /** Keyboard navigation */
  navigation?: {
    enabled: boolean;
    orientation: "horizontal" | "vertical" | "both";
    wrap: boolean;
    onNavigate?: (fromIndex: number, toIndex: number) => void;
  };

  /** Accessibility coordination */
  a11y?: {
    role?: string;
    labelledBy?: string;
    describedBy?: string;
    liveRegion?: "polite" | "assertive" | "off";
  };
}

/**
 * Type guards for runtime detection
 */
export namespace InteropInteractiveGuards {
  export function isInteractiveItem<T>(item: any): item is InteractiveItem<T> {
    return item && typeof item === "object" && "data" in item;
  }

  export function hasCallback<T>(item: any): item is CallbackItem<T> {
    return (
      isInteractiveItem(item) &&
      item.meta &&
      typeof item.meta.onInteract === "function"
    );
  }

  export function isFormItem<T>(item: any): item is FormItem<T> {
    return (
      isInteractiveItem(item) &&
      item.meta &&
      ("required" in item.meta ||
        "invalid" in item.meta ||
        "formControlName" in item.meta)
    );
  }

  export function isSelectable<T>(item: any): item is SelectableItem<T> {
    return (
      isInteractiveItem(item) &&
      item.meta &&
      ("selectable" in item.meta || "onSelect" in item.meta)
    );
  }
}

/**
 * Utilities for normalizing interactive items
 */
export namespace InteropInteractiveUtils {
  /**
   * Normalize any item to InteractiveItem format
   */
  export function normalizeItem<T>(item: FlexibleItem<T>): InteractiveItem<T> {
    if (InteropInteractiveGuards.isInteractiveItem(item)) {
      return item as InteractiveItem<T>;
    }
    return { data: item as T };
  }

  /**
   * Extract just the data from any item format
   */
  export function extractData<T>(item: FlexibleItem<T>): T {
    return InteropInteractiveGuards.isInteractiveItem(item)
      ? (item as InteractiveItem<T>).data
      : (item as T);
  }

  /**
   * Extract metadata from any item format
   */
  export function extractMeta<T>(item: FlexibleItem<T>): Record<string, any> {
    return InteropInteractiveGuards.isInteractiveItem(item)
      ? item.meta || {}
      : {};
  }

  /**
   * Check if item is disabled
   */
  export function isDisabled<T>(item: FlexibleItem<T>): boolean {
    const meta = extractMeta(item);
    return Boolean(meta["disabled"]);
  }

  /**
   * Check if item is selected
   */
  export function isSelected<T>(item: FlexibleItem<T>): boolean {
    const meta = extractMeta(item);
    return Boolean(meta["selected"]);
  }

  /**
   * Create an interactive item from data and metadata
   */
  export function createInteractiveItem<TData, TMeta = any>(
    data: TData,
    meta?: TMeta,
  ): InteractiveItem<TData, TMeta & Record<string, any>> {
    return { data, meta: meta || ({} as TMeta & Record<string, any>) };
  }

  /**
   * Create a callback item
   */
  export function createCallbackItem<T>(
    data: T,
    callback: (data: T, event?: Event, context?: any) => void,
    meta?: any,
  ): CallbackItem<T> {
    return { data, onInteract: callback, meta };
  }

  /**
   * Create a form item
   */
  export function createFormItem<T>(
    data: T,
    formMeta: FormItem<T>["meta"] = {},
  ): FormItem<T> {
    return { data, meta: formMeta };
  }
}

/**
 * Common interaction patterns as reusable builders
 */
export namespace InteropInteractionPatterns {
  /**
   * Radio button group pattern
   */
  export interface RadioOption {
    value: any;
    label: string;
    description?: string;
  }

  export function createRadioCollection(
    options: RadioOption[],
    selectedValue?: any,
  ): InteropInteractiveCollection<RadioOption> {
    return options.map((option) =>
      InteropInteractiveUtils.createInteractiveItem(option, {
        selected: option.value === selectedValue,
        selectable: true,
      }),
    );
  }

  /**
   * Checkbox group pattern
   */
  export function createCheckboxCollection<T>(
    items: T[],
    selectedValues: any[] = [],
    keyExtractor?: (item: T) => any,
  ): InteropInteractiveCollection<T> {
    return items.map((item) => {
      const key = keyExtractor ? keyExtractor(item) : item;
      return InteropInteractiveUtils.createInteractiveItem(item, {
        selected: selectedValues.includes(key),
        multiSelect: true,
      });
    });
  }

  /**
   * Button group pattern
   */
  export function createButtonCollection<T>(
    items: { data: T; action: (data: T) => void }[],
  ): InteropInteractiveCollection<T> {
    return items.map(({ data, action }) =>
      InteropInteractiveUtils.createCallbackItem(data, action),
    );
  }

  /**
   * Form field collection pattern
   */
  export function createFormFieldCollection<T>(
    fields: Array<{ data: T; formControlName: string; required?: boolean }>,
  ): InteropInteractiveCollection<T> {
    return fields.map(({ data, formControlName, required = false }) =>
      InteropInteractiveUtils.createFormItem(data, {
        formControlName,
        required,
        pristine: true,
        touched: false,
      }),
    );
  }
}

/**
 * Component base helpers for interactive collections
 */
export namespace InteropComponentHelpers {
  /**
   * Selection manager for single/multi-select scenarios
   */
  export class SelectionManager<T> {
    private _selected = new Set<any>();

    constructor(
      private mode: "single" | "multiple" = "single",
      private keyExtractor?: (item: T) => any,
    ) {}

    get selected(): any[] {
      return Array.from(this._selected);
    }

    isSelected(item: T): boolean {
      const key = this.keyExtractor ? this.keyExtractor(item) : item;
      return this._selected.has(key);
    }

    select(item: T): void {
      const key = this.keyExtractor ? this.keyExtractor(item) : item;

      if (this.mode === "single") {
        this._selected.clear();
      }

      this._selected.add(key);
    }

    deselect(item: T): void {
      const key = this.keyExtractor ? this.keyExtractor(item) : item;
      this._selected.delete(key);
    }

    toggle(item: T): void {
      if (this.isSelected(item)) {
        this.deselect(item);
      } else {
        this.select(item);
      }
    }

    clear(): void {
      this._selected.clear();
    }
  }

  /**
   * Keyboard navigation helper
   */
  export class NavigationManager {
    constructor(
      private itemCount: () => number,
      private onNavigate: (index: number) => void,
      private options: {
        orientation?: "horizontal" | "vertical" | "both";
        wrap?: boolean;
      } = {},
    ) {}

    handleKeydown(event: KeyboardEvent, currentIndex: number): boolean {
      const { orientation = "vertical", wrap = true } = this.options;
      const count = this.itemCount();

      let newIndex = currentIndex;

      switch (event.key) {
        case "ArrowUp":
          if (orientation === "vertical" || orientation === "both") {
            newIndex = wrap
              ? (currentIndex - 1 + count) % count
              : Math.max(0, currentIndex - 1);
            event.preventDefault();
          }
          break;

        case "ArrowDown":
          if (orientation === "vertical" || orientation === "both") {
            newIndex = wrap
              ? (currentIndex + 1) % count
              : Math.min(count - 1, currentIndex + 1);
            event.preventDefault();
          }
          break;

        case "ArrowLeft":
          if (orientation === "horizontal" || orientation === "both") {
            newIndex = wrap
              ? (currentIndex - 1 + count) % count
              : Math.max(0, currentIndex - 1);
            event.preventDefault();
          }
          break;

        case "ArrowRight":
          if (orientation === "horizontal" || orientation === "both") {
            newIndex = wrap
              ? (currentIndex + 1) % count
              : Math.min(count - 1, currentIndex + 1);
            event.preventDefault();
          }
          break;

        case "Home":
          newIndex = 0;
          event.preventDefault();
          break;

        case "End":
          newIndex = count - 1;
          event.preventDefault();
          break;

        default:
          return false;
      }

      if (newIndex !== currentIndex) {
        this.onNavigate(newIndex);
        return true;
      }

      return false;
    }
  }
}
