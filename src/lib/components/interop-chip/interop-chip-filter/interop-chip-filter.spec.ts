import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { InteropChipFilter } from "./interop-chip-filter";
import { InteropChipOption } from "../interop-chip-option/interop-chip-option";

@Component({
	standalone: true,
	imports: [InteropChipFilter, InteropChipOption],
	template: `
		<fieldset interop-chip-filter label="Size"
			[value]="selected()"
			(valueChange)="onValueChange($event)">
			<label interop-chip-option value="xs">XS</label>
			<label interop-chip-option value="sm">SM</label>
			<label interop-chip-option value="lg">LG</label>
			<label interop-chip-option value="xl" [disabled]="true">XL</label>
		</fieldset>
	`,
})
class TestHost {
	selected = signal<string[]>([]);
	onValueChange = jasmine.createSpy("onValueChange");
}

describe("InteropChipFilter", () => {
	let fixture: ComponentFixture<TestHost>;
	let host: TestHost;
	let fieldset: HTMLFieldSetElement;
	let checkboxes: HTMLInputElement[];
	let labels: HTMLLabelElement[];

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestHost],
		}).compileComponents();

		fixture = TestBed.createComponent(TestHost);
		host = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();

		fieldset = fixture.nativeElement.querySelector("fieldset");
		checkboxes = Array.from(
			fixture.nativeElement.querySelectorAll("input[type='checkbox']"),
		);
		labels = Array.from(
			fixture.nativeElement.querySelectorAll("label[interop-chip-option]"),
		);
	});

	describe("Semantics", () => {
		it("should render a native <fieldset> element", () => {
			expect(fieldset.tagName).toBe("FIELDSET");
		});

		it("should render a <legend> with the label text", () => {
			const legend = fieldset.querySelector("legend");
			expect(legend?.textContent?.trim()).toBe("Size");
		});

		it("should render native <input type='checkbox'> inside each option", () => {
			checkboxes.forEach((cb) => {
				expect(cb.type).toBe("checkbox");
			});
		});

		it("should associate each checkbox with its label via htmlFor / id", () => {
			labels.forEach((label) => {
				const id = label.querySelector("input")?.id;
				expect(id).toBeTruthy();
				expect(label.htmlFor).toBe(id as string);
			});
		});

		it("should have 4 checkboxes", () => {
			expect(checkboxes.length).toBe(4);
		});
	});

	describe("Initial state", () => {
		it("should have no checkboxes checked initially", () => {
			checkboxes.forEach((cb) => expect(cb.checked).toBeFalse());
		});
	});

	describe("Controlled mode", () => {
		it("should reflect externally set value as checked checkboxes", async () => {
			host.selected.set(["sm"]);
			fixture.detectChanges();
			await fixture.whenStable();

			expect(checkboxes[1].checked).toBeTrue();
			expect(checkboxes[0].checked).toBeFalse();
		});

		it("should reflect multiple selected values", async () => {
			host.selected.set(["xs", "lg"]);
			fixture.detectChanges();
			await fixture.whenStable();

			expect(checkboxes[0].checked).toBeTrue();
			expect(checkboxes[1].checked).toBeFalse();
			expect(checkboxes[2].checked).toBeTrue();
		});
	});

	describe("Interaction", () => {
		it("should emit valueChange when a chip is clicked", async () => {
			checkboxes[0].click();
			fixture.detectChanges();
			await fixture.whenStable();

			expect(host.onValueChange).toHaveBeenCalledWith(["xs"]);
		});

		it("should emit updated array when a second chip is clicked", async () => {
			checkboxes[0].click();
			fixture.detectChanges();
			checkboxes[1].click();
			fixture.detectChanges();
			await fixture.whenStable();

			expect(host.onValueChange).toHaveBeenCalledWith(["xs", "sm"]);
		});

		it("should remove value from array when a checked chip is clicked again", async () => {
			host.selected.set(["xs", "sm"]);
			fixture.detectChanges();
			await fixture.whenStable();

			checkboxes[0].click();
			fixture.detectChanges();
			await fixture.whenStable();

			expect(host.onValueChange).toHaveBeenCalledWith(["sm"]);
		});
	});

	describe("Disabled option", () => {
		it("should mark the disabled option's checkbox as disabled", () => {
			expect(checkboxes[3].disabled).toBeTrue();
		});

		it("should not emit valueChange when a disabled chip is clicked", () => {
			checkboxes[3].click();
			expect(host.onValueChange).not.toHaveBeenCalled();
		});
	});

	describe("Disabled group", () => {
		it("should set data-disabled on the fieldset when group is disabled", async () => {
			const disabledFixture = TestBed.createComponent(
				(() => {
					@Component({
						standalone: true,
						imports: [InteropChipFilter, InteropChipOption],
						template: `
							<fieldset interop-chip-filter label="Status" [disabled]="true">
								<label interop-chip-option value="a">A</label>
								<label interop-chip-option value="b">B</label>
							</fieldset>
						`,
					})
					class DisabledHost {}
					return DisabledHost;
				})(),
			);
			disabledFixture.detectChanges();
			await disabledFixture.whenStable();

			const fs = disabledFixture.nativeElement.querySelector("fieldset");
			expect(fs.hasAttribute("data-disabled")).toBeTrue();
		});
	});
});
