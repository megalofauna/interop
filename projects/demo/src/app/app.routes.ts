import { Routes } from "@angular/router";

export const routes: Routes = [
	{
		path: "",
		title: "Interop",
		pathMatch: "full",
		loadComponent: () =>
			import("./pages/home/home-page").then((m) => m.HomePage),
	},
	{
		path: "components/badge",
		title: "Badge — Interop",
		loadComponent: () =>
			import("./pages/badge/badge-page").then((m) => m.BadgePage),
	},
	{
		path: "components/button",
		title: "Button — Interop",
		loadComponent: () =>
			import("./pages/button/button-page").then((m) => m.ButtonPage),
	},
	{
		path: "components/callout",
		title: "Callout — Interop",
		loadComponent: () =>
			import("./pages/callout/callout-page").then((m) => m.CalloutPage),
	},
	{
		path: "components/checkbox",
		title: "Checkbox — Interop",
		loadComponent: () =>
			import("./pages/checkbox/checkbox-page").then((m) => m.CheckboxPage),
	},
	{
		path: "components/dialog",
		title: "Dialog — Interop",
		loadComponent: () =>
			import("./pages/dialog/dialog-page").then((m) => m.DialogPage),
	},
	{
		path: "components/expansion-panel",
		title: "Expansion Panel — Interop",
		loadComponent: () =>
			import("./pages/expansion-panel/expansion-panel-page").then(
				(m) => m.ExpansionPanelPage,
			),
	},
	{
		path: "components/chip",
		title: "Chip — Interop",
		loadComponent: () =>
			import("./pages/chip/chip-page").then((m) => m.ChipPage),
	},
	{
		path: "components/field",
		title: "Field — Interop",
		loadComponent: () =>
			import("./pages/field/field-page").then((m) => m.FieldPage),
	},
	{
		path: "components/icon",
		title: "Icon — Interop",
		loadComponent: () =>
			import("./pages/icon/icon-page").then((m) => m.IconPage),
	},
	{
		path: "components/kbd",
		title: "Kbd — Interop",
		loadComponent: () => import("./pages/kbd/kbd-page").then((m) => m.KbdPage),
	},
	{
		path: "components/list",
		title: "List — Interop",
		loadComponent: () =>
			import("./pages/list/list-page").then((m) => m.ListPage),
	},
	{
		path: "components/listbox",
		title: "Listbox — Interop",
		loadComponent: () =>
			import("./pages/listbox/listbox-page").then((m) => m.ListboxPage),
	},
	{
		path: "components/progress",
		title: "Progress — Interop",
		loadComponent: () =>
			import("./pages/progress/progress-page").then((m) => m.ProgressPage),
	},
	{
		path: "components/radio",
		title: "Radio — Interop",
		loadComponent: () =>
			import("./pages/radio/radio-page").then((m) => m.RadioPage),
	},
	{
		path: "components/scroll-area",
		title: "Scroll Area — Interop",
		loadComponent: () =>
			import("./pages/scroll-area/scroll-area-page").then(
				(m) => m.ScrollAreaPage,
			),
	},
	{
		path: "components/table",
		title: "Table — Interop",
		loadComponent: () =>
			import("./pages/table/table-page").then((m) => m.TablePage),
	},
	{
		path: "components/toast",
		title: "Toast — Interop",
		loadComponent: () =>
			import("./pages/toast/toast-page").then((m) => m.ToastPage),
	},
	{
		path: "components/tooltip",
		title: "Tooltip — Interop",
		loadComponent: () =>
			import("./pages/tooltip/tooltip-page").then((m) => m.TooltipPage),
	},
	{
		path: "components/stepper",
		title: "Stepper — Interop",
		loadComponent: () =>
			import("./pages/stepper/stepper-page").then((m) => m.StepperPage),
	},
	{
		path: "components/tabs",
		title: "Tabs — Interop",
		loadComponent: () =>
			import("./pages/tabs/tabs-page").then((m) => m.TabsPage),
	},
	{
		path: "components/segmented-control",
		title: "Segmented Control — Interop",
		loadComponent: () =>
			import("./pages/segmented-control/segmented-control-page").then(
				(m) => m.SegmentedControlPage,
			),
	},
	{
		path: "components/slider",
		title: "Slider — Interop",
		loadComponent: () =>
			import("./pages/slider/slider-page").then((m) => m.SliderPage),
	},
	{
		path: "components/toggle",
		title: "Toggle — Interop",
		loadComponent: () =>
			import("./pages/toggle/toggle-page").then((m) => m.TogglePage),
	},
	{
		path: "components/visimorph",
		title: "Visimorph — Interop",
		loadComponent: () =>
			import("./pages/visimorph/visimorph-page").then((m) => m.VisiMorphPage),
	},
	{
		path: "components/auto-render",
		title: "Auto Render — Interop",
		loadComponent: () =>
			import("./pages/auto-render/auto-render-page").then(
				(m) => m.AutoRenderPage,
			),
	},
	{
		path: "components/code-renderer",
		title: "Code Renderer — Interop",
		loadComponent: () =>
			import("./pages/code-renderer/code-renderer-page").then(
				(m) => m.CodeRendererPage,
			),
	},
	{
		path: "content",
		title: "Content (djot) — Interop",
		loadComponent: () =>
			import("./pages/content/content-page").then((m) => m.ContentPage),
	},
	{
		path: "**",
		redirectTo: "components/checkbox",
	},
];
