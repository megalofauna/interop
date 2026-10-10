import { Injectable, signal } from "@angular/core";

export interface DemoNavEntry {
	/** Anchor id — matches the section host element's id. */
	id: string;
	/** Nav label — the section heading. */
	heading: string;
	/** Section host element, observed for scroll-spy. */
	el: HTMLElement;
}

/**
 * Per-page registry, provided by {@link DemoPage}. Each {@link DemoSection}
 * registers itself on init, so the page nav links and the active-section
 * tracking are derived from the DOM rather than a hand-maintained links array
 * plus an IntersectionObserver on every page.
 */
@Injectable()
export class DemoPageRegistry {
	private readonly _sections = signal<DemoNavEntry[]>([]);

	/** Sections in registration order, which is DOM order (init runs top-down). */
	readonly sections = this._sections.asReadonly();

	/** Id of the section currently considered active for nav highlighting. */
	readonly activeId = signal<string | null>(null);

	register(entry: DemoNavEntry): void {
		this._sections.update((list) => [...list, entry]);
	}

	unregister(id: string): void {
		this._sections.update((list) => list.filter((e) => e.id !== id));
	}
}

/** Slugify a heading into a stable anchor id: "Activation guards" → "activation-guards". */
export function demoSlug(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}
