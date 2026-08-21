import { isDevMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { App } from "./app/app";

bootstrapApplication(App, appConfig)
	.then(() => {
		/*
		 * Contrast audit, dev only.
		 *
		 * Imported by path so it cannot reach a production bundle through the
		 * barrel, and deferred so lazy routes, fonts and the layer engine have all
		 * settled — measuring earlier reads values that are still moving.
		 */
		if (isDevMode()) {
			setTimeout(
				() =>
					import("interop/lib/dev/contrast-audit").then((m) =>
						m.reportContrast(),
					),
				2500,
			);
		}
	})
	.catch((err) => console.error(err));
