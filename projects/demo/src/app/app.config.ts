import {
	ApplicationConfig,
	provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(
			routes,
			// Links with a fragment scroll to their section, as plain HTML links do.
			withInMemoryScrolling({ anchorScrolling: "enabled" }),
		),
	],
};
