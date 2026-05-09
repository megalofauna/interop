import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { InteropSegmentedControl } from "../interop-segmented-control";
import { InteropSegment } from "./interop-segment";

@Component({
	standalone: true,
	imports: [InteropSegmentedControl, InteropSegment],
	template: `
		<fieldset interop-segmented-control label="Density">
			<button interop-segment value="compact">Compact</button>
			<button interop-segment value="comfortable">Comfortable</button>
			<button interop-segment value="spacious" [disabled]="true">Spacious</button>
		</fieldset>
	`,
})
class TestHostComponent {}

describe("InteropSegment", () => {
	let fixture: ComponentFixture<TestHostComponent>;
	let buttons: HTMLButtonElement[];

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestHostComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(TestHostComponent);
		fixture.detectChanges();
		await fixture.whenStable();

		buttons = Array.from(
			fixture.nativeElement.querySelectorAll("button[interop-segment]"),
		);
	});

	describe("Host element", () => {
		it("should be a native <button> (no wrapper element)", () => {
			buttons.forEach((btn) => expect(btn.tagName).toBe("BUTTON"));
		});

		it("should have type=button set by the component", () => {
			buttons.forEach((btn) => expect(btn.getAttribute("type")).toBe("button"));
		});

		it("should project label text as button content", () => {
			expect(buttons[0].textContent?.trim()).toBe("Compact");
			expect(buttons[1].textContent?.trim()).toBe("Comfortable");
		});
	});

	describe("aria-pressed", () => {
		it("should have aria-pressed=false when not selected", () => {
			expect(buttons[0].getAttribute("aria-pressed")).toBe("false");
		});

		it("should have aria-pressed=true when selected", async () => {
			buttons[0].click();
			fixture.detectChanges();
			await fixture.whenStable();

			expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
		});

		it("should clear aria-pressed on previously selected segment when a new one is clicked", async () => {
			buttons[0].click();
			fixture.detectChanges();
			await fixture.whenStable();

			buttons[1].click();
			fixture.detectChanges();
			await fixture.whenStable();

			expect(buttons[0].getAttribute("aria-pressed")).toBe("false");
			expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
		});
	});

	describe("Disabled segment", () => {
		it("should have data-disabled attribute", () => {
			expect(buttons[2].hasAttribute("data-disabled")).toBe(true);
		});

		it("should NOT become selected when clicked", async () => {
			buttons[2].click();
			fixture.detectChanges();
			await fixture.whenStable();

			expect(buttons[2].getAttribute("aria-pressed")).toBe("false");
		});
	});

	describe("data-selected", () => {
		it("should set data-selected when active (for CSS anchor-name hook)", async () => {
			buttons[0].click();
			fixture.detectChanges();
			await fixture.whenStable();

			expect(buttons[0].hasAttribute("data-selected")).toBe(true);
			expect(buttons[1].hasAttribute("data-selected")).toBe(false);
		});
	});
});
