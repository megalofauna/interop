import {
	ApplicationConfig,
	provideZonelessChangeDetection,
} from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
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
		// Reset scroll to top on forward navigation (restore on back/forward).
		// Without this the document scroll persists across route changes, so every
		// page loads already scrolled past its <h1> — leaving the header breadcrumb
		// (driven by the h1's view-timeline) stuck permanently on.
		// `anchorScrolling` makes cross-page fragment links land on the section
		// they name (the Principles page links each principle to the demo section
		// that proves it). `demo-section` already carries a `scroll-margin-top`,
		// so the landing target clears the sticky page nav.
		provideRouter(
			routes,
			withInMemoryScrolling({
				scrollPositionRestoration: "enabled",
				anchorScrolling: "enabled",
			}),
		),
		provideHighlighter(highlighter),
	],
};
