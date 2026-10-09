import { Injectable, signal } from "@angular/core";

export interface PageMeta {
	category: string;
	title: string;
}

/**
 * Single source of truth for the active page's identity (category + title).
 *
 * Published by `<demo-masthead>` (the page's own heading) and consumed by the
 * app-shell header, which surfaces it as a breadcrumb — "Interop › Components ›
 * Button" — once the large heading scrolls away. Root-provided so the masthead
 * deep in the routed page and the shell share one instance.
 */
@Injectable({ providedIn: "root" })
export class DemoPageMeta {
	readonly meta = signal<PageMeta>({ category: "", title: "" });

	set(meta: PageMeta): void {
		this.meta.set(meta);
	}
}
