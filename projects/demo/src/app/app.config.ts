import {
	ApplicationConfig,
	provideZonelessChangeDetection,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHighlighter } from "interop";
import { ShikiHighlighter } from "interop/highlighters/shiki";
import { routes } from "./app.routes";

const highlighter = new ShikiHighlighter({ theme: "github-dark" });

// Fire-and-forget: warm grammars in parallel with bootstrap. First snippet per
// language may flash once if a render happens before the grammar lands;
// every subsequent render is sync. For production, await this in
// `provideAppInitializer` for zero-flash at the cost of slower bootstrap.
void highlighter.preload(["ts", "typescript", "html", "css", "scss"]);

export const appConfig: ApplicationConfig = {
	providers: [
		provideZonelessChangeDetection(),
		provideRouter(routes),
		provideHighlighter(highlighter),
	],
};
