import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { By } from "@angular/platform-browser";
import { InteropButton } from "./interop-button";
import { InteropActivation } from "../../services/interop-activation.service";

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
    >
      Test Button Content
    </button>
  `,
})
class TestHost {
  onActivate: any = null;
  activationId: string | null = null;
  payload: unknown = undefined;
  activationOptions: any = {};
  loading = false;
  disabled = false;
  type: "button" | "submit" | "reset" = "button";
  loadingText = "Loading...";
}

describe("InteropButton", () => {
  let host: TestHost;
  let fixture: ComponentFixture<TestHost>;
  let buttonEl: HTMLButtonElement;
  let button: InteropButton;
  let activationService: jasmine.SpyObj<InteropActivation>;

  beforeEach(async () => {
    const activationSpy = jasmine.createSpyObj("InteropActivation", [
      "trigger",
      "register",
      "has",
    ]);

    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: InteropActivation, useValue: activationSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    buttonEl = fixture.nativeElement.querySelector("button");
    button = fixture.debugElement.query(
      By.directive(InteropButton),
    ).componentInstance;
    activationService = TestBed.inject(
      InteropActivation,
    ) as jasmine.SpyObj<InteropActivation>;

    fixture.detectChanges();
  });

  // ── Setup ────────────────────────────────────────────────────────────────────

  it("should create", () => {
    expect(button).toBeTruthy();
  });

  it("should require a button element", () => {
    expect(buttonEl.tagName).toBe("BUTTON");
  });

  it("should have correct defaults", () => {
    expect(button.onActivate()).toBeNull();
    expect(button.activationId()).toBeNull();
    expect(button.loading()).toBeFalse();
    expect(button.disabled()).toBeFalse();
    expect(button.type()).toBe("button");
  });

  // ── Computed state ────────────────────────────────────────────────────────────

  it("isDisabled is true when disabled=true", () => {
    host.disabled = true;
    fixture.detectChanges();
    expect(button.isDisabled()).toBeTrue();
  });

  it("isDisabled is true when loading=true", () => {
    host.loading = true;
    fixture.detectChanges();
    expect(button.isDisabled()).toBeTrue();
  });

  it("canActivate is false with no handler", () => {
    expect(button.canActivate()).toBeFalse();
  });

  it("canActivate is true with onActivate", () => {
    host.onActivate = jasmine.createSpy();
    fixture.detectChanges();
    expect(button.canActivate()).toBeTrue();
  });

  it("canActivate is true with activationId", () => {
    host.activationId = "test";
    fixture.detectChanges();
    expect(button.canActivate()).toBeTrue();
  });

  it("canActivate is false when disabled even with handler", () => {
    host.onActivate = jasmine.createSpy();
    host.disabled = true;
    fixture.detectChanges();
    expect(button.canActivate()).toBeFalse();
  });

  // ── Click behavior ────────────────────────────────────────────────────────────

  it("calls onActivate handler on click", () => {
    const handler = jasmine.createSpy();
    host.onActivate = handler;
    host.payload = "data";
    fixture.detectChanges();

    buttonEl.click();
    expect(handler).toHaveBeenCalledWith("data");
  });

  it("triggers activationService when activationId is set", () => {
    host.activationId = "global-action";
    host.payload = "p";
    fixture.detectChanges();

    buttonEl.click();
    expect(activationService.trigger).toHaveBeenCalledWith("global-action", "p");
  });

  it("prefers onActivate over activationId", () => {
    const handler = jasmine.createSpy();
    host.onActivate = handler;
    host.activationId = "global";
    fixture.detectChanges();

    buttonEl.click();
    expect(handler).toHaveBeenCalled();
    expect(activationService.trigger).not.toHaveBeenCalled();
  });

  it("does not call handler when disabled", () => {
    const handler = jasmine.createSpy();
    host.onActivate = handler;
    host.disabled = true;
    fixture.detectChanges();

    buttonEl.click();
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not call handler when loading", () => {
    const handler = jasmine.createSpy();
    host.onActivate = handler;
    host.loading = true;
    fixture.detectChanges();

    buttonEl.click();
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls preventDefault when disabled", () => {
    host.disabled = true;
    fixture.detectChanges();

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    spyOn(event, "preventDefault");
    buttonEl.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("does not call preventDefault when no handler is configured (native behavior passes through)", () => {
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    spyOn(event, "preventDefault");
    buttonEl.dispatchEvent(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("passes undefined payload when not set", () => {
    const handler = jasmine.createSpy();
    host.onActivate = handler;
    fixture.detectChanges();

    buttonEl.click();
    expect(handler).toHaveBeenCalledWith(undefined);
  });

  // ── Loading state ─────────────────────────────────────────────────────────────

  it("shows loadingText when loading=true", () => {
    host.loading = true;
    host.loadingText = "Saving...";
    fixture.detectChanges();

    const span = fixture.debugElement.query(
      By.css(".interop-button__loading-text"),
    );
    expect(span.nativeElement.textContent.trim()).toBe("Saving...");
  });

  it("shows projected content when not loading", () => {
    fixture.detectChanges();
    expect(buttonEl.textContent?.trim()).toContain("Test Button Content");
  });

  it("hides projected content when loading", () => {
    host.loading = true;
    fixture.detectChanges();

    const span = fixture.debugElement.query(
      By.css(".interop-button__loading-text"),
    );
    expect(span).toBeTruthy();
  });
});
