import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DemoExample } from "../../example/example";
import manyOpen from "./examples/many-open.html";
import oneOpen from "./examples/one-open.html";

@Component({
	selector: "demo-accordion",
	host: { "itx-flow": "" },
	imports: [DemoExample, RouterLink],
	templateUrl: "./accordion-demo.html",
	styleUrl: "../patterns.css",
})
export class AccordionDemo {
	protected readonly examples = { oneOpen, manyOpen };
}
