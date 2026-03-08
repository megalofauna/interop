import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, TemplateRef, ViewChild } from "@angular/core";
import { By } from "@angular/platform-browser";
import { InteropTable, TableColumn } from "./interop-table";
import { InteropCollectionService } from "../../services/interop-collection.service";
import { InteropAttribute } from "../../services/interop-attribute.service";

interface TestUser {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

@Component({
  standalone: true,
  imports: [InteropTable],
  template: `
    <table
      interop-table
      [collection]="users"
      [columns]="columns"
      [trackBy]="trackBy"
    ></table>

    <ng-template #nameTemplate let-value let-item="item">
      <strong>{{ value }}</strong> - {{ item.email }}
    </ng-template>
  `,
})
class TestHostComponent {
  @ViewChild("nameTemplate") nameTemplate!: TemplateRef<any>;

  users: TestUser[] = [
    { id: 1, name: "John Doe", email: "john@example.com", active: true },
    { id: 2, name: "Jane Smith", email: "jane@example.com", active: false },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", active: true },
  ];

  columns: TableColumn<TestUser>[] = [];
  trackBy: any = "auto";
}

describe("InteropTable", () => {
  let component: InteropTable<TestUser>;
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let collectionService: jasmine.SpyObj<InteropCollectionService>;
  let attrsManager: jasmine.SpyObj<InteropAttribute>;

  beforeEach(async () => {
    const collectionSpy = jasmine.createSpyObj("InteropCollectionService", [
      "resolve",
      "computedResolve",
    ]);
    const attrsSpy = jasmine.createSpyObj("InteropAttribute", ["Presets"]);

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: InteropCollectionService, useValue: collectionSpy },
        { provide: InteropAttribute, useValue: attrsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    collectionService = TestBed.inject(
      InteropCollectionService,
    ) as jasmine.SpyObj<InteropCollectionService>;
    attrsManager = TestBed.inject(
      InteropAttribute,
    ) as jasmine.SpyObj<InteropAttribute>;

    // Get the component instance
    const tableElement = fixture.debugElement.query(By.directive(InteropTable));
    component = tableElement.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should be applied to table element", () => {
    const tableElement = fixture.debugElement.query(By.css("table"));
    expect(tableElement).toBeTruthy();
    expect(tableElement.nativeElement.tagName).toBe("TABLE");
  });

  describe("Auto-generated columns", () => {
    beforeEach(() => {
      // Mock collection service to return a simple collection
      collectionService.resolve.and.returnValue({
        items: jasmine.createSpy().and.returnValue(hostComponent.users),
        loading: jasmine.createSpy().and.returnValue(false),
        error: jasmine.createSpy().and.returnValue(null),
        hasError: jasmine.createSpy().and.returnValue(false),
        isEmpty: jasmine.createSpy().and.returnValue(false),
      } as any);

      collectionService.computedResolve.and.returnValue(null);

      // No custom columns, should auto-generate
      hostComponent.columns = [];
      fixture.detectChanges();
    });

    it("should auto-generate columns from data", () => {
      const columns = component.resolvedColumns();
      expect(columns.length).toBe(4); // id, name, email, active
      expect(columns.map((c) => c.key)).toEqual([
        "id",
        "name",
        "email",
        "active",
      ]);
    });

    it("should format keys as labels", () => {
      const columns = component.resolvedColumns();
      expect(component.getColumnLabel(columns[0])).toBe("Id");
      expect(component.getColumnLabel(columns[1])).toBe("Name");
      expect(component.getColumnLabel(columns[2])).toBe("Email");
      expect(component.getColumnLabel(columns[3])).toBe("Active");
    });
  });

  describe("Custom columns", () => {
    beforeEach(() => {
      // Mock collection service
      collectionService.resolve.and.returnValue({
        items: jasmine.createSpy().and.returnValue(hostComponent.users),
        loading: jasmine.createSpy().and.returnValue(false),
        error: jasmine.createSpy().and.returnValue(null),
        hasError: jasmine.createSpy().and.returnValue(false),
        isEmpty: jasmine.createSpy().and.returnValue(false),
      } as any);

      collectionService.computedResolve.and.returnValue(null);
    });

    it("should use custom columns when provided", () => {
      hostComponent.columns = [
        { key: "name", label: "Full Name" },
        { key: "email", label: "Email Address" },
      ];
      fixture.detectChanges();

      const columns = component.resolvedColumns();
      expect(columns.length).toBe(2);
      expect(columns[0].key).toBe("name");
      expect(columns[0].label).toBe("Full Name");
      expect(columns[1].key).toBe("email");
      expect(columns[1].label).toBe("Email Address");
    });

    it("should filter out hidden columns", () => {
      hostComponent.columns = [
        { key: "name", label: "Name" },
        { key: "email", label: "Email", hidden: true },
        { key: "active", label: "Status" },
      ];
      fixture.detectChanges();

      const columns = component.resolvedColumns();
      expect(columns.length).toBe(2);
      expect(columns.map((c) => c.key)).toEqual(["name", "active"]);
    });
  });

  describe("Cell value extraction", () => {
    it("should get value by key", () => {
      const user = hostComponent.users[0];
      const column: TableColumn<TestUser> = { key: "name" };

      const text = component.getCellText(user, column);
      expect(text).toBe("John Doe");
    });

    it("should get column label from label property", () => {
      const column: TableColumn<TestUser> = {
        key: "name",
        label: "Full Name",
      };

      const label = component.getColumnLabel(column);
      expect(label).toBe("Full Name");
    });

    it("should default column label to key when no label provided", () => {
      const column: TableColumn<TestUser> = {
        key: "email",
      };

      const label = component.getColumnLabel(column);
      expect(label).toBe("email");
    });

    it("should convert values to text", () => {
      const user = hostComponent.users[0];
      const column: TableColumn<TestUser> = { key: "active" };

      const text = component.getCellText(user, column);
      expect(text).toBe("true");
    });

    it("should handle null/undefined values", () => {
      const user = { ...hostComponent.users[0], name: null as any };
      const column: TableColumn<TestUser> = { key: "name" };

      const text = component.getCellText(user, column);
      expect(text).toBe("");
    });
  });

  describe("TrackBy functionality", () => {
    it('should use index when trackBy is "index"', () => {
      hostComponent.trackBy = "index";
      fixture.detectChanges();

      const trackResult = component.trackByFn(1, hostComponent.users[1]);
      expect(trackResult).toBe(1);
    });

    it("should use auto tracking by default", () => {
      const trackResult = component.trackByFn(0, hostComponent.users[0]);
      expect(trackResult).toBe(1); // Should use the 'id' field
    });

    it("should use custom trackBy function", () => {
      const customTrackBy = (index: number, item: TestUser) => item.email;
      hostComponent.trackBy = customTrackBy;
      fixture.detectChanges();

      const trackResult = component.trackByFn(0, hostComponent.users[0]);
      expect(trackResult).toBe("john@example.com");
    });
  });

  describe("Loading states", () => {
    it("should show loading state", () => {
      collectionService.resolve.and.returnValue({
        items: jasmine.createSpy().and.returnValue([]),
        loading: jasmine.createSpy().and.returnValue(true),
        error: jasmine.createSpy().and.returnValue(null),
        hasError: jasmine.createSpy().and.returnValue(false),
        isEmpty: jasmine.createSpy().and.returnValue(true),
      } as any);

      fixture.detectChanges();

      expect(component.isLoading()).toBe(true);
    });

    it("should show error state", () => {
      collectionService.resolve.and.returnValue({
        items: jasmine.createSpy().and.returnValue([]),
        loading: jasmine.createSpy().and.returnValue(false),
        error: jasmine.createSpy().and.returnValue(new Error("Test error")),
        hasError: jasmine.createSpy().and.returnValue(true),
        isEmpty: jasmine.createSpy().and.returnValue(true),
      } as any);

      fixture.detectChanges();

      expect(component.hasError()).toBe(true);
    });

    it("should show empty state", () => {
      collectionService.resolve.and.returnValue({
        items: jasmine.createSpy().and.returnValue([]),
        loading: jasmine.createSpy().and.returnValue(false),
        error: jasmine.createSpy().and.returnValue(null),
        hasError: jasmine.createSpy().and.returnValue(false),
        isEmpty: jasmine.createSpy().and.returnValue(true),
      } as any);

      fixture.detectChanges();

      expect(component.isEmpty()).toBe(true);
    });
  });

  describe("Max rows limitation", () => {
    beforeEach(() => {
      collectionService.resolve.and.returnValue({
        items: jasmine.createSpy().and.returnValue(hostComponent.users),
        loading: jasmine.createSpy().and.returnValue(false),
        error: jasmine.createSpy().and.returnValue(null),
        hasError: jasmine.createSpy().and.returnValue(false),
        isEmpty: jasmine.createSpy().and.returnValue(false),
      } as any);

      collectionService.computedResolve.and.returnValue(null);
    });

    it("should limit rows when maxRows is set", () => {
      // Set maxRows to 2
      component = Object.assign(component, {
        maxRows: jasmine.createSpy().and.returnValue(2),
      });
      fixture.detectChanges();

      const items = component.items();
      expect(items.length).toBe(2);
    });

    it("should show all rows when maxRows is null", () => {
      // Default behavior - no limit
      fixture.detectChanges();
      const items = component.items();
      expect(items.length).toBe(3);
    });
  });
});
