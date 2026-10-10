import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import {
	CodeBlock,
	InteropButton,
	InteropCellDef,
	InteropTable,
	Terminal,
	type CodeFile,
	type TableColumn,
	type TerminalEntry,
} from "interop";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";

interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
}

interface OutputEntry {
	name: string;
	type: string;
	description: string;
}

interface TokenEntry {
	property: string;
	default: string;
}

@Component({
	selector: "terminal-page",
	standalone: true,
	imports: [
		Terminal,
		InteropButton,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoPage,
		DemoSection,
		DemoExample,
		DemoMasthead,
	],
	templateUrl: "./terminal-page.html",
	styleUrl: "./terminal-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalPage {
	readonly staticEntries: TerminalEntry[] = [
		{ text: "Docking clamps released" },
		{ text: "Thrusters nominal" },
		{ text: "Course laid in for Tycho Station" },
	];

	readonly plainEntries: TerminalEntry[] = [
		{ text: "Validating manifest" },
		{ text: "3 items flagged for review" },
		{ text: "Manifest accepted" },
	];

	/** Live log — each click appends an entry with a timestamp. */
	readonly log = signal<TerminalEntry[]>([]);
	private step = 0;

	private readonly messages = [
		"Sensor sweep started",
		"Contact bearing 041 mark 12",
		"Contact identified: cargo hauler",
		"Hailing frequency open",
		"Handshake accepted",
	];

	protected emit(): void {
		const text = this.messages[this.step % this.messages.length];
		this.step += 1;
		this.log.update((entries) => [...entries, { text, time: Date.now() }]);
	}

	protected onReset(): void {
		this.log.set([]);
		this.step = 0;
	}

	readonly basicCode = `<itx-terminal [entries]="entries" />`;

	readonly basicTs = `entries: TerminalEntry[] = [
  { text: "Docking clamps released" },
  { text: "Thrusters nominal" },
  { text: "Course laid in for Tycho Station" },
];`;

	readonly timestampCode = `<!-- A "time" on an entry renders a relative delta prefix -->
<itx-terminal [entries]="log()" (reset)="onReset()" />`;

	readonly timestampTs = `readonly log = signal<TerminalEntry[]>([]);

emit(): void {
  this.log.update((e) => [...e, { text: "Sensor sweep started", time: Date.now() }]);
}`;

	readonly plainCode = `<itx-terminal variant="plain" [entries]="entries" />`;

	readonly scanLinesCode = `<itx-terminal [entries]="entries" [scanLines]="true" prompt="$" />`;

	/* Stable references. An array literal in the template is a new object on
	   every change-detection pass, which would make CodeBlock re-tokenize. */
	readonly basicFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.basicCode },
		{ label: "component.ts", language: "ts", code: this.basicTs },
	];

	readonly timestampFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.timestampCode },
		{ label: "component.ts", language: "ts", code: this.timestampTs },
	];

	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		{ property: "--itx-term-background", default: "Panel background" },
		{ property: "--itx-term-color", default: "Entry text" },
		{ property: "--itx-term-prompt-color", default: "Prompt glyph" },
		{
			property: "--itx-term-delta-color",
			default: "Relative timestamp prefix",
		},
		{ property: "--itx-term-caret-color", default: "Trailing caret" },
		{
			property: "--itx-term-font-family",
			default: "var(--itx-font-family-mono)",
		},
		{
			property: "--itx-term-radius",
			default: 'unset — follows itx-radius="…", then var(--itx-radius)',
		},
		{ property: "--itx-term-glow", default: "Text shadow for the CRT effect" },
		{ property: "--itx-term-scrollbar-color", default: "Scrollbar thumb" },
		{
			property: "--itx-term-scan-line-color",
			default: "oklch(0% 0 0 / 0.2) — the dark run of the CRT raster",
		},
		{
			property: "--itx-term-scan-line-gap",
			default: "3px lit / --itx-term-scan-line-width 1px dark",
		},
	];

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			name: "entries",
			type: "TerminalEntry[]",
			default: "[]",
			description:
				"Lines to display, oldest first. Each is { text: string; time?: number } — a time renders a relative delta prefix.",
		},
		{
			name: "maxEntries",
			type: "number",
			default: "200",
			description:
				"Ceiling on rendered lines. Older entries fall off the top, which keeps a long-running log from growing the DOM without bound.",
		},
		{
			name: "prompt",
			type: "string",
			default: '"›"',
			description: "Glyph shown before each entry.",
		},
		{
			name: "scanLines",
			type: "boolean",
			default: "false",
			description:
				"Overlays CRT scan lines. Decorative, and suppressed under prefers-reduced-motion.",
		},
		{
			name: "variant",
			type: '"terminal" | "plain"',
			default: '"terminal"',
			description:
				'"plain" drops the console styling and renders the entries as a quiet log, for contexts where the CRT treatment would be noise.',
		},
	];

	outputColumns: TableColumn<OutputEntry>[] = [
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: OutputEntry[] = [
		{
			name: "reset",
			type: "void",
			description:
				"Emitted when the consumer requests a reset. The terminal does not clear itself — you own the entries, so you decide what clearing means.",
		},
	];
}
