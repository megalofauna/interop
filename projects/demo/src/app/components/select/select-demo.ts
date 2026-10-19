import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropCodeBlock } from "interop/code-block";
import { examples } from "./select-examples";

@Component({
	selector: "demo-select",
	host: { "itx-flow": "" },
	imports: [InteropCodeBlock, RouterLink],
	templateUrl: "./select-demo.html",
	styleUrl: "./select-demo.css",
})
export class SelectDemo {
	protected readonly examples = examples;
	protected readonly theme = signal("system");
	protected readonly sizes = [
		{ value: "sm", label: "Small" },
		{ value: null, label: "Default" },
		{ value: "lg", label: "Large" },
	];
}
