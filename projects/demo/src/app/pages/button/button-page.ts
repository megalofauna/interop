import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import {
	InteropButton,
	InteropButtonPrefix,
	InteropButtonSuffix,
	InteropIcon,
	InteropTable,
	InteropCellDef,
	CodeBlock,
	Terminal,
	provideInteropIcons,
	type TableColumn,
	type TableGroupRow,
	type TerminalEntry,
	type CodeFile,
} from "interop";
import { createActivationHandler } from "interop/lib/utils/activation";
import { TablerDownload } from "interop/lib/iconsets/tabler/outline/tabler-download";
import { TablerChevronRight } from "interop/lib/iconsets/tabler/outline/tabler-chevron-right";
import { TablerPlus } from "interop/lib/iconsets/tabler/outline/tabler-plus";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

interface ApiEntry {
	component: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

interface AttributeEntry {
	name: string;
	type: string;
	default: string;
	description: string;
}

interface AvailabilityEntry {
	state: string;
	disabledAttr: string;
	ariaDisabled: string;
	ariaBusy: string;
	tabOrder: string;
}

type TokenEntry = TableGroupRow | { property: string; default: string };

@Component({
	selector: "button-page",
	standalone: true,
	imports: [
		InteropButton,
		InteropButtonPrefix,
		InteropButtonSuffix,
		InteropIcon,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		Terminal,
		DemoPage,
		DemoSection,
		DemoExample,
		DemoMasthead,
	],
	templateUrl: "./button-page.html",
	styleUrl: "./button-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		provideInteropIcons(TablerDownload, TablerChevronRight, TablerPlus),
	],
})
export class ButtonPage {
	// ── Throttle demo ────────────────────────────────────────────────────────
	throttleLog = signal<TerminalEntry[]>([]);

	readonly throttledHandler = createActivationHandler(
		() =>
			this.throttleLog.update((log) => [
				...log,
				{ text: "fired", time: Date.now() },
			]),
		{ throttleMs: 1000 },
	);

	onThrottleClick() {
		this.throttleLog.update((log) => [
			...log,
			{ text: "click received", time: Date.now() },
		]);
		this.throttledHandler(undefined);
	}

	resetThrottleExample() {
		this.throttledHandler.reset();
		this.throttleLog.set([]);
	}

	// ── Debounce demo ────────────────────────────────────────────────────────
	debounceLog = signal<TerminalEntry[]>([]);

	readonly debouncedHandler = createActivationHandler(
		() =>
			this.debounceLog.update((log) => [
				...log,
				{ text: "fired — debounce settled", time: Date.now() },
			]),
		{ debounceMs: 600 },
	);

	onDebounceClick() {
		this.debounceLog.update((log) => [
			...log,
			{ text: "click received", time: Date.now() },
		]);
		this.debouncedHandler(undefined);
	}

	resetDebounceExample() {
		this.debouncedHandler.reset();
		this.debounceLog.set([]);
	}

	// ── Reentrancy demo ──────────────────────────────────────────────────────
	reentrantActive = signal(false);
	reentrantLog = signal<TerminalEntry[]>([]);

	readonly reentrantHandler = createActivationHandler(
		async () => {
			this.reentrantActive.set(true);
			this.reentrantLog.update((log) => [
				...log,
				{ text: "handler started", time: Date.now() },
			]);
			await new Promise((r) => setTimeout(r, 2000));
			this.reentrantLog.update((log) => [
				...log,
				{ text: "handler complete", time: Date.now() },
			]);
			this.reentrantActive.set(false);
		},
		{
			reentrant: false,
			onStart: () => {},
		},
	);

	onReentrantClick() {
		if (this.reentrantActive()) {
			this.reentrantLog.update((log) => [
				...log,
				{ text: "blocked — already running", time: Date.now() },
			]);
		}
		this.reentrantHandler(undefined);
	}

	resetReentrantExample() {
		// `reset()` releases the reentrancy lock so the next click is accepted
		// even if the 2s async handler is still in flight. The orphaned promise
		// still resolves, but `reentrantActive` is force-cleared here so the
		// button label flips back to "Submit order" immediately.
		this.reentrantHandler.reset();
		this.reentrantActive.set(false);
		this.reentrantLog.set([]);
	}

