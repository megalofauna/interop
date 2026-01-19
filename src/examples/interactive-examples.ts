import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Observable, BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";
import {
  CollectionInput,
  normalizeCollection,
  createUniversalTrackBy,
} from "../types";
import {
  InteractiveItem,
  CallbackItem,
  FormItem,
  InteropInteractiveCollection,
  InteropInteractiveUtils,
  InteropInteractionPatterns,
  InteropComponentHelpers,
} from "../types/interactive-extensions";

/**
 * Examples demonstrating clean separation between data collection and interaction orchestration.
 * The collection provides data, the parent orchestrates interactions, children handle individual behavior.
 */

// ============================================================================
// EXAMPLE 1: Radio Group - Pure Data Approach
// Collection provides options, parent handles selection logic
// ============================================================================

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

@Component({
  selector: "interop-radio-group",
  imports: [CommonModule],
  template: `
    <div
      role="radiogroup"
      class="radio-group"
      [attr.aria-labelledby]="labelId"
      (keydown)="handleKeyNavigation($event)"
    >
      <div
        *ngFor="let option of options$ | async; let i = index; trackBy: trackBy"
        class="radio-option"
        [class.selected]="selectedValue === option.value"
        [class.disabled]="isOptionDisabled(option)"
        [class.focused]="focusedIndex === i"
      >
        <input
          type="radio"
          [id]="'radio-' + groupId + '-' + i"
          [value]="option.value"
          [checked]="selectedValue === option.value"
          [disabled]="isOptionDisabled(option)"
          [name]="groupName"
          (change)="onSelectionChange(option.value)"
          (focus)="onOptionFocus(i)"
          (blur)="onOptionBlur()"
        />

        <label [for]="'radio-' + groupId + '-' + i" class="radio-label">
          <span class="radio-text">{{ option.label }}</span>
          <span *ngIf="option.description" class="radio-description">{{
            option.description
          }}</span>
        </label>
      </div>
    </div>
  `,
  styles: [
    `
      .radio-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .radio-option {
        display: flex;
        align-items: flex-start;
      }
      .radio-option.disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .radio-option.focused {
        outline: 2px solid var(--focus-color, blue);
      }
      .radio-label {
        display: flex;
        flex-direction: column;
        margin-left: 8px;
        cursor: pointer;
      }
      .radio-description {
        font-size: 0.875em;
        color: var(--text-secondary, #666);
      }
    `,
  ],
})
export class InteropRadioGroupComponent {
  @Input() collection: CollectionInput<RadioOption> = [];
  @Input() selectedValue: string | null = null;
  @Input() disabledOptions: string[] = [];
  @Input() labelId?: string;
  @Output() selectionChange = new EventEmitter<string>();
  @Output() optionFocus = new EventEmitter<{
    option: RadioOption;
    index: number;
  }>();

  options$ = normalizeCollection(this.collection);
  trackBy = createUniversalTrackBy("value");

  groupId = Math.random().toString(36).substr(2, 9);
  groupName = `radio-group-${this.groupId}`;
  focusedIndex = -1;

  private navigationManager = new InteropComponentHelpers.NavigationManager(
    () => this.getCurrentOptionCount(),
    (index) => this.focusOption(index),
    { orientation: "vertical", wrap: true },
  );

  onSelectionChange(value: string): void {
    this.selectedValue = value;
    this.selectionChange.emit(value);
  }

  onOptionFocus(index: number): void {
    this.focusedIndex = index;
    // Emit focus event with option data
    this.options$
      .pipe(map((opts: any) => opts[index]))
      .subscribe((option: any) => {
        if (option) {
          this.optionFocus.emit({ option, index });
        }
      });
  }

  onOptionBlur(): void {
    this.focusedIndex = -1;
  }

  isOptionDisabled(option: RadioOption): boolean {
    return this.disabledOptions.includes(option.value);
  }

  handleKeyNavigation(event: KeyboardEvent): void {
    this.navigationManager.handleKeydown(event, this.focusedIndex);
  }

  private getCurrentOptionCount(): number {
    let count = 0;
    this.options$.subscribe((opts) => (count = opts.length)).unsubscribe();
    return count;
  }

