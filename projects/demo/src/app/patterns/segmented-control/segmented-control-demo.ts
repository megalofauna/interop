import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { bindRadioHomeEnd, bindSegmentedFit } from "interop";
import { InteropBadge } from "interop/badge";
import { InteropCodeBlock } from "interop/code-block";
import { DemoExample } from "../../example/example";
import basic from "./examples/basic.html";
import disabled from "./examples/disabled.html";
import homeEnd from "./examples/home-end.html";
import icons from "./examples/icons.html";
import looksCss from "./examples/looks.css";
import looks from "./examples/looks.html";
import nothing from "./examples/nothing.html";
import rtl from "./examples/rtl.html";
import sizes from "./examples/sizes.html";
import vertical from "./examples/vertical.html";
import { examples as snippets } from "./segmented-control-examples";

@Component({
	selector: "demo-segmented-control",
	host: { "itx-flow": "" },
	imports: [DemoExample, InteropBadge, InteropCodeBlock, RouterLink],
	templateUrl: "./segmented-control-demo.html",
	styleUrl: "../patterns.css",
})
export class SegmentedControlDemo {
	protected readonly examples = {
		...snippets,
		basic,
		vertical,
		looks,
		looksCss,
		sizes,
		icons,
		homeEnd,
		disabled,
		nothing,
		rtl,
	};
	protected readonly view = signal("grid");

	protected readonly bindView = (root: HTMLElement) => {
		const changed = (event: Event) =>
			this.view.set((event.target as HTMLInputElement).value);
		root.addEventListener("change", changed);
		return () => root.removeEventListener("change", changed);
	};

	protected readonly bindMonth = (root: HTMLElement) => {
		const month = root.querySelector<HTMLFieldSetElement>("#month")!;
		const unbindHomeEnd = bindRadioHomeEnd(month);
		const unbindFit = bindSegmentedFit(month);
		return () => {
			unbindHomeEnd();
			unbindFit();
		};
	};

	protected readonly homeEndTs = `import { bindRadioHomeEnd, bindSegmentedFit } from "interop";

const month = document.querySelector("#month");
// Home and End check the first and last enabled segment.
bindRadioHomeEnd(month);
// Stacked only when the row does not fit. Each returns a function that removes it.
bindSegmentedFit(month);
`;
}
