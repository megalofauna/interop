import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DemoExample } from "../../example/example";
import bare from "./examples/bare.html";
import filled from "./examples/filled.html";
import numbering from "./examples/numbering.html";
import outlined from "./examples/outlined.html";

@Component({
	selector: "demo-list",
	host: { "itx-flow": "" },
	imports: [DemoExample, RouterLink],
	templateUrl: "./list-demo.html",
})
export class ListDemo {
	protected readonly examples = { outlined, filled, numbering, bare };
}
