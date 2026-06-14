import {
	ApplicationRef,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	EnvironmentInjector,
	createEnvironmentInjector,
	effect,
	inject,
	signal,
	viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { Title } from "@angular/platform-browser";
import { provideHighlighter } from "interop";
import { ContentNotFoundError, loadContent } from "./content";
import { hydrateCodeBlocks } from "./content-codeblocks";
import { ProtocolHighlighter } from "./protocol-highlighter";

type ContentState =
	| { status: "loading" }
	| { status: "ready"; html: string }
	| { status: "missing" }
	| { status: "error" };

/**
 * Renders a markdown content page for the `:slug` route, inside an
 * [interop-typography-root] scope so the design system styles the prose.
 *
 * Two-stage render:
 *   1. The trusted HTML string (marked + the Layer 1 upgrade pass) is written
 *      directly to a host element via innerHTML. Direct assignment, not a
 *      sanitized binding, because the upgrade pass emits custom-element tags
 *      (interop-table, itx-inline-code) the sanitizer would unwrap — sound
 *      because content is first-party, authored in this repo.
 *   2. hydrateCodeBlocks walks that DOM and swaps each <pre><code> for a real
 *      itx-code-block instance (Layer 2).
 *
 * The shiki highlighter lives in a CHILD environment injector created here, not
 * at app bootstrap — so shiki bundles into this lazy route's chunk and never
 * touches the initial bundle.
 */
@Component({
	selector: "article[ptx-content-page]",
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@let s = state();
		@switch (s.status) {
			@case ("ready") {
				<div #host interop-typography-root></div>
			}
			@case ("loading") {
				<p interop-typography-root>Loading…</p>
			}
			@case ("missing") {
				<div interop-typography-root>
					<h1>Page not found</h1>
					<p>There’s no content authored for this address yet.</p>
				</div>
			}
			@default {
				<div interop-typography-root>
					<h1>Something went wrong</h1>
					<p>That content couldn’t be rendered.</p>
				</div>
			}
		}
	`,
})
export class ContentPage {
	private readonly route = inject(ActivatedRoute);
	private readonly title = inject(Title);
	private readonly appRef = inject(ApplicationRef);

	/** Child injector carrying the slim highlighter — keeps shiki in this chunk. */
	private readonly codeBlockInjector = createEnvironmentInjector(
		[provideHighlighter(new ProtocolHighlighter())],
		inject(EnvironmentInjector),
	);

	private readonly host = viewChild<ElementRef<HTMLElement>>("host");

	protected readonly state = signal<ContentState>({ status: "loading" });

	constructor() {
		this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
			void this.render(params.get("slug") ?? "");
		});

		// Once the host element exists for a ready page, inject the HTML and
		// hydrate its code fences into live components. Re-runs on every
		// navigation; cleanup destroys the previous page's instances.
		effect((onCleanup) => {
			const current = this.state();
			const host = this.host()?.nativeElement;
			if (current.status !== "ready" || !host) return;

			host.innerHTML = current.html;
			const refs = hydrateCodeBlocks(host, this.codeBlockInjector, this.appRef);
			onCleanup(() => {
				for (const ref of refs) ref.destroy();
			});
		});

		inject(DestroyRef).onDestroy(() => this.codeBlockInjector.destroy());
	}

	private async render(slug: string): Promise<void> {
		this.state.set({ status: "loading" });
		try {
			const { meta, html } = await loadContent(slug);
			this.title.setTitle(meta.title ? `${meta.title} — Protocol` : "Protocol");
			this.state.set({ status: "ready", html });
		} catch (error) {
			this.title.setTitle("Not found — Protocol");
			this.state.set({
				status: error instanceof ContentNotFoundError ? "missing" : "error",
			});
		}
	}
}
