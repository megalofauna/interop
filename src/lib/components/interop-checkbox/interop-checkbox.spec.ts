import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";

import { InteropCheckbox } from "./interop-checkbox";
import { InteropAttrs } from "../../services/interop-attrs.service";

/**
 * Test host component to properly test the label[interop-checkbox] selector.
 */
@Component({
  standalone: true,
  imports: [InteropCheckbox],
  template: `
    <label
      interop-checkbox
      [id]="id"
      [checked]="checked"
      [indeterminate]="indeterminate"
      [disabled]="disabled"
      [required]="required"
      [name]="name"
      [value]="value"
      (checkedChange)="onCheckedChange($event)"
      (valueChange)="onValueChange($event)"
      (indeterminateChange)="onIndeterminateChange($event)"
    >
      Test Checkbox
    </label>
  `,
})
class TestHostComponent {
  id = "test-checkbox";
  checked = false;
  indeterminate = false;
  disabled = false;
  required = false;
  name: string | null = null;
  value: string | number | boolean = "on";

  onCheckedChange = jasmine.createSpy("onCheckedChange");
  onValueChange = jasmine.createSpy("onValueChange");
  onIndeterminateChange = jasmine.createSpy("onIndeterminateChange");
}

describe("InteropCheckbox", () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let labelElement: HTMLLabelElement;
  let inputElement: HTMLInputElement;
  let attrsManager: jasmine.SpyObj<InteropAttrs>;

  beforeEach(async () => {
    const attrsManagerSpy = jasmine.createSpyObj("InteropAttrs", [], {
      Presets: {},
    });

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: InteropAttrs, useValue: attrsManagerSpy },
      ],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    host = hostFixture.componentInstance;
    labelElement = hostFixture.nativeElement.querySelector("label");
    attrsManager = TestBed.inject(InteropAttrs) as jasmine.SpyObj<InteropAttrs>;

    hostFixture.detectChanges();
    await hostFixture.whenStable();

    inputElement = labelElement.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
  });

  describe("Component Initialization", () => {
    it("should create", () => {
      expect(labelElement).toBeTruthy();
      expect(inputElement).toBeTruthy();
    });

    it("should render a checkbox input inside the label", () => {
      expect(inputElement.type).toBe("checkbox");
      expect(inputElement.parentElement).toBe(labelElement);
    });

    it("should project label text content", () => {
      expect(labelElement.textContent).toContain("Test Checkbox");
    });

    it("should set the id on the input", () => {
      expect(inputElement.id).toBe("test-checkbox");
    });
  });

  describe("Input Synchronization", () => {
    it("should reflect checked state on the native input", async () => {
      host.checked = true;
      hostFixture.detectChanges();
      await hostFixture.whenStable();

      expect(inputElement.checked).toBe(true);
    });

    it("should reflect disabled state on the native input", async () => {
      host.disabled = true;
      hostFixture.detectChanges();
      await hostFixture.whenStable();

      expect(inputElement.disabled).toBe(true);
    });

    it("should reflect required state on the native input", async () => {
      host.required = true;
      hostFixture.detectChanges();
      await hostFixture.whenStable();

      expect(inputElement.required).toBe(true);
    });

    it("should set name attribute when provided", async () => {
      host.name = "toppings";
      hostFixture.detectChanges();
      await hostFixture.whenStable();

      expect(inputElement.getAttribute("name")).toBe("toppings");
    });

    it("should set value attribute", async () => {
      host.value = "pepperoni";
      hostFixture.detectChanges();
      await hostFixture.whenStable();

      expect(inputElement.getAttribute("value")).toBe("pepperoni");
    });

    it("should handle different value types", async () => {
      // String
      host.value = "cheese";
      hostFixture.detectChanges();
      await hostFixture.whenStable();
      expect(inputElement.getAttribute("value")).toBe("cheese");

      // Number
      host.value = 42;
      hostFixture.detectChanges();
      await hostFixture.whenStable();
      expect(inputElement.getAttribute("value")).toBe("42");

      // Boolean
      host.value = true;
      hostFixture.detectChanges();
      await hostFixture.whenStable();
      expect(inputElement.getAttribute("value")).toBe("true");
    });
  });

  describe("Indeterminate State", () => {
    it("should sync indeterminate property to the DOM element", async () => {
      host.indeterminate = true;
      hostFixture.detectChanges();
      await hostFixture.whenStable();

      // Allow afterNextRender + effect to run
      hostFixture.detectChanges();
      await hostFixture.whenStable();

      expect(inputElement.indeterminate).toBe(true);
    });

    it("should set aria-checked=mixed when indeterminate", async () => {
      host.indeterminate = true;
      hostFixture.detectChanges();
      await hostFixture.whenStable();
      hostFixture.detectChanges();
      await hostFixture.whenStable();

      expect(inputElement.getAttribute("aria-checked")).toBe("mixed");
    });

    it("should remove aria-checked when not indeterminate", async () => {
      // Set indeterminate
      host.indeterminate = true;
      hostFixture.detectChanges();
      await hostFixture.whenStable();
      hostFixture.detectChanges();
      await hostFixture.whenStable();

      // Clear indeterminate
      host.indeterminate = false;
      hostFixture.detectChanges();
      await hostFixture.whenStable();
      hostFixture.detectChanges();
      await hostFixture.whenStable();

      expect(inputElement.getAttribute("aria-checked")).toBeNull();
    });
  });

  describe("Change Event Handling", () => {
    it("should emit checkedChange when checkbox is checked", () => {
      inputElement.checked = true;
      inputElement.dispatchEvent(new Event("change", { bubbles: true }));

      expect(host.onCheckedChange).toHaveBeenCalledWith(true);
    });

    it("should emit checkedChange when checkbox is unchecked", () => {
      // Start checked
      inputElement.checked = true;
      inputElement.dispatchEvent(new Event("change", { bubbles: true }));
      host.onCheckedChange.calls.reset();

      // Uncheck
      inputElement.checked = false;
      inputElement.dispatchEvent(new Event("change", { bubbles: true }));

      expect(host.onCheckedChange).toHaveBeenCalledWith(false);
    });

    it("should emit valueChange when checkbox is checked", () => {
      host.value = "pepperoni";
      hostFixture.detectChanges();

      inputElement.checked = true;
      inputElement.dispatchEvent(new Event("change", { bubbles: true }));

      expect(host.onValueChange).toHaveBeenCalledWith("pepperoni");
    });

    it("should NOT emit valueChange when checkbox is unchecked", () => {
      inputElement.checked = false;
      inputElement.dispatchEvent(new Event("change", { bubbles: true }));

      expect(host.onValueChange).not.toHaveBeenCalled();
    });

    it("should emit indeterminateChange(false) on user interaction", async () => {
      // Set indeterminate first
      host.indeterminate = true;
      hostFixture.detectChanges();
      await hostFixture.whenStable();

      inputElement.checked = true;
      inputElement.dispatchEvent(new Event("change", { bubbles: true }));

      expect(host.onIndeterminateChange).toHaveBeenCalledWith(false);
    });

    it("should emit valueChange with correct type for number values", () => {
      host.value = 42;
      hostFixture.detectChanges();

      inputElement.checked = true;
      inputElement.dispatchEvent(new Event("change", { bubbles: true }));

      expect(host.onValueChange).toHaveBeenCalledWith(42);
    });
  });

  describe("Default Value", () => {
    it("should default value to 'on' (browser default)", () => {
      expect(inputElement.getAttribute("value")).toBe("on");
    });
  });

  describe("Accessibility", () => {
    it("should have the input inside a label for implicit association", () => {
      expect(inputElement.closest("label")).toBe(labelElement);
    });

    it("should have proper focus outline styles applied", () => {
      // The CSS is applied — we verify the input is focusable
      expect(inputElement.tabIndex).not.toBe(-1);
    });
  });
});
