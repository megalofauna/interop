import { Routes } from "@angular/router";

export const routes: Routes = [
	{ path: "", pathMatch: "full", redirectTo: "components/button" },
	{
		path: "components",
		title: "Components",
		loadComponent: () =>
			import("./components/index").then((m) => m.ComponentsIndex),
	},
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
		path: "components/callout",
		title: "Callout",
		loadComponent: () =>
			import("./components/callout/callout-demo").then((m) => m.CalloutDemo),
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
		path: "components/disclosure",
		title: "Disclosure",
		loadComponent: () =>
			import("./components/disclosure/disclosure-demo").then(
				(m) => m.DisclosureDemo,
			),
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
		path: "components/list",
		title: "List",
		loadComponent: () =>
			import("./components/list/list-demo").then((m) => m.ListDemo),
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
		path: "components/progress",
		title: "Progress",
		loadComponent: () =>
			import("./components/progress/progress-demo").then((m) => m.ProgressDemo),
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
		path: "components/accordion",
		title: "Accordion",
		loadComponent: () =>
			import("./components/accordion/accordion-demo").then(
				(m) => m.AccordionDemo,
			),
	},
	{
		path: "components/cards",
		title: "Cards",
		loadComponent: () =>
			import("./components/cards/cards-demo").then((m) => m.CardsDemo),
	},
	{
		path: "components/chips",
		title: "Chips",
		loadComponent: () =>
			import("./components/chips/chips-demo").then((m) => m.ChipsDemo),
	},
	{
		path: "components/command-palette",
		title: "Command palette",
		loadComponent: () =>
			import("./components/command-palette/command-palette-demo").then(
				(m) => m.CommandPaletteDemo,
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
		path: "components/split-button",
		title: "Split button",
		loadComponent: () =>
			import("./components/split-button/split-button-demo").then(
				(m) => m.SplitButtonDemo,
			),
	},
	{
		path: "components/theme-switcher",
		title: "Theme switcher",
		loadComponent: () =>
			import("./components/theme-switcher/theme-switcher-demo").then(
				(m) => m.ThemeSwitcherDemo,
			),
	},
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
