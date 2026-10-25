import { Component } from "@angular/core";
import { bindTooltip } from "interop";
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

	/** Binds each tooltip in an example to the trigger that points at it. */
	protected readonly bind = (root: HTMLElement) => {
		const unbinds = Array.from(
			root.querySelectorAll<HTMLElement>("[interop-tooltip][id]"),
		).flatMap((tooltip) => {
			const trigger = root.querySelector<HTMLElement>(
				`[aria-labelledby~="${tooltip.id}"], [aria-describedby~="${tooltip.id}"]`,
			);
			return trigger ? [bindTooltip(trigger, tooltip)] : [];
		});
		return () => unbinds.forEach((unbind) => unbind());
	};

	protected readonly ts = `import { bindTooltip } from "interop";

// Returns a function that removes the behavior.
bindTooltip(document.querySelector('[aria-labelledby="tip-copy"]'), document.getElementById("tip-copy"));
`;
}
