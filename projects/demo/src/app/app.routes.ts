import { Routes } from "@angular/router";

export const routes: Routes = [
	{ path: "", pathMatch: "full", redirectTo: "components/button" },
	{
		path: "components/badge",
		title: "Badge",
		loadComponent: () =>
			import("./components/badge/badge-demo").then((m) => m.BadgeDemo),
	},
	{
		path: "components/button",
		title: "Button",
		loadComponent: () =>
			import("./components/button/button-demo").then((m) => m.ButtonDemo),
	},
	{
		path: "components/checkbox",
		title: "Checkbox",
		loadComponent: () =>
			import("./components/checkbox/checkbox-demo").then((m) => m.CheckboxDemo),
	},
	{
		path: "components/code-block",
		title: "Code block",
		loadComponent: () =>
			import("./components/code-block/code-block-demo").then(
				(m) => m.CodeBlockDemo,
			),
	},
	{
		path: "components/dialog",
		title: "Dialog",
		loadComponent: () =>
			import("./components/dialog/dialog-demo").then((m) => m.DialogDemo),
	},
	{
		path: "components/field",
		title: "Field",
		loadComponent: () =>
			import("./components/field/field-demo").then((m) => m.FieldDemo),
	},
	{
		path: "components/group",
		title: "Group",
		loadComponent: () =>
			import("./components/group/group-demo").then((m) => m.GroupDemo),
	},
	{
		path: "components/icon",
		title: "Icon",
		loadComponent: () =>
			import("./components/icon/icon-demo").then((m) => m.IconDemo),
	},
	{
		path: "components/page-nav",
		title: "Page nav",
		loadComponent: () =>
			import("./components/page-nav/page-nav-demo").then((m) => m.PageNavDemo),
	},
	{
		path: "components/popover",
		title: "Popover",
		loadComponent: () =>
			import("./components/popover/popover-demo").then((m) => m.PopoverDemo),
	},
	{
		path: "components/radio-group",
		title: "Radio group",
		loadComponent: () =>
			import("./components/radio-group/radio-group-demo").then(
				(m) => m.RadioGroupDemo,
			),
	},
	{
		path: "components/scroll-area",
		title: "Scroll area",
		loadComponent: () =>
			import("./components/scroll-area/scroll-area-demo").then(
				(m) => m.ScrollAreaDemo,
			),
	},
	{
		path: "components/segmented-control",
		pathMatch: "full",
		redirectTo: "patterns/segmented-control",
	},
	{
		path: "components/select",
		title: "Select",
		loadComponent: () =>
			import("./components/select/select-demo").then((m) => m.SelectDemo),
	},
	{
		path: "components/slider",
		title: "Slider",
		loadComponent: () =>
			import("./components/slider/slider-demo").then((m) => m.SliderDemo),
	},
	{
		path: "components/steps",
		title: "Steps",
		loadComponent: () =>
			import("./components/steps/steps-demo").then((m) => m.StepsDemo),
	},
	{
		path: "components/switch",
		title: "Switch",
		loadComponent: () =>
			import("./components/switch/switch-demo").then((m) => m.SwitchDemo),
	},
	{
		path: "components/table",
		title: "Table",
		loadComponent: () =>
			import("./components/table/table-demo").then((m) => m.TableDemo),
	},
	{
		path: "components/tabs",
		title: "Tabs",
		loadComponent: () =>
			import("./components/tabs/tabs-demo").then((m) => m.TabsDemo),
	},
	{
		path: "components/tags",
		title: "Tags",
		loadComponent: () =>
			import("./components/tags/tags-demo").then((m) => m.TagsDemo),
	},
	{
		path: "components/toast",
		title: "Toast",
		loadComponent: () =>
			import("./components/toast/toast-demo").then((m) => m.ToastDemo),
	},
	{
		path: "components/toolbar",
		title: "Toolbar",
		loadComponent: () =>
			import("./components/toolbar/toolbar-demo").then((m) => m.ToolbarDemo),
	},
	{
		path: "components/tooltip",
		title: "Tooltip",
		loadComponent: () =>
			import("./components/tooltip/tooltip-demo").then((m) => m.TooltipDemo),
	},
	{
		path: "components/tree",
		title: "Tree",
		loadComponent: () =>
			import("./components/tree/tree-demo").then((m) => m.TreeDemo),
	},
	{
		path: "patterns/cards",
		title: "Cards",
		data: { pattern: true },
		loadComponent: () =>
			import("./patterns/cards/cards-demo").then((m) => m.CardsDemo),
	},
	{
		path: "patterns/chips",
		title: "Chips",
		data: { pattern: true },
		loadComponent: () =>
			import("./patterns/chips/chips-demo").then((m) => m.ChipsDemo),
	},
	{
		path: "patterns/command-palette",
		title: "Command palette",
		data: { pattern: true },
		loadComponent: () =>
			import("./patterns/command-palette/command-palette-demo").then(
				(m) => m.CommandPaletteDemo,
			),
	},
	{
		path: "patterns/segmented-control",
		title: "Segmented control",
		data: { pattern: true },
		loadComponent: () =>
			import("./patterns/segmented-control/segmented-control-demo").then(
				(m) => m.SegmentedControlDemo,
			),
	},
	{
		path: "patterns/split-button",
		title: "Split button",
		data: { pattern: true },
		loadComponent: () =>
			import("./patterns/split-button/split-button-demo").then(
				(m) => m.SplitButtonDemo,
			),
	},
	{
		path: "patterns/theme-switcher",
		title: "Theme switcher",
		data: { pattern: true },
		loadComponent: () =>
			import("./patterns/theme-switcher/theme-switcher-demo").then(
				(m) => m.ThemeSwitcherDemo,
			),
	},
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
