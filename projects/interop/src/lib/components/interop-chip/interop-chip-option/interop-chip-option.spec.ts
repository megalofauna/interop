import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { InteropChipFilter } from "../interop-chip-filter/interop-chip-filter";
import { InteropChipOption } from "./interop-chip-option";

@Component({
	standalone: true,
	imports: [InteropChipFilter, InteropChipOption],
	template: `
		<fieldset interop-chip-filter label="Category"
			[value]="selected()"
			(valueChange)="selected.set($event)">
			<label interop-chip-option value="a">Alpha</label>
			<label interop-chip-option value="b">Beta</label>
			<label interop-chip-option value="c" [disabled]="true">Gamma</label>
		</fieldset>
	`,
})
class TestHost {
	selected = signal<string[]>([]);
}

describe("InteropChipOption", () => {
	let fixture: ComponentFixture<TestHost>;
	let host: TestHost;
	let labels: HTMLLabelElement[];
	let checkboxes: HTMLInputElement[];

	beforeEach(async () => {
		await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
		fixture = TestBed.createComponent(TestHost);
		host = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();

		labels = Array.from(fixture.nativeElement.querySelectorAll("label[interop-chip-option]"));
		checkboxes = Array.from(fixture.nativeElement.querySelectorAll("input[type='checkbox']"));
	});

	describe("Host element", () => {
		it("should be a native <label>", () => {
			labels.forEach((l) => expect(l.tagName).toBe("LABEL"));
		});

		it("should have for= matching the input id", () => {
			labels.forEach((label) => {
				const input = label.querySelector("input");
				expect(label.htmlFor).toBe(input?.id ?? "");
			});
		});

		it("should project label text as chip content", () => {
			expect(labels[0].textContent?.trim()).toBe("Alpha");
			expect(labels[1].textContent?.trim()).toBe("Beta");
		});
	});

	describe("Checkbox input", () => {
		it("should render a hidden <input type='checkbox'>", () => {
			checkboxes.forEach((cb) => expect(cb.type).toBe("checkbox"));
		});

		it("should not be checked when not in selected array", () => {
			expect(checkboxes[0].checked).toBeFalse();
		});

		it("should be checked when value is in selected array", async () => {
			host.selected.set(["a"]);
			fixture.detectChanges();
			await fixture.whenStable();
			expect(checkboxes[0].checked).toBeTrue();
			expect(checkboxes[1].checked).toBeFalse();
		});
	});

	describe("data attributes", () => {
		it("should not have data-checked when unselected", () => {
			expect(labels[0].hasAttribute("data-checked")).toBeFalse();
		});

		it("should have data-checked when selected", async () => {
			host.selected.set(["b"]);
			fixture.detectChanges();
			await fixture.whenStable();
			expect(labels[1].hasAttribute("data-checked")).toBeTrue();
		});

		it("should have data-disabled on the disabled option", () => {
			expect(labels[2].hasAttribute("data-disabled")).toBeTrue();
		});
	});

	describe("Interaction", () => {
		it("should update selection when checkbox is clicked", async () => {
			checkboxes[0].click();
			fixture.detectChanges();
			await fixture.whenStable();
			expect(host.selected()).toEqual(["a"]);
		});

		it("should deselect when a checked option is clicked again", async () => {
			host.selected.set(["a"]);
			fixture.detectChanges();
			await fixture.whenStable();

			checkboxes[0].click();
			fixture.detectChanges();
			await fixture.whenStable();

			expect(host.selected()).toEqual([]);
		});

		it("should not update selection when disabled option is clicked", async () => {
			checkboxes[2].click();
			fixture.detectChanges();
			await fixture.whenStable();
			expect(host.selected()).toEqual([]);
		});
	});
});
