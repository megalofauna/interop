import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { InteropActivation } from "../../services/interop-activation.service";
import { InteropTabLabel } from "./interop-tab-label.directive";
import { InteropTabPanel } from "./interop-tab-panel";
import { InteropTabs } from "./interop-tabs";

// ─── Standard test host ───────────────────────────────────────────────────────

@Component({
  standalone: true,
  imports: [InteropTabs, InteropTabPanel],
  template: `
    <section interop-tabs
      [active]="active()"
      (activeChange)="onActiveChange($event)"
      [ariaLabel]="ariaLabel"
      [orientation]="orientation"
      [activationMode]="activationMode"
    >
      <section interop-tab-panel key="profile"  label="Profile">Profile content</section>
      <section interop-tab-panel key="settings" label="Settings">Settings content</section>
      <section interop-tab-panel key="billing"  label="Billing">Billing content</section>
    </section>
  `,
})
class TestHostComponent {
  active = signal<string | null>(null);
  lastActiveChange: string | null = null;
  ariaLabel: string | null = "Account";
  orientation: "horizontal" | "vertical" = "horizontal";
  activationMode: "auto" | "manual" = "auto";

  onActiveChange(key: string | null): void {
    this.lastActiveChange = key;
  }
}

// ─── Host for activationId integration ───────────────────────────────────────

@Component({
  standalone: true,
  imports: [InteropTabs, InteropTabPanel],
  template: `
    <section interop-tabs activationId="test-tabs-id">
      <section interop-tab-panel key="one" label="One">One</section>
      <section interop-tab-panel key="two" label="Two">Two</section>
    </section>
  `,
})
class TestActivationIdHost {}

// ─────────────────────────────────────────────────────────────────────────────

