import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import {
	CodeBlock,
	type CodeFile,
	InteropBadge,
	InteropButton,
	InteropCellDef,
	InteropTable,
	type TableColumn,
} from "interop";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";

interface ApiEntry {
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
	selector: "badge-page",
	standalone: true,
	imports: [
		InteropBadge,
		InteropButton,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoPage,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
		DemoMasthead,
	],
	templateUrl: "./badge-page.html",
	styleUrl: "./badge-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgePage {
	readonly alertCount = signal(3);
	readonly cartHidden = signal(false);
	readonly positions = [
		"top-right",
		"top-left",
		"bottom-right",
		"bottom-left",
	] as const;

	increment(): void {
		this.alertCount.update((n) => n + 1);
	}

	reset(): void {
		this.alertCount.set(0);
	}

	toggleCart(): void {
		this.cartHidden.update((v) => !v);
	}

	/**
	 * The function form of [accessibleLabel]. It receives the real count, so it
	 * can say something true when the indicator has capped out at "{max}+".
	 * Angular templates have no arrow-function syntax — pass a member like this.
	 */
	readonly alertLabel = (n: number): string =>
		n === 1 ? "1 unread alert" : `${n} unread alerts`;

	// ── Code samples ─────────────────────────────────────────────────────────
	// Literal strings, never assembled from the live examples' state.

	readonly counterHtml = `<interop-badge
  [count]="alertCount()"
  [accessibleLabel]="alertCount() + ' unread alerts'">
  <button interop-button="primary">Alerts</button>
</interop-badge>`;

	readonly counterTs = `alertCount = signal(3);`;

	readonly counterFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.counterHtml },
		{ label: "component.ts", language: "ts", code: this.counterTs },
	];

	readonly liveHtml = `<interop-badge
  [count]="alertCount()"
  [announce]="true"
  [accessibleLabel]="alertLabel">
  <button interop-button="primary" (click)="increment()">Add alert</button>
</interop-badge>

<button interop-button="secondary" (click)="reset()">Reset</button>`;

	readonly liveTs = `alertCount = signal(3);

// Angular templates have no arrow-function syntax, so the function form of
// [accessibleLabel] is passed as a member. It receives the REAL count, which
// is what lets it stay truthful once the indicator has capped at "{max}+".
alertLabel = (n: number) => (n === 1 ? "1 unread alert" : \`\${n} unread alerts\`);

increment() { this.alertCount.update((n) => n + 1); }
reset()     { this.alertCount.set(0); }`;

	readonly liveFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.liveHtml },
		{ label: "component.ts", language: "ts", code: this.liveTs },
	];

	readonly maxCode = `<!-- 150 exceeds [max], so the indicator reads "99+".
     The label takes the real count, not the display string. -->
<interop-badge
  [count]="150"
  [max]="99"
  [accessibleLabel]="'More than 99 alerts'">
  <button interop-button="primary">Comms</button>
</interop-badge>`;

	readonly dotCode = `<interop-badge [dot]="true" [accessibleLabel]="'New activity'">
  <button interop-button="primary">Status</button>
</interop-badge>`;

	readonly hiddenHtml = `<interop-badge
  [count]="2"
  [hidden]="cartHidden()"
  [accessibleLabel]="'2 items in cart'">
  <button interop-button="primary">Cart</button>
</interop-badge>

<button interop-button="secondary" (click)="toggleCart()">
  {{ cartHidden() ? "Show" : "Hide" }} badge
</button>`;

	readonly hiddenTs = `cartHidden = signal(false);

toggleCart() { this.cartHidden.update((v) => !v); }`;

	readonly hiddenFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.hiddenHtml },
		{ label: "component.ts", language: "ts", code: this.hiddenTs },
	];

	readonly positionHtml = `@for (pos of positions; track pos) {
  <interop-badge [count]="3" [position]="pos" [accessibleLabel]="'3 items'">
    <button interop-button="tertiary">{{ pos }}</button>
  </interop-badge>
}`;

	readonly positionTs = `positions = [
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left",
] as const;`;

	readonly positionFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.positionHtml },
		{ label: "component.ts", language: "ts", code: this.positionTs },
	];

	// ── Tables ───────────────────────────────────────────────────────────────

	readonly tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	readonly tokenEntries: TokenEntry[] = [
		{
			property: "--itx-badge-size",
			default: "var(--itx-spacing-4) — 16px",
		},
		{
			property: "--itx-badge-dot-size",
			default: "var(--itx-spacing-2) — 8px",
		},
		{
			property: "--itx-badge-padding-inline",
			default: "var(--itx-spacing-1) — 4px",
		},
		{
			property: "--itx-badge-radius",
			default: "var(--itx-radius-full) — 9999px",
		},
		{
			property: "--itx-badge-background",
			default: "var(--itx-danger)",
		},
		{
			property: "--itx-badge-color",
			default: "var(--itx-on-danger)",
		},
		{
			property: "--itx-badge-font-size",
			default: "0.75rem — 12px, fixed (not fluid)",
		},
		{
			property: "--itx-badge-font-weight",
			default: "400",
		},
		{
			property: "--itx-badge-line-height",
			default: "1.3333 — 16/12, exactly the bubble height",
		},
		{
			property: "--itx-badge-offset",
			default: "0px — corner-centred; positive bleeds outward",
		},
	];

	readonly apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	readonly apiEntries: ApiEntry[] = [
		{
			name: "count",
			type: "number | null",
			default: "null",
			description:
				"Numeric count to display. null renders an empty indicator — use [hidden] to remove it.",
		},
		{
			name: "max",
			type: "number",
			default: "99",
			description:
				'Display cap. When count exceeds this value, the indicator shows "{max}+".',
		},
		{
			name: "dot",
			type: "boolean",
			default: "false",
			description:
				"Render the indicator as a plain dot with no count text, at --itx-badge-dot-size.",
		},
		{
			name: "hidden",
			type: "boolean",
			default: "false",
			description:
				"Remove the indicator from the DOM and set data-hidden on the host.",
		},
		{
			name: "position",
			type: "'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'",
			default: "'top-right'",
			description:
				"Corner of the decorated element the indicator is centred on.",
		},
		{
			name: "accessibleLabel",
			type: "string | ((count: number) => string) | null",
			default: "null",
			description:
				"Accessible text for the badge context. Pass a function when the count can exceed [max] — it receives the real count, not the display string. Warns in dev mode if omitted.",
		},
		{
			name: "announce",
			type: "boolean",
			default: "false",
			description:
				"Announce count changes through InteropAnnouncer after the initial render. Page load does not speak.",
		},
	];
}
