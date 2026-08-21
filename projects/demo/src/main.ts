import { isDevMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { App } from "./app/app";

bootstrapApplication(App, appConfig)
	.then(() => {
		// SPIKE — dev-mode contrast audit (Q4). Delayed so lazy routes, fonts and
		// the layer engine have all settled; measuring earlier reads stale values.
		if (isDevMode()) {
			setTimeout(
				() => import("./app/a11y-audit").then((m) => m.reportIntoDom()),
				2500,
			);
		}
	})
	.catch((err) => console.error(err));
