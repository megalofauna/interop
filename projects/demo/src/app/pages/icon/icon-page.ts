import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import { InteropIcon, InteropTable, InteropCellDef, provideInteropIcons, type TableColumn } from 'interop';
import { TablerRocket } from "interop/lib/iconsets/tabler/outline/tabler-rocket";
import { TablerBug } from "interop/lib/iconsets/tabler/outline/tabler-bug";
import { TablerBolt } from "interop/lib/iconsets/tabler/outline/tabler-bolt";
import { TablerArchive } from "interop/lib/iconsets/tabler/outline/tabler-archive";
import { TablerInfoCircle } from "interop/lib/iconsets/tabler/outline/tabler-info-circle";
import { TablerCheck } from "interop/lib/iconsets/tabler/outline/tabler-check";
import { TablerX } from "interop/lib/iconsets/tabler/outline/tabler-x";
import { TablerSettings } from "interop/lib/iconsets/tabler/outline/tabler-settings";
import { TablerUser } from "interop/lib/iconsets/tabler/outline/tabler-user";
import { TablerHome } from "interop/lib/iconsets/tabler/outline/tabler-home";
import { TablerSearch } from "interop/lib/iconsets/tabler/outline/tabler-search";
import { TablerBell } from "interop/lib/iconsets/tabler/outline/tabler-bell";
import { TablerStar } from "interop/lib/iconsets/tabler/outline/tabler-star";
import { TablerArrowUp } from "interop/lib/iconsets/tabler/outline/tabler-arrow-up";
import { TablerArrowDown } from "interop/lib/iconsets/tabler/outline/tabler-arrow-down";
import { CodeBlock } from "@interop/composites";
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
	selector: "icon-page",
	standalone: true,
	imports: [InteropIcon, InteropTable, InteropCellDef, CodeBlock, DemoSection, DemoExample, DemoNotes],
	providers: [
		provideInteropIcons(
			TablerRocket, TablerBug, TablerBolt, TablerArchive, TablerInfoCircle,
			TablerCheck, TablerX, TablerSettings, TablerUser, TablerHome,
			TablerSearch, TablerBell, TablerStar, TablerArrowUp, TablerArrowDown,
		),
	],
	templateUrl: "./icon-page.html",
	styleUrl: "./icon-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconPage {
	gridIcons = [
		'tabler-rocket', 'tabler-bug', 'tabler-bolt', 'tabler-archive', 'tabler-info-circle',
		'tabler-check', 'tabler-x', 'tabler-settings', 'tabler-user', 'tabler-home',
		'tabler-search', 'tabler-bell', 'tabler-star', 'tabler-arrow-up', 'tabler-arrow-down',
	];

	previewSize = signal(24);

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			name: "name",
			type: "string | undefined",
			default: "undefined",
			description: "Icon registry key. When provided, the icon is looked up in the nearest provideInteropIcons() scope.",
		},
		{
			name: "size",
			type: "number",
			default: "24",
			description: "Icon size in pixels. Applied to both width and height.",
		},
		{
			name: "strokeWidth",
			type: "number | undefined",
			default: "undefined",
			description: "Stroke width override in viewBox coordinate units. Falls back to the icon's own default when not set.",
		},
		{
			name: "color",
			type: "string | undefined",
			default: "undefined",
			description: "Colour override. Accepts any CSS colour value. Falls back to currentColor when not set.",
		},
		{
			name: "decorative",
			type: "boolean",
			default: "true",
			description: "When true, aria-hidden is applied and the icon is invisible to assistive technology.",
		},
		{
			name: "ariaLabel",
			type: "string | undefined",
			default: "undefined",
			description: "Accessible label for non-decorative icons. Set [decorative]=\"false\" when providing this.",
		},
	];

	// ── Code snippets ────────────────────────────────────────────────────────
	readonly basicCode = `<interop-icon name="tabler-rocket" />`;

	readonly sizesCode = `<interop-icon name="tabler-bell" [size]="16" />
<interop-icon name="tabler-bell" [size]="24" />
<interop-icon name="tabler-bell" [size]="32" />
<interop-icon name="tabler-bell" [size]="48" />`;

	readonly strokeCode = `<interop-icon name="tabler-star" [size]="32" [strokeWidth]="1" />
<interop-icon name="tabler-star" [size]="32" [strokeWidth]="1.5" />
<interop-icon name="tabler-star" [size]="32" [strokeWidth]="2" />
<interop-icon name="tabler-star" [size]="32" [strokeWidth]="3" />`;

	readonly colorCode = `<interop-icon name="tabler-check" [size]="28" color="var(--itx-success)" />
<interop-icon name="tabler-info-circle" [size]="28" color="var(--itx-info)" />
<interop-icon name="tabler-bolt" [size]="28" color="var(--itx-warning)" />
<interop-icon name="tabler-x" [size]="28" color="var(--itx-danger)" />`;

	readonly registerCode = `// app.config.ts
import { provideInteropIcons } from '@interop/ui';
import { TablerRocket } from '@interop/ui/icons/tabler/outline/tabler-rocket';

export const appConfig: ApplicationConfig = {
  providers: [
    provideInteropIcons(TablerRocket),
  ],
};`;

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Icon component added to manifest',
			body: 'InteropIcon renders SVG icons from the registry by name, or projects arbitrary third-party icon content as an escape hatch.',
		},
		{
			type: 'note',
			label: 'Tree shaking',
			body: 'Icons are never re-exported from the main barrel. Always import individual icons directly from their source paths (e.g. src/lib/iconsets/tabler/outline/tabler-rocket) to keep bundle size minimal.',
		},
		{
			type: 'note',
			label: 'Default iconset',
			body: 'Tabler outline icons are the default iconset for the protocol theme. Register them at any DI scope with provideInteropIcons().',
		},
	];
}
