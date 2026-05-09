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
  signal,
} from "@angular/core";
import {
  type ResizableAxis,
  type ResizableBounds,
  type ResizableContainerType,
  type ResizableDimensions,
} from "./interop-resizable.types";

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
    "[attr.data-axis]": "axis()",
    "[attr.data-tier]": "tier()",
    "[attr.data-aspect-locked]": "aspectLocked() ? '' : null",
    "[style.container-type]": "containerType()",
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

  /** CSS `container-type` for the host. Default `inline-size`. */
  containerType = input<ResizableContainerType>("inline-size");

  // Tier-1 enhancement inputs — presence of any of these activates Tier 1.

  /** Magnetic snap targets in pixels (width-axis only for now). When the
   * user drags within the snap window of a breakpoint, the size locks to
   * it. Setting this implicitly activates Tier 1. */
  breakpoints = input<number[] | null>(null);

  /** Show a dimension badge (W × H) during drag. Implicitly activates Tier 1. */
  showDimensions = input<boolean>(false);

  /** Lock aspect ratio during drag (Shift modifier overrides). Implicitly
   * activates Tier 1. The locked ratio is captured at drag start. */
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

  // ── Tier resolution ───────────────────────────────────────────────────────

  /** Implicit Tier 1 trigger — set when any enhancement input is on. */
  protected readonly tier = computed<"native" | "enhanced">(() => {
    const bp = this.breakpoints();
    if (
      (bp && bp.length > 0) ||
      this.showDimensions() ||
      this.aspectLocked() ||
      this.liveResize() ||
      this.keyboard()
    ) {
      return "enhanced";
    }
    return "native";
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
  private dragStartAspect = 1;
  private rafHandle: number | null = null;
  private pendingWidth: number | null = null;
  private pendingHeight: number | null = null;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Apply initial size once, if provided. Direct DOM write — no signal-
    // bound style binding so consumers can later override via inline style
    // or via reset() without fighting Angular CD.
    this.applyInitialSize();

    // ResizeObserver always wired — drives `(resize)` outputs in both tiers.
    this.wireResizeObserver();

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

  /** Reset host size: clear inline width/height, then re-apply `initialSize`
   * if one was provided. After reset the host falls back to its natural
   * (CSS-driven) size. */
  reset(): void {
    const host = this.el.nativeElement;
    this.renderer.removeStyle(host, "width");
    this.renderer.removeStyle(host, "height");
    this.applyInitialSize();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private applyInitialSize(): void {
    const host = this.el.nativeElement;
    const init = this.initialSize();
    if (init?.width != null) {
      this.renderer.setStyle(host, "width", `${init.width}px`);
    }
    if (init?.height != null) {
      this.renderer.setStyle(host, "height", `${init.height}px`);
    }
  }

  private wireResizeObserver(): void {
    if (typeof ResizeObserver === "undefined") return;
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const cr = entry.contentRect;
      const dims: ResizableDimensions = { width: cr.width, height: cr.height };
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
    this.renderer.setAttribute(handle, "aria-orientation", this.axisAriaOrientation());
    this.renderer.setAttribute(handle, "aria-label", "Resize");
    this.renderer.setAttribute(handle, "tabindex", this.keyboard() ? "0" : "-1");
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
    const ax = this.axis();
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

    this.renderer.addClass(this.el.nativeElement, "interop-resizable--dragging");
    this.resizeStart.emit();
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.dragActive) return;

    const dx = event.clientX - this.dragStartPointerX;
    const dy = event.clientY - this.dragStartPointerY;
    const ax = this.axis();

    let nextWidth = this.dragStartWidth + (ax === "vertical" ? 0 : dx);
    let nextHeight = this.dragStartHeight + (ax === "horizontal" ? 0 : dy);

    // Aspect lock: hold either via input or temporarily via Shift.
    if (this.aspectLocked() || event.shiftKey) {
      const aspect = this.dragStartAspect;
      // When both axes drift, constrain by the larger delta to feel natural.
      if (Math.abs(dx) >= Math.abs(dy)) {
        nextHeight = nextWidth / aspect;
      } else {
        nextWidth = nextHeight * aspect;
      }
    }

    // Clamp to min/max bounds.
    nextWidth = this.clamp(nextWidth, this.min()?.width, this.max()?.width);
    nextHeight = this.clamp(nextHeight, this.min()?.height, this.max()?.height);

    // Snap to breakpoints (width axis only for now).
    const bps = this.breakpoints();
    if (bps && bps.length > 0) {
      const SNAP_WINDOW = 12;
      for (const bp of bps) {
        if (Math.abs(nextWidth - bp) <= SNAP_WINDOW) {
          nextWidth = bp;
          break;
        }
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

    this.renderer.removeClass(this.el.nativeElement, "interop-resizable--dragging");
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
    const ax = this.axis();
    if (w !== null && ax !== "vertical") host.style.width = `${w}px`;
    if (h !== null && ax !== "horizontal") host.style.height = `${h}px`;

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
    const ax = this.axis();
    const step = event.shiftKey ? this.keyboardLargeStep() : this.keyboardStep();
    const rect = this.el.nativeElement.getBoundingClientRect();
    let nextWidth = rect.width;
    let nextHeight = rect.height;
    let handled = false;

    switch (event.key) {
      case "ArrowRight":
        if (ax !== "vertical") { nextWidth += step; handled = true; }
        break;
      case "ArrowLeft":
        if (ax !== "vertical") { nextWidth -= step; handled = true; }
        break;
      case "ArrowDown":
        if (ax !== "horizontal") { nextHeight += step; handled = true; }
        break;
      case "ArrowUp":
        if (ax !== "horizontal") { nextHeight -= step; handled = true; }
        break;
      case "Home":
        if (ax !== "vertical") { nextWidth = this.min()?.width ?? rect.width; handled = true; }
        if (ax !== "horizontal") { nextHeight = this.min()?.height ?? rect.height; handled = true; }
        break;
      case "End":
        if (ax !== "vertical") {
          nextWidth = this.max()?.width ?? rect.width;
          handled = true;
        }
        if (ax !== "horizontal") {
          nextHeight = this.max()?.height ?? rect.height;
          handled = true;
        }
        break;
    }

    if (!handled) return;
    event.preventDefault();

    nextWidth = this.clamp(nextWidth, this.min()?.width, this.max()?.width);
    nextHeight = this.clamp(nextHeight, this.min()?.height, this.max()?.height);

    const host = this.el.nativeElement;
    if (ax !== "vertical") host.style.width = `${nextWidth}px`;
    if (ax !== "horizontal") host.style.height = `${nextHeight}px`;

    this.updateAriaValues();
    const r = host.getBoundingClientRect();
    this.resize.emit({ width: r.width, height: r.height });
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  private clamp(value: number, lo?: number, hi?: number): number {
    if (lo != null && value < lo) return lo;
    if (hi != null && value > hi) return hi;
    return value;
  }

  private updateAriaValues(): void {
    if (!this.handleEl) return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    const ax = this.axis();
    // Report the primary axis. For "both", we report width by convention.
    const value = ax === "vertical" ? rect.height : rect.width;
    const lo = ax === "vertical" ? this.min()?.height : this.min()?.width;
    const hi = ax === "vertical" ? this.max()?.height : this.max()?.width;
    this.renderer.setAttribute(this.handleEl, "aria-valuenow", `${Math.round(value)}`);
    if (lo != null) {
      this.renderer.setAttribute(this.handleEl, "aria-valuemin", `${lo}`);
    }
    if (hi != null) {
      this.renderer.setAttribute(this.handleEl, "aria-valuemax", `${hi}`);
    }
  }
}
