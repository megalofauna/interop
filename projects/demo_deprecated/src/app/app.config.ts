import {
	ApplicationConfig,
	provideZonelessChangeDetection,
} from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { provideHighlighter } from "interop";
import { ShikiHighlighter } from "interop/highlighters/shiki";
import { routes } from "./app.routes";

/*
 * One theme per scheme, and every colour lifted to clear AA.
 *
 * A single dark theme was shipping here, which in light mode put github-dark's
 * editor foreground on a near-white page at 1.03:1 — invisible, across 58
 * spans on a single page. Dual themes fix that; they do not fix the floor,
 * because a syntax theme picks its colours against a background it has never
 * seen. Comments sit at 3.48:1 on the dark ramp and 3.56:1 on the light one,
 * and github-dark's keyword and entity colours drop under AA from layer 3 down.
 *
 * `against` names the WORST surface a code block can land on, not the typical
 * one. Elevation moves toward light in both schemes, so in dark that is the
 * highest layer (L .390) and in light the lowest (L .898). Lifting against the
 * worst case means the result holds at every depth in between.
 */
const highlighter = new ShikiHighlighter({
	themes: { light: "github-light", dark: "github-dark" },
	ensureContrast: {
		ratio: 4.5,
		against: { light: "#dadee1", dark: "#434548" },
	},
});

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
