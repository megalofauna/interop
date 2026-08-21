import { DOCUMENT } from "@angular/common";
import {
	Directive,
	ElementRef,
	Injector,
	OnDestroy,
	OnInit,
	Renderer2,
	computed,
	effect,
	inject,
	input,
	output,
	isDevMode,
	signal,
} from "@angular/core";
import {
	type ResizableAspectRatio,
	type ResizableAxis,
	type ResizableBounds,
	type ResizableContainerType,
	type ResizableDimensions,
	type ResizableRatio,
} from "./interop-resizable.types";

/** One axis's resolved bounds: numbers for the JS clamp, CSS strings for the
 * tokens Tier 0 lays out from. */
interface Bound {
	lo?: number;
	hi?: number;
	loCss: string | null;
	hiCss: string | null;
}

const px = (v?: number): string | null => (v != null ? `${v}px` : null);

/**
 * Parses the accepted `aspect-ratio` forms into numerator/denominator terms.
 * Returns `null` for anything degenerate — zero, negative, non-finite, or
 * unparseable, including `auto` — matching CSS, where a degenerate ratio makes
 * the property behave as `auto`.
 */
function parseRatio(input: ResizableAspectRatio | null): ResizableRatio | null {
	if (input == null) return null;

	const ok = (w: number, h: number): ResizableRatio | null =>
		Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0
			? { w, h }
			: null;

	if (typeof input === "number") return ok(input, 1);

	const parts = input.split("/");
	if (parts.length > 2) return null;
	// `Number("")` is 0, which `ok` rejects — so a stray solidus fails cleanly.
	const w = Number(parts[0]!.trim());
	return parts.length === 1 ? ok(w, 1) : ok(w, Number(parts[1]!.trim()));
}

/**
 * InteropResizable — drag-to-resize wrapper with two performance tiers.
 *
 * ## Tiers
 *
 * The directive transparently picks one of two implementations based on
 * which inputs the consumer sets:
 *
 * **Tier 0 — native CSS resize (default).** Browser-native `resize: <axis>`
 * with `overflow: hidden` and a container-query container. Zero JS in the
 * resize loop. A single `ResizeObserver` fires `(resize)` outputs. Use when
 * you just need "drag the corner to see how my content reflows" — the most
 * performant option, smallest runtime cost.
 *
 * **Tier 1 — JS-enhanced.** Activates implicitly when any of the
 * enhancement inputs is set: `breakpoints`, `showDimensions`, `aspectLocked`,
 * `liveResize`, or `keyboard`. Replaces the native handle with a custom
 * BR-corner handle (role="separator"), Pointer Events with
 * `setPointerCapture`, APG keyboard contract, magnetic snap, dimension
 * readout, and aspect-ratio lock. The drag loop writes inline styles
 * directly without invoking Angular change detection.
 *
 * @example Tier 0 — pure CSS
 * ```html
 * <div interop-resizable [initialSize]="{ width: 400, height: 300 }">
 *   <my-responsive-thing />
 * </div>
 * ```
 *
 * @example Tier 1 — keyboard + snap to breakpoints
 * ```html
 * <div interop-resizable
 *      [keyboard]="true"
 *      [showDimensions]="true"
 *      [breakpoints]="[320, 480, 768, 1024, 1440]">
 *   <my-responsive-thing />
 * </div>
 * ```
 *
 * @example Reset to natural / initial size
 * ```html
 * <div #frame="interopResizable" interop-resizable [initialSize]="{ width: 400 }">
 *   ...
 * </div>
 * <button interop-button (click)="frame.reset()">Reset</button>
 * ```
 *
 * ## Aspect ratio
 *
 * Two ways to express one capability, and they do not stack.
 *
 * `[aspectRatio]="'16/9'"` declares the ratio: it is authoritative, one axis
 * drives and the other is derived, and bounds on the derived axis are
 * projected onto the driving one so the ratio cannot be clamped out of shape.
 * Size emerges from the ratio; you never back-solve a starting size. Stays in
 * Tier 0 — the browser does all of it.
 *
 * `[aspectLocked]="true"` instead captures whatever proportions the frame has
 * at drag start and holds them for that drag, with Shift toggling. Reach for
 * it when the user's current proportions are the thing worth preserving.
 *
 * Setting a ratio makes the capture path inert, Shift included. See
 * `.agent/explorations/resize-aspect-ratio` for the cross-engine measurements
 * this design rests on.
 *
 * @example Ratio-first — no bounds arithmetic, no JS in the resize loop
 * ```html
 * <div interop-resizable [aspectRatio]="'16/9'" [max]="{ height: 400 }">
 *   <my-video-frame />
 * </div>
 * ```
 *
 * ## Container queries
 *
 * The host is automatically a `container-type: inline-size` container, so
 * descendants can target its width with `@container` rules. Override via
 * `[containerType]` if you need `size` or `normal`.
 */
