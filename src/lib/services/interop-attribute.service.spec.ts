import { TestBed } from "@angular/core/testing";
import { Renderer2 } from "@angular/core";
import {
  InteropAttribute,
  SetAttrsConfig,
  PresetKey,
} from "./interop-attribute.service";

describe("InteropAttribute", () => {
  let service: InteropAttribute;
  let renderer: Renderer2;
  let hostElement: HTMLElement;
  let mockRenderer: jasmine.SpyObj<Renderer2>;

  beforeEach(() => {
    const rendererSpy = jasmine.createSpyObj("Renderer2", ["setAttribute"]);

    TestBed.configureTestingModule({
      providers: [{ provide: Renderer2, useValue: rendererSpy }],
    });

    service = TestBed.inject(InteropAttribute);
    renderer = TestBed.inject(Renderer2);
    mockRenderer = renderer as jasmine.SpyObj<Renderer2>;

    // Create a host element for testing
    hostElement = document.createElement("div");
    hostElement.classList.add("test-host");
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("Presets", () => {
    it("should have readonly presets", () => {
      expect(service.Presets).toBeDefined();
      expect(Object.keys(service.Presets).length).toBeGreaterThan(0);
    });

    it("should contain expected preset keys", () => {
      const expectedKeys: PresetKey[] = [
        "ListPassive",
        "ListPassiveWithLabelledBy",
        "ListNestedPassive",
        "MinimalNaming",
      ];

      expectedKeys.forEach((key) => {
        expect(service.Presets[key]).toBeDefined();
      });
    });

    it("should have ListPassive preset with correct structure", () => {
      const preset = service.Presets.ListPassive;
      expect(preset[":host"]).toEqual({ role: "list" });
      expect(preset[':host > :not([data-interop-managed="false"])']).toEqual({
        role: "listitem",
      });
    });

    it("should have ListPassiveWithLabelledBy preset with aria-labelledby", () => {
      const preset = service.Presets.ListPassiveWithLabelledBy;
      expect(preset[":host"]).toEqual({ role: "list", "aria-labelledby": "" });
      expect(preset[':host > :not([data-interop-managed="false"])']).toEqual({
        role: "listitem",
      });
    });

    it("should have ListNestedPassive preset with nested selectors", () => {
      const preset = service.Presets.ListNestedPassive;
      expect(preset[":host"]).toEqual({ role: "list" });
      expect(preset[":host [data-nested-list]"]).toEqual({ role: "list" });
      expect(
        preset[
          ':host [data-nested-list] > :not([data-interop-managed="false"])'
        ],
      ).toEqual({ role: "listitem" });
    });

    it("should have MinimalNaming preset", () => {
      const preset = service.Presets.MinimalNaming;
      expect(preset[":host"]).toEqual({ "aria-label": "" });
    });
  });

  describe("merge", () => {
    it("should merge multiple configs", () => {
      const config1: SetAttrsConfig = {
        ":host": { role: "list" },
      };
      const config2: SetAttrsConfig = {
        ":host > *": { role: "listitem" },
      };

      const result = service.merge(config1, config2);

      expect(result[":host"]).toEqual({ role: "list" });
      expect(result[":host > *"]).toEqual({ role: "listitem" });
    });

    it("should handle null and undefined configs", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
      };

      const result = service.merge(null, config, undefined);

      expect(result[":host"]).toEqual({ role: "list" });
    });

    it("should let later configs win on collisions", () => {
      const config1: SetAttrsConfig = {
        ":host": { role: "list", "aria-label": "first" },
      };
      const config2: SetAttrsConfig = {
        ":host": { "aria-label": "second" },
      };

      const result = service.merge(config1, config2);

      expect(result[":host"]).toEqual({ role: "list", "aria-label": "second" });
    });

    it("should skip configs with null attributes", () => {
      const config1: SetAttrsConfig = {
        ":host": { role: "list" },
      };
      const config2: SetAttrsConfig = {
        ":host > *": null,
      };

      const result = service.merge(config1, config2);

      expect(result[":host"]).toEqual({ role: "list" });
      expect(result[":host > *"]).toBeUndefined();
    });
  });

  describe("withOptOut", () => {
    it("should constrain default item selectors", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
        ":host > *": { role: "listitem" },
      };

      const result = service.withOptOut(config);

      expect(result[":host"]).toEqual({ role: "list" });
      expect(result[':host > :not([data-interop-managed="false"])']).toEqual({
        role: "listitem",
      });
      expect(result[":host > *"]).toBeUndefined();
    });

    it("should handle custom item selectors", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
        ":host > .item": { role: "listitem" },
      };

      const result = service.withOptOut(config, [":host > .item"]);

      expect(result[":host"]).toEqual({ role: "list" });
      expect(result[':host > :not([data-interop-managed="false"])']).toEqual({
        role: "listitem",
      });
      expect(result[":host > .item"]).toBeUndefined();
    });

    it("should normalize whitespace in selectors", () => {
      const config: SetAttrsConfig = {
        ":host  >  *": { role: "listitem" },
      };

      const result = service.withOptOut(config);

      expect(result[':host > :not([data-interop-managed="false"])']).toEqual({
        role: "listitem",
      });
      expect(result[":host  >  *"]).toBeUndefined();
    });

    it("should not modify non-matching selectors", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
        ":host .nested": { role: "group" },
      };

      const result = service.withOptOut(config);

      expect(result[":host"]).toEqual({ role: "list" });
      expect(result[":host .nested"]).toEqual({ role: "group" });
    });

    it("should skip configs with null attributes", () => {
      const config: SetAttrsConfig = {
        ":host > *": null,
      };

      const result = service.withOptOut(config);

      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe("noOverride", () => {
    beforeEach(() => {
      // Set up DOM with some existing attributes
      hostElement.setAttribute("role", "existing-role");
      hostElement.innerHTML =
        '<div class="child" aria-label="existing">Child</div>';
    });

    it("should prune attributes that exist on host", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list", "aria-label": "new-label" },
      };

      const result = service.noOverride(hostElement, config);

      expect(result[":host"]).toEqual({ "aria-label": "new-label" });
    });

    it("should prune attributes that exist on children", () => {
      const config: SetAttrsConfig = {
        ":host .child": { "aria-label": "new-label", role: "listitem" },
      };

      const result = service.noOverride(hostElement, config);

      expect(result[":host .child"]).toEqual({ role: "listitem" });
    });

    it("should remove selectors with no remaining attributes", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
      };

      const result = service.noOverride(hostElement, config);

      expect(result[":host"]).toBeUndefined();
    });

    it("should handle invalid selectors gracefully", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
        "invalid[[[selector": { role: "group" },
      };

      const result = service.noOverride(hostElement, config);

      expect(result[":host"]).toBeUndefined();
      expect(result["invalid[[[selector"]).toBeUndefined();
    });

    it("should skip configs with null attributes", () => {
      const config: SetAttrsConfig = {
        ":host": null,
      };

      const result = service.noOverride(hostElement, config);

      expect(result[":host"]).toBeUndefined();
    });
  });

  describe("deriveObserverOptions", () => {
    it("should return shallow observation for host-only selectors", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
      };

      const result = service.deriveObserverOptions(config);

      expect(result.childList).toBe(true);
      expect(result.subtree).toBe(false); // Host-only selectors are shallow
    });

    it("should return shallow observation for direct children only", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
        ":host > *": { role: "listitem" },
      };

      const result = service.deriveObserverOptions(config);

      expect(result.childList).toBe(true);
      expect(result.subtree).toBe(false);
    });

    it("should return subtree observation for deep selectors", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
        ":host .nested": { role: "group" },
      };

      const result = service.deriveObserverOptions(config);

      expect(result.childList).toBe(true);
      expect(result.subtree).toBe(true);
    });

    it("should handle empty config", () => {
      const config: SetAttrsConfig = {};

      const result = service.deriveObserverOptions(config);

      expect(result.childList).toBe(true);
      expect(result.subtree).toBe(true); // Default to subtree when empty config
    });
  });

  describe("hasDeepSelectors", () => {
    it("should return false for host-only selectors", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
      };

      const result = service.hasDeepSelectors(config);

      expect(result).toBe(false);
    });

    it("should return false for direct children only", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
        ":host > *": { role: "listitem" },
        ":host > .item": { role: "option" },
      };

      const result = service.hasDeepSelectors(config);

      expect(result).toBe(false);
    });

    it("should return true for deep selectors", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
        ":host .nested": { role: "group" },
      };

      const result = service.hasDeepSelectors(config);

      expect(result).toBe(true);
    });

    it("should return true for descendant selectors", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
        ":host [data-nested-list]": { role: "list" },
      };

      const result = service.hasDeepSelectors(config);

      expect(result).toBe(true);
    });

    it("should return false for empty config", () => {
      const config: SetAttrsConfig = {};

      const result = service.hasDeepSelectors(config);

      expect(result).toBe(false);
    });
  });

  describe("applyConfig", () => {
    beforeEach(() => {
      hostElement.innerHTML =
        '<div class="child">Child</div><div class="other">Other</div>';
    });

    it("should apply attributes to host element", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list", "aria-label": "test-list" },
      };

      service.applyConfig(mockRenderer, hostElement, config);

      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "role",
        "list",
      );
      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "aria-label",
        "test-list",
      );
    });

    it("should apply attributes to child elements", () => {
      const config: SetAttrsConfig = {
        ":host .child": { role: "listitem", tabindex: "0" },
      };

      const childNodes = Array.from(hostElement.querySelectorAll(".child"));
      spyOn(hostElement, "querySelectorAll").and.returnValue(childNodes as any);

      service.applyConfig(mockRenderer, hostElement, config);

      const childElement = hostElement.querySelector(".child") as HTMLElement;
      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        childElement,
        "role",
        "listitem",
      );
      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        childElement,
        "tabindex",
        "0",
      );
    });

    it("should normalize boolean values to strings", () => {
      const config: SetAttrsConfig = {
        ":host": { "aria-expanded": true, "aria-hidden": false },
      };

      service.applyConfig(mockRenderer, hostElement, config);

      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "aria-expanded",
        "true",
      );
      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "aria-hidden",
        "false",
      );
    });

    it("should normalize number values to strings", () => {
      const config: SetAttrsConfig = {
        ":host": { tabindex: -1, "aria-level": 2 },
      };

      service.applyConfig(mockRenderer, hostElement, config);

      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "tabindex",
        "-1",
      );
      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "aria-level",
        "2",
      );
    });

    it("should respect existing attributes when override is false", () => {
      hostElement.setAttribute("role", "existing-role");
      const config: SetAttrsConfig = {
        ":host": { role: "list", "aria-label": "new-label" },
      };

      service.applyConfig(mockRenderer, hostElement, config, {
        override: false,
      });

      expect(mockRenderer.setAttribute).not.toHaveBeenCalledWith(
        hostElement,
        "role",
        "list",
      );
      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "aria-label",
        "new-label",
      );
    });

    it("should override existing attributes when override is true", () => {
      hostElement.setAttribute("role", "existing-role");
      const config: SetAttrsConfig = {
        ":host": { role: "list", "aria-label": "new-label" },
      };

      service.applyConfig(mockRenderer, hostElement, config, {
        override: true,
      });

      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "role",
        "list",
      );
      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "aria-label",
        "new-label",
      );
    });

    it("should handle null config gracefully", () => {
      service.applyConfig(mockRenderer, hostElement, null);

      expect(mockRenderer.setAttribute).not.toHaveBeenCalled();
    });

    it("should handle undefined config gracefully", () => {
      service.applyConfig(mockRenderer, hostElement, undefined);

      expect(mockRenderer.setAttribute).not.toHaveBeenCalled();
    });

    it("should skip selectors with null attributes", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
        ":host > *": null,
      };

      service.applyConfig(mockRenderer, hostElement, config);

      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "role",
        "list",
      );
      expect(mockRenderer.setAttribute).toHaveBeenCalledTimes(1);
    });

    it("should handle invalid selectors gracefully", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
        "invalid[[[selector": { role: "group" },
      };

      spyOn(console, "warn");

      service.applyConfig(mockRenderer, hostElement, config);

      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "role",
        "list",
      );
      expect(console.warn).toHaveBeenCalled();
    });

    it("should default to no override behavior", () => {
      hostElement.setAttribute("role", "existing-role");
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
      };

      service.applyConfig(mockRenderer, hostElement, config);

      expect(mockRenderer.setAttribute).not.toHaveBeenCalledWith(
        hostElement,
        "role",
        "list",
      );
    });
  });

  describe("integration tests", () => {
    it("should work with merged presets", () => {
      const customConfig: SetAttrsConfig = {
        ":host": { "aria-label": "Custom List" },
      };

      const merged = service.merge(service.Presets.ListPassive, customConfig);

      expect(merged[":host"]).toEqual({
        role: "list",
        "aria-label": "Custom List",
      });
      expect(merged[':host > :not([data-interop-managed="false"])']).toEqual({
        role: "listitem",
      });
    });

    it("should apply opt-out constraints to presets", () => {
      const withOptOut = service.withOptOut(service.Presets.ListPassive);

      expect(withOptOut[":host"]).toEqual({ role: "list" });
      expect(
        withOptOut[':host > :not([data-interop-managed="false"])'],
      ).toEqual({ role: "listitem" });
    });

    it("should compose helper methods effectively", () => {
      const baseConfig = service.Presets.ListPassive;
      const customConfig: SetAttrsConfig = {
        ":host": { "aria-label": "Items" },
      };

      // Merge, then apply opt-out, then check for overrides
      const merged = service.merge(baseConfig, customConfig);
      const withOptOut = service.withOptOut(merged);
      const filtered = service.noOverride(hostElement, withOptOut);

      // Should have combined attributes and opt-out behavior
      expect(Object.keys(filtered).length).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("should handle malformed CSS selectors in configs", () => {
      const config: SetAttrsConfig = {
        ":host": { role: "list" },
        "[[[malformed": { role: "group" },
        "::invalid::pseudo": { role: "button" },
      };

      expect(() => {
        service.applyConfig(mockRenderer, hostElement, config);
      }).not.toThrow();
    });

    it("should handle empty attribute objects", () => {
      const config: SetAttrsConfig = {
        ":host": {},
      };

      service.applyConfig(mockRenderer, hostElement, config);

      expect(mockRenderer.setAttribute).not.toHaveBeenCalled();
    });

    it("should handle whitespace-only selectors", () => {
      const config: SetAttrsConfig = {
        "   ": { role: "group" },
      };

      expect(() => {
        service.applyConfig(mockRenderer, hostElement, config);
      }).not.toThrow();
    });

    it("should handle attributes with special characters", () => {
      const config: SetAttrsConfig = {
        ":host": {
          "data-test": "value with spaces",
          "aria-label": "Value with \"quotes\" and 'apostrophes'",
          "custom-attr": "special!@#$%^&*()chars",
        },
      };

      service.applyConfig(mockRenderer, hostElement, config);

      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "data-test",
        "value with spaces",
      );
      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "aria-label",
        "Value with \"quotes\" and 'apostrophes'",
      );
      expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
        hostElement,
        "custom-attr",
        "special!@#$%^&*()chars",
      );
    });
  });
});
