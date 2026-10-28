import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DemoExample } from "../../example/example";
import basic from "./examples/basic.html";
import open from "./examples/open.html";
import row from "./examples/row.html";

@Component({
	selector: "demo-disclosure",
	host: { "itx-flow": "" },
	imports: [DemoExample, RouterLink],
	templateUrl: "./disclosure-demo.html",
	styleUrl: "./disclosure-demo.css",
})
export class DisclosureDemo {
	protected readonly examples = { basic, open, row };
}