	// ── Code snippets ────────────────────────────────────────────────────────
	readonly sizeCode = `<button interop-button itx-size="xs">Extra small</button>
<button interop-button itx-size="sm">Small</button>
<button interop-button itx-size="md">Medium</button>
<button interop-button itx-size="lg">Large</button>
<button interop-button itx-size="xl">Extra large</button>`;

	readonly radiusCode = `<button interop-button itx-radius="none">None</button>
<button interop-button itx-radius="nominal">Nominal</button>
<button interop-button itx-radius="sm">Small</button>
<button interop-button itx-radius="md">Medium</button>
<button interop-button itx-radius="lg">Large</button>
<button interop-button itx-radius="xl">Extra large</button>
<button interop-button itx-radius="full">Full</button>`;

	readonly variantCss = `/* A variant is a bundle of button custom properties under a name.
   Any token left unset inherits from the base. */
:where([interop-button~="interop-demo"]) {
  --itx-button-background: hsl(250 60% 55%);
  --itx-button-foreground: white;
  --itx-button-border-color: hsl(250 60% 45%);

  --itx-button-background-hover: hsl(250 60% 60%);
  --itx-button-background-active: hsl(250 60% 50%);
}`;

	readonly variantHtml = `<!-- Shipped by the protocol theme -->
<button interop-button="tertiary">Tertiary</button>
<button interop-button="secondary">Secondary</button>
<button interop-button="primary">Primary</button>

<!-- Declared in this page's stylesheet — see the CSS tab -->
<button interop-button="interop-demo">Custom</button>`;

	// ── Addon slot snippets ──────────────────────────────────────────────────
	readonly addonHtml = `<!-- Leading icon alongside a visible label -->
<button interop-button="primary">
  <interop-button-prefix>
    <interop-icon name="tabler-download" aria-hidden="true" />
  </interop-button-prefix>
  Download
</button>

<!-- Trailing icon -->
<button interop-button="tertiary">
  Next
  <interop-button-suffix>
    <interop-icon name="tabler-chevron-right" aria-hidden="true" />
  </interop-button-suffix>
</button>

<!-- Icon-only: the host carries the accessible name, the icon is left alone -->
<button interop-button="primary icon" aria-label="Add item">
  <interop-button-prefix>
    <interop-icon name="tabler-plus" />
  </interop-button-prefix>
</button>`;

	readonly throttleCode = `readonly handler = createActivationHandler(
  () => this.save(),
  { throttleMs: 1000 }
);`;

	readonly debounceCode = `readonly handler = createActivationHandler(
  () => this.search(),
  { debounceMs: 600 }
);`;

	readonly reentrantCode = `readonly handler = createActivationHandler(
  async () => {
    await this.submitForm();
  },
  { reentrant: false }
);`;

	// ── Availability snippets ────────────────────────────────────────────────
	readonly disabledCode = `<button interop-button [disabled]="true">Save</button>`;

	readonly focusableDisabledCode = `<button interop-button [disabled]="true" [focusableWhenDisabled]="true">Save</button>`;

	readonly loadingHtml = `<button interop-button [loading]="saving()" loadingText="Saving…">Save</button>`;

	readonly loadingTs = `readonly saving = signal(false);

async save() {
  this.saving.set(true);
  await this.persist();
  this.saving.set(false);
}`;

	// ── Size theming snippet ─────────────────────────────────────────────────
	readonly sizeOverrideCss = `/* Every size is one token — retune a height directly. */
[interop-button][itx-size="md"] {
  --itx-button-height: 2.75rem;
}

/* Or set a height on any button, no size attribute required. */
[interop-button].compact {
  --itx-button-height: 1.75rem;
}`;

	// ── Activation template snippets ─────────────────────────────────────────
	readonly throttleHtml = `<button interop-button [onActivate]="handler">Load more</button>`;
	readonly debounceHtml = `<button interop-button [onActivate]="handler">Recalculate</button>`;
	readonly reentrantHtml = `<button interop-button [onActivate]="handler">Place order</button>`;

	// ── Tabbed multi-file code blocks ────────────────────────────────────────
	readonly sizeFiles: CodeFile[] = [
		{ label: "markup.html", language: "html", code: this.sizeCode },
		{ label: "theming.css", language: "css", code: this.sizeOverrideCss },
	];

	readonly variantFiles: CodeFile[] = [
		{ label: "markup.html", language: "html", code: this.variantHtml },
		{ label: "styles.css", language: "css", code: this.variantCss },
	];

