import {
	Component,
	ChangeDetectionStrategy,
	signal,
	inject,
	resource,
} from "@angular/core";
import { InteropButton, InteropCallout, InteropTable, InteropCellDef, TableColumn } from "src/public-api";
import { createActivationHandler } from "src/lib/utils/activation";
import { CodeBlock } from "@interop/composites";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";
import { HighlightService } from "../../services/highlight.service";

interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "button-page",
	standalone: true,
	imports: [
		InteropButton,
		InteropCallout,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
	],
	templateUrl: "./button-page.html",
	styleUrl: "./button-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonPage {
	private readonly hl = inject(HighlightService);

	// ── Throttle demo ────────────────────────────────────────────────────────
	throttleClickCount = signal(0);
	throttleFireCount = signal(0);

	readonly throttledHandler = createActivationHandler(
		() => this.throttleFireCount.update((n) => n + 1),
		{ throttleMs: 1000 },
	);

	onThrottleClick() {
		this.throttleClickCount.update((n) => n + 1);
		this.throttledHandler(undefined);
	}

	// ── Debounce demo ────────────────────────────────────────────────────────
	debounceClickCount = signal(0);
	debounceFireCount = signal(0);

	readonly debouncedHandler = createActivationHandler(
		() => this.debounceFireCount.update((n) => n + 1),
		{ debounceMs: 600 },
	);

	onDebounceClick() {
		this.debounceClickCount.update((n) => n + 1);
		this.debouncedHandler(undefined);
	}

	// ── Reentrancy demo ──────────────────────────────────────────────────────
	reentrantActive = signal(false);
	reentrantFireCount = signal(0);
	reentrantBlockCount = signal(0);

	readonly reentrantHandler = createActivationHandler(
		async () => {
			this.reentrantActive.set(true);
			this.reentrantFireCount.update((n) => n + 1);
			await new Promise((r) => setTimeout(r, 2000));
			this.reentrantActive.set(false);
		},
		{
			reentrant: false,
			onStart: () => {},
		},
	);

	onReentrantClick() {
		if (this.reentrantActive()) {
			this.reentrantBlockCount.update((n) => n + 1);
		}
		this.reentrantHandler(undefined);
	}

	// ── Code snippets ────────────────────────────────────────────────────────
	readonly plainCode = `<button interop-button (click)="save()">Save</button>`;

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
	readonly plainTokens = resource({ loader: () => this.hl.highlight(this.plainCode, "html") });
	readonly disabledTokens = resource({ loader: () => this.hl.highlight(this.disabledCode, "html") });
	readonly loadingTokens = resource({ loader: () => this.hl.highlight(this.loadingCode, "html") });
	readonly throttleTokens = resource({ loader: () => this.hl.highlight(this.throttleCode, "typescript") });
	readonly debounceTokens = resource({ loader: () => this.hl.highlight(this.debounceCode, "typescript") });
	readonly reentrantTokens = resource({ loader: () => this.hl.highlight(this.reentrantCode, "typescript") });

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
			description: "Handler function called on click. Enables activation guardrails when provided.",
		},
		{
			name: "activationOptions",
			type: "ActivationOptions",
			default: "{}",
			description: "Guardrail options: debounceMs, throttleMs, reentrant, once.",
		},
		{
			name: "activationId",
			type: "string | null",
			default: "null",
			description: "Cross-component trigger ID. Activates all handlers registered under this ID via InteropActivation.",
		},
		{
			name: "payload",
			type: "unknown",
			default: "undefined",
			description: "Value passed to the handler or broadcast with the activation event.",
		},
		{
			name: "loading",
			type: "boolean",
			default: "false",
			description: "Replaces button content with loadingText and disables the button.",
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
