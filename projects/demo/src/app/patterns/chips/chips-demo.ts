import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropBadge } from "interop/badge";
import { InteropCodeBlock } from "interop/code-block";
import { examples } from "./chips-examples";

@Component({
	selector: "demo-chips",
	host: { "itx-flow": "" },
	imports: [InteropBadge, InteropCodeBlock, RouterLink],
	templateUrl: "./chips-demo.html",
	styleUrl: "../patterns.css",
})
export class ChipsDemo {
	protected readonly examples = examples;
	protected readonly chipSizes = [
		{ value: "sm", label: "small" },
		{ value: null, label: "default" },
		{ value: "lg", label: "large" },
	];
	protected readonly sizes = ["XS", "S", "M", "L", "XL", "XXL"];
}
