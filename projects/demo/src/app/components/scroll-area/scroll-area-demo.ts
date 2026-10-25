import { Component } from "@angular/core";
import { bindScrollArea } from "interop";
import { each } from "../../example/bind-each";
import { DemoExample } from "../../example/example";
import controls from "./examples/controls.html";
import rtl from "./examples/rtl.html";
import stripCss from "./examples/strip.css";
import tableCss from "./examples/table.css";
import table from "./examples/table.html";
import textCss from "./examples/text.css";
import text from "./examples/text.html";

@Component({
	selector: "demo-scroll-area",
	host: { "itx-flow": "" },
	imports: [DemoExample],
	templateUrl: "./scroll-area-demo.html",
	styleUrl: "./scroll-area-demo.css",
})
export class ScrollAreaDemo {
	protected readonly examples = {
		text,
		textCss,
		controls,
		stripCss,
		table,
		tableCss,
		rtl,
	};
	protected readonly bind = each("[interop-scroll-area]", (area) =>
		bindScrollArea(area),
	);
	protected readonly ts = `import { bindScrollArea } from "interop";

// Returns a function that removes the behavior.
bindScrollArea(document.querySelector("[interop-scroll-area]"));
`;
}
