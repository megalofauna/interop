import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import {
	InteropResizable,
	InteropTable,
	InteropCellDef,
	InteropExpansionPanel,
	InteropExpansionTrigger,
	InteropExpansionBody,
	CodeBlock,
	Terminal,
	type ResizableDimensions,
	type TableColumn,
	type CodeFile,
	type TerminalEntry,
} from 'interop';
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";

interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
}

@Component({
	selector: "resizable-page",
	standalone: true,
	imports: [
		InteropResizable,
		InteropTable,
		InteropCellDef,
		InteropExpansionPanel,
		InteropExpansionTrigger,
		InteropExpansionBody,
		CodeBlock,
		Terminal,
		DemoPage,
		DemoMasthead,
		DemoSection,
		DemoExample,
		DemoNotes,
	],
	templateUrl: "./resizable-page.html",
	styleUrl: "./resizable-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResizablePage {
	// ── Enhanced example — resize log + reset ────────────────────────────────
	readonly resizeLog = signal<TerminalEntry[]>([]);

	onEnhancedResizeEnd(dims: ResizableDimensions): void {
		this.resizeLog.update((log) => [
			...log,
			{
				text: `${Math.round(dims.width)} × ${Math.round(dims.height)}`,
				time: Date.now(),
			},
		]);
	}

	/** Standard frame reset: return the widget to its initial size and clear
	 * the log. Called by the demo-example's frame-level reload button. */
	resetEnhanced(frame: InteropResizable): void {
		frame.reset();
		this.resizeLog.set([]);
	}

	// ── Code samples ─────────────────────────────────────────────────────────
	private readonly nativeHtml = `<div interop-resizable
     [initialSize]="{ width: 360, height: 220 }"
     [min]="{ width: 200, height: 120 }"
     [max]="{ width: 720, height: 480 }">
  <!-- your content -->
</div>`;

	private readonly enhancedHtml = `<div #frame="interopResizable"
     interop-resizable
     [initialSize]="{ width: 480, height: 280 }"
     [breakpoints]="[320, 480, 640, 768]"
     [showDimensions]="true"
     [keyboard]="true"
     (resizeEnd)="onResizeEnd($event)">
  <!-- your content -->
</div>`;

	private readonly enhancedTs = `onResizeEnd(dims: ResizableDimensions): void {
  this.lastSize.set(dims.width + ' × ' + dims.height);
}`;

	private readonly aspectHtml = `<div interop-resizable
     [initialSize]="{ width: 480, height: 270 }"
     [aspectLocked]="true"
     [showDimensions]="true">
  <!-- your content -->
</div>`;

	readonly nativeFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.nativeHtml },
	];

	readonly enhancedFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.enhancedHtml },
		{ label: "component.ts", language: "ts", code: this.enhancedTs },
	];

	readonly aspectFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.aspectHtml },
	];

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ name: "axis", type: "'horizontal' | 'vertical' | 'both'", default: "'both'", description: "Resize axis. Maps to CSS resize in Tier 0; constrains the corner handle in Tier 1." },
		{ name: "min", type: "{ width?, height? }", default: "null", description: "Minimum size in pixels per axis." },
		{ name: "max", type: "{ width?, height? }", default: "null", description: "Maximum size in pixels per axis." },
		{ name: "initialSize", type: "{ width?, height? }", default: "null", description: "Initial size applied once on mount. Also the target of reset()." },
		{ name: "containerType", type: "'inline-size' | 'size' | 'normal'", default: "'inline-size'", description: "CSS container-type on the host. Default makes the resized element a CQ container." },
		{ name: "breakpoints", type: "number[]", default: "null", description: "Magnetic snap targets (width axis). Setting this implicitly activates Tier 1." },
		{ name: "showDimensions", type: "boolean", default: "false", description: "Render a W × H badge during drag. Activates Tier 1." },
		{ name: "aspectLocked", type: "boolean", default: "false", description: "Lock aspect ratio during drag. Shift while dragging temporarily toggles. Activates Tier 1." },
		{ name: "liveResize", type: "boolean", default: "false", description: "Fire (resize) mid-drag (rAF-throttled). Off by default to keep CD pressure low. Activates Tier 1." },
		{ name: "keyboard", type: "boolean", default: "false", description: "Enable APG separator keyboard contract on the corner handle. Activates Tier 1." },
		{ name: "keyboardStep", type: "number", default: "16", description: "Pixels per arrow-key press." },
		{ name: "keyboardLargeStep", type: "number", default: "64", description: "Pixels per Shift+arrow press." },
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{ name: "resizeStart", type: "void", default: "", description: "Fires when a Tier 1 drag begins. Tier 0 has no drag-start signal." },
		{ name: "resize", type: "{ width, height }", default: "", description: "Fires on every resize via ResizeObserver in both tiers. Mid-drag emission requires liveResize=true." },
		{ name: "resizeEnd", type: "{ width, height }", default: "", description: "Fires when a Tier 1 drag (or keyboard press) settles." },
	];

	notes: DemoNote[] = [
		{
			type: "release",
			label: "v0.1.x",
			title: "InteropResizable directive added",
			body: "Drag-to-resize wrapper with implicit two-tier upgrade. Pure CSS by default; keyboard/snap/readout/aspect-lock activate when their inputs are set.",
		},
		{
			type: "note",
			label: "Performance",
			body: "Tier 0 has zero JS in the resize loop — the browser owns it natively. Tier 1 writes inline styles directly without invoking Angular change detection; outputs only fire on resize end (or rAF-throttled during drag with liveResize=true).",
		},
		{
			type: "note",
			label: "Keyboard contract",
			body: "When [keyboard]=\"true\", the corner handle gets role=\"separator\" and follows the APG keyboard model: arrows step the size (Shift = larger step), Home jumps to min, End jumps to max. Width and height are reported via aria-valuenow / aria-valuemin / aria-valuemax.",
		},
	];
}
