import { Route, Routes } from "@angular/router";
import { catalog, type CatalogSlug } from "./components/catalog";

/** One lazy loader per catalog entry. The type fails to compile when one is missing or extra. */
const loaders = {
	accordion: () =>
		import("./components/accordion/accordion-demo").then(
			(m) => m.AccordionDemo,
		),
	badge: () => import("./components/badge/badge-demo").then((m) => m.BadgeDemo),
	button: () =>
		import("./components/button/button-demo").then((m) => m.ButtonDemo),
	callout: () =>
		import("./components/callout/callout-demo").then((m) => m.CalloutDemo),
	cards: () => import("./components/cards/cards-demo").then((m) => m.CardsDemo),
	checkbox: () =>
		import("./components/checkbox/checkbox-demo").then((m) => m.CheckboxDemo),
	chips: () => import("./components/chips/chips-demo").then((m) => m.ChipsDemo),
	"code-block": () =>
		import("./components/code-block/code-block-demo").then(
			(m) => m.CodeBlockDemo,
		),
	"command-palette": () =>
		import("./components/command-palette/command-palette-demo").then(
			(m) => m.CommandPaletteDemo,
		),
	dialog: () =>
		import("./components/dialog/dialog-demo").then((m) => m.DialogDemo),
	disclosure: () =>
		import("./components/disclosure/disclosure-demo").then(
			(m) => m.DisclosureDemo,
		),
	field: () => import("./components/field/field-demo").then((m) => m.FieldDemo),
	group: () => import("./components/group/group-demo").then((m) => m.GroupDemo),
	icon: () => import("./components/icon/icon-demo").then((m) => m.IconDemo),
	list: () => import("./components/list/list-demo").then((m) => m.ListDemo),
	"page-nav": () =>
		import("./components/page-nav/page-nav-demo").then((m) => m.PageNavDemo),
	popover: () =>
		import("./components/popover/popover-demo").then((m) => m.PopoverDemo),
	progress: () =>
		import("./components/progress/progress-demo").then((m) => m.ProgressDemo),
	"radio-group": () =>
		import("./components/radio-group/radio-group-demo").then(
			(m) => m.RadioGroupDemo,
		),
	"scroll-area": () =>
		import("./components/scroll-area/scroll-area-demo").then(
			(m) => m.ScrollAreaDemo,
		),
	"segmented-control": () =>
		import("./components/segmented-control/segmented-control-demo").then(
			(m) => m.SegmentedControlDemo,
		),
	select: () =>
		import("./components/select/select-demo").then((m) => m.SelectDemo),
	slider: () =>
		import("./components/slider/slider-demo").then((m) => m.SliderDemo),
	"split-button": () =>
		import("./components/split-button/split-button-demo").then(
			(m) => m.SplitButtonDemo,
		),
	steps: () => import("./components/steps/steps-demo").then((m) => m.StepsDemo),
	switch: () =>
		import("./components/switch/switch-demo").then((m) => m.SwitchDemo),
	table: () => import("./components/table/table-demo").then((m) => m.TableDemo),
	tabs: () => import("./components/tabs/tabs-demo").then((m) => m.TabsDemo),
	tags: () => import("./components/tags/tags-demo").then((m) => m.TagsDemo),
	"theme-switcher": () =>
		import("./components/theme-switcher/theme-switcher-demo").then(
			(m) => m.ThemeSwitcherDemo,
		),
	toast: () => import("./components/toast/toast-demo").then((m) => m.ToastDemo),
	toolbar: () =>
		import("./components/toolbar/toolbar-demo").then((m) => m.ToolbarDemo),
	tooltip: () =>
		import("./components/tooltip/tooltip-demo").then((m) => m.TooltipDemo),
	tree: () => import("./components/tree/tree-demo").then((m) => m.TreeDemo),
} satisfies Record<CatalogSlug, NonNullable<Route["loadComponent"]>>;

const componentRoutes: Routes = catalog.map((entry) => ({
	path: `components/${entry.slug}`,
	title: entry.title,
	loadComponent: loaders[entry.slug],
}));

export const routes: Routes = [
	{ path: "", pathMatch: "full", redirectTo: "components" },
	{
		path: "components",
		title: "Components",
		loadComponent: () =>
			import("./components/index").then((m) => m.ComponentsIndex),
	},
	...componentRoutes,
	{
		path: "labs/button",
		title: "Button lab",
		data: { lab: true },
		loadComponent: () =>
			import("./lab/button/button-lab").then((m) => m.ButtonLab),
	},
	{
		path: "labs/badge",
		title: "Badge lab",
		data: { lab: true },
		loadComponent: () =>
			import("./lab/badge/badge-lab").then((m) => m.BadgeLab),
	},
	{
		path: "labs/track",
		title: "Track lab",
		data: { lab: true },
		loadComponent: () =>
			import("./lab/track/track-lab").then((m) => m.TrackLab),
	},
	{
		path: "labs/table",
		title: "Table lab",
		data: { lab: true },
		loadComponent: () =>
			import("./lab/table/table-lab").then((m) => m.TableLab),
	},
	// Old /patterns/ links land on the same page under /components/.
	{ path: "patterns/:name", redirectTo: "components/:name" },
	{
		path: "foundations/flow",
		title: "Flow",
		loadComponent: () =>
			import("./foundations/flow/flow-demo").then((m) => m.FlowDemo),
	},
	{
		path: "foundations/typography",
		title: "Typography",
		loadComponent: () =>
			import("./foundations/typography/typography-demo").then(
				(m) => m.TypographyDemo,
			),
	},
];
