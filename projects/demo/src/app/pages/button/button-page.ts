import {
	Component,
	ChangeDetectionStrategy,
	signal,
} from "@angular/core";
import {
	InteropButton,
	InteropTable,
	InteropCellDef,
	CodeBlock,
	Terminal,
	type TableColumn,
	type TableGroupRow,
	type TerminalEntry,
	type CodeFile,
} from "interop";
import { createActivationHandler } from "interop/lib/utils/activation";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
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
	styleUrl: "./button-page.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
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
<button interop-button="default" itx-size="md">Medium</button>
<button interop-button itx-size="lg">Large</button>
<button interop-button itx-size="xl">Extra large</button>`;

	readonly radiusCode = `<button interop-button itx-radius="none">None</button>
<button interop-button itx-radius="nominal">Nominal</button>
<button interop-button="default" itx-radius="sm">Small</button>
<button interop-button itx-radius="md">Medium</button>
<button interop-button itx-radius="lg">Large</button>
<button interop-button itx-radius="xl">Extra large</button>
<button interop-button itx-radius="full">Full</button>`;

	readonly variantCss = `:where([interop-button~="interop-demo"]) {
  --itx-button-background: hsl(250 60% 55%);
  --itx-button-foreground: white;
  --itx-button-border-color: hsl(250 60% 45%);

  --itx-button-background-hover: hsl(250 60% 60%);
  --itx-button-background-active: hsl(250 60% 50%);
}`;

	readonly variantHtml = `<button interop-button="interop-demo">Custom</button>`;

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
		{ label: "styles.css", language: "css", code: this.variantCss },
		{ label: "markup.html", language: "html", code: this.variantHtml },
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
		{ groupLabel: "Layout" },
		{ property: "--itx-button-sizing-multiplier", default: "1" },
		{ property: "--itx-button-display", default: "inline-flex" },
		{ property: "--itx-button-align-items", default: "center" },
		{ property: "--itx-button-justify-content", default: "center" },
		{ property: "--itx-button-gap", default: "var(--itx-spacing-2)" },

		{ groupLabel: "Spacing" },
		{
			property: "--itx-button-padding-block",
			default: "calc(var(--itx-button-sizing-multiplier) * 0.5em)",
		},
		{
			property: "--itx-button-padding-inline",
			default: "calc(var(--itx-button-sizing-multiplier) * 0.75em)",
		},

		{ groupLabel: "Typography" },
		{
			property: "--itx-button-font-family",
			default: 'var(--itx-font-family-sans)',
		},
		{ property: "--itx-button-font-size", default: "var(--itx-fs-label)" },

		{ groupLabel: "Edge" },
		{ property: "--itx-button-border-width", default: "2px" },
		{ property: "--itx-button-border-style", default: "solid" },
		{ property: "--itx-button-border-radius", default: "8px" },
		{ property: "--itx-button-corner-shape", default: "unset" },

		{ groupLabel: "Transition" },
		{
			property: "--itx-button-transition-property",
			default: "background-color, border-color, box-shadow",
		},
		{ property: "--itx-button-transition-duration", default: "75ms" },
		{
			property: "--itx-button-transition-timing-function",
			default: "ease-in-out",
		},

		{ groupLabel: "Rest" },
		{ property: "--itx-button-background", default: "var(--itx-neutral-3)" },
		{ property: "--itx-button-foreground", default: "var(--itx-neutral-10)" },
		{ property: "--itx-button-border-color", default: "transparent" },

		{ groupLabel: "Focus outline" },
		{ property: "--itx-button-outline-width", default: "2px" },
		{ property: "--itx-button-outline-style", default: "solid" },
		{ property: "--itx-button-outline-color", default: "var(--itx-neutral-8)" },
		{ property: "--itx-button-outline-offset", default: "2px" },

		{ groupLabel: "Hover" },
		{
			property: "--itx-button-background-hover",
			default: "var(--itx-neutral-5)",
		},
		{
			property: "--itx-button-foreground-hover",
			default: "var(--itx-neutral-11)",
		},

		{ groupLabel: "Active" },
		{
			property: "--itx-button-background-active",
			default: "var(--itx-neutral-7)",
		},
		{
			property: "--itx-button-foreground-active",
			default: "var(--itx-neutral-12)",
		},
	];

	// ── API table ────────────────────────────────────────────────────────────
	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input", sticky: true },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			name: "onActivate",
			type: "ActivationHandler | null",
			default: "null",
			description:
				"Handler function called on click. Enables activation guardrails when provided.",
		},
		{
			name: "activationOptions",
			type: "ActivationOptions",
			default: "{}",
			description:
				"Guardrail options: debounceMs, throttleMs, reentrant, once.",
		},
		{
			name: "activationId",
			type: "string | null",
			default: "null",
			description:
				"Cross-component trigger ID. Activates all handlers registered under this ID via InteropActivation.",
		},
		{
			name: "payload",
			type: "unknown",
			default: "undefined",
			description:
				"Value passed to the handler or broadcast with the activation event.",
		},
		{
			name: "loading",
			type: "boolean",
			default: "false",
			description:
				"Replaces button content with loadingText and disables the button.",
		},
		{
			name: "loadingText",
			type: "string",
			default: "'Loading...'",
			description: "Text shown when loading is true.",
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables the button and prevents activation.",
		},
		{
			name: "focusableWhenDisabled",
			type: "boolean",
			default: "false",
			description:
				"Uses aria-disabled instead of the native disabled attribute, keeping the button in the tab order.",
		},
		{
			name: "type",
			type: "'button' | 'submit' | 'reset'",
			default: "'button'",
			description: "Native button type attribute.",
		},
	];
}
