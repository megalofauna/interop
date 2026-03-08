import { Routes } from "@angular/router";

export const routes: Routes = [
	{
		path: "",
		pathMatch: "full",
		redirectTo: "philosophy",
	},
	{
		path: "philosophy",
		title: "Philosophy",
		loadComponent: () => import("./demo-page").then((m) => m.DemoPage),
	},
	{
		path: "components",
		title: "Components",
		loadComponent: () => import("./demo-page").then((m) => m.DemoPage),
	},
	{
		path: "containers",
		title: "Containers",
		loadComponent: () => import("./demo-page").then((m) => m.DemoPage),
	},
	{
		path: "services",
		title: "Services",
		loadComponent: () => import("./demo-page").then((m) => m.DemoPage),
	},
	{
		path: "adaptastack",
		title: "AdaptaStack",
		loadComponent: () => import("./demo-page").then((m) => m.DemoPage),
	},
	{
		path: "composites",
		title: "Composites",
		loadComponent: () => import("./demo-page").then((m) => m.DemoPage),
	},
	{
		path: "**",
		redirectTo: "philosophy",
	},
];
