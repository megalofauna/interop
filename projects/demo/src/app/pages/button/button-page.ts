import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import {
	InteropButton,
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
import { TablerChevronDown } from "interop/lib/iconsets/tabler/outline/tabler-chevron-down";
import { TablerFilter } from "interop/lib/iconsets/tabler/outline/tabler-filter";
import { TablerPlus } from "interop/lib/iconsets/tabler/outline/tabler-plus";
import { TablerX } from "interop/lib/iconsets/tabler/outline/tabler-x";
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
		provideInteropIcons(
			TablerDownload,
			TablerChevronRight,
			TablerChevronDown,
			TablerPlus,
			TablerX,
			TablerFilter,
		),
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
	readonly sizeCode = `
<button interop-button itx-size="sm">Small</button>
<button interop-button itx-size="md">Medium</button>
<button interop-button itx-size="lg">Large</button>`;

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
	readonly addonHtml = `<!-- Leading icon: written first, so it renders first -->
<button interop-button="primary">
  <interop-icon name="tabler-download" aria-hidden="true" />
  Download
</button>

<!-- Trailing icon: written last -->
<button interop-button="tertiary">
  Next
  <interop-icon name="tabler-chevron-right" aria-hidden="true" />
</button>

<!-- Both. The button's gap spaces all three children evenly -->
<button interop-button="secondary">
  <interop-icon name="tabler-filter" aria-hidden="true" />
  Filter
  <interop-icon name="tabler-chevron-down" aria-hidden="true" />
</button>

<!-- Icon-only: the HOST carries the name, so the icon is NOT aria-hidden -->
<button interop-button="primary icon" aria-label="Add item">
  <interop-icon name="tabler-plus" />
</button>

<button interop-button="tertiary icon" itx-size="sm" aria-label="Dismiss">
  <interop-icon name="tabler-x" />
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

	/* ── Borrowed vocabulary ──────────────────────────────────────────────────
	 *
	 * Two other frameworks' buttons, rebuilt from their own published values
	 * using nothing but this library's --itx-button-* tokens. No component
	 * code, no variant classes, no overrides reaching past the namespace.
	 *
	 * The point is not that you should ship a Tailwind button. It is that the
	 * token surface is wide enough to say someone else's design in full — which
	 * is the only real test of whether it is a system or a skin.
	 */
	readonly tailwindHtml = `<button interop-button="tw-primary">Primary</button>
<button interop-button="tw-secondary">Secondary</button>
<button interop-button="tw-soft">Soft</button>`;

	readonly tailwindCss = `:where(
  [interop-button~="tw-primary"],
  [interop-button~="tw-secondary"],
  [interop-button~="tw-soft"]
) {
  /* text-sm / font-semibold, on Tailwind's default --font-sans stack */
  --itx-button-font-family: ui-sans-serif, system-ui, sans-serif;
  --itx-button-font-size: 0.875rem;
  --itx-button-line-height: 1.25rem;
  --itx-button-font-weight: 600;
  --itx-button-letter-spacing: normal;

  /* px-2.5 py-1.5 — height falls out at 32px */
  --itx-button-height: 2rem;
  --itx-button-padding-block: 0.375rem;
  --itx-button-padding-inline: 0.625rem;
  --itx-button-gap: 0.5rem;

  /* rounded-md */
  --itx-button-radius-default: 0.375rem;
  --itx-button-border-width: 1px;

  /* shrink to content and centre the label */
  --itx-button-justify-content: center;
  --itx-button-flex: 0 0 auto;
  --itx-button-max-width: none;

  /* focus-visible:outline-2 outline-offset-2 outline-indigo-600, stepping to
     indigo-500 in dark alongside the fill. Departure: Tailwind Plus declares
     these focus utilities on the primary button only — secondary and soft
     fall back to the UA ring. A ring on every variant is a floor we keep. */
  --itx-button-outline-width: 2px;
  --itx-button-outline-offset: 2px;
  --itx-button-outline-color: light-dark(
    oklch(51.1% 0.262 276.966),
    oklch(58.5% 0.233 277.117)
  );

  /* The Tailwind Plus buttons carry no transition utility — state changes
     land on the next frame. Kept faithful rather than smoothed. */
  --itx-button-transition-duration: 0s;
}

/* bg-indigo-600 text-white shadow-xs hover:bg-indigo-500
   dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:shadow-none */
:where([interop-button~="tw-primary"]) {
  --itx-button-background: light-dark(
    oklch(51.1% 0.262 276.966),
    oklch(58.5% 0.233 277.117)
  );
  --itx-button-foreground: #fff;
  --itx-button-border-color: transparent;

  /* shadow-xs in light, dropped in dark. light-dark() is a colour function
     and cannot switch a whole box-shadow, so the mode rides on the shadow's
     colour instead — a transparent shadow is an absent one. */
  --itx-button-box-shadow: 0 1px 2px 0
    light-dark(rgb(0 0 0 / 0.05), transparent);

  /* \`hover:\` stays true while the pointer is down, so the pressed state is
     the hover state — Tailwind declares no separate active step. The shadow
     is restated per state because the foundation's -hover/-active shadow
     slots fall back to \`none\`, not to the rest value. */
  --itx-button-background-hover: light-dark(
    oklch(58.5% 0.233 277.117),
    oklch(67.3% 0.182 276.935)
  );
  --itx-button-box-shadow-hover: var(--itx-button-box-shadow);
  --itx-button-background-active: var(--itx-button-background-hover);
  --itx-button-box-shadow-active: var(--itx-button-box-shadow);
}

/* bg-white text-gray-900 inset-ring-1 inset-ring-gray-300 shadow-xs
   hover:bg-gray-50 — dark:bg-white/10 dark:text-white
   dark:inset-ring-white/5 dark:hover:bg-white/20 dark:shadow-none */
:where([interop-button~="tw-secondary"]) {
  --itx-button-background: light-dark(#fff, rgb(255 255 255 / 0.1));
  --itx-button-foreground: light-dark(oklch(21% 0.034 264.665), #fff);
  --itx-button-border-color: light-dark(
    oklch(87.2% 0.01 258.338),
    rgb(255 255 255 / 0.05)
  );
  --itx-button-box-shadow: 0 1px 2px 0
    light-dark(rgb(0 0 0 / 0.05), transparent);

  --itx-button-background-hover: light-dark(
    oklch(98.5% 0.002 247.839),
    rgb(255 255 255 / 0.2)
  );
  --itx-button-box-shadow-hover: var(--itx-button-box-shadow);
  --itx-button-background-active: var(--itx-button-background-hover);
  --itx-button-box-shadow-active: var(--itx-button-box-shadow);
}

/* bg-indigo-50 text-indigo-600 shadow-xs hover:bg-indigo-100 — no ring.
   dark:bg-indigo-500/20 dark:text-indigo-400 dark:hover:bg-indigo-500/30
   dark:shadow-none */
:where([interop-button~="tw-soft"]) {
  --itx-button-background: light-dark(
    oklch(96.2% 0.018 272.314),
    oklch(58.5% 0.233 277.117 / 0.2)
  );
  --itx-button-foreground: light-dark(
    oklch(51.1% 0.262 276.966),
    oklch(67.3% 0.182 276.935)
  );
  --itx-button-border-color: transparent;
  --itx-button-box-shadow: 0 1px 2px 0
    light-dark(rgb(0 0 0 / 0.05), transparent);

  --itx-button-background-hover: light-dark(
    oklch(93% 0.034 272.788),
    oklch(58.5% 0.233 277.117 / 0.3)
  );
  --itx-button-box-shadow-hover: var(--itx-button-box-shadow);
  --itx-button-background-active: var(--itx-button-background-hover);
  --itx-button-box-shadow-active: var(--itx-button-box-shadow);
}`;

	readonly materialHtml = `<button interop-button="m3-filled">Filled</button>
<button interop-button="m3-tonal">Tonal</button>
<button interop-button="m3-elevated">Elevated</button>
<button interop-button="m3-outlined">Outlined</button>
<button interop-button="m3-text">Text</button>`;

	readonly materialCss = `:where(
  [interop-button~="m3-filled"],
  [interop-button~="m3-tonal"],
  [interop-button~="m3-elevated"],
  [interop-button~="m3-outlined"],
  [interop-button~="m3-text"]
) {
  /* --mat-sys-* system colours, azure-blue, as mat.theme() compiles them. */
  --_m3-primary: light-dark(#005cbb, #abc7ff);
  --_m3-on-primary: light-dark(#ffffff, #002f65);
  --_m3-secondary-container: light-dark(#dae2f9, #3e4759);
  --_m3-on-secondary-container: light-dark(#3e4759, #dae2f9);
  --_m3-surface: light-dark(#faf9fd, #121316);
  --_m3-outline: light-dark(#74777f, #8e9099);

  /* --mat-sys-label-large. Roboto is not bundled here, so this resolves down
     the stack — the same treatment IBM Plex gets in the protocol theme. */
  --itx-button-font-family: Roboto, system-ui, sans-serif;
  --itx-button-font-size: 0.875rem;
  --itx-button-line-height: 1.25rem;
  --itx-button-font-weight: 500;
  --itx-button-letter-spacing: 0.006rem;

  /* container-height 40px, horizontal-padding 24px, icon-spacing 8px */
  --itx-button-height: 2.5rem;
  --itx-button-padding-block: 0.625rem;
  --itx-button-padding-inline: 1.5rem;
  --itx-button-gap: 0.5rem;
  --itx-button-min-width: 4rem;
  --itx-button-max-width: none;
  --itx-button-flex: 0 0 auto;
  --itx-button-justify-content: center;

  /* corner-full. The squircle cannot form a stadium, so switch the corner
     curve the same way itx-radius="full" does. */
  --itx-button-radius-default: 9999px;
  --itx-button-corner-shape: round;
  --itx-button-border-width: 0;

  /* Material animates the state layer's opacity over 15ms linear. */
  --itx-button-transition-duration: 15ms;
  --itx-button-transition-timing-function: linear;

  /* Departure. Material's default focus treatment is the 12% state layer and
     nothing else — its ring is opt-in behind mat.strong-focus-indicators().
     A visible ring is a floor we keep, so it stays and takes the primary. */
  --itx-button-outline-width: 2px;
  --itx-button-outline-offset: 2px;
  --itx-button-outline-color: var(--_m3-primary);
}

/* container primary / label on-primary; state layer on-primary */
:where([interop-button~="m3-filled"]) {
  --itx-button-background: var(--_m3-primary);
  --itx-button-foreground: var(--_m3-on-primary);

  --itx-button-background-hover: color-mix(
    in srgb,
    var(--_m3-on-primary) 8%,
    var(--_m3-primary)
  );
  --itx-button-background-active: color-mix(
    in srgb,
    var(--_m3-on-primary) 12%,
    var(--_m3-primary)
  );
}

/* container secondary-container / label on-secondary-container */
:where([interop-button~="m3-tonal"]) {
  --itx-button-background: var(--_m3-secondary-container);
  --itx-button-foreground: var(--_m3-on-secondary-container);

  --itx-button-background-hover: color-mix(
    in srgb,
    var(--_m3-on-secondary-container) 8%,
    var(--_m3-secondary-container)
  );
  --itx-button-background-active: color-mix(
    in srgb,
    var(--_m3-on-secondary-container) 12%,
    var(--_m3-secondary-container)
  );
}

/* "protected" in the source — container surface, label primary, and the one
   variant that moves in z: level1 at rest, level2 on hover, back to level1
   when pressed. Material's elevation shadows are plain black alphas and do
   not change with the scheme, so they carry no light-dark(). */
:where([interop-button~="m3-elevated"]) {
  --itx-button-background: var(--_m3-surface);
  --itx-button-foreground: var(--_m3-primary);
  --itx-button-box-shadow:
    0 2px 1px -1px rgb(0 0 0 / 0.2), 0 1px 1px 0 rgb(0 0 0 / 0.14),
    0 1px 3px 0 rgb(0 0 0 / 0.12);

  --itx-button-background-hover: color-mix(
    in srgb,
    var(--_m3-primary) 8%,
    var(--_m3-surface)
  );
  --itx-button-box-shadow-hover:
    0 3px 3px -2px rgb(0 0 0 / 0.2), 0 3px 4px 0 rgb(0 0 0 / 0.14),
    0 1px 8px 0 rgb(0 0 0 / 0.12);

  --itx-button-background-active: color-mix(
    in srgb,
    var(--_m3-primary) 12%,
    var(--_m3-surface)
  );
  --itx-button-box-shadow-active: var(--itx-button-box-shadow);
}

/* transparent container, 1px outline, label primary */
:where([interop-button~="m3-outlined"]) {
  --itx-button-background: transparent;
  --itx-button-foreground: var(--_m3-primary);
  --itx-button-border-width: 1px;
  --itx-button-border-color: var(--_m3-outline);

  --itx-button-background-hover: color-mix(
    in srgb,
    var(--_m3-primary) 8%,
    transparent
  );
  --itx-button-background-active: color-mix(
    in srgb,
    var(--_m3-primary) 12%,
    transparent
  );
}

/* transparent container, no outline, 12px side padding */
:where([interop-button~="m3-text"]) {
  --itx-button-background: transparent;
  --itx-button-foreground: var(--_m3-primary);
  --itx-button-padding-inline: 0.75rem;

  --itx-button-background-hover: color-mix(
    in srgb,
    var(--_m3-primary) 8%,
    transparent
  );
  --itx-button-background-active: color-mix(
    in srgb,
    var(--_m3-primary) 12%,
    transparent
  );
}`;

	readonly tailwindFiles: CodeFile[] = [
		{ label: "markup.html", language: "html", code: this.tailwindHtml },
		{ label: "tailwind.css", language: "css", code: this.tailwindCss },
	];

	readonly materialFiles: CodeFile[] = [
		{ label: "markup.html", language: "html", code: this.materialHtml },
		{ label: "material.css", language: "css", code: this.materialCss },
	];

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
		{ property: "--itx-button-background", default: "var(--itx-contrast-2)" },
		{ property: "--itx-button-foreground", default: "var(--itx-contrast-6)" },
		{ property: "--itx-button-border-color", default: "transparent" },
		{ property: "--itx-button-box-shadow", default: "none" },

		{ groupLabel: "Hover" },
		{
			property: "--itx-button-background-hover",
			default: "var(--itx-contrast-3)",
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
			default: "var(--itx-contrast-3)",
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
			default: "var(--itx-colorway-solid)",
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
