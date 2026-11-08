import {
	Component,
	DestroyRef,
	ElementRef,
	afterNextRender,
	inject,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { bindTooltip } from "interop";
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
	constructor() {
		const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
		const destroyRef = inject(DestroyRef);
		afterNextRender(() => {
			const unbinds = ["list", "grid", "details"].map((view) =>
				bindTooltip(
					host.querySelector<HTMLElement>(
						`input[name="view"][value="${view}"]`,
					)!,
					host.querySelector<HTMLElement>(`#tip-${view}`)!,
				),
			);
			destroyRef.onDestroy(() => unbinds.forEach((unbind) => unbind()));
		});
	}

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