	readonly loadingFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.loadingHtml },
		{ label: "component.ts", language: "ts", code: this.loadingTs },
	];

	readonly throttleFiles: CodeFile[] = [
		{ label: "component.ts", language: "ts", code: this.throttleCode },
		{ label: "template.html", language: "html", code: this.throttleHtml },
	];

	readonly debounceFiles: CodeFile[] = [
		{ label: "component.ts", language: "ts", code: this.debounceCode },
		{ label: "template.html", language: "html", code: this.debounceHtml },
	];

	readonly reentrantFiles: CodeFile[] = [
		{ label: "component.ts", language: "ts", code: this.reentrantCode },
		{ label: "template.html", language: "html", code: this.reentrantHtml },
	];

	// ── Availability table ───────────────────────────────────────────────────
	availabilityColumns: TableColumn<AvailabilityEntry>[] = [
		{ key: "state", label: "State" },
		{ key: "disabledAttr", label: "disabled" },
		{ key: "ariaDisabled", label: "aria-disabled" },
		{ key: "ariaBusy", label: "aria-busy" },
		{ key: "tabOrder", label: "In tab order" },
	];

	availabilityEntries: AvailabilityEntry[] = [
		{
			state: "disabled (default)",
			disabledAttr: "✓",
			ariaDisabled: "—",
			ariaBusy: "—",
			tabOrder: "No",
		},
		{
			state: "disabled, focusable",
			disabledAttr: "—",
			ariaDisabled: "true",
			ariaBusy: "—",
			tabOrder: "Yes",
		},
		{
			state: "loading",
			disabledAttr: "—",
			ariaDisabled: "true",
			ariaBusy: "true",
			tabOrder: "Yes",
		},
	];

	// ── Token table ──────────────────────────────────────────────────────────
	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		{ groupLabel: "Sizing" },
		{
			property: "--itx-button-height",
			default: "2.5rem — 40px (the md step)",
		},
		{
			property: "--itx-button-padding-inline",
			default: "var(--itx-spacing-4) — 16px, constant at every size",
		},
		{
			property: "--itx-button-padding-block",
			default: "derived — (height − 1em) / 2; set it to bypass",
		},
		{
			property: "--itx-button-gap",
			default: "var(--itx-spacing-2) — 8px",
		},

		{ groupLabel: "Layout" },
		{ property: "--itx-button-display", default: "inline-flex" },
		{ property: "--itx-button-align-items", default: "center" },
		{ property: "--itx-button-justify-content", default: "flex-start" },
		{ property: "--itx-button-width", default: "auto" },
		{ property: "--itx-button-min-width", default: "max-content" },
		{
			property: "--itx-button-max-width",
			default: "var(--itx-spacing-80) — 320px",
		},
		{ property: "--itx-button-flex", default: "1 1 auto" },

		{ groupLabel: "Typography" },
		{
			property: "--itx-button-font-family",
			default: "var(--itx-font-family-sans)",
		},
		{
			property: "--itx-button-font-size",
			default: "0.875rem — 14px (1rem — 16px at xl)",
		},
		{ property: "--itx-button-font-weight", default: "400" },
		{
			property: "--itx-button-line-height",
			default: "1 — the padding derivation measures against 1em",
		},

		{ groupLabel: "Edge" },
		{ property: "--itx-button-border-width", default: "1px" },
		{ property: "--itx-button-border-style", default: "solid" },
		{
			property: "--itx-button-radius-default",
			default: "var(--itx-radius-none) — 0; itx-radius overrides it",
		},
		{ property: "--itx-button-corner-shape", default: "unset (round at full)" },

		{ groupLabel: "Transition" },
		{
			property: "--itx-button-transition-properties",
			default: "background-color, border-color, box-shadow",
		},
		{
			property: "--itx-button-transition-duration",
			default: "var(--itx-duration-fast) — 100ms",
		},
		{
			property: "--itx-button-transition-timing-function",
			default: "var(--itx-easing-decelerate) — cubic-bezier(0, 0, 0.2, 1)",
		},

		{ groupLabel: "Rest" },
		{ property: "--itx-button-background", default: "var(--itx-neutral-5)" },
		{ property: "--itx-button-foreground", default: "var(--itx-neutral-12)" },
		{ property: "--itx-button-border-color", default: "transparent" },
		{ property: "--itx-button-box-shadow", default: "none" },

		{ groupLabel: "Hover" },
		{
			property: "--itx-button-background-hover",
			default: "var(--itx-neutral-6)",
		},
		{
			property: "--itx-button-foreground-hover",
			default: "unset — falls back to --itx-button-foreground",
		},
		{
			property: "--itx-button-border-color-hover",
			default: "unset — falls back to --itx-button-border-color",
		},

		{ groupLabel: "Active" },
		{
			property: "--itx-button-background-active",
			default: "var(--itx-neutral-7)",
		},
		{
			property: "--itx-button-foreground-active",
			default: "unset — falls back to --itx-button-foreground",
		},
		{
			property: "--itx-button-border-color-active",
			default: "unset — falls back to --itx-button-border-color",
		},

		{ groupLabel: "Focus outline" },
		{ property: "--itx-button-outline-width", default: "2px" },
		{ property: "--itx-button-outline-style", default: "solid" },
		{
			property: "--itx-button-outline-color",
			default: "var(--itx-colorway-7)",
		},
		{ property: "--itx-button-outline-offset", default: "2px" },

		{ groupLabel: "Disabled" },
		{
			property: "--itx-button-disabled-opacity",
			default: "0.4 — 1 on primary / secondary / tertiary",
		},
	];

	// ── Attributes table ─────────────────────────────────────────────────────
	attributeColumns: TableColumn<AttributeEntry>[] = [
		{ key: "name", label: "Attribute", sticky: true },
		{ key: "type", label: "Values" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	attributeEntries: AttributeEntry[] = [
		{
			name: "interop-button",
			type: '"" | "primary" | "secondary" | "tertiary" | "icon" | "grow"',
			default: '""',
			description:
				'Identity and variant. Matched with ~= (word match), so tokens compose — interop-button="primary icon" is valid. icon squares the box; grow releases the max-width so the button fills its track.',
		},
		{
			name: "itx-size",
			type: '"xs" | "sm" | "md" | "lg" | "xl"',
			default: '"md"',
			description:
				"Sets --itx-button-height only — 24 / 32 / 40 / 48 / 64px. The label and side padding are constant across the scale; xl alone also raises the font-size to 16px.",
		},
		{
			name: "itx-radius",
			type: '"none" | "nominal" | "sm" | "md" | "lg" | "xl" | "full"',
			default: '"none"',
			description:
				"System-wide radius attribute from tokens/shape.css, not a button-specific one. Resolves the semantic scale onto --itx-radius; full also switches corner-shape to round so the ends form a stadium.",
		},
	];

	// ── API table ────────────────────────────────────────────────────────────
	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Directive", sticky: true },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			component: "InteropButton",
			name: "loading",
			type: "boolean",
			default: "false",
			description:
				"Replaces button content with loadingText, sets aria-busy, and suppresses interaction. Never applies the native disabled attribute — the button stays focusable.",
		},
		{
			component: "InteropButton",
			name: "loadingText",
			type: "string",
			default: "'Loading...'",
			description: "Text shown when loading is true.",
		},
		{
			component: "InteropButton",
			name: "disabled",
			type: "boolean",
			default: "false",
			description:
				"Applies the native disabled attribute and removes the button from the tab order.",
		},
		{
			component: "InteropButton",
			name: "focusableWhenDisabled",
			type: "boolean",
			default: "false",
			description:
				"Substitutes aria-disabled for the native attribute, keeping the button in the tab order while interaction stays blocked.",
		},
		{
			component: "InteropButton",
			name: "type",
			type: "'button' | 'submit' | 'reset'",
			default: "'button'",
			description:
				'Native button type. Not currently bound to the host — set type="submit" on the <button> directly.',
		},
		{
			component: "InteropButtonActivation",
			name: "onActivate",
			type: "ActivationHandler | null",
			default: "null",
			description:
				"Handler function called on click. Enables activation guardrails when provided.",
		},
		{
			component: "InteropButtonActivation",
			name: "activationOptions",
			type: "ActivationOptions",
			default: "{}",
			description:
				"Guardrail options: debounceMs, throttleMs, reentrant, once.",
		},
		{
			component: "InteropButtonActivation",
			name: "activationId",
			type: "string | null",
			default: "null",
			description:
				"Cross-component trigger ID. Activates all handlers registered under this ID via InteropActivation.",
		},
		{
			component: "InteropButtonActivation",
			name: "payload",
			type: "unknown",
			default: "undefined",
			description:
				"Value passed to the handler or broadcast with the activation event.",
		},
	];
}
