import {
	Component,
	DestroyRef,
	ElementRef,
	afterNextRender,
	inject,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { bindTooltip } from "interop";
import { InteropIcon } from "interop/icon";

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

	/** Every component page, read from the routes, so a new component appears here on its own. */
	protected readonly components = inject(Router)
		.config.filter(
			(route) =>
				route.path?.startsWith("components/") &&
				typeof route.title === "string",
		)
		.map((route) => ({ path: `/${route.path}`, title: route.title as string }))
		.sort((a, b) => a.title.localeCompare(b.title));
}
