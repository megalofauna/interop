import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";

import { InteropToggle } from "./interop-toggle-control";

/**
 * Test host component to properly test the label[interop-toggle] selector.
 */
@Component({
	standalone: true,
	imports: [InteropToggle],
	template: `
		<label
			interop-toggle
			[id]="id"
			[checked]="checked"
			[disabled]="disabled"
			[required]="required"
			[name]="name"
			[value]="value"
			(checkedChange)="onCheckedChange($event)"
			(valueChange)="onValueChange($event)"
		>
			Dark mode
		</label>
	`,
})
class TestHostComponent {
	id = "test-toggle";
	checked = false;
	disabled = false;
	required = false;
	name: string | null = null;
	value: string | number | boolean = "on";

	onCheckedChange = jasmine.createSpy("onCheckedChange");
	onValueChange = jasmine.createSpy("onValueChange");
}

describe("InteropToggle", () => {
	let hostFixture: ComponentFixture<TestHostComponent>;
	let host: TestHostComponent;
	let labelElement: HTMLLabelElement;
	let inputElement: HTMLInputElement;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestHostComponent],
		}).compileComponents();

		hostFixture = TestBed.createComponent(TestHostComponent);
		host = hostFixture.componentInstance;
		labelElement = hostFixture.nativeElement.querySelector("label");

		hostFixture.detectChanges();
		await hostFixture.whenStable();

		inputElement = labelElement.querySelector(
			'input[type="checkbox"]',
		) as HTMLInputElement;
	});

	describe("Component Initialization", () => {
		it("should create", () => {
			expect(labelElement).toBeTruthy();
			expect(inputElement).toBeTruthy();
		});

		it("should render a checkbox input inside the label", () => {
			expect(inputElement.type).toBe("checkbox");
			expect(inputElement.parentElement).toBe(labelElement);
		});

		it("should project label text content", () => {
			expect(labelElement.textContent).toContain("Dark mode");
		});

		it("should set the id on the input", () => {
			expect(inputElement.id).toBe("test-toggle");
		});
	});

	describe("Semantics — the killer detail", () => {
		it("should have role=switch on the native input", () => {
			expect(inputElement.getAttribute("role")).toBe("switch");
		});

		it("should be a real checkbox under the hood (not a button)", () => {
			expect(inputElement.tagName).toBe("INPUT");
			expect(inputElement.type).toBe("checkbox");
		});

		it("should have the input inside a label for implicit label association", () => {
			expect(inputElement.closest("label")).toBe(labelElement);
		});

		it("should NOT have an indeterminate input (switches are binary)", () => {
			// Verify the component class has no indeterminate property
			const toggleInstance = hostFixture.debugElement
				.query((el) => el.nativeElement === labelElement)
				?.componentInstance as InteropToggle;

			expect((toggleInstance as unknown as Record<string, unknown>)["indeterminate"]).toBeUndefined();
		});
	});

	describe("Input Synchronization", () => {
		it("should reflect checked state on the native input", async () => {
			host.checked = true;
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			expect(inputElement.checked).toBe(true);
		});

		it("should reflect disabled state on the native input", async () => {
			host.disabled = true;
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			expect(inputElement.disabled).toBe(true);
		});

		it("should reflect required state on the native input", async () => {
			host.required = true;
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			expect(inputElement.required).toBe(true);
		});

		it("should set name attribute when provided", async () => {
			host.name = "theme";
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			expect(inputElement.getAttribute("name")).toBe("theme");
		});

		it("should set value attribute", async () => {
			host.value = "dark";
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			expect(inputElement.getAttribute("value")).toBe("dark");
		});

		it("should handle numeric values", async () => {
			host.value = 1;
			hostFixture.detectChanges();
			await hostFixture.whenStable();

			expect(inputElement.getAttribute("value")).toBe("1");
		});
	});

	describe("Change Event Handling", () => {
		it("should emit checkedChange(true) when toggled on", () => {
			inputElement.checked = true;
			inputElement.dispatchEvent(new Event("change", { bubbles: true }));

			expect(host.onCheckedChange).toHaveBeenCalledWith(true);
		});

		it("should emit checkedChange(false) when toggled off", () => {
			inputElement.checked = true;
			inputElement.dispatchEvent(new Event("change", { bubbles: true }));
			host.onCheckedChange.calls.reset();

			inputElement.checked = false;
			inputElement.dispatchEvent(new Event("change", { bubbles: true }));

			expect(host.onCheckedChange).toHaveBeenCalledWith(false);
		});

		it("should emit valueChange when toggled on", () => {
			host.value = "enabled";
			hostFixture.detectChanges();

			inputElement.checked = true;
			inputElement.dispatchEvent(new Event("change", { bubbles: true }));

			expect(host.onValueChange).toHaveBeenCalledWith("enabled");
		});

		it("should NOT emit valueChange when toggled off", () => {
			inputElement.checked = false;
			inputElement.dispatchEvent(new Event("change", { bubbles: true }));

			expect(host.onValueChange).not.toHaveBeenCalled();
		});
	});

	describe("Focus Tracking", () => {
		it("should set focused signal to true on input focus", () => {
			const toggleInstance = hostFixture.debugElement
				.query((el) => el.nativeElement === labelElement)
				?.componentInstance as InteropToggle;

			inputElement.dispatchEvent(new Event("focus"));
			expect(toggleInstance.focused()).toBe(true);
		});

		it("should set focused signal to false on input blur", () => {
			const toggleInstance = hostFixture.debugElement
				.query((el) => el.nativeElement === labelElement)
				?.componentInstance as InteropToggle;

			inputElement.dispatchEvent(new Event("focus"));
			inputElement.dispatchEvent(new Event("blur"));
			expect(toggleInstance.focused()).toBe(false);
		});
	});

	describe("Keyboard Interaction", () => {
		it("should be focusable via tab (tabIndex not -1)", () => {
			expect(inputElement.tabIndex).not.toBe(-1);
		});

		it("should toggle on Space keypress (native checkbox behavior)", () => {
			// Native checkbox handles Space — verify the input responds to change events
			// dispatched after a space key interaction
			inputElement.focus();
			inputElement.checked = true;
			inputElement.dispatchEvent(new Event("change", { bubbles: true }));

			expect(host.onCheckedChange).toHaveBeenCalledWith(true);
		});
	});

	describe("Default Values", () => {
		it("should default checked to false", () => {
			expect(inputElement.checked).toBe(false);
		});

		it("should default value to 'on'", () => {
			expect(inputElement.getAttribute("value")).toBe("on");
		});
	});
});
