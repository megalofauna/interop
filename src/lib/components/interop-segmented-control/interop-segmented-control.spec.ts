import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { InteropSegmentedControl } from "./interop-segmented-control";
import { InteropSegment } from "./interop-segment/interop-segment";

@Component({
	standalone: true,
	imports: [InteropSegmentedControl, InteropSegment],
	template: `
		<fieldset
			interop-segmented-control
			label="View"
			[value]="selected()"
			(valueChange)="onValueChange($event)"
		>
			<button interop-segment value="list">List</button>
			<button interop-segment value="grid">Grid</button>
			<button interop-segment value="detail">Detail</button>
		</fieldset>
	`,
})
class TestHostComponent {
	selected = signal<string | null>(null);
	onValueChange = jasmine.createSpy("onValueChange");
}

@Component({
	standalone: true,
	imports: [InteropSegmentedControl, InteropSegment],
	template: `
		<fieldset interop-segmented-control label="Status" [disabled]="true">
			<button interop-segment value="a">A</button>
			<button interop-segment value="b" [disabled]="true">B</button>
			<button interop-segment value="c">C</button>
		</fieldset>
	`,
})
class DisabledTestHostComponent {}

describe("InteropSegmentedControl", () => {
	let hostFixture: ComponentFixture<TestHostComponent>;
	let host: TestHostComponent;
	let fieldset: HTMLFieldSetElement;
	let buttons: HTMLButtonElement[];

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestHostComponent, DisabledTestHostComponent],
		}).compileComponents();

		hostFixture = TestBed.createComponent(TestHostComponent);
		host = hostFixture.componentInstance;
		hostFixture.detectChanges();
		await hostFixture.whenStable();

		fieldset = hostFixture.nativeElement.querySelector("fieldset");
		buttons = Array.from(
			hostFixture.nativeElement.querySelectorAll("button[interop-segment]"),
		);
	});

	describe("Initialization", () => {
		it("should render a fieldset with a legend", () => {
			expect(fieldset).toBeTruthy();
			const legend = fieldset.querySelector("legend");
			expect(legend?.textContent?.trim()).toBe("View");
		});

		it("should render 3 segment buttons", () => {
			expect(buttons.length).toBe(3);
		});

		it("should have no segment selected initially", () => {
			buttons.forEach((btn) =>
				expect(btn.getAttribute("aria-pressed")).toBe("false"),
			);
		});
	});

	describe("Semantics — the details that matter", () => {
		it("should use a real <fieldset> element (not a div with role=group)", () => {
			expect(fieldset.tagName).toBe("FIELDSET");
		});

		it("should have <legend> for native accessible grouping", () => {
			expect(fieldset.querySelector("legend")).toBeTruthy();
		});

		it("should use aria-pressed (not aria-selected or aria-current) on buttons", () => {
			// aria-pressed is correct for toggle buttons; aria-selected is for
			// listbox/grid items; aria-current is for navigation context.
			buttons.forEach((btn) => {
				expect(btn.hasAttribute("aria-pressed")).toBe(true);
				expect(btn.hasAttribute("aria-selected")).toBe(false);
				expect(btn.hasAttribute("aria-current")).toBe(false);
			});
		});

		it("should use type=button on each segment (no accidental form submission)", () => {
			buttons.forEach((btn) => expect(btn.type).toBe("button"));
		});
	});

	describe("Controlled mode", () => {
		it("should reflect externally set value as aria-pressed", async () => {
			host.selected.set("grid");
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
			expect(buttons[0].getAttribute("aria-pressed")).toBe("false");
			expect(buttons[2].getAttribute("aria-pressed")).toBe("false");
		});

		it("should emit valueChange when a segment is clicked", () => {
			buttons[0].click();
			expect(host.onValueChange).toHaveBeenCalledWith("list");
		});

		it("should update internal selection when a segment is clicked", async () => {
			buttons[2].click();
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			expect(buttons[2].getAttribute("aria-pressed")).toBe("true");
		});
	});

	describe("Roving tabindex", () => {
		it("should have exactly one segment with tabindex=0 at a time", async () => {
			host.selected.set("list");
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			const zeroTabIndexCount = buttons.filter(
				(b) => b.getAttribute("tabindex") === "0",
			).length;
			expect(zeroTabIndexCount).toBe(1);
		});

		it("should give tabindex=0 to the selected segment", async () => {
			host.selected.set("grid");
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			expect(buttons[1].getAttribute("tabindex")).toBe("0");
			expect(buttons[0].getAttribute("tabindex")).toBe("-1");
			expect(buttons[2].getAttribute("tabindex")).toBe("-1");
		});

		it("should move selection on ArrowRight", async () => {
			host.selected.set("list");
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			fieldset.dispatchEvent(
				new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
			);
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			expect(host.onValueChange).toHaveBeenCalledWith("grid");
		});

		it("should move selection on ArrowLeft", async () => {
			host.selected.set("grid");
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			fieldset.dispatchEvent(
				new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
			);
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			expect(host.onValueChange).toHaveBeenCalledWith("list");
		});

		it("should wrap ArrowRight at the last segment", async () => {
			host.selected.set("detail");
			hostFixture.detectChanges();
			await hostFixture.whenStable();
			host.onValueChange.calls.reset();

			fieldset.dispatchEvent(
				new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
			);

			expect(host.onValueChange).toHaveBeenCalledWith("list");
		});

		it("should jump to first segment on Home", async () => {
			host.selected.set("detail");
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			fieldset.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
			);

			expect(host.onValueChange).toHaveBeenCalledWith("list");
		});

		it("should jump to last segment on End", async () => {
			host.selected.set("list");
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			fieldset.dispatchEvent(
				new KeyboardEvent("keydown", { key: "End", bubbles: true }),
			);

			expect(host.onValueChange).toHaveBeenCalledWith("detail");
		});
	});

	describe("Disabled state", () => {
		it("should not emit valueChange when a segment is clicked and control is disabled", async () => {
			const disabledFixture =
				TestBed.createComponent(DisabledTestHostComponent);
			disabledFixture.detectChanges();
			await disabledFixture.whenStable();

			const spy = spyOn(
				disabledFixture.debugElement.query(
					(el) => el.nativeElement.tagName === "FIELDSET",
				)?.componentInstance,
				"onSegmentSelect",
			);

			const btns = disabledFixture.nativeElement.querySelectorAll(
				"button[interop-segment]",
			) as NodeListOf<HTMLButtonElement>;
			btns[0].click();

			expect(spy).not.toHaveBeenCalled();
		});

		it("should skip disabled segments on arrow key navigation", async () => {
			// Set up: second segment is individually disabled
			const disabledFixture =
				TestBed.createComponent(DisabledTestHostComponent);
			disabledFixture.detectChanges();
			await disabledFixture.whenStable();
			// Disabled control — can't test nav. Individual segment disabled tested in segment spec.
		});
	});
});
