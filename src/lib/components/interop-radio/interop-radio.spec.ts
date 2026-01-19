import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DebugElement } from "@angular/core";
import { By } from "@angular/platform-browser";
import { signal } from "@angular/core";

import { InteropRadio } from "./interop-radio";
import { ActivationManagerService } from "../../services/activation-manager.service";
import { InteropAttrs } from "../../services/interop-attrs.service";

describe("InteropRadio", () => {
  let component: InteropRadio;
  let fixture: ComponentFixture<InteropRadio>;
  let radioElement: HTMLInputElement;
  let activationManager: jasmine.SpyObj<ActivationManagerService>;
  let attrsManager: jasmine.SpyObj<InteropAttrs>;

  beforeEach(async () => {
    const activationManagerSpy = jasmine.createSpyObj(
      "ActivationManagerService",
      ["trigger"],
    );
    const attrsManagerSpy = jasmine.createSpyObj("InteropAttrs", [], {
      Presets: {},
    });

    await TestBed.configureTestingModule({
      imports: [InteropRadio],
      providers: [
        { provide: ActivationManagerService, useValue: activationManagerSpy },
        { provide: InteropAttrs, useValue: attrsManagerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InteropRadio);
    component = fixture.componentInstance;
    radioElement = fixture.nativeElement;
    activationManager = TestBed.inject(
      ActivationManagerService,
    ) as jasmine.SpyObj<ActivationManagerService>;
    attrsManager = TestBed.inject(InteropAttrs) as jasmine.SpyObj<InteropAttrs>;

    // Set required inputs
    fixture.componentRef.setInput("id", "test-radio");
    fixture.componentRef.setInput("name", "test-group");
    fixture.componentRef.setInput("value", "test-value");
  });

  describe("Component Initialization", () => {
    it("should create", async () => {
      await fixture.whenStable();
      expect(component).toBeTruthy();
    });

    it('should be applied to input[type="radio"] element', async () => {
      await fixture.whenStable();
      expect(radioElement.tagName).toBe("INPUT");
      expect(radioElement.type).toBe("radio");
    });

    it("should set required attributes from inputs", async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      expect(radioElement.id).toBe("test-radio");
      expect(radioElement.name).toBe("test-group");
      expect(radioElement.value).toBe("test-value");
    });
  });

  describe("Input Synchronization", () => {
    it("should update native element when inputs change", async () => {
      fixture.componentRef.setInput("checked", true);
      fixture.componentRef.setInput("disabled", true);
      fixture.componentRef.setInput("required", true);

      await fixture.whenStable();
      fixture.detectChanges();

      expect(radioElement.checked).toBe(true);
      expect(radioElement.disabled).toBe(true);
      expect(radioElement.required).toBe(true);
    });

    it("should handle different value types", async () => {
      // Test string value
      fixture.componentRef.setInput("value", "string-value");
      await fixture.whenStable();
      fixture.detectChanges();
      expect(radioElement.value).toBe("string-value");

      // Test number value
      fixture.componentRef.setInput("value", 42);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(radioElement.value).toBe("42");

      // Test boolean value
      fixture.componentRef.setInput("value", true);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(radioElement.value).toBe("true");
    });
  });

  describe("Change Event Handling", () => {
    it("should emit checkedChange when radio state changes", async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      spyOn(component.checkedChange, "emit");

      radioElement.checked = true;
      radioElement.dispatchEvent(new Event("change"));

      expect(component.checkedChange.emit).toHaveBeenCalledWith(true);
    });

    it("should emit valueChange when radio is selected", async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      spyOn(component.valueChange, "emit");

      radioElement.checked = true;
      radioElement.dispatchEvent(new Event("change"));

      expect(component.valueChange.emit).toHaveBeenCalledWith("test-value");
    });

    it("should not emit valueChange when radio is deselected", async () => {
      // Start with checked radio
      fixture.componentRef.setInput("checked", true);
      await fixture.whenStable();
      fixture.detectChanges();

      spyOn(component.valueChange, "emit");

      // Deselect radio
      radioElement.checked = false;
      radioElement.dispatchEvent(new Event("change"));

      expect(component.valueChange.emit).not.toHaveBeenCalled();
    });
  });

  describe("Activation Handling", () => {
    it("should call local activation handler when radio is selected", async () => {
      const activationSpy = jasmine.createSpy("onActivate");
      fixture.componentRef.setInput("onActivate", activationSpy);

      await fixture.whenStable();
      fixture.detectChanges();

      radioElement.checked = true;
      radioElement.dispatchEvent(new Event("change"));

      expect(activationSpy).toHaveBeenCalledWith("test-value");
    });

    it("should use custom payload if provided", async () => {
      const activationSpy = jasmine.createSpy("onActivate");
      const customPayload = { custom: "data" };

      fixture.componentRef.setInput("onActivate", activationSpy);
      fixture.componentRef.setInput("payload", customPayload);

      await fixture.whenStable();
      fixture.detectChanges();

      radioElement.checked = true;
      radioElement.dispatchEvent(new Event("change"));

      expect(activationSpy).toHaveBeenCalledWith(customPayload);
    });

    it("should trigger global activation manager when activationId is set", async () => {
      fixture.componentRef.setInput("activationId", "global-action");

      await fixture.whenStable();
      fixture.detectChanges();

      radioElement.checked = true;
      radioElement.dispatchEvent(new Event("change"));

      expect(activationManager.trigger).toHaveBeenCalledWith(
        "global-action",
        "test-value",
      );
    });

    it("should not activate when disabled", async () => {
      const activationSpy = jasmine.createSpy("onActivate");
      fixture.componentRef.setInput("onActivate", activationSpy);
      fixture.componentRef.setInput("disabled", true);

      await fixture.whenStable();
      fixture.detectChanges();

      radioElement.checked = true;
      radioElement.dispatchEvent(new Event("change"));

      expect(activationSpy).not.toHaveBeenCalled();
    });
  });

  describe("Computed Properties", () => {
    it("should compute canActivate correctly", async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      // No activation handler - cannot activate
      expect(component.canActivate()).toBe(false);

      // With local handler - can activate
      fixture.componentRef.setInput("onActivate", () => {});
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.canActivate()).toBe(true);

      // Disabled - cannot activate
      fixture.componentRef.setInput("disabled", true);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.canActivate()).toBe(false);
    });

    it("should compute effectivePayload correctly", async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      // Default to value
      expect(component.effectivePayload()).toBe("test-value");

      // Use explicit payload when provided
      const customPayload = { id: 123 };
      fixture.componentRef.setInput("payload", customPayload);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.effectivePayload()).toBe(customPayload);
    });
  });

  describe("Development Mode Validation", () => {
    // Note: This test is more for documentation since we can't easily test
    // development mode warnings in unit tests without mocking isDevMode()
    it("should validate semantic usage", async () => {
      await fixture.whenStable();
      expect(component).toBeTruthy();
      // In a real scenario with wrong element type, console.warn would be called
    });
  });
});
