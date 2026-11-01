// Renders the app to HTML on the server.
import "@angular/compiler";
import {
	bootstrapApplication,
	provideClientHydration,
} from "@angular/platform-browser";
import {
	provideServerRendering,
	renderApplication,
} from "@angular/platform-server";
import { App } from "./app";

export const render = (document: string) =>
	renderApplication(
		(context) =>
			bootstrapApplication(
				App,
				{ providers: [provideServerRendering(), provideClientHydration()] },
				context,
			),
		{ document, url: "/" },
	);