describe("InteropTabs", () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let tabsEl: HTMLElement;

  function getTabButtons(): HTMLButtonElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('[role="tab"]'),
    ) as HTMLButtonElement[];
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    tabsEl = fixture.nativeElement.querySelector("section[interop-tabs]");
    fixture.detectChanges();
  });

  // ── Structure ─────────────────────────────────────────────────────────────

  it("should create", () => {
    const tabs = fixture.debugElement.query(By.directive(InteropTabs));
    expect(tabs).not.toBeNull();
  });

  it("renders a tablist", () => {
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(tablist).not.toBeNull();
  });

  it("renders one tab button per panel", () => {
    expect(getTabButtons().length).toBe(3);
  });

  it("tab buttons have correct labels", () => {
    const labels = getTabButtons().map((b) => b.textContent?.trim());
    expect(labels).toEqual(["Profile", "Settings", "Billing"]);
  });

  it("tablist has aria-label from input", () => {
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(tablist.getAttribute("aria-label")).toBe("Account");
  });

  // ── Default active state ──────────────────────────────────────────────────

  it("first panel is active by default when active is null", () => {
    const tabs = fixture.debugElement.query(By.directive(InteropTabs))
      .componentInstance as InteropTabs;
    expect(tabs.resolvedActive()).toBe("profile");
  });

  it("first tab button has aria-selected=true", () => {
    const buttons = getTabButtons();
    expect(buttons[0].getAttribute("aria-selected")).toBe("true");
    expect(buttons[1].getAttribute("aria-selected")).toBe("false");
    expect(buttons[2].getAttribute("aria-selected")).toBe("false");
  });

  it("active tab button has tabindex=0, others have tabindex=-1", () => {
    const buttons = getTabButtons();
    expect(buttons[0].getAttribute("tabindex")).toBe("0");
    expect(buttons[1].getAttribute("tabindex")).toBe("-1");
    expect(buttons[2].getAttribute("tabindex")).toBe("-1");
  });

  // ── Click activation ──────────────────────────────────────────────────────

  it("clicking a tab button activates the panel", () => {
    const buttons = getTabButtons();
    buttons[1].click();
    fixture.detectChanges();

    expect(buttons[1].getAttribute("aria-selected")).toBe("true");
    expect(buttons[0].getAttribute("aria-selected")).toBe("false");
  });

  it("clicking a tab emits activeChange", () => {
    const buttons = getTabButtons();
    buttons[2].click();
    fixture.detectChanges();

    expect(hostComponent.lastActiveChange).toBe("billing");
  });

  // ── Two-way binding ───────────────────────────────────────────────────────

  it("external active change activates the correct panel", () => {
    hostComponent.active.set("settings");
    fixture.detectChanges();

    const buttons = getTabButtons();
    expect(buttons[1].getAttribute("aria-selected")).toBe("true");
  });

  it("invalid active key falls back to first panel", () => {
    hostComponent.active.set("nonexistent");
    fixture.detectChanges();

    const tabs = fixture.debugElement.query(By.directive(InteropTabs))
      .componentInstance as InteropTabs;
    expect(tabs.resolvedActive()).toBe("profile");
  });

  // ── ARIA wiring ───────────────────────────────────────────────────────────

  it("each tab button aria-controls matches its panel id", () => {
    const buttons = getTabButtons();
    const panels = fixture.nativeElement.querySelectorAll(
      "section[interop-tab-panel]",
    ) as NodeListOf<HTMLElement>;

    buttons.forEach((button, i) => {
      const controlsId = button.getAttribute("aria-controls");
      expect(controlsId).toBeTruthy();
      expect(panels[i].id).toBe(controlsId!);
    });
  });

  it("each panel aria-labelledby matches its tab button id", () => {
    const buttons = getTabButtons();
    const panels = fixture.nativeElement.querySelectorAll(
      "section[interop-tab-panel]",
    ) as NodeListOf<HTMLElement>;

    panels.forEach((panel, i) => {
      const labelledById = panel.getAttribute("aria-labelledby");
      expect(labelledById).toBeTruthy();
      expect(buttons[i].id).toBe(labelledById!);
    });
  });

  // ── Keyboard navigation (horizontal / auto) ───────────────────────────────

  it("ArrowRight moves to next tab in auto mode", () => {
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    tablist.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    fixture.detectChanges();

    const tabs = fixture.debugElement.query(By.directive(InteropTabs))
      .componentInstance as InteropTabs;
    expect(tabs.resolvedActive()).toBe("settings");
  });

  it("ArrowLeft moves to previous tab (wraps)", () => {
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    tablist.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
    fixture.detectChanges();

    const tabs = fixture.debugElement.query(By.directive(InteropTabs))
      .componentInstance as InteropTabs;
    expect(tabs.resolvedActive()).toBe("billing"); // wraps to last
  });

  it("End moves to last tab", () => {
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    tablist.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
    fixture.detectChanges();

    const tabs = fixture.debugElement.query(By.directive(InteropTabs))
      .componentInstance as InteropTabs;
    expect(tabs.resolvedActive()).toBe("billing");
  });

  it("Home moves to first tab", () => {
    // Start at last
    hostComponent.active.set("billing");
    fixture.detectChanges();

    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    tablist.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
    fixture.detectChanges();

    const tabs = fixture.debugElement.query(By.directive(InteropTabs))
      .componentInstance as InteropTabs;
    expect(tabs.resolvedActive()).toBe("profile");
  });

  // ── Keyboard navigation (vertical) ───────────────────────────────────────

  it("ArrowDown activates next in vertical orientation", () => {
    hostComponent.orientation = "vertical";
    fixture.detectChanges();

    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    tablist.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    fixture.detectChanges();

    const tabs = fixture.debugElement.query(By.directive(InteropTabs))
      .componentInstance as InteropTabs;
    expect(tabs.resolvedActive()).toBe("settings");
  });

  it("ArrowRight does NOT activate in vertical orientation", () => {
    hostComponent.orientation = "vertical";
    fixture.detectChanges();

    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    tablist.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    fixture.detectChanges();

    const tabs = fixture.debugElement.query(By.directive(InteropTabs))
      .componentInstance as InteropTabs;
    expect(tabs.resolvedActive()).toBe("profile"); // unchanged
  });

  // ── Manual activation mode ────────────────────────────────────────────────

  it("ArrowRight does NOT activate in manual mode", () => {
    hostComponent.activationMode = "manual";
    fixture.detectChanges();

    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    tablist.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    fixture.detectChanges();

    const tabs = fixture.debugElement.query(By.directive(InteropTabs))
      .componentInstance as InteropTabs;
    expect(tabs.resolvedActive()).toBe("profile"); // unchanged
  });

  it("Enter activates focused tab in manual mode", () => {
    hostComponent.activationMode = "manual";
    fixture.detectChanges();

    // Simulate Enter on the second tab button
    const buttons = getTabButtons();
    buttons[1].dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    fixture.detectChanges();

    const tabs = fixture.debugElement.query(By.directive(InteropTabs))
      .componentInstance as InteropTabs;
    expect(tabs.resolvedActive()).toBe("settings");
  });

  it("Space activates focused tab in manual mode", () => {
    hostComponent.activationMode = "manual";
    fixture.detectChanges();

    const buttons = getTabButtons();
    buttons[2].dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    );
    fixture.detectChanges();

    const tabs = fixture.debugElement.query(By.directive(InteropTabs))
      .componentInstance as InteropTabs;
    expect(tabs.resolvedActive()).toBe("billing");
  });

  // ── Content preservation ──────────────────────────────────────────────────

  it("DOM of previously active panel is preserved after switching away", () => {
    // profile is active — its input should be in DOM
    const inputProfile = fixture.nativeElement.querySelector(
      "section[interop-tab-panel][id*='profile']",
    ) as HTMLElement;
    expect(inputProfile).not.toBeNull();

    // Switch to settings
    hostComponent.active.set("settings");
    fixture.detectChanges();

    // profile panel is still in DOM (just hidden)
    const profilePanelAfterSwitch = fixture.nativeElement.querySelector(
      "section[interop-tab-panel][id*='profile']",
    ) as HTMLElement;
    expect(profilePanelAfterSwitch).not.toBeNull();
    expect(profilePanelAfterSwitch.hasAttribute("hidden")).toBeTrue();
  });

  // ── Orientation attribute ─────────────────────────────────────────────────

  it("sets aria-orientation on tablist", () => {
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(tablist.getAttribute("aria-orientation")).toBe("horizontal");

    hostComponent.orientation = "vertical";
    fixture.detectChanges();
    expect(tablist.getAttribute("aria-orientation")).toBe("vertical");
  });
});

