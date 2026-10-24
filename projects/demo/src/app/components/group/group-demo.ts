import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropCodeBlock } from "interop/code-block";
import { InteropIcon } from "interop/icon";
import { examples } from "./group-examples";

@Component({
	selector: "demo-group",
	host: { "itx-flow": "" },
	imports: [InteropCodeBlock, InteropIcon, RouterLink],
	templateUrl: "./group-demo.html",
	styleUrl: "./group-demo.css",
})
export class GroupDemo {
	protected readonly examples = examples;
	protected readonly zoom = signal(100);

	protected zoomBy(step: number): void {
		this.zoom.update((zoom) => Math.min(200, Math.max(50, zoom + step)));
	}
}
