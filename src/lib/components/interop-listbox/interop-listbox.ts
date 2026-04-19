import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  contentChildren,
  inject,
  input,
  isDevMode,
  output,
  signal,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { InteropOption } from "./interop-option.directive";
import {
  INTEROP_LISTBOX_TOKEN,
  type IInteropListbox,
  type SelectControlValue,
} from "./interop-listbox.token";

export type { SelectControlValue } from "./interop-listbox.token";

export type SelectControl = {
  value: SelectControlValue;
  label: string;
  disabled?: boolean;
  icon?: string;
  description?: string;
};

/** Unified shape used internally for keyboard navigation regardless of mode. */
interface NavOption {
  value: SelectControlValue;
  label: string;
  disabled: boolean;
  id: string;
}

let nextListboxId = 0;

/**
 * InteropListbox — accessible listbox with keyboard navigation, single/multi-select,
 * CVA support, and both declarative and content-projection modes.
 *
 * This is the foundational selection primitive. InteropSelect and InteropMultiSelect
 * are built on top of it.
 *
 * ## Modes
 *
 * ### Declarative
 * Pass a `controls` array. The listbox renders options internally.
 *
 * ### Content projection
 * Project `[interop-option]` elements as children. Use when you need custom
 * option markup (icons, avatars, secondary text) beyond what `SelectControl` provides.
 *
 * ## Selection
 *
 * Single-select by default. Set `[multiselectable]="true"` for multi-select;
 * the CVA value becomes `SelectControlValue[]`.
 *
 * @example Declarative single-select
 * ```html
 * <ul interop-listbox [controls]="options" [(value)]="selected"></ul>
 * ```
 *
 * @example Declarative multi-select
 * ```html
 * <ul interop-listbox [controls]="options" [multiselectable]="true" [(value)]="selected"></ul>
 * ```
 *
 * @example Content projection
 * ```html
 * <ul interop-listbox [(value)]="selected">
 *   <li interop-option value="a" label="Alpha">
 *     <app-icon name="alpha" /> Alpha
 *   </li>
 * </ul>
 * ```
 *
 * @example Reactive forms
 * ```html
 * <ul interop-listbox formControlName="size" [controls]="sizeOptions"></ul>
 * ```
 *
 * @example Inside a popup (responds to Escape via closeRequest)
 * ```html
 * <ul interop-listbox [controls]="options" (closeRequest)="close()"></ul>
 * ```
 */
@Component({
  selector: "ul[interop-listbox], ol[interop-listbox]",
  standalone: true,
  templateUrl: "./interop-listbox.html",
  styleUrl: "./interop-listbox.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InteropListbox,
      multi: true,
    },
    {
      provide: INTEROP_LISTBOX_TOKEN,
      useExisting: InteropListbox,
    },
  ],
  host: {
    role: "listbox",
    tabindex: "0",
    "[attr.aria-multiselectable]": "multiselectable() || null",
    "[attr.aria-disabled]": "disabled() || null",
    "[attr.aria-activedescendant]": "activeOptionId()",
    "[attr.aria-label]": "ariaLabel() || null",
    "[attr.aria-labelledby]": "ariaLabelledby() || null",
    "(keydown)": "onKeydown($event)",
    "(focus)": "onFocus()",
    "(blur)": "onBlur()",
  },
})
export class InteropListbox implements ControlValueAccessor, IInteropListbox {
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  constructor() {
    if (isDevMode()) {
      afterNextRender(() => {
        const tag = this.hostEl.nativeElement.tagName.toLowerCase();
        if (tag !== "ul" && tag !== "ol") {
          console.warn(
            `interop-listbox: expected a <ul> or <ol> host element, got <${tag}>. ` +
            "Use <ul interop-listbox> or <ol interop-listbox> for correct list semantics.",
          );
        }
      });
    }
  }

  // ── Inputs ────────────────────────────────────────────────────────────────

  /** Declarative option list. Controls win over content projection when non-empty. */
  controls = input<SelectControl[]>();

  /** Current selected value (single) or values (multi). Two-way bindable. */
  value = input<SelectControlValue | SelectControlValue[] | null>(null);

