import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropIcon } from "interop/icon";
import { catalog, usedBy, type CatalogEntry } from "../catalog";

@Component({
	selector: "demo-components",
	host: { "itx-flow": "" },
	imports: [RouterLink, InteropIcon],
	templateUrl: "./index.html",
	styleUrl: "./index.css",
})
export class ComponentsIndex {
	/** Every component page, from the catalog, in its order, with the pages built from it. */
	protected readonly components = catalog.map((entry: CatalogEntry) => ({
		...entry,
		usedBy: usedBy(entry.slug),
	}));

	private readonly titles = new Map<string, string>(
		catalog.map((entry) => [entry.slug, entry.title]),
	);

	protected title(slug: string): string {
		return this.titles.get(slug) ?? slug;
	}
}
