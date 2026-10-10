import { Routes } from "@angular/router";

export const routes: Routes = [
	{ path: "", pathMatch: "full", redirectTo: "components/button" },
	{
		path: "components/button",
		title: "Button",
		loadComponent: () => import("./components/button/button-demo").then((m) => m.ButtonDemo),
	},
];
