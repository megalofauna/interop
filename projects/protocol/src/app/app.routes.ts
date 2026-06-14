import { Routes } from "@angular/router";

export const routes: Routes = [
	{
		path: "",
		loadComponent: () =>
			import("./pages/home/home-page").then((m) => m.HomePage),
	},
	{
		path: ":slug",
		loadComponent: () =>
			import("./content/content-page").then((m) => m.ContentPage),
	},
];
