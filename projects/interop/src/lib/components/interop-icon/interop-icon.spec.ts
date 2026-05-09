import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { InteropIcon } from "./interop-icon";
import { InteropIconRegistry, InteropIconDefinition, provideInteropIcons } from "../../iconsets/core";

const mockIcon: InteropIconDefinition = {
  name: "test-icon",
  viewBox: "0 0 24 24",
  svgContent: '<path d="M12 2L2 22h20z" fill="none" stroke="currentColor"/>',
  defaultStrokeWidth: 2,
};

@Component({
  standalone: true,
  imports: [InteropIcon],
  template: `<interop-icon
    [name]="iconName"
    [size]="iconSize"
    [color]="iconColor"
    [strokeWidth]="strokeWidth"
    [decorative]="decorative"
    [ariaLabel]="ariaLabel"
  />`,
})
class TestHostComponent {
  iconName: string | undefined = "test-icon";
  iconSize = 24;
  iconColor?: string;
  strokeWidth?: number;
  decorative = true;
  ariaLabel?: string;
}

describe("InteropIcon", () => {
  let fixture: ComponentFixture<InteropIcon>;
  let component: InteropIcon;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteropIcon, TestHostComponent],
      providers: [provideInteropIcons(mockIcon)],
    }).compileComponents();

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

    it("should render missing-icon placeholder when icon is not found", () => {
      fixture.componentRef.setInput("name", "nonexistent-icon");
      fixture.detectChanges();

      const missing = fixture.nativeElement.querySelector(".itx-icon--missing");
      expect(missing).toBeTruthy();
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
    it("should apply icon default stroke width when not overridden", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector("svg");
      expect(svg.getAttribute("stroke-width")).toBe("2");
    });

    it("should override stroke width when provided", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.componentRef.setInput("strokeWidth", 1.5);
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector("svg");
      expect(svg.getAttribute("stroke-width")).toBe("1.5");
    });
  });

  describe("Accessibility", () => {
    it("should mark decorative icons with aria-hidden", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.componentRef.setInput("decorative", true);
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector("svg");
      expect(svg.getAttribute("role")).toBe("presentation");
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(svg.getAttribute("aria-label")).toBeNull();
    });

    it("should mark semantic icons with role=img and aria-label", () => {
      fixture.componentRef.setInput("name", "test-icon");
      fixture.componentRef.setInput("decorative", false);
      fixture.componentRef.setInput("ariaLabel", "Test icon");
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector("svg");
      expect(svg.getAttribute("role")).toBe("img");
      expect(svg.getAttribute("aria-hidden")).toBeNull();
      expect(svg.getAttribute("aria-label")).toBe("Test icon");
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
  });

  describe("Projection path", () => {
    it("should render projected content when no name is provided", () => {
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector("span");
      expect(span).toBeTruthy();
    });
  });
});
