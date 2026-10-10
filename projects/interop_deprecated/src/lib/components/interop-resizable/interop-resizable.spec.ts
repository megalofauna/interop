import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { InteropResizable } from "./interop-resizable";
import type {
	ResizableAspectRatio,
	ResizableAxis,
	ResizableBounds,
	ResizableDimensions,
} from "./interop-resizable.types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

@Component({
	standalone: true,
	imports: [InteropResizable],
	// The library stylesheet is not loaded in specs, so the border is inline —
	// without one, the content box and border box coincide and the measurement
	// bugs these tests cover cannot surface. `box-sizing` mirrors what
	// `styles/components/resizable.css` sets on the host.
	template: `
		<div
			style="border: 4px solid transparent; box-sizing: border-box"
			interop-resizable
			[axis]="axis()"
			[min]="min()"
			[max]="max()"
			[initialSize]="initialSize()"
			[aspectRatio]="aspectRatio()"
			[aspectLocked]="aspectLocked()"
			[breakpoints]="breakpoints()"
			[keyboard]="keyboard()"
			(resize)="resizes.push($event)"
			(resizeEnd)="resizeEnds.push($event)"
		></div>
	`,
})
class TestHost {
	axis = signal<ResizableAxis>("both");
	min = signal<ResizableBounds | null>(null);
	max = signal<ResizableBounds | null>(null);
	initialSize = signal<ResizableBounds | null>({ width: 450, height: 300 });
	aspectRatio = signal<ResizableAspectRatio | null>(null);
	aspectLocked = signal<boolean>(false);
	breakpoints = signal<number[] | null>(null);
	keyboard = signal<boolean>(true);

