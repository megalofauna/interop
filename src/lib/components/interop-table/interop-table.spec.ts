import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, TemplateRef, ViewChild, signal } from "@angular/core";
import { By } from "@angular/platform-browser";
import { Subject } from "rxjs";
import { InteropTable, TableColumn } from "./interop-table";

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
      [maxRows]="maxRows"
    ></table>

    <ng-template #nameTemplate let-value let-item="item">
      <strong>{{ value }}</strong> - {{ item.email }}
    </ng-template>
  `,
})
class TestHostComponent {
  @ViewChild("nameTemplate") nameTemplate!: TemplateRef<any>;

  users: TestUser[] | Subject<TestUser[]> = [
    { id: 1, name: "John Doe", email: "john@example.com", active: true },
    { id: 2, name: "Jane Smith", email: "jane@example.com", active: false },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", active: true },
  ];

  columns: TableColumn<TestUser>[] = [];
  trackBy: any = "auto";
  maxRows: number | null = null;
}

describe("InteropTable", () => {
  let component: InteropTable<TestUser>;
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();

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
    it("should auto-generate columns from data", () => {
      hostComponent.columns = [];
      fixture.detectChanges();

      const columns = component.resolvedColumns();
      expect(columns.length).toBe(4);
      expect(columns.map((c) => c.key)).toEqual([
        "id",
        "name",
        "email",
        "active",
      ]);
    });

    it("should format keys as labels", () => {
      hostComponent.columns = [];
      fixture.detectChanges();

      const columns = component.resolvedColumns();
      expect(component.getColumnLabel(columns[0])).toBe("Id");
      expect(component.getColumnLabel(columns[1])).toBe("Name");
      expect(component.getColumnLabel(columns[2])).toBe("Email");
      expect(component.getColumnLabel(columns[3])).toBe("Active");
    });
  });

  describe("Custom columns", () => {
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
      const user = (hostComponent.users as TestUser[])[0];
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
      const column: TableColumn<TestUser> = { key: "email" };
      const label = component.getColumnLabel(column);
      expect(label).toBe("email");
    });

    it("should convert values to text", () => {
      const user = (hostComponent.users as TestUser[])[0];
      const column: TableColumn<TestUser> = { key: "active" };

      const text = component.getCellText(user, column);
      expect(text).toBe("true");
    });

    it("should handle null/undefined values", () => {
      const user = {
        ...(hostComponent.users as TestUser[])[0],
        name: null as any,
      };
      const column: TableColumn<TestUser> = { key: "name" };

      const text = component.getCellText(user, column);
      expect(text).toBe("");
    });
  });

  describe("TrackBy functionality", () => {
    it('should use index when trackBy is "index"', () => {
      hostComponent.trackBy = "index";
      fixture.detectChanges();

      const trackResult = component.trackByFn(
        1,
        (hostComponent.users as TestUser[])[1],
      );
      expect(trackResult).toBe(1);
    });

    it("should use auto tracking by default", () => {
      const trackResult = component.trackByFn(
        0,
        (hostComponent.users as TestUser[])[0],
      );
      expect(trackResult).toBe(1);
    });

    it("should use custom trackBy function", () => {
      const customTrackBy = (_index: number, item: TestUser) => item.email;
      hostComponent.trackBy = customTrackBy;
      fixture.detectChanges();

      const trackResult = component.trackByFn(
        0,
        (hostComponent.users as TestUser[])[0],
      );
      expect(trackResult).toBe("john@example.com");
    });
  });

  describe("Async sources", () => {
    it("should reflect Observable emissions", () => {
      const source = new Subject<TestUser[]>();
      hostComponent.users = source;
      fixture.detectChanges();

      expect(component.isLoading()).toBe(true);

      source.next([
        { id: 9, name: "Async", email: "a@x.com", active: true },
      ]);
      fixture.detectChanges();

      expect(component.isLoading()).toBe(false);
      expect(component.items().length).toBe(1);
      expect(component.items()[0].name).toBe("Async");
    });

    it("should expose Observable errors via hasError()", () => {
      const source = new Subject<TestUser[]>();
      hostComponent.users = source;
      fixture.detectChanges();

      source.error(new Error("boom"));
      fixture.detectChanges();

      expect(component.hasError()).toBe(true);
    });
  });

  describe("Max rows limitation", () => {
    it("should limit rows when maxRows is set", () => {
      hostComponent.maxRows = 2;
      fixture.detectChanges();

      expect(component.items().length).toBe(2);
    });

    it("should show all rows when maxRows is null", () => {
      hostComponent.maxRows = null;
      fixture.detectChanges();

      expect(component.items().length).toBe(3);
    });
  });
});
