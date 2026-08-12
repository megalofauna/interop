import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
	CodeBlock,
	InlineCode,
	InteropCellDef,
	InteropTable,
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
	selector: "inline-code-page",
	standalone: true,
	imports: [
		InlineCode,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoPage,
		DemoSection,
		DemoExample,
		DemoMasthead,
	],
	templateUrl: "./inline-code-page.html",
	styleUrl: "./inline-code-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineCodePage {
	readonly basicCode = `<itx-inline-code code="npm i interop" />`;

	readonly languageCode = `<itx-inline-code language="bash" code="npx ng build interop" />`;

	readonly copyTextCode = `<!-- What is shown and what is copied can differ -->
<itx-inline-code
  code="ng serve demo"
  copyText="npm run demo"
/>`;

	readonly proseCode = `<p>
  Run <itx-inline-code code="npm run demo" /> to start the dev server on port 1337.
</p>`;

	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		{ property: "--itx-ic-background", default: "var(--itx-surface-above)" },
		{ property: "--itx-ic-foreground", default: "var(--itx-on-surface)" },
		{
			property: "--itx-ic-font-family",
			default: "var(--itx-font-family-mono)",
		},
		{
			property: "--itx-ic-font-size",
			default: "0.875em — relative to context",
		},
		{ property: "--itx-ic-line-height", default: "1.4" },
		{
			property: "--itx-ic-padding-inline",
			default: "var(--itx-spacing-1) — 4px",
		},
		{ property: "--itx-ic-padding-block", default: "0" },
		{
			property: "--itx-ic-gap",
			default: "Gap between the code and copy button",
		},
		{ property: "--itx-ic-radius", default: "var(--itx-radius-none)" },
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
				"Raw source. Tokenized automatically when a language is set and a highlighter is registered.",
		},
		{
			name: "language",
			type: "string | null",
			default: "null",
			description:
				"Language hint for the highlighter. Without it the code renders unhighlighted, which is correct for a short fragment.",
		},
		{
			name: "line",
			type: "HighlightedLine | null",
			default: "null",
			description:
				"Pre-tokenized line. Wins over [code] when both are set. Use when you have already tokenized the content upstream.",
		},
		{
			name: "copyText",
			type: "string | null",
			default: "null",
			description:
				"Text placed on the clipboard. Defaults to the rendered code. Set it when the copyable command differs from the readable one.",
		},
	];
}