@Directive({
	selector: "[interop-resizable]",
	standalone: true,
	exportAs: "interopResizable",
	host: {
		class: "interop-resizable",
		// The *resolved* axis, so the reflection shows the ratio-mode coercion.
		"[attr.data-axis]": "resolvedAxis()",
		"[attr.data-tier]": "tier()",
		"[attr.data-aspect-ratio]": "ratio() ? '' : null",
		// Never both: a ratio makes the capture-based lock inert.
		"[attr.data-aspect-locked]": "aspectLocked() && !ratio() ? '' : null",
		"[style.aspect-ratio]": "aspectRatioStyle()",
		"[style.container-type]": "containerType()",
		// Bounds feed the CSS min/max tokens per-instance. Native `resize` (Tier 0)
		// honours these directly — no JS in the resize loop — and the Tier-1 drag
		// loop clamps to the same resolved numbers. One source, both tiers.
		// Bindings emit the full `<n>px` string (the `.px` unit suffix is not
		// reliable on custom-property style bindings).
		"[style.--itx-resizable-min-width]": "resolvedBounds().width.loCss",
		"[style.--itx-resizable-min-height]": "resolvedBounds().height.loCss",
		"[style.--itx-resizable-max-width]": "resolvedBounds().width.hiCss",
		"[style.--itx-resizable-max-height]": "resolvedBounds().height.hiCss",
	},
})
export class InteropResizable implements OnInit, OnDestroy {
	private readonly el = inject(ElementRef<HTMLElement>);
	private readonly renderer = inject(Renderer2);
	private readonly document = inject(DOCUMENT);
	private readonly injector = inject(Injector);

	// ── Inputs ────────────────────────────────────────────────────────────────

	/** Resize axis. Both = corner drag (Tier 0) or BR-corner handle (Tier 1). */
	axis = input<ResizableAxis>("both");

	/** Lower bound on size, in pixels. Per-axis. */
	min = input<ResizableBounds | null>(null);

	/** Upper bound on size, in pixels. Per-axis. */
	max = input<ResizableBounds | null>(null);

	/** Initial size applied once on mount, in pixels. Per-axis. Also the
	 * target of `reset()` when no natural-size baseline is captured. */
	initialSize = input<ResizableBounds | null>(null);

	/**
	 * Fixed aspect ratio for the frame — `"16/9"`, `"16 / 9"`, `"1.7778"` or
	 * `1.7778`. Setting it makes the ratio authoritative: one axis drives, the
	 * other is derived by CSS, and the capture-based `[aspectLocked]` path goes
	 * inert.
	 *
	 * A ratio does **not** activate Tier 1 on its own. Native single-axis
	 * `resize` writes only the dimension being dragged, leaving the other `auto`
	 * for `aspect-ratio` to resolve — so the common case stays zero-JS.
	 * `axis="both"` is coerced to `horizontal`, because native `resize: both`
	 * writes both dimensions and a definite size in each axis makes the browser
	 * ignore the ratio entirely.
	 *
	 * Degenerate values are treated as unset (dev-mode warning), matching CSS.
	 */
	aspectRatio = input<ResizableAspectRatio | null>(null);

	/** CSS `container-type` for the host. Default `inline-size`. */
	containerType = input<ResizableContainerType>("inline-size");

	// Tier-1 enhancement inputs — presence of any of these activates Tier 1.

	/** Magnetic snap targets in pixels, on the axis being dragged. When the user
	 * drags within the snap window of a breakpoint, the size locks to it.
	 * Targets outside the resolved bounds are clamped rather than honoured.
	 * Setting this implicitly activates Tier 1. */
	breakpoints = input<number[] | null>(null);

	/** Show a dimension badge (W × H) during drag. Implicitly activates Tier 1. */
	showDimensions = input<boolean>(false);

	/**
	 * Hold the frame's *current* proportions for the duration of a drag. The
	 * ratio is captured at drag start, and Shift toggles the lock mid-drag.
	 * Implicitly activates Tier 1.
	 *
	 * This and `[aspectRatio]` are two ways to express one capability, so they
	 * do not stack: a declared ratio is authoritative and this capture-based
	 * path — including the Shift toggle — goes inert. Reach for this when the
	 * user's starting proportions are the thing worth preserving, and for
	 * `[aspectRatio]` when a specific ratio is.
	 */
	aspectLocked = input<boolean>(false);

	/** Fire `(resize)` mid-drag (rAF-throttled). Default false — only
	 * `(resizeEnd)` fires by default to keep CD pressure minimal. Implicitly
	 * activates Tier 1. */
	liveResize = input<boolean>(false);