  /** Enables multi-select. CVA value becomes SelectControlValue[]. */
  multiselectable = input<boolean>(false);

  /** Disables the entire listbox. */
  disabled = input<boolean>(false);

  /** Accessible label when no visible label element is associated. */
  ariaLabel = input<string | null>(null, { alias: "aria-label" });

  /** ID of an external element that labels this listbox. */
  ariaLabelledby = input<string | null>(null, { alias: "aria-labelledby" });

  // ── Outputs ───────────────────────────────────────────────────────────────

  /** Emitted when the selection changes. */
  valueChange = output<SelectControlValue | SelectControlValue[] | null>();

  /** Emitted when the active (keyboard-focused) option changes. */
  activeItemChange = output<SelectControlValue | null>();

  /**
   * Emitted when Escape is pressed.
   * No-op when standalone; used by parent popup components to close.
   */
  closeRequest = output<void>();

  // ── Content children ──────────────────────────────────────────────────────

  private readonly projectedOptions = contentChildren(InteropOption);

  // ── Internal state ────────────────────────────────────────────────────────

  private readonly instanceId = `interop-listbox-${nextListboxId++}`;
  private readonly activeIndex = signal<number>(-1);
  private readonly internalValue = signal<
    SelectControlValue | SelectControlValue[] | null
  >(null);

  private typeaheadBuffer = "";
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  private onChangeFn: (value: unknown) => void = () => {};
  private onTouchedFn: () => void = () => {};

  // ── Computed ──────────────────────────────────────────────────────────────

  isDeclarativeMode = computed(() => {
    const controls = this.controls();
    return Array.isArray(controls) && controls.length > 0;
  });

  /**
   * Unified option list for navigation. Abstracts over declarative vs. projected mode.
   * All keyboard nav and type-ahead operate on this.
   */
  private optionsForNav = computed((): NavOption[] => {
    if (this.isDeclarativeMode()) {
      return (this.controls() ?? []).map((c, i) => ({
        value: c.value,
        label: c.label,
        disabled: !!c.disabled,
        id: this.optionId(i),
      }));
    }
    return this.projectedOptions().map((opt) => ({
      value: opt.value(),
      label: opt.label(),
      disabled: opt.disabled(),
      id: opt.optionId,
    }));
  });

  /** ID of the currently active (keyboard-navigated) option. */
  activeOptionId = computed((): string | null => {
    const idx = this.activeIndex();
    if (idx === -1) return null;
    return this.optionsForNav()[idx]?.id ?? null;
  });

  /** The currently active option's value. Exposed for InteropOption directives. */
  private activeValue = computed((): SelectControlValue | null => {
    const idx = this.activeIndex();
    if (idx === -1) return null;
    return this.optionsForNav()[idx]?.value ?? null;
  });

  // ── IInteropListbox interface (consumed by InteropOption directives) ───────

  isSelected(value: SelectControlValue): boolean {
    const iv = this.internalValue();
    if (Array.isArray(iv)) return iv.includes(value);
    return iv === value;
  }

  isActiveValue(value: SelectControlValue): boolean {
    return this.activeValue() === value;
  }

  selectValue(value: SelectControlValue): void {
    if (this.disabled()) return;
    this.toggleOrSetValue(value);
    this.onTouchedFn();
  }

  setActiveValue(value: SelectControlValue): void {
    const idx = this.optionsForNav().findIndex((o) => o.value === value);
    if (idx !== -1) this.activeIndex.set(idx);
  }

  // ── Keyboard navigation ───────────────────────────────────────────────────

