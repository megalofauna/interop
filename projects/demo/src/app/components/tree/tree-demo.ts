import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropCodeBlock } from "interop/code-block";
import { examples } from "./tree-examples";

@Component({
	selector: "demo-tree",
	imports: [InteropCodeBlock, RouterLink],
	templateUrl: "./tree-demo.html",
	styleUrl: "./tree-demo.css",
})
export class TreeDemo {
	protected readonly examples = examples;
}
