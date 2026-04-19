import { Component, signal } from "@angular/core";
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { InteropListbox, type SelectControl } from "./interop-listbox";
import { InteropOption } from "./interop-option.directive";

const OPTIONS: SelectControl[] = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma", disabled: true },
  { value: "d", label: "Delta" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function dispatchKey(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

// ── Test hosts ─────────────────────────────────────────────────────────────

@Component({
  standalone: true,
  imports: [InteropListbox],
  template: `
    <ul interop-listbox [controls]="controls" [(value)]="selected"></ul>
  `,
})
class DeclarativeHost {
  controls = OPTIONS;
  selected = signal<string | null>(null);
}

@Component({
  standalone: true,
  imports: [InteropListbox],
  template: `
    <ul interop-listbox [controls]="controls" [multiselectable]="true" [(value)]="selected"></ul>
  `,
})
class MultiSelectHost {
  controls = OPTIONS;
  selected = signal<string[]>([]);
}

@Component({
  standalone: true,
  imports: [InteropListbox, InteropOption],
  template: `
    <ul interop-listbox [(value)]="selected">
      <li interop-option value="x" label="Xray">X-Ray</li>
      <li interop-option value="y" label="Yankee">Yankee</li>
      <li interop-option value="z" label="Zulu" [disabled]="true">Zulu</li>
    </ul>
  `,
})
class ProjectionHost {
  selected = signal<string | null>(null);
}

@Component({
  standalone: true,
  imports: [InteropListbox, ReactiveFormsModule],
  template: `
    <ul interop-listbox [controls]="controls" [formControl]="control"></ul>
  `,
})
class CVAHost {
  controls = OPTIONS;
  control = new FormControl("b");
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("InteropListbox", () => {
  describe("declarative mode", () => {
    let fixture: ComponentFixture<DeclarativeHost>;
    let host: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DeclarativeHost],
      }).compileComponents();
      fixture = TestBed.createComponent(DeclarativeHost);
      fixture.detectChanges();
      host = fixture.nativeElement.querySelector("[interop-listbox]");
    });

    it("renders an option per control", () => {
      const options = host.querySelectorAll("[role=option]");
      expect(options.length).toBe(OPTIONS.length);
    });

    it("sets aria-disabled on disabled options", () => {
      const options = host.querySelectorAll("[role=option]");
      expect(options[2].getAttribute("aria-disabled")).toBe("true");
    });

    it("selects an option on click", () => {
      const options = host.querySelectorAll<HTMLElement>("[role=option]");
      options[0].click();
      fixture.detectChanges();
      expect(options[0].getAttribute("aria-selected")).toBe("true");
      expect(fixture.componentInstance.selected()).toBe("a");
    });

    it("does not select a disabled option on click", () => {
      const options = host.querySelectorAll<HTMLElement>("[role=option]");
      options[2].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBeNull();
    });
  });

  describe("keyboard navigation", () => {
    let fixture: ComponentFixture<DeclarativeHost>;
    let host: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DeclarativeHost],
      }).compileComponents();
      fixture = TestBed.createComponent(DeclarativeHost);
      fixture.detectChanges();
      host = fixture.nativeElement.querySelector("[interop-listbox]");
      host.dispatchEvent(new FocusEvent("focus"));
      fixture.detectChanges();
    });

    it("activates first enabled option on focus", () => {
      const active = host.querySelector(".interop-option--active");
      expect(active).toBeTruthy();
      expect(active?.textContent?.trim()).toContain("Alpha");
    });

    it("moves active option with ArrowDown", () => {
      dispatchKey(host, "ArrowDown");
      fixture.detectChanges();
      const active = host.querySelector(".interop-option--active");
      expect(active?.textContent?.trim()).toContain("Beta");
    });

    it("skips disabled options with ArrowDown", () => {
      // Start at Beta (index 1), arrow down should skip Gamma (disabled) → Delta
      dispatchKey(host, "ArrowDown");
      dispatchKey(host, "ArrowDown");
      fixture.detectChanges();
      const active = host.querySelector(".interop-option--active");
      expect(active?.textContent?.trim()).toContain("Delta");
    });

    it("jumps to last option with End", () => {
      dispatchKey(host, "End");
      fixture.detectChanges();
      const active = host.querySelector(".interop-option--active");
      expect(active?.textContent?.trim()).toContain("Delta");
    });

    it("jumps to first option with Home", () => {
      dispatchKey(host, "End");
      dispatchKey(host, "Home");
      fixture.detectChanges();
      const active = host.querySelector(".interop-option--active");
      expect(active?.textContent?.trim()).toContain("Alpha");
    });

    it("selects active option with Enter", () => {
      dispatchKey(host, "Enter");
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe("a");
    });

    it("selects active option with Space", () => {
      dispatchKey(host, " ");
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe("a");
    });

    it("emits closeRequest on Escape", () => {
      const listbox = fixture.debugElement
        .query((el) => el.componentInstance instanceof InteropListbox)
        ?.componentInstance as InteropListbox;
      const spy = jasmine.createSpy("closeRequest");
      listbox.closeRequest.subscribe(spy);
      dispatchKey(host, "Escape");
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("clears active index on blur", () => {
      dispatchKey(host, "ArrowDown");
      fixture.detectChanges();
      host.dispatchEvent(new FocusEvent("blur"));
      fixture.detectChanges();
      const active = host.querySelector(".interop-option--active");
      expect(active).toBeNull();
    });
  });

  describe("type-ahead", () => {
    let fixture: ComponentFixture<DeclarativeHost>;
    let host: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DeclarativeHost],
      }).compileComponents();
      fixture = TestBed.createComponent(DeclarativeHost);
      fixture.detectChanges();
      host = fixture.nativeElement.querySelector("[interop-listbox]");
      host.dispatchEvent(new FocusEvent("focus"));
      fixture.detectChanges();
    });

    it("jumps to matching option on character press", () => {
      dispatchKey(host, "b");
      fixture.detectChanges();
      const active = host.querySelector(".interop-option--active");
      expect(active?.textContent?.trim()).toContain("Beta");
    });

    it("accumulates characters within debounce window", fakeAsync(() => {
      dispatchKey(host, "d");
      dispatchKey(host, "e"); // "de" → Delta
      fixture.detectChanges();
      const active = host.querySelector(".interop-option--active");
      expect(active?.textContent?.trim()).toContain("Delta");
      tick(500);
    }));
  });

  describe("multi-select", () => {
    let fixture: ComponentFixture<MultiSelectHost>;
    let host: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [MultiSelectHost],
      }).compileComponents();
      fixture = TestBed.createComponent(MultiSelectHost);
      fixture.detectChanges();
      host = fixture.nativeElement.querySelector("[interop-listbox]");
    });

    it("sets aria-multiselectable", () => {
      expect(host.getAttribute("aria-multiselectable")).toBe("true");
    });

    it("toggles options into the selection array", () => {
      const options = host.querySelectorAll<HTMLElement>("[role=option]");
      options[0].click();
      options[1].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toEqual(["a", "b"]);
    });

    it("deselects an already-selected option on click", () => {
      const options = host.querySelectorAll<HTMLElement>("[role=option]");
      options[0].click();
      options[0].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toEqual([]);
    });
  });

  describe("content projection", () => {
    let fixture: ComponentFixture<ProjectionHost>;
    let host: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ProjectionHost],
      }).compileComponents();
      fixture = TestBed.createComponent(ProjectionHost);
      fixture.detectChanges();
      host = fixture.nativeElement.querySelector("[interop-listbox]");
    });

    it("projects option elements with role=option", () => {
      const options = host.querySelectorAll("[role=option]");
      expect(options.length).toBe(3);
    });

    it("selects a projected option on click", () => {
      const options = host.querySelectorAll<HTMLElement>("[role=option]");
      options[0].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe("x");
    });

    it("marks disabled projected options", () => {
      const options = host.querySelectorAll("[role=option]");
      expect(options[2].getAttribute("aria-disabled")).toBe("true");
    });
  });

  describe("ControlValueAccessor", () => {
    let fixture: ComponentFixture<CVAHost>;
    let host: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [CVAHost],
      }).compileComponents();
      fixture = TestBed.createComponent(CVAHost);
      fixture.detectChanges();
      host = fixture.nativeElement.querySelector("[interop-listbox]");
    });

    it("reflects the form control value as selected", () => {
      const options = host.querySelectorAll("[role=option]");
      expect(options[1].getAttribute("aria-selected")).toBe("true");
    });

    it("updates the form control on option click", () => {
      const options = host.querySelectorAll<HTMLElement>("[role=option]");
      options[0].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.control.value).toBe("a");
    });
  });
});