  onKeydown(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;
    if (this.disabled()) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        this.moveActive(-1);
        break;
      case "Home":
        event.preventDefault();
        this.setActiveFirst();
        break;
      case "End":
        event.preventDefault();
        this.setActiveLast();
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        this.selectActive();
        break;
      case "Escape":
        event.preventDefault();
        this.closeRequest.emit();
        break;
      default:
        if (event.key.length === 1) {
          this.handleTypeahead(event.key);
        }
    }
  }

  private moveActive(delta: number): void {
    const options = this.optionsForNav();
    let idx = this.activeIndex() + delta;
    // Skip disabled options
    while (idx >= 0 && idx < options.length && options[idx].disabled) {
      idx += delta;
    }
    if (idx >= 0 && idx < options.length) {
      this.activeIndex.set(idx);
      this.scrollActiveIntoView();
      this.activeItemChange.emit(options[idx].value);
    }
  }

  private setActiveFirst(): void {
    const options = this.optionsForNav();
    const idx = options.findIndex((o) => !o.disabled);
    if (idx !== -1) {
      this.activeIndex.set(idx);
      this.scrollActiveIntoView();
      this.activeItemChange.emit(options[idx].value);
    }
  }

  private setActiveLast(): void {
    const options = this.optionsForNav();
    let idx = options.length - 1;
    while (idx >= 0 && options[idx].disabled) idx--;
    if (idx >= 0) {
      this.activeIndex.set(idx);
      this.scrollActiveIntoView();
      this.activeItemChange.emit(options[idx].value);
    }
  }

  private selectActive(): void {
    const idx = this.activeIndex();
    if (idx === -1) return;
    const option = this.optionsForNav()[idx];
    if (!option || option.disabled) return;
    this.toggleOrSetValue(option.value);
    this.onTouchedFn();
  }

  private handleTypeahead(char: string): void {
    if (this.typeaheadTimer !== null) clearTimeout(this.typeaheadTimer);
    this.typeaheadBuffer += char.toLowerCase();

    const options = this.optionsForNav();
    const start = this.activeIndex() + 1;
    const len = options.length;

    // Search forward from current position, wrapping around
    for (let i = 0; i < len; i++) {
      const idx = (start + i) % len;
      const opt = options[idx];
      if (!opt.disabled && opt.label.toLowerCase().startsWith(this.typeaheadBuffer)) {
        this.activeIndex.set(idx);
        this.scrollActiveIntoView();
        this.activeItemChange.emit(opt.value);
        break;
      }
    }

    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadBuffer = "";
    }, 500);
  }

  private scrollActiveIntoView(): void {
    const id = this.activeOptionId();
    if (!id) return;
    const el = this.hostEl.nativeElement.querySelector(`#${id}`);
    el?.scrollIntoView({ block: "nearest" });
  }

  // ── Focus / blur ──────────────────────────────────────────────────────────

  onFocus(): void {
    if (this.activeIndex() !== -1) return;
    // On first focus: activate the selected option, or the first enabled one
    const options = this.optionsForNav();
    const selectedIdx = options.findIndex(
      (o) => !o.disabled && this.isSelected(o.value),
    );
    if (selectedIdx !== -1) {
      this.activeIndex.set(selectedIdx);
    } else {
      const firstIdx = options.findIndex((o) => !o.disabled);
      this.activeIndex.set(firstIdx);
    }
  }

  onBlur(): void {
    this.activeIndex.set(-1);
    this.onTouchedFn();
  }

  // ── Value management ──────────────────────────────────────────────────────

  private toggleOrSetValue(value: SelectControlValue): void {
    if (this.multiselectable()) {
      const current = Array.isArray(this.internalValue())
        ? [...(this.internalValue() as SelectControlValue[])]
        : [];
      const idx = current.indexOf(value);
      if (idx > -1) {
        current.splice(idx, 1);
      } else {
        current.push(value);
      }
      this.internalValue.set(current);
    } else {
      this.internalValue.set(value);
    }
    const next = this.internalValue();
    this.valueChange.emit(next);
    this.onChangeFn(next);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Generates a stable, unique ID for a declarative option by index. */
  optionId(index: number): string {
    return `${this.instanceId}-option-${index}`;
  }

  // ── ControlValueAccessor ──────────────────────────────────────────────────

  writeValue(value: SelectControlValue | SelectControlValue[] | null): void {
    this.internalValue.set(
      this.multiselectable()
        ? Array.isArray(value)
          ? value
          : []
        : (value ?? null),
    );
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(): void {
    // Driven by the [disabled] input
  }
}
