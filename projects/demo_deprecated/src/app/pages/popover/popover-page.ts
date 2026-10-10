import {
	Component,
	ChangeDetectionStrategy,
	computed,
	signal,
} from "@angular/core";
import {
	InteropPopover,
	InteropPopoverTrigger,
	InteropPopoverArrow,
	InteropButton,
	InteropIcon,
	InteropTable,
	InteropCellDef,
	CodeBlock,
	provideInteropIcons,
	type CodeFile,
	type PopoverPlacement,
	type TableColumn,
} from "interop";
import { TablerCaretUp } from "interop/lib/iconsets/tabler/outline/tabler-caret-up";
import { TablerInfoCircle } from "interop/lib/iconsets/tabler/outline/tabler-info-circle";
import { TablerTarget } from "interop/lib/iconsets/tabler/outline/tabler-target";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";

interface ApiEntry {
	component?: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

interface TokenEntry {
	property: string;
	default: string;
}

@Component({
	selector: "popover-page",
	standalone: true,
	imports: [
		InteropPopover,
		InteropPopoverTrigger,
		InteropPopoverArrow,
		InteropButton,
		InteropIcon,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoPage,
		DemoMasthead,
		DemoSection,
		DemoExample,
	],
	providers: [
		provideInteropIcons(TablerCaretUp, TablerInfoCircle, TablerTarget),
	],
	templateUrl: "./popover-page.html",
	styleUrl: "./popover-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopoverPage {
	readonly placements: PopoverPlacement[] = [
		"top-end",
		"top",
		"top-start",
		"right-end",
		"right",
		"right-start",
		"bottom-end",
		"bottom",
		"bottom-start",
		"left-end",
		"left",
		"left-start",
	];

	readonly selectedPlacement = signal<PopoverPlacement>("bottom");

	showPlacement(p: PopoverPlacement, ref: InteropPopover): void {
		this.selectedPlacement.set(p);
		if (!ref.isOpen()) ref.open();
	}

	// ── Code snippets ────────────────────────────────────────────────────────

	readonly basicHtml = `\
<button interop-button="primary" [interop-popover-trigger]="basic" type="button">
  Open panel
</button>

<div #basic="interopPopover" interop-popover>
  <p>Click the trigger again or press <kbd>Esc</kbd> to dismiss.</p>
</div>`;

	readonly builtinArrowHtml = `\
<button interop-button="primary" [interop-popover-trigger]="arrowed" type="button">
  Show with arrow
</button>

<div #arrowed="interopPopover" interop-popover [showArrow]="true">
  <p>A 12 × 6 caret, bordered to match the panel frame.</p>
</div>`;

	readonly customArrowHtml = `\
<button
  interop-button="primary"
  [interop-popover-trigger]="iconArrow"
  [popoverHaspopup]="'menu'"
  type="button"
>
  More options
</button>

<div #iconArrow="interopPopover" interop-popover placement="bottom-start">
  <span interop-popover-arrow>
    <interop-icon name="tabler-caret-up" [size]="14" />
  </span>
  <p>Custom arrow auto-rotates per resolved placement.</p>
</div>`;

	readonly customArrowTs = `\
@Component({
  providers: [provideInteropIcons(TablerCaretUp)],
  imports: [InteropPopover, InteropPopoverTrigger, InteropPopoverArrow, InteropIcon],
  // …
})
export class Example {}`;

	readonly customArrowFiles = computed<CodeFile[]>(() => [
		{ label: "template.html", language: "html", code: this.customArrowHtml },
		{ label: "component.ts", language: "ts", code: this.customArrowTs },
	]);

	readonly placementHtml = `\
<div class="placement-grid">
  @for (p of placements; track p) {
    <button
      interop-button="icon"
      itx-size="xs"
      [attr.aria-label]="p"
      (click)="showPlacement(p, placedRef)"
      type="button"
    >
      <interop-icon name="tabler-target" [size]="16" />
    </button>
  }

  <button
    interop-button="primary icon"
    [interop-popover-trigger]="placedRef"
    aria-label="Anchor"
    type="button"
  >
    <interop-icon name="tabler-info-circle" [size]="16" />
  </button>
</div>

<div
  #placedRef="interopPopover"
  interop-popover
  [popoverType]="'manual'"
  [placement]="selectedPlacement()"
  [showArrow]="true"
>
  Placement: <strong>{{ selectedPlacement() }}</strong>
</div>`;

	readonly placementTs = `\
readonly placements: PopoverPlacement[] = [
  'top-end',    'top',    'top-start',
  'right-end',  'right',  'right-start',
  'bottom-end', 'bottom', 'bottom-start',
  'left-end',   'left',   'left-start',
];

readonly selectedPlacement = signal<PopoverPlacement>('bottom');

showPlacement(p: PopoverPlacement, ref: InteropPopover): void {
  this.selectedPlacement.set(p);
  if (!ref.isOpen()) ref.open();
}`;

	readonly placementFiles = computed<CodeFile[]>(() => [
		{ label: "template.html", language: "html", code: this.placementHtml },
		{ label: "component.ts", language: "ts", code: this.placementTs },
	]);

	readonly modesHtml = `\
<!-- auto: light-dismiss + Escape (default) -->
<button interop-button="primary" [interop-popover-trigger]="autoMode" type="button">
  auto (light-dismiss)
</button>
<div #autoMode="interopPopover" interop-popover>
  <p>Click outside or press <kbd>Esc</kbd> to dismiss.</p>
</div>

<!-- manual: stays open until the trigger is clicked again -->
<button interop-button="secondary" [interop-popover-trigger]="manualMode" type="button">
  manual (no light-dismiss)
</button>
<div #manualMode="interopPopover" interop-popover [popoverType]="'manual'">
  <p>Stays open until you click the trigger again.</p>
</div>`;

	// ── In-section notes ─────────────────────────────────────────────────────

	// ── CSS tokens ───────────────────────────────────────────────────────────

	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		{ property: "--itx-popover-min-width", default: "0" },
		{
			property: "--itx-popover-max-width",
			default: "min(90vw, 23rem) — 368px cap",
		},
		{ property: "--itx-popover-max-height", default: "70vh" },
		{
			property: "--itx-popover-padding",
			default: "var(--itx-spacing-4) — 16px",
		},
		{ property: "--itx-popover-font-size", default: "0.875rem — 14px" },
		{ property: "--itx-popover-line-height", default: "1.4286 — 20px at 14px" },
		{
			property: "--itx-popover-background",
			default: "var(--itx-surface-above)",
		},
		{ property: "--itx-popover-foreground", default: "var(--itx-role-text)" },
		{
			property: "--itx-popover-border-radius",
			default: "var(--itx-radius-none) — 0",
		},
		{ property: "--itx-popover-border-width", default: "1px" },
		{ property: "--itx-popover-border-style", default: "solid" },
		{
			property: "--itx-popover-border-color",
			default: "var(--itx-role-edge)",
		},
		{
			property: "--itx-popover-shadow",
			default: "0 2px 2px oklch(0 0 0 / 0.2)",
		},
		{
			property: "--itx-popover-enter-duration",
			default: "var(--itx-duration-fast)",
		},
		{
			property: "--itx-popover-exit-duration",
			default: "var(--itx-duration-fast)",
		},
		{
			property: "--itx-popover-enter-easing",
			default: "var(--itx-easing-decelerate)",
		},
		{
			property: "--itx-popover-exit-easing",
			default: "var(--itx-easing-accelerate)",
		},
		{ property: "--itx-popover-enter-translate", default: "0 -0.25rem" },
		{ property: "--itx-popover-exit-translate", default: "0 -0.25rem" },
		{
			property: "--itx-popover-arrow-size",
			default: "6px — half-width and depth, so a 12 × 6 caret",
		},
		{
			property: "--itx-popover-arrow-color",
			default: "unset — resolves --itx-popover-background at the panel",
		},
		{
			property: "--itx-popover-arrow-border-color",
			default: "unset — resolves --itx-popover-border-color at the panel",
		},
		{
			property: "--itx-popover-arrow-offset",
			default: "0px — positive moves the arrow into the panel",
		},
		{
			property: "--itx-backdrop-color",
			default: "var(--itx-overlay) — global, shared with dialog",
		},
		{ property: "--itx-backdrop-blur", default: "0px — global" },
	];

	// ── API ──────────────────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Directive", sticky: true },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			component: "[interop-popover]",
			name: "popoverType",
			type: "'auto' | 'manual' | 'hint'",
			default: "'auto'",
			description:
				"Native popover mode. `auto` gets light-dismiss; `manual` is programmatic-only; `hint` is Chrome 131+ tooltip-mode (degrades to ignored attribute on unsupported browsers).",
		},
		{
			component: "[interop-popover]",
			name: "placement",
			type: "PopoverPlacement",
			default: "'bottom'",
			description:
				"Preferred placement of the panel relative to the trigger. Values: top, top-start, top-end, bottom, bottom-start, bottom-end, left*, right* — 12 total.",
		},
		{
			component: "[interop-popover]",
			name: "offset",
			type: "number",
			default: "8",
			description:
				"Gap between trigger edge and panel, in pixels. With [showArrow] the 6px caret eats most of it — Carbon uses 10 for its equivalent.",
		},
		{
			component: "[interop-popover]",
			name: "showArrow",
			type: "boolean",
			default: "false",
			description:
				"Render the built-in caret on the panel edge nearest the trigger. Suppressed automatically when an [interop-popover-arrow] marker child is present.",
		},
		{
			component: "[interop-popover]",
			name: "showBackdrop",
			type: "boolean",
			default: "false",
			description:
				"Render an opt-in backdrop behind the panel (consumes global --itx-backdrop-* tokens).",
		},
		{
			component: "[interop-popover]",
			name: "autoFocus",
			type: "string | 'first-focusable' | null",
			default: "null",
			description:
				"CSS selector for an element to focus on open. Use 'first-focusable' for menus/command palettes; null for non-modal info panels (focus stays on trigger).",
		},
		{
			component: "[interop-popover-trigger]",
			name: "interop-popover-trigger",
			type: "InteropPopover | null",
			default: "null",
			description:
				'The popover this trigger controls. Bind via a template ref: `#ref="interopPopover"` on the popover, then `[interop-popover-trigger]="ref"` on the trigger.',
			required: true,
		},
		{
			component: "[interop-popover-trigger]",
			name: "popoverHaspopup",
			type: "'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | boolean | null",
			default: "null",
			description:
				"Value for `aria-haspopup`. Set per popover content semantics. When unset, no aria-haspopup is emitted.",
		},
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Directive", sticky: true },
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{
			component: "[interop-popover]",
			name: "opened",
			type: "void",
			default: "",
			description: "Emits when the panel becomes visible.",
		},
		{
			component: "[interop-popover]",
			name: "closed",
			type: "PopoverClosedEvent",
			default: "",
			description:
				"Emits when the panel hides. Reason: 'light-dismiss' | 'programmatic' | 'trigger'.",
		},
	];

	methodColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Directive", sticky: true },
		{ key: "name", label: "Method" },
		{ key: "type", label: "Signature" },
		{ key: "description", label: "Description" },
	];

	methodEntries: ApiEntry[] = [
		{
			component: "[interop-popover]",
			name: "open",
			type: "(): void",
			default: "",
			description: "Open the panel programmatically. Idempotent.",
		},
		{
			component: "[interop-popover]",
			name: "close",
			type: "(): void",
			default: "",
			description:
				"Close the panel programmatically. The (closed) reason is 'programmatic'.",
		},
		{
			component: "[interop-popover]",
			name: "toggle",
			type: "(): void",
			default: "",
			description: "Toggle the panel.",
		},
		{
			component: "[interop-popover]",
			name: "isOpen",
			type: "Signal<boolean>",
			default: "",
			description:
				"True while the panel is open. Read by the trigger to drive aria-expanded.",
		},
	];
}
