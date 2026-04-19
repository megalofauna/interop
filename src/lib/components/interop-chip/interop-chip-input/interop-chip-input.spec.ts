import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { InteropChipInput, ChipInputItem } from "./interop-chip-input";

@Component({
	standalone: true,
	imports: [InteropChipInput],
	template: `
		<div interop-chip-input
			aria-label="Tags"
			[value]="chips()"
			[placeholder]="'Add a tag…'"
			(valueChange)="onValueChange($event)">
		</div>
	`,
})
class TestHost {
	chips = signal<ChipInputItem[]>([]);
	onValueChange = jasmine.createSpy("onValueChange");
}

describe("InteropChipInput", () => {
	let fixture: ComponentFixture<TestHost>;
	let host: TestHost;
	let container: HTMLDivElement;
	let textInput: HTMLInputElement;

	beforeEach(async () => {
		await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
		fixture = TestBed.createComponent(TestHost);
		host = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();

		container = fixture.nativeElement.querySelector("div[interop-chip-input]");
		textInput = container.querySelector("input[type='text']") as HTMLInputElement;
	});

	describe("Initial state", () => {
		it("should render a native <div> container", () => {
			expect(container.tagName).toBe("DIV");
		});

		it("should render a text input", () => {
			expect(textInput).toBeTruthy();
		});

		it("should show placeholder text", () => {
			expect(textInput.placeholder).toBe("Add a tag…");
		});

		it("should render no chips initially", () => {
			const chips = container.querySelectorAll(".itx-chip");
			expect(chips.length).toBe(0);
		});
	});

	describe("Chip creation — Enter key", () => {
		it("should create a chip when Enter is pressed with text", async () => {
			textInput.value = "angular";
			textInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
			fixture.detectChanges();
			await fixture.whenStable();

			const chips = container.querySelectorAll(".itx-chip");
			expect(chips.length).toBe(1);
			expect(chips[0].querySelector(".itx-chip-label")?.textContent?.trim()).toBe("angular");
		});

		it("should clear the input after chip creation", async () => {
			textInput.value = "angular";
			textInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
			fixture.detectChanges();
			await fixture.whenStable();

			expect(textInput.value).toBe("");
		});

		it("should emit valueChange with the new chip", async () => {
			textInput.value = "css";
			textInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
			fixture.detectChanges();
			await fixture.whenStable();

			expect(host.onValueChange).toHaveBeenCalledWith([{ label: "css", value: "css" }]);
		});

		it("should not create a chip for whitespace-only input", async () => {
			textInput.value = "   ";
			textInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
			fixture.detectChanges();
			await fixture.whenStable();

			expect(container.querySelectorAll(".itx-chip").length).toBe(0);
		});
	});

	describe("Chip creation — comma separator", () => {
		it("should create a chip when comma is pressed", async () => {
			textInput.value = "typescript";
			textInput.dispatchEvent(new KeyboardEvent("keydown", { key: ",", bubbles: true }));
			fixture.detectChanges();
			await fixture.whenStable();

			expect(container.querySelectorAll(".itx-chip").length).toBe(1);
		});
	});

	describe("Chip removal", () => {
		beforeEach(async () => {
			textInput.value = "one";
			textInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
			textInput.value = "two";
			textInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
			fixture.detectChanges();
			await fixture.whenStable();
		});

		it("should remove a chip when its remove button is clicked", async () => {
			const removeBtns = container.querySelectorAll<HTMLButtonElement>(".itx-chip-remove");
			removeBtns[0].click();
			fixture.detectChanges();
			await fixture.whenStable();

			const chips = container.querySelectorAll(".itx-chip");
			expect(chips.length).toBe(1);
			expect(chips[0].querySelector(".itx-chip-label")?.textContent?.trim()).toBe("two");
		});

		it("should emit valueChange after chip removal", async () => {
			host.onValueChange.calls.reset();
			const removeBtns = container.querySelectorAll<HTMLButtonElement>(".itx-chip-remove");
			removeBtns[1].click();
			fixture.detectChanges();
			await fixture.whenStable();

			expect(host.onValueChange).toHaveBeenCalledWith([{ label: "one", value: "one" }]);
		});
	});

	describe("Backspace state machine", () => {
		it("should NOT delete a chip on Backspace when the input has text", async () => {
			textInput.value = "hello";
			textInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
			fixture.detectChanges();

			// Now type in input and press Backspace
			textInput.value = "wo";
			textInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }));
			fixture.detectChanges();
			await fixture.whenStable();

			// Chip should still be there — Backspace only deleted input text
			expect(container.querySelectorAll(".itx-chip").length).toBe(1);
		});
	});

	describe("Controlled mode", () => {
		it("should reflect externally provided chips", async () => {
			host.chips.set([{ label: "Angular", value: "angular" }, { label: "CSS", value: "css" }]);
			fixture.detectChanges();
			await fixture.whenStable();

			const chips = container.querySelectorAll(".itx-chip");
			expect(chips.length).toBe(2);
		});
	});

	describe("Remove button accessibility", () => {
		it("should have aria-label='Remove [label]' on each remove button", async () => {
			textInput.value = "Angular";
			textInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
			fixture.detectChanges();
			await fixture.whenStable();

			const btn = container.querySelector<HTMLButtonElement>(".itx-chip-remove");
			expect(btn?.getAttribute("aria-label")).toBe("Remove Angular");
		});

		it("should have type='button' on remove buttons", async () => {
			textInput.value = "Angular";
			textInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
			fixture.detectChanges();
			await fixture.whenStable();

			const btn = container.querySelector<HTMLButtonElement>(".itx-chip-remove");
			expect(btn?.type).toBe("button");
		});
	});

	describe("Disabled state", () => {
		it("should set data-disabled when disabled", async () => {
			const disabledFixture = TestBed.createComponent(
				(() => {
					@Component({
						standalone: true,
						imports: [InteropChipInput],
						template: `<div interop-chip-input aria-label="Tags" [disabled]="true"></div>`,
					})
					class DisabledHost {}
					return DisabledHost;
				})(),
			);
			disabledFixture.detectChanges();
			await disabledFixture.whenStable();

			const el = disabledFixture.nativeElement.querySelector("div[interop-chip-input]");
			expect(el.hasAttribute("data-disabled")).toBeTrue();
		});
	});
});
