import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { InteropChipItem } from "./interop-chip-item";

@Component({
	standalone: true,
	imports: [InteropChipItem],
	template: `
		<ul>
			<li interop-chip-item label="Angular">Angular</li>
			<li interop-chip-item label="CSS" [removable]="true" (removed)="onRemove('css')">CSS</li>
			<li interop-chip-item label="A11y" [removable]="true" [disabled]="true" (removed)="onRemove('a11y')">A11y</li>
		</ul>
	`,
})
class TestHost {
	onRemove = jasmine.createSpy("onRemove");
}

describe("InteropChipItem", () => {
	let fixture: ComponentFixture<TestHost>;
	let host: TestHost;
	let items: HTMLLIElement[];

	beforeEach(async () => {
		await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
		fixture = TestBed.createComponent(TestHost);
		host = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
		items = Array.from(fixture.nativeElement.querySelectorAll("li[interop-chip-item]"));
	});

	describe("Host element", () => {
		it("should be a native <li> element", () => {
			items.forEach((item) => expect(item.tagName).toBe("LI"));
		});

		it("should project chip text content", () => {
			expect(items[0].textContent?.trim()).toBe("Angular");
		});
	});

	describe("Non-removable chip", () => {
		it("should not render a remove button", () => {
			const btn = items[0].querySelector("button");
			expect(btn).toBeNull();
		});

		it("should not have data-removable attribute", () => {
			expect(items[0].hasAttribute("data-removable")).toBeFalse();
		});
	});

	describe("Removable chip", () => {
		it("should render a remove button", () => {
			const btn = items[1].querySelector("button");
			expect(btn).toBeTruthy();
		});

		it("should have aria-label='Remove [label]' on the remove button", () => {
			const btn = items[1].querySelector("button");
			expect(btn?.getAttribute("aria-label")).toBe("Remove CSS");
		});

		it("should have type='button' on the remove button", () => {
			const btn = items[1].querySelector("button");
			expect(btn?.type).toBe("button");
		});

		it("should have data-removable attribute", () => {
			expect(items[1].hasAttribute("data-removable")).toBeTrue();
		});

		it("should emit (removed) when the remove button is clicked", () => {
			const btn = items[1].querySelector("button") as HTMLButtonElement;
			btn.click();
			expect(host.onRemove).toHaveBeenCalledWith("css");
		});
	});

	describe("Disabled removable chip", () => {
		it("should have data-disabled attribute", () => {
			expect(items[2].hasAttribute("data-disabled")).toBeTrue();
		});

		it("should not emit (removed) when disabled chip's button is clicked", () => {
			const btn = items[2].querySelector("button") as HTMLButtonElement;
			btn.click();
			expect(host.onRemove).not.toHaveBeenCalledWith("a11y");
		});
	});
});