  private focusOption(index: number): void {
    const radioInput = document.getElementById(
      `radio-${this.groupId}-${index}`,
    ) as HTMLInputElement;
    if (radioInput && !radioInput.disabled) {
      radioInput.focus();
      this.focusedIndex = index;
    }
  }
}

// ============================================================================
// EXAMPLE 2: Button Group - Collection with Optional Callbacks
// Shows how to support both data-driven and callback-driven patterns
// ============================================================================

interface ButtonData {
  id: string;
  label: string;
  icon?: string;
  variant?: "primary" | "secondary" | "danger";
}

@Component({
  selector: "interop-button-group",
  imports: [CommonModule],
  template: `
    <div class="button-group" role="group" [attr.aria-label]="groupLabel">
      <button
        *ngFor="
          let item of normalizedItems$ | async;
          let i = index;
          trackBy: trackBy
        "
        type="button"
        class="group-button"
        [class]="getButtonClasses(item)"
        [disabled]="InteractiveUtils.isDisabled(item)"
        [attr.aria-pressed]="InteractiveUtils.isSelected(item)"
        (click)="handleButtonClick(item, $event, i)"
      >
        <i *ngIf="item.data.icon" class="button-icon {{ item.data.icon }}"></i>

        <span class="button-label">{{ item.data.label }}</span>
      </button>
    </div>
  `,
  styles: [
    `
      .button-group {
        display: flex;
        gap: 4px;
      }
      .group-button {
        padding: 8px 16px;
        border: 1px solid var(--border-color, #ccc);
        background: var(--bg-color, white);
        cursor: pointer;
        transition: all 0.2s;
      }
      .group-button:hover:not(:disabled) {
        background: var(--hover-bg, #f5f5f5);
      }
      .group-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .group-button.selected {
        background: var(--selected-bg, #007bff);
        color: white;
      }
      .group-button.primary {
        background: var(--primary-color, #007bff);
        color: white;
      }
      .group-button.danger {
        background: var(--danger-color, #dc3545);
        color: white;
      }
      .button-icon {
        margin-right: 4px;
      }
    `,
  ],
})
export class InteropButtonGroupComponent {
  @Input() collection: InteropInteractiveCollection<ButtonData> = [];
  @Input() groupLabel?: string;
  @Input() selectionMode: "none" | "single" | "multiple" = "none";
  @Output() buttonClick = new EventEmitter<{
    data: ButtonData;
    index: number;
    event: Event;
  }>();
  @Output() selectionChange = new EventEmitter<ButtonData[]>();

  // Expose utilities for template use
  InteractiveUtils = InteropInteractiveUtils;

  normalizedItems$ = normalizeCollection(this.collection as any).pipe(
    map((items) => items.map(InteropInteractiveUtils.normalizeItem)),
  );
  trackBy = createUniversalTrackBy(
    (item: any) => InteropInteractiveUtils.extractData(item).id,
  );

  private selectionManager =
    new InteropComponentHelpers.SelectionManager<ButtonData>(
      this.selectionMode as "single" | "multiple",
      (item) => item.id,
    );

  handleButtonClick(
    item: InteractiveItem<ButtonData>,
    event: Event,
    index: number,
  ): void {
    if (InteropInteractiveUtils.isDisabled(item)) return;

    // Handle selection if enabled
    if (this.selectionMode !== "none") {
      this.selectionManager.toggle(item.data);
      this.updateItemSelection();
      this.selectionChange.emit(this.selectionManager.selected);
    }

    // Use item callback if provided
    const callbackItem = item as CallbackItem<ButtonData>;
    if (callbackItem.onInteract) {
      callbackItem.onInteract(item.data, event, { index, component: this });
    }

    // Always emit the click event for parent handling
    this.buttonClick.emit({ data: item.data, index, event });
  }

  getButtonClasses(item: InteractiveItem<ButtonData>): string {
    const classes = ["group-button"];
    const meta = InteropInteractiveUtils.extractMeta(item);
    const data = item.data;

    if (meta["selected"]) classes.push("selected");
    if (meta["disabled"]) classes.push("disabled");
    if (data.variant) classes.push(data.variant);
    if (meta["cssClass"]) classes.push(meta["cssClass"]);

    return classes.join(" ");
  }

