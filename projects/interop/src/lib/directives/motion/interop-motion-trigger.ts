import {
	Directive,
	DestroyRef,
	ElementRef,
	HostListener,
	inject,
	input,
} from "@angular/core";
import { setupMotionSurface } from "./setup-motion-surface";

/**
 * InteropMotionTrigger — fires a one-shot visual treatment (the preset) on
 * activation. Lives in the InteropMotion family alongside InteropMotionWhile
 * (continuous) and InteropMotionOn (signal-edge). See `.agent/motion.md`.
 *
 * Usage:
 *
 *   <button interop-button="icon"
 *           interop-motion-trigger="spin"
 *           (click)="reload()">
 *     <interop-icon name="tabler-reload" />
 *   </button>
 *
 * The attribute value is the preset name (`spin`, `pop`, `shake`, …). It is
 * mirrored onto `itx-motion-preset` so all preset CSS targets a single,
 * directive-agnostic surface.
 *
 * Disabled hosts (native `:disabled` or `aria-disabled="true"`) are gated in
 * both JS (no class added on click) and CSS (anticipation suppressed via
 * `:not(:disabled):not([aria-disabled="true"])` in preset rules).
 */
@Directive({
	selector: "[interop-motion-trigger]",
	standalone: true,
	host: {
		"[attr.itx-motion-preset]": "preset()",
	},
})
export class InteropMotionTrigger {
	private readonly host =
		inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

	readonly preset = input<MotionTriggerPreset | null>(null, {
		alias: "interop-motion-trigger",
	});

	private readonly surface = setupMotionSurface(this.host, {
		className: "is-acting",
	});

	constructor() {
		inject(DestroyRef).onDestroy(() => this.surface.destroy());
	}

	@HostListener("click")
	protected onClick(): void {
		if (this.host.matches(':disabled, [aria-disabled="true"]')) return;
		this.surface.fire();
	}

	/** Imperative trigger for non-event-driven activations. */
	fire(): void {
		if (this.host.matches(':disabled, [aria-disabled="true"]')) return;
		this.surface.fire();
	}
}

/**
 * Built-in preset names. Any string is structurally allowed (the CSS will
 * silently no-op for unknown names); the union exists for IDE autocomplete.
 */
export type MotionTriggerPreset =
	| "spin"
	| "shake"
	| "pop"
	| "pulse"
	| "dip"
	| "nudge"
	// Allow arbitrary strings for BYO-keyframes custom presets without
	// collapsing the autocomplete suggestions for built-ins.
	| (string & {});
