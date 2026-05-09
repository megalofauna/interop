import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { InteropTabLabel } from "./interop-tab-label.directive";
import { InteropTabPanel } from "./interop-tab-panel";
import { InteropTabs } from "./interop-tabs";

// ─── Minimal host with a real InteropTabs parent ─────────────────────────────

@Component({
  standalone: true,
  imports: [InteropTabs, InteropTabPanel, InteropTabLabel],
  template: `
    <section interop-tabs [active]="active()">
      <section interop-tab-panel key="a" label="Panel A">
        <input class="input-a" type="text" />
      </section>
      <section interop-tab-panel key="b" [label]="labelB">
        <span class="content-b">Content B</span>
      </section>
    </section>
  `,
})
class TestHostComponent {
  active = signal<string | null>(null);
  labelB = "Panel B";
}

// ─── Host for destroyOnHide / preRender inputs ────────────────────────────────

@Component({
  standalone: true,
  imports: [InteropTabs, InteropTabPanel],
  template: `
    <section interop-tabs [active]="active()">
      <section interop-tab-panel key="x" label="X" [destroyOnHide]="destroyOnHide">
        <span class="content-x">X</span>
      </section>
      <section interop-tab-panel key="y" label="Y" [preRender]="preRender">
        <span class="content-y">Y</span>
      </section>
    </section>
  `,
})
class TestEscapeHatchHost {
  active = signal<string | null>("x");
  destroyOnHide = false;
  preRender = false;
}

// ─── Host for rich label (ng-template + interop-tab-label) ───────────────────

@Component({
  standalone: true,
  imports: [InteropTabs, InteropTabPanel, InteropTabLabel],
  template: `
    <section interop-tabs>
      <section interop-tab-panel key="rich">
        <ng-template interop-tab-label>
          <span class="rich-label">Rich Label</span>
        </ng-template>
        <p>Rich panel content</p>
      </section>
    </section>
  `,
})
class TestRichLabelHost {}

// ─────────────────────────────────────────────────────────────────────────────

describe("InteropTabPanel", () => {
  describe("inside InteropTabs", () => {
    let hostComponent: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      hostComponent = fixture.componentInstance;
      fixture.detectChanges();
    });

    it("should create", () => {
      const panels = fixture.debugElement.queryAll(By.directive(InteropTabPanel));
      expect(panels.length).toBe(2);
    });

    it("first panel is active by default", () => {
      const panelA = fixture.nativeElement.querySelector(
        "section[interop-tab-panel][id*='-panel-a']",
      ) as HTMLElement;
      expect(panelA.hasAttribute("hidden")).toBeFalse();
    });

    it("inactive panel has hidden attribute", () => {
      const panelB = fixture.nativeElement.querySelector(
        "section[interop-tab-panel][id*='-panel-b']",
      ) as HTMLElement;
      expect(panelB.hasAttribute("hidden")).toBeTrue();
    });

    it("inactive panel content is not rendered before first visit", () => {
      const contentB = fixture.nativeElement.querySelector(".content-b");
      expect(contentB).toBeNull();
    });

    it("active panel content IS rendered", () => {
      const inputA = fixture.nativeElement.querySelector(".input-a");
      expect(inputA).not.toBeNull();
    });

    it("switching to panel renders its content", () => {
      hostComponent.active.set("b");
      fixture.detectChanges();

      const contentB = fixture.nativeElement.querySelector(".content-b");
      expect(contentB).not.toBeNull();
    });

    it("previously active panel stays in DOM with hidden after switch", () => {
      // Switch to b — renders b
      hostComponent.active.set("b");
      fixture.detectChanges();

      // Switch back to a
      hostComponent.active.set("a");
      fixture.detectChanges();

      // Panel b is now hidden but still in DOM
      const panelB = fixture.nativeElement.querySelector(
        "section[interop-tab-panel][id*='-panel-b']",
      ) as HTMLElement;
      expect(panelB.hasAttribute("hidden")).toBeTrue();
      expect(fixture.nativeElement.querySelector(".content-b")).not.toBeNull();
    });

    it("host element has role=tabpanel", () => {
      const panelA = fixture.nativeElement.querySelector(
        "section[interop-tab-panel]",
      ) as HTMLElement;
      expect(panelA.getAttribute("role")).toBe("tabpanel");
    });

    it("panel id and aria-labelledby are set", () => {
      const panels = fixture.nativeElement.querySelectorAll(
        "section[interop-tab-panel]",
      ) as NodeListOf<HTMLElement>;
      panels.forEach((panel) => {
        expect(panel.id).toBeTruthy();
        expect(panel.getAttribute("aria-labelledby")).toBeTruthy();
      });
    });

    it("ARIA: panel aria-labelledby matches the tab button id", () => {
      const panelA = fixture.nativeElement.querySelector(
        "section[interop-tab-panel][id*='-panel-a']",
      ) as HTMLElement;
      const tabA = fixture.nativeElement.querySelector(
        `[id="${panelA.getAttribute("aria-labelledby")}"]`,
      ) as HTMLElement;
      expect(tabA).not.toBeNull();
      expect(tabA.getAttribute("role")).toBe("tab");
    });
  });

  describe("destroyOnHide escape hatch", () => {
    let hostComponent: TestEscapeHatchHost;
    let fixture: ComponentFixture<TestEscapeHatchHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestEscapeHatchHost],
      }).compileComponents();

      fixture = TestBed.createComponent(TestEscapeHatchHost);
      hostComponent = fixture.componentInstance;
      hostComponent.destroyOnHide = true;
      fixture.detectChanges();
    });

    it("destroys content when switching away", () => {
      // x is active and rendered
      expect(fixture.nativeElement.querySelector(".content-x")).not.toBeNull();

      // switch to y — x should be destroyed
      hostComponent.active.set("y");
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector(".content-x")).toBeNull();
    });
  });

  describe("preRender escape hatch", () => {
    let fixture: ComponentFixture<TestEscapeHatchHost>;
    let hostComponent: TestEscapeHatchHost;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestEscapeHatchHost],
      }).compileComponents();

      fixture = TestBed.createComponent(TestEscapeHatchHost);
      hostComponent = fixture.componentInstance;
      hostComponent.preRender = true;
      // x is active, y has preRender
      fixture.detectChanges();
    });

    it("renders content before first visit when preRender is true", () => {
      // y is NOT active but has preRender — content should still be rendered
      expect(fixture.nativeElement.querySelector(".content-y")).not.toBeNull();
    });
  });

  describe("rich label via interop-tab-label", () => {
    let fixture: ComponentFixture<TestRichLabelHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestRichLabelHost],
      }).compileComponents();

      fixture = TestBed.createComponent(TestRichLabelHost);
      fixture.detectChanges();
    });

    it("renders rich label content in the tab button", () => {
      const richLabel = fixture.nativeElement.querySelector(".rich-label");
      expect(richLabel).not.toBeNull();
      expect(richLabel.textContent.trim()).toBe("Rich Label");
    });

    it("rich label appears inside a role=tab button", () => {
      const richLabel = fixture.nativeElement.querySelector(".rich-label");
      const tabButton = richLabel?.closest('[role="tab"]');
      expect(tabButton).not.toBeNull();
    });
  });
});
