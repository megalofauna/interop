import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DemoExample } from "../../example/example";
import choice from "./examples/choice.html";
import filter from "./examples/filter.html";
import sizes from "./examples/sizes.html";

@Component({
	selector: "demo-chips",
	host: { "itx-flow": "" },
	imports: [DemoExample, RouterLink],
	templateUrl: "./chips-demo.html",
})
export class ChipsDemo {
	protected readonly examples = { filter, sizes, choice };
}