	resizes: ResizableDimensions[] = [];
	resizeEnds: ResizableDimensions[] = [];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const nextFrame = () =>
	new Promise<void>((r) => requestAnimationFrame(() => r()));

/** ResizeObserver delivers asynchronously; two frames is reliably enough. */
const settle = async () => {
	await nextFrame();
	await nextFrame();
};

describe("InteropResizable", () => {
	let fixture: ComponentFixture<TestHost>;
	let host: TestHost;

	const frame = (): HTMLElement =>
		fixture.nativeElement.querySelector("[interop-resizable]");

	const handle = (): HTMLElement =>
		fixture.nativeElement.querySelector(".interop-resizable__handle");

	const press = (key: string): void => {
		handle().dispatchEvent(
			new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
		);
	};

	/** Drags the handle by (dx, dy) from an arbitrary origin. `setPointerCapture`
	 * is stubbed — a synthetic pointerId has no active pointer to capture. */
	const drag = async (
		dx: number,
		dy: number,
		modifiers: { shiftKey?: boolean } = {},
	): Promise<void> => {
		const h = handle();
		// Plain stubs rather than spyOn: a synthetic pointerId has no active
		// pointer to capture, and the helper is called more than once per test.
		h.setPointerCapture = () => {};
		h.releasePointerCapture = () => {};
		const opts = { bubbles: true, pointerId: 1, ...modifiers };
		h.dispatchEvent(
			new PointerEvent("pointerdown", { ...opts, clientX: 0, clientY: 0 }),
		);
		h.dispatchEvent(
			new PointerEvent("pointermove", { ...opts, clientX: dx, clientY: dy }),
		);
		await nextFrame();
		h.dispatchEvent(
			new PointerEvent("pointerup", { ...opts, clientX: dx, clientY: dy }),
		);
	};

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestHost],
		}).compileComponents();
		fixture = TestBed.createComponent(TestHost);
		host = fixture.componentInstance;
		fixture.detectChanges();
		await settle();
	});

	// ── Bounds resolution ─────────────────────────────────────────────────────

	describe("bounds resolution", () => {
		it("clamps to min and max in the ordinary case", () => {
			host.min.set({ width: 200 });
			host.max.set({ width: 500 });
			fixture.detectChanges();

			press("End");
			expect(frame().style.width).toBe("500px");

			press("Home");
			expect(frame().style.width).toBe("200px");
		});

		// CSS 2.2 §10.4 applies max first and min last, so min wins a conflict —
		// confirmed rendering in Blink, WebKit and Gecko. The directive must agree,
		// or Tier 1 writes a width that Tier 0's CSS immediately overrides.
		it("resolves a min > max conflict in favour of min, as CSS does", () => {
			host.min.set({ width: 400 });
			host.max.set({ width: 300 });
			fixture.detectChanges();

			// Growing from 450 would previously clamp down to the max (300).
			press("ArrowRight");
			expect(frame().style.width).toBe("400px");
		});

		it("never reports aria-valuenow above aria-valuemax", () => {
			host.min.set({ width: 400 });
			host.max.set({ width: 300 });
			fixture.detectChanges();

			press("ArrowRight");

			const now = Number(handle().getAttribute("aria-valuenow"));
			const max = Number(handle().getAttribute("aria-valuemax"));
			const min = Number(handle().getAttribute("aria-valuemin"));
			expect(max).toBe(400);
			expect(now).toBeLessThanOrEqual(max);
			expect(now).toBeGreaterThanOrEqual(min);
		});
	});

	// ── Measurement ───────────────────────────────────────────────────────────

	describe("measurement", () => {
		it("reports the same box from (resize) and (resizeEnd)", async () => {
			host.resizes.length = 0;
			host.resizeEnds.length = 0;

			await drag(60, 40);
			await settle();

			const live = host.resizes.at(-1);
			const end = host.resizeEnds.at(-1);
			expect(live).toBeDefined();
			expect(end).toBeDefined();
			expect(live!.width).toBeCloseTo(end!.width, 1);
			expect(live!.height).toBeCloseTo(end!.height, 1);
		});

		// The drag loop measures the border box and writes the result back into
		// `width`/`height`. If those two ever refer to different boxes, every
		// drag inflates the frame by its own border — and it compounds, because
		// each drag re-measures the already-inflated box.
		it("does not grow the frame across zero-delta drags", async () => {
			const before = frame().getBoundingClientRect().width;

			await drag(0, 0);
			await drag(0, 0);
			await drag(0, 0);

			expect(frame().getBoundingClientRect().width).toBeCloseTo(before, 1);
		});
	});

	// ── Aspect ratio ──────────────────────────────────────────────────────────

	describe("aspect ratio", () => {
		it("coerces axis 'both' to a single driving axis", () => {
			host.aspectRatio.set("16/9");
			fixture.detectChanges();

			// `resize: both` writes both dimensions, and a box with two definite
			// sizes ignores its ratio outright.
			expect(frame().getAttribute("data-axis")).toBe("horizontal");
			expect(frame().style.aspectRatio).toBe("16 / 9");
			expect(frame().getAttribute("data-aspect-ratio")).toBe("");
		});

		it("honours an explicit vertical driving axis", () => {
			host.axis.set("vertical");
			host.aspectRatio.set("16/9");
			fixture.detectChanges();

			expect(frame().getAttribute("data-axis")).toBe("vertical");
		});

		it("treats a degenerate ratio as unset, matching CSS", () => {
			for (const bad of ["auto", "0", "16/0", "-16/9", "a/b", "1/2/3"]) {
				host.aspectRatio.set(bad);
				fixture.detectChanges();
				expect(frame().getAttribute("data-aspect-ratio"))
					.withContext(`aspectRatio="${bad}"`)
					.toBeNull();
			}
		});

		it("neutralises cross-axis bounds so CSS cannot clamp the ratio away", () => {
			host.aspectRatio.set("16/9");
			host.max.set({ height: 300 });
			fixture.detectChanges();

			// Cross-axis tokens are actively neutralised, not merely left unset:
			// resizable.css declares min/max-block-size from them unconditionally.
			const style = frame().style;
			expect(style.getPropertyValue("--itx-resizable-min-height")).toBe("0");
			expect(style.getPropertyValue("--itx-resizable-max-height")).toBe("none");
		});

		it("projects a cross-axis bound onto the driving axis as calc()", () => {
			host.aspectRatio.set("16/9");
			host.max.set({ height: 300 });
			fixture.detectChanges();

			// calc() rather than 533.33px: engines quantise layout differently, so
			// a number computed here would be a fraction wrong somewhere.
			expect(frame().style.getPropertyValue("--itx-resizable-max-width")).toBe(
				"calc(300px * 16 / 9)",
			);
		});

		it("lets an explicit bound beat one projected from the cross axis", () => {
			host.aspectRatio.set("16/9");
			host.min.set({ height: 400 }); // projects to 711.11 on the driving axis
			host.max.set({ width: 600 }); // explicit, and tighter
			fixture.detectChanges();

			const style = frame().style;
			expect(style.getPropertyValue("--itx-resizable-min-width")).toBe("600px");
			expect(style.getPropertyValue("--itx-resizable-max-width")).toBe("600px");
		});

		it("writes only the driving axis during a drag", async () => {
			host.aspectRatio.set("16/9");
			fixture.detectChanges();

			await drag(120, 90);

			// The cross axis must stay `auto` for the ratio to resolve it — and
			// the inline height seeded at mount must have been cleared.
			expect(frame().style.width).toBe("570px");
			expect(frame().style.height).toBe("");
		});

		it("ignores Shift during a drag", async () => {
			host.aspectRatio.set("16/9");
			fixture.detectChanges();

			await drag(120, 90, { shiftKey: true });

			expect(frame().style.width).toBe("570px");
			expect(frame().style.height).toBe("");
		});

		// Two definite sizes make the browser ignore the ratio outright, so a
		// stale inline size on the derived axis silently disables the feature.
		it("clears a cross-axis size left from before the ratio was set", () => {
			expect(frame().style.height).toBe("300px");

			host.aspectRatio.set("16/9");
			fixture.detectChanges();

			expect(frame().style.height).toBe("");
			expect(frame().style.width).toBe("450px");
		});

		it("does not activate Tier 1 on its own", () => {
			host.keyboard.set(false);
			host.aspectRatio.set("16/9");
			fixture.detectChanges();

			expect(frame().getAttribute("data-tier")).toBe("native");
			expect(handle()).toBeNull();
		});

		it("makes aspectLocked inert rather than letting it mount a handle", () => {
			host.keyboard.set(false);
			host.aspectLocked.set(true);
			host.aspectRatio.set("16/9");
			fixture.detectChanges();

			expect(frame().getAttribute("data-tier")).toBe("native");
			expect(frame().getAttribute("data-aspect-locked")).toBeNull();
		});
	});

	// ── Breakpoint snap ───────────────────────────────────────────────────────

	describe("breakpoint snap", () => {
		it("does not let a snap target punch through a bound", async () => {
			host.min.set({ width: 200 });
			host.max.set({ width: 500 });
			// Within the 12px snap window of the clamped max, but outside it.
			host.breakpoints.set([508]);
			fixture.detectChanges();

			await drag(400, 0);

			expect(frame().style.width).toBe("500px");
		});

		it("still snaps to an in-range breakpoint", async () => {
			host.min.set({ width: 200 });
			host.max.set({ width: 900 });
			host.breakpoints.set([460]);
			fixture.detectChanges();

			// 450 + 5 = 455, within 12px of 460.
			await drag(5, 0);

			expect(frame().style.width).toBe("460px");
		});
	});
});
