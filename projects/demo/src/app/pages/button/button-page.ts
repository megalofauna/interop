import {
	Component,
	ChangeDetectionStrategy,
	DestroyRef,
	afterNextRender,
	signal,
	inject,
	resource,
} from "@angular/core";
import {
	InteropButton,
	InteropCallout,
	InteropTable,
	InteropCellDef,
	InteropExpansionPanel,
	InteropExpansionTrigger,
	InteropExpansionBody,
	InteropIcon,
	provideInteropIcons,
	type TableColumn,
	type TableGroupRow,
} from "interop";
import { createActivationHandler } from "interop/lib/utils/activation";
import { TablerAlertTriangleFilled } from "interop/lib/iconsets/tabler";
import { TablerMoon } from "interop/lib/iconsets/tabler/outline/tabler-moon";
import {
	CodeBlock,
	PageNav,
	Terminal,
	type PageNavLink,
	type TerminalEntry,
} from "@interop/composites";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { ButtonPlayground } from "./button-playground/button-playground";
import { HighlightService } from "../../services/highlight.service";
import * as ledes from "./button.djot";
interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

type TokenEntry = TableGroupRow | { property: string; default: string };

@Component({
	selector: "button-page",
	standalone: true,
	imports: [
		InteropButton,
		InteropCallout,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		PageNav,
		Terminal,
		InteropExpansionPanel,
		InteropExpansionTrigger,
		InteropExpansionBody,
		DemoSection,
		DemoExample,
		ButtonPlayground,
		InteropIcon,
	],
	providers: [provideInteropIcons(TablerAlertTriangleFilled, TablerMoon)],
	templateUrl: "./button-page.html",
	styleUrl: "./button-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonPage {
	private readonly hl = inject(HighlightService);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly ledes = ledes;

	// ── Page nav ─────────────────────────────────────────────────────────────
	readonly activeHref = signal<string | null>(null);

	readonly links: PageNavLink[] = [
		{ label: "Usage", href: "#usage" },
		{ label: "Playground", href: "#playground" },
		{ label: "Throttle", href: "#throttle" },
		{ label: "Debounce", href: "#debounce" },
		{ label: "Reentrancy", href: "#reentrancy" },
		{ label: "Tokens", href: "#tokens" },
		{ label: "API", href: "#api" },
	];

	constructor() {
		afterNextRender(() => {
			const visible = new Set<string>();

			const observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						const href = `#${entry.target.id}`;
						if (entry.isIntersecting) {
							visible.add(href);
						} else {
							visible.delete(href);
						}
					}
					const active = this.links.findLast((l) => visible.has(l.href));
					this.activeHref.set(active?.href ?? null);
				},
				{ rootMargin: "0px 0px -60% 0px", threshold: 0 },
			);

			for (const link of this.links) {
				const el = document.querySelector(link.href);
				if (el) observer.observe(el);
			}

			this.destroyRef.onDestroy(() => observer.disconnect());
		});
	}

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

	// ── Code snippets ────────────────────────────────────────────────────────
	readonly plainCode = `<button interop-button (click)="save()">Save</button>`;

	readonly customProps = `/* ── Base (default, no variant) ──────────────────────────────────────────── */

:where([interop-root]) {
		--itx-button-sizing-multiplier: 1;

		--itx-button-display: inline-flex;
		--itx-button-align-items: center;
		--itx-button-justify-content: center;
		--itx-button-gap: var(--itx-spacing-2);


		--itx-button-padding-block: calc(var(--itx-button-sizing-multiplier) * 0.5em);
		--itx-button-padding-inline: calc(
			var(--itx-button-sizing-multiplier) * 0.75em
		);




		/* typography */
		--itx-button-font-family: var(--itx-sans-family), "Figtree", sans-serif;
		--itx-button-font-size: var(--itx-fs-label);
		/*--itx-button-line-height: 1.5rem;*/

		/* edge */
		--itx-button-border-width: 2px;
		--itx-button-border-style: solid;
		--itx-button-border-radius: 8px;
		--itx-button-corner-shape: unset;

		/* transition */
		--itx-button-transition-property: background-color, border-color, box-shadow;
		--itx-button-transition-duration: 75ms;
		--itx-button-transition-timing-function: ease-in-out;

		/* Rest state */
		--itx-button-background: var(--itx-neutral-3);
		--itx-button-foreground: var(--itx-neutral-10);
		--itx-button-border-color: transparent;

		--itx-button-outline-width: 2px;
		--itx-button-outline-style: solid;
		--itx-button-outline-color: var(--itx-neutral-8);
		--itx-button-outline-offset: 2px;

		/* Hover state */
		--itx-button-background-hover: var(--itx-neutral-5);
		--itx-button-foreground-hover: var(--itx-neutral-11);

		/* Active state */
		--itx-button-background-active: var(--itx-neutral-7);
		--itx-button-foreground-active: var(--itx-neutral-12);
}`;

	readonly disabledCode = `<button interop-button [disabled]="true">Disabled</button>`;

	readonly loadingCode = `<button interop-button [loading]="true">Save</button>`;

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

	// ── Highlighted tokens ───────────────────────────────────────────────────
	readonly customPropsTokens = resource({
		loader: () => this.hl.highlight(this.customProps, "css"),
	});
	readonly plainTokens = resource({
		loader: () => this.hl.highlight(this.plainCode, "html"),
	});
	readonly disabledTokens = resource({
		loader: () => this.hl.highlight(this.disabledCode, "html"),
	});
	readonly loadingTokens = resource({
		loader: () => this.hl.highlight(this.loadingCode, "html"),
	});
	readonly throttleTokens = resource({
		loader: () => this.hl.highlight(this.throttleCode, "typescript"),
	});
	readonly debounceTokens = resource({
		loader: () => this.hl.highlight(this.debounceCode, "typescript"),
	});
	readonly reentrantTokens = resource({
		loader: () => this.hl.highlight(this.reentrantCode, "typescript"),
	});

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
			default: 'var(--itx-sans-family), "Figtree", sans-serif',
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
		{ key: "name", label: "Input" },
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
			name: "type",
			type: "'button' | 'submit' | 'reset'",
			default: "'button'",
			description: "Native button type attribute.",
		},
	];
}