	/** Enable keyboard control on the corner handle (APG separator pattern).
	 * Implicitly activates Tier 1. */
	keyboard = input<boolean>(false);

	/** Step size (in pixels) for one keyboard arrow-key press. */
	keyboardStep = input<number>(16);

	/** Larger step (in pixels) for Shift+arrow. */
	keyboardLargeStep = input<number>(64);

	// ── Outputs ───────────────────────────────────────────────────────────────

	/** Fired once when a Tier-1 drag begins. Tier 0 has no drag-start signal. */
	resizeStart = output<void>();

	/** Fired on resize. By default, fires only at the end of a drag. With
	 * `liveResize=true`, fires throughout (rAF-throttled). Tier 0 fires this
	 * via ResizeObserver whenever the host resizes for any reason. */
	resize = output<ResizableDimensions>();

	/** Fired when a Tier-1 drag ends. Tier 0 doesn't have a discrete drag-end. */
	resizeEnd = output<ResizableDimensions>();

	// ── Ratio resolution ──────────────────────────────────────────────────────

	/** The parsed ratio, or `null` when unset or degenerate. Presence of this is
	 * the mode switch for everything ratio-related. */
	protected readonly ratio = computed<ResizableRatio | null>(() =>
		parseRatio(this.aspectRatio()),
	);

	/** Value for the host's inline `aspect-ratio`. */
	protected readonly aspectRatioStyle = computed<string | null>(() => {
		const r = this.ratio();
		return r ? `${r.w} / ${r.h}` : null;
	});

	/**
	 * The axis the user actually drags. A ratio forces a single axis: native
	 * `resize: both` writes both dimensions, and a box with two definite sizes
	 * ignores its aspect ratio outright (measured in Blink, WebKit and Gecko —
	 * see `.agent/explorations/resize-aspect-ratio`). `horizontal` is the
	 * default choice; an explicit `axis="vertical"` is honoured and drives the
	 * block axis instead.
	 */
	protected readonly resolvedAxis = computed<ResizableAxis>(() => {
		const ax = this.axis();
		return this.ratio() && ax === "both" ? "horizontal" : ax;
	});

	/** True when the inline axis is the one being dragged. */
	private readonly drivingIsWidth = computed(
		() => this.resolvedAxis() !== "vertical",
	);

	// ── Tier resolution ───────────────────────────────────────────────────────

	/** Implicit Tier 1 trigger — set when any enhancement input is on.
	 * `aspectLocked` is excluded under a ratio: it is inert there, and letting
	 * an inert input mount a drag handle the consumer never asked for was its
	 * own small surprise. */
	protected readonly tier = computed<"native" | "enhanced">(() => {
		const bp = this.breakpoints();
		if (
			(bp && bp.length > 0) ||
			this.showDimensions() ||
			(this.aspectLocked() && !this.ratio()) ||
			this.liveResize() ||
			this.keyboard()
		) {
			return "enhanced";
		}
		return "native";
	});

	// ── Bounds resolution ─────────────────────────────────────────────────────

