import { Routes } from "@angular/router";

export const routes: Routes = [
	{ path: "", pathMatch: "full", redirectTo: "components/button" },
	{
		path: "components/badge",
		title: "Badge",
		loadComponent: () => import("./components/badge/badge-demo").then((m) => m.BadgeDemo),
	},
	{
		path: "components/button",
		title: "Button",
		loadComponent: () => import("./components/button/button-demo").then((m) => m.ButtonDemo),
	},
	{
		path: "components/code-block",
		title: "Code block",
		loadComponent: () => import("./components/code-block/code-block-demo").then((m) => m.CodeBlockDemo),
	},
	{
		path: "components/icon",
		title: "Icon",
		loadComponent: () => import("./components/icon/icon-demo").then((m) => m.IconDemo),
	},
	{
		path: "foundations/typography",
		title: "Typography",
		loadComponent: () => import("./foundations/typography/typography-demo").then((m) => m.TypographyDemo),
	},
];
