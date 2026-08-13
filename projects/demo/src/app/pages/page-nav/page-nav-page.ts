import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
	CodeBlock,
	InteropCellDef,
	InteropTable,
	PageNav,
	type PageNavLink,
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
	selector: "page-nav-page",
	standalone: true,
	imports: [
		PageNav,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoPage,
		DemoSection,
		DemoExample,
		DemoMasthead,
	],
	templateUrl: "./page-nav-page.html",
	styleUrl: "./page-nav-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageNavPage {
	readonly links: PageNavLink[] = [
		{ label: "Usage", href: "#usage" },
		{ label: "Orientation", href: "#orientation" },
		{ label: "CSS tokens", href: "#tokens" },
		{ label: "API", href: "#api" },
	];

	readonly nestedLinks: PageNavLink[] = [
		{
			label: "Getting started",
			href: "#getting-started",
			children: [
				{ label: "Install", href: "#install" },
				{ label: "Import a theme", href: "#theme" },
			],
		},
		{
			label: "Components",
			href: "#components",
			children: [{ label: "Button", href: "#button" }],
		},
	];

	readonly basicCode = `<itx-page-nav [links]="links" [activeHref]="'#usage'" />`;

	readonly basicTs = `readonly links: PageNavLink[] = [
  { label: "Usage", href: "#usage" },
  { label: "Orientation", href: "#orientation" },
  { label: "CSS tokens", href: "#tokens" },
  { label: "API", href: "#api" },
];`;

	readonly verticalCode = `<itx-page-nav
  orientation="vertical"
  label="On this page"
  [links]="nestedLinks"
  [activeHref]="'#install'"
/>`;

	readonly stickyCode = `<!-- Sticks to the top of its nearest scroll container and
     reveals a solid bar once pinned -->
<itx-page-nav [links]="links" [sticky]="true" [fade]="true" />`;

	readonly basicFiles = [
		{ label: "template.html", language: "html", code: this.basicCode },
		{ label: "component.ts", language: "ts", code: this.basicTs },
	];


	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		{
			property: "--itx-pn-background-color",
			default: "transparent until stuck",
		},
		{
			property: "--itx-pn-backdrop-filter",
			default: "none; blur(12px) when stuck",
		},
		{
			property: "--itx-pn-padding-block",
			default: "var(--itx-spacing-4) — 16px",
		},
		{
			property: "--itx-pn-padding-inline",
			default: "var(--itx-spacing-2) — 8px",
		},
		{ property: "--itx-pn-gap", default: "0 — gap between horizontal links" },
		{ property: "--itx-pn-z-index", default: "10" },
		{ property: "--itx-pn-nav-rule-width", default: "2px" },
		{ property: "--itx-pn-nav-rule-color", default: "var(--itx-neutral-4)" },
		{ property: "--itx-pn-font-size", default: "var(--itx-font-size-body)" },
		{ property: "--itx-pn-link-color", default: "var(--itx-muted)" },
		{ property: "--itx-pn-link-color-hover", default: "var(--itx-neutral-12)" },
		{
			property: "--itx-pn-link-color-active",
			default: "var(--itx-neutral-12)",
		},
		{
			property: "--itx-pn-link-padding-block",
			default: "var(--itx-spacing-3) — 12px, one size in every state",
		},
		{
			property: "--itx-pn-link-padding-inline",
			default: "var(--itx-spacing-4) — 16px",
		},
		{ property: "--itx-pn-focus-color", default: "var(--itx-colorway)" },
		{ property: "--itx-pn-indent", default: "Vertical: child indent" },
		{ property: "--itx-pn-item-gap", default: "Vertical: gap between items" },
		{
			property: "--itx-pn-child-font-size",
			default: "Vertical: nested link size",
		},
		{
			property: "--itx-pn-indicator-size",
			default: "5px — vertical active dot",
		},
		{ property: "--itx-pn-indicator-color", default: "var(--itx-colorway)" },
	];

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			name: "links",
			type: "PageNavLink[]",
			default: "[]",
			description:
				"Links to render. Each is { label, href, children? } — children are rendered as a nested list in vertical orientation only.",
		},
		{
			name: "label",
			type: "string",
			default: '"On this page"',
			description:
				"Accessible name for the nav landmark, and the visible heading in vertical orientation.",
		},
		{
			name: "activeHref",
			type: "string | null",
			default: "null",
			description:
				"The link to mark aria-current. Supply it from your own scroll-spy — the nav renders state rather than tracking it.",
		},
		{
			name: "orientation",
			type: '"horizontal" | "vertical"',
			default: '"horizontal"',
			description:
				"Horizontal scrolls on overflow and suits a page header. Vertical renders a heading, nesting, and an active dot, and suits a sidebar.",
		},
		{
			name: "sticky",
			type: "boolean",
			default: "false",
			description:
				"Pins to the top of the nearest scroll container and adds a stuck class once pinned, which reveals the solid bar.",
		},
		{
			name: "smooth",
			type: "boolean",
			default: "true",
			description:
				"Scrolls the active link into view within the nav's own scroll area. Honours prefers-reduced-motion.",
		},
		{
			name: "fade",
			type: "boolean",
			default: "false",
			description: "Adds edge fades to the horizontal scroll area.",
		},
	];
}
