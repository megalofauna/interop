import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InteropSlider } from "./interop-slider";
import { InteropSliderLegend } from "./interop-slider-legend";
import { InteropSliderMarks } from "./interop-slider-marks";
import { InteropSliderRegistry } from "./interop-slider-registry";
import type { SliderMark } from "./interop-slider-marks";

/*
 * The marks directive's `resolved` computed is the ONE normalisation in this
 * component: the tick gradients, the legend's label positions and the
 * endpoints formula all read it, so a mark's fraction of the domain being
 * wrong is wrong in three places at once. It is also pure — value in, value
 * out — which is exactly the kind of thing that should not need a browser to
 * check.
 *
 * What this does NOT cover, deliberately: where the browser actually PAINTS
 * the tick. That is `--_mark-size` in the stylesheet, and asserting it here
 * would only re-state the CSS.
 */

@Component({
	standalone: true,
	imports: [InteropSlider, InteropSliderMarks, InteropSliderLegend],
	template: `
		<input
			type="range"
			interop-slider
			id="probe"
			[min]="min()"
			[max]="max()"
			[interop-slider-marks]="marks()"
		/>
		<interop-slider-legend for="probe" />
	`,
})
class TestHost {
	min = signal(0);
	max = signal(100);
	marks = signal<SliderMark[]>([]);
	readonly directive = viewChild.required(InteropSliderMarks);
	readonly legend = viewChild.required(InteropSliderLegend);
}

describe("InteropSliderMarks — resolved marks", () => {
	let fixture: ComponentFixture<TestHost>;
	let host: TestHost;

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [TestHost] });
		fixture = TestBed.createComponent(TestHost);
		host = fixture.componentInstance;
		fixture.detectChanges();
	});

	const resolved = () => host.directive().resolved();

	it("maps a value onto its fraction of [min, max]", () => {
		host.marks.set([0, 25, 50, 75, 100]);
		fixture.detectChanges();
		expect(resolved().map((m) => m.p)).toEqual([0, 0.25, 0.5, 0.75, 1]);
	});

	it("re-maps when the domain moves, not just when the marks do", () => {
		host.marks.set([0, 50, 100]);
		host.min.set(-100);
		fixture.detectChanges();
		expect(resolved().map((m) => m.p)).toEqual([0.5, 0.75, 1]);
	});

	it("keeps a label alongside its fraction", () => {
		host.marks.set([
			{ value: 0, label: "Low" },
			{ value: 100, label: "High" },
		]);
		fixture.detectChanges();
		expect(resolved()).toEqual([
			{ value: 0, label: "Low", p: 0 },
			{ value: 100, label: "High", p: 1 },
		]);
	});

	it("treats a bare number as a mark with no label", () => {
		host.marks.set([50]);
		fixture.detectChanges();
		expect(resolved()[0].label).toBe("");
	});

	it("drops marks outside the domain rather than clamping them", () => {
		host.marks.set([-10, 0, 50, 100, 110]);
		fixture.detectChanges();
		expect(resolved().map((m) => m.value)).toEqual([0, 50, 100]);
	});

	it("sorts unordered marks", () => {
		host.marks.set([100, 0, 50]);
		fixture.detectChanges();
		expect(resolved().map((m) => m.value)).toEqual([0, 50, 100]);
	});

	it("yields nothing for a zero-width domain instead of dividing by zero", () => {
		host.max.set(0);
		host.marks.set([0]);
		fixture.detectChanges();
		expect(resolved()).toEqual([]);
	});
});

describe("InteropSliderLegend", () => {
	let fixture: ComponentFixture<TestHost>;
	let host: TestHost;

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [TestHost] });
		fixture = TestBed.createComponent(TestHost);
		host = fixture.componentInstance;
		fixture.detectChanges();
	});

	const labels = (): HTMLElement[] =>
		Array.from(
			fixture.nativeElement.querySelectorAll(".itx-slider-legend__item"),
		);

	it("renders one label per LABELLED mark, and none for the rest", () => {
		host.marks.set([
			{ value: 0, label: "Low" },
			25,
			{ value: 50, label: "Mid" },
		]);
		fixture.detectChanges();
		expect(labels().map((n) => n.textContent?.trim())).toEqual(["Low", "Mid"]);
	});

	it("publishes each label's fraction as --_p, the value the CSS positions on", () => {
		host.marks.set([
			{ value: 0, label: "a" },
			{ value: 75, label: "b" },
		]);
		fixture.detectChanges();
		expect(labels().map((n) => n.style.getPropertyValue("--_p"))).toEqual([
			"0",
			"0.75",
		]);
	});

	it("is aria-hidden — it restates what the slider already announces", () => {
		const el = fixture.nativeElement.querySelector("interop-slider-legend");
		expect(el.getAttribute("aria-hidden")).toBe("true");
	});

	it("resolves its marks through the registry, by [for]", () => {
		const registry = TestBed.inject(InteropSliderRegistry);
		expect(registry.getMarks("probe")).not.toBeNull();
	});
});
