import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { InteropIcon } from "./interop-icon";
import { PhosphorIconRegistry } from "../../iconsets/phosphor/helpers/phosphor-icon.registry";
import { PhIconDefinition } from "../../iconsets/phosphor/helpers/phosphor-icon.types";

// Mock icon for testing
const mockIcon: PhIconDefinition = {
  name: "test-icon",
  viewBox: "0 0 24 24",
  nodes: [
    [
      "path",
      {
        d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": 2,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
    ],
  ],
};

@Component({
  standalone: true,
  imports: [InteropIcon],
  template: `
    <interop-icon
      [name]="iconName"
      [size]="iconSize"
      [color]="iconColor"
      [strokeWidth]="strokeWidth"
      [decorative]="decorative"
      [ariaLabel]="ariaLabel"
    />
  `,
})
class TestHostComponent {
  iconName = "test-icon";
  iconSize = 24;
  iconColor?: string;
  strokeWidth?: number;
  decorative = true;
  ariaLabel?: string;
}

describe("InteropIcon", () => {
  let component: InteropIcon;
  let fixture: ComponentFixture<InteropIcon>;
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let registry: jasmine.SpyObj<PhosphorIconRegistry>;

  beforeEach(async () => {
    const registrySpy = jasmine.createSpyObj("PhosphorIconRegistry", ["get"]);

    await TestBed.configureTestingModule({
      imports: [InteropIcon, TestHostComponent],
      providers: [{ provide: PhosphorIconRegistry, useValue: registrySpy }],
    }).compileComponents();

    registry = TestBed.inject(
      PhosphorIconRegistry,
    ) as jasmine.SpyObj<PhosphorIconRegistry>;
    registry.get.and.returnValue(mockIcon);

    fixture = TestBed.createComponent(InteropIcon);
    component = fixture.componentInstance;

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Icon Rendering", () => {
    it("should render SVG when icon is found", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector("svg");
      expect(svg).toBeTruthy();
      expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
    });

    it("should render fallback when icon is not found", () => {
      registry.get.and.returnValue(undefined);
      fixture.componentRef.setInput("name", "nonexistent-icon");
      fixture.detectChanges();

      const fallback = fixture.nativeElement.querySelector(
        ".interop-icon-fallback",
      );
      expect(fallback).toBeTruthy();
      expect(fallback.textContent?.trim()).toBe("?");
    });

    it("should render path elements correctly", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.detectChanges();

      const path = fixture.nativeElement.querySelector("path");
      expect(path).toBeTruthy();
      expect(path.getAttribute("d")).toBe(mockIcon.nodes[0][1]["d"]);
      expect(path.getAttribute("stroke")).toBe("currentColor");
    });
  });

  describe("Size Handling", () => {
    it("should apply default size of 24px", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector("svg");
      expect(svg.getAttribute("width")).toBe("24px");
      expect(svg.getAttribute("height")).toBe("24px");
    });

    it("should apply custom size", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.componentRef.setInput("size", 32);
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector("svg");
      expect(svg.getAttribute("width")).toBe("32px");
      expect(svg.getAttribute("height")).toBe("32px");
    });

    it("should apply size to fallback element", () => {
      registry.get.and.returnValue(undefined);
      fixture.componentRef.setInput("name", "nonexistent-icon");
      fixture.componentRef.setInput("size", 16);
      fixture.detectChanges();

      const fallback = fixture.nativeElement.querySelector(
        ".interop-icon-fallback",
      );
      expect(fallback.style.width).toBe("16px");
      expect(fallback.style.height).toBe("16px");
    });
  });

  describe("Color Handling", () => {
    it("should not set color style when color is not provided", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector("svg");
      expect(svg.style.color).toBe("");
    });

    it("should apply custom color", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.componentRef.setInput("color", "red");
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector("svg");
      expect(svg.style.color).toBe("red");
    });
  });

  describe("Stroke Width", () => {
    it("should use icon's default stroke width when not overridden", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.detectChanges();

      const path = fixture.nativeElement.querySelector("path");
      expect(path.getAttribute("stroke-width")).toBe("2");
    });

    it("should override stroke width when provided", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.componentRef.setInput("strokeWidth", 1.5);
      fixture.detectChanges();

      const path = fixture.nativeElement.querySelector("path");
      expect(path.getAttribute("stroke-width")).toBe("1.5");
    });
  });

  describe("Accessibility", () => {
    it("should mark decorative icons as presentation", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.componentRef.setInput("decorative", true);
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector("svg");
      expect(svg.getAttribute("role")).toBe("presentation");
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(svg.getAttribute("aria-label")).toBeNull();
    });

    it("should mark semantic icons properly", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.componentRef.setInput("decorative", false);
      fixture.componentRef.setInput("ariaLabel", "Test icon");
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector("svg");
      expect(svg.getAttribute("role")).toBe("img");
      expect(svg.getAttribute("aria-hidden")).toBeNull();
      expect(svg.getAttribute("aria-label")).toBe("Test icon");
    });

    it("should handle fallback accessibility", () => {
      registry.get.and.returnValue(undefined);
      fixture.componentRef.setInput("name", "nonexistent-icon");
      fixture.componentRef.setInput("decorative", false);
      fixture.componentRef.setInput("ariaLabel", "Missing icon");
      fixture.detectChanges();

      const fallback = fixture.nativeElement.querySelector(
        ".interop-icon-fallback",
      );
      expect(fallback.getAttribute("role")).toBe("img");
      expect(fallback.getAttribute("aria-label")).toBe("Missing icon");
    });
  });

  describe("Host Component Integration", () => {
    it("should work with host component inputs", () => {
      hostComponent.iconName = "test-icon";
      hostComponent.iconSize = 16;
      hostComponent.iconColor = "blue";
      hostFixture.detectChanges();

      const svg = hostFixture.nativeElement.querySelector("svg");
      expect(svg).toBeTruthy();
      expect(svg.getAttribute("width")).toBe("16px");
      expect(svg.style.color).toBe("blue");
    });

    it("should update when host component inputs change", () => {
      hostFixture.detectChanges();

      hostComponent.iconSize = 48;
      hostComponent.iconColor = "green";
      hostFixture.detectChanges();

      const svg = hostFixture.nativeElement.querySelector("svg");
      expect(svg.getAttribute("width")).toBe("48px");
      expect(svg.style.color).toBe("green");
    });
  });

  describe("Registry Integration", () => {
    it("should call registry.get with correct icon name", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.detectChanges();

      expect(registry.get).toHaveBeenCalledWith("test-icon");
    });

    it("should handle registry returning null/undefined", () => {
      registry.get.and.returnValue(undefined);
      fixture.componentRef.setInput("name", "missing-icon");
      fixture.detectChanges();

      const fallback = fixture.nativeElement.querySelector(
        ".interop-icon-fallback",
      );
      expect(fallback).toBeTruthy();
      expect(fixture.nativeElement.querySelector("svg")).toBeFalsy();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty icon name", () => {
      fixture.componentRef.setInput("name", "");
      fixture.detectChanges();

      expect(registry.get).toHaveBeenCalledWith("");
    });

    it("should handle zero size", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.componentRef.setInput("size", 0);
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector("svg");
      expect(svg.getAttribute("width")).toBe("0px");
      expect(svg.getAttribute("height")).toBe("0px");
    });

    it("should handle negative size", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.componentRef.setInput("size", -10);
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector("svg");
      expect(svg.getAttribute("width")).toBe("-10px");
      expect(svg.getAttribute("height")).toBe("-10px");
    });
  });
});
