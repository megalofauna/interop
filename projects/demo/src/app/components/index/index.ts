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
import { catalog } from "../catalog";

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

	/** Every component page, from the catalog, in its order. */
	protected readonly components = catalog;
}
