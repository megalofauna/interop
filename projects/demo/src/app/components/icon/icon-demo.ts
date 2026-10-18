import { Component } from "@angular/core";
import { InteropIcon } from "interop/icon";

@Component({
	selector: "demo-icon",
	host: { "itx-flow": "" },
	imports: [InteropIcon],
	templateUrl: "./icon-demo.html",
	styleUrl: "./icon-demo.css",
})
export class IconDemo {
	protected readonly names = [
		"tabler-check",
		"tabler-x",
		"tabler-plus",
		"tabler-minus",
		"tabler-chevron-down",
		"tabler-chevron-up",
		"tabler-chevron-left",
		"tabler-chevron-right",
		"tabler-copy",
		"tabler-search",
	];
	protected readonly steps = ["xs", "sm", "md", "lg", "xl"];
}
