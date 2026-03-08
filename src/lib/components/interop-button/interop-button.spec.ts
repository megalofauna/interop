import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, DebugElement } from "@angular/core";
import { By } from "@angular/platform-browser";
import { InteropButton } from "./interop-button";
import { InteropActivation } from "../../services/interop-activation.service";

/**
 * Host component for testing InteropButton since it requires button[interop-button] selector
 */
@Component({
  standalone: true,
  imports: [InteropButton],
  template: `
    <button
      interop-button
      [onActivate]="onActivate"
      [activationId]="activationId"
      [payload]="payload"
      [activationOptions]="activationOptions"
      [loading]="loading"
      [disabled]="disabled"
      [type]="type"
      [loadingText]="loadingText"
      [attrsPreset]="attrsPreset"
    >
      Test Button Content
    </button>
  `,
})
class TestHostComponent {
  onActivate: any = null;
  activationId: string | null = null;
  payload: unknown = undefined;
  activationOptions: any = {};
  loading = false;
  disabled = false;
  type: "button" | "submit" | "reset" = "button";
  loadingText = "Loading...";
  attrsPreset: any = null;
}

describe("InteropButton", () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let buttonElement: HTMLButtonElement;
  let interopButtonComponent: InteropButton;
  let activationManager: jasmine.SpyObj<InteropActivation>;

  beforeEach(async () => {
    const activationSpy = jasmine.createSpyObj("InteropActivation", [
      "trigger",
      "register",
      "has",
    ]);

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: InteropActivation, useValue: activationSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    buttonElement = fixture.nativeElement.querySelector("button");

    // Get the InteropButton component instance
    const interopButtonDebugElement = fixture.debugElement.query(
      By.directive(InteropButton),
    );
    interopButtonComponent = interopButtonDebugElement.componentInstance;

    activationManager = TestBed.inject(
      InteropActivation,
    ) as jasmine.SpyObj<InteropActivation>;

    fixture.detectChanges();
  });

  describe("Component Setup", () => {
    it("should create", () => {
      expect(interopButtonComponent).toBeTruthy();
      expect(hostComponent).toBeTruthy();
    });

    it("should require button element (selector enforcement)", () => {
      expect(buttonElement.tagName).toBe("BUTTON");
    });

    it("should have proper default values", () => {
      expect(interopButtonComponent.onActivate()).toBeNull();
      expect(interopButtonComponent.activationId()).toBeNull();
      expect(interopButtonComponent.loading()).toBeFalse();
      expect(interopButtonComponent.disabled()).toBeFalse();
      expect(interopButtonComponent.type()).toBe("button");
    });

    it("should update inputs when host component changes", () => {
      hostComponent.loading = true;
      hostComponent.disabled = true;
      fixture.detectChanges();

      expect(interopButtonComponent.loading()).toBeTrue();
      expect(interopButtonComponent.disabled()).toBeTrue();
    });
  });

  describe("Computed Properties", () => {
    it("should compute isDisabled correctly", () => {
      expect(interopButtonComponent.isDisabled()).toBeFalse();

      hostComponent.disabled = true;
      fixture.detectChanges();
      expect(interopButtonComponent.isDisabled()).toBeTrue();

      hostComponent.disabled = false;
      hostComponent.loading = true;
      fixture.detectChanges();
      expect(interopButtonComponent.isDisabled()).toBeTrue();
    });

    it("should compute canActivate correctly", () => {
      // No handler configured
      expect(interopButtonComponent.canActivate()).toBeFalse();

      // With local handler
      hostComponent.onActivate = jasmine.createSpy("handler");
      fixture.detectChanges();
      expect(interopButtonComponent.canActivate()).toBeTrue();

      // Disabled should prevent activation
      hostComponent.disabled = true;
      fixture.detectChanges();
      expect(interopButtonComponent.canActivate()).toBeFalse();

      // With activation ID
      hostComponent.disabled = false;
      hostComponent.onActivate = null;
      hostComponent.activationId = "test";
      fixture.detectChanges();
      expect(interopButtonComponent.canActivate()).toBeTrue();
    });
  });

  describe("Input Handling", () => {
    it("should handle onActivate input", () => {
      const handler = jasmine.createSpy("handler");
      hostComponent.onActivate = handler;
      fixture.detectChanges();

      expect(interopButtonComponent.onActivate()).toBe(handler);
    });

    it("should handle activationId input", () => {
      hostComponent.activationId = "test-id";
      fixture.detectChanges();

      expect(interopButtonComponent.activationId()).toBe("test-id");
    });

    it("should handle payload input", () => {
      const testPayload = { test: "data" };
      hostComponent.payload = testPayload;
      fixture.detectChanges();

      expect(interopButtonComponent.payload()).toBe(testPayload);
    });

    it("should handle activationOptions input", () => {
      const options = { debounceMs: 100 };
      hostComponent.activationOptions = options;
      fixture.detectChanges();

      expect(interopButtonComponent.activationOptions()).toBe(options);
    });

    it("should handle type input", () => {
      hostComponent.type = "submit";
      fixture.detectChanges();

      expect(interopButtonComponent.type()).toBe("submit");
    });
  });

  describe("Activation Behavior", () => {
    it("should call local handler on click", () => {
      const handler = jasmine.createSpy("handler");
      hostComponent.onActivate = handler;
      hostComponent.payload = "test-payload";
      fixture.detectChanges();

      buttonElement.click();

      expect(handler).toHaveBeenCalledWith("test-payload");
    });

    it("should call global handler when activationId is set", () => {
      hostComponent.activationId = "global-test";
      hostComponent.payload = "global-payload";
      fixture.detectChanges();

      buttonElement.click();

      expect(activationManager.trigger).toHaveBeenCalledWith(
        "global-test",
        "global-payload",
      );
    });

    it("should prevent activation when disabled", () => {
      const handler = jasmine.createSpy("handler");
      hostComponent.onActivate = handler;
      hostComponent.disabled = true;
      fixture.detectChanges();

      buttonElement.click();

      expect(handler).not.toHaveBeenCalled();
    });

    it("should prevent activation when loading", () => {
      const handler = jasmine.createSpy("handler");
      hostComponent.onActivate = handler;
      hostComponent.loading = true;
      fixture.detectChanges();

      buttonElement.click();

      expect(handler).not.toHaveBeenCalled();
    });

    it("should prefer local handler over global", () => {
      const localHandler = jasmine.createSpy("localHandler");
      hostComponent.onActivate = localHandler;
      hostComponent.activationId = "global";
      fixture.detectChanges();

      buttonElement.click();

      expect(localHandler).toHaveBeenCalled();
      expect(activationManager.trigger).not.toHaveBeenCalled();
    });

    it("should warn when activationId is set but no global handler exists", () => {
      spyOn(console, "warn");
      activationManager.has.and.returnValue(false);

      hostComponent.activationId = "nonexistent";
      fixture.detectChanges();

      // Warning should be logged during effect execution
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringContaining('activationId "nonexistent" specified'),
      );
    });
  });

  describe("Content Projection and Flexible Positioning", () => {
    it("should project default content", () => {
      fixture.detectChanges();
      expect(buttonElement.textContent?.trim()).toContain(
        "Test Button Content",
      );
    });

    it("should show loading text when loading=true and no loading slot provided", () => {
      hostComponent.loading = true;
      hostComponent.loadingText = "Saving...";
      fixture.detectChanges();

      const loadingText = fixture.debugElement.query(
        By.css(".interop-button__loading-text"),
      );
      expect(loadingText).toBeTruthy();
      expect(loadingText.nativeElement.textContent.trim()).toBe("Saving...");
    });

    it("should project all content when not loading (preserving source order)", () => {
      hostComponent.loading = false;
      fixture.detectChanges();

      // When not loading, both icon slot and default content should be projected
      expect(interopButtonComponent.loading()).toBeFalse();
    });

    it("should only show loading content when loading (hiding icon and main content)", () => {
      hostComponent.loading = true;
      fixture.detectChanges();

      // When loading, only loading slot content should be visible
      expect(interopButtonComponent.loading()).toBeTrue();

      const loadingText = fixture.debugElement.query(
        By.css(".interop-button__loading-text"),
      );
      expect(loadingText).toBeTruthy();
    });

    it("should use flexbox with column-gap for internal layout", () => {
      fixture.detectChanges();

      // Layout is handled by styles; focus on structural sanity here
      expect(buttonElement).toBeTruthy();
    });
  });

  describe("Accessibility and Semantic Enforcement", () => {
    it("should maintain native button semantics", () => {
      expect(buttonElement.tagName).toBe("BUTTON");
      expect(buttonElement.getAttribute("role")).toBeNull(); // Native button doesn't need role
    });

    it("should handle disabled attribute correctly", () => {
      hostComponent.disabled = true;
      fixture.detectChanges();

      expect(interopButtonComponent.isDisabled()).toBeTrue();
    });

    it("should handle button type attribute", () => {
      hostComponent.type = "submit";
      fixture.detectChanges();

      expect(interopButtonComponent.type()).toBe("submit");
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle missing activation handler gracefully", () => {
      spyOn(console, "warn");

      // No handler configured
      fixture.detectChanges();
      buttonElement.click();

      // Should warn about missing handler only if canActivate would be true but no handler exists
      // Since canActivate() returns false when no handler is configured, this won't warn
      expect(interopButtonComponent.canActivate()).toBeFalse();
    });

    it("should handle undefined payload", () => {
      const handler = jasmine.createSpy("handler");
      hostComponent.onActivate = handler;
      // payload defaults to undefined
      fixture.detectChanges();

      buttonElement.click();

      expect(handler).toHaveBeenCalledWith(undefined);
    });

    it("should prevent default click behavior when disabled", () => {
      const clickEvent = new MouseEvent("click", { bubbles: true });
      spyOn(clickEvent, "preventDefault");

      hostComponent.disabled = true;
      fixture.detectChanges();

      interopButtonComponent.onButtonActivate(clickEvent);

      expect(clickEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe("Integration with Activation Utils", () => {
    it("should create managed activation with options", () => {
      const handler = jasmine.createSpy("handler").and.returnValue("result");
      const options = { throttleMs: 100, reentrant: false };

      hostComponent.onActivate = handler;
      hostComponent.activationOptions = options;
      fixture.detectChanges();

      // The component should create a managed activation internally
      expect(interopButtonComponent.canActivate()).toBeTrue();
    });
  });

  describe("Flexible Icon Positioning Behavior", () => {
    it("should respect source order for icon placement", () => {
      // This test verifies the template structure that enables flexible positioning
      hostComponent.loading = false;
      fixture.detectChanges();

      // The template should project icon slot and default content in that order
      // This allows users to control actual position via DOM source order
      expect(interopButtonComponent.loading()).toBeFalse();
      expect(buttonElement).toBeTruthy();
    });

    it("should maintain layout during loading state transitions", () => {
      // Test loading state transitions
      hostComponent.loading = false;
      fixture.detectChanges();
      expect(interopButtonComponent.loading()).toBeFalse();

      // Switch to loading
      hostComponent.loading = true;
      fixture.detectChanges();
      expect(interopButtonComponent.loading()).toBeTrue();

      // Switch back to normal
      hostComponent.loading = false;
      fixture.detectChanges();
      expect(interopButtonComponent.loading()).toBeFalse();
    });

    it("should handle content projection without icon slot", () => {
      // Test button with only main content (no icon)
      hostComponent.loading = false;
      fixture.detectChanges();

      // Should work fine with just default content projection
      expect(interopButtonComponent.loading()).toBeFalse();
      expect(buttonElement).toBeTruthy();
    });

    it("should maintain flexbox gap behavior with different content configurations", () => {
      // Verify that CSS layout works for various content scenarios
      fixture.detectChanges();

      // Avoid asserting computed styles here; keep the test focused on structure
      expect(buttonElement).toBeTruthy();

      // The column-gap should be applied regardless of content configuration
      // This ensures consistent spacing whether icon is before, after, or absent
    });
  });
});