	/**
	 * The single source of truth for bounds, in both a numeric form (for the
	 * Tier-1 clamp, Home/End and the ARIA values) and a CSS form (for the
	 * tokens Tier 0 lays out from). Deriving both from one computation is what
	 * keeps the two tiers agreeing.
	 *
	 * Without a ratio this is just the inputs, with a `min > max` conflict
	 * settled the way CSS settles it — min wins (CSS 2.2 §10.4).
	 *
	 * With a ratio the cross axis is derived, so a cross-axis bound must never
	 * reach CSS: min/max in the ratio-dependent axis are applied "without
	 * regards to aspect-ratio" and would silently clamp the derived size and
	 * break the ratio. Instead each cross-axis bound is **projected** through
	 * the ratio onto the driving axis and merged there, and the cross-axis
	 * tokens are neutralised to `0` / `none`.
	 *
	 * Merging follows css-sizing-4's own transfer rules: a transferred minimum
	 * is capped by an explicit maximum in the destination axis, and a
	 * transferred maximum is floored by an explicit minimum. Explicit beats
	 * derived, so a bound the consumer wrote is never silently violated by one
	 * the component inferred.
	 */
	protected readonly resolvedBounds = computed(() => {
		const min = this.min();
		const max = this.max();
		const r = this.ratio();

		const raw = (axis: "width" | "height"): Bound => {
			const lo = min?.[axis] ?? undefined;
			let hi = max?.[axis] ?? undefined;
			if (lo != null && hi != null && hi < lo) hi = lo;
			return { lo, hi, loCss: px(lo), hiCss: px(hi) };
		};

		if (!r) return { width: raw("width"), height: raw("height") };

		const drivingIsWidth = this.drivingIsWidth();
		const dAxis = drivingIsWidth ? "width" : "height";
		const cAxis = drivingIsWidth ? "height" : "width";
		// Projecting a cross-axis length onto the driving axis: × num / den.
		const num = drivingIsWidth ? r.w : r.h;
		const den = drivingIsWidth ? r.h : r.w;

		const explicitLo = min?.[dAxis] ?? undefined;
		const explicitHi = max?.[dAxis] ?? undefined;
		const crossLo = min?.[cAxis] ?? undefined;
		const crossHi = max?.[cAxis] ?? undefined;

		let lo = explicitLo;
		let loCss = px(explicitLo);
		if (crossLo != null) {
			let v = (crossLo * num) / den;
			// calc() rather than the computed number: engines quantise layout
			// differently (Gecko 1/60px, Blink 1/64px), so a value computed here
			// would be a fraction wrong somewhere. CSS does the arithmetic.
			let css = `calc(${crossLo}px * ${num} / ${den})`;
			if (explicitHi != null && v > explicitHi) {
				v = explicitHi;
				css = px(explicitHi)!;
			}
			if (lo == null || v > lo) {
				lo = v;
				loCss = css;
			}
		}

		let hi = explicitHi;
		let hiCss = px(explicitHi);
		if (crossHi != null) {
			let v = (crossHi * num) / den;
			let css = `calc(${crossHi}px * ${num} / ${den})`;
			if (explicitLo != null && v < explicitLo) {
				v = explicitLo;
				css = px(explicitLo)!;
			}
			if (hi == null || v < hi) {
				hi = v;
				hiCss = css;
			}
		}

		if (lo != null && hi != null && hi < lo) {
			hi = lo;
			hiCss = loCss;
		}

		const driving: Bound = { lo, hi, loCss, hiCss };
		// Neutralised, not merely unset: `resizable.css` declares the cross-axis
		// min/max from these tokens unconditionally, and a consumer may have set
		// them from a stylesheet under the documented two-path bounds contract.
		// That contract is void on the cross axis under a ratio.
		const cross: Bound = {
			lo: undefined,
			hi: undefined,
			loCss: "0",
			hiCss: "none",
		};

		return drivingIsWidth
			? { width: driving, height: cross }
			: { width: cross, height: driving };
	});

	// ── Internal state ────────────────────────────────────────────────────────

	private resizeObserver?: ResizeObserver;
	private handleEl?: HTMLElement;
	private readoutEl?: HTMLElement;

	/** Drag state — only used in Tier 1. Plain fields, not signals: writes
	 * during drag must not trigger Angular change detection. */
	private dragActive = false;
	private dragStartPointerX = 0;
	private dragStartPointerY = 0;
	private dragStartWidth = 0;
	private dragStartHeight = 0;
	/** Driving-axis size at mount — the reset() baseline under a ratio. */
	private naturalDrivingSize: number | null = null;
	private dragStartAspect = 1;
	/** Ratio and driving axis latched at drag start. Reading the signals mid-drag
	 * would let a ratio change recompute the bounds while the drag-start
	 * snapshot stayed put, jumping the box under a stationary pointer. */
	private dragRatio: ResizableRatio | null = null;
	private dragDrivingIsWidth = true;
	private rafHandle: number | null = null;
	private pendingWidth: number | null = null;
	private pendingHeight: number | null = null;

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	ngOnInit(): void {
		// Baseline for reset() under a ratio. Captured before the initial size is
		// applied: with a ratio and no `initialSize`, clearing the inline sizes
		// leaves the driving axis `auto` — fill-available — so a plain reset()
		// would blow the frame up to a full-width slab rather than returning it
		// to where it started.
		const startRect = this.el.nativeElement.getBoundingClientRect();
		this.naturalDrivingSize = this.drivingIsWidth()
			? startRect.width
			: startRect.height;

		// Apply initial size once, if provided. Direct DOM write — no signal-
		// bound style binding so consumers can later override via inline style
		// or via reset() without fighting Angular CD.
		this.applyInitialSize();

		// Dev-mode validation. Kept in an effect rather than the computeds so
		// those stay pure and warnings do not repeat on every recomputation.
		if (isDevMode()) {
			effect(() => this.warnOnConflicts(), { injector: this.injector });
		}

		// ResizeObserver always wired — drives `(resize)` outputs in both tiers.
		this.wireResizeObserver();

		// A ratio makes the cross axis derived, so no inline size may remain on
		// it — not one written by `initialSize` before the ratio was set, nor one
		// left by a drag taken in a different mode. Two definite sizes make the
		// browser ignore the ratio outright, which would silently drop the whole
		// feature rather than fail loudly.
		effect(
			() => {
				if (!this.ratio()) return;
				this.renderer.removeStyle(
					this.el.nativeElement,
					this.drivingIsWidth() ? "height" : "width",
				);
			},
			{ injector: this.injector },
		);

		// Effect: watch tier and mount/unmount the handle accordingly.
		effect(
			() => {
				const t = this.tier();
				if (t === "enhanced") {
					this.mountHandle();
					if (this.showDimensions()) this.mountReadout();
					else this.unmountReadout();
				} else {
					this.unmountHandle();
					this.unmountReadout();
				}
			},
			{ injector: this.injector },
		);
	}

