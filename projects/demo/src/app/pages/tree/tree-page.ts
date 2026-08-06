import {
	Component,
	ChangeDetectionStrategy,
	signal,
	viewChild,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import {
	InteropButton,
	InteropTree,
	InteropTreeItem,
	InteropTreeToggle,
	InteropTreeGroup,
	InteropExpansionPanel,
	InteropExpansionTrigger,
	InteropExpansionBody,
	InteropTable,
	InteropCellDef,
	CodeBlock,
	type CodeFile,
	type TableColumn,
} from "interop";
import { DemoTreeNodes, type TreeNode } from "./tree-node";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";
import {
	DemoNotes,
	type DemoNote,
} from "../../components/demo-notes/demo-notes";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

interface ApiEntry {
	component?: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

/** Branching factor per level for the scale demo. */
const SCALE_SHAPE = [18, 14, 12];

@Component({
	selector: "tree-page",
	standalone: true,
	imports: [
		RouterLink,
		InteropButton,
		InteropTree,
		InteropTreeItem,
		InteropTreeToggle,
		InteropTreeGroup,
		InteropExpansionPanel,
		InteropExpansionTrigger,
		InteropExpansionBody,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoTreeNodes,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
		DemoNotes,
		DemoMasthead,
	],
	templateUrl: "./tree-page.html",
	styleUrl: "./tree-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreePage {
	protected readonly selectTree = viewChild<InteropTree>("selectTree");
	protected readonly scaleTree = viewChild<InteropTree>("scaleTree");

	// ── Select-tier state ─────────────────────────────────────────────────────

	protected readonly picked = signal<string[]>([]);
	protected readonly lastExpanded = signal<string>("—");

	protected onExpanded(event: { key: string; expanded: boolean }): void {
		this.lastExpanded.set(`${event.key} → ${event.expanded}`);
	}

	// ── Scale demo ────────────────────────────────────────────────────────────

	protected readonly scaleNodes = buildTree(SCALE_SHAPE);

	protected readonly scaleCount = countNodes(this.scaleNodes);

	/** A leaf buried at the bottom of the last branch — the Ctrl+F target. */
	protected readonly buriedLabel = deepestLabel(this.scaleNodes);

	protected revealBuried(): void {
		this.scaleTree()?.reveal(lastKey(this.scaleNodes));
	}

	protected collapseScale(): void {
		this.scaleTree()?.collapseAll();
	}

	// ── Code samples ──────────────────────────────────────────────────────────

	protected readonly navCode = `<nav aria-label="Docs">
  <ul interop-tree>
    <li interop-tree-item key="guide">
      <span interop-tree-row>
        <button interop-tree-toggle></button>
        <a routerLink="/guide">Guide</a>
      </span>
      <ul interop-tree-group>
        <li interop-tree-item key="install">
          <span interop-tree-row>
            <span interop-tree-toggle></span>
            <a routerLink="/guide/install" aria-current="page">Install</a>
          </span>
        </li>
      </ul>
    </li>
  </ul>
</nav>`;

	protected readonly navFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.navCode },
	];

	protected readonly selectCode = `<ul
  interop-tree="select"
  aria-label="Project files"
  [multiselectable]="true"
  [(selected)]="picked"
  (expandedChange)="onExpanded($event)">
  <li interop-tree-item key="src">
    <span interop-tree-row>
      <span interop-tree-toggle></span>
      <span>src</span>
    </span>
    <ul interop-tree-group>
      <li interop-tree-item key="main.ts">
        <span interop-tree-row><span></span><span>main.ts</span></span>
      </li>
    </ul>
  </li>
</ul>`;

	protected readonly selectFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.selectCode },
	];

	protected readonly cssCode = `/* Depth is one number, published by the item as --itx-tree-level
   alongside aria-level. The row indents by it, so the row box itself
   still spans the full width — which is what lets hover and selection
   bleed to both edges at any depth. */

:where([interop-tree-row]) {
  padding-inline-start: calc(
    (var(--itx-tree-level, 1) - 1) * var(--itx-tree-indent) +
    var(--itx-tree-row-padding-inline)
  );
}

/* Offscreen subtrees skip layout and paint, but stay in the DOM,
   in the accessibility tree, and findable by find-in-page. */

:where([interop-tree-item]) {
  content-visibility: auto;
  contain-intrinsic-size: auto var(--itx-tree-row-block-size);
}`;

	protected readonly cssFiles: CodeFile[] = [
		{ label: "tree.css", language: "css", code: this.cssCode },
	];

	// ── API tables ────────────────────────────────────────────────────────────

	protected readonly apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Directive", sticky: true },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	protected readonly apiEntries: ApiEntry[] = [
		{
			component: "[interop-tree]",
			name: "interop-tree",
			type: '"" | "select"',
			default: '""',
			description:
				'Tier. Empty is the navigate tier (nested list, no tree roles, natural tab order). "select" is a real role="tree" widget with one tab stop, roving focus and typeahead.',
		},
		{
			component: "[interop-tree]",
			name: "multiselectable",
			type: "boolean",
			default: "false",
			description: "Allows more than one node selected. Select tier only.",
		},
		{
			component: "[interop-tree]",
			name: "selected",
			type: "string[]",
			default: "[]",
			description:
				"Two-way selected keys. Always an array, including in single-select, so consumers never branch on cardinality.",
		},
		{
			component: "[interop-tree]",
			name: "findable",
			type: "boolean",
			default: "true",
			description:
				'Hides collapsed groups with hidden="until-found" so find-in-page can still reach them. Set false for plain hidden.',
		},
		{
			component: "[interop-tree-item]",
			name: "key",
			type: "string",
			default: "auto",
			description:
				"Stable identity for selection, reveal() and focus restoration. Auto-generated when absent, but a real key is what makes those survive a re-render.",
		},
		{
			component: "[interop-tree-item]",
			name: "expanded",
			type: "boolean",
			default: "false",
			description: "Two-way expanded state. Uncontrolled by default.",
		},
		{
			component: "[interop-tree-item]",
			name: "disabled",
			type: "boolean",
			default: "false",
			description:
				"Marks the item aria-disabled. It stays focusable so it remains discoverable; activation is what refuses it.",
		},
		{
			component: "[interop-tree-item]",
			name: "label",
			type: "string",
			default: "row text",
			description:
				"Typeahead text. Defaults to the row's own text, excluding the child group.",
		},
		{
			component: "[interop-tree-item]",
			name: "expandable",
			type: "boolean",
			default: "auto",
			description:
				"Forces expandability. Needed only when the child group renders lazily inside an @if, since the item otherwise infers it from a group being present.",
		},
		{
			component: "[interop-tree-toggle]",
			name: "label",
			type: "string",
			default: "row text",
			description:
				"Accessible name for the button form, so an icon-only twisty is never nameless. Ignored on non-button hosts, which are aria-hidden.",
		},
	];

	protected readonly outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Directive", sticky: true },
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	protected readonly outputEntries: ApiEntry[] = [
		{
			component: "[interop-tree]",
			name: "expandedChange",
			type: "{ key: string; expanded: boolean }",
			default: "—",
			description:
				"An item expanded or collapsed, from any cause — including the browser revealing it for a find-in-page match.",
		},
		{
			component: "[interop-tree]",
			name: "activated",
			type: "string",
			default: "—",
			description: "A node was activated by Enter or click. Select tier only.",
		},
	];

	protected readonly methodColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Method" },
		{ key: "type", label: "Signature" },
		{ key: "description", label: "Description" },
	];

	protected readonly methodEntries: ApiEntry[] = [
		{
			name: "reveal",
			type: "(key: string) => void",
			default: "—",
			description:
				"Expands every ancestor of key, then focuses it. The primitive that filtering, deep-linking and 'reveal in tree' all reduce to.",
		},
		{
			name: "expandAll",
			type: "() => void",
			default: "—",
			description: "Expands every expandable item.",
		},
		{
			name: "collapseAll",
			type: "() => void",
			default: "—",
			description:
				"Collapses everything. Focus moves out to the shallowest visible ancestor rather than being lost to <body>.",
		},
	];

	protected readonly keyboardColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Key" },
		{ key: "description", label: "Action" },
	];

	protected readonly keyboardEntries: ApiEntry[] = [
		{
			name: "→",
			type: "",
			default: "",
			description:
				"Closed branch opens in place. Open branch moves focus to its first child. End node does nothing. (RTL flips this to ←.)",
		},
		{
			name: "←",
			type: "",
			default: "",
			description:
				"Open branch closes. Child or end node moves focus to its parent. Root end node does nothing.",
		},
		{
			name: "↓ / ↑",
			type: "",
			default: "",
			description:
				"Move focus to the next/previous visible node. Never expands or collapses.",
		},
		{
			name: "Home / End",
			type: "",
			default: "",
			description: "First / last visible node.",
		},
		{
			name: "Enter",
			type: "",
			default: "",
			description: "Activate the focused node — selects it.",
		},
		{
			name: "Space",
			type: "",
			default: "",
			description:
				"Toggle selection when multiselectable, otherwise the same as Enter.",
		},
		{
			name: "*",
			type: "",
			default: "",
			description: "Expand every sibling at the focused node's level.",
		},
		{
			name: "A–Z",
			type: "",
			default: "",
			description:
				"Typeahead — focus the next node whose label starts with the typed buffer. Resets after 500 ms.",
		},
	];

	protected readonly notes: DemoNote[] = [
		{
			type: "release",
			label: "v0.1.x",
			title: "Two tiers, one directive family",
			body: 'role="tree" is a behaviour contract — one tab stop, roving focus, typeahead, arrow-key expansion, a selection model. Nav sidebars honour none of it, so Interop does not assume it. Bare [interop-tree] is a nested-list disclosure structure; interop-tree="select" opts into the widget.',
		},
		{
			type: "note",
			label: "Performance",
			title: "No virtualizer",
			body: "Offscreen subtrees are skipped with content-visibility: auto rather than removed from the DOM. Unlike a virtualizer, the content stays in the accessibility tree, stays selectable by Ctrl+A, and stays findable by find-in-page — and item counts are computed by the browser from real list semantics instead of hand-authored aria-setsize.",
		},
		{
			type: "note",
			label: "Findability",
			title: "Collapsed is not gone",
			body: 'Collapsed groups use hidden="until-found". Supporting browsers reveal a match and fire beforematch, which the group turns into a real expand so the component state matches what the user is looking at. Browsers without support treat any hidden value as hidden, so there is nothing to feature-detect.',
		},
		{
			type: "note",
			label: "Indentation",
			title: "Depth is one number, used twice",
			body: "The item computes its depth for aria-level and publishes the same number as --itx-tree-level. Indent lives on the row, not on nested list padding — which is what lets the row box span the full width so hover and selection bleed to both edges at any depth.",
		},
		{
			type: "note",
			label: "Guardrails",
			title: "devMode catches the composite-widget trap",
			body: "Putting a link, a form control, or a <button> twisty inside a select-tier row makes it unreachable for screen-reader users, because a composite widget has exactly one tab stop. Interop warns at dev time and points at the navigate tier.",
		},
	];
}

