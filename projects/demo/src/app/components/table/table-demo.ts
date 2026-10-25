import { Component } from "@angular/core";
import { bindScrollArea } from "interop";
import { each } from "../../example/bind-each";
import { DemoExample } from "../../example/example";
import data from "./examples/data.html";
import empty from "./examples/empty.html";
import reference from "./examples/reference.html";
import sizes from "./examples/sizes.html";
import stackedCss from "./examples/stacked.css";
import stacked from "./examples/stacked.html";

@Component({
	selector: "demo-table",
	host: { "itx-flow": "" },
	imports: [DemoExample],
	templateUrl: "./table-demo.html",
})
export class TableDemo {
	protected readonly examples = {
		reference,
		data,
		empty,
		sizes,
		stacked,
		stackedCss,
	};
	protected readonly bind = each("[interop-scroll-area]", (area) =>
		bindScrollArea(area),
	);
}
