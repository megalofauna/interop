import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
	CodeBlock,
	InteropCellDef,
	InteropTable,
	type CodeFile,
	type TableColumn,
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

interface TokenEntry {
	property: string;
	default: string;
}

@Component({
	selector: "code-block-page",
	standalone: true,
	imports: [
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoPage,
		DemoSection,
		DemoExample,
		DemoMasthead,
	],
	templateUrl: "./code-block-page.html",
	styleUrl: "./code-block-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeBlockPage {
	// ── Sample content rendered by the live examples ─────────────────────────

	readonly sampleHtml = `<progress interop-progress [value]="42" [max]="100"></progress>`;

	readonly sampleTs = `readonly percent = signal(42);

increment(): void {
  this.percent.update((v) => Math.min(100, v + 10));
}`;

	readonly sampleCss = `:where(progress[interop-progress]) {
  --itx-progress-height: 0.5rem;
  --itx-progress-fill: var(--itx-colorway);
}`;

	readonly longSample = `export function createActivationHandler(fn, options = {}) {
  const { debounceMs, throttleMs, once, reentrant = false } = options;
  let timer = null;
  let last = 0;
  let running = false;
  let spent = false;
  return (event) => {
    if (once && spent) return;
    if (!reentrant && running) return;
    const now = performance.now();
    if (throttleMs && now - last < throttleMs) return;
    if (debounceMs) {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => fn(event), debounceMs);
      return;
    }
    last = now;
    running = true;
    try { fn(event); } finally { running = false; spent = true; }
  };
}`;

	readonly multiFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.sampleHtml },
		{ label: "component.ts", language: "ts", code: this.sampleTs },
		{ label: "theme.css", language: "css", code: this.sampleCss },
	];

	// ── Snippets showing how to use the component ────────────────────────────

	readonly singleCode = `<itx-code-block language="html" [code]="snippet" />`;

	readonly multiCode = `<itx-code-block [files]="files" />`;

	readonly multiTs = `readonly files: CodeFile[] = [
  { label: "template.html", language: "html", code: this.html },
  { label: "component.ts",  language: "ts",   code: this.ts },
  { label: "theme.css",     language: "css",  code: this.css },
];`;

	readonly filenameCode = `<itx-code-block
  language="ts"
  filename="activation.ts"
  [code]="snippet"
/>`;

	readonly chromeCode = `<itx-code-block
  language="ts"
  [code]="snippet"
  [lineNumbers]="true"
  [wrapToggle]="true"
/>`;

	readonly syncCode = `<!-- Two blocks sharing a syncKey switch tabs together -->
<itx-code-block syncKey="install" [files]="npmFiles" />
<itx-code-block syncKey="install" [files]="yarnFiles" />`;

	readonly multiFilesSnippet: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.multiCode },
		{ label: "component.ts", language: "ts", code: this.multiTs },
	];


	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		{ property: "--itx-cb-radius", default: "var(--itx-radius-none)" },
		{ property: "--itx-cb-body-background", default: "Code body background" },
		{ property: "--itx-cb-header-background", default: "transparent" },
		{
			property: "--itx-cb-header-padding-block",
			default: "var(--itx-spacing-2) — 8px",
		},
		{ property: "--itx-cb-header-gap", default: "var(--itx-spacing-2) — 8px" },
		{ property: "--itx-cb-tablist-border-bottom-width", default: "2px" },
		{
			property: "--itx-cb-tablist-border-bottom-color",
			default: "var(--itx-contrast-3)",
		},
		{
			property: "--itx-cb-tab-padding-inline",
			default: "var(--itx-spacing-4)",
		},
		{ property: "--itx-cb-tab-foreground", default: "var(--itx-contrast-4)" },
		{
			property: "--itx-cb-tab-foreground-current",
			default: "var(--itx-contrast-6)",
		},
		{
			property: "--itx-cb-tab-border-bottom-color",
			default: "var(--itx-colorway-8) — active tab underline",
		},
		{
			property: "--itx-cb-tab-outline-color",
			default: "var(--itx-colorway-8)",
		},
		{ property: "--itx-cb-label-foreground", default: "var(--itx-contrast-4)" },
		{ property: "--itx-cb-actions-gap", default: "var(--itx-spacing-1) — 4px" },
		{ property: "--itx-cb-button-background", default: "transparent" },
		{
			property: "--itx-cb-button-background-hover",
			default: "var(--itx-surface-above)",
		},
		{
			property: "--itx-cb-button-background-pressed",
			default: "var(--itx-contrast-2) — word-wrap toggle when on",
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
			name: "code",
			type: "string | null",
			default: "null",
			description:
				"Raw source for single-file mode. Tokenized automatically when [language] is set and a highlighter is registered.",
		},
		{
			name: "language",
			type: "string | null",
			default: "null",
			description:
				"Language hint for the highlighter, and the value shared by [syncKey].",
		},
		{
			name: "filename",
			type: "string | null",
			default: "null",
			description:
				"Label shown in the header in single-file mode. Multi-file mode uses each file's own label instead.",
		},
		{
			name: "tokens",
			type: "HighlightedCode | null",
			default: "null",
			description:
				"Pre-tokenized output. Wins over [code]. Use when tokenization already happened upstream, such as at build time.",
		},
		{
			name: "files",
			type: "CodeFile[]",
			default: "[]",
			description:
				"Multi-file mode. A non-empty array renders a tablist and takes precedence over the single-file inputs.",
		},
		{
			name: "lineNumbers",
			type: "boolean",
			default: "false",
			description: "Renders a line-number gutter.",
		},
		{
			name: "wrapToggle",
			type: "boolean",
			default: "false",
			description:
				"Adds a word-wrap toggle to the actions toolbar. Off by default, so a long line scrolls rather than reflowing.",
		},
		{
			name: "syncKey",
			type: "string | null",
			default: "null",
			description:
				"Blocks sharing a key switch tabs together, so a reader who picks a language on one install snippet gets it on the rest of the page.",
		},
	];
}