// ── Scale-demo data ─────────────────────────────────────────────────────────

function buildTree(shape: number[], prefix = "n"): TreeNode[] {
	const [width, ...rest] = shape;
	return Array.from({ length: width }, (_, i) => {
		const key = `${prefix}-${i}`;
		return {
			key,
			label: `${LABELS[i % LABELS.length]}-${i}`,
			children: rest.length ? buildTree(rest, key) : undefined,
		};
	});
}

function countNodes(nodes: TreeNode[]): number {
	return nodes.reduce(
		(total, node) => total + 1 + (node.children ? countNodes(node.children) : 0),
		0,
	);
}

function lastKey(nodes: TreeNode[]): string {
	const last = nodes[nodes.length - 1];
	return last.children ? lastKey(last.children) : last.key;
}

function deepestLabel(nodes: TreeNode[]): string {
	const last = nodes[nodes.length - 1];
	return last.children ? deepestLabel(last.children) : last.label;
}

const LABELS = [
	"orbit",
	"payload",
	"telemetry",
	"beacon",
	"lattice",
	"drift",
	"vector",
	"cradle",
	"aperture",
	"quorum",
	"halyard",
	"tessera",
	"cinder",
	"meridian",
	"solstice",
	"kestrel",
	"pennant",
	"quarry",
];
