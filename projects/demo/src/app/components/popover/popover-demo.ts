import { Component } from "@angular/core";
import { DemoExample } from "../../example/example";
import edge from "./examples/edge.html";
import long from "./examples/long.html";
import opened from "./examples/opened.html";
import placementCss from "./examples/placement.css";
import placement from "./examples/placement.html";

@Component({
	selector: "demo-popover",
	host: { "itx-flow": "" },
	imports: [DemoExample],
	templateUrl: "./popover-demo.html",
})
export class PopoverDemo {
	protected readonly examples = {
		opened,
		placement,
		placementCss,
		edge,
		long,
	};
}
