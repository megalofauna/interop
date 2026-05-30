import {
	Component,
	ChangeDetectionStrategy,
	input,
	output,
	contentChild,
	computed,
} from "@angular/core";
import { DemoState } from "../demo-state/demo-state";
import {
	InteropContent,
	type Div,
	InteropButton,
	InteropIcon,
	InteropMotionTrigger,
	provideInteropIcons,
} from "interop";
import { Terminal } from "@interop/composites";
import { TablerReload } from "interop/lib/iconsets/tabler";

// ─── Reload-button semantics ─────────────────────────────────────────────────
//
// The reload button is a *frame-level* affordance that lets the user reset any
// stateful surface inside the example without having to discover the in-widget
// affordance (e.g. the terminal's own eraser, which we deliberately keep — it
// is part of `Terminal`'s own composite contract, not demo-specific).
//
// Enable rule (`canReload`):
//   The button is enabled when the example has *something* to reset. Two
//   independent signals contribute:
//     - a projected `<itx-terminal>` with entries (mirrors `.itx-term--active`)
//     - the consumer-provided `[dirty]` input set to `true`
//   ORed together so the page can declare extra dirt without losing the
//   automatic terminal-driven behaviour.
//
// Click behaviour (`onReload`):
//   1. Emit the `(reset)` output. The page is responsible for restoring any
//      state it owns (signals, activation handlers via `handler.reset()`, etc).
//   2. Call `terminal()?.requestReset()` so the in-terminal `(reset)` binding
//      still fires for pages that haven't migrated to the frame-level pattern.
//      For pages that *have* migrated, their `(reset)` callback can clear the
//      terminal-backed signal directly and drop the per-terminal `(reset)`
//      binding — the duplicate emission is harmless if both remain.
//
// Visibility:
//   Button is shown when there is a credible reset target: a projected
//   terminal, or a currently-`dirty` example. With neither, the affordance
//   would be perpetually inert, so it is hidden. (Angular doesn't expose a
//   way to detect whether `(reset)` is bound; `[dirty]` serves as the
//   page-side opt-in for terminal-less examples.)
//
// `contentChild(Terminal)` matches direct projected children. The existing
// demos always place `<itx-terminal>` directly in `<demo-example>`'s default
// slot, so this is sufficient. If a future example wraps the terminal in a
// `<div>` or `@if`, add `{ descendants: true }`.
//
@Component({
	selector: "demo-example",
	standalone: true,
	imports: [InteropContent, InteropButton, InteropIcon, InteropMotionTrigger],
	template: `
		@if (terminal() || dirty()) {
			<button
				class="demo-example__reload"
				interop-button="icon"
				itx-size="md"
				interop-motion-trigger="spin"
				[disabled]="!canReload()"
				(click)="onReload()"
				aria-label="Reset example"
			>
				<interop-icon name="tabler-reload" itx-size="lg"></interop-icon>
			</button>
		}
		<div class="demo-example__preview">
			@if (label()) {
				<p class="demo-example__label">{{ label() }}</p>
			}
			@if (lede(); as ledeNode) {
				<div class="demo-example__lede">
					<interop-content [node]="ledeNode" />
				</div>
			}
			<div class="demo-example__canvas" [class.has-state]="!!state()">
				<div class="demo-example__ui">
					<ng-content />
				</div>
				<div class="demo-example__notes">
					<ng-content select=".demo-example__notes" />
				</div>
				<ng-content select="demo-state" />
			</div>
			<div class="demo-example__code">
				<ng-content select="itx-code-block" />
			</div>
		</div>
	`,
	styleUrl: "./demo-example.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [provideInteropIcons(TablerReload)],
})
export class DemoExample {
	label = input<string | null>(null);
	lede = input<Div | null>(null);

	/**
	 * Page-declared "this example holds state worth resetting" flag. Drives
	 * both the reload button's visibility (for terminal-less examples) and
	 * its enabled state. ORed with the terminal-activity signal — pages with
	 * terminals don't need to set this for the basic case.
	 */
	readonly dirty = input<boolean>(false);

	/**
	 * Emitted when the user clicks the frame-level reload button. The page
	 * should restore any state it owns: clear signals, call `.reset()` on
	 * activation handlers, restore form values, etc. The projected
	 * `<itx-terminal>` (if any) is reset separately by this component, so
	 * pages that only have terminal state can leave `(reset)` unbound.
	 */
	readonly reset = output<void>();

	readonly state = contentChild(DemoState);
	readonly terminal = contentChild(Terminal);

	readonly canReload = computed(
		() => (this.terminal()?.entries().length ?? 0) > 0 || this.dirty(),
	);

	onReload(): void {
		this.reset.emit();
		this.terminal()?.requestReset();
	}
}
