import {
	Component,
	ChangeDetectionStrategy,
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
	provideInteropIcons,
	type PopoverPlacement,
	type TableColumn,
} from 'interop';
import { TablerCaretUp } from "interop/lib/iconsets/tabler/outline/tabler-caret-up";
import { TablerInfoCircle } from "interop/lib/iconsets/tabler/outline/tabler-info-circle";
import { TablerTarget } from "interop/lib/iconsets/tabler/outline/tabler-target";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import {
	DemoNotes,
	type DemoNote,
} from "../../components/demo-notes/demo-notes";

interface ApiEntry {
	component?: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
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
		DemoMasthead,
		DemoSection,
		DemoExample,
		DemoNotes,
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
<button
  interop-button="action"
  [interop-popover-trigger]="basic"
  type="button"
>
  Open panel
</button>
<div #basic="interopPopover" interop-popover>
  <p>Click the trigger again or press <kbd>Esc</kbd> to dismiss.</p>
</div>`;

	readonly builtinArrowHtml = `\
<button
  interop-button="action"
  [interop-popover-trigger]="arrowed"
  type="button"
>
  Show with arrow
</button>
<div #arrowed="interopPopover" interop-popover [showArrow]="true">
  <p>CSS-triangle arrow points at the trigger.</p>
</div>`;

	readonly customArrowHtml = `\
<button
  interop-button="action"
  [interop-popover-trigger]="iconArrow"
  [popoverHaspopup]="'menu'"
  type="button"
>
  More options
</button>
<div
  #iconArrow="interopPopover"
  interop-popover
  placement="bottom-start"
>
  <span interop-popover-arrow>
    <interop-icon name="tabler-caret-up" [size]="14" />
  </span>
  <p>Custom arrow auto-rotates per resolved placement.</p>
</div>`;

	readonly placementHtml = `\
@for (p of placements; track p) {
  <button interop-button itx-size="xs" (click)="showPlacement(p, placedRef)">
    {{ p }}
  </button>
}

<button
  interop-button="action-plus icon"
  [interop-popover-trigger]="placedRef"
>
  Anchor
</button>
<div
  #placedRef="interopPopover"
  interop-popover
  [popoverType]="'manual'"
  [placement]="selectedPlacement()"
  [showArrow]="true"
>
  <p>Placement: <strong>{{ selectedPlacement() }}</strong></p>
</div>`;

	readonly placementTs = `\
import { signal } from '@angular/core';
import { InteropPopover, type PopoverPlacement } from 'interop';

readonly placements: PopoverPlacement[] = [
  'top', 'top-start', 'top-end',
  'bottom', 'bottom-start', 'bottom-end',
  'left', 'left-start', 'left-end',
  'right', 'right-start', 'right-end',
];

readonly selectedPlacement = signal<PopoverPlacement>('bottom');

showPlacement(p: PopoverPlacement, ref: InteropPopover): void {
  this.selectedPlacement.set(p);
  if (!ref.isOpen()) ref.open();
}`;

	readonly modesHtml = `\
<!-- auto: light-dismiss + Escape (default) -->
<button interop-button="action" [interop-popover-trigger]="autoMode">
  auto (light-dismiss)
</button>
<div #autoMode="interopPopover" interop-popover>
  <p>Click outside or press Esc to dismiss.</p>
</div>

<!-- manual: stays open until trigger clicked again -->
<button interop-button="action" [interop-popover-trigger]="manualMode">
  manual (no light-dismiss)
</button>
<div #manualMode="interopPopover" interop-popover [popoverType]="'manual'">
  <p>Stays open until you click the trigger again.</p>
</div>`;

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
			description: "Gap between trigger edge and panel, in pixels.",
		},
		{
			component: "[interop-popover]",
			name: "showArrow",
			type: "boolean",
			default: "false",
			description:
				"Render the built-in CSS-triangle arrow on the panel edge nearest the trigger. Suppressed automatically when an [interop-popover-arrow] marker child is present.",
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

	notes: DemoNote[] = [
		{
			type: "release",
			label: "v0.1.x",
			title: "InteropPopover added",
			body: "Two-directive primitive built on the native HTML popover API. Top-layer promotion and light-dismiss are browser-native; positioning is handled by the same INTEROP_POSITION_STRATEGY infrastructure as InteropTooltip (FloatingUI by default).",
		},
		{
			type: "note",
			label: "Role-agnostic",
			body: "InteropPopover does not assume a role for its content. Set role on the popover element or on a child as appropriate (menu, listbox, region, dialog, etc.). The trigger's aria-haspopup input declares the relationship.",
		},
		{
			type: "note",
			label: "Native popover modes",
			body: "popoverType='auto' is the default and right for menus/dropdowns (light-dismiss + Escape). popoverType='manual' for panels that should NOT auto-dismiss. popoverType='hint' is Chrome 131+ tooltip-mode; it falls back gracefully on unsupported browsers.",
		},
		{
			type: "note",
			label: "Arrow modes",
			body: 'Three modes: no arrow (default), built-in CSS triangle ([showArrow]="true"), or a custom element with [interop-popover-arrow]. The structural CSS positions and auto-rotates a custom arrow per placement, so a single icon (caret-up) reorients correctly for any side.',
		},
	];
}
