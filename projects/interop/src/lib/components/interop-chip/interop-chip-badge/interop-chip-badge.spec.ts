import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { InteropChipBadge } from "./interop-chip-badge";

@Component({
	standalone: true,
	imports: [InteropChipBadge],
	template: `
		<p>Build: <span interop-chip-badge>v0.1.0</span></p>
		<output interop-chip-badge>online</output>
	`,
})
class TestHost {}

describe("InteropChipBadge", () => {
	let fixture: ComponentFixture<TestHost>;
	let span: HTMLSpanElement;
	let output: HTMLOutputElement;

	beforeEach(async () => {
		await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
		fixture = TestBed.createComponent(TestHost);
		fixture.detectChanges();
		await fixture.whenStable();
		span = fixture.nativeElement.querySelector("span[interop-chip-badge]");
		output = fixture.nativeElement.querySelector("output[interop-chip-badge]");
	});

	it("should attach to a <span> host", () => {
		expect(span.tagName).toBe("SPAN");
		expect(span.textContent).toBe("v0.1.0");
	});

	it("should attach to a non-span host (selector is tag-agnostic)", () => {
		expect(output.tagName).toBe("OUTPUT");
	});

	it("should not render any extra DOM children — host is the chip", () => {
		expect(span.children.length).toBe(0);
	});
});