  private updateItemSelection(): void {
    // This would update the collection items' selection state
    // In a real implementation, you might emit this to update the source
  }
}

// ============================================================================
// EXAMPLE 3: Form Field Collection - Integration with Angular Forms
// Shows how collection can work with reactive forms while parent orchestrates validation
// ============================================================================

interface FormFieldData {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "textarea";
  placeholder?: string;
  helpText?: string;
}

@Component({
  selector: "interop-form-fields",
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="formGroup" class="form-fields">
      <div
        *ngFor="
          let field of formFields$ | async;
          let i = index;
          trackBy: trackBy
        "
        class="form-field"
        [class.required]="isFieldRequired(field)"
        [class.invalid]="isFieldInvalid(field)"
        [class.touched]="isFieldTouched(field)"
      >
        <label [for]="field.data.name" class="field-label">
          {{ field.data.label }}
          <span *ngIf="isFieldRequired(field)" class="required-indicator"
            >*</span
          >
        </label>

        <input
          *ngIf="field.data.type !== 'textarea'"
          [type]="field.data.type"
          [id]="field.data.name"
          [formControlName]="field.data.name"
          [placeholder]="field.data.placeholder || ''"
          class="field-input"
          (blur)="onFieldBlur(field)"
          (focus)="onFieldFocus(field)"
        />

        <textarea
          *ngIf="field.data.type === 'textarea'"
          [id]="field.data.name"
          [formControlName]="field.data.name"
          [placeholder]="field.data.placeholder || ''"
          class="field-input field-textarea"
          (blur)="onFieldBlur(field)"
          (focus)="onFieldFocus(field)"
        >
        </textarea>

        <div *ngIf="field.data.helpText" class="field-help">
          {{ field.data.helpText }}
        </div>

        <div *ngIf="getFieldErrors(field).length > 0" class="field-errors">
          <div *ngFor="let error of getFieldErrors(field)" class="field-error">
            {{ error }}
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button
          type="submit"
          class="submit-button"
          [disabled]="formGroup.invalid"
          (click)="onSubmit()"
        >
          Submit
        </button>
        <button type="button" class="reset-button" (click)="onReset()">
          Reset
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .form-fields {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .field-label {
        font-weight: 500;
        color: var(--text-primary, #333);
      }
      .required-indicator {
        color: var(--error-color, #dc3545);
      }
      .field-input {
        padding: 8px 12px;
        border: 1px solid var(--border-color, #ccc);
        border-radius: 4px;
      }
      .field-textarea {
        min-height: 80px;
        resize: vertical;
      }
      .form-field.invalid .field-input {
        border-color: var(--error-color, #dc3545);
      }
      .field-help {
        font-size: 0.875em;
        color: var(--text-secondary, #666);
      }
      .field-errors {
        color: var(--error-color, #dc3545);
        font-size: 0.875em;
      }
      .form-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }
      .submit-button,
      .reset-button {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .submit-button {
        background: var(--primary-color, #007bff);
        color: white;
      }
      .submit-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .reset-button {
        background: var(--secondary-color, #6c757d);
        color: white;
      }
    `,
  ],
})
export class InteropFormFieldsComponent {
  @Input() collection: InteropInteractiveCollection<FormFieldData> = [];
  @Input() initialValues: Record<string, any> = {};
  @Output() fieldFocus = new EventEmitter<FormFieldData>();
  @Output() fieldBlur = new EventEmitter<FormFieldData>();
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formReset = new EventEmitter<void>();
  @Output() formChange = new EventEmitter<any>();

  formGroup = new FormGroup({});

  formFields$ = normalizeCollection(this.collection as any).pipe(
    map((fields) => {
      // Update form group when collection changes
      this.updateFormGroup(fields);
      return fields.map(InteropInteractiveUtils.normalizeItem);
    }),
  );

  trackBy = createUniversalTrackBy(
    (item: any) => InteropInteractiveUtils.extractData(item).name,
  );

  private updateFormGroup(fields: any[]): void {
    // Clear existing controls
    Object.keys(this.formGroup.controls).forEach((key) => {
      this.formGroup.removeControl(key);
    });

    // Add controls for current fields
    fields.forEach((field) => {
      const fieldData = InteropInteractiveUtils.extractData(field);
      const meta = InteropInteractiveUtils.extractMeta(field);

      const validators = [];
      if (meta["required"]) validators.push(Validators.required);
      if (fieldData.type === "email") validators.push(Validators.email);

      const initialValue = this.initialValues[fieldData.name] || "";
      this.formGroup.addControl(
        fieldData.name,
        new FormControl(initialValue, validators),
      );
    });

    // Subscribe to form changes
    this.formGroup.valueChanges.subscribe((value: any) => {
      this.formChange.emit(value);
    });
  }

  onFieldFocus(field: InteractiveItem<FormFieldData>): void {
    this.fieldFocus.emit(field.data);
  }

  onFieldBlur(field: InteractiveItem<FormFieldData>): void {
    const control = this.formGroup.get(field.data.name);
    if (control) {
      control.markAsTouched();
    }
    this.fieldBlur.emit(field.data);
  }

  onSubmit(): void {
    if (this.formGroup.valid) {
      this.formSubmit.emit(this.formGroup.value);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.formGroup.controls).forEach((key) => {
        this.formGroup.get(key)?.markAsTouched();
      });
    }
  }

  onReset(): void {
    this.formGroup.reset();
    this.formReset.emit();
  }

  isFieldRequired(field: InteractiveItem<FormFieldData>): boolean {
    const meta = InteropInteractiveUtils.extractMeta(field);
    return Boolean(meta["required"]);
  }

  isFieldInvalid(field: InteractiveItem<FormFieldData>): boolean {
    const control = this.formGroup.get(field.data.name);
    return Boolean(control && control.invalid && control.touched);
  }

  isFieldTouched(field: InteractiveItem<FormFieldData>): boolean {
    const control = this.formGroup.get(field.data.name);
    return Boolean(control && control.touched);
  }

  getFieldErrors(field: InteractiveItem<FormFieldData>): string[] {
    const control = this.formGroup.get(field.data.name);
    if (!control || !control.errors || !control.touched) return [];

    const errors: string[] = [];
    if (control.errors["required"])
      errors.push(`${field.data.label} is required`);
    if (control.errors["email"])
      errors.push("Please enter a valid email address");

    return errors;
  }
}

// ============================================================================
// USAGE EXAMPLES: How to use these components with different data sources
// ============================================================================

export class InteractiveUsageExamples {
  /**
   * EXAMPLE: Radio Group Usage
   */
  static createRadioGroupExample() {
    // Pure data approach
    const sizeOptions: RadioOption[] = [
      {
        value: "small",
        label: "Small",
        description: "Perfect for personal use",
      },
      { value: "medium", label: "Medium", description: "Good for small teams" },
      { value: "large", label: "Large", description: "Enterprise solution" },
    ];

    return {
      // Static array
      staticOptions: sizeOptions,

      // Observable from service
      observableOptions: new BehaviorSubject(sizeOptions),

      // Promise from API
      promiseOptions: Promise.resolve(sizeOptions),

      // Enhanced with metadata (using extensions)
      enhancedOptions: sizeOptions.map((option) =>
        InteropInteractiveUtils.createInteractiveItem(option, {
          disabled: option.value === "large", // Enterprise tier disabled for demo
          cssClass: `size-option-${option.value}`,
        }),
      ),
    };
  }

  /**
   * EXAMPLE: Button Group Usage
   */
  static createButtonGroupExample() {
    const actions: ButtonData[] = [
      { id: "save", label: "Save", icon: "fas fa-save", variant: "primary" },
      {
        id: "cancel",
        label: "Cancel",
        icon: "fas fa-times",
        variant: "secondary",
      },
      {
        id: "delete",
        label: "Delete",
        icon: "fas fa-trash",
        variant: "danger",
      },
    ];

    return {
      // Pure data approach - parent handles all logic
      dataOnly: actions,

      // With callbacks - items carry their own behavior
      withCallbacks: actions.map((action) =>
        InteropInteractiveUtils.createCallbackItem(
          action,
          (data: ButtonData, event?: Event) => {
            console.log(`${data.label} button clicked!`, event);
            // Each button can have its own logic
            switch (data.id) {
              case "save":
                this.handleSave();
                break;
              case "cancel":
                this.handleCancel();
                break;
              case "delete":
                this.confirmDelete();
                break;
            }
          },
        ),
      ),

      // Mixed approach - some items have callbacks, others rely on parent
      mixed: [
        actions[0], // Save - handled by parent
        InteropInteractiveUtils.createCallbackItem(actions[1], () =>
          this.handleCancel(),
        ), // Cancel - self-contained
        InteropInteractiveUtils.createInteractiveItem(actions[2], {
          disabled: true,
        }), // Delete - disabled
      ],
    };
  }

  /**
   * EXAMPLE: Form Fields Usage
   */
  static createFormExample() {
    const userFields: FormFieldData[] = [
      {
        name: "firstName",
        label: "First Name",
        type: "text",
        placeholder: "Enter your first name",
      },
      {
        name: "lastName",
        label: "Last Name",
        type: "text",
        placeholder: "Enter your last name",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "Enter your email address",
      },
      { name: "password", label: "Password", type: "password" },
      {
        name: "bio",
        label: "Biography",
        type: "textarea",
        placeholder: "Tell us about yourself",
        helpText: "Optional - max 500 characters",
      },
    ];

    return {
      // Basic form fields
      fields: userFields,

      // Enhanced with validation metadata
      enhancedFields: userFields.map((field) =>
        InteropInteractiveUtils.createFormItem(field, {
          required: ["firstName", "lastName", "email", "password"].includes(
            field.name,
          ),
          pristine: true,
          touched: false,
        }),
      ),

      // Dynamic fields from API
      dynamicFields: Promise.resolve(userFields),

      // Initial form values
      initialValues: {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
      },
    };
  }

  // Mock helper methods
  private static handleSave() {
    console.log("Saving...");
  }
  private static handleCancel() {
    console.log("Cancelling...");
  }
  private static confirmDelete() {
    console.log("Confirm delete...");
  }
}

/**
 * COMPLETE USAGE EXAMPLE: Parent component using all three interactive collections
 */
@Component({
  selector: "app-interactive-demo",
  imports: [
    InteropRadioGroupComponent,
    InteropButtonGroupComponent,
    InteropFormFieldsComponent,
  ],
  template: `
    <div class="demo-container">
      <section class="demo-section">
        <h3>Size Selection</h3>
        <interop-radio-group
          [collection]="radioOptions"
          [selectedValue]="selectedSize"
          (selectionChange)="onSizeChange($event)"
        >
        </interop-radio-group>
      </section>

      <section class="demo-section">
        <h3>Actions</h3>
        <interop-button-group
          [collection]="buttonActions"
          [selectionMode]="'single'"
          (buttonClick)="onActionClick($event)"
          (selectionChange)="onActionSelection($event)"
        >
        </interop-button-group>
      </section>

      <section class="demo-section">
        <h3>User Information</h3>
        <interop-form-fields
          [collection]="formFields"
          [initialValues]="initialFormValues"
          (formSubmit)="onFormSubmit($event)"
          (formChange)="onFormChange($event)"
        >
        </interop-form-fields>
      </section>
    </div>
  `,
})
export class InteractiveDemoComponent {
  // Each collection can come from any source - static, observable, promise, etc.
  radioOptions =
    InteractiveUsageExamples.createRadioGroupExample().enhancedOptions;
  buttonActions =
    InteractiveUsageExamples.createButtonGroupExample().withCallbacks;
  formFields = InteractiveUsageExamples.createFormExample().enhancedFields;
  initialFormValues =
    InteractiveUsageExamples.createFormExample().initialValues;

  selectedSize: string | null = null;

  onSizeChange(size: string): void {
    this.selectedSize = size;
    console.log("Selected size:", size);
  }

  onActionClick(event: {
    data: ButtonData;
    index: number;
    event: Event;
  }): void {
    console.log("Action clicked:", event.data.label);
  }

  onActionSelection(selected: ButtonData[]): void {
    console.log(
      "Selected actions:",
      selected.map((a) => a.label),
    );
  }

  onFormSubmit(formValue: any): void {
    console.log("Form submitted:", formValue);
  }

  onFormChange(formValue: any): void {
    console.log("Form changed:", formValue);
  }
}
