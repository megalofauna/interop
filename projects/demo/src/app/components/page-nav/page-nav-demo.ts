import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropCodeBlock } from "interop/code-block";
import { InteropPageNav } from "interop/page-nav";
import { InteropScrollArea } from "interop/scroll-area";
import { examples } from "./page-nav-examples";

@Component({
	selector: "demo-page-nav",
	imports: [InteropCodeBlock, InteropPageNav, InteropScrollArea, RouterLink],
	templateUrl: "./page-nav-demo.html",
	styleUrl: "./page-nav-demo.css",
})
export class PageNavDemo {
	protected readonly examples = examples;
	protected readonly sections = [
		{ id: "horizontal", label: "Horizontal" },
		{ id: "vertical", label: "Vertical" },
		{ id: "current", label: "The current section" },
		{ id: "screen-readers", label: "Screen readers" },
		{ id: "other-browsers", label: "Other browsers" },
		{ id: "angular", label: "In Angular" },
		{ id: "when-not", label: "When not to use it" },
	];
}
