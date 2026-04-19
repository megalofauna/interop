import { Component, ChangeDetectionStrategy } from "@angular/core";
import { InteropCodeRenderer, InteropTable, InteropCellDef, type TableColumn } from "src/public-api";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";

interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "code-renderer-page",
	standalone: true,
	imports: [InteropCodeRenderer, InteropTable, InteropCellDef, DemoSection, DemoExample, DemoNotes],
	templateUrl: "./code-renderer-page.html",
	styleUrl: "./code-renderer-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeRendererPage {
	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ name: "language", type: "string | null", default: "null", description: "Language identifier for the header label (e.g. 'ts', 'html', 'scss'). Canonicalized to a display name automatically." },
		{ name: "filename", type: "string | null", default: "null", description: "Filename shown in the header. Takes precedence over the language label when both are set." },
		{ name: "lineNumbers", type: "boolean", default: "false", description: "Render line numbers alongside the code." },
		{ name: "wrap", type: "boolean", default: "false", description: "Wrap long lines (white-space: pre-wrap). Default is pre (no wrap)." },
		{ name: "tokens", type: "HighlightedCode | null", default: "null", description: "Pre-tokenized syntax data from a Shiki adapter. When provided, replaces projected <pre><code> content." },
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Code renderer added to manifest',
			body: 'InteropCodeRenderer is a minimal tokenized code primitive. No toolbar, no copy button — compose those via the CodeBlock composite.',
		},
		{
			type: 'note',
			label: 'Selector',
			body: 'Must be applied to a <figure> element: <figure interop-code-renderer>. A dev-mode warning fires if the host tag is wrong.',
		},
		{
			type: 'note',
			label: 'Tokens vs projection',
			body: 'Pass [tokens] from a Shiki adapter for syntax-highlighted output. Without tokens, project a <pre><code> block as a plain fallback.',
		},
	];
}
