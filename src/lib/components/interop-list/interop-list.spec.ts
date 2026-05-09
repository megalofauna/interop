import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Observable, of, throwError, delay } from "rxjs";
import { InteropList } from "./interop-list";
import { InteropCollectionInput } from "../../collection/public-api";

// Test host component for testing attribute selector
@Component({
  template: `
    <ul interop-list [collection]="collection()">
      <li *ngFor="let item of items">{{ item }}</li>
    </ul>
  `,
  standalone: true,
  imports: [CommonModule, InteropList],
})
class TestHostComponent {
  collection = signal<InteropCollectionInput<string>>([]);
  get items() {
    return this.collection();
  }
}

describe("InteropList", () => {
  let component: InteropList;
  let fixture: ComponentFixture<InteropList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteropList],
    }).compileComponents();

    fixture = TestBed.createComponent(InteropList);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Signal inputs", () => {
    it("should accept collection input as signal", () => {
      const testData = ["Item 1", "Item 2", "Item 3"];
      fixture.componentRef.setInput("collection", testData);
      fixture.detectChanges();

      expect(component.items()).toEqual(testData);
    });

    it("should handle trackBy input", () => {
      const customTrackBy = (index: number, item: any) => item.id;
      fixture.componentRef.setInput("trackBy", customTrackBy);

      expect(component.trackBy()).toBe(customTrackBy);
    });
  });

  describe("Array input", () => {
    it("should display array items", () => {
      const testData = ["Item 1", "Item 2", "Item 3"];
      fixture.componentRef.setInput("collection", testData);
      fixture.detectChanges();

      expect(component.items()).toEqual(testData);
    });

    it("should handle empty array", () => {
      fixture.componentRef.setInput("collection", []);
      fixture.detectChanges();

      expect(component.items()).toEqual([]);
    });
  });

  describe("Observable input", () => {
    it("should display items after observable resolves", (done) => {
      const testData = ["Item 1", "Item 2"];
      const observable = of(testData);

      fixture.componentRef.setInput("collection", observable);
      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        expect(component.items()).toEqual(testData);
        done();
      }, 10);
    });

    it("should handle observable errors gracefully", (done) => {
      const errorObservable = throwError(() => new Error("Test error"));

      fixture.componentRef.setInput("collection", errorObservable);
      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        expect(component.items()).toEqual([]);
        done();
      }, 10);
    });
  });

  describe("Promise input", () => {
    it("should handle promise input", async () => {
      const testData = ["Item 1", "Item 2"];
      const promise = Promise.resolve(testData);

      fixture.componentRef.setInput("collection", promise);
      fixture.detectChanges();

      // Wait for promise to resolve
      await promise;
      fixture.detectChanges();

      expect(component.items()).toEqual(testData);
    });
  });

  describe("Iterable input", () => {
    it("should handle Set as iterable", () => {
      const testSet = new Set(["Item 1", "Item 2", "Item 3"]);
      fixture.componentRef.setInput("collection", testSet);
      fixture.detectChanges();

      expect(component.items()).toEqual(["Item 1", "Item 2", "Item 3"]);
    });

    it("should handle Map values as iterable", () => {
      const testMap = new Map([
        ["a", "Item 1"],
        ["b", "Item 2"],
      ]);
      fixture.componentRef.setInput("collection", testMap.values());
      fixture.detectChanges();

      expect(component.items()).toEqual(["Item 1", "Item 2"]);
    });
  });

  describe("Collection input", () => {
    it("should handle Collection object", () => {
      const collection = {
        items: ["Item 1", "Item 2"],
        loading: false,
      };

      fixture.componentRef.setInput("collection", collection);
      fixture.detectChanges();

      expect(component.items()).toEqual(["Item 1", "Item 2"]);
    });
  });

  describe("TrackBy functionality", () => {
    it("should use auto trackBy by default", () => {
      const items = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ];

      fixture.componentRef.setInput("collection", items);
      fixture.detectChanges();

      // Test auto trackBy with objects that have id
      expect(component.trackByFn(0, items[0])).toBe(1);
      expect(component.trackByFn(1, items[1])).toBe(2);
    });

    it("should use custom trackBy function", () => {
      const customTrackBy = jasmine
        .createSpy("trackBy")
        .and.returnValue("custom");
      fixture.componentRef.setInput("trackBy", customTrackBy);

      const result = component.trackByFn(0, "test");

      expect(customTrackBy).toHaveBeenCalledWith(0, "test");
      expect(result).toBe("custom");
    });

    it("should handle auto trackBy with primitives", () => {
      fixture.componentRef.setInput("collection", ["a", "b", "c"]);
      fixture.detectChanges();

      // Should fall back to index for primitives
      expect(component.trackByFn(0, "a")).toBe(0);
      expect(component.trackByFn(1, "b")).toBe(1);
    });

    it("should use trackByField when provided", () => {
      const items = [
        { id: 1, sku: "X-1", name: "P1" },
        { id: 2, sku: "X-2", name: "P2" },
      ];
      fixture.componentRef.setInput("collection", items);
      fixture.componentRef.setInput("trackByField", "sku");
      fixture.detectChanges();

      expect(component.trackByFn(0, items[0])).toBe("X-1");
      expect(component.trackByFn(1, items[1])).toBe("X-2");
    });

    it("should fall back from trackByField to auto when field is missing", () => {
      const items = [
        { id: 10, name: "Has ID" }, // no `code` field
        { _id: "m-1", name: "Mongo ID" },
        { name: "No IDs" },
      ];
      fixture.componentRef.setInput("collection", items);
      fixture.componentRef.setInput("trackByField", "code");
      fixture.detectChanges();

      // Item 0: missing field -> auto uses id
      expect(component.trackByFn(0, items[0])).toBe(10);
      // Item 1: missing field -> auto uses _id
      expect(component.trackByFn(1, items[1])).toBe("m-1");
      // Item 2: missing field and auto id -> falls back to index
      expect(component.trackByFn(2, items[2])).toBe(2);
    });

    it("should use index mode explicitly when trackBy='index'", () => {
      const items = [{ id: 100 }, { id: 200 }];
      fixture.componentRef.setInput("collection", items);
      fixture.componentRef.setInput("trackBy", "index");
      fixture.detectChanges();

      expect(component.trackByFn(0, items[0])).toBe(0);
      expect(component.trackByFn(1, items[1])).toBe(1);
    });
  });

  describe("Text extraction", () => {
    it("should extract text from strings", () => {
      expect(component.getItemText("Hello")).toBe("Hello");
    });

    it("should extract text from numbers", () => {
      expect(component.getItemText(123)).toBe("123");
    });

    it("should extract text from objects with name property", () => {
      expect(component.getItemText({ name: "Test Item" })).toBe("Test Item");
    });

    it("should extract text from objects with title property", () => {
      expect(component.getItemText({ title: "Test Title" })).toBe("Test Title");
    });

    it("should extract text from objects with label property", () => {
      expect(component.getItemText({ label: "Test Label" })).toBe("Test Label");
    });

    it("should handle null/undefined items", () => {
      expect(component.getItemText(null)).toBe("");
      expect(component.getItemText(undefined)).toBe("");
    });

    it("should fallback to JSON for complex objects", () => {
      const obj = { complex: true, data: [1, 2, 3] };
      expect(component.getItemText(obj)).toBe(JSON.stringify(obj));
    });
  });
});

describe("InteropList with semantic elements", () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteropList, TestHostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  it("should work as attribute selector on ul element", () => {
    const testData = ["Item 1", "Item 2"];
    hostComponent.collection.set(testData);
    hostFixture.detectChanges();

    const ulElement = hostFixture.nativeElement.querySelector("ul");
    expect(ulElement).toBeTruthy();
    expect(ulElement.getAttribute("interop-list")).not.toBeNull();
  });
});
