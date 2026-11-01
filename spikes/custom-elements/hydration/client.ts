// Hydrates the server-rendered app in the browser.
import "@angular/compiler";
import {
	bootstrapApplication,
	provideClientHydration,
} from "@angular/platform-browser";
import { App } from "./app";

bootstrapApplication(App, { providers: [provideClientHydration()] }).catch(
	(error) => console.error(error),
);
