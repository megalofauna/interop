import { Component } from "@angular/core";
import { bindTooltips } from "interop";
import { DemoExample } from "../../example/example";
import describing from "./examples/describing.html";
import edge from "./examples/edge.html";
import naming from "./examples/naming.html";
import popover from "./examples/popover.html";
import timingCss from "./examples/timing.css";
import timing from "./examples/timing.html";

@Component({
	selector: "demo-tooltip",
	host: { "itx-flow": "" },
	imports: [DemoExample],
	templateUrl: "./tooltip-demo.html",
})
export class TooltipDemo {
	protected readonly examples = {
		naming,
		describing,
		edge,
		popover,
		timing,
		timingCss,
	};

	/** The app calls bindTooltips() once; each example calls it too, as a page on its own would. */
	protected readonly bind = () => bindTooltips();

	protected readonly ts = `import { bindTooltips } from "interop";

// Once, for the whole document. Returns a function that removes it.
bindTooltips();
`;
}
