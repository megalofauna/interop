import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import {
	directoryGroups,
	type CatalogGroup,
} from "../../components/demo-nav/demo-nav.catalog";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";

/**
 * Composites landing page — a directory, not a showcase.
 *
 * Same shape and the same stylesheet as the components directory: both render
 * `.directory__*` from `styles/_directory.scss`, so "the exact style" is
 * guaranteed by there being one stylesheet rather than by two being kept in
 * step.
 *
 * The list comes from `demo-nav.catalog.ts`, so a composite appears in the
 * sidebar and here at the same time or in neither.
 */
@Component({
	selector: "composites-page",
	standalone: true,
	imports: [RouterLink, DemoPage, DemoSection, DemoMasthead],
	templateUrl: "./composites-page.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompositesPage {
	/** Only the composites group — the components directory owns the rest. */
	readonly groups: readonly CatalogGroup[] = directoryGroups(["composites"]);
}
