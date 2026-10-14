import { bootstrapApplication } from "@angular/platform-browser";
import { guardActivation, registerIcons, watchInteropInDevMode } from "interop";
import { registerLanguages } from "interop/highlight";
import * as tabler from "interop/tabler";
import { appConfig } from "./app/app.config";
import { App } from "./app/app";

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

// The accessibility audit: warnings in the console while developing, removed from production builds.
watchInteropInDevMode();

guardActivation();
registerIcons(...Object.values(tabler));
registerLanguages({
	ts: { label: "TypeScript", load: () => import("shiki/langs/typescript.mjs") },
	html: { label: "HTML", load: () => import("shiki/langs/html.mjs") },
	css: { label: "CSS", load: () => import("shiki/langs/css.mjs") },
});