// ─── activationId integration ─────────────────────────────────────────────────

describe("InteropTabs — activationId", () => {
  let fixture: ComponentFixture<TestActivationIdHost>;
  let activationSpy: jasmine.SpyObj<InteropActivation>;

  beforeEach(async () => {
    activationSpy = jasmine.createSpyObj("InteropActivation", [
      "register",
      "trigger",
      "has",
      "unregister",
    ]);

    // Simulate register returning an unregister handle
    activationSpy.register.and.returnValue({
      unregister: jasmine.createSpy("unregister"),
      instance: jasmine.createSpyObj("instance", [
        "cancel",
        "enable",
        "disable",
        "isEnabled",
      ]),
    });

    await TestBed.configureTestingModule({
      imports: [TestActivationIdHost],
      providers: [{ provide: InteropActivation, useValue: activationSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestActivationIdHost);
    fixture.detectChanges();
  });

  it("registers with InteropActivation when activationId is provided", () => {
    expect(activationSpy.register).toHaveBeenCalledWith(
      "test-tabs-id",
      jasmine.any(Function),
    );
  });

  it("registered handler switches panels when triggered", () => {
    // Extract the registered handler
    const registeredHandler = activationSpy.register.calls.mostRecent()
      .args[1] as (payload: unknown) => void;

    registeredHandler("two");
    fixture.detectChanges();

    const tabs = fixture.debugElement.query(By.directive(InteropTabs))
      .componentInstance as InteropTabs;
    expect(tabs.resolvedActive()).toBe("two");
  });
});
