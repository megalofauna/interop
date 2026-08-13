import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropCodeRenderer } from "interop";
import { DEMO_CATALOG } from "../../components/demo-nav/demo-nav.catalog";

/** A section of the library, as a card on the index. */
interface SectionCard {
	label: string;
	route: string;
	count: number;
	description: string;
}

/**
 * Index copy for each catalog group, keyed by group id.
 *
 * Only the prose lives here. The label, the route and the entry count are all
 * read from `DEMO_CATALOG` at construction, so a component added to the catalog
 * raises the count on this page with no edit — the number on the index cannot
 * drift from the number of pages, which is exactly what the hard-coded "24
 * components" in the old footer strip did.
 *
 * A group with no entry here is simply not surfaced on the index. That is the
 * lever for keeping this page lean: `primitives` is internal and `experiments`
 * is a scratchpad, so neither is listed.
 */
const SECTION_COPY: Record<string, string> = {
	components:
		"Native elements with behaviour attached by attribute. Keyboard, ARIA, and form participation come from the platform, not from us.",
	composites:
		"Patterns built out of components. A composite is a shape you assemble; a component is an element you write.",
	foundations:
		"The rules underneath — how type, colour, spacing and radius resolve, and why they resolve that way.",
	directives:
		"Behaviour with no markup of its own, applied to whatever element already carries the meaning.",
};

/** Order on the page, independent of catalog order. */
const SECTION_ORDER = ["components", "composites", "foundations", "directives"];

@Component({
	selector: "home-page",
	standalone: true,
	imports: [RouterLink, InteropCodeRenderer],
	templateUrl: "./home-page.html",
	styleUrl: "./home-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
	/**
	 * Section cards, derived from the catalog.
	 *
	 * A group's route is its `landingRoute` when it has one; groups without an
	 * index (Foundations, Directives) fall back to their first routed entry, so
	 * the card still goes somewhere useful rather than being dropped.
	 *
	 * The count excludes the group's own landing page — `/components` is an entry
	 * in the Components group, and counting it would claim one more component
	 * than exists.
	 */
	protected readonly sections: readonly SectionCard[] = SECTION_ORDER.flatMap(
		(id) => {
			const group = DEMO_CATALOG.find((g) => g.id === id);
			if (!group || group.disabled) return [];

			const routed = group.items.filter(
				(i) => i.route && i.route !== group.landingRoute,
			);
			const route = group.landingRoute ?? routed[0]?.route;
			if (!route) return [];

			return [
				{
					label: group.label,
					route,
					count: routed.length,
					description: SECTION_COPY[id] ?? "",
				},
			];
		},
	);
}
