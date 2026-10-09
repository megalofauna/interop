import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import {
	directoryGroups,
	type CatalogGroup,
} from "../../components/demo-nav/demo-nav.catalog";

/**
 * Components landing page — a directory, not a showcase.
 *
 * Prints one link card per demo page, grouped exactly as the sidebar groups
 * them, because both read the same array: `demo-nav.catalog.ts`. That module is
 * plain data with no Angular imports, so reading it here does not drag the nav
 * component or its icon provider into this route's lazy chunk.
 *
 * The page holds no list of its own. Adding a component to the catalog puts it
 * in the sidebar and on this page at once, which is the only arrangement where
 * the two cannot silently disagree.
 */
@Component({
	selector: "components-page",
	standalone: true,
	imports: [RouterLink, DemoPage, DemoSection, DemoMasthead],
	templateUrl: "./components-page.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsPage {
	/**
	 * Routable, non-nav entries only, with empty groups dropped — see
	 * `directoryGroups()`. Derived, never maintained: an entry cannot exist in
	 * the sidebar and not here.
	 *
	 * Entries with no `route` are omitted rather than rendered disabled: every
	 * element on this page is a link card, and a card you cannot follow is a
	 * dead end that costs a tab stop (or, unfocusable, a hole in the tab order)
	 * for no destination. `Code Block` is the only one today — the fix is a demo
	 * page for it, not a greyed-out card here. The `disabled` groups (Rigs,
	 * Services, Composites) drop out for the same reason: no items.
	 *
	 * Computed once at construction. The catalog is a module constant, so there
	 * is nothing for it to react to.
	 */
	readonly groups: readonly CatalogGroup[] = directoryGroups([
		"foundations",
		"components",
		"directives",
		"primitives",
		"experiments",
	]);
}
