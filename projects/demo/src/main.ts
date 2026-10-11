import { bootstrapApplication } from "@angular/platform-browser";
import { guardActivation, registerIcons } from "interop";
import * as tabler from "interop/tabler";
import { appConfig } from "./app/app.config";
import { App } from "./app/app";

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

guardActivation();
registerIcons(...Object.values(tabler));
