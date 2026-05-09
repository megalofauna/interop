import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { InteropChipList } from "./interop-chip-list";
import { InteropChipItem } from "../interop-chip-item/interop-chip-item";

@Component({
	standalone: true,
	imports: [InteropChipList, InteropChipItem],
	template: `
		<ul interop-chip-list aria-label="Post tags">
			<li interop-chip-item label="Angular">Angular</li>
			<li interop-chip-item label="CSS">CSS</li>
			<li interop-chip-item label="A11y" [removable]="true" (removed)="onRemove('a11y')">A11y</li>
		</ul>
	`,
})
class TestHost {
	onRemove = jasmine.createSpy("onRemove");
}

describe("InteropChipList", () => {
	let fixture: ComponentFixture<TestHost>;
	let ul: HTMLUListElement;

	beforeEach(async () => {
		await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
		fixture = TestBed.createComponent(TestHost);
		fixture.detectChanges();
		await fixture.whenStable();
		ul = fixture.nativeElement.querySelector("ul[interop-chip-list]");
	});

	it("should render a native <ul> element", () => {
		expect(ul.tagName).toBe("UL");
	});

	it("should have role='list' to maintain AT semantics when list-style is removed", () => {
		expect(ul.getAttribute("role")).toBe("list");
	});

	it("should render 3 chip items", () => {
		const items = ul.querySelectorAll("li[interop-chip-item]");
		expect(items.length).toBe(3);
	});
});