	ngOnDestroy(): void {
		this.resizeObserver?.disconnect();
		this.unmountHandle();
		this.unmountReadout();
		if (this.rafHandle !== null) cancelAnimationFrame(this.rafHandle);
	}

	// ── Public API ────────────────────────────────────────────────────────────

	/**
	 * Reset host size: clear inline width/height, then re-apply `initialSize`
	 * if one was provided. Without a ratio the host falls back to its natural
	 * (CSS-driven) size.
	 *
	 * Under a ratio, "natural" would mean fill-available on the driving axis,
	 * so reset falls back to the driving-axis size measured at mount instead —
	 * returning the frame to where it started rather than expanding it.
	 */
	reset(): void {
		const host = this.el.nativeElement;
		this.renderer.removeStyle(host, "width");
		this.renderer.removeStyle(host, "height");
		this.applyInitialSize();

		if (!this.ratio()) return;
		const drivingIsWidth = this.drivingIsWidth();
		const seeded = drivingIsWidth
			? this.initialSize()?.width
			: this.initialSize()?.height;
		if (seeded == null && this.naturalDrivingSize != null) {
			this.renderer.setStyle(
				host,
				drivingIsWidth ? "width" : "height",
				`${this.naturalDrivingSize}px`,
			);
		}
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	private applyInitialSize(): void {
		const host = this.el.nativeElement;
		const init = this.initialSize();
		// Under a ratio only the driving axis is seeded — the cross axis must stay
		// `auto` for `aspect-ratio` to resolve it. A cross-axis value is a genuine
		// contradiction rather than a constraint to reconcile, so it is dropped
		// (with a dev-mode warning) rather than projected.
		if (this.ratio()) {
			const drivingIsWidth = this.drivingIsWidth();
			const v = drivingIsWidth ? init?.width : init?.height;
			if (v != null) {
				this.renderer.setStyle(
					host,
					drivingIsWidth ? "width" : "height",
					`${v}px`,
				);
			}
			return;
		}
		if (init?.width != null) {
			this.renderer.setStyle(host, "width", `${init.width}px`);
		}
		if (init?.height != null) {
			this.renderer.setStyle(host, "height", `${init.height}px`);
		}
	}

	/** Dev-mode only: reports configurations where one input silently overrides
	 * another, so the losing value is named rather than quietly discarded. */
	private warnOnConflicts(): void {
		const raw = this.aspectRatio();
		if (raw != null && !this.ratio()) {
			console.warn(
				`[interop-resizable] Ignoring degenerate [aspectRatio] value ${JSON.stringify(raw)}. ` +
					`Expected "16/9", "16 / 9" or a positive number. Treated as unset, matching CSS.`,
			);
			return;
		}
		if (!this.ratio()) return;

		const drivingIsWidth = this.drivingIsWidth();
		const cross = drivingIsWidth ? "height" : "width";

		if (this.initialSize()?.[cross] != null) {
			console.warn(
				`[interop-resizable] [initialSize].${cross} is ignored under [aspectRatio] — ` +
					`the ${cross} is derived from the ratio. Seed the ${drivingIsWidth ? "width" : "height"} instead.`,
			);
		}
		if (this.aspectLocked()) {
			console.warn(
				`[interop-resizable] [aspectLocked] is inert under [aspectRatio]. ` +
					`The ratio is authoritative; the drag-start capture is not consulted.`,
			);
		}

		// An unsatisfiable pair: the bound projected from the cross axis wants a
		// driving-axis size larger than an explicit driving-axis maximum allows.
		// Explicit wins; say which bound lost.
		const crossLo = this.min()?.[cross];
		const explicitHi = this.max()?.[drivingIsWidth ? "width" : "height"];
		const r = this.ratio()!;
		if (crossLo != null && explicitHi != null) {
			const num = drivingIsWidth ? r.w : r.h;
			const den = drivingIsWidth ? r.h : r.w;
			const projected = (crossLo * num) / den;
			if (projected > explicitHi) {
				console.warn(
					`[interop-resizable] [min].${cross}=${crossLo} needs ${Math.round(projected)}px on the ` +
						`driving axis at this ratio, but [max] caps it at ${explicitHi}px. The explicit ` +
						`maximum wins and [min].${cross} will not be met.`,
				);
			}
		}
	}

	private wireResizeObserver(): void {
		if (typeof ResizeObserver === "undefined") return;
		this.resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			// Measure the border box, matching `(resizeEnd)`, the drag loop and the
			// documented ResizableDimensions contract. `entry.contentRect` is the
			// *content* box, so the two outputs previously reported different sizes
			// for the same state whenever the host had a border or padding — and the
			// theme ships a 1px border by default. Reading the rect here is not a
			// forced reflow: ResizeObserver already delivers after layout.
			const rect = this.el.nativeElement.getBoundingClientRect();
			const dims: ResizableDimensions = {
				width: rect.width,
				height: rect.height,
			};
			this.resize.emit(dims);
			// Mid-drag: also update the readout (cheap DOM write).
			if (this.dragActive && this.readoutEl) {
				this.updateReadout(dims.width, dims.height);
			}
		});
		this.resizeObserver.observe(this.el.nativeElement);
	}

	// ── Tier 1: handle ────────────────────────────────────────────────────────

	private mountHandle(): void {
		if (this.handleEl) return;
		const handle = this.renderer.createElement("div") as HTMLElement;
		this.renderer.addClass(handle, "interop-resizable__handle");
		this.renderer.setAttribute(handle, "role", "separator");
		this.renderer.setAttribute(
			handle,
			"aria-orientation",
			this.axisAriaOrientation(),
		);
		this.renderer.setAttribute(handle, "aria-label", "Resize");
		this.renderer.setAttribute(
			handle,
			"tabindex",
			this.keyboard() ? "0" : "-1",
		);
		this.renderer.appendChild(this.el.nativeElement, handle);

		handle.addEventListener("pointerdown", this.onPointerDown);
		handle.addEventListener("pointermove", this.onPointerMove);
		handle.addEventListener("pointerup", this.onPointerUp);
		handle.addEventListener("pointercancel", this.onPointerUp);
		handle.addEventListener("dblclick", this.onHandleDblClick);
		if (this.keyboard()) {
			handle.addEventListener("keydown", this.onKeyDown);
		}

		this.handleEl = handle;
		this.updateAriaValues();
	}

	private unmountHandle(): void {
		if (!this.handleEl) return;
		this.handleEl.removeEventListener("pointerdown", this.onPointerDown);
		this.handleEl.removeEventListener("pointermove", this.onPointerMove);
		this.handleEl.removeEventListener("pointerup", this.onPointerUp);
		this.handleEl.removeEventListener("pointercancel", this.onPointerUp);
		this.handleEl.removeEventListener("dblclick", this.onHandleDblClick);
		this.handleEl.removeEventListener("keydown", this.onKeyDown);
		this.renderer.removeChild(this.el.nativeElement, this.handleEl);
		this.handleEl = undefined;
	}

	private axisAriaOrientation(): "horizontal" | "vertical" {
		// Per APG: the orientation reflects the SEPARATOR's drag axis.
		// For a corner handle that resizes both, "horizontal" is the closest
		// single-value answer (it's traditionally for separators between
		// top/bottom panes; "vertical" is for left/right). We pick "horizontal"
		// when the axis includes vertical drag, otherwise "vertical".
		const ax = this.resolvedAxis();
		return ax === "vertical" ? "horizontal" : "vertical";
	}

	// ── Tier 1: readout ───────────────────────────────────────────────────────

	private mountReadout(): void {
		if (this.readoutEl) return;
		const r = this.renderer.createElement("div") as HTMLElement;
		this.renderer.addClass(r, "interop-resizable__readout");
		this.renderer.setAttribute(r, "aria-hidden", "true");
		this.renderer.appendChild(this.el.nativeElement, r);
		this.readoutEl = r;
		const rect = this.el.nativeElement.getBoundingClientRect();
		this.updateReadout(rect.width, rect.height);
	}

	private unmountReadout(): void {
		if (!this.readoutEl) return;
		this.renderer.removeChild(this.el.nativeElement, this.readoutEl);
		this.readoutEl = undefined;
	}

	private updateReadout(width: number, height: number): void {
		if (!this.readoutEl) return;
		this.readoutEl.textContent = `${Math.round(width)} × ${Math.round(height)}`;
	}

	// ── Tier 1: pointer drag ──────────────────────────────────────────────────

	private onPointerDown = (event: PointerEvent): void => {
		if (!this.handleEl) return;
		event.preventDefault();
		this.handleEl.setPointerCapture(event.pointerId);

		const rect = this.el.nativeElement.getBoundingClientRect();
		this.dragActive = true;
		this.dragStartPointerX = event.clientX;
		this.dragStartPointerY = event.clientY;
		this.dragStartWidth = rect.width;
		this.dragStartHeight = rect.height;
		this.dragStartAspect = rect.height === 0 ? 1 : rect.width / rect.height;
		this.dragRatio = this.ratio();
		this.dragDrivingIsWidth = this.drivingIsWidth();

		this.renderer.addClass(
			this.el.nativeElement,
			"interop-resizable--dragging",
		);
		this.resizeStart.emit();
	};

	private onPointerMove = (event: PointerEvent): void => {
		if (!this.dragActive) return;

		const dx = event.clientX - this.dragStartPointerX;
		const dy = event.clientY - this.dragStartPointerY;
		const ax = this.resolvedAxis();
		const ratio = this.dragRatio;

		let nextWidth = this.dragStartWidth + (ax === "vertical" ? 0 : dx);
		let nextHeight = this.dragStartHeight + (ax === "horizontal" ? 0 : dy);

		// Aspect lock: hold either via input or temporarily via Shift. Both are
		// capture-based, and a ratio supersedes them — under a ratio the driving
		// axis is the only free dimension and CSS derives the other, so there is
		// nothing here to reconcile and Shift has no aspect meaning.
		if (!ratio && (this.aspectLocked() || event.shiftKey)) {
			const aspect = this.dragStartAspect;
			// When both axes drift, constrain by the larger delta to feel natural.
			if (Math.abs(dx) >= Math.abs(dy)) {
				nextHeight = nextWidth / aspect;
			} else {
				nextWidth = nextHeight * aspect;
			}
		}

		// Clamp to min/max bounds.
		const wb = this.effectiveBounds("width");
		const hb = this.effectiveBounds("height");
		nextWidth = this.clamp(nextWidth, wb.lo, wb.hi);
		nextHeight = this.clamp(nextHeight, hb.lo, hb.hi);

		// Snap to breakpoints, on the driving axis. Re-clamped, because a
		// breakpoint outside the bounds would otherwise punch straight through
		// them — and the CSS min/max would then override the size we just wrote,
		// leaving the inline style and the rendered box disagreeing.
		const bps = this.breakpoints();
		if (bps && bps.length > 0) {
			const SNAP_WINDOW = 12;
			const drivingIsWidth = ratio
				? this.dragDrivingIsWidth
				: ax !== "vertical";
			const current = drivingIsWidth ? nextWidth : nextHeight;
			for (const bp of bps) {
				if (Math.abs(current - bp) <= SNAP_WINDOW) {
					const b = drivingIsWidth ? wb : hb;
					const snapped = this.clamp(bp, b.lo, b.hi);
					if (drivingIsWidth) nextWidth = snapped;
					else nextHeight = snapped;
					break;
				}
			}
		}

		// Under a ratio only the driving axis is written; CSS derives the other
		// from `aspect-ratio`. Writing both would make each size definite, and a
		// box with two definite sizes ignores its ratio outright.
		if (ratio) {
			if (this.dragDrivingIsWidth) {
				nextHeight = (nextWidth * ratio.h) / ratio.w;
			} else {
				nextWidth = (nextHeight * ratio.w) / ratio.h;
			}
		}

		this.pendingWidth = nextWidth;
		this.pendingHeight = nextHeight;
		if (this.rafHandle === null) {
			this.rafHandle = requestAnimationFrame(this.flushPendingSize);
		}
	};

	private onPointerUp = (event: PointerEvent): void => {
		if (!this.dragActive) return;
		this.handleEl?.releasePointerCapture?.(event.pointerId);
		this.dragActive = false;

		// Ensure any pending size lands.
		if (this.rafHandle !== null) {
			cancelAnimationFrame(this.rafHandle);
			this.rafHandle = null;
			this.flushPendingSize();
		}

		this.renderer.removeClass(
			this.el.nativeElement,
			"interop-resizable--dragging",
		);
		const rect = this.el.nativeElement.getBoundingClientRect();
		this.updateAriaValues();
		this.resizeEnd.emit({ width: rect.width, height: rect.height });
	};

	/** Apply the latest pending size to the host and (optionally) emit a
	 * mid-drag `(resize)` event. Runs on rAF so multiple pointer events
	 * coalesce to one paint frame. */
	private flushPendingSize = (): void => {
		this.rafHandle = null;
		const w = this.pendingWidth;
		const h = this.pendingHeight;
		this.pendingWidth = null;
		this.pendingHeight = null;

		const host = this.el.nativeElement;
		const ax = this.resolvedAxis();
		if (this.dragRatio) {
			// Driving axis only — the cross axis must stay `auto` for the ratio to
			// resolve it. Setting both would make the browser ignore the ratio.
			if (this.dragDrivingIsWidth) {
				if (w !== null) host.style.width = `${w}px`;
			} else if (h !== null) {
				host.style.height = `${h}px`;
			}
		} else {
			if (w !== null && ax !== "vertical") host.style.width = `${w}px`;
			if (h !== null && ax !== "horizontal") host.style.height = `${h}px`;
		}

		if (this.liveResize()) {
			const rect = host.getBoundingClientRect();
			this.resize.emit({ width: rect.width, height: rect.height });
		}

		this.updateAriaValues();
	};

	private onHandleDblClick = (): void => {
		this.reset();
		const rect = this.el.nativeElement.getBoundingClientRect();
		this.resizeEnd.emit({ width: rect.width, height: rect.height });
		this.updateAriaValues();
	};

	// ── Tier 1: keyboard ──────────────────────────────────────────────────────

	private onKeyDown = (event: KeyboardEvent): void => {
		const ax = this.resolvedAxis();
		const step = event.shiftKey
			? this.keyboardLargeStep()
			: this.keyboardStep();
		const rect = this.el.nativeElement.getBoundingClientRect();
		const wb = this.effectiveBounds("width");
		const hb = this.effectiveBounds("height");
		let nextWidth = rect.width;
		let nextHeight = rect.height;
		let handled = false;

		switch (event.key) {
			case "ArrowRight":
				if (ax !== "vertical") {
					nextWidth += step;
					handled = true;
				}
				break;
			case "ArrowLeft":
				if (ax !== "vertical") {
					nextWidth -= step;
					handled = true;
				}
				break;
			case "ArrowDown":
				if (ax !== "horizontal") {
					nextHeight += step;
					handled = true;
				}
				break;
			case "ArrowUp":
				if (ax !== "horizontal") {
					nextHeight -= step;
					handled = true;
				}
				break;
			case "Home":
				if (ax !== "vertical") {
					nextWidth = wb.lo ?? rect.width;
					handled = true;
				}
				if (ax !== "horizontal") {
					nextHeight = hb.lo ?? rect.height;
					handled = true;
				}
				break;
			case "End":
				if (ax !== "vertical") {
					nextWidth = wb.hi ?? rect.width;
					handled = true;
				}
				if (ax !== "horizontal") {
					nextHeight = hb.hi ?? rect.height;
					handled = true;
				}
				break;
		}

		if (!handled) return;
		event.preventDefault();

		nextWidth = this.clamp(nextWidth, wb.lo, wb.hi);
		nextHeight = this.clamp(nextHeight, hb.lo, hb.hi);

		const host = this.el.nativeElement;
		if (this.ratio()) {
			// Driving axis only, as in the drag loop.
			if (this.drivingIsWidth()) host.style.width = `${nextWidth}px`;
			else host.style.height = `${nextHeight}px`;
		} else {
			if (ax !== "vertical") host.style.width = `${nextWidth}px`;
			if (ax !== "horizontal") host.style.height = `${nextHeight}px`;
		}

		this.updateAriaValues();
		const r = host.getBoundingClientRect();
		this.resize.emit({ width: r.width, height: r.height });
	};

	// ── Helpers ──────────────────────────────────────────────────────────────

	/**
	 * Numeric bounds for one axis. Every JS consumer goes through here — the
	 * drag clamp, Home/End and the ARIA values — so all of them agree with what
	 * the browser will actually lay out. Reading the raw inputs instead let
	 * Tier 1 write a size that Tier 0's CSS then overrode, and let
	 * `aria-valuenow` exceed `aria-valuemax`.
	 */
	private effectiveBounds(axis: "width" | "height"): {
		lo?: number;
		hi?: number;
	} {
		const b = this.resolvedBounds()[axis];
		return { lo: b.lo, hi: b.hi };
	}

	/** Clamp to resolved bounds. Order-independent: `effectiveBounds` has
	 * already guaranteed `hi >= lo`. */
	private clamp(value: number, lo?: number, hi?: number): number {
		let v = value;
		if (hi != null) v = Math.min(v, hi);
		if (lo != null) v = Math.max(v, lo);
		return v;
	}

	private updateAriaValues(): void {
		if (!this.handleEl) return;
		const rect = this.el.nativeElement.getBoundingClientRect();
		const ax = this.resolvedAxis();
		// Report the primary axis. For "both", we report width by convention.
		const value = ax === "vertical" ? rect.height : rect.width;
		const { lo, hi } = this.effectiveBounds(
			ax === "vertical" ? "height" : "width",
		);
		this.renderer.setAttribute(
			this.handleEl,
			"aria-valuenow",
			`${Math.round(value)}`,
		);
		if (lo != null) {
			this.renderer.setAttribute(this.handleEl, "aria-valuemin", `${lo}`);
		}
		if (hi != null) {
			this.renderer.setAttribute(this.handleEl, "aria-valuemax", `${hi}`);
		}
	}
}
