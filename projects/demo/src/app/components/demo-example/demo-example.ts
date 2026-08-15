import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	input,
	output,
} from "@angular/core";
import { DemoState } from "../demo-state/demo-state";
import {
	CodeBlock,
	InteropButton,
	InteropIcon,
	InteropMotionTrigger,
	InteropTable,
	provideInteropIcons,
	Terminal,
} from "interop";
import { TablerReload } from "interop/lib/iconsets/tabler/outline/tabler-reload";
import { demoSlug } from "../demo-page/demo-page.registry";

// ─── Example frame ───────────────────────────────────────────────────────────
//
// A demo-example is the canonical subsection frame: an optional heading + a
// projected `[description]`, then content routed into fixed slots by tag:
//
//   default          → preview   (live widgets)
//   <interop-table>  → reference  (token/API tables, unpadded)
//   <itx-code-block> → code
//   <itx-terminal>   → output
//
// Authors drop the pieces in any order; the frame owns the layout.
//
// ─── Reload-button semantics ─────────────────────────────────────────────────
//
// The reload button is a frame-level affordance that resets any stateful surface
// inside the example. It is shown when there is a credible reset target (a
// projected terminal, or a `[dirty]` example) and enabled when there is actually
// something to reset. Clicking emits `(reset)` — the page restores state it owns
// (signals, `handler.reset()`) — and also calls `terminal()?.requestReset()` so
// a projected terminal's own `(reset)` still fires for pages that bind it there.
//
@Component({
	selector: "demo-example",
	standalone: true,
	imports: [InteropButton, InteropIcon, InteropMotionTrigger],
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
				<interop-icon name="tabler-reload" itx-size="lg" />
			</button>
		}
		<hgroup class="demo-example__head">
			@if (label()) {
				<h3 [id]="resolvedId()" class="demo-example__heading">{{ label() }}</h3>
			}
			<ng-content select="[description]" />
		</hgroup>
		<!-- itx-layer, not just a raised colour: painting one step up with a token
		     leaves everything inside still resolving against the page, so a field
		     asking for --itx-surface-below would land on the frame's own colour.
		     Declaring the layer is what makes the contents relative to the frame. -->
		<div class="demo-example__preview" itx-layer>
			<ng-content />
			<!-- Own slot, wrapped in an element this component owns. A projected
			     node carries the *page's* encapsulation attribute, so
			     demo-example's stylesheet cannot select <demo-state> directly —
			     it can only style a wrapper of its own. -->
			@if (state()) {
				<div class="demo-example__state"><ng-content select="demo-state" /></div>
			}
		</div>
		@if (table()) {
			<div class="demo-example__reference">
				<ng-content select="interop-table" />
			</div>
		}
		@if (codeBlock()) {
			<div class="demo-example__code" itx-layer>
				<ng-content select="itx-code-block" />
			</div>
		}
		@if (terminal()) {
			<div class="demo-example__output">
				<ng-content select="itx-terminal" />
			</div>
		}
	`,
	styleUrl: "./demo-example.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [provideInteropIcons(TablerReload)],
})
export class DemoExample {
	readonly label = input<string | null>(null);

	/**
	 * Page-declared "this example holds state worth resetting" flag. Drives both
	 * the reload button's visibility (for terminal-less examples) and its enabled
	 * state. ORed with the terminal-activity signal.
	 */
	readonly dirty = input<boolean>(false);

	/** Emitted when the frame-level reload button is clicked. */
	readonly reset = output<void>();

	readonly resolvedId = computed(() =>
		this.label() ? demoSlug(this.label()!) : null,
	);

	readonly state = contentChild(DemoState);
	readonly terminal = contentChild(Terminal);
	readonly codeBlock = contentChild(CodeBlock);
	readonly table = contentChild(InteropTable);

	readonly canReload = computed(
		() => (this.terminal()?.entries().length ?? 0) > 0 || this.dirty(),
	);

	onReload(): void {
		this.reset.emit();
		this.terminal()?.requestReset();
	}
}
