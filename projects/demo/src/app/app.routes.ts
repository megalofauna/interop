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
		title: "Segmented control",
		loadComponent: () =>
			import("./components/segmented-control/segmented-control-demo").then(
				(m) => m.SegmentedControlDemo,
			),
	},
	{
		path: "components/select",
		title: "Select",
		loadComponent: () =>
			import("./components/select/select-demo").then((m) => m.SelectDemo),
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
		path: "foundations/app-shell",
		title: "App shell",
		loadComponent: () =>
			import("./foundations/app-shell/app-shell-demo").then(
				(m) => m.AppShellDemo,
			),
	},
	{
		path: "foundations/flow",
		title: "Flow",
		loadComponent: () =>
			import("./foundations/flow/flow-demo").then((m) => m.FlowDemo),
	},
	{
		path: "foundations/radius",
		title: "Radius (comparison)",
		loadComponent: () =>
			import("./foundations/radius/radius-demo").then((m) => m.RadiusDemo),
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
